-- Create the trip-documents bucket (private)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'trip-documents',
  'trip-documents',
  false,
  10485760, -- 10MB limit
  '{image/jpeg,image/png,image/webp,application/pdf}'
)
on conflict (id) do update set 
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = '{image/jpeg,image/png,image/webp,application/pdf}';

-- Enable RLS on storage.objects (if not already enabled)
-- alter table storage.objects enable row level security;

-- Policy: Users can upload documents to their own folder (folder name must start with their user ID)
DROP POLICY IF EXISTS "Users can upload their own trip documents" ON storage.objects;
create policy "Users can upload their own trip documents"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'trip-documents' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can read their own documents
DROP POLICY IF EXISTS "Users can read their own trip documents" ON storage.objects;
create policy "Users can read their own trip documents"
on storage.objects for select
to authenticated
using (
  bucket_id = 'trip-documents' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own documents
DROP POLICY IF EXISTS "Users can update their own trip documents" ON storage.objects;
create policy "Users can update their own trip documents"
on storage.objects for update
to authenticated
using (
  bucket_id = 'trip-documents' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own documents
DROP POLICY IF EXISTS "Users can delete their own trip documents" ON storage.objects;
create policy "Users can delete their own trip documents"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'trip-documents' and
  (storage.foldername(name))[1] = auth.uid()::text
);
