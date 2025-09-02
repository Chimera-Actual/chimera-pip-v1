-- Create dashboard layouts table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.dashboard_layouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Dashboard',
  layout_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.dashboard_layouts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for dashboard_layouts
CREATE POLICY "Users can create their own dashboard layouts" 
ON public.dashboard_layouts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own dashboard layouts" 
ON public.dashboard_layouts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own dashboard layouts" 
ON public.dashboard_layouts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dashboard layouts" 
ON public.dashboard_layouts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add missing columns to user_widget_instances only if they don't exist
DO $$ 
BEGIN
  -- Add grid_x column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_widget_instances' AND column_name='grid_x') THEN
    ALTER TABLE user_widget_instances ADD COLUMN grid_x INTEGER DEFAULT 0;
  END IF;
  
  -- Add grid_y column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_widget_instances' AND column_name='grid_y') THEN
    ALTER TABLE user_widget_instances ADD COLUMN grid_y INTEGER DEFAULT 0;
  END IF;
  
  -- Add grid_width column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_widget_instances' AND column_name='grid_width') THEN
    ALTER TABLE user_widget_instances ADD COLUMN grid_width INTEGER DEFAULT 1;
  END IF;
  
  -- Add grid_height column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_widget_instances' AND column_name='grid_height') THEN
    ALTER TABLE user_widget_instances ADD COLUMN grid_height INTEGER DEFAULT 1;
  END IF;
  
  -- Add panel_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_widget_instances' AND column_name='panel_id') THEN
    ALTER TABLE user_widget_instances ADD COLUMN panel_id TEXT DEFAULT 'main';
  END IF;
END $$;

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_user_id ON public.dashboard_layouts(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_active ON public.dashboard_layouts(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_widget_instances_grid ON public.user_widget_instances(user_id, tab_id, grid_x, grid_y);