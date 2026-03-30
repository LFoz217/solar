import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ScanClient from './ScanClient'

export default async function ScanPage({
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
    .select('id, title, date, capacity')
    .eq('organiser_id', user.id)
    .order('date', { ascending: false })

  const selectedEvent = eventId
    ? (events ?? []).find((e) => e.id === eventId)
    : (events ?? [])[0]

  let scanStats = { total: 0, scanned: 0 }
  if (selectedEvent) {
    const { data: tickets } = await supabase
      .from('tickets')
      .select('is_scanned')
      .eq('event_id', selectedEvent.id)

    scanStats.total = tickets?.length ?? 0
    scanStats.scanned = tickets?.filter((t) => t.is_scanned).length ?? 0
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Scan / Door</h1>

      {/* Event selector */}
      <div className="mb-6">
        <label className="text-xs uppercase tracking-wide block mb-2" style={{ color: 'var(--text-muted)' }}>
          Select event
        </label>
        <form method="GET">
          <select name="event" defaultValue={selectedEvent?.id ?? ''}
            onChange="this.form.submit()"
            className="w-full px-3 py-2 text-sm border outline-none"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)', borderRadius: '4px' }}>
            {(events ?? []).map((e) => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
        </form>
      </div>

      {/* Check-in stats */}
      {selectedEvent && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total tickets', value: scanStats.total },
            { label: 'Checked in', value: scanStats.scanned },
            { label: 'Remaining', value: scanStats.total - scanStats.scanned },
          ].map(({ label, value }) => (
            <div key={label} className="px-4 py-3 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', borderRadius: '4px' }}>
              <div className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
              <div className="text-3xl font-bold" style={{ color: value === 0 && label === 'Remaining' ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scanner client component */}
      {selectedEvent ? (
        <ScanClient eventId={selectedEvent.id} eventTitle={selectedEvent.title} />
      ) : (
        <div className="py-12 text-center border" style={{ borderColor: 'var(--border)', borderRadius: '4px' }}>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No events found.</p>
        </div>
      )}
    </div>
  )
}
