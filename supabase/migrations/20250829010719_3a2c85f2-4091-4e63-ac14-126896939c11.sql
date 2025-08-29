-- Add TextDisplayWidget to widget definitions
INSERT INTO widget_definitions (
  id, 
  name, 
  description, 
  icon, 
  component_name, 
  category, 
  default_settings
) VALUES (
  'text-display',
  'Text Display',
  'Display customizable text with multiple layout options',
  '📝',
  'TextDisplayWidget',
  'productivity',
  '{
    "title": "Welcome",
    "content": "This is your text display widget. Click the edit button to customize the content and try different layout options below.",
    "layout": "card",
    "textSize": "base",
    "textAlign": "left",
    "colorTheme": "default"
  }'::jsonb
);