-- Remove the old tab_category column and make tab_id not nullable
ALTER TABLE public.user_widget_instances 
DROP COLUMN tab_category;

-- Make tab_id NOT NULL (first we need to handle any existing data)
-- Delete any widget instances that don't have a tab_id
DELETE FROM public.user_widget_instances WHERE tab_id IS NULL;

-- Now make the column NOT NULL
ALTER TABLE public.user_widget_instances 
ALTER COLUMN tab_id SET NOT NULL;