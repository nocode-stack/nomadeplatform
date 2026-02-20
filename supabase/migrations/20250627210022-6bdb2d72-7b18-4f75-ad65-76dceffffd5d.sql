
-- Crear tabla para almacenar múltiples conceptos/puntos de reparación por incidencia
CREATE TABLE public.incident_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_id UUID REFERENCES public.incidents(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear bucket de almacenamiento para fotos de incidencias
INSERT INTO storage.buckets (id, name, public) 
VALUES ('incident-photos', 'incident-photos', true);

-- Crear política para permitir subir fotos
CREATE POLICY "Anyone can upload incident photos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'incident-photos');

-- Crear política para ver fotos
CREATE POLICY "Anyone can view incident photos" ON storage.objects
FOR SELECT USING (bucket_id = 'incident-photos');

-- Crear política para eliminar fotos (solo el propietario o admin)
CREATE POLICY "Users can delete their incident photos" ON storage.objects
FOR DELETE USING (bucket_id = 'incident-photos');

-- Agregar trigger para actualizar updated_at en incident_items
CREATE TRIGGER update_incident_items_updated_at
    BEFORE UPDATE ON public.incident_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Modificar la tabla incidents para mejorar el manejo de fotos
ALTER TABLE public.incidents ALTER COLUMN photos SET DEFAULT '[]'::jsonb;
