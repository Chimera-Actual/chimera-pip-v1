-- Extend existing user_widget_instances with grid positioning
ALTER TABLE user_widget_instances 
ADD COLUMN grid_x INTEGER DEFAULT 0,
ADD COLUMN grid_y INTEGER DEFAULT 0,
ADD COLUMN grid_width INTEGER DEFAULT 1,
ADD COLUMN grid_height INTEGER DEFAULT 1,
ADD COLUMN panel_id TEXT DEFAULT 'main';

-- Create dashboard layouts table
CREATE TABLE public.dashboard_layouts (
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

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_dashboard_layouts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_dashboard_layouts_updated_at
  BEFORE UPDATE ON public.dashboard_layouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_dashboard_layouts_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_dashboard_layouts_user_id ON public.dashboard_layouts(user_id);
CREATE INDEX idx_dashboard_layouts_active ON public.dashboard_layouts(user_id, is_active);
CREATE INDEX idx_user_widget_instances_grid ON public.user_widget_instances(user_id, tab_id, grid_x, grid_y);