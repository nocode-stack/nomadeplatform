-- Crear clientes para los proyectos que no tienen client_id asignado
-- Proyecto EG2703 (2507_IR_MAES)
INSERT INTO "NEW_Clients" (name, email, phone, created_at)
VALUES ('Cliente Proyecto MAES', 'maes@ejemplo.com', '600000000', now())
ON CONFLICT DO NOTHING;

-- Proyecto EG2701 (433223)  
INSERT INTO "NEW_Clients" (name, email, phone, created_at)
VALUES ('Cliente Proyecto 433223', '433223@ejemplo.com', '600000001', now())
ON CONFLICT DO NOTHING;

-- Asignar los clientes a los proyectos
UPDATE projects 
SET client_id = (
  SELECT id FROM "NEW_Clients" 
  WHERE name = 'Cliente Proyecto MAES' 
  LIMIT 1
)
WHERE code = 'EG2703' AND client_id IS NULL;

UPDATE projects 
SET client_id = (
  SELECT id FROM "NEW_Clients" 
  WHERE name = 'Cliente Proyecto 433223' 
  LIMIT 1
)
WHERE code = 'EG2701' AND client_id IS NULL;