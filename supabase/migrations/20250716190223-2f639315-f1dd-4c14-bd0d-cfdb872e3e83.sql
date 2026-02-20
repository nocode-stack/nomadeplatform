-- Separar completamente engine y transmission_type en NEW_Vehicles
-- Limpiar campo engine para que contenga solo la potencia

UPDATE public."NEW_Vehicles" 
SET engine = CASE
  -- Extraer solo la potencia del motor
  WHEN engine ~* '(\d+cv)' THEN (regexp_match(engine, '(\d+cv)', 'i'))[1]
  ELSE engine
END,
updated_at = now()
WHERE engine IS NOT NULL 
  AND (engine LIKE '%Manual%' OR engine LIKE '%Automática%' OR engine LIKE '%Automatica%');