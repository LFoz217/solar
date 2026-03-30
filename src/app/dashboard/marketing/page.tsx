import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MarketingClient from './MarketingClient'

export default async function MarketingPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>
}) {
  const { event: eventId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: events } = await supabase
    .from('events')
    .select('id, title')
    .eq('organiser_id', user.id)
    .order('date', { ascending: false })

  const selectedId = eventId ?? events?.[0]?.id

  let links: Record<string, unknown>[] = []
  if (selectedId) {
    const { data } = await supabase
      .from('marketing_links')
      .select('*')
      .eq('event_id', selectedId)
      .order('created_at', { ascending: false })
    links = data ?? []
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Marketing</h1>
      <MarketingClient
        events={events ?? []}
        selectedEventId={selectedId ?? null}
        links={links}
        organiserId={user.id}
        appUrl={appUrl}
      />
    </div>
  )
}
