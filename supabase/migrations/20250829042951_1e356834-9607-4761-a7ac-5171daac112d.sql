-- Consolidate AI Agent widgets into one configurable type
-- Step 1: Update the custom-assistant widget to be the unified AI Agent
UPDATE widget_definitions 
SET 
  name = 'AI Agent',
  description = 'Configurable AI assistant with custom webhook support'
WHERE id = 'custom-assistant';

-- Step 2: Migrate instances of other AI agent widgets to use custom-assistant
UPDATE user_widget_instances 
SET widget_id = 'custom-assistant'
WHERE widget_id IN ('claude-assistant', 'gpt-assistant', 'voice-assistant');

-- Step 3: Remove the redundant widget definitions
DELETE FROM widget_definitions 
WHERE id IN ('claude-assistant', 'gpt-assistant', 'voice-assistant');