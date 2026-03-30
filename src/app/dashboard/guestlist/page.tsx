import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GuestListClient from './GuestListClient'

export default async function GuestListPage({
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
    .select('id, title, date')
    .eq('organiser_id', user.id)
    .order('date', { ascending: false })

  const selectedId = eventId ?? events?.[0]?.id

  let guests: Record<string, unknown>[] = []
  if (selectedId) {
    const { data } = await supabase
      .from('guest_list')
      .select('*, orders(status)')
      .eq('event_id', selectedId)
      .order('added_at', { ascending: false })
    guests = data ?? []
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Guest list</h1>
      <GuestListClient
        events={events ?? []}
        selectedEventId={selectedId ?? null}
        guests={guests}
        organiserId={user.id}
      />
    </div>
  )
}
