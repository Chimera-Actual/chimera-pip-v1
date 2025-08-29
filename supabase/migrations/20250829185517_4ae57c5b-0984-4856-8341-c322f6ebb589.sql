-- Create widget_instance_audio table (matching widget_instance_images pattern)
CREATE TABLE public.widget_instance_audio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  widget_instance_id UUID NOT NULL,
  audio_path TEXT NOT NULL,
  audio_title TEXT NOT NULL,
  audio_duration NUMERIC,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT widget_instance_audio_widget_instance_id_fkey 
    FOREIGN KEY (widget_instance_id) 
    REFERENCES public.user_widget_instances(id) 
    ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.widget_instance_audio ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for widget_instance_audio
CREATE POLICY "Users can manage audio for their own widget instances" 
ON public.widget_instance_audio 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM user_widget_instances uwi 
    WHERE uwi.id = widget_instance_audio.widget_instance_id 
    AND uwi.user_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_widget_instance_audio_updated_at
BEFORE UPDATE ON public.widget_instance_audio
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_widget_instance_audio_widget_instance_id 
ON public.widget_instance_audio(widget_instance_id);

-- Create index for ordering by position
CREATE INDEX idx_widget_instance_audio_position 
ON public.widget_instance_audio(widget_instance_id, position);