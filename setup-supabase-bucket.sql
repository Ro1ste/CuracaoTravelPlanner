-- Create the proof-uploads bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'proof-uploads',
  'proof-uploads', 
  true, -- Make it public for easier access
  31457280, -- 30MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'video/mp4', 'video/mov']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload proofs" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to proof uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update proofs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete proofs" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to proof-uploads" ON storage.objects;

-- Policy 1: Allow public uploads to proof-uploads bucket (for anon key)
CREATE POLICY "Allow public uploads to proof-uploads" ON storage.objects
FOR INSERT 
TO public
WITH CHECK (bucket_id = 'proof-uploads');

-- Policy 2: Allow public read access to all files in proof-uploads bucket
CREATE POLICY "Allow public read access to proof uploads" ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'proof-uploads');

-- Policy 3: Allow authenticated users to upload files (backup)
CREATE POLICY "Allow authenticated users to upload proofs" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'proof-uploads');
