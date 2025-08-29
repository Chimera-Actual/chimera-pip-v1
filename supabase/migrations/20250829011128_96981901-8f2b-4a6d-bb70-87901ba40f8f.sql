-- Add custom_name field to user_widget_instances table
ALTER TABLE user_widget_instances 
ADD COLUMN custom_name text;