alter table events add column if not exists feed_post_count int default 0;

create table if not exists feed_posts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  organiser_id uuid references organisers(id),
  content text not null,
  image_url text,
  post_type text default 'update' check (post_type in ('update', 'announcement', 'exclusive')),
  created_at timestamptz default now()
);

create index if not exists feed_posts_event_id_idx on feed_posts(event_id);
create index if not exists feed_posts_created_at_idx on feed_posts(created_at desc);
