import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatPrice(pence: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(
    pence / 100
  )
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .eq('organiser_id', user.id)
    .single()

  if (!event) notFound()

  // Get orders with ticket counts
  const { data: orders } = await supabase
    .from('orders')
    .select('*, tickets(*)')
    .eq('event_id', id)
    .eq('status', 'paid')
    .order('created_at', { ascending: false })

  const totalSold = (orders ?? []).reduce((sum, o) => sum + o.quantity, 0)
  const totalRevenue = (orders ?? []).reduce((sum, o) => sum + o.total_amount, 0)
  const totalScanned = (orders ?? []).reduce(
    (sum, o) => sum + (o.tickets as { is_scanned: boolean }[]).filter((t) => t.is_scanned).length,
    0
  )

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <Link
              href="/dashboard"
              className="text-zinc-500 hover:text-white transition-colors text-sm mb-3 block"
            >
              ← Dashboard
            </Link>
            <h1 className="text-2xl font-bold">{event.title}</h1>
            <p className="text-sm text-zinc-500 mt-1">
              {formatDate(event.date)} · {event.venue}
            </p>
          </div>
          <Link
            href={`/dashboard/events/${event.id}/scan`}
            className="shrink-0 bg-amber-500 text-black font-semibold px-5 py-2.5 rounded-lg text-sm hover:bg-amber-400 transition-colors"
          >
            Scan tickets
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Tickets sold', value: `${totalSold} / ${event.capacity}` },
            { label: 'Revenue', value: formatPrice(totalRevenue) },
            { label: 'Scanned in', value: `${totalScanned} / ${totalSold}` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-500 mb-1">{label}</p>
              <p className="text-xl font-semibold">{value}</p>
            </div>
          ))}
        </div>

        {/* Public event link */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-zinc-500 mb-1">Public event link</p>
            <p className="text-sm font-mono text-zinc-300 truncate">
              {process.env.NEXT_PUBLIC_APP_URL}/events/{event.id}
            </p>
          </div>
          <Link
            href={`/events/${event.id}`}
            target="_blank"
            className="shrink-0 text-xs border border-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg hover:border-zinc-500 transition-colors"
          >
            View page →
          </Link>
        </div>

        {/* Orders table */}
        <h2 className="text-lg font-semibold mb-4">Orders</h2>
        {!orders || orders.length === 0 ? (
          <div className="text-center py-12 border border-zinc-800 rounded-2xl">
            <p className="text-zinc-500 text-sm">No orders yet.</p>
          </div>
        ) : (
          <div className="border border-zinc-800 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left text-xs text-zinc-500 font-medium px-4 py-3">
                    Customer
                  </th>
                  <th className="text-left text-xs text-zinc-500 font-medium px-4 py-3 hidden sm:table-cell">
                    Email
                  </th>
                  <th className="text-center text-xs text-zinc-500 font-medium px-4 py-3">
                    Qty
                  </th>
                  <th className="text-center text-xs text-zinc-500 font-medium px-4 py-3">
                    Scanned
                  </th>
                  <th className="text-right text-xs text-zinc-500 font-medium px-4 py-3">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const tickets = order.tickets as { is_scanned: boolean }[]
                  const scannedCount = tickets.filter((t) => t.is_scanned).length
                  return (
                    <tr key={order.id} className="border-b border-zinc-800 last:border-0">
                      <td className="px-4 py-3 text-zinc-200">{order.customer_name}</td>
                      <td className="px-4 py-3 text-zinc-400 hidden sm:table-cell">
                        {order.customer_email}
                      </td>
                      <td className="px-4 py-3 text-center text-zinc-300">
                        {order.quantity}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            scannedCount === order.quantity
                              ? 'bg-zinc-800 text-zinc-500'
                              : scannedCount > 0
                              ? 'bg-amber-950 text-amber-400'
                              : 'bg-emerald-950 text-emerald-400'
                          }`}
                        >
                          {scannedCount}/{order.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-900 px-2 py-0.5 rounded-full">
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
