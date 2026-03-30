import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const { qrCode } = await request.json()

  if (!qrCode) {
    return NextResponse.json({ valid: false, reason: 'invalid' })
  }

  const supabase = await createServiceClient()

  const { data: ticket } = await supabase
    .from('tickets')
    .select('*, order:orders(customer_name), event:events(title)')
    .eq('qr_code', qrCode)
    .single()

  if (!ticket) {
    return NextResponse.json({ valid: false, reason: 'invalid' })
  }

  if (ticket.is_scanned) {
    return NextResponse.json({
      valid: false,
      reason: 'already_scanned',
      scannedAt: ticket.scanned_at,
    })
  }

  // Mark as scanned
  const { error } = await supabase
    .from('tickets')
    .update({ is_scanned: true, scanned_at: new Date().toISOString() })
    .eq('id', ticket.id)

  if (error) {
    return NextResponse.json({ valid: false, reason: 'invalid' }, { status: 500 })
  }

  return NextResponse.json({
    valid: true,
    ticketNumber: ticket.ticket_number,
    customerName: (ticket.order as { customer_name: string })?.customer_name ?? 'Unknown',
    eventTitle: (ticket.event as { title: string })?.title ?? 'Event',
  })
}
