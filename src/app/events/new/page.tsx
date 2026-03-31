import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/server'
import CreateEventForm from './CreateEventForm'

export const dynamic = 'force-dynamic'

export default async function NewEventPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black">
        <CreateEventForm userId={user.id} />
      </main>
    </>
  )
}
