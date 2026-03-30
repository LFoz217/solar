import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-01-27.acacia' })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const orderId = formData.get('orderId') as string

  // Verify organiser owns this order
  const { data: order } = await supabase
    .from('orders')
    .select('*, events(organiser_id)')
    .eq('id', orderId)
    .single()

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const event = order.events as { organiser_id: string }
  if (event.organiser_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (order.status !== 'paid') {
    return NextResponse.json({ error: 'Order cannot be refunded' }, { status: 400 })
  }

  try {
    // Issue Stripe refund
    if (order.stripe_payment_intent_id) {
      await stripe.refunds.create({ payment_intent: order.stripe_payment_intent_id })
    }

    // Update order status
    await supabase
      .from('orders')
      .update({ status: 'refunded', refunded_at: new Date().toISOString() })
      .eq('id', orderId)

    // Redirect back to orders page
    return NextResponse.redirect(new URL('/dashboard/orders?refunded=1', req.url))
  } catch (err) {
    const error = err as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
