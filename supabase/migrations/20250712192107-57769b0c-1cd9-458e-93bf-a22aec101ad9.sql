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
    COALESCE(c.address, 'Dirección pendiente'),
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