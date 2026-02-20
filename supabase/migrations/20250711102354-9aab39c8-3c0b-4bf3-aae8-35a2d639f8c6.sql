-- Crear tabla NEW_Comments
CREATE TABLE public.NEW_Comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  parent_id uuid NULL,
  mentioned_users uuid[] NULL,
  is_important boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Foreign key constraints
  CONSTRAINT fk_new_comments_project FOREIGN KEY (project_id) REFERENCES public.NEW_Projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_new_comments_parent FOREIGN KEY (parent_id) REFERENCES public.NEW_Comments(id) ON DELETE CASCADE
);

-- Habilitar RLS
ALTER TABLE public.NEW_Comments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view all comments" 
ON public.NEW_Comments 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create comments" 
ON public.NEW_Comments 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own comments" 
ON public.NEW_Comments 
FOR UPDATE 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own comments" 
ON public.NEW_Comments 
FOR DELETE 
USING (auth.uid()::text = user_id::text);

-- Crear tabla NEW_Comment_Mentions para las menciones
CREATE TABLE public.NEW_Comment_Mentions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id uuid NOT NULL,
  mentioned_user_id uuid NOT NULL,
  mentioned_by_user_id uuid NOT NULL,
  notification_id uuid NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Foreign key constraints
  CONSTRAINT fk_new_comment_mentions_comment FOREIGN KEY (comment_id) REFERENCES public.NEW_Comments(id) ON DELETE CASCADE,
  CONSTRAINT fk_new_comment_mentions_notification FOREIGN KEY (notification_id) REFERENCES public.notifications(id) ON DELETE SET NULL,
  
  -- Unique constraint para evitar menciones duplicadas
  UNIQUE(comment_id, mentioned_user_id)
);

-- Habilitar RLS para NEW_Comment_Mentions
ALTER TABLE public.NEW_Comment_Mentions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para menciones
CREATE POLICY "Users can view all mentions" 
ON public.NEW_Comment_Mentions 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create mentions" 
ON public.NEW_Comment_Mentions 
FOR INSERT 
WITH CHECK (auth.uid()::text = mentioned_by_user_id::text);

-- Crear índices para mejorar rendimiento
CREATE INDEX idx_new_comments_project_id ON public.NEW_Comments(project_id);
CREATE INDEX idx_new_comments_user_id ON public.NEW_Comments(user_id);
CREATE INDEX idx_new_comments_parent_id ON public.NEW_Comments(parent_id);
CREATE INDEX idx_new_comments_created_at ON public.NEW_Comments(created_at DESC);

CREATE INDEX idx_new_comment_mentions_comment_id ON public.NEW_Comment_Mentions(comment_id);
CREATE INDEX idx_new_comment_mentions_mentioned_user_id ON public.NEW_Comment_Mentions(mentioned_user_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_new_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_new_comments_updated_at_trigger
  BEFORE UPDATE ON public.NEW_Comments
  FOR EACH ROW
  EXECUTE FUNCTION update_new_comments_updated_at();