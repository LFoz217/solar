'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="border-b border-white/10 px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-xl font-semibold font-mono uppercase tracking-widest">
          ☀️ Solar
        </Link>
        <div className="flex items-center gap-6">
          {user ? (
            <>
              <Link href="/dashboard" className="text-sm text-white/70 hover:text-white transition-colors font-mono uppercase tracking-wider">
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="text-sm text-white/70 hover:text-white transition-colors font-mono uppercase tracking-wider"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-white/70 hover:text-white transition-colors font-mono uppercase tracking-wider">
                Sign in
              </Link>
              <Link
                href="/sell"
                className="text-sm bg-white text-black px-4 py-2 rounded-none font-bold hover:bg-white/90 transition-colors font-mono uppercase tracking-wider border-2 border-white"
              >
                Sell tickets
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
