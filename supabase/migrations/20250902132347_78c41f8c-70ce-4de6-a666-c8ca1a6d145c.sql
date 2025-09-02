-- Ensure sample widgets are properly defined in the database
INSERT INTO widget_definitions (id, name, component_name, category, description, icon, default_settings, version)
VALUES 
  (
    'sample-clock',
    'System Clock',
    'SampleClock',
    'utilities',
    'A digital clock widget with customizable display options',
    '🕐',
    '{"showSeconds": true, "format24h": true, "showDate": true, "theme": "default", "fontSize": "medium"}',
    '1.0.0'
  ),
  (
    'sample-note',
    'Notes Terminal',
    'SampleNote',
    'productivity',
    'A persistent notepad widget for quick notes',
    '📝',
    '{"autoSave": true, "showWordCount": true, "theme": "default", "fontSize": "medium"}',
    '1.0.0'
  ),
  (
    'sample-chart',
    'System Monitor',
    'SampleChart',
    'monitoring',
    'Real-time system monitoring with customizable charts',
    '📊',
    '{"dataPoints": 50, "showGrid": true, "showStats": true, "animateChart": true, "theme": "default"}',
    '1.0.0'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  component_name = EXCLUDED.component_name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  default_settings = EXCLUDED.default_settings,
  version = EXCLUDED.version;