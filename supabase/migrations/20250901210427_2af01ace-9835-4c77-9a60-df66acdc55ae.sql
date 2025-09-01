-- Add MapWidget to widget_definitions
INSERT INTO public.widget_definitions (
  id,
  name, 
  description, 
  component_name, 
  icon, 
  category, 
  default_settings
) VALUES (
  'MapWidget',
  'Map Widget',
  'Interactive map with location search, layer selection, and tactical features',
  'MapWidget',
  'Map',
  'Location',
  '{"title": "Tactical Map", "layer": "standard", "zoom": 10, "showControls": true, "followUser": false, "showCrosshair": true}'::jsonb
);