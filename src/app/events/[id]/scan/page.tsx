import { notFound, redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/server'
import QRScanner from './QRScanner'

export const dynamic = 'force-dynamic'

export default async function ScanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: event } = await supabase
    .from('events')
    .select('id, title, venue, date')
    .eq('id', id)
    .eq('organiser_id', user.id)
    .single()

  if (!event) notFound()

  return (
    <>
      <Navbar />
      <main className="max-w-lg mx-auto px-6 py-8">
        <div className="mb-6">
          <a href={`/events/${id}/manage`} className="text-white/40 hover:text-white/70 text-sm transition-colors">
            ← Back to event
          </a>
        </div>
        <h1 className="text-2xl font-bold mb-1">{event.title}</h1>
        <p className="text-white/50 text-sm mb-8">{event.venue}</p>
        <QRScanner eventId={event.id} />
      </main>
    </>
  )
}
