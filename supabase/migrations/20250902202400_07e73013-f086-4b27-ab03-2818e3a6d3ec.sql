-- Add batch update function for widget positions
CREATE OR REPLACE FUNCTION batch_update_widget_positions(
  user_id UUID,
  position_updates JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  update_record JSONB;
BEGIN
  -- Validate user authentication
  IF auth.uid() != user_id THEN
    RAISE EXCEPTION 'Unauthorized: Can only update own widget positions';
  END IF;

  -- Loop through position updates
  FOR update_record IN SELECT * FROM jsonb_array_elements(position_updates)
  LOOP
    UPDATE user_widget_instances 
    SET position = (update_record->>'position')::INTEGER
    WHERE id = (update_record->>'instanceId')::UUID 
      AND user_widget_instances.user_id = batch_update_widget_positions.user_id;
  END LOOP;
END;
$$;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_widget_instances_user_tab_active 
ON user_widget_instances(user_id, tab_id, is_active);

CREATE INDEX IF NOT EXISTS idx_user_widget_instances_position 
ON user_widget_instances(user_id, tab_id, position) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_user_widget_settings_instance 
ON user_widget_settings(widget_instance_id);

CREATE INDEX IF NOT EXISTS idx_user_widget_tags_widget_user 
ON user_widget_tags(widget_definition_id, user_id);

-- Add performance monitoring view
CREATE OR REPLACE VIEW widget_performance_stats AS
SELECT 
  wd.name as widget_name,
  wd.category,
  COUNT(uwi.id) as instance_count,
  COUNT(CASE WHEN uwi.is_active THEN 1 END) as active_instances,
  AVG(CASE WHEN uwi.is_active THEN uwi.position END) as avg_position
FROM widget_definitions wd
LEFT JOIN user_widget_instances uwi ON wd.id = uwi.widget_id
GROUP BY wd.id, wd.name, wd.category
ORDER BY instance_count DESC;

-- Add RLS policy for the batch function
GRANT EXECUTE ON FUNCTION batch_update_widget_positions TO authenticated;