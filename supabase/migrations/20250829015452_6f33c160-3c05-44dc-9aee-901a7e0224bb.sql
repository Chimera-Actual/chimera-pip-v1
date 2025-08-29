-- Remove the complex audio system widget
DELETE FROM widget_definitions WHERE id = 'audio-system';

-- Add simple audio player widget
INSERT INTO widget_definitions (id, name, description, icon, category, component_name, default_settings) 
VALUES (
  'audio-player',
  'Audio Player',
  'Simple audio player for files and streaming URLs',
  '🎵',
  'entertainment',
  'AudioPlayerWidget',
  '{"volume": 75, "autoplay": false, "loop": false, "playlist": []}'
);