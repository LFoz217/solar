import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/server'
import PublishToggle from './PublishToggle'

export const dynamic = 'force-dynamic'

export default async function ManageEventPage({ params }: { params: Promise<{ id: string }> }) {
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
    .select('*, tickets(id, is_scanned)')
    .eq('event_id', id)
    .eq('status', 'paid')
    .order('created_at', { ascending: false })

  const { count: totalTickets } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', id)

  const { count: scannedTickets } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', id)
    .eq('is_scanned', true)

  const sold = totalTickets ?? 0
  const revenue = sold * event.ticket_price

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center gap-4 mb-2">
          <Link href="/dashboard" className="text-white/40 hover:text-white/70 text-sm transition-colors">
            ← Dashboard
          </Link>
        </div>

        <div className="flex items-start justify-between mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{event.title}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                event.is_published
                  ? 'bg-green-400/10 text-green-400 border border-green-400/20'
                  : 'bg-white/10 text-white/40 border border-white/10'
              }`}>
                {event.is_published ? 'Published' : 'Draft'}
              </span>
            </div>
            <p className="text-white/50">{event.venue} · {new Date(event.date).toLocaleDateString('en-GB', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
            })}</p>
          </div>
          <div className="flex items-center gap-3">
            <PublishToggle eventId={event.id} isPublished={event.is_published} />
            <Link
              href={`/events/${event.id}/scan`}
              className="bg-white text-black px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-white/90 transition-colors"
            >
              📱 Scan tickets
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Tickets sold', value: `${sold}/${event.capacity}` },
            { label: 'Revenue', value: `£${(revenue / 100).toFixed(2)}` },
            { label: 'Scanned', value: `${scannedTickets ?? 0}/${sold}` },
            { label: 'Price', value: event.ticket_price === 0 ? 'Free' : `£${(event.ticket_price / 100).toFixed(2)}` },
          ].map((stat) => (
            <div key={stat.label} className="p-5 border border-white/10 rounded-xl bg-white/5">
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="text-white/40 text-xs uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Event URL */}
        {event.is_published && (
          <div className="mb-8 p-4 border border-white/10 rounded-xl bg-white/5 flex items-center justify-between">
            <div>
              <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Public event URL</div>
              <div className="text-white/70 text-sm font-mono">
                {process.env.NEXT_PUBLIC_APP_URL}/events/{event.id}
              </div>
            </div>
            <Link
              href={`/events/${event.id}`}
              target="_blank"
              className="text-sm text-white/50 hover:text-white transition-colors"
            >
              View →
            </Link>
          </div>
        )}

        {/* Orders */}
        <h2 className="text-xl font-semibold mb-4">Orders</h2>
        {orders && orders.length > 0 ? (
          <div className="space-y-2">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 border border-white/10 rounded-xl bg-white/5"
              >
                <div>
                  <div className="font-medium">{order.customer_name}</div>
                  <div className="text-white/40 text-sm">{order.customer_email}</div>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <div className="text-sm font-medium">
                      {order.quantity} ticket{order.quantity > 1 ? 's' : ''}
                    </div>
                    <div className="text-white/40 text-xs">
                      £{(order.total_amount / 100).toFixed(2)} · {new Date(order.created_at).toLocaleDateString('en-GB')}
                    </div>
                  </div>
                  <div>
                    {(() => {
                      const tickets = order.tickets as { id: string; is_scanned: boolean }[]
                      const scanned = tickets.filter((t) => t.is_scanned).length
                      const total = tickets.length
                      return (
                        <div className={`text-sm font-medium ${scanned === total && total > 0 ? 'text-white/40' : scanned > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                          {scanned}/{total}
                        </div>
                      )
                    })()}
                    <div className="text-white/30 text-xs">scanned</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-white/10 rounded-xl text-white/40">
            No orders yet
          </div>
        )}
      </main>
    </>
  )
}
