import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const { title, description, venue, date, capacity, ticketPrice, organiserId } =
    await request.json()

  if (!title || !venue || !date || !capacity || ticketPrice === undefined || !organiserId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Verify the user is authenticated and matches organiserId
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.id !== organiserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Create Stripe product
  const product = await stripe.products.create({
    name: title,
    description: description ?? undefined,
  })

  // Create Stripe price (in pence)
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: ticketPrice,
    currency: 'gbp',
  })

  // Ensure organiser record exists
  const serviceClient = await createServiceClient()
  await serviceClient.from('organisers').upsert(
    { id: user.id, name: user.email ?? 'Organiser' },
    { onConflict: 'id', ignoreDuplicates: true }
  )

  // Insert event
  const { data: event, error } = await serviceClient
    .from('events')
    .insert({
      organiser_id: organiserId,
      title,
      description: description || null,
      venue,
      date: new Date(date).toISOString(),
      capacity,
      ticket_price: ticketPrice,
      currency: 'gbp',
      stripe_product_id: product.id,
      stripe_price_id: price.id,
      is_published: true,
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create event:', error)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }

  return NextResponse.json({ event })
}
