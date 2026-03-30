'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function PublishToggle({ eventId, isPublished }: { eventId: string; isPublished: boolean }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const toggle = async () => {
    setLoading(true)
    await supabase
      .from('events')
      .update({ is_published: !isPublished })
      .eq('id', eventId)
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="border border-white/20 text-white/70 hover:text-white hover:border-white/40 px-5 py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
    >
      {loading ? '…' : isPublished ? 'Unpublish' : 'Publish'}
    </button>
  )
}
