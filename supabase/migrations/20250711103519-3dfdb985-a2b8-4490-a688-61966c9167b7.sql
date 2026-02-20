-- Crear tabla NEW_Comments
CREATE TABLE public."NEW_Comments" (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  tagged_user_id uuid NULL,
  message text NOT NULL,
  is_important boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Foreign key constraints
  CONSTRAINT "NEW_Comments_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public."NEW_Projects"(id) ON DELETE CASCADE,
  CONSTRAINT "NEW_Comments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  CONSTRAINT "NEW_Comments_tagged_user_id_fkey" FOREIGN KEY (tagged_user_id) REFERENCES public.user_profiles(user_id) ON DELETE SET NULL
);

-- Habilitar RLS
ALTER TABLE public."NEW_Comments" ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view all comments" 
ON public."NEW_Comments" 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create comments" 
ON public."NEW_Comments" 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own comments" 
ON public."NEW_Comments" 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public."NEW_Comments" 
FOR DELETE 
USING (auth.uid() = user_id);

-- Crear índices para mejorar rendimiento
CREATE INDEX "idx_new_comments_project_id" ON public."NEW_Comments"(project_id);
CREATE INDEX "idx_new_comments_user_id" ON public."NEW_Comments"(user_id);
CREATE INDEX "idx_new_comments_tagged_user_id" ON public."NEW_Comments"(tagged_user_id);
CREATE INDEX "idx_new_comments_created_at" ON public."NEW_Comments"(created_at DESC);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_new_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "update_new_comments_updated_at_trigger"
  BEFORE UPDATE ON public."NEW_Comments"
  FOR EACH ROW
  EXECUTE FUNCTION public.update_new_comments_updated_at();