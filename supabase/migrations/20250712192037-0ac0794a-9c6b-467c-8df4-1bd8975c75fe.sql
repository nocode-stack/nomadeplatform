-- Crear función para generar automáticamente información de facturación al crear un proyecto
CREATE OR REPLACE FUNCTION public.create_default_billing_info()
RETURNS TRIGGER AS $$
BEGIN
  -- Crear información de facturación predeterminada con los datos del cliente
  INSERT INTO public."NEW_Billing" (
    client_id,
    name,
    email,
    phone,
    billing_address,
    type
  )
  SELECT 
    NEW.client_id,
    c.name,
    c.email,
    c.phone,
    c.address,
    'individual'
  FROM public."NEW_Clients" c
  WHERE c.id = NEW.client_id
  AND NEW.client_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public."NEW_Billing" 
    WHERE client_id = NEW.client_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para generar información de facturación automáticamente
CREATE TRIGGER create_billing_info_trigger
  AFTER INSERT ON public."NEW_Projects"
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_billing_info();

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
  c.address,
  'individual'
FROM public."NEW_Clients" c
INNER JOIN public."NEW_Projects" p ON p.client_id = c.id
WHERE NOT EXISTS (
  SELECT 1 FROM public."NEW_Billing" b 
  WHERE b.client_id = c.id
);