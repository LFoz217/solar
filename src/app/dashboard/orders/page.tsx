import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function fmt(pence: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pence / 100)
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; event?: string; status?: string }>
}) {
  const { search = '', event: eventFilter = '', status = 'all' } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myEvents } = await supabase
    .from('events')
    .select('id, title')
    .eq('organiser_id', user.id)

  const eventIds = (myEvents ?? []).map((e) => e.id)

  let query = supabase
    .from('orders')
    .select('*, tickets(id, is_scanned)')
    .in('event_id', eventIds.length > 0 ? eventIds : ['none'])
    .order('created_at', { ascending: false })
    .limit(100)

  if (status !== 'all') query = query.eq('status', status)
  if (eventFilter) query = query.eq('event_id', eventFilter)

  const { data: orders } = await query

  const filtered = search
    ? (orders ?? []).filter(
        (o) =>
          o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
          o.customer_email.toLowerCase().includes(search.toLowerCase()) ||
          o.id.toLowerCase().includes(search.toLowerCase())
      )
    : orders ?? []

  const totalRevenue = filtered.reduce((s, o) => s + (o.status === 'paid' ? o.total_amount : 0), 0)

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Orders</h1>
        <div className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
          {filtered.length} orders · {fmt(totalRevenue)} total
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <form method="GET" className="flex-1 min-w-48">
          <input
            name="search"
            defaultValue={search}
            placeholder="Search name, email, order ID…"
            className="w-full px-3 py-2 text-sm border outline-none"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
              borderRadius: '4px',
            }}
          />
        </form>
        <select
          name="event"
          defaultValue={eventFilter}
          className="px-3 py-2 text-sm border outline-none"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)', borderRadius: '4px' }}>
          <option value="">All events</option>
          {(myEvents ?? []).map((e) => (
            <option key={e.id} value={e.id}>{e.title}</option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={status}
          className="px-3 py-2 text-sm border outline-none"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)', borderRadius: '4px' }}>
          <option value="all">All statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      <div className="border" style={{ borderColor: 'var(--border)', borderRadius: '4px' }}>
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No orders found.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                {['Order', 'Customer', 'Event', 'Qty', 'Amount', 'Status', 'Date', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium"
                    style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => {
                const event = (myEvents ?? []).find((e) => e.id === order.event_id)
                const tickets = order.tickets as { id: string; is_scanned: boolean }[]
                const scanned = tickets?.filter((t) => t.is_scanned).length ?? 0
                const statusColor =
                  order.status === 'paid' ? 'var(--accent)'
                  : order.status === 'refunded' ? 'var(--danger)'
                  : 'var(--text-muted)'
                return (
                  <tr key={order.id} className="border-b last:border-0"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                      {order.id.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{order.customer_name}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{order.customer_email}</div>
                    </td>
                    <td className="px-4 py-3 max-w-36 truncate" style={{ color: 'var(--text-secondary)' }}>
                      {event?.title ?? '(unknown event)'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                      {order.quantity}
                      {tickets && (
                        <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>({scanned} in)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                      {fmt(order.total_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1"
                        style={{ background: `${statusColor}20`, color: statusColor, borderRadius: '3px' }}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {fmtDate(order.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      {order.status === 'paid' && (
                        <form action="/api/orders/refund" method="POST">
                          <input type="hidden" name="orderId" value={order.id} />
                          <button type="submit"
                            className="text-xs px-2 py-1 border transition-colors hover:opacity-80"
                            style={{ borderColor: 'var(--border)', color: 'var(--danger)', borderRadius: '3px' }}>
                            Refund
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
