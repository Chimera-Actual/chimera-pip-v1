-- Add color_scheme field to user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS color_scheme TEXT DEFAULT 'green' CHECK (color_scheme IN ('green', 'amber', 'blue', 'red', 'cyan', 'purple'));