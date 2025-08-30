-- Add location_polling_frequency column to user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN location_polling_frequency integer DEFAULT 5;

-- Add check constraint to ensure reasonable polling frequency (1-60 minutes)
ALTER TABLE public.user_settings 
ADD CONSTRAINT check_polling_frequency 
CHECK (location_polling_frequency >= 1 AND location_polling_frequency <= 60);