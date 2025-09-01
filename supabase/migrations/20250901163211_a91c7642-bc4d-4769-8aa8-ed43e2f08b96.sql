-- Remove placeholder widgets from widget_definitions
DELETE FROM public.widget_definitions 
WHERE id IN ('email', 'calendar');