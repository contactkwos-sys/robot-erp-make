-- AI Robot Builder — persistent document store
-- Required for Netlify/production. The app stores the full AppStore JSON
-- document in public.app_stores (one row per owner_key).
--
-- Apply with Supabase SQL editor or:
--   psql "$DATABASE_URL" -f supabase/migrations/20260811165000_create_app_stores.sql

create extension if not exists "pgcrypto";

create table if not exists public.app_stores (
  owner_key text primary key,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_stores_payload_is_object check (jsonb_typeof(payload) = 'object')
);

comment on table public.app_stores is
  'AI Robot Builder document store. payload holds users, robot_projects, inventory, and related collections.';

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

-- Expose table through PostgREST (public schema API)
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on table public.app_stores to authenticated, service_role;
grant select on table public.app_stores to anon;

-- Refresh PostgREST schema cache so the new table is visible immediately
notify pgrst, 'reload schema';
