'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Guest {
  id: string
  name: string
  email: string
  notes: string | null
  added_at: string
  orders?: { status: string } | null
}

interface Event {
  id: string
  title: string
  date: string
}

export default function GuestListClient({
  events,
  selectedEventId,
  guests,
  organiserId,
}: {
  events: Event[]
  selectedEventId: string | null
  guests: Record<string, unknown>[]
  organiserId: string
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', notes: '' })

  const typedGuests = guests as unknown as Guest[]

  function selectEvent(id: string) {
    router.push(`/dashboard/guestlist?event=${id}`)
  }

  async function addGuest(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedEventId) return
    setLoading(true)
    try {
      const res = await fetch('/api/guestlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, event_id: selectedEventId, organiser_id: organiserId }),
      })
      if (res.ok) {
        setForm({ name: '', email: '', notes: '' })
        setShowForm(false)
        startTransition(() => router.refresh())
      }
    } finally {
      setLoading(false)
    }
  }

  async function removeGuest(id: string) {
    if (!confirm('Remove from guest list?')) return
    await fetch(`/api/guestlist/${id}`, { method: 'DELETE' })
    startTransition(() => router.refresh())
  }

  const inputStyle = {
    background: 'var(--bg-elevated)',
    borderColor: 'var(--border)',
    color: 'var(--text-primary)',
    borderRadius: '4px',
  }

  return (
    <div>
      {/* Event selector */}
      <div className="mb-5">
        <label className="text-xs uppercase tracking-wide block mb-2" style={{ color: 'var(--text-muted)' }}>Event</label>
        <div className="flex flex-wrap gap-2">
          {events.map((ev) => (
            <button key={ev.id} onClick={() => selectEvent(ev.id)}
              className="text-sm px-3 py-1.5 border transition-colors"
              style={{
                background: selectedEventId === ev.id ? 'var(--accent-muted)' : 'var(--bg-surface)',
                borderColor: selectedEventId === ev.id ? 'var(--accent)' : 'var(--border)',
                color: selectedEventId === ev.id ? 'var(--accent)' : 'var(--text-secondary)',
                borderRadius: '4px',
              }}>
              {ev.title}
            </button>
          ))}
        </div>
      </div>

      {/* Add guest */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {typedGuests.length} {typedGuests.length === 1 ? 'guest' : 'guests'}
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="text-sm font-semibold px-4 py-2"
          style={{ background: 'var(--accent)', color: '#fff', borderRadius: '4px' }}>
          {showForm ? 'Cancel' : '+ Add guest'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={addGuest} className="mb-5 p-4 border"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', borderRadius: '4px' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Guest name"
                className="w-full px-3 py-2 text-sm border outline-none"
                style={inputStyle} />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Email</label>
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="guest@email.com"
                className="w-full px-3 py-2 text-sm border outline-none"
                style={inputStyle} />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Notes (optional)</label>
              <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="VIP, +1, etc."
                className="w-full px-3 py-2 text-sm border outline-none"
                style={inputStyle} />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button type="submit" disabled={loading}
              className="text-sm font-semibold px-4 py-2 disabled:opacity-50"
              style={{ background: 'var(--accent)', color: '#fff', borderRadius: '4px' }}>
              {loading ? 'Adding…' : 'Add to guest list'}
            </button>
          </div>
        </form>
      )}

      {/* Guest table */}
      <div className="border" style={{ borderColor: 'var(--border)', borderRadius: '4px' }}>
        {typedGuests.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {selectedEventId ? 'No guests on the list yet.' : 'Select an event first.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                {['Name', 'Email', 'Notes', 'Added', 'Ticket', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium"
                    style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {typedGuests.map((guest) => (
                <tr key={guest.id} className="border-b last:border-0"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{guest.name}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{guest.email}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{guest.notes ?? ''}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {new Date(guest.added_at).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1"
                      style={{
                        background: guest.orders ? 'rgba(249,115,22,0.1)' : 'var(--bg-elevated)',
                        color: guest.orders ? 'var(--accent)' : 'var(--text-muted)',
                        borderRadius: '3px',
                      }}>
                      {guest.orders ? 'Issued' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => removeGuest(guest.id)}
                      className="text-xs px-2 py-1 border"
                      style={{ borderColor: 'var(--border)', color: 'var(--danger)', borderRadius: '3px' }}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
