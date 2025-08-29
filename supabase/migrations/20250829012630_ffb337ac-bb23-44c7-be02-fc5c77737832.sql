-- Add ImageDisplayWidget to widget definitions
INSERT INTO widget_definitions (
  id, 
  name, 
  description, 
  icon, 
  component_name, 
  category, 
  default_settings
) VALUES (
  'image-display',
  'Image Display',
  'Display multiple images with customizable layouts and monochrome effects',
  '🖼️',
  'ImageDisplayWidget',
  'productivity',
  '{
    "containerCount": 1,
    "layoutPattern": "1",
    "containers": [{
      "id": "1",
      "title": "Image Container 1",
      "imageUrl": "",
      "layout": "card",
      "borderStyle": "solid",
      "borderColor": "border",
      "isMonochrome": false,
      "monochromeColor": "#000000"
    }]
  }'::jsonb
);