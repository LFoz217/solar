import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatPrice(pence: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(
    pence / 100
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch events with ticket/order stats
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('organiser_id', user.id)
    .order('date', { ascending: true })

  // For each event, get sold count and revenue
  const eventIds = (events ?? []).map((e) => e.id)

  const { data: orderStats } = await supabase
    .from('orders')
    .select('event_id, quantity, total_amount')
    .in('event_id', eventIds.length > 0 ? eventIds : ['none'])
    .eq('status', 'paid')

  const statsByEvent: Record<string, { sold: number; revenue: number }> = {}
  for (const order of orderStats ?? []) {
    if (!statsByEvent[order.event_id]) {
      statsByEvent[order.event_id] = { sold: 0, revenue: 0 }
    }
    statsByEvent[order.event_id].sold += order.quantity
    statsByEvent[order.event_id].revenue += order.total_amount
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-zinc-500 mt-0.5">{user.email}</p>
          </div>
          <Link
            href="/dashboard/events/new"
            className="bg-white text-black font-semibold px-5 py-2.5 rounded-lg text-sm hover:bg-zinc-100 transition-colors"
          >
            + Create event
          </Link>
        </div>

        {/* Events list */}
        {!events || events.length === 0 ? (
          <div className="text-center py-20 border border-zinc-800 rounded-2xl">
            <p className="text-zinc-500 mb-4">No events yet.</p>
            <Link
              href="/dashboard/events/new"
              className="text-sm text-white underline underline-offset-4"
            >
              Create your first event →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => {
              const stats = statsByEvent[event.id] ?? { sold: 0, revenue: 0 }
              return (
                <Link
                  key={event.id}
                  href={`/dashboard/events/${event.id}`}
                  className="block bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-600 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="font-semibold truncate">{event.title}</h2>
                        <span
                          className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${
                            event.is_published
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                              : 'bg-zinc-800 text-zinc-500'
                          }`}
                        >
                          {event.is_published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-500">
                        {formatDate(event.date)} · {event.venue}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-sm">
                        {stats.sold} / {event.capacity}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {formatPrice(stats.revenue)}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
