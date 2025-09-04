-- Add RLS policy to widget_performance_stats table
ALTER TABLE public.widget_performance_stats ENABLE ROW LEVEL SECURITY;

-- Only allow select for authenticated users (stats are aggregated, no user-specific data)
CREATE POLICY "Authenticated users can view widget performance stats" 
ON public.widget_performance_stats 
FOR SELECT 
USING (auth.uid() IS NOT NULL);