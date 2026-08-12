-- AI Robot Builder — Supabase PostgreSQL schema
-- Run in Supabase SQL editor. Enables RLS so users only access their own data.
--
-- REQUIRED for Netlify/production (persistent store, no local filesystem):
--   1) Run this SQL (at minimum the app_stores section below)
--   2) Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
--   3) Create public storage buckets: robot-images, product-scans, documents

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Persistent application document store (used by Netlify / serverless)
-- Preferred migration path: supabase/migrations/20260811165000_create_app_stores.sql
-- ---------------------------------------------------------------------------
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

-- Authenticated users can manage their own document store row.
-- Server-side Netlify functions should use SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).
drop policy if exists app_stores_own on public.app_stores;
create policy app_stores_own on public.app_stores
  for all
  using (auth.uid()::text = owner_key)
  with check (auth.uid()::text = owner_key);

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on table public.app_stores to authenticated, service_role;
grant select on table public.app_stores to anon;
notify pgrst, 'reload schema';

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  beginner_mode boolean not null default true,
  theme text not null default 'dark' check (theme in ('light','dark','system')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.robot_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  purpose text not null default '',
  description text not null default '',
  target_load text not null default '',
  dimensions text not null default '',
  movement text not null default '',
  environment text not null default '',
  power_preference text not null default '',
  status text not null default 'draft' check (status in ('draft','active','completed','archived')),
  progress text not null default 'IDEA',
  progress_percent int not null default 0,
  cover_image_url text,
  is_demo boolean not null default false,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_robot_projects_user on public.robot_projects(user_id);

create table if not exists public.robot_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.robot_projects(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_type text not null,
  file_size int not null default 0,
  image_kind text not null default 'reference',
  created_at timestamptz not null default now()
);
create index if not exists idx_robot_images_project on public.robot_images(project_id);

create table if not exists public.robot_analysis (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.robot_projects(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  provider text not null,
  summary text not null default '',
  markers jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  raw_response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.components (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  category text not null,
  image_url text,
  description text not null default '',
  beginner_what_is_it text not null default '',
  beginner_what_does_it_do text not null default '',
  beginner_where_fits text not null default '',
  beginner_what_else jsonb not null default '[]'::jsonb,
  default_specification text not null default 'Specification not confirmed',
  unit text not null default 'pcs',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  item_name text not null,
  category text not null,
  brand text not null default '',
  model text not null default '',
  sku text not null default '',
  image_url text,
  specification text not null default '',
  unit text not null default 'pcs',
  quantity numeric not null default 0,
  reserved_quantity numeric not null default 0,
  minimum_stock numeric not null default 0,
  unit_cost numeric not null default 0,
  gst_percent numeric not null default 18,
  total_value numeric not null default 0,
  supplier text not null default '',
  purchase_date date,
  storage_location text not null default '',
  compatible_projects uuid[] not null default '{}',
  notes text not null default '',
  status text not null default 'AVAILABLE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_inventory_user on public.inventory(user_id);
create index if not exists idx_inventory_status on public.inventory(status);
create index if not exists idx_inventory_category on public.inventory(category);

create table if not exists public.project_components (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.robot_projects(id) on delete cascade,
  component_id uuid references public.components(id) on delete set null,
  user_id uuid not null references public.users(id) on delete cascade,
  component_name text not null,
  category text not null,
  image_url text,
  quantity numeric not null default 1,
  purpose text not null default '',
  where_used text not null default '',
  required boolean not null default true,
  suggested_specification text not null default 'Specification not confirmed',
  specification_confirmed boolean not null default false,
  confidence numeric not null default 0,
  notes text not null default '',
  unit_cost numeric not null default 0,
  installation_location text not null default '',
  inventory_item_id uuid references public.inventory(id) on delete set null,
  inventory_status text not null default 'PURCHASE_REQUIRED',
  purchase_status text not null default 'REQUIRED',
  available_quantity numeric not null default 0,
  missing_quantity numeric not null default 0,
  reserved_quantity numeric not null default 0,
  beginner_what_is_it text not null default '',
  beginner_what_does_it_do text not null default '',
  beginner_where_fits text not null default '',
  beginner_what_else jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_project_components_project on public.project_components(project_id);

create table if not exists public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory(id) on delete cascade,
  transaction_type text not null,
  quantity numeric not null,
  previous_stock numeric not null,
  new_stock numeric not null,
  reason text not null default '',
  reference text not null default '',
  project_id uuid references public.robot_projects(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_inventory_tx_item on public.inventory_transactions(inventory_item_id);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  product_name text not null,
  brand text not null default '',
  model text not null default '',
  price numeric,
  mrp numeric,
  discount numeric,
  gst_percent numeric,
  shipping numeric,
  final_price numeric,
  quantity numeric not null default 1,
  specification text not null default 'Not available',
  voltage text not null default 'Not available',
  current text not null default 'Not available',
  rpm text not null default 'Not available',
  torque text not null default 'Not available',
  dimensions text not null default 'Not available',
  weight text not null default 'Not available',
  warranty text not null default 'Not available',
  product_url text not null default '',
  image_url text,
  source text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_type text not null,
  extracted_data jsonb not null default '{}'::jsonb,
  provider text not null,
  status text not null default 'pending',
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  order_number text not null,
  supplier text not null default '',
  status text not null default 'REQUIRED',
  total_estimated numeric not null default 0,
  notes text not null default '',
  ordered_at timestamptz,
  received_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  project_id uuid references public.robot_projects(id) on delete set null,
  purchase_order_id uuid references public.purchase_orders(id) on delete set null,
  item_name text not null,
  required_qty numeric not null default 0,
  available_qty numeric not null default 0,
  purchase_qty numeric not null default 0,
  recommended_product_id uuid references public.products(id) on delete set null,
  recommended_product_name text not null default '',
  estimated_price numeric not null default 0,
  estimated_total numeric not null default 0,
  supplier text not null default '',
  priority text not null default 'MEDIUM',
  status text not null default 'REQUIRED',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_purchase_items_status on public.purchase_items(status);

create table if not exists public.assembly_steps (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.robot_projects(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  step_number int not null,
  title text not null,
  instructions text not null default '',
  required_components jsonb not null default '[]'::jsonb,
  quantities jsonb not null default '{}'::jsonb,
  tools jsonb not null default '[]'::jsonb,
  installation_location text not null default '',
  reference_image_url text,
  safety_warning text not null default '',
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.wiring_connections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.robot_projects(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  from_component text not null,
  to_component text not null,
  pin text not null default '',
  wire text not null default '',
  purpose text not null default '',
  voltage_note text not null default '',
  verified boolean not null default false,
  warning text not null default 'Verify voltage, current and polarity before connecting.',
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  file_name text not null,
  file_path text not null,
  file_type text not null,
  file_size int not null default 0,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  project_id uuid references public.robot_projects(id) on delete cascade,
  category text not null default '',
  title text not null,
  body text not null default '',
  severity text not null default 'info',
  dismissed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.project_costs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.robot_projects(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  mechanical numeric not null default 0,
  electronics numeric not null default 0,
  sensors numeric not null default 0,
  battery numeric not null default 0,
  wiring numeric not null default 0,
  fasteners numeric not null default 0,
  tools numeric not null default 0,
  purchase numeric not null default 0,
  shipping numeric not null default 0,
  gst numeric not null default 0,
  existing_inventory_value numeric not null default 0,
  new_purchase_cost numeric not null default 0,
  total_robot_cost numeric not null default 0,
  updated_at timestamptz not null default now(),
  unique(project_id)
);

create table if not exists public.project_notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.robot_projects(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.engineering_checks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.robot_projects(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  overall_status text not null default 'REQUIRES_VERIFICATION',
  created_at timestamptz not null default now()
);

-- Storage buckets (also in migrations/20260812234000_create_storage_buckets.sql)
insert into storage.buckets (id, name, public, file_size_limit)
values
  ('robot-images', 'robot-images', true, 10485760),
  ('product-scans', 'product-scans', true, 10485760),
  ('documents', 'documents', true, 20971520)
on conflict (id) do update set public = excluded.public;

alter table public.users enable row level security;
alter table public.robot_projects enable row level security;
alter table public.robot_images enable row level security;
alter table public.robot_analysis enable row level security;
alter table public.components enable row level security;
alter table public.project_components enable row level security;
alter table public.inventory enable row level security;
alter table public.inventory_transactions enable row level security;
alter table public.products enable row level security;
alter table public.product_scans enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_items enable row level security;
alter table public.assembly_steps enable row level security;
alter table public.wiring_connections enable row level security;
alter table public.documents enable row level security;
alter table public.ai_recommendations enable row level security;
alter table public.project_costs enable row level security;
alter table public.project_notes enable row level security;
alter table public.engineering_checks enable row level security;

create policy users_own on public.users for all using (auth.uid() = id) with check (auth.uid() = id);
create policy robot_projects_own on public.robot_projects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy robot_images_own on public.robot_images for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy robot_analysis_own on public.robot_analysis for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy components_own on public.components for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy project_components_own on public.project_components for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy inventory_own on public.inventory for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy inventory_tx_own on public.inventory_transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy products_own on public.products for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy product_scans_own on public.product_scans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy purchase_orders_own on public.purchase_orders for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy purchase_items_own on public.purchase_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy assembly_steps_own on public.assembly_steps for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy wiring_own on public.wiring_connections for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy documents_own on public.documents for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy ai_recs_own on public.ai_recommendations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy project_costs_own on public.project_costs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy project_notes_own on public.project_notes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy engineering_checks_own on public.engineering_checks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
