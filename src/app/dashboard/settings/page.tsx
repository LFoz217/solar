import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: organiser } = await supabase
    .from('organisers')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Settings</h1>
      <SettingsClient organiser={organiser} userEmail={user.email ?? ''} />
    </div>
  )
}
