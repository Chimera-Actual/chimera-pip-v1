-- Update SystemSettingsWidget category to utility
UPDATE widget_definitions 
SET category = 'utility' 
WHERE component_name = 'SystemSettingsWidget';