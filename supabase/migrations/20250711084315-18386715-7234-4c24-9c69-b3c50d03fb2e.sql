-- Verificar y corregir el trigger para generar códigos de vehículo automáticamente

-- Primero eliminar trigger existente si existe
DROP TRIGGER IF EXISTS set_vehicle_code_trigger ON "NEW_Vehicles";

-- Recrear la función de generación de código de vehículo
CREATE OR REPLACE FUNCTION public.generate_vehicle_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  year_suffix TEXT;
  next_number INTEGER;
  result_code TEXT;
BEGIN
  -- Obtener los últimos 2 dígitos del año actual
  year_suffix := RIGHT(EXTRACT(YEAR FROM CURRENT_DATE)::TEXT, 2);
  
  -- Buscar el siguiente número secuencial para este año
  SELECT COALESCE(MAX(CAST(RIGHT(vehicle_code, 3) AS INTEGER)), 0) + 1
  INTO next_number
  FROM "NEW_Vehicles"
  WHERE vehicle_code LIKE 'VH_' || year_suffix || '%';
  
  -- Format: VH_año(2 dígitos)_número secuencial(3 dígitos con ceros)
  result_code := 'VH_' || year_suffix || '_' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN result_code;
END;
$$;

-- Recrear la función trigger
CREATE OR REPLACE FUNCTION public.set_vehicle_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Solo generar código si no existe o es TEMP_CODE
  IF NEW.vehicle_code IS NULL OR NEW.vehicle_code = '' OR NEW.vehicle_code = 'TEMP_CODE' THEN
    NEW.vehicle_code := generate_vehicle_code();
  END IF;
  RETURN NEW;
END;
$$;

-- Crear el trigger en la tabla NEW_Vehicles
CREATE TRIGGER set_vehicle_code_trigger
  BEFORE INSERT ON "NEW_Vehicles"
  FOR EACH ROW 
  EXECUTE FUNCTION public.set_vehicle_code();