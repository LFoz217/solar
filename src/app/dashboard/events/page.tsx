import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function fmt(pence: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pence / 100)
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const { filter = 'upcoming' } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('organiser_id', user.id)
    .order('date', { ascending: filter !== 'past' })

  const now = new Date()
  const filtered = (events ?? []).filter((e) => {
    if (filter === 'upcoming') return new Date(e.date) >= now
    if (filter === 'past') return new Date(e.date) < now
    if (filter === 'draft') return !e.is_published
    return true
  })

  const eventIds = filtered.map((e) => e.id)
  const { data: orderStats } = await supabase
    .from('orders')
    .select('event_id, quantity, total_amount')
    .in('event_id', eventIds.length > 0 ? eventIds : ['none'])
    .eq('status', 'paid')

  const statsByEvent: Record<string, { sold: number; revenue: number }> = {}
  for (const o of orderStats ?? []) {
    if (!statsByEvent[o.event_id]) statsByEvent[o.event_id] = { sold: 0, revenue: 0 }
    statsByEvent[o.event_id].sold += o.quantity
    statsByEvent[o.event_id].revenue += o.total_amount
  }

  const tabs = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past', label: 'Past' },
    { key: 'draft', label: 'Drafts' },
    { key: 'all', label: 'All' },
  ]

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Events</h1>
        <Link href="/dashboard/events/new"
          className="text-sm font-semibold px-4 py-2"
          style={{ background: 'var(--accent)', color: '#fff', borderRadius: '4px' }}>
          + Create event
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 border-b" style={{ borderColor: 'var(--border)' }}>
        {tabs.map((t) => (
          <Link key={t.key} href={`/dashboard/events?filter=${t.key}`}
            className="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors"
            style={{
              borderColor: filter === t.key ? 'var(--accent)' : 'transparent',
              color: filter === t.key ? 'var(--accent)' : 'var(--text-secondary)',
            }}>
            {t.label}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center border" style={{ borderColor: 'var(--border)', borderRadius: '4px' }}>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No {filter} events.</p>
          <Link href="/dashboard/events/new" className="text-sm mt-2 inline-block" style={{ color: 'var(--accent)' }}>
            Create your first event →
          </Link>
        </div>
      ) : (
        <div className="border" style={{ borderColor: 'var(--border)', borderRadius: '4px' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                {['Event', 'Date', 'Venue', 'Sold / Cap', 'Revenue', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium"
                    style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((event) => {
                const stats = statsByEvent[event.id] ?? { sold: 0, revenue: 0 }
                const pct = event.capacity > 0 ? Math.round((stats.sold / event.capacity) * 100) : 0
                const isPast = new Date(event.date) < now
                return (
                  <tr key={event.id} className="border-b last:border-0 hover:opacity-80 transition-colors"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                      <Link href={`/dashboard/events/${event.id}`} className="hover:underline">
                        {event.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{fmtDate(event.date)}</td>
                    <td className="px-4 py-3 max-w-32 truncate" style={{ color: 'var(--text-secondary)' }}>{event.venue}</td>
                    <td className="px-4 py-3">
                      <div style={{ color: 'var(--text-primary)' }}>{stats.sold}/{event.capacity}</div>
                      <div className="text-xs" style={{ color: pct >= 80 ? 'var(--accent)' : 'var(--text-muted)' }}>{pct}%</div>
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{fmt(stats.revenue)}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1"
                        style={{
                          background: event.is_published
                            ? (isPast ? 'var(--bg-elevated)' : 'rgba(249,115,22,0.12)')
                            : 'var(--bg-elevated)',
                          color: event.is_published
                            ? (isPast ? 'var(--text-muted)' : 'var(--accent)')
                            : 'var(--text-muted)',
                          borderRadius: '3px',
                        }}>
                        {!event.is_published ? 'Draft' : isPast ? 'Ended' : 'Live'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link href={`/dashboard/events/${event.id}`}
                          className="text-xs px-2 py-1 border transition-colors hover:opacity-80"
                          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', borderRadius: '3px' }}>
                          Analytics
                        </Link>
                        <Link href={`/events/${event.id}`} target="_blank"
                          className="text-xs px-2 py-1 border transition-colors hover:opacity-80"
                          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', borderRadius: '3px' }}>
                          View
                        </Link>
                      </div>
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
