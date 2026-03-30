create table organisers (
  id uuid primary key references auth.users(id),
  name text not null,
  created_at timestamptz default now()
);

create table events (
  id uuid primary key default gen_random_uuid(),
  organiser_id uuid references organisers(id),
  title text not null,
  description text,
  venue text not null,
  date timestamptz not null,
  capacity int not null,
  ticket_price int not null,
  currency text default 'gbp',
  stripe_price_id text,
  stripe_product_id text,
  is_published boolean default false,
  created_at timestamptz default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id),
  customer_email text not null,
  customer_name text not null,
  quantity int not null default 1,
  total_amount int not null,
  stripe_session_id text unique,
  status text default 'pending',
  created_at timestamptz default now()
);

create table tickets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id),
  event_id uuid references events(id),
  ticket_number text unique not null,
  qr_code text unique not null,
  is_scanned boolean default false,
  scanned_at timestamptz,
  created_at timestamptz default now()
);
