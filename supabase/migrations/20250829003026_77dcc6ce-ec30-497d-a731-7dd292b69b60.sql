-- Add new system settings columns to user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN theme_mode TEXT DEFAULT 'auto' CHECK (theme_mode IN ('auto', 'dark', 'light')),
ADD COLUMN crt_effects_enabled BOOLEAN DEFAULT true,
ADD COLUMN sound_enabled BOOLEAN DEFAULT true,
ADD COLUMN notifications_enabled BOOLEAN DEFAULT true,
ADD COLUMN auto_save_enabled BOOLEAN DEFAULT true,
ADD COLUMN data_backup_enabled BOOLEAN DEFAULT false;