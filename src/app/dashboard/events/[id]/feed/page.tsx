import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OrgFeedManager from './OrgFeedManager'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function OrgFeedPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: organiser } = await supabase
    .from('organisers')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()
  if (!organiser) redirect('/login')

  const { data: event } = await supabase
    .from('events')
    .select('id, title, organiser_id')
    .eq('id', id)
    .eq('organiser_id', organiser.id)
    .single()
  if (!event) redirect('/dashboard')

  const { data: posts } = await supabase
    .from('feed_posts')
    .select('*')
    .eq('event_id', id)
    .order('created_at', { ascending: false })

  return <OrgFeedManager eventId={id} eventTitle={event.title} initialPosts={posts ?? []} />
}
