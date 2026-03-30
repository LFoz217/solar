'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function CreateEventForm({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const venue = formData.get('venue') as string
    const date = formData.get('date') as string
    const capacity = parseInt(formData.get('capacity') as string)
    const priceInput = formData.get('price') as string
    const ticket_price = Math.round(parseFloat(priceInput) * 100) // convert to pence
    const is_published = formData.get('is_published') === 'on'

    const { data, error: insertError } = await supabase
      .from('events')
      .insert({
        organiser_id: userId,
        title,
        description: description || null,
        venue,
        date: new Date(date).toISOString(),
        capacity,
        ticket_price,
        is_published,
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push(`/events/${data.id}/manage`)
  }

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
  const labelClass = "block text-sm text-white/70 mb-1.5"

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className={labelClass}>Event title</label>
        <input name="title" type="text" required placeholder="Summer Gathering 2025" className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          name="description"
          rows={4}
          placeholder="Tell people what to expect…"
          className={inputClass + ' resize-none'}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Venue</label>
          <input name="venue" type="text" required placeholder="The Forum, London" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Date & time</label>
          <input name="date" type="datetime-local" required className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Capacity</label>
          <input name="capacity" type="number" required min={1} placeholder="500" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Ticket price (£)</label>
          <input name="price" type="number" required min={0} step="0.01" placeholder="15.00" className={inputClass} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          name="is_published"
          id="is_published"
          type="checkbox"
          className="w-4 h-4 rounded border-white/20 bg-white/5 checked:bg-white"
        />
        <label htmlFor="is_published" className="text-sm text-white/70">
          Publish immediately (visible on the site)
        </label>
      </div>

      {error && (
        <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex gap-4 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-white text-black font-semibold px-8 py-3 rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating…' : 'Create event'}
        </button>
        <a href="/dashboard" className="text-white/50 hover:text-white py-3 transition-colors text-sm">
          Cancel
        </a>
      </div>
    </form>
  )
}
