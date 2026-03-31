'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Event, TicketType } from '@/types'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatPrice(pence: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pence / 100)
}

export default function EventPage() {
  const params = useParams()
  const [event, setEvent] = useState<Event | null>(null)
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([])
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchEvent() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', params.id)
        .eq('is_published', true)
        .single()

      if (error || !data) {
        setNotFound(true)
        return
      }
      setEvent(data)

      // Fetch ticket types
      const { data: types } = await supabase
        .from('ticket_types')
        .select('*')
        .eq('event_id', data.id)
        .order('sort_order', { ascending: true })

      if (types && types.length > 0) {
        setTicketTypes(types)
        // Auto-select cheapest available type
        const available = types.filter((t) => {
          const now = new Date()
          const onSale = (!t.sale_starts || new Date(t.sale_starts) <= now) &&
                         (!t.sale_ends || new Date(t.sale_ends) > now)
          return onSale && t.quantity - t.sold > 0
        })
        if (available.length > 0) {
          setSelectedType(available[0].id)
        }
      }
    }
    fetchEvent()
  }, [params.id])

  const selectedTicketType = ticketTypes.find((t) => t.id === selectedType)
  const currentPrice = selectedTicketType ? selectedTicketType.price : event?.ticket_price ?? 0

  function getTypeStatus(tt: TicketType): 'available' | 'sold_out' | 'not_on_sale' | 'ended' {
    const now = new Date()
    if (tt.sale_starts && new Date(tt.sale_starts) > now) return 'not_on_sale'
    if (tt.sale_ends && new Date(tt.sale_ends) < now) return 'ended'
    if (tt.quantity - tt.sold <= 0) return 'sold_out'
    return 'available'
  }

  async function handleBuy(e: React.FormEvent) {
    e.preventDefault()
    if (!event) return
    setError('')
    setLoading(true)

    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: event.id,
        ticketTypeId: selectedType,
        customerName: name,
        customerEmail: email,
        quantity,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    const { url } = await res.json()
    window.location.href = url
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <p className="text-zinc-500">Event not found.</p>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  const totalPrice = formatPrice(currentPrice * quantity)

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Cover image */}
        {event.cover_image_url && (
          <div className="mb-8">
            <img
              src={event.cover_image_url}
              alt={event.title}
              className="w-full h-64 object-cover rounded-none border-2 border-white/20"
            />
          </div>
        )}

        {/* Event header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold font-mono uppercase tracking-widest mb-3">{event.title}</h1>
          <div className="space-y-2 text-zinc-400 text-sm">
            <div className="flex items-center gap-2">
              <span>📅</span>
              <span>{formatDate(event.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📍</span>
              <span>{event.venue}</span>
            </div>
          </div>
          {event.description && (
            <p className="mt-5 text-zinc-300 leading-relaxed">{event.description}</p>
          )}

          {/* Social links */}
          {(event.social_instagram || event.social_x || event.social_tiktok || event.social_website) && (
            <div className="mt-5 flex flex-wrap gap-3">
              {event.social_instagram && (
                <a
                  href={event.social_instagram.startsWith('http') ? event.social_instagram : `https://instagram.com/${event.social_instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-zinc-800 border border-zinc-700 rounded-none px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors font-mono uppercase"
                >
                  Instagram
                </a>
              )}
              {event.social_x && (
                <a
                  href={event.social_x.startsWith('http') ? event.social_x : `https://x.com/${event.social_x.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-zinc-800 border border-zinc-700 rounded-none px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors font-mono uppercase"
                >
                  X
                </a>
              )}
              {event.social_tiktok && (
                <a
                  href={event.social_tiktok.startsWith('http') ? event.social_tiktok : `https://tiktok.com/${event.social_tiktok.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-zinc-800 border border-zinc-700 rounded-none px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors font-mono uppercase"
                >
                  TikTok
                </a>
              )}
              {event.social_website && (
                <a
                  href={event.social_website.startsWith('http') ? event.social_website : `https://${event.social_website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-zinc-800 border border-zinc-700 rounded-none px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors font-mono uppercase"
                >
                  Website
                </a>
              )}
            </div>
          )}
        </div>

        {/* Buy form */}
        <div className="bg-zinc-900 border-2 border-white/20 rounded-none grain relative p-6">
          <h2 className="text-lg font-semibold font-mono uppercase tracking-widest mb-5">Get tickets</h2>

          {/* Ticket type selector */}
          {ticketTypes.length > 0 && (
            <div className="space-y-3 mb-6">
              {ticketTypes.map((tt) => {
                const status = getTypeStatus(tt)
                const isAvailable = status === 'available'
                const remaining = tt.quantity - tt.sold

                return (
                  <button
                    key={tt.id}
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => isAvailable && setSelectedType(tt.id)}
                    className={`w-full text-left p-4 rounded-none border-2 transition-all font-mono ${
                      selectedType === tt.id
                        ? 'border-white bg-white/5'
                        : isAvailable
                          ? 'border-zinc-700 hover:border-zinc-500 bg-zinc-800/50'
                          : 'border-zinc-800 bg-zinc-800/30 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm font-mono uppercase">{tt.name}</div>
                        {tt.description && (
                          <div className="text-xs text-zinc-500 mt-0.5 font-mono">{tt.description}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-sm">{formatPrice(tt.price)}</div>
                        {status === 'sold_out' && (
                          <span className="text-xs text-red-400">Sold out</span>
                        )}
                        {status === 'not_on_sale' && (
                          <span className="text-xs text-zinc-500">Coming soon</span>
                        )}
                        {status === 'ended' && (
                          <span className="text-xs text-zinc-500">Ended</span>
                        )}
                        {isAvailable && remaining <= 20 && (
                          <span className="text-xs text-amber-400">{remaining} left</span>
                        )}
                      </div>
                    </div>
                    {/* Selection indicator */}
                    {selectedType === tt.id && (
                      <div className="mt-2 pt-2 border-t border-white/10">
                        <span className="text-xs text-white/50">Selected</span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* If no ticket types, show single price */}
          {ticketTypes.length === 0 && (
            <div className="mb-6 p-4 rounded-none border border-zinc-700 bg-zinc-800/50">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm font-mono uppercase">General Admission</span>
                <span className="font-semibold text-sm font-mono">{formatPrice(event.ticket_price)}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleBuy} className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-mono uppercase tracking-wider" htmlFor="name">Full name</label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-none px-3.5 py-2.5 text-sm text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-mono uppercase tracking-wider" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-none px-3.5 py-2.5 text-sm text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
                placeholder="jane@example.com"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-mono uppercase tracking-wider" htmlFor="quantity">Number of tickets</label>
              <select
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-none px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-zinc-500 transition-colors"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'ticket' : 'tickets'}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-950/50 border border-red-900 rounded-none px-3 py-2 font-mono">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || (ticketTypes.length > 0 && !selectedType)}
              className="w-full bg-white text-black font-bold py-3 rounded-none text-sm hover:shadow-[4px_4px_0px_rgba(255,255,255,0.2)] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-mono uppercase tracking-widest border-2 border-white"
            >
              {loading ? 'Redirecting to checkout…' : `Buy tickets — ${totalPrice}`}
            </button>
          </form>
          <p className="mt-3 text-xs text-zinc-600 text-center">
            Secure payment via Stripe. No Solar account needed.
          </p>
        </div>
      </div>
    </div>
  )
}
