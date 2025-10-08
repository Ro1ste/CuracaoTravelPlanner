-- Complete Supabase RLS Policy Setup for proof-uploads bucket
-- This script ensures the bucket is public and has proper RLS policies

-- Step 1: Ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('proof-uploads', 'proof-uploads', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime'])
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime'];

-- Step 2: Enable RLS on storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable public uploads for proof-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Enable public read access for proof-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Enable public access for proof-uploads" ON storage.objects;

-- Step 4: Create comprehensive RLS policies for proof-uploads bucket

-- Allow public uploads (for anon key)
CREATE POLICY "Enable public uploads for proof-uploads" ON storage.objects
FOR INSERT TO public
WITH CHECK (bucket_id = 'proof-uploads');

-- Allow public read access
CREATE POLICY "Enable public read access for proof-uploads" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'proof-uploads');

-- Allow public update access (for file updates)
CREATE POLICY "Enable public updates for proof-uploads" ON storage.objects
FOR UPDATE TO public
USING (bucket_id = 'proof-uploads')
WITH CHECK (bucket_id = 'proof-uploads');

-- Allow public delete access (for file cleanup)
CREATE POLICY "Enable public deletes for proof-uploads" ON storage.objects
FOR DELETE TO public
USING (bucket_id = 'proof-uploads');

-- Step 5: Verify the setup
SELECT 
  b.id as bucket_id,
  b.name as bucket_name,
  b.public as is_public,
  b.file_size_limit,
  b.allowed_mime_types
FROM storage.buckets b 
WHERE b.id = 'proof-uploads';

-- Step 6: Show existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
