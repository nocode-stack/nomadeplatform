
-- Eliminar TODAS las políticas existentes de la tabla notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can create their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can create any notification" ON public.notifications;

-- Deshabilitar RLS temporalmente para limpiar
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- Volver a habilitar RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Crear políticas nuevas y más específicas
CREATE POLICY "Allow authenticated users to view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to create notifications for anyone" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Verificar que las políticas se han aplicado correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'notifications';
