-- Fix security definer view issue by recreating the widget_performance_stats view
-- Drop the existing view first
DROP VIEW IF EXISTS public.widget_performance_stats;

-- Recreate the view without SECURITY DEFINER (which is the default and safer option)
CREATE VIEW public.widget_performance_stats AS
SELECT 
  wd.name AS widget_name,
  wd.category,
  COUNT(uwi.id) AS instance_count,
  COUNT(CASE WHEN uwi.is_active THEN 1 ELSE NULL END) AS active_instances,
  AVG(CASE WHEN uwi.is_active THEN uwi.position ELSE NULL END) AS avg_position
FROM widget_definitions wd
LEFT JOIN user_widget_instances uwi ON wd.id = uwi.widget_id
GROUP BY wd.id, wd.name, wd.category
ORDER BY COUNT(uwi.id) DESC;

-- Ensure proper RLS on the view by granting appropriate permissions
GRANT SELECT ON public.widget_performance_stats TO authenticated;
GRANT SELECT ON public.widget_performance_stats TO anon;