import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { createAdminClient } from '@/lib/supabase/admin'
import TicketCard from './TicketCard'

export const dynamic = 'force-dynamic'

export default async function WalletPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const supabase = createAdminClient()

  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      events (id, title, venue, date, ticket_price)
    `)
    .eq('id', orderId)
    .eq('status', 'paid')
    .single()

  if (!order) notFound()

  const { data: tickets } = await supabase
    .from('tickets')
    .select('*')
    .eq('order_id', orderId)
    .order('ticket_number', { ascending: true })

  const event = order.events as { id: string; title: string; venue: string; date: string; ticket_price: number }
  const eventDate = new Date(event.date).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  })
  const eventTime = new Date(event.date).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit'
  })

  return (
    <>
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-8">
        <Link href="/" className="text-white/40 hover:text-white/70 text-sm transition-colors mb-6 inline-block">
          ← Home
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">{event.title}</h1>
          <p className="text-white/50 text-sm">{event.venue}</p>
          <p className="text-white/40 text-sm mt-1">{eventDate} · {eventTime}</p>
          <div className="mt-3 text-xs text-white/30">
            {tickets?.length ?? 0} ticket{(tickets?.length ?? 0) !== 1 ? 's' : ''} · {order.customer_name}
          </div>
        </div>

        {/* Tickets */}
        <div className="space-y-6">
          {tickets?.map((ticket, index) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              event={event}
              index={index + 1}
              total={tickets.length}
            />
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-10 text-center">
          <p className="text-white/20 text-xs">
            Show QR code at the door · Tickets are non-transferable
          </p>
          <p className="text-white/20 text-xs mt-1">
            Questions? Email your confirmation for support
          </p>
        </div>
      </main>
    </>
  )
}
