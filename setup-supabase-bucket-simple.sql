-- Simple approach: Create bucket and disable RLS
-- This should work with anon key permissions

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

-- Disable RLS for this specific bucket (if you have permissions)
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
