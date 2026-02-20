-- Fase 1: Añadir campo client_status y códigos de prospect

-- 1. Añadir columna client_status a NEW_Clients con default 'client' para mantener compatibilidad
ALTER TABLE public."NEW_Clients" 
ADD COLUMN client_status TEXT NOT NULL DEFAULT 'client';

-- 2. Añadir constraint para validar los valores permitidos
ALTER TABLE public."NEW_Clients" 
ADD CONSTRAINT check_client_status CHECK (client_status IN ('prospect', 'client'));

-- 3. Crear función para generar códigos de prospect (PC_YY_NNN)
CREATE OR REPLACE FUNCTION public.generate_prospect_code()
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
  
  -- Buscar el siguiente número secuencial para este año en prospects
  SELECT COALESCE(MAX(CAST(RIGHT(client_code, 3) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public."NEW_Clients"
  WHERE client_code LIKE 'PC_' || year_suffix || '%';
  
  -- Format: PC_año(2 dígitos)_número secuencial(3 dígitos)
  result_code := 'PC_' || year_suffix || '_' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN result_code;
END;
$$;

-- 4. Modificar función set_client_code para usar prospect_code o client_code según status
CREATE OR REPLACE FUNCTION public.set_client_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Solo generar código si client_code es NULL o vacío
  IF NEW.client_code IS NULL OR NEW.client_code = '' THEN
    -- Determinar qué tipo de código generar según el client_status
    IF NEW.client_status = 'prospect' THEN
      NEW.client_code := generate_prospect_code();
    ELSE
      NEW.client_code := generate_client_code();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;