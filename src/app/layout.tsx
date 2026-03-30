import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Solar — Transparent ticketing',
  description: 'Sell tickets directly. Transparent fees. Real-time payouts via Stripe.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  )
}
