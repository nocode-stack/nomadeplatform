
-- Crear tabla para comentarios de proyectos
CREATE TABLE public.project_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_project_comments_updated_at
  BEFORE UPDATE ON public.project_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Agregar campos de facturación a la tabla projects
ALTER TABLE public.projects ADD COLUMN billing_type TEXT DEFAULT 'client' CHECK (billing_type IN ('client', 'custom', 'company'));
ALTER TABLE public.projects ADD COLUMN billing_name TEXT;
ALTER TABLE public.projects ADD COLUMN billing_email TEXT;
ALTER TABLE public.projects ADD COLUMN billing_phone TEXT;
ALTER TABLE public.projects ADD COLUMN billing_address TEXT;
ALTER TABLE public.projects ADD COLUMN billing_dni TEXT;
ALTER TABLE public.projects ADD COLUMN billing_company_name TEXT;
ALTER TABLE public.projects ADD COLUMN billing_company_cif TEXT;
ALTER TABLE public.projects ADD COLUMN billing_company_address TEXT;

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_project_comments_project_id ON public.project_comments(project_id);
CREATE INDEX idx_project_comments_created_at ON public.project_comments(created_at DESC);
