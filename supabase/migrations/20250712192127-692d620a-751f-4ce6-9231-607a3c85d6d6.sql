-- Crear información de facturación para proyectos existentes que no la tienen
INSERT INTO public."NEW_Billing" (
  client_id,
  name,
  email,
  phone,
  billing_address,
  type
)
SELECT DISTINCT
  c.id,
  c.name,
  c.email,
  c.phone,
  COALESCE(c.address, 'Dirección pendiente'),
  'individual'
FROM public."NEW_Clients" c
INNER JOIN public."NEW_Projects" p ON p.client_id = c.id
WHERE NOT EXISTS (
  SELECT 1 FROM public."NEW_Billing" b 
  WHERE b.client_id = c.id
);