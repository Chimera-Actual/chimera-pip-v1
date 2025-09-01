-- Add MapWidget to widget_definitions
INSERT INTO public.widget_definitions (
  id, 
  name, 
  description, 
  component_name, 
  icon, 
  category, 
  default_settings,
  version,
  is_active
) VALUES (
  gen_random_uuid(),
  'Map Widget',
  'Interactive map with location search, layer selection, and tactical features',
  'MapWidget',
  'Map',
  'Location',
  '{"title": "Tactical Map", "layer": "standard", "zoom": 10, "showControls": true, "followUser": false, "showCrosshair": true}'::jsonb,
  '1.0.0',
  true
) ON CONFLICT (component_name) 
DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  default_settings = EXCLUDED.default_settings,
  version = EXCLUDED.version,
  is_active = EXCLUDED.is_active;