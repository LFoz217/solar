import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id } = await searchParams

  if (!session_id) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <p className="text-zinc-500">No session found.</p>
      </div>
    )
  }

  const supabase = await createClient()

  const { data: order } = await supabase
    .from('orders')
    .select('*, event:events(*)')
    .eq('stripe_session_id', session_id)
    .single()

  if (!order) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-zinc-400 mb-2">Your payment was received.</p>
          <p className="text-zinc-600 text-sm">Tickets may take a moment to appear.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold mb-2">You&apos;re going!</h1>
        <p className="text-zinc-400 mb-8">
          Tickets have been sent to <span className="text-white">{order.customer_email}</span>
        </p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-left mb-6">
          <h2 className="font-semibold text-white mb-4">{order.event.title}</h2>
          <div className="space-y-2 text-sm text-zinc-400">
            <div className="flex justify-between">
              <span>Date</span>
              <span className="text-zinc-200">{formatDate(order.event.date)}</span>
            </div>
            <div className="flex justify-between">
              <span>Venue</span>
              <span className="text-zinc-200">{order.event.venue}</span>
            </div>
            <div className="flex justify-between">
              <span>Tickets</span>
              <span className="text-zinc-200">{order.quantity}</span>
            </div>
          </div>
        </div>

        <Link
          href={`/tickets/${order.id}`}
          className="block w-full bg-white text-black font-semibold py-3 rounded-lg text-sm hover:bg-zinc-100 transition-colors"
        >
          View my tickets →
        </Link>
      </div>
    </div>
  )
}
