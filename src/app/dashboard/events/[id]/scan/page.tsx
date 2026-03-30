'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

type ScanResult =
  | { valid: true; ticketNumber: string; customerName: string; eventTitle: string }
  | { valid: false; reason: 'invalid' | 'already_scanned'; scannedAt?: string }

export default function ScanPage() {
  const params = useParams()
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<{ stop: () => void } | null>(null)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [scanning, setScanning] = useState(false)
  const [cameraError, setCameraError] = useState('')

  useEffect(() => {
    let active = true

    async function startScanner() {
      // qr-scanner is ESM-only, import dynamically to avoid SSR issues
      const QrScanner = (await import('qr-scanner')).default

      if (!videoRef.current || !active) return

      const scanner = new QrScanner(
        videoRef.current,
        async (result) => {
          const qrCode = result.data
          scanner.stop()
          setScanning(false)

          const res = await fetch('/api/tickets/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ qrCode }),
          })

          const data = await res.json()
          setResult(data)
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      )

      scannerRef.current = scanner

      try {
        await scanner.start()
        setScanning(true)
      } catch {
        setCameraError('Camera access denied. Please allow camera permission and reload.')
      }
    }

    startScanner()

    return () => {
      active = false
      scannerRef.current?.stop()
    }
  }, [])

  function handleScanAgain() {
    setResult(null)

    async function restart() {
      const QrScanner = (await import('qr-scanner')).default
      if (!videoRef.current) return

      const scanner = new QrScanner(
        videoRef.current,
        async (result) => {
          const qrCode = result.data
          scanner.stop()
          setScanning(false)

          const res = await fetch('/api/tickets/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ qrCode }),
          })

          const data = await res.json()
          setResult(data)
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      )

      scannerRef.current = scanner
      await scanner.start()
      setScanning(true)
    }

    restart()
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-900">
        <Link
          href={`/dashboard/events/${params.id}`}
          className="text-zinc-500 hover:text-white transition-colors text-sm"
        >
          ← Back
        </Link>
        <span className="text-sm font-semibold">Ticket Scanner</span>
        <div className="w-12" />
      </div>

      {/* Camera view */}
      <div className="relative flex-1 flex flex-col items-center justify-center">
        <div className="relative w-full max-w-sm aspect-square overflow-hidden rounded-2xl bg-zinc-900">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            muted
            playsInline
          />

          {/* Scan overlay */}
          {scanning && !result && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-56 h-56 relative">
                {/* Corner brackets */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white rounded-tl-sm" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white rounded-tr-sm" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white rounded-bl-sm" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white rounded-br-sm" />
              </div>
            </div>
          )}
        </div>

        {cameraError && (
          <p className="mt-6 text-sm text-red-400 text-center max-w-xs px-4">
            {cameraError}
          </p>
        )}

        {!result && !cameraError && (
          <p className="mt-4 text-sm text-zinc-500">
            {scanning ? 'Point at a ticket QR code' : 'Starting camera…'}
          </p>
        )}

        {/* Result panel */}
        {result && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 rounded-2xl px-6">
            <div className="text-center w-full max-w-xs">
              {result.valid ? (
                <>
                  <div className="text-6xl mb-4">✅</div>
                  <h2 className="text-2xl font-bold text-emerald-400 mb-2">Valid</h2>
                  <p className="text-xl font-semibold text-white mb-1">
                    {result.customerName}
                  </p>
                  <p className="font-mono text-sm text-zinc-400 mb-1">{result.ticketNumber}</p>
                  <p className="text-sm text-zinc-500">{result.eventTitle}</p>
                </>
              ) : result.reason === 'already_scanned' ? (
                <>
                  <div className="text-6xl mb-4">🚫</div>
                  <h2 className="text-2xl font-bold text-zinc-400 mb-2">Already Scanned</h2>
                  {result.scannedAt && (
                    <p className="text-sm text-zinc-500">
                      Scanned at{' '}
                      {new Date(result.scannedAt).toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div className="text-6xl mb-4">❌</div>
                  <h2 className="text-2xl font-bold text-red-400 mb-2">Invalid Ticket</h2>
                  <p className="text-sm text-zinc-500">This QR code is not recognised.</p>
                </>
              )}

              <button
                onClick={handleScanAgain}
                className="mt-8 w-full bg-white text-black font-semibold py-3 rounded-xl text-sm hover:bg-zinc-100 transition-colors"
              >
                Scan next ticket
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
