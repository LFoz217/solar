import Link from 'next/link'

export default function SellPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <Link href="/" className="text-xl font-bold tracking-tight">
          ☀️ Solar
        </Link>
        <Link
          href="/login"
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          Organiser login →
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-24 pb-20">
        <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-1.5 text-xs text-zinc-400 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          No platform fees. Ever.
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight max-w-3xl leading-tight">
          Sell tickets.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
            No platform fees.
          </span>{' '}
          Only Stripe.
        </h1>
        <p className="mt-6 text-lg text-zinc-400 max-w-xl">
          Solar gives promoters and event organisers a direct line to their
          audience. You set the price, you keep the money — minus only Stripe&apos;s
          standard processing fee.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link
            href="/register"
            className="bg-white text-black font-semibold px-8 py-3.5 rounded-lg hover:bg-zinc-100 transition-colors text-sm"
          >
            Create an event
          </Link>
          <a
            href="#how-it-works"
            className="border border-zinc-700 text-zinc-300 font-medium px-8 py-3.5 rounded-lg hover:border-zinc-500 hover:text-white transition-colors text-sm"
          >
            How it works
          </a>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-center text-2xl font-bold mb-14 text-zinc-200">
          Simple from start to door
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Create your event',
              description:
                'Add your event details, set your ticket price, and publish in minutes. Your Stripe account receives payments directly.',
            },
            {
              step: '02',
              title: 'Sell tickets',
              description:
                'Share your event link. Attendees buy with a card — no account needed. Stripe handles the payment, you get the money.',
            },
            {
              step: '03',
              title: 'Scan at the door',
              description:
                "Use Solar's built-in QR scanner on any phone. Each ticket is validated once — no duplicates, no printouts needed.",
            },
          ].map(({ step, title, description }) => (
            <div
              key={step}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
            >
              <div className="text-xs font-mono text-amber-500 mb-3">{step}</div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to sell tickets?</h2>
        <p className="text-zinc-400 text-sm mb-8">
          Create a free organiser account. No credit card required.
        </p>
        <Link
          href="/register"
          className="inline-block bg-white text-black font-semibold px-8 py-3.5 rounded-lg hover:bg-zinc-100 transition-colors text-sm"
        >
          Get started free →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 px-6 py-8 text-center text-xs text-zinc-600">
        Solar — direct ticketing for independent promoters.{' '}
        <Link href="/" className="hover:text-zinc-400 transition-colors">
          Browse events
        </Link>
      </footer>
    </div>
  )
}
