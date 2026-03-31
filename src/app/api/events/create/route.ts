import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const { title, description, venue, date, ticketTypes, isPublished, organiserId, coverImageUrl, socialInstagram, socialX, socialTiktok, socialWebsite } = await request.json()

  // Validate - support both old single-ticket and new multi-ticket format
  if (!title || !venue || !date || !organiserId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!ticketTypes || !Array.isArray(ticketTypes) || ticketTypes.length === 0) {
    return NextResponse.json({ error: 'At least one ticket type is required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== organiserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Create Stripe product for the event
  const product = await stripe.products.create({
    name: title,
    description: description ?? undefined,
  })

  // Create Stripe prices for each ticket type
  const ticketTypesWithStripe = await Promise.all(
    ticketTypes.map(async (tt: { name: string; price: number; quantity: number }, index: number) => {
      const stripePrice = await stripe.prices.create({
        product: product.id,
        unit_amount: tt.price,
        currency: 'gbp',
        nickname: tt.name,
      })
      return { ...tt, stripe_price_id: stripePrice.id, sort_order: index }
    })
  )

  // Ensure organiser record exists
  const serviceClient = await createServiceClient()
  const meta = user.user_metadata ?? {}
  const organiserName = meta.first_name && meta.last_name
    ? `${meta.first_name} ${meta.last_name}`
    : (user.email ?? 'Organiser')
  await serviceClient.from('organisers').upsert(
    { id: user.id, name: organiserName },
    { onConflict: 'id', ignoreDuplicates: true }
  )

  // Calculate summary fields for backward compatibility
  const totalCapacity = ticketTypes.reduce((sum: number, tt: { quantity: number }) => sum + tt.quantity, 0)
  const lowestPrice = Math.min(...ticketTypes.map((tt: { price: number }) => tt.price))

  // Insert event
  const { data: event, error } = await serviceClient
    .from('events')
    .insert({
      organiser_id: organiserId,
      title,
      description: description || null,
      venue,
      date: new Date(date).toISOString(),
      capacity: totalCapacity,
      ticket_price: lowestPrice,
      currency: 'gbp',
      stripe_product_id: product.id,
      stripe_price_id: ticketTypesWithStripe[0].stripe_price_id,
      cover_image_url: coverImageUrl || null,
      social_instagram: socialInstagram || null,
      social_x: socialX || null,
      social_tiktok: socialTiktok || null,
      social_website: socialWebsite || null,
      is_published: isPublished ?? true,
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create event:', error)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }

  // Insert ticket types
  const ticketTypeRecords = ticketTypesWithStripe.map((tt) => ({
    event_id: event.id,
    name: tt.name,
    price: tt.price,
    quantity: tt.quantity,
    sold: 0,
    stripe_price_id: tt.stripe_price_id,
    sort_order: tt.sort_order,
  }))

  const { error: ttError } = await serviceClient
    .from('ticket_types')
    .insert(ticketTypeRecords)

  if (ttError) {
    console.error('Failed to create ticket types:', ttError)
    // Event was created but ticket types failed - still return event
  }

  return NextResponse.json({ event })
}
