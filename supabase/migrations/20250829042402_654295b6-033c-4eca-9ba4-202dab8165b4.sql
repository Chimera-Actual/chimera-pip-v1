-- Add the missing foreign key constraint
ALTER TABLE user_widget_settings 
ADD CONSTRAINT fk_user_widget_settings_instance 
FOREIGN KEY (widget_instance_id) REFERENCES user_widget_instances(id) ON DELETE CASCADE;