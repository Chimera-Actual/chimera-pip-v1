-- Add font_size column to user_tabs table
ALTER TABLE public.user_tabs 
ADD COLUMN font_size text DEFAULT 'text-sm';

-- Add comment to explain the column
COMMENT ON COLUMN public.user_tabs.font_size IS 'Tailwind CSS font size class for tab titles (e.g., text-xs, text-sm, text-base, text-lg, text-xl)';