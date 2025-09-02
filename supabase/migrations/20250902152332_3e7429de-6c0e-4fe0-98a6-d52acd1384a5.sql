-- Add encryption for sensitive user location data
-- Create a separate secure table for location data with additional access controls

-- Create an encrypted location data table
CREATE TABLE user_location_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  encrypted_latitude BYTEA,
  encrypted_longitude BYTEA,
  encrypted_location_name BYTEA,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on the new table
ALTER TABLE user_location_data ENABLE ROW LEVEL SECURITY;

-- Create strict RLS policies for location data
CREATE POLICY "Users can only access their own encrypted location data" 
ON user_location_data 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamp
CREATE TRIGGER update_user_location_data_updated_at
BEFORE UPDATE ON user_location_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Optional: Create indexes for performance (on non-sensitive columns only)
CREATE INDEX idx_user_location_data_user_id ON user_location_data(user_id);
CREATE INDEX idx_user_location_data_created_at ON user_location_data(created_at);