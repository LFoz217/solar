'use client'

import { useState, useRef, useEffect } from 'react'

interface ScanResult {
  success: boolean
  message: string
  attendee?: string
  quantity?: number
}

export default function ScanClient({ eventId, eventTitle }: { eventId: string; eventTitle: string }) {
  const [manualCode, setManualCode] = useState('')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [scanning, setScanning] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (result) {
      const t = setTimeout(() => setResult(null), 4000)
      return () => clearTimeout(t)
    }
  }, [result])

  async function validateTicket(code: string) {
    if (!code.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/tickets/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode: code.trim(), eventId }),
      })
      const data = await res.json()
      setResult({
        success: res.ok && !data.error,
        message: data.message ?? (res.ok ? 'Ticket validated ✓' : 'Invalid ticket'),
        attendee: data.attendee,
        quantity: data.quantity,
      })
      setManualCode('')
      inputRef.current?.focus()
    } catch {
      setResult({ success: false, message: 'Network error. Try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Result banner */}
      {result && (
        <div className="mb-4 px-4 py-3 border font-medium text-sm"
          style={{
            background: result.success ? 'rgba(249,115,22,0.1)' : 'rgba(239,68,68,0.1)',
            borderColor: result.success ? 'var(--accent)' : 'var(--danger)',
            color: result.success ? 'var(--accent)' : 'var(--danger)',
            borderRadius: '4px',
          }}>
          <div>{result.message}</div>
          {result.attendee && <div className="text-xs mt-0.5 opacity-80">{result.attendee} · {result.quantity} ticket{(result.quantity ?? 1) > 1 ? 's' : ''}</div>}
        </div>
      )}

      {/* Manual lookup */}
      <div className="border p-4 mb-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', borderRadius: '4px' }}>
        <div className="text-xs uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
          Manual ticket lookup
        </div>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && validateTicket(manualCode)}
            placeholder="Paste QR code or ticket ref…"
            autoFocus
            className="flex-1 px-3 py-2 text-sm border outline-none"
            style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)', borderRadius: '4px' }}
          />
          <button
            onClick={() => validateTicket(manualCode)}
            disabled={loading || !manualCode.trim()}
            className="px-4 py-2 text-sm font-semibold disabled:opacity-50"
            style={{ background: 'var(--accent)', color: '#fff', borderRadius: '4px' }}>
            {loading ? '…' : 'Check'}
          </button>
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          Tip: on mobile, use a Bluetooth barcode scanner (it types into this field automatically)
        </p>
      </div>

      {/* Camera scanner hint */}
      <div className="border p-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', borderRadius: '4px' }}>
        <div className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Camera scanner</div>
        <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
          For camera scanning, use the mobile scan page at:
        </p>
        <div className="font-mono text-sm px-3 py-2 border" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--accent)', borderRadius: '4px' }}>
          /events/{eventId}/scan
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          Open on your phone. Uses the rear camera directly.
        </p>
      </div>
    </div>
  )
}
