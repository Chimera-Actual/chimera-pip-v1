-- Clean slate: Remove all existing widgets and create standardized base widget
-- This establishes a consistent foundation for all future widgets

-- Remove all existing widget instances and settings (with user data cleanup)
DELETE FROM public.user_widget_settings;
DELETE FROM public.user_widget_instances;
DELETE FROM public.user_widget_tags;

-- Remove all existing widget definitions
DELETE FROM public.widget_definitions;

-- Insert the standardized base widget
INSERT INTO public.widget_definitions (
  id,
  name,
  description,
  icon,
  category,
  component_name,
  default_settings
) VALUES (
  'base-widget',
  'Base Widget',
  'A standardized widget template that demonstrates the proper widget architecture and can be customized for various purposes.',
  'Cpu',
  'System',
  'BaseWidget',
  '{"title": "Base Widget", "message": "This is a base widget template.", "showTitle": true, "variant": "default"}'::jsonb
);