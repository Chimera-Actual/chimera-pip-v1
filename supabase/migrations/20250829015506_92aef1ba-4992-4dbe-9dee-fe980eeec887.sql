-- Update the existing audio-system widget to be an audio player instead
UPDATE widget_definitions 
SET 
  name = 'Audio Player',
  description = 'Simple audio player for files and streaming URLs',
  icon = '🎵',
  category = 'entertainment',
  component_name = 'AudioPlayerWidget',
  default_settings = '{"volume": 75, "autoplay": false, "loop": false, "playlist": []}'
WHERE id = 'audio-system';