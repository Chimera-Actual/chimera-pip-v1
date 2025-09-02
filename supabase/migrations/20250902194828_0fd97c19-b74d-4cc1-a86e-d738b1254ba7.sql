-- Configure Supabase security settings
-- Set OTP expiry to 24 hours (86400 seconds)
UPDATE auth.config 
SET value = '86400'
WHERE parameter = 'OTP_EXPIRY';

-- Enable leaked password protection  
UPDATE auth.config 
SET value = 'true'
WHERE parameter = 'SECURITY_LEAKED_PASSWORD_PROTECTION';

-- Set session timeout to 24 hours
UPDATE auth.config 
SET value = '86400'
WHERE parameter = 'JWT_EXPIRY';

-- Enable secure password requirements
UPDATE auth.config 
SET value = '8'
WHERE parameter = 'PASSWORD_MIN_LENGTH';

-- Create audit table for security monitoring
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  event_type TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on security events
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Security events policies
CREATE POLICY "Admin can view all security events" 
ON public.security_events 
FOR SELECT 
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view their own security events" 
ON public.security_events 
FOR SELECT 
USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_widget_instances_user_tab ON user_widget_instances(user_id, tab_id, is_active);
CREATE INDEX IF NOT EXISTS idx_widget_settings_instance ON user_widget_settings(widget_instance_id);
CREATE INDEX IF NOT EXISTS idx_user_tabs_user_position ON user_tabs(user_id, position);
CREATE INDEX IF NOT EXISTS idx_security_events_user_created ON security_events(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_type_created ON security_events(event_type, created_at);