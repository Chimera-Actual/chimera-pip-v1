-- Create user_widget_tags table for user-editable tags
CREATE TABLE public.user_widget_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  widget_definition_id TEXT NOT NULL,
  tag TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Foreign key to widget_definitions
  CONSTRAINT user_widget_tags_widget_definition_id_fkey 
    FOREIGN KEY (widget_definition_id) 
    REFERENCES public.widget_definitions(id) 
    ON DELETE CASCADE,
  
  -- Unique constraint to prevent duplicate tags for same user/widget
  CONSTRAINT user_widget_tags_user_widget_tag_unique 
    UNIQUE (user_id, widget_definition_id, tag)
);

-- Enable Row Level Security
ALTER TABLE public.user_widget_tags ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own widget tags" 
ON public.user_widget_tags 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own widget tags" 
ON public.user_widget_tags 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own widget tags" 
ON public.user_widget_tags 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own widget tags" 
ON public.user_widget_tags 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_widget_tags_updated_at
BEFORE UPDATE ON public.user_widget_tags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();