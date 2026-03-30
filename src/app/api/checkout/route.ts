import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const { eventId, customerName, customerEmail, quantity } = await request.json()

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

  // Check capacity
  const { data: soldData } = await supabase
    .from('orders')
    .select('quantity')
    .eq('event_id', eventId)
    .eq('status', 'paid')

  const totalSold = (soldData ?? []).reduce((sum, o) => sum + o.quantity, 0)
  if (totalSold + quantity > event.capacity) {
    return NextResponse.json({ error: 'Not enough tickets available' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: event.currency ?? 'gbp',
          unit_amount: event.ticket_price,
          product_data: {
            name: `${event.title} — Ticket`,
            description: `${event.venue} · ${new Date(event.date).toLocaleDateString('en-GB')}`,
          },
        },
        quantity,
      },
    ],
    customer_email: customerEmail,
    metadata: {
      eventId,
      customerName,
      customerEmail,
      quantity: String(quantity),
    },
    success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/events/${eventId}`,
  })

  return NextResponse.json({ url: session.url })
}
