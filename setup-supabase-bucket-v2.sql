-- Create the proof-uploads-v2 bucket
-- This should work with anon key permissions
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'proof-uploads-v2',
  'proof-uploads-v2', 
  true, -- Make it public for easier access
  31457280, -- 30MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'video/mp4', 'video/mov']
)
ON CONFLICT (id) DO NOTHING;
