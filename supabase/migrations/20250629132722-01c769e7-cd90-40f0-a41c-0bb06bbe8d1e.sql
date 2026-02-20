
-- Crear tabla para registrar menciones específicas
CREATE TABLE public.comment_mentions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID REFERENCES public.project_comments(id) ON DELETE CASCADE NOT NULL,
  mentioned_user_id UUID NOT NULL,
  mentioned_by_user_id UUID NOT NULL,
  notification_id UUID REFERENCES public.notifications(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Evitar menciones duplicadas en el mismo comentario
  UNIQUE(comment_id, mentioned_user_id)
);

-- Habilitar RLS en la nueva tabla
ALTER TABLE public.comment_mentions ENABLE ROW LEVEL SECURITY;

-- Política para que todos puedan ver las menciones (necesario para mostrar comentarios)
CREATE POLICY "Anyone can view mentions" ON public.comment_mentions
FOR SELECT USING (true);

-- Política para que usuarios autenticados puedan crear menciones
CREATE POLICY "Authenticated users can create mentions" ON public.comment_mentions
FOR INSERT WITH CHECK (auth.uid() = mentioned_by_user_id);

-- Crear índices para mejorar rendimiento
CREATE INDEX idx_comment_mentions_comment_id ON public.comment_mentions(comment_id);
CREATE INDEX idx_comment_mentions_mentioned_user_id ON public.comment_mentions(mentioned_user_id);
CREATE INDEX idx_comment_mentions_notification_id ON public.comment_mentions(notification_id);

-- Agregar columna de referencia en notifications para facilitar las consultas
ALTER TABLE public.notifications ADD COLUMN comment_id UUID REFERENCES public.project_comments(id) ON DELETE CASCADE;
