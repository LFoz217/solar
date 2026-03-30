'use client'

import { useEffect, useState, useCallback } from 'react'

interface FeedPost {
  id: string
  event_id: string
  content: string
  image_url: string | null
  post_type: string
  created_at: string
}

interface FeedClientProps {
  eventId: string
  eventTitle: string
  orderId: string
  initialPosts: FeedPost[]
}

const POST_TYPE_LABELS: Record<string, string> = {
  update: 'Update',
  announcement: 'Announcement',
  exclusive: 'Exclusive',
}

const POST_TYPE_COLORS: Record<string, string> = {
  update: '#00e676',
  announcement: '#ffd600',
  exclusive: '#b388ff',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function FeedClient({ eventId, eventTitle, orderId, initialPosts }: FeedClientProps) {
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/feed/${eventId}`)
      if (res.ok) {
        const data = await res.json()
        setPosts(data)
      }
    } catch {
      // silent
    }
  }, [eventId])

  useEffect(() => {
    const interval = setInterval(refresh, 30000)
    return () => clearInterval(interval)
  }, [refresh])

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'Outfit, sans-serif', padding: '24px 16px' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <p style={{ color: '#666', fontSize: 13, margin: '0 0 4px' }}>Event Feed</p>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{eventTitle}</h1>
        </div>

        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#444', paddingTop: 64 }}>
            <p style={{ fontSize: 16 }}>No posts yet.</p>
            <p style={{ fontSize: 13 }}>Check back soon for updates from the organiser.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {posts.map((post) => (
              <div
                key={post.id}
                style={{
                  background: '#111',
                  borderRadius: 12,
                  padding: '16px 18px',
                  borderLeft: `3px solid ${POST_TYPE_COLORS[post.post_type] ?? '#00e676'}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: POST_TYPE_COLORS[post.post_type] ?? '#00e676',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}>
                    {POST_TYPE_LABELS[post.post_type] ?? 'Update'}
                  </span>
                  <span style={{ fontSize: 12, color: '#555' }}>{timeAgo(post.created_at)}</span>
                </div>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: '#e0e0e0' }}>{post.content}</p>
                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt=""
                    style={{ marginTop: 12, width: '100%', borderRadius: 8, display: 'block' }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: 11, color: '#333', marginTop: 40 }}>
          Refreshes every 30s · Order {orderId.slice(0, 8)}
        </p>
      </div>
    </div>
  )
}
