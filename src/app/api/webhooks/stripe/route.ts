import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { sendTicketEmail } from '@/lib/email'
import type Stripe from 'stripe'

function generateTicketNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = 'SOL-'
  for (let i = 0; i < 5; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

function generateUUID(): string {
  return crypto.randomUUID()
}

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session

  const { eventId, customerName, customerEmail, quantity } = session.metadata ?? {}

  if (!eventId || !customerName || !customerEmail || !quantity) {
    return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  // Check for duplicate webhook delivery
  const { data: existing } = await supabase
    .from('orders')
    .select('id')
    .eq('stripe_session_id', session.id)
    .single()

  if (existing) {
    return NextResponse.json({ received: true })
  }

  const qty = Number(quantity)

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      event_id: eventId,
      customer_email: customerEmail,
      customer_name: customerName,
      quantity: qty,
      total_amount: session.amount_total ?? 0,
      stripe_session_id: session.id,
      status: 'paid',
    })
    .select()
    .single()

  if (orderError || !order) {
    console.error('Failed to create order:', orderError)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }

  // Generate tickets (one per quantity)
  // Ensure unique ticket numbers by generating and checking
  const ticketsToInsert = []
  const usedNumbers = new Set<string>()

  for (let i = 0; i < qty; i++) {
    let ticketNumber = generateTicketNumber()
    while (usedNumbers.has(ticketNumber)) {
      ticketNumber = generateTicketNumber()
    }
    usedNumbers.add(ticketNumber)

    ticketsToInsert.push({
      order_id: order.id,
      event_id: eventId,
      ticket_number: ticketNumber,
      qr_code: generateUUID(),
    })
  }

  const { data: tickets, error: ticketsError } = await supabase
    .from('tickets')
    .insert(ticketsToInsert)
    .select()

  if (ticketsError || !tickets) {
    console.error('Failed to create tickets:', ticketsError)
    return NextResponse.json({ error: 'Failed to create tickets' }, { status: 500 })
  }

  // Fetch event details for email
  const { data: eventData } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (eventData) {
    try {
      await sendTicketEmail({
        to: customerEmail,
        customerName,
        event: eventData,
        tickets,
        orderId: order.id,
      })
    } catch (err) {
      // Email failure is non-fatal — tickets are created, just log it
      console.error('Failed to send ticket email:', err)
    }
  }

  return NextResponse.json({ received: true })
}
