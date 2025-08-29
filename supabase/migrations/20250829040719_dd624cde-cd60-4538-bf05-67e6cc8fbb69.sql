-- Phase 1: Fix database schema for widget settings
-- Step 1: Add new column to reference widget instance instead of widget type
ALTER TABLE user_widget_settings 
ADD COLUMN widget_instance_id UUID;

-- Step 2: Add foreign key constraint to ensure data integrity
ALTER TABLE user_widget_settings 
ADD CONSTRAINT fk_widget_instance 
FOREIGN KEY (widget_instance_id) REFERENCES user_widget_instances(id) 
ON DELETE CASCADE;

-- Step 3: Create index for performance
CREATE INDEX idx_user_widget_settings_instance_id ON user_widget_settings(widget_instance_id);

-- Step 4: Update existing records to link to widget instances
-- This will create one settings record per widget instance
UPDATE user_widget_settings 
SET widget_instance_id = (
  SELECT uwi.id 
  FROM user_widget_instances uwi 
  WHERE uwi.widget_id = user_widget_settings.widget_id 
    AND uwi.user_id = user_widget_settings.user_id 
    AND uwi.is_active = true
  LIMIT 1
)
WHERE widget_instance_id IS NULL;

-- Step 5: Remove records that couldn't be linked (orphaned settings)
DELETE FROM user_widget_settings WHERE widget_instance_id IS NULL;

-- Step 6: Make widget_instance_id NOT NULL
ALTER TABLE user_widget_settings 
ALTER COLUMN widget_instance_id SET NOT NULL;

-- Step 7: Remove the old widget_id column since we now use widget_instance_id
ALTER TABLE user_widget_settings 
DROP COLUMN widget_id;