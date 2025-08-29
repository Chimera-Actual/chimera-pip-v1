-- Create widget definitions table (available widgets)
CREATE TABLE public.widget_definitions (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  component_name TEXT NOT NULL,
  default_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user widget instances table (user's active widgets)
CREATE TABLE public.user_widget_instances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  widget_id TEXT NOT NULL REFERENCES public.widget_definitions(id),
  tab_category TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, widget_id, tab_category)
);

-- Create user widget settings table (widget configurations)
CREATE TABLE public.user_widget_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  widget_id TEXT NOT NULL REFERENCES public.widget_definitions(id),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, widget_id)
);

-- Enable RLS on all tables
ALTER TABLE public.widget_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_widget_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_widget_settings ENABLE ROW LEVEL SECURITY;

-- Widget definitions are public (everyone can see available widgets)
CREATE POLICY "Widget definitions are publicly viewable" 
ON public.widget_definitions 
FOR SELECT 
USING (true);

-- User widget instances policies
CREATE POLICY "Users can view their own widget instances" 
ON public.user_widget_instances 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own widget instances" 
ON public.user_widget_instances 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own widget instances" 
ON public.user_widget_instances 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own widget instances" 
ON public.user_widget_instances 
FOR DELETE 
USING (auth.uid() = user_id);

-- User widget settings policies
CREATE POLICY "Users can view their own widget settings" 
ON public.user_widget_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own widget settings" 
ON public.user_widget_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own widget settings" 
ON public.user_widget_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own widget settings" 
ON public.user_widget_settings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add update triggers
CREATE TRIGGER update_user_widget_instances_updated_at
BEFORE UPDATE ON public.user_widget_instances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_widget_settings_updated_at
BEFORE UPDATE ON public.user_widget_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default widget definitions
INSERT INTO public.widget_definitions (id, name, description, icon, category, component_name) VALUES
('map', 'Tactical Map', 'Real-time mapping and navigation system', '◈', 'navigation', 'MapWidget'),
('weather', 'Weather Monitor', 'Current conditions and forecast tracking', '☰', 'environment', 'WeatherWidget'),
('clock', 'World Clock', 'Multi-timezone time display', '◐', 'utility', 'ClockWidget'),
('user-info', 'User Profile', 'Personal information and stats', '◎', 'system', 'UserInfoWidget'),
('email', 'Communication Hub', 'Message and email management', '✉', 'communication', 'EmailWidget'),
('calendar', 'Schedule Manager', 'Calendar and event tracking', '◔', 'productivity', 'CalendarWidget'),
('radio', 'Audio Systems', 'Music and communication radio', '♫', 'entertainment', 'RadioWidget'),
('browser', 'Data Terminal', 'Web browsing and information access', '⌘', 'utility', 'BrowserWidget');