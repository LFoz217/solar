import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatPrice(pence: number) {
  if (pence === 0) return 'Free'
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pence / 100)
}

export const revalidate = 60 // re-fetch every 60 s

export default async function HomePage() {
  const supabase = await createClient()

  const { data: events } = await supabase
    .from('events')
    .select('id, title, description, venue, date, ticket_price, capacity')
    .eq('is_published', true)
    .gte('date', new Date().toISOString()) // only upcoming events
    .order('date', { ascending: true })

  const upcomingEvents = events ?? []

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto border-b border-zinc-900">
        <Link href="/" className="text-xl font-bold tracking-tight">
          ☀️ Solar
        </Link>
        <div className="flex items-center gap-5">
          <Link
            href="/sell"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Sell tickets →
          </Link>
          <Link
            href="/login"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Organiser login
          </Link>
        </div>
      </nav>

      {/* Header */}
      <section className="max-w-6xl mx-auto px-6 pt-12 pb-8">
        <h1 className="text-3xl font-bold">Upcoming events</h1>
        <p className="mt-2 text-zinc-400 text-sm">
          Browse and buy tickets — no account needed.
        </p>
      </section>

      {/* Events grid */}
      <main className="max-w-6xl mx-auto px-6 pb-20">
        {upcomingEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-4xl mb-4">🎟</div>
            <p className="text-zinc-400 text-sm">No upcoming events yet.</p>
            <Link
              href="/sell"
              className="mt-4 text-sm text-amber-400 hover:text-amber-300 transition-colors"
            >
              Are you an organiser? List your event →
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {upcomingEvents.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="group bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-600 transition-colors flex flex-col gap-3"
              >
                {/* Title */}
                <h2 className="font-semibold text-white group-hover:text-amber-400 transition-colors leading-snug">
                  {event.title}
                </h2>

                {/* Meta */}
                <div className="space-y-1.5 text-xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    <span>📅</span>
                    <span>{formatDate(event.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📍</span>
                    <span className="truncate">{event.venue}</span>
                  </div>
                </div>

                {/* Description */}
                {event.description && (
                  <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>
                )}

                {/* Footer */}
                <div className="mt-auto flex items-center justify-between pt-3 border-t border-zinc-800">
                  <span className="text-sm font-semibold text-white">
                    {formatPrice(event.ticket_price)}
                  </span>
                  <span className="text-xs text-zinc-500 group-hover:text-amber-400 transition-colors">
                    Get tickets →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 px-6 py-6 text-center text-xs text-zinc-600">
        <span>Powered by </span>
        <Link href="/sell" className="hover:text-zinc-400 transition-colors">
          Solar
        </Link>
        {' — '}no platform fees.
      </footer>
    </div>
  )
}
