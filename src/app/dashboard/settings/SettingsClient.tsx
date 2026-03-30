'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Organiser {
  id: string
  name: string
  bio: string | null
  website: string | null
  logo_url: string | null
  stripe_account_id: string | null
  notify_on_sale: boolean | null
  notify_on_refund: boolean | null
}

export default function SettingsClient({
  organiser,
  userEmail,
}: {
  organiser: Organiser | null
  userEmail: string
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    name: organiser?.name ?? '',
    bio: organiser?.bio ?? '',
    website: organiser?.website ?? '',
    logo_url: organiser?.logo_url ?? '',
    notify_on_sale: organiser?.notify_on_sale ?? true,
    notify_on_refund: organiser?.notify_on_refund ?? true,
  })

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    background: 'var(--bg-elevated)',
    borderColor: 'var(--border)',
    color: 'var(--text-primary)',
    borderRadius: '4px',
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-8">
      <h2 className="text-xs font-semibold uppercase tracking-wide mb-4 pb-2 border-b"
        style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
        {title}
      </h2>
      {children}
    </div>
  )

  const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
    <div className="mb-4">
      <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      {hint && <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
      {children}
    </div>
  )

  return (
    <form onSubmit={save}>
      <Section title="Organiser profile">
        <Field label="Organisation name">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 text-sm border outline-none" style={inputStyle} />
        </Field>
        <Field label="Bio" hint="Shown on your public event pages">
          <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 text-sm border outline-none resize-none"
            style={inputStyle} />
        </Field>
        <Field label="Website">
          <input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })}
            placeholder="https://yoursite.com"
            className="w-full px-3 py-2 text-sm border outline-none" style={inputStyle} />
        </Field>
        <Field label="Logo URL" hint="Direct link to your logo image (PNG/SVG, ideally square)">
          <input type="url" value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
            placeholder="https://..."
            className="w-full px-3 py-2 text-sm border outline-none" style={inputStyle} />
        </Field>
      </Section>

      <Section title="Account">
        <div className="p-3 border mb-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', borderRadius: '4px' }}>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Signed in as</div>
          <div className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-primary)' }}>{userEmail}</div>
        </div>
        <div className="p-3 border"
          style={{
            background: 'var(--bg-surface)',
            borderColor: organiser?.stripe_account_id ? 'var(--accent)' : 'var(--border)',
            borderRadius: '4px',
          }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Stripe Connect</div>
              <div className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-primary)' }}>
                {organiser?.stripe_account_id ? 'Connected' : 'Not connected'}
              </div>
            </div>
            {!organiser?.stripe_account_id && (
              <a href="/api/stripe/connect"
                className="text-xs px-3 py-1.5 font-semibold"
                style={{ background: 'var(--accent)', color: '#fff', borderRadius: '3px' }}>
                Connect →
              </a>
            )}
            {organiser?.stripe_account_id && (
              <span className="text-xs px-2 py-1" style={{ background: 'rgba(249,115,22,0.1)', color: 'var(--accent)', borderRadius: '3px' }}>
                ✓ Active
              </span>
            )}
          </div>
        </div>
      </Section>

      <Section title="Notifications">
        {[
          { key: 'notify_on_sale', label: 'Email me when a ticket is sold' },
          { key: 'notify_on_refund', label: 'Email me when a refund is issued' },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between py-3 border-b"
            style={{ borderColor: 'var(--border)' }}>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
            <button
              type="button"
              onClick={() => setForm({ ...form, [key]: !form[key as keyof typeof form] })}
              className="w-10 h-6 rounded-full transition-colors relative"
              style={{
                background: form[key as keyof typeof form] ? 'var(--accent)' : 'var(--bg-elevated)',
                borderRadius: '12px',
              }}>
              <span className="absolute top-1 transition-all w-4 h-4 rounded-full bg-white"
                style={{ left: form[key as keyof typeof form] ? '22px' : '2px' }} />
            </button>
          </div>
        ))}
      </Section>

      <Section title="Analytics integrations">
        {[
          { key: 'fb_pixel', label: 'Facebook Pixel ID', placeholder: 'e.g. 738207007181818' },
          { key: 'ga4_id', label: 'Google Analytics 4 (Measurement ID)', placeholder: 'e.g. G-XXXXXXXXXX' },
          { key: 'tiktok_pixel', label: 'TikTok Pixel ID', placeholder: 'e.g. CXXXXXXXXXXXXXXX' },
        ].map(({ label, placeholder }) => (
          <Field key={label} label={label}>
            <input placeholder={placeholder}
              className="w-full px-3 py-2 text-sm border outline-none" style={inputStyle} />
          </Field>
        ))}
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          These IDs will be fired on your public event pages when a purchase completes.
        </p>
      </Section>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving}
          className="text-sm font-semibold px-5 py-2 disabled:opacity-50"
          style={{ background: 'var(--accent)', color: '#fff', borderRadius: '4px' }}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        {saved && (
          <span className="text-sm" style={{ color: 'var(--accent)' }}>Saved ✓</span>
        )}
      </div>
    </form>
  )
}
