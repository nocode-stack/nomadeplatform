-- Limpiar datos duplicados en motorización de vehículos existentes
UPDATE public."NEW_Vehicles" 
SET engine = CASE
  WHEN engine = '140cv Manual 140cv Manual' THEN '140cv Manual'
  WHEN engine = '180cv Automática 180cv Automática' THEN '180cv Automática'
  WHEN engine LIKE '%140cv Manual%140cv Manual%' THEN '140cv Manual'
  WHEN engine LIKE '%180cv Automática%180cv Automática%' THEN '180cv Automática'
  -- Para patrones duplicados generales, tomar la primera mitad del string
  WHEN length(engine) > 0 AND char_length(engine) % 2 = 1 AND 
       substring(engine, 1, char_length(engine)/2) = substring(engine, char_length(engine)/2 + 2) THEN
    substring(engine, 1, char_length(engine)/2)
  WHEN length(engine) > 0 AND char_length(engine) % 2 = 0 AND 
       substring(engine, 1, char_length(engine)/2) = substring(engine, char_length(engine)/2 + 1) THEN
    substring(engine, 1, char_length(engine)/2)
  ELSE engine
END,
updated_at = now()
WHERE engine IS NOT NULL 
  AND (
    engine LIKE '%140cv Manual%140cv Manual%' OR
    engine LIKE '%180cv Automática%180cv Automática%' OR
    -- Buscar patrones donde la primera mitad sea igual a la segunda mitad
    (length(engine) > 10 AND (
      (char_length(engine) % 2 = 1 AND substring(engine, 1, char_length(engine)/2) = substring(engine, char_length(engine)/2 + 2)) OR
      (char_length(engine) % 2 = 0 AND substring(engine, 1, char_length(engine)/2) = substring(engine, char_length(engine)/2 + 1))
    ))
  );