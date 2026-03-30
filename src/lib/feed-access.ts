import { createClient } from '@/lib/supabase/server'

export async function verifyFeedAccess(eventId: string, orderId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('orders')
    .select('id')
    .eq('id', orderId)
    .eq('event_id', eventId)
    .eq('status', 'paid')
    .single()
  return !!data
}
