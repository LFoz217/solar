import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function fmt(pence: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pence / 100)
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function StatBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="px-5 py-4 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', borderRadius: '4px' }}>
      <div className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{value}</div>
      {sub && <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('organiser_id', user.id)
    .order('date', { ascending: true })

  const eventIds = (events ?? []).map((e) => e.id)

  const { data: allOrders } = await supabase
    .from('orders')
    .select('event_id, quantity, total_amount, created_at, customer_name, customer_email, status')
    .in('event_id', eventIds.length > 0 ? eventIds : ['none'])
    .eq('status', 'paid')
    .order('created_at', { ascending: false })

  const totalRevenue = (allOrders ?? []).reduce((s, o) => s + o.total_amount, 0)
  const totalSold = (allOrders ?? []).reduce((s, o) => s + o.quantity, 0)
  const totalCapacity = (events ?? []).reduce((s, e) => s + e.capacity, 0)

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthRevenue = (allOrders ?? [])
    .filter((o) => new Date(o.created_at) >= monthStart)
    .reduce((s, o) => s + o.total_amount, 0)

  const statsByEvent: Record<string, { sold: number; revenue: number }> = {}
  for (const o of allOrders ?? []) {
    if (!statsByEvent[o.event_id]) statsByEvent[o.event_id] = { sold: 0, revenue: 0 }
    statsByEvent[o.event_id].sold += o.quantity
    statsByEvent[o.event_id].revenue += o.total_amount
  }

  const upcomingEvents = (events ?? []).filter((e) => new Date(e.date) >= now)
  const recentOrders = (allOrders ?? []).slice(0, 6)

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Overview</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
        </div>
        <Link href="/dashboard/events/new"
          className="text-sm font-semibold px-4 py-2 transition-colors"
          style={{ background: 'var(--accent)', color: '#fff', borderRadius: '4px' }}>
          + Create event
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatBox label="Total revenue" value={fmt(totalRevenue)} />
        <StatBox label="This month" value={fmt(monthRevenue)} />
        <StatBox label="Tickets sold" value={String(totalSold)} sub={`of ${totalCapacity} capacity`} />
        <StatBox label="Events" value={String(events?.length ?? 0)} sub={`${upcomingEvents.length} upcoming`} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Upcoming events</h2>
            <Link href="/dashboard/events" className="text-xs" style={{ color: 'var(--accent)' }}>View all →</Link>
          </div>
          <div className="border divide-y" style={{ borderColor: 'var(--border)', borderRadius: '4px' }}>
            {upcomingEvents.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                No upcoming events. <Link href="/dashboard/events/new" style={{ color: 'var(--accent)' }}>Create one →</Link>
              </div>
            ) : (
              upcomingEvents.slice(0, 5).map((event) => {
                const stats = statsByEvent[event.id] ?? { sold: 0, revenue: 0 }
                const pct = event.capacity > 0 ? Math.round((stats.sold / event.capacity) * 100) : 0
                return (
                  <Link key={event.id} href={`/dashboard/events/${event.id}`}
                    className="flex items-center justify-between px-4 py-3 transition-colors hover:opacity-80"
                    style={{ background: 'var(--bg-surface)', color: 'inherit' }}>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{event.title}</span>
                        {!event.is_published && (
                          <span className="text-xs px-1.5 py-0.5 shrink-0"
                            style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', borderRadius: '3px' }}>Draft</span>
                        )}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{fmtDate(event.date)}</div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{stats.sold}/{event.capacity}</div>
                      <div className="text-xs" style={{ color: pct >= 80 ? 'var(--accent)' : 'var(--text-muted)' }}>{pct}%</div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Recent orders</h2>
            <Link href="/dashboard/orders" className="text-xs" style={{ color: 'var(--accent)' }}>View all →</Link>
          </div>
          <div className="border divide-y" style={{ borderColor: 'var(--border)', borderRadius: '4px' }}>
            {recentOrders.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No orders yet.</div>
            ) : (
              recentOrders.map((order, i) => {
                const event = (events ?? []).find((e) => e.id === order.event_id)
                return (
                  <div key={i} className="flex items-center justify-between px-4 py-3" style={{ background: 'var(--bg-surface)' }}>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{order.customer_name}</div>
                      <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{event?.title ?? '(unknown)'}, {order.quantity}x</div>
                    </div>
                    <div className="shrink-0 ml-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{fmt(order.total_amount)}</div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t flex flex-wrap gap-3" style={{ borderColor: 'var(--border)' }}>
        {[
          { href: '/dashboard/events/new', label: '+ New event' },
          { href: '/dashboard/scan', label: 'Scan tickets' },
          { href: '/dashboard/discounts', label: 'Discount codes' },
          { href: '/dashboard/payouts', label: 'Payouts' },
        ].map(({ href, label }) => (
          <Link key={href} href={href}
            className="text-xs px-3 py-2 border transition-colors hover:opacity-80"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', borderRadius: '4px' }}>
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}
