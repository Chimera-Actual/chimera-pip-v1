-- Create user tabs table for dynamic tab management
CREATE TABLE public.user_tabs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '◉',
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Enable RLS
ALTER TABLE public.user_tabs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own tabs" 
ON public.user_tabs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tabs" 
ON public.user_tabs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tabs" 
ON public.user_tabs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tabs" 
ON public.user_tabs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add update trigger
CREATE TRIGGER update_user_tabs_updated_at
BEFORE UPDATE ON public.user_tabs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update user_widget_instances to reference tab IDs instead of categories
ALTER TABLE public.user_widget_instances 
ADD COLUMN tab_id UUID REFERENCES public.user_tabs(id);

-- Create index for better performance
CREATE INDEX idx_user_tabs_user_id_position ON public.user_tabs(user_id, position);
CREATE INDEX idx_user_widget_instances_tab_id ON public.user_widget_instances(tab_id);

-- Insert default tabs for existing users (will be handled via trigger for new users)
-- Note: This is just the structure - default tabs will be created via application logic