import type { Metadata } from 'next'
import { Space_Mono } from 'next/font/google'
import './globals.css'

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
})

export const metadata: Metadata = {
  title: 'Solar — Transparent ticketing',
  description: 'Sell tickets directly. Transparent fees. Real-time payouts via Stripe.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full ${spaceMono.variable}`}>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  )
}
