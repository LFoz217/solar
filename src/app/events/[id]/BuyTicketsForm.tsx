'use client'

import { useState } from 'react'
import type { Event } from '@/lib/types'

export default function BuyTicketsForm({ event, remaining }: { event: Event; remaining: number }) {
  const [quantity, setQuantity] = useState(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const maxQuantity = Math.min(remaining, 10)
  const total = event.ticket_price * quantity

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          quantity,
          customerName: name,
          customerEmail: email,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        setLoading(false)
        return
      }

      // Redirect to Stripe Checkout URL
      if (data.url) {
        window.location.href = data.url
      } else {
        setError('Could not create checkout session.')
        setLoading(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleBuy} className="space-y-3">
      <div>
        <label className="block text-xs text-white/50 mb-1">Your name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Jane Smith"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
        />
      </div>
      <div>
        <label className="block text-xs text-white/50 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="jane@example.com"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
        />
      </div>
      <div>
        <label className="block text-xs text-white/50 mb-1">Quantity</label>
        <select
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
        >
          {Array.from({ length: maxQuantity }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n} className="bg-zinc-900">{n} ticket{n > 1 ? 's' : ''}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-white text-black font-semibold py-3 rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {loading
          ? 'Redirecting…'
          : event.ticket_price === 0
          ? 'Get free ticket'
          : `Pay £${(total / 100).toFixed(2)}`}
      </button>
    </form>
  )
}
