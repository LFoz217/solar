import Link from 'next/link'

export default function SellPage() {
  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto border-b border-zinc-800">
        <Link href="/" className="text-xl font-bold uppercase tracking-widest">
          ☀️ SOLAR
        </Link>
        <Link
          href="/login"
          className="text-sm uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
        >
          Promoter login →
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 grain relative">
        <div className="inline-flex items-center gap-2 bg-zinc-900 border-2 border-zinc-700 rounded-none px-4 py-1.5 text-xs text-zinc-400 uppercase tracking-widest mb-8">
          <span className="w-1.5 h-1.5 bg-emerald-400 inline-block" />
          Ticketing for the underground
        </div>
        <h1 className="text-5xl md:text-7xl font-bold uppercase tracking-tight max-w-4xl leading-none">
          Your night.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
            Your money.
          </span>{' '}
          No middleman.
        </h1>
        <p className="mt-6 text-lg text-zinc-400 max-w-xl leading-relaxed">
          Solar is built for DJs, promoters and underground collectives.
          Sell tickets direct — no platform fees, no gatekeepers.
          Just Stripe processing and you keep everything else.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link
            href="/register"
            className="bg-white text-black font-bold uppercase tracking-widest px-8 py-3.5 rounded-none border-2 border-white hover:bg-transparent hover:text-white transition-colors text-sm"
          >
            List your event
          </Link>
          <a
            href="#how-it-works"
            className="border-2 border-zinc-600 text-zinc-300 font-bold uppercase tracking-widest px-8 py-3.5 rounded-none hover:border-white hover:text-white transition-colors text-sm"
          >
            How it works
          </a>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-center text-2xl font-bold mb-14 text-zinc-200 uppercase tracking-widest">
          Dead simple
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Drop your event',
              description:
                'Name it, set your ticket tiers, upload your flyer, and go live. Payments hit your Stripe direct.',
            },
            {
              step: '02',
              title: 'Push the link',
              description:
                'Share it anywhere. Punters buy with a card — no sign-up, no app download. Just tap and they\'re on the list.',
            },
            {
              step: '03',
              title: 'Scan at the door',
              description:
                'Open Solar on your phone, scan the QR. One scan per ticket — no fakes, no printouts, no hassle.',
            },
          ].map(({ step, title, description }) => (
            <div
              key={step}
              className="bg-zinc-900 border-2 border-zinc-700 rounded-none p-6 grain relative"
            >
              <div className="text-xs font-mono text-amber-500 mb-3 uppercase tracking-widest">{step}</div>
              <h3 className="font-bold text-white mb-2 uppercase tracking-wider">{title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-6 py-16 text-center grain relative">
        <h2 className="text-2xl font-bold mb-4 uppercase tracking-widest">Run your own night</h2>
        <p className="text-zinc-400 text-sm mb-8">
          Free to set up. No monthly fees. No contracts. Just you and your crowd.
        </p>
        <Link
          href="/register"
          className="inline-block bg-white text-black font-bold uppercase tracking-widest px-8 py-3.5 rounded-none border-2 border-white hover:bg-transparent hover:text-white transition-colors text-sm"
        >
          Get started →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-zinc-800 px-6 py-8 text-center text-xs text-zinc-600 uppercase tracking-widest">
        Solar — ticketing for the underground.{' '}
        <Link href="/" className="hover:text-zinc-400 transition-colors">
          Browse events
        </Link>
      </footer>
    </div>
  )
}
