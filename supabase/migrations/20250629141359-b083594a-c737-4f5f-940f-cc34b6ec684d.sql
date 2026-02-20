
-- Eliminar todas las políticas existentes para empezar limpio
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can create their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;

-- Política para que usuarios vean solo sus notificaciones
CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT USING (auth.uid() = user_id);

-- Política más permisiva para INSERT - permite a cualquier usuario autenticado crear notificaciones
CREATE POLICY "Authenticated users can create any notification" ON public.notifications
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Política para que usuarios puedan marcar sus notificaciones como leídas
CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE USING (auth.uid() = user_id);

-- Asegurar que RLS está habilitado
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
