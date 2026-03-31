-- Add cover image and social links to events
alter table events add column cover_image_url text;
alter table events add column social_instagram text;
alter table events add column social_x text;
alter table events add column social_tiktok text;
alter table events add column social_website text;

-- Create storage bucket for event images
insert into storage.buckets (id, name, public)
values ('event-images', 'event-images', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload to event-images bucket
create policy "Authenticated users can upload event images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'event-images');

-- Allow public read access to event images
create policy "Anyone can view event images"
  on storage.objects for select
  using (bucket_id = 'event-images');

-- Allow organisers to delete their own event images
create policy "Users can delete their own event images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'event-images' and auth.uid()::text = (storage.foldername(name))[1]);
