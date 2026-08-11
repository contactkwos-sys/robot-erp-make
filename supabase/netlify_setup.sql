-- Minimal Netlify / production setup
-- Run this in the Supabase SQL editor if you only need the persistent app store.

create extension if not exists "pgcrypto";

create table if not exists public.app_stores (
  owner_key text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_stores enable row level security;

drop policy if exists app_stores_own on public.app_stores;
create policy app_stores_own on public.app_stores
  for all
  using (auth.uid()::text = owner_key)
  with check (auth.uid()::text = owner_key);

-- Then in Supabase Dashboard → Storage, create PUBLIC buckets:
--   robot-images
--   product-scans
--   documents
