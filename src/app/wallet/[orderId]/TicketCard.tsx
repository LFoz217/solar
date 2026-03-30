'use client'

import { useState } from 'react'
import QRCode from 'react-qr-code'
import type { Ticket } from '@/lib/types'

interface TicketCardProps {
  ticket: Ticket
  event: { title: string; venue: string; date: string }
  index: number
  total: number
}

export default function TicketCard({ ticket, event, index, total }: TicketCardProps) {
  const [expanded, setExpanded] = useState(false)

  const eventDate = new Date(event.date).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  })

  if (expanded) {
    return (
      // Full-screen QR overlay for easy scanning
      <div
        className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-8 cursor-pointer"
        onClick={() => setExpanded(false)}
      >
        <div className="text-black text-xs uppercase tracking-widest mb-6 font-medium opacity-50">
          Tap anywhere to close
        </div>
        <QRCode
          value={ticket.qr_code}
          size={Math.min(280, typeof window !== 'undefined' ? window.innerWidth - 64 : 280)}
          bgColor="#ffffff"
          fgColor="#000000"
          level="M"
        />
        <div className="mt-8 text-center">
          <div className="text-black font-bold text-lg">{event.title}</div>
          <div className="text-black/50 text-sm mt-1">{ticket.ticket_number}</div>
          {ticket.is_scanned && (
            <div className="mt-3 bg-gray-100 text-gray-500 text-xs px-3 py-1.5 rounded-full inline-block">
              Already scanned
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-white/8 to-white/4 cursor-pointer active:scale-[0.98] transition-transform select-none"
      onClick={() => setExpanded(true)}
    >
      {/* Ticket header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-[10px] text-white/30 uppercase tracking-widest mb-1">
              ☀️ Solar · Ticket {index}/{total}
            </div>
            <h2 className="font-bold text-lg leading-tight">{event.title}</h2>
            <p className="text-white/50 text-sm mt-0.5">{event.venue}</p>
          </div>
          {/* Status badge */}
          <div className={`shrink-0 ml-4 text-xs px-2.5 py-1 rounded-full font-medium ${
            ticket.is_scanned
              ? 'bg-white/10 text-white/40 border border-white/10'
              : 'bg-green-400/15 text-green-400 border border-green-400/25'
          }`}>
            {ticket.is_scanned ? 'Scanned' : 'Valid'}
          </div>
        </div>

        <div className="text-white/40 text-xs">{eventDate}</div>
      </div>

      {/* Perforation / tear line */}
      <div className="relative flex items-center px-0 my-1">
        <div className="absolute -left-3 w-6 h-6 rounded-full bg-black border border-white/10"></div>
        <div className="w-full border-t border-dashed border-white/15 mx-6"></div>
        <div className="absolute -right-3 w-6 h-6 rounded-full bg-black border border-white/10"></div>
      </div>

      {/* QR section */}
      <div className="px-6 pb-6 pt-4">
        <div className="flex items-center gap-5">
          {/* QR Code */}
          <div className="bg-white rounded-xl p-3 shrink-0">
            <QRCode
              value={ticket.qr_code}
              size={96}
              bgColor="#ffffff"
              fgColor="#000000"
              level="M"
            />
          </div>

          {/* Ticket info */}
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Ticket no.</div>
            <div className="font-mono font-bold text-white text-sm mb-4">{ticket.ticket_number}</div>

            <div className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Tap to expand</div>
            <div className="text-white/40 text-xs">Full-screen QR for scanning</div>
          </div>
        </div>

        {/* Apple Wallet placeholder */}
        <button
          disabled
          className="mt-5 w-full flex items-center justify-center gap-2 border border-white/10 rounded-xl py-2.5 text-white/25 text-sm cursor-not-allowed"
        >
          <span>🍎</span>
          <span>Add to Apple Wallet</span>
          <span className="text-[10px] text-white/20 ml-1">Coming soon</span>
        </button>
      </div>
    </div>
  )
}
