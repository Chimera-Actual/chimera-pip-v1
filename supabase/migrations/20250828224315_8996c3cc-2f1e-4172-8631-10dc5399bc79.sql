-- Create table for storing assistant webhook configurations
CREATE TABLE public.assistant_webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  assistant_id TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, assistant_id)
);

-- Enable Row Level Security
ALTER TABLE public.assistant_webhooks ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own webhook configs" 
ON public.assistant_webhooks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own webhook configs" 
ON public.assistant_webhooks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own webhook configs" 
ON public.assistant_webhooks 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own webhook configs" 
ON public.assistant_webhooks 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_assistant_webhooks_updated_at
BEFORE UPDATE ON public.assistant_webhooks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();