-- Phase 4: Add data integrity constraints and cleanup (corrected)
-- Step 1: Add unique constraint to prevent duplicate settings per widget instance
ALTER TABLE user_widget_settings 
ADD CONSTRAINT unique_widget_instance_settings 
UNIQUE (user_id, widget_instance_id);

-- Step 2: Add constraint to ensure image paths are unique per user  
ALTER TABLE widget_instance_images 
ADD CONSTRAINT unique_user_image_path 
UNIQUE (image_path);

-- Step 3: Create index for performance on widget instances
CREATE INDEX IF NOT EXISTS idx_user_widget_instances_user_tab_active 
ON user_widget_instances(user_id, tab_id, is_active);

-- Step 4: Add check constraint to ensure valid image purposes
ALTER TABLE widget_instance_images 
ADD CONSTRAINT check_valid_image_purpose 
CHECK (image_purpose IN ('general', 'avatar', 'background', 'container_1', 'container_2', 'container_3', 'container_4', 'container_5', 'container_6'));