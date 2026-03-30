import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function fmt(pence: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pence / 100)
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function fmtShort(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .eq('organiser_id', user.id)
    .single()

  if (!event) notFound()

  const { data: orders } = await supabase
    .from('orders')
    .select('*, tickets(*)')
    .eq('event_id', id)
    .eq('status', 'paid')
    .order('created_at', { ascending: false })

  const { data: waitlist } = await supabase
    .from('waitlist')
    .select('id')
    .eq('event_id', id)

  const totalSold = (orders ?? []).reduce((s, o) => s + o.quantity, 0)
  const totalRevenue = (orders ?? []).reduce((s, o) => s + o.total_amount, 0)
  const totalScanned = (orders ?? []).reduce(
    (s, o) => s + (o.tickets as { is_scanned: boolean }[]).filter((t) => t.is_scanned).length, 0
  )
  const solarFee = (orders ?? []).reduce((s, o) => s + Math.round(o.total_amount * 0.05) + 49 * o.quantity, 0)
  const netRevenue = totalRevenue - solarFee
  const pct = event.capacity > 0 ? Math.round((totalSold / event.capacity) * 100) : 0

  // Daily sales (last 14 days)
  const salesByDay: Record<string, number> = {}
  for (const o of orders ?? []) {
    const day = o.created_at.split('T')[0]
    salesByDay[day] = (salesByDay[day] ?? 0) + o.quantity
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <Link href="/dashboard/events" className="text-xs mb-2 inline-block" style={{ color: 'var(--text-muted)' }}>
            ← Events
          </Link>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{event.title}</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {fmtDate(event.date)} · {event.venue}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href={`/dashboard/events/${event.id}/scan`}
            className="text-sm font-semibold px-4 py-2"
            style={{ background: 'var(--accent)', color: '#fff', borderRadius: '4px' }}>
            Scan tickets
          </Link>
          <Link href={`/events/${event.id}`} target="_blank"
            className="text-sm px-4 py-2 border"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', borderRadius: '4px' }}>
            View page
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Sold', value: `${totalSold}`, sub: `of ${event.capacity} (${pct}%)` },
          { label: 'Gross revenue', value: fmt(totalRevenue) },
          { label: 'Solar fees', value: fmt(solarFee), sub: '5% + 49p/ticket' },
          { label: 'Net to you', value: fmt(netRevenue) },
          { label: 'Checked in', value: `${totalScanned}/${totalSold}` },
        ].map(({ label, value, sub }) => (
          <div key={label} className="px-4 py-3 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', borderRadius: '4px' }}>
            <div className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</div>
            {sub && <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</div>}
          </div>
        ))}
      </div>

      {/* Capacity bar */}
      <div className="mb-6 px-4 py-3 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', borderRadius: '4px' }}>
        <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
          <span>Capacity: {totalSold}/{event.capacity}</span>
          <span>{pct}% sold{(waitlist?.length ?? 0) > 0 && ` · ${waitlist?.length} on waitlist`}</span>
        </div>
        <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
          <div className="h-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: 'var(--accent)', borderRadius: '2px' }} />
        </div>
      </div>

      {/* Event link */}
      <div className="mb-6 px-4 py-3 border flex items-center justify-between gap-4"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', borderRadius: '4px' }}>
        <div>
          <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Public event link</div>
          <div className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
            {process.env.NEXT_PUBLIC_APP_URL}/events/{event.id}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href={`/dashboard/marketing?event=${event.id}`}
            className="text-xs px-3 py-1.5 border"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', borderRadius: '3px' }}>
            UTM links
          </Link>
          <Link href={`/dashboard/guestlist?event=${event.id}`}
            className="text-xs px-3 py-1.5 border"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', borderRadius: '3px' }}>
            Guest list
          </Link>
        </div>
      </div>

      {/* Orders table */}
      <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
        Attendees ({orders?.length ?? 0})
      </h2>
      {!orders || orders.length === 0 ? (
        <div className="py-12 text-center border" style={{ borderColor: 'var(--border)', borderRadius: '4px' }}>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No orders yet.</p>
        </div>
      ) : (
        <div className="border" style={{ borderColor: 'var(--border)', borderRadius: '4px' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                {['Name', 'Email', 'Qty', 'Amount', 'Checked in', 'Date', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium"
                    style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const tickets = order.tickets as { is_scanned: boolean }[]
                const scanned = tickets.filter((t) => t.is_scanned).length
                const allScanned = scanned === order.quantity
                return (
                  <tr key={order.id} className="border-b last:border-0"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{order.customer_name}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{order.customer_email}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{order.quantity}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{fmt(order.total_amount)}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1"
                        style={{
                          background: allScanned ? 'var(--bg-elevated)' : scanned > 0 ? 'rgba(234,179,8,0.1)' : 'rgba(249,115,22,0.1)',
                          color: allScanned ? 'var(--text-muted)' : scanned > 0 ? '#eab308' : 'var(--accent)',
                          borderRadius: '3px',
                        }}>
                        {scanned}/{order.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{fmtShort(order.created_at)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/orders?search=${order.customer_email}`}
                        className="text-xs hover:underline" style={{ color: 'var(--text-muted)' }}>
                        Order →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
