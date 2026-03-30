'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import QRCode from 'react-qr-code'
import { createClient } from '@/lib/supabase/client'
import type { Ticket, Event, Order } from '@/types'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface TicketWithEvent extends Ticket {
  event: Event
  order: Order
}

export default function TicketWalletPage() {
  const params = useParams()
  const [tickets, setTickets] = useState<TicketWithEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [fullScreenTicket, setFullScreenTicket] = useState<TicketWithEvent | null>(null)

  useEffect(() => {
    async function fetchTickets() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('tickets')
        .select('*, event:events(*), order:orders(*)')
        .eq('order_id', params.orderId)
        .order('created_at', { ascending: true })

      if (error || !data || data.length === 0) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setTickets(data as TicketWithEvent[])
      setLoading(false)
    }
    fetchTickets()
  }, [params.orderId])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <p className="text-zinc-500">Tickets not found.</p>
      </div>
    )
  }

  const event = tickets[0]?.event

  return (
    <div className="min-h-screen bg-black text-white pb-16">
      {/* Full-screen QR overlay */}
      {fullScreenTicket && (
        <div
          className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-8"
          onClick={() => setFullScreenTicket(null)}
        >
          <p className="text-xs text-zinc-500 mb-6">Tap to close</p>
          <div className="bg-white p-6 rounded-2xl">
            <QRCode value={fullScreenTicket.qr_code} size={280} />
          </div>
          <p className="mt-6 text-lg font-mono font-semibold">{fullScreenTicket.ticket_number}</p>
          <p className="mt-1 text-sm text-zinc-400">{fullScreenTicket.event.title}</p>
        </div>
      )}

      <div className="max-w-md mx-auto px-4 pt-10">
        <h1 className="text-2xl font-bold mb-1">{event?.title}</h1>
        <p className="text-sm text-zinc-500 mb-8">
          {event && formatDate(event.date)} · {event?.venue}
        </p>

        <div className="space-y-4">
          {tickets.map((ticket, i) => (
            <div
              key={ticket.id}
              onClick={() => !ticket.is_scanned && setFullScreenTicket(ticket)}
              className={`relative bg-zinc-900 border rounded-2xl overflow-hidden cursor-pointer transition-opacity ${
                ticket.is_scanned
                  ? 'border-zinc-800 opacity-60 cursor-default'
                  : 'border-zinc-700 hover:border-zinc-500'
              }`}
            >
              {/* Dashed ticket-stub divider */}
              <div className="absolute left-0 right-0 top-[180px] border-t-2 border-dashed border-zinc-700" />
              {/* Left notch */}
              <div className="absolute left-0 top-[168px] w-6 h-6 bg-black rounded-full -translate-x-1/2" />
              {/* Right notch */}
              <div className="absolute right-0 top-[168px] w-6 h-6 bg-black rounded-full translate-x-1/2" />

              {/* QR section */}
              <div className="flex flex-col items-center justify-center py-6 px-4">
                <div className="bg-white p-3 rounded-xl">
                  <QRCode value={ticket.qr_code} size={128} />
                </div>
                <p className="mt-3 text-xs text-zinc-500">Tap to enlarge</p>
              </div>

              {/* Ticket details section */}
              <div className="px-5 pt-6 pb-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm">{event?.title}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Ticket {i + 1} of {tickets.length}
                    </p>
                  </div>
                  {ticket.is_scanned ? (
                    <span className="text-xs bg-zinc-800 text-zinc-500 px-2.5 py-1 rounded-full">
                      Scanned
                    </span>
                  ) : (
                    <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-900 px-2.5 py-1 rounded-full">
                      Valid ✓
                    </span>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-zinc-800 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Ticket No.</span>
                    <span className="font-mono text-zinc-300">{ticket.ticket_number}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Date</span>
                    <span className="text-zinc-300">{event && formatDate(event.date)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Venue</span>
                    <span className="text-zinc-300">{event?.venue}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Apple Wallet button */}
        <button
          disabled
          className="mt-8 w-full flex items-center justify-center gap-2 border border-zinc-800 text-zinc-600 py-3 rounded-xl text-sm cursor-not-allowed"
        >
          <span>🍎</span>
          Add to Apple Wallet — coming soon
        </button>
      </div>
    </div>
  )
}
