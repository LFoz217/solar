-- Migration: Promoter Dashboard Extensions
-- Adds discount codes, guest list, organiser profiles, and waitlist support

-- Add stripe_account_id and profile fields to organisers
alter table organisers
  add column if not exists stripe_account_id text,
  add column if not exists bio text,
  add column if not exists website text,
  add column if not exists logo_url text,
  add column if not exists notify_on_sale boolean default true,
  add column if not exists notify_on_refund boolean default true;

-- Add stripe_payment_intent_id to orders (for refunds)
alter table orders
  add column if not exists stripe_payment_intent_id text,
  add column if not exists refund_amount int,
  add column if not exists refunded_at timestamptz;

-- Add ticket type support to events
alter table events
  add column if not exists image_url text,
  add column if not exists end_date timestamptz,
  add column if not exists tags text[];

-- Discount codes
create table if not exists discount_codes (
  id uuid primary key default gen_random_uuid(),
  organiser_id uuid references organisers(id) on delete cascade,
  event_id uuid references events(id) on delete cascade, -- null = applies to all events
  code text not null,
  type text not null check (type in ('percentage', 'fixed')), -- 'percentage' or 'fixed'
  value int not null, -- percentage (0-100) or pence amount
  max_uses int, -- null = unlimited
  uses_count int default 0,
  expires_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now(),
  unique(organiser_id, code)
);

-- Guest list
create table if not exists guest_list (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  organiser_id uuid references organisers(id) on delete cascade,
  name text not null,
  email text not null,
  notes text,
  order_id uuid references orders(id), -- set when ticket is issued
  added_at timestamptz default now()
);

-- Waitlist
create table if not exists waitlist (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  email text not null,
  name text not null,
  joined_at timestamptz default now(),
  notified_at timestamptz,
  unique(event_id, email)
);

-- UTM / marketing links
create table if not exists marketing_links (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  organiser_id uuid references organisers(id) on delete cascade,
  label text not null,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  click_count int default 0,
  created_at timestamptz default now()
);

-- RLS policies
alter table discount_codes enable row level security;
alter table guest_list enable row level security;
alter table waitlist enable row level security;
alter table marketing_links enable row level security;

create policy "Organisers manage own discount codes"
  on discount_codes for all
  using (organiser_id = auth.uid());

create policy "Organisers manage own guest list"
  on guest_list for all
  using (organiser_id = auth.uid());

create policy "Organisers view waitlist for own events"
  on waitlist for select
  using (
    event_id in (
      select id from events where organiser_id = auth.uid()
    )
  );

create policy "Organisers manage own marketing links"
  on marketing_links for all
  using (organiser_id = auth.uid());
