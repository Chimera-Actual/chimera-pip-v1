-- Update avatars and images buckets to be private
UPDATE storage.buckets SET public = false WHERE id IN ('avatars', 'images');

-- Drop the existing public access policies
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Images are publicly accessible" ON storage.objects;

-- Create new private access policies for avatars
CREATE POLICY "Users can view their own avatars" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create new private access policies for images  
CREATE POLICY "Users can view their own images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);