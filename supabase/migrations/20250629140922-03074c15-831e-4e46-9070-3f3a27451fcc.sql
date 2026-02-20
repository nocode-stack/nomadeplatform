
-- Actualizar la política de INSERT para permitir crear notificaciones para otros usuarios
DROP POLICY IF EXISTS "Users can create their own notifications" ON public.notifications;

CREATE POLICY "Users can create notifications" ON public.notifications
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Asegurar que la tabla tenga RLS habilitada
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
