
-- Crear tabla de notificaciones
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data JSONB DEFAULT '{}',
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE
);

-- Habilitar RLS en notificaciones
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Política para que usuarios vean solo sus notificaciones
CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT USING (auth.uid() = user_id);

-- Política para que usuarios autenticados puedan crear notificaciones
CREATE POLICY "Authenticated users can create notifications" ON public.notifications
FOR INSERT WITH CHECK (true);

-- Política para que usuarios puedan marcar sus notificaciones como leídas
CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE USING (auth.uid() = user_id);

-- Agregar columnas faltantes a project_comments
ALTER TABLE public.project_comments 
ADD COLUMN parent_id UUID REFERENCES public.project_comments(id) ON DELETE CASCADE,
ADD COLUMN mentioned_users TEXT[],
ADD COLUMN is_important BOOLEAN NOT NULL DEFAULT false;

-- Crear índice para mejorar rendimiento de respuestas
CREATE INDEX idx_project_comments_parent_id ON public.project_comments(parent_id);

-- Agregar trigger para actualizar updated_at en notifications
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
