import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const { eventId, ticketTypeId, customerName, customerEmail, quantity } = await request.json()

  if (!eventId || !customerName || !customerEmail || !quantity) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .eq('is_published', true)
    .single()

  if (error || !event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  let ticketPrice = event.ticket_price
  let ticketName = `${event.title}: Ticket`
  let availableCapacity = event.capacity

  // If ticket type specified, use its pricing and availability
  if (ticketTypeId) {
    const { data: ticketType, error: ttError } = await supabase
      .from('ticket_types')
      .select('*')
      .eq('id', ticketTypeId)
      .eq('event_id', eventId)
      .single()

    if (ttError || !ticketType) {
      return NextResponse.json({ error: 'Ticket type not found' }, { status: 404 })
    }

    // Check if ticket type is currently on sale
    const now = new Date()
    if (ticketType.sale_starts && new Date(ticketType.sale_starts) > now) {
      return NextResponse.json({ error: 'Tickets not yet on sale' }, { status: 400 })
    }
    if (ticketType.sale_ends && new Date(ticketType.sale_ends) < now) {
      return NextResponse.json({ error: 'Ticket sales have ended' }, { status: 400 })
    }

    ticketPrice = ticketType.price
    ticketName = `${event.title}: ${ticketType.name}`
    availableCapacity = ticketType.quantity - ticketType.sold

    if (quantity > availableCapacity) {
      return NextResponse.json({ error: 'Not enough tickets available' }, { status: 400 })
    }
  } else {
    // Legacy: check overall capacity
    const { data: soldData } = await supabase
      .from('orders')
      .select('quantity')
      .eq('event_id', eventId)
      .eq('status', 'paid')

    const totalSold = (soldData ?? []).reduce((sum, o) => sum + o.quantity, 0)
    if (totalSold + quantity > event.capacity) {
      return NextResponse.json({ error: 'Not enough tickets available' }, { status: 400 })
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: event.currency ?? 'gbp',
          unit_amount: ticketPrice,
          product_data: {
            name: ticketName,
            description: `${event.venue} · ${new Date(event.date).toLocaleDateString('en-GB')}`,
          },
        },
        quantity,
      },
    ],
    customer_email: customerEmail,
    metadata: {
      eventId,
      ticketTypeId: ticketTypeId ?? '',
      customerName,
      customerEmail,
      quantity: String(quantity),
    },
    success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/events/${eventId}`,
  })

  return NextResponse.json({ url: session.url })
}
