# ☀️ Solar

A ticket-selling platform with no platform fees — only Stripe's standard payment processing (~1.4% + 20p per transaction for UK cards).

## Stack

- **Next.js 15** with TypeScript and App Router
- **Supabase** — Postgres, Auth, Row Level Security
- **Stripe Checkout** — standard payment processing
- **Resend** — transactional email delivery
- **react-qr-code** — QR code generation
- **qr-scanner** — WebAssembly-powered QR scanner for door staff
- **Tailwind CSS** — dark-mode first design
- **Vercel** — deployment target

## Setup

### 1. Clone and install

```bash
git clone <repo>
cd solar
npm install
```

### 2. Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the migration in `supabase/migrations/20240101000000_initial_schema.sql` via the SQL editor
3. Copy your project URL and API keys

### 3. Stripe

> **Important:** Solar requires its own **dedicated Stripe account**. Do not share a Stripe account with other products (e.g. Based or any other platform). Create a brand new Stripe account specifically for Solar so that payouts, reporting, and webhook events are fully isolated.
>
> Solar uses **standard Stripe Checkout** — there is no Stripe Connect, no platform fees, no linked accounts. Every payment goes directly to your Solar Stripe account.

1. Create a dedicated account at [stripe.com](https://stripe.com)
2. Get your publishable and secret keys from the Developers → API keys section
3. Set up a webhook endpoint pointing to `https://yourdomain.com/api/webhooks/stripe`
4. Select the `checkout.session.completed` event
5. Copy the webhook signing secret

### 4. Resend

1. Create an account at [resend.com](https://resend.com)
2. Add and verify your sending domain
3. Create an API key

### 5. Environment variables

Copy `.env.local.example` to `.env.local` and fill in all values:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
RESEND_API_KEY=re_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 6. Run locally

```bash
npm run dev
```

For Stripe webhooks locally, use the Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Deployment (Vercel)

1. Push to GitHub
2. Import to Vercel
3. Add all environment variables in the Vercel dashboard
4. Update `NEXT_PUBLIC_APP_URL` to your production URL
5. Update the Stripe webhook endpoint to your production URL

## Features

- **Organiser accounts** — email/password auth via Supabase
- **Event management** — create, publish, and manage events
- **Ticket sales** — Stripe Checkout with no platform fees
- **QR tickets** — each ticket gets a unique QR code, emailed instantly
- **Door scanning** — mobile-first QR scanner using device camera
- **Revenue tracking** — see orders, revenue, and scan counts per event

## Route structure

```
/                           Landing page with event listings
/login                      Organiser sign in
/register                   Organiser sign up
/events/[id]                Public event page with buy form
/tickets/[id]               Customer ticket view with QR code
/success                    Post-payment confirmation
/dashboard                  Organiser event list
/events/new                 Create event form
/events/[id]/manage         Event stats, orders, publish toggle
/events/[id]/scan           Camera QR scanner for door staff
/api/checkout               Create Stripe Checkout session
/api/webhooks/stripe        Stripe webhook handler
/api/tickets/validate       Validate QR scan
```
