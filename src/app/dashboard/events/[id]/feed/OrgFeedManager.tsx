'use client'

import { useState } from 'react'

interface FeedPost {
  id: string
  event_id: string
  content: string
  image_url: string | null
  post_type: string
  created_at: string
}

interface Props {
  eventId: string
  eventTitle: string
  initialPosts: FeedPost[]
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

export default function OrgFeedManager({ eventId, eventTitle, initialPosts }: Props) {
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts)
  const [content, setContent] = useState('')
  const [postType, setPostType] = useState('update')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    if (!content.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/feed/${eventId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, post_type: postType }),
      })
      if (!res.ok) throw new Error('Failed to post')
      const newPost = await res.json()
      setPosts([newPost, ...posts])
      setContent('')
    } catch {
      setError('Failed to post. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function deletePost(postId: string) {
    if (!confirm('Delete this post?')) return
    await fetch(`/api/feed/${eventId}/${postId}`, { method: 'DELETE' })
    setPosts(posts.filter((p) => p.id !== postId))
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'Outfit, sans-serif', padding: '24px 16px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <a href="/dashboard" style={{ color: '#555', fontSize: 13, textDecoration: 'none' }}>← Dashboard</a>
          <h1 style={{ margin: '8px 0 2px', fontSize: 20, fontWeight: 700 }}>{eventTitle}</h1>
          <p style={{ margin: 0, color: '#555', fontSize: 13 }}>Event Feed</p>
        </div>

        <div style={{ background: '#111', borderRadius: 12, padding: 20, marginBottom: 32 }}>
          <select
            value={postType}
            onChange={(e) => setPostType(e.target.value)}
            style={{ width: '100%', background: '#1a1a1a', border: '1px solid #222', borderRadius: 8, color: '#fff', padding: '10px 12px', fontSize: 14, marginBottom: 12 }}
          >
            <option value="update">Update</option>
            <option value="announcement">Announcement</option>
            <option value="exclusive">Exclusive</option>
          </select>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a post for ticket holders..."
            rows={4}
            style={{ width: '100%', background: '#1a1a1a', border: '1px solid #222', borderRadius: 8, color: '#fff', padding: '10px 12px', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
          />
          {error && <p style={{ color: '#ff5252', fontSize: 13, margin: '8px 0' }}>{error}</p>}
          <button
            onClick={submit}
            disabled={submitting || !content.trim()}
            style={{ marginTop: 10, background: '#00e676', color: '#000', border: 'none', borderRadius: 8, padding: '12px 24px', fontWeight: 700, fontSize: 14, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting || !content.trim() ? 0.5 : 1 }}
          >
            {submitting ? 'Posting...' : 'Post'}
          </button>
        </div>

        {posts.length === 0 ? (
          <p style={{ color: '#444', textAlign: 'center' }}>No posts yet. Post your first update above.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {posts.map((post) => (
              <div key={post.id} style={{ background: '#111', borderRadius: 10, padding: '14px 16px', borderLeft: `3px solid ${POST_TYPE_COLORS[post.post_type] ?? '#00e676'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 11, color: POST_TYPE_COLORS[post.post_type] ?? '#00e676', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {post.post_type}
                    </span>
                    <p style={{ margin: '6px 0 0', fontSize: 14, color: '#ddd', lineHeight: 1.5 }}>{post.content}</p>
                    <p style={{ margin: '6px 0 0', fontSize: 11, color: '#444' }}>{timeAgo(post.created_at)}</p>
                  </div>
                  <button
                    onClick={() => deletePost(post.id)}
                    style={{ marginLeft: 12, background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 16, padding: 4 }}
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
