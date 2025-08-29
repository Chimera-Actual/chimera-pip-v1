-- Phase 2: Set up proper image storage for widget instances
-- Step 1: Create bucket policies for images bucket (if not exists)
-- Allow authenticated users to upload their own images
CREATE POLICY "Users can upload their own images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own images
CREATE POLICY "Users can view their own images" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own images  
CREATE POLICY "Users can update their own images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own images
CREATE POLICY "Users can delete their own images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Step 2: Create a table to track image usage by widget instances
CREATE TABLE IF NOT EXISTS widget_instance_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_instance_id UUID NOT NULL REFERENCES user_widget_instances(id) ON DELETE CASCADE,
  image_path TEXT NOT NULL, -- path in storage bucket
  image_purpose VARCHAR(50) NOT NULL DEFAULT 'general', -- 'general', 'avatar', 'background', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE widget_instance_images ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage images for their own widget instances"
ON widget_instance_images
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_widget_instances uwi
    WHERE uwi.id = widget_instance_images.widget_instance_id
    AND uwi.user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX idx_widget_instance_images_instance_id ON widget_instance_images(widget_instance_id);
CREATE INDEX idx_widget_instance_images_path ON widget_instance_images(image_path);

-- Create trigger for updated_at
CREATE TRIGGER update_widget_instance_images_updated_at
  BEFORE UPDATE ON widget_instance_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();