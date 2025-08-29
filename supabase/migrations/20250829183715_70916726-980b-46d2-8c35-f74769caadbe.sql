-- Fix the INSERT policy for user_widget_settings to properly restrict access
DROP POLICY IF EXISTS "Users can create their own widget settings" ON public.user_widget_settings;

CREATE POLICY "Users can create their own widget settings" 
ON public.user_widget_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);