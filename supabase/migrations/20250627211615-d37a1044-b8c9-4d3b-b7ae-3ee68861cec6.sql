
-- Crear tabla de perfiles de usuario
CREATE TABLE public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  department TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en la tabla de perfiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios puedan ver todos los perfiles (para comentarios)
CREATE POLICY "Users can view all profiles" ON public.user_profiles
FOR SELECT USING (true);

-- Política para que los usuarios solo puedan editar su propio perfil
CREATE POLICY "Users can update their own profile" ON public.user_profiles
FOR UPDATE USING (auth.uid() = user_id);

-- Política para que los usuarios puedan insertar su propio perfil
CREATE POLICY "Users can insert their own profile" ON public.user_profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Función para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Trigger para crear perfil automáticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Agregar trigger para actualizar updated_at en user_profiles
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Modificar tabla de comentarios para usar user_id en lugar de author_name
ALTER TABLE public.project_comments 
DROP COLUMN author_name,
ADD COLUMN user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE;

-- Habilitar RLS en project_comments
ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;

-- Política para que todos puedan ver comentarios
CREATE POLICY "Anyone can view comments" ON public.project_comments
FOR SELECT USING (true);

-- Política para que usuarios autenticados puedan crear comentarios
CREATE POLICY "Authenticated users can create comments" ON public.project_comments
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para que usuarios puedan editar sus propios comentarios
CREATE POLICY "Users can edit their own comments" ON public.project_comments
FOR UPDATE USING (auth.uid() = user_id);
