import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function fmt(pence: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pence / 100)
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function PayoutsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: organiser } = await supabase
    .from('organisers')
    .select('stripe_account_id')
    .eq('id', user.id)
    .single()

  const { data: myEvents } = await supabase
    .from('events')
    .select('id, title')
    .eq('organiser_id', user.id)

  const eventIds = (myEvents ?? []).map((e) => e.id)

  const { data: paidOrders } = await supabase
    .from('orders')
    .select('event_id, quantity, total_amount, created_at')
    .in('event_id', eventIds.length > 0 ? eventIds : ['none'])
    .eq('status', 'paid')
    .order('created_at', { ascending: false })

  const { data: refundedOrders } = await supabase
    .from('orders')
    .select('total_amount, refund_amount')
    .in('event_id', eventIds.length > 0 ? eventIds : ['none'])
    .eq('status', 'refunded')

  const grossRevenue = (paidOrders ?? []).reduce((s, o) => s + o.total_amount, 0)
  const totalTickets = (paidOrders ?? []).reduce((s, o) => s + o.quantity, 0)
  const solarFees = (paidOrders ?? []).reduce(
    (s, o) => s + Math.round(o.total_amount * 0.05) + 49 * o.quantity, 0
  )
  const refundsTotal = (refundedOrders ?? []).reduce(
    (s, o) => s + (o.refund_amount ?? o.total_amount), 0
  )
  const netRevenue = grossRevenue - solarFees - refundsTotal

  // Group by month for history
  const byMonth: Record<string, { gross: number; fees: number; orders: number }> = {}
  for (const o of paidOrders ?? []) {
    const month = o.created_at.slice(0, 7)
    if (!byMonth[month]) byMonth[month] = { gross: 0, fees: 0, orders: 0 }
    byMonth[month].gross += o.total_amount
    byMonth[month].fees += Math.round(o.total_amount * 0.05) + 49 * o.quantity
    byMonth[month].orders += 1
  }
  const months = Object.entries(byMonth).sort((a, b) => b[0].localeCompare(a[0]))

  const hasStripe = !!organiser?.stripe_account_id

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Payouts</h1>

      {/* Stripe Connect status */}
      <div className="mb-6 p-4 border flex items-center justify-between gap-4"
        style={{ background: 'var(--bg-surface)', borderColor: hasStripe ? 'var(--accent)' : 'var(--border)', borderRadius: '4px' }}>
        <div>
          <div className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>
            {hasStripe ? 'Stripe Connect active' : 'Connect your Stripe account'}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {hasStripe
              ? 'Payouts go directly to your bank account in real time after each sale.'
              : 'Connect Stripe to receive real-time payouts. Funds land in your account within minutes of each sale.'}
          </div>
        </div>
        {!hasStripe && (
          <Link href="/api/stripe/connect"
            className="text-sm font-semibold px-4 py-2 shrink-0"
            style={{ background: 'var(--accent)', color: '#fff', borderRadius: '4px' }}>
            Connect Stripe →
          </Link>
        )}
        {hasStripe && (
          <span className="text-xs px-2 py-1 shrink-0"
            style={{ background: 'rgba(249,115,22,0.1)', color: 'var(--accent)', borderRadius: '3px' }}>
            ✓ Connected
          </span>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Gross revenue', value: fmt(grossRevenue) },
          { label: 'Solar fees', value: fmt(solarFees), sub: '5% + 49p/ticket' },
          { label: 'Refunds issued', value: fmt(refundsTotal) },
          { label: 'Net to you', value: fmt(netRevenue) },
        ].map(({ label, value, sub }) => (
          <div key={label} className="px-4 py-3 border"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', borderRadius: '4px' }}>
            <div className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</div>
            {sub && <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</div>}
          </div>
        ))}
      </div>

      {/* Fee transparency box */}
      <div className="mb-8 p-4 border"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', borderRadius: '4px' }}>
        <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
          Fee breakdown: {totalTickets} tickets sold
        </div>
        <div className="text-sm space-y-2">
          {[
            { label: 'Gross ticket sales', value: fmt(grossRevenue), muted: false },
            { label: `Solar fee (5% = ${fmt(Math.round(grossRevenue * 0.05))})`, value: `–${fmt(Math.round(grossRevenue * 0.05))}`, muted: true },
            { label: `Per-ticket fee (49p × ${totalTickets} = ${fmt(49 * totalTickets)})`, value: `–${fmt(49 * totalTickets)}`, muted: true },
            { label: 'Refunds', value: `–${fmt(refundsTotal)}`, muted: true },
          ].map(({ label, value, muted }) => (
            <div key={label} className="flex justify-between">
              <span style={{ color: muted ? 'var(--text-muted)' : 'var(--text-secondary)' }}>{label}</span>
              <span style={{ color: muted ? 'var(--text-muted)' : 'var(--text-primary)' }}>{value}</span>
            </div>
          ))}
          <div className="pt-2 border-t flex justify-between font-semibold"
            style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
            <span>Net to you</span>
            <span style={{ color: 'var(--accent)' }}>{fmt(netRevenue)}</span>
          </div>
        </div>
      </div>

      {/* Monthly history */}
      <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
        Monthly history
      </h2>
      <div className="border" style={{ borderColor: 'var(--border)', borderRadius: '4px' }}>
        {months.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No payout history yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                {['Month', 'Orders', 'Gross', 'Fees', 'Net'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium"
                    style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {months.map(([month, data]) => {
                const d = new Date(month + '-01')
                const label = d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
                const net = data.gross - data.fees
                return (
                  <tr key={month} className="border-b last:border-0"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{label}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{data.orders}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{fmt(data.gross)}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{fmt(data.fees)}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: 'var(--accent)' }}>{fmt(net)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
