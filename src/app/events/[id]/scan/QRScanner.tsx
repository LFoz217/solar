'use client'

import { useEffect, useRef, useState } from 'react'

type ScanResult = {
  success: boolean
  message: string
  ticket?: {
    ticket_number: string
    customer_name: string
    event_title: string
    already_scanned: boolean
    scanned_at?: string
  }
}

export default function QRScanner({ eventId }: { eventId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState('')
  const [lastScan, setLastScan] = useState('')
  const scannerRef = useRef<import('qr-scanner').default | null>(null)

  useEffect(() => {
    return () => {
      scannerRef.current?.stop()
      scannerRef.current?.destroy()
    }
  }, [])

  const startScanner = async () => {
    setError('')
    setResult(null)
    setScanning(true)

    try {
      const QrScanner = (await import('qr-scanner')).default

      if (!videoRef.current) return

      const scanner = new QrScanner(
        videoRef.current,
        async (scanResult) => {
          const qrCode = scanResult.data

          // Debounce: skip if same code scanned within 3s
          if (qrCode === lastScan) return
          setLastScan(qrCode)

          // Pause scanning while validating
          scanner.pause()

          try {
            const res = await fetch('/api/tickets/validate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ qrCode, eventId }),
            })

            const data: ScanResult = await res.json()
            setResult(data)

            // Resume scanning after 3s
            setTimeout(() => {
              setLastScan('')
              scanner.start()
            }, 3000)
          } catch {
            setError('Validation failed. Check your connection.')
            scanner.start()
          }
        },
        {
          preferredCamera: 'environment',
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      )

      scannerRef.current = scanner
      await scanner.start()
    } catch {
      setError('Could not access camera. Please allow camera access.')
      setScanning(false)
    }
  }

  const stopScanner = () => {
    scannerRef.current?.stop()
    scannerRef.current?.destroy()
    scannerRef.current = null
    setScanning(false)
    setResult(null)
    setLastScan('')
  }

  return (
    <div className="space-y-6">
      {/* Scanner viewport */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-black border border-white/10">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          style={{ display: scanning ? 'block' : 'none' }}
        />
        {!scanning && (
          <div className="absolute inset-0 flex items-center justify-center text-white/30">
            <div className="text-center">
              <div className="text-6xl mb-4">📷</div>
              <p className="text-sm">Camera preview</p>
            </div>
          </div>
        )}

        {/* Scan overlay lines */}
        {scanning && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-white/60 rounded-tl"></div>
            <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-white/60 rounded-tr"></div>
            <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-white/60 rounded-bl"></div>
            <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-white/60 rounded-br"></div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        {!scanning ? (
          <button
            onClick={startScanner}
            className="flex-1 bg-white text-black font-semibold py-4 rounded-xl text-lg hover:bg-white/90 transition-colors"
          >
            Start scanning
          </button>
        ) : (
          <button
            onClick={stopScanner}
            className="flex-1 border border-white/20 text-white/70 font-semibold py-4 rounded-xl text-lg hover:border-white/40 hover:text-white transition-colors"
          >
            Stop
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-400/10 border border-red-400/20 rounded-xl px-5 py-4 text-red-400">
          {error}
        </div>
      )}

      {/* Scan result */}
      {result && (
        <div className={`rounded-xl px-5 py-5 border ${
          result.success && !result.ticket?.already_scanned
            ? 'bg-green-400/10 border-green-400/30'
            : result.ticket?.already_scanned
            ? 'bg-orange-400/10 border-orange-400/30'
            : 'bg-red-400/10 border-red-400/30'
        }`}>
          <div className="flex items-start gap-4">
            <div className="text-3xl">
              {result.success && !result.ticket?.already_scanned ? '✅' :
               result.ticket?.already_scanned ? '⚠️' : '❌'}
            </div>
            <div>
              <div className={`font-semibold text-lg ${
                result.success && !result.ticket?.already_scanned ? 'text-green-400' :
                result.ticket?.already_scanned ? 'text-orange-400' : 'text-red-400'
              }`}>
                {result.success && !result.ticket?.already_scanned ? 'Valid ticket' :
                 result.ticket?.already_scanned ? 'Already scanned' : 'Invalid ticket'}
              </div>
              {result.ticket && (
                <div className="text-white/70 text-sm mt-1">
                  <div>{result.ticket.customer_name}</div>
                  <div className="text-white/40">{result.ticket.ticket_number}</div>
                  {result.ticket.already_scanned && result.ticket.scanned_at && (
                    <div className="text-orange-400/70 text-xs mt-1">
                      Scanned at {new Date(result.ticket.scanned_at).toLocaleTimeString('en-GB')}
                    </div>
                  )}
                </div>
              )}
              {!result.success && (
                <div className="text-red-400/70 text-sm mt-1">{result.message}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
