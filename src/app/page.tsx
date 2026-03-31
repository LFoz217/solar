import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import GenerativeBackground from '@/components/GenerativeBackground'

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
    <div className="min-h-screen bg-zinc-950 text-white font-mono relative">
      <GenerativeBackground />
      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto border-b-2 border-zinc-800">
        <Link href="/" className="text-xl font-bold uppercase tracking-widest">
          ☀️ SOLAR
        </Link>
        <div className="flex items-center gap-5">
          <Link
            href="/sell"
            className="text-sm uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
          >
            Sell tickets →
          </Link>
          <Link
            href="/login"
            className="text-sm uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
          >
            Promoter login
          </Link>
        </div>
      </nav>

      {/* Header */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-12 pb-8">
        <h1 className="text-3xl font-bold uppercase tracking-widest">What&apos;s on</h1>
        <p className="mt-2 text-zinc-400 text-sm">
          Grab tickets — no sign-up needed.
        </p>
      </section>

      {/* Events grid */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pb-20">
        {upcomingEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center grain relative">
            <div className="text-4xl mb-4">🎟</div>
            <p className="text-zinc-400 text-sm uppercase tracking-wider">Nothing listed yet.</p>
            <Link
              href="/sell"
              className="mt-4 text-sm text-amber-400 hover:text-amber-300 transition-colors uppercase tracking-wider"
            >
              Promoter? List your night →
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {upcomingEvents.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="group bg-zinc-900 border-2 border-zinc-700 rounded-none p-5 hover:border-white transition-colors flex flex-col gap-3 grain relative"
              >
                {/* Title */}
                <h2 className="font-bold text-white group-hover:text-amber-400 transition-colors leading-snug uppercase tracking-wider">
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
                <div className="mt-auto flex items-center justify-between pt-3 border-t-2 border-zinc-700">
                  <span className="text-sm font-bold text-white">
                    {formatPrice(event.ticket_price)}
                  </span>
                  <span className="text-xs text-zinc-500 group-hover:text-amber-400 transition-colors uppercase tracking-wider">
                    Get tickets →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t-2 border-zinc-800 px-6 py-6 text-center text-xs text-zinc-600 uppercase tracking-widest">
        <span>Powered by </span>
        <Link href="/sell" className="hover:text-zinc-400 transition-colors">
          Solar
        </Link>
        {' — '}ticketing for the underground.
      </footer>
    </div>
  )
}
