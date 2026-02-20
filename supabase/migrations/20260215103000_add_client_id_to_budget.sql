-- Añadir columna client_id a NEW_Budget para relación directa con NEW_Clients
ALTER TABLE public."NEW_Budget" 
ADD COLUMN client_id UUID REFERENCES public."NEW_Clients"(id);

-- Desactivar triggers temporalmente para evitar el error 27000 durante el backfill
ALTER TABLE public."NEW_Budget" DISABLE TRIGGER USER;

-- Backfill de datos existentes: obtener client_id desde NEW_Projects
UPDATE public."NEW_Budget" b
SET client_id = p.client_id
FROM public."NEW_Projects" p
WHERE b.project_id = p.id;

-- Reactivar triggers
ALTER TABLE public."NEW_Budget" ENABLE TRIGGER USER;

-- Añadir comentario descriptivo
COMMENT ON COLUMN public."NEW_Budget".client_id IS 'Relación directa con el cliente para facilitar el filtrado y la gestión de leads.';
