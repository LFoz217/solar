import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { verifyFeedAccess } from '@/lib/feed-access'
import FeedClient from './FeedClient'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ order?: string }>
}

export default async function FeedPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { order: orderId } = await searchParams

  if (!orderId) {
    redirect(`/events/${id}`)
  }

  const hasAccess = await verifyFeedAccess(id, orderId)
  if (!hasAccess) {
    redirect(`/events/${id}`)
  }

  const supabase = await createClient()
  const { data: event } = await supabase
    .from('events')
    .select('id, title')
    .eq('id', id)
    .single()

  if (!event) notFound()

  const { data: posts } = await supabase
    .from('feed_posts')
    .select('*')
    .eq('event_id', id)
    .order('created_at', { ascending: false })

  return (
    <FeedClient
      eventId={id}
      eventTitle={event.title}
      orderId={orderId}
      initialPosts={posts ?? []}
    />
  )
}
