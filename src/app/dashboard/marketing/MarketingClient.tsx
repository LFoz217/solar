'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface MarketingLink {
  id: string
  label: string
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  click_count: number
  created_at: string
  event_id: string
}

interface Event {
  id: string
  title: string
}

export default function MarketingClient({
  events,
  selectedEventId,
  links,
  organiserId,
  appUrl,
}: {
  events: Event[]
  selectedEventId: string | null
  links: Record<string, unknown>[]
  organiserId: string
  appUrl: string
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [form, setForm] = useState({
    label: '',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
  })

  const typedLinks = links as unknown as MarketingLink[]

  function buildUrl(link: MarketingLink) {
    const base = `${appUrl}/events/${link.event_id}`
    const params = new URLSearchParams()
    if (link.utm_source) params.set('utm_source', link.utm_source)
    if (link.utm_medium) params.set('utm_medium', link.utm_medium)
    if (link.utm_campaign) params.set('utm_campaign', link.utm_campaign)
    const qs = params.toString()
    return qs ? `${base}?${qs}` : base
  }

  async function copy(url: string, id: string) {
    await navigator.clipboard.writeText(url)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  function selectEvent(id: string) {
    router.push(`/dashboard/marketing?event=${id}`)
  }

  async function createLink(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedEventId) return
    setLoading(true)
    try {
      const res = await fetch('/api/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, event_id: selectedEventId, organiser_id: organiserId }),
      })
      if (res.ok) {
        setForm({ label: '', utm_source: '', utm_medium: '', utm_campaign: '' })
        setShowForm(false)
        startTransition(() => router.refresh())
      }
    } finally {
      setLoading(false)
    }
  }

  async function deleteLink(id: string) {
    await fetch(`/api/marketing/${id}`, { method: 'DELETE' })
    startTransition(() => router.refresh())
  }

  const inputStyle = {
    background: 'var(--bg-elevated)',
    borderColor: 'var(--border)',
    color: 'var(--text-primary)',
    borderRadius: '4px',
  }

  // Embed snippet for selected event
  const embedSnippet = selectedEventId
    ? `<script src="${appUrl}/embed.js" data-event="${selectedEventId}"></script>`
    : ''

  return (
    <div>
      {/* Event selector */}
      <div className="mb-6">
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

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* UTM links */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Tracking links (UTM)
            </h2>
            <button onClick={() => setShowForm(!showForm)}
              className="text-xs px-3 py-1.5"
              style={{ background: 'var(--accent)', color: '#fff', borderRadius: '4px' }}>
              + New link
            </button>
          </div>

          {showForm && (
            <form onSubmit={createLink} className="mb-4 p-4 border"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', borderRadius: '4px' }}>
              <div className="space-y-3">
                <div>
                  <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Label</label>
                  <input required value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })}
                    placeholder="e.g. Instagram story"
                    className="w-full px-3 py-2 text-sm border outline-none" style={inputStyle} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Source</label>
                    <input value={form.utm_source} onChange={(e) => setForm({ ...form, utm_source: e.target.value })}
                      placeholder="instagram"
                      className="w-full px-3 py-2 text-sm border outline-none" style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Medium</label>
                    <input value={form.utm_medium} onChange={(e) => setForm({ ...form, utm_medium: e.target.value })}
                      placeholder="social"
                      className="w-full px-3 py-2 text-sm border outline-none" style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Campaign</label>
                    <input value={form.utm_campaign} onChange={(e) => setForm({ ...form, utm_campaign: e.target.value })}
                      placeholder="launch"
                      className="w-full px-3 py-2 text-sm border outline-none" style={inputStyle} />
                  </div>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="mt-3 text-sm font-semibold px-4 py-2 disabled:opacity-50"
                style={{ background: 'var(--accent)', color: '#fff', borderRadius: '4px' }}>
                {loading ? 'Creating…' : 'Create link'}
              </button>
            </form>
          )}

          <div className="border divide-y" style={{ borderColor: 'var(--border)', borderRadius: '4px' }}>
            {typedLinks.length === 0 ? (
              <div className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                No tracking links yet.
              </div>
            ) : (
              typedLinks.map((link) => {
                const url = buildUrl(link)
                return (
                  <div key={link.id} className="px-4 py-3" style={{ background: 'var(--bg-surface)' }}>
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{link.label}</span>
                      <div className="flex gap-2">
                        <button onClick={() => copy(url, link.id)}
                          className="text-xs px-2 py-1 border"
                          style={{ borderColor: 'var(--border)', color: copied === link.id ? 'var(--accent)' : 'var(--text-secondary)', borderRadius: '3px' }}>
                          {copied === link.id ? 'Copied!' : 'Copy'}
                        </button>
                        <button onClick={() => deleteLink(link.id)}
                          className="text-xs px-2 py-1 border"
                          style={{ borderColor: 'var(--border)', color: 'var(--danger)', borderRadius: '3px' }}>
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="font-mono text-xs truncate" style={{ color: 'var(--text-muted)' }}>{url}</div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {link.click_count} clicks
                      {link.utm_source && ` · ${link.utm_source}`}
                      {link.utm_medium && ` / ${link.utm_medium}`}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Embed widget */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
            Embed ticket widget
          </h2>
          <div className="p-4 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', borderRadius: '4px' }}>
            <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
              Drop this snippet into any webpage to embed the ticket purchase widget for this event.
            </p>
            <div className="font-mono text-xs p-3 border mb-3 break-all"
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--accent)', borderRadius: '4px' }}>
              {embedSnippet || '← Select an event first'}
            </div>
            {embedSnippet && (
              <button onClick={() => copy(embedSnippet, 'embed')}
                className="text-xs px-3 py-1.5 border"
                style={{ borderColor: 'var(--border)', color: copied === 'embed' ? 'var(--accent)' : 'var(--text-secondary)', borderRadius: '3px' }}>
                {copied === 'embed' ? 'Copied!' : 'Copy snippet'}
              </button>
            )}
          </div>

          {/* Pixel integrations */}
          <h2 className="text-xs font-semibold uppercase tracking-wide mb-3 mt-5" style={{ color: 'var(--text-muted)' }}>
            Analytics integrations
          </h2>
          <div className="p-4 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', borderRadius: '4px' }}>
            <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
              Add your tracking IDs in Settings to fire events on purchase completion.
            </p>
            {[
              { label: 'Facebook Pixel', href: '/dashboard/settings' },
              { label: 'Google Analytics (GA4)', href: '/dashboard/settings' },
              { label: 'TikTok Pixel', href: '/dashboard/settings' },
            ].map(({ label, href }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b last:border-0"
                style={{ borderColor: 'var(--border)' }}>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                <a href={href} className="text-xs" style={{ color: 'var(--accent)' }}>Configure →</a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
