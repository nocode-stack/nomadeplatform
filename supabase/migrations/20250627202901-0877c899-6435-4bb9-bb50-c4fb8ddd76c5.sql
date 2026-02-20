
-- Crear tabla para incidencias
CREATE TABLE public.incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Mobiliario', 'Sistema eléctrico', 'Agua', 'Gas', 'Revestimiento', 'Vehículo', 'Filtraciones')),
  incident_date DATE NOT NULL,
  description TEXT NOT NULL,
  workshop TEXT NOT NULL CHECK (workshop IN ('Nomade', 'Caravaning Plaza', 'Planeta Camper', 'Al Milimetro')),
  status TEXT NOT NULL DEFAULT 'reportada' CHECK (status IN ('reportada', 'fechas_asignadas', 'en_reparacion', 'entregada')),
  photos JSONB DEFAULT '[]'::jsonb,
  repair_entry_date DATE NULL,
  repair_exit_date DATE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear índices para mejorar el rendimiento de las consultas
CREATE INDEX idx_incidents_project_id ON public.incidents(project_id);
CREATE INDEX idx_incidents_status ON public.incidents(status);
CREATE INDEX idx_incidents_incident_date ON public.incidents(incident_date);
CREATE INDEX idx_incidents_workshop ON public.incidents(workshop);

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON public.incidents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
