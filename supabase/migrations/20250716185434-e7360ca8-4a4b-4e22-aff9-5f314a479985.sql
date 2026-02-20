-- Limpiar datos duplicados en motorización de vehículos existentes
UPDATE public."NEW_Vehicles" 
SET engine = CASE 
  -- Si el engine contiene texto duplicado (ej: "140cv Manual 140cv Manual")
  WHEN engine LIKE '% %' AND engine ~ '^(.+?) \1$' THEN 
    -- Extraer solo la primera parte usando regex
    (regexp_split_to_array(engine, ' '))[1:array_length(regexp_split_to_array(engine, ' '), 1)/2]::text[]
    |> array_to_string(VARIADIC ARRAY[' '])
  -- Si no hay duplicación, mantener el valor original
  ELSE engine
END,
updated_at = now()
WHERE engine IS NOT NULL 
  AND engine LIKE '% %' 
  AND engine ~ '^(.+?) \1$';

-- Alternativa más simple usando substring para casos comunes
UPDATE public."NEW_Vehicles" 
SET engine = CASE
  WHEN engine = '140cv Manual 140cv Manual' THEN '140cv Manual'
  WHEN engine = '180cv Automática 180cv Automática' THEN '180cv Automática'
  WHEN engine LIKE '%140cv Manual%140cv Manual%' THEN '140cv Manual'
  WHEN engine LIKE '%180cv Automática%180cv Automática%' THEN '180cv Automática'
  -- Para cualquier otro patrón duplicado, tomar la primera mitad
  WHEN length(engine) > 0 AND position(' ' || split_part(engine, ' ', 1) IN substring(engine from position(' ' IN engine) + 1)) > 0 THEN
    left(engine, length(engine) / 2)
  ELSE engine
END,
updated_at = now()
WHERE engine IS NOT NULL 
  AND (
    engine LIKE '%140cv Manual%140cv Manual%' OR
    engine LIKE '%180cv Automática%180cv Automática%' OR
    (length(engine) > 10 AND position(' ' || split_part(engine, ' ', 1) IN substring(engine from position(' ' IN engine) + 1)) > 0)
  );