-- Update SystemSettingsWidget category to utility
UPDATE widget_definitions 
SET category = 'utility' 
WHERE component_name = 'SystemSettingsWidget';

-- Insert audio widget definition
INSERT INTO widget_definitions (id, name, description, icon, category, component_name, default_settings) 
VALUES (
  'audio-system',
  'Audio System',
  'Voice recording, playback, and audio processing interface',
  '🔊',
  'utility',
  'AudioWidget',
  '{"selectedVoice": "Aria", "autoRecord": false, "playbackSpeed": 1.0, "enableVAD": true}'
);