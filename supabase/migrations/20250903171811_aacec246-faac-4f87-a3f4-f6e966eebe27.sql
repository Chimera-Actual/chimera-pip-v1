-- Create widgets table for storing widget configurations
CREATE TABLE public.widgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tab_id TEXT NOT NULL DEFAULT 'START',
  component_name TEXT NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb,
  position_x INTEGER NOT NULL DEFAULT 0,
  position_y INTEGER NOT NULL DEFAULT 0,
  width INTEGER NOT NULL DEFAULT 300,
  height INTEGER NOT NULL DEFAULT 200,
  z_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.widgets ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own widgets" 
ON public.widgets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own widgets" 
ON public.widgets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own widgets" 
ON public.widgets 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own widgets" 
ON public.widgets 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_widgets_updated_at
  BEFORE UPDATE ON public.widgets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create tabs table for organizing widgets
CREATE TABLE public.tabs (
  id TEXT NOT NULL PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for tabs
ALTER TABLE public.tabs ENABLE ROW LEVEL SECURITY;

-- Create policies for tabs
CREATE POLICY "Users can view their own tabs" 
ON public.tabs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tabs" 
ON public.tabs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tabs" 
ON public.tabs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tabs" 
ON public.tabs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for tabs timestamp updates
CREATE TRIGGER update_tabs_updated_at
  BEFORE UPDATE ON public.tabs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_widgets_user_tab ON public.widgets(user_id, tab_id);
CREATE INDEX idx_widgets_position ON public.widgets(position_x, position_y);
CREATE INDEX idx_tabs_user_order ON public.tabs(user_id, order_index);