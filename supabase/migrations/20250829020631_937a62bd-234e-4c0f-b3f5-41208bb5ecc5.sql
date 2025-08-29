-- Fix the RadioWidget name to avoid confusion with audio systems
UPDATE widget_definitions 
SET 
  name = 'Radio Player',
  description = 'Internet radio and music streaming'
WHERE id = 'radio' AND component_name = 'RadioWidget';