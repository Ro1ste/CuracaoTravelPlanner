-- RLS Policies for proof-uploads bucket
-- IMPORTANT: This must be run with SERVICE ROLE key or by project owner
-- Go to Supabase Dashboard > Settings > API > Service Role Key

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to upload proofs" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to proof uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update proofs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete proofs" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to proof-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Enable public uploads for proof-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Enable public read access for proof-uploads" ON storage.objects;

-- Policy 1: Allow public uploads to proof-uploads bucket (for anon key)
CREATE POLICY "Enable public uploads for proof-uploads" ON storage.objects
FOR INSERT 
TO public
WITH CHECK (bucket_id = 'proof-uploads');

-- Policy 2: Allow public read access to all files in proof-uploads bucket
CREATE POLICY "Enable public read access for proof-uploads" ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'proof-uploads');

-- Policy 3: Allow authenticated users to upload files (backup)
CREATE POLICY "Allow authenticated users to upload proofs" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'proof-uploads');
