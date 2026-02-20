-- Create NEW_Comment_Mentions table for tracking comment mentions
CREATE TABLE IF NOT EXISTS public.NEW_Comment_Mentions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.NEW_Comments(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  mentioned_by_user_id UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  notification_id UUID REFERENCES public.notifications(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.NEW_Comment_Mentions ENABLE ROW LEVEL SECURITY;

-- Create policies for NEW_Comment_Mentions
CREATE POLICY "Users can view all comment mentions" 
ON public.NEW_Comment_Mentions 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create comment mentions" 
ON public.NEW_Comment_Mentions 
FOR INSERT 
WITH CHECK (auth.uid() = mentioned_by_user_id);

CREATE POLICY "Users can update mentions they created" 
ON public.NEW_Comment_Mentions 
FOR UPDATE 
USING (auth.uid() = mentioned_by_user_id);

CREATE POLICY "Users can delete mentions they created" 
ON public.NEW_Comment_Mentions 
FOR DELETE 
USING (auth.uid() = mentioned_by_user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_comment_mentions_mentioned_user_id ON public.NEW_Comment_Mentions(mentioned_user_id);
CREATE INDEX IF NOT EXISTS idx_comment_mentions_comment_id ON public.NEW_Comment_Mentions(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_mentions_created_at ON public.NEW_Comment_Mentions(created_at DESC);