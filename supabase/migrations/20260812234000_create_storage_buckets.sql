-- Create public Storage buckets used by AI Robot Builder uploads.
-- Run in Supabase SQL editor (or via CLI) after app_stores migration.
--
-- Buckets:
--   robot-images   — robot concept / photo uploads
--   product-scans  — Amazon / product screenshot scans
--   documents      — manuals, PDFs, notes

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'robot-images',
    'robot-images',
    true,
    10485760,
    array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
      'application/pdf'
    ]
  ),
  (
    'product-scans',
    'product-scans',
    true,
    10485760,
    array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
      'application/pdf'
    ]
  ),
  (
    'documents',
    'documents',
    true,
    20971520,
    array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
      'application/pdf',
      'text/plain',
      'application/json'
    ]
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read for all objects in these buckets
drop policy if exists "Public read robot-images" on storage.objects;
create policy "Public read robot-images"
  on storage.objects for select
  using (bucket_id = 'robot-images');

drop policy if exists "Public read product-scans" on storage.objects;
create policy "Public read product-scans"
  on storage.objects for select
  using (bucket_id = 'product-scans');

drop policy if exists "Public read documents" on storage.objects;
create policy "Public read documents"
  on storage.objects for select
  using (bucket_id = 'documents');

-- Authenticated + service role can upload/update/delete
drop policy if exists "Auth write robot-images" on storage.objects;
create policy "Auth write robot-images"
  on storage.objects for all
  using (bucket_id = 'robot-images' and (auth.role() = 'authenticated' or auth.role() = 'service_role'))
  with check (bucket_id = 'robot-images' and (auth.role() = 'authenticated' or auth.role() = 'service_role'));

drop policy if exists "Auth write product-scans" on storage.objects;
create policy "Auth write product-scans"
  on storage.objects for all
  using (bucket_id = 'product-scans' and (auth.role() = 'authenticated' or auth.role() = 'service_role'))
  with check (bucket_id = 'product-scans' and (auth.role() = 'authenticated' or auth.role() = 'service_role'));

drop policy if exists "Auth write documents" on storage.objects;
create policy "Auth write documents"
  on storage.objects for all
  using (bucket_id = 'documents' and (auth.role() = 'authenticated' or auth.role() = 'service_role'))
  with check (bucket_id = 'documents' and (auth.role() = 'authenticated' or auth.role() = 'service_role'));
