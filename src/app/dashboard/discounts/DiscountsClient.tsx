'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface DiscountCode {
  id: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  max_uses: number | null
  uses_count: number
  expires_at: string | null
  is_active: boolean
  event_id: string | null
  events?: { title: string } | null
}

interface Event {
  id: string
  title: string
}

function fmt(pence: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pence / 100)
}

export default function DiscountsClient({
  codes,
  events,
  organiserId,
}: {
  codes: DiscountCode[]
  events: Event[]
  organiserId: string
}) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: '',
    max_uses: '',
    event_id: '',
    expires_at: '',
  })

  async function createCode(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          value: form.type === 'percentage' ? parseInt(form.value) : Math.round(parseFloat(form.value) * 100),
          max_uses: form.max_uses ? parseInt(form.max_uses) : null,
          event_id: form.event_id || null,
          expires_at: form.expires_at || null,
          organiser_id: organiserId,
        }),
      })
      if (res.ok) {
        setShowForm(false)
        setForm({ code: '', type: 'percentage', value: '', max_uses: '', event_id: '', expires_at: '' })
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  async function toggleCode(id: string, isActive: boolean) {
    await fetch(`/api/discounts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !isActive }),
    })
    router.refresh()
  }

  async function deleteCode(id: string) {
    if (!confirm('Delete this discount code?')) return
    await fetch(`/api/discounts/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  const inputStyle = {
    background: 'var(--bg-elevated)',
    borderColor: 'var(--border)',
    color: 'var(--text-primary)',
    borderRadius: '4px',
  }

  return (
    <div>
      {/* Create form toggle */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="mb-5 text-sm font-semibold px-4 py-2"
        style={{ background: 'var(--accent)', color: '#fff', borderRadius: '4px' }}>
        {showForm ? 'Cancel' : '+ New discount code'}
      </button>

      {showForm && (
        <form onSubmit={createCode} className="mb-6 p-5 border"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', borderRadius: '4px' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>New discount code</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Code</label>
              <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="e.g. SUMMER20"
                className="w-full px-3 py-2 text-sm border outline-none font-mono uppercase"
                style={inputStyle} />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'percentage' | 'fixed' })}
                className="w-full px-3 py-2 text-sm border outline-none"
                style={{ ...inputStyle, background: 'var(--bg-elevated)' }}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed amount (£)</option>
              </select>
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>
                Value ({form.type === 'percentage' ? '%' : '£'})
              </label>
              <input required type="number" min="1" max={form.type === 'percentage' ? '100' : undefined}
                value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder={form.type === 'percentage' ? '20' : '5.00'}
                className="w-full px-3 py-2 text-sm border outline-none"
                style={inputStyle} />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Max uses (blank = unlimited)</label>
              <input type="number" min="1" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                placeholder="Unlimited"
                className="w-full px-3 py-2 text-sm border outline-none"
                style={inputStyle} />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Event (blank = all events)</label>
              <select value={form.event_id} onChange={(e) => setForm({ ...form, event_id: e.target.value })}
                className="w-full px-3 py-2 text-sm border outline-none"
                style={{ ...inputStyle, background: 'var(--bg-elevated)' }}>
                <option value="">All events</option>
                {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Expires (optional)</label>
              <input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                className="w-full px-3 py-2 text-sm border outline-none"
                style={inputStyle} />
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="mt-4 text-sm font-semibold px-5 py-2 disabled:opacity-50"
            style={{ background: 'var(--accent)', color: '#fff', borderRadius: '4px' }}>
            {loading ? 'Creating…' : 'Create code'}
          </button>
        </form>
      )}

      {/* Codes table */}
      <div className="border" style={{ borderColor: 'var(--border)', borderRadius: '4px' }}>
        {codes.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No discount codes yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                {['Code', 'Discount', 'Event', 'Uses', 'Expires', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium"
                    style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {codes.map((code) => {
                const used = code.uses_count
                const limit = code.max_uses
                return (
                  <tr key={code.id} className="border-b last:border-0"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', opacity: code.is_active ? 1 : 0.5 }}>
                    <td className="px-4 py-3 font-mono font-semibold" style={{ color: 'var(--accent)' }}>{code.code}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                      {code.type === 'percentage' ? `${code.value}%` : fmt(code.value)} off
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                      {code.events?.title ?? 'All events'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                      {used}{limit ? `/${limit}` : ''}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {code.expires_at ? new Date(code.expires_at).toLocaleDateString('en-GB') : 'None'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1"
                        style={{
                          background: code.is_active ? 'rgba(249,115,22,0.1)' : 'var(--bg-elevated)',
                          color: code.is_active ? 'var(--accent)' : 'var(--text-muted)',
                          borderRadius: '3px',
                        }}>
                        {code.is_active ? 'Active' : 'Paused'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => toggleCode(code.id, code.is_active)}
                          className="text-xs px-2 py-1 border"
                          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', borderRadius: '3px' }}>
                          {code.is_active ? 'Pause' : 'Resume'}
                        </button>
                        <button onClick={() => deleteCode(code.id)}
                          className="text-xs px-2 py-1 border"
                          style={{ borderColor: 'var(--border)', color: 'var(--danger)', borderRadius: '3px' }}>
                          Delete
                        </button>
                      </div>
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
