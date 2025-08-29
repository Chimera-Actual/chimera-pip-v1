-- First remove all user widget instances that reference the RadioWidget
DELETE FROM user_widget_instances WHERE widget_id = 'radio';

-- Then remove the RadioWidget from widget definitions
DELETE FROM widget_definitions WHERE component_name = 'RadioWidget';