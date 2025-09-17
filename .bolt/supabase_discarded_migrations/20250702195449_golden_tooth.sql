/*
  # Create Storage Bucket for Site Images

  1. Storage Setup
    - Create 'site-images' bucket for storing uploaded images
    - Configure public access for image viewing
    - Set up RLS policies for secure uploads

  2. Security
    - Enable RLS on storage objects
    - Allow public read access for images
    - Allow authenticated users to upload images
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-images',
  'site-images',
  true,
  3145728, -- 3MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow public read access to images
CREATE POLICY "Public read access for site images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'site-images');

-- Policy to allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload site images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'site-images');

-- Policy to allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update site images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'site-images');

-- Policy to allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete site images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'site-images');