-- organisers (auth handled by Supabase Auth, this extends the user)
create table organisers (
  id uuid primary key references auth.users(id),
  name text not null,
  stripe_account_id text,
  created_at timestamptz default now()
);

-- events
create table events (
  id uuid primary key default gen_random_uuid(),
  organiser_id uuid references organisers(id),
  title text not null,
  description text,
  venue text not null,
  date timestamptz not null,
  capacity int not null,
  ticket_price int not null, -- pence
  currency text default 'gbp',
  stripe_price_id text,
  stripe_product_id text,
  is_published boolean default false,
  created_at timestamptz default now()
);

-- orders
create table orders (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id),
  customer_email text not null,
  customer_name text not null,
  quantity int not null default 1,
  total_amount int not null, -- pence
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  status text default 'pending', -- pending | paid | refunded
  created_at timestamptz default now()
);

-- tickets
create table tickets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id),
  event_id uuid references events(id),
  ticket_number text unique not null, -- human-readable e.g. SOL-00001
  qr_code text unique not null, -- UUID used as QR payload
  is_scanned boolean default false,
  scanned_at timestamptz,
  created_at timestamptz default now()
);

-- Row Level Security
alter table organisers enable row level security;
alter table events enable row level security;
alter table orders enable row level security;
alter table tickets enable row level security;

-- Organiser policies
create policy "Organisers can view own profile" on organisers for select using (auth.uid() = id);
create policy "Organisers can update own profile" on organisers for update using (auth.uid() = id);
create policy "Organisers can insert own profile" on organisers for insert with check (auth.uid() = id);

-- Events policies
create policy "Anyone can view published events" on events for select using (is_published = true);
create policy "Organisers can view own events" on events for select using (auth.uid() = organiser_id);
create policy "Organisers can insert events" on events for insert with check (auth.uid() = organiser_id);
create policy "Organisers can update own events" on events for update using (auth.uid() = organiser_id);
create policy "Organisers can delete own events" on events for delete using (auth.uid() = organiser_id);

-- Orders policies
create policy "Organisers can view orders for own events" on orders for select using (
  exists (select 1 from events where events.id = orders.event_id and events.organiser_id = auth.uid())
);
create policy "Service role can insert orders" on orders for insert with check (true);
create policy "Service role can update orders" on orders for update using (true);

-- Tickets policies
create policy "Anyone can view tickets by id" on tickets for select using (true);
create policy "Service role can insert tickets" on tickets for insert with check (true);
create policy "Service role can update tickets" on tickets for update using (true);
