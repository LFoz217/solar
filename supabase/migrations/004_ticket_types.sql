-- Add ticket_types table to support multiple ticket tiers per event
create table ticket_types (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  name text not null,
  description text,
  price int not null default 0,
  quantity int not null default 0,
  sold int not null default 0,
  stripe_price_id text,
  sort_order int not null default 0,
  sale_starts timestamptz,
  sale_ends timestamptz,
  created_at timestamptz default now()
);

-- Add ticket_type_id to existing tickets table
alter table tickets add column ticket_type_id uuid references ticket_types(id);

-- Add ticket_type_id to orders table for tracking
alter table orders add column ticket_type_id uuid references ticket_types(id);

-- Remove single ticket_price and capacity from events (moved to ticket_types)
-- We keep them for backward compatibility but they become optional/summary fields

-- RLS policies for ticket_types
alter table ticket_types enable row level security;

create policy "Anyone can view ticket types for published events"
  on ticket_types for select
  using (
    exists (
      select 1 from events where events.id = ticket_types.event_id and events.is_published = true
    )
  );

create policy "Organisers can manage their ticket types"
  on ticket_types for all
  using (
    exists (
      select 1 from events where events.id = ticket_types.event_id and events.organiser_id = auth.uid()
    )
  );
