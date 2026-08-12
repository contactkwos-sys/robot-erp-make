-- Minimal Netlify / production setup
-- Run this in the Supabase SQL editor if you only need the persistent app store.
-- Prefer: supabase/migrations/20260811165000_create_app_stores.sql

create extension if not exists "pgcrypto";

create table if not exists public.app_stores (
  owner_key text primary key,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_stores_payload_is_object check (jsonb_typeof(payload) = 'object')
);

create index if not exists idx_app_stores_updated_at
  on public.app_stores (updated_at desc);

create index if not exists idx_app_stores_payload_gin
  on public.app_stores using gin (payload jsonb_path_ops);

alter table public.app_stores enable row level security;

drop policy if exists app_stores_own on public.app_stores;
create policy app_stores_own on public.app_stores
  for all
  using (auth.uid()::text = owner_key)
  with check (auth.uid()::text = owner_key);

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on table public.app_stores to authenticated, service_role;
grant select on table public.app_stores to anon;
notify pgrst, 'reload schema';

-- Public Storage buckets (fixes "bucket is empty / missing" upload failures)
-- Prefer full file: supabase/migrations/20260812234000_create_storage_buckets.sql
insert into storage.buckets (id, name, public, file_size_limit)
values
  ('robot-images', 'robot-images', true, 10485760),
  ('product-scans', 'product-scans', true, 10485760),
  ('documents', 'documents', true, 20971520)
on conflict (id) do update set public = excluded.public;
