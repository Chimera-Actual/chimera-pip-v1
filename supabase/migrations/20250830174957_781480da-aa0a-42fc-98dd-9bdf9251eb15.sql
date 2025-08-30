-- Add an initial "ai" tag to the Voice Agent Widget for better discoverability
-- This will make it appear under the "ai" tag filter in the widget library
INSERT INTO user_widget_tags (user_id, widget_definition_id, tag)
SELECT 
  auth.uid(),
  'voice-agent',
  'ai'
WHERE auth.uid() IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_widget_tags 
    WHERE user_id = auth.uid() 
    AND widget_definition_id = 'voice-agent' 
    AND tag = 'ai'
  );