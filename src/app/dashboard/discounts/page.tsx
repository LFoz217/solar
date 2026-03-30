import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DiscountsClient from './DiscountsClient'

export default async function DiscountsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: codes } = await supabase
    .from('discount_codes')
    .select('*, events(title)')
    .eq('organiser_id', user.id)
    .order('created_at', { ascending: false })

  const { data: events } = await supabase
    .from('events')
    .select('id, title')
    .eq('organiser_id', user.id)
    .order('date', { ascending: false })

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Discount codes</h1>
      </div>
      <DiscountsClient codes={codes ?? []} events={events ?? []} organiserId={user.id} />
    </div>
  )
}
