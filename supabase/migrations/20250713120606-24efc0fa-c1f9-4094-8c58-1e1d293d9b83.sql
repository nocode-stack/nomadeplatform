-- FASE 4: TESTING Y VALIDACIÓN - Script de verificación

-- Crear función para validar la migración
CREATE OR REPLACE FUNCTION validate_budget_migration()
RETURNS TABLE(
  table_name TEXT,
  record_count BIGINT,
  status TEXT
) AS $$
BEGIN
  -- Verificar NEW_Budget_Concepts
  RETURN QUERY
  SELECT 
    'NEW_Budget_Concepts'::TEXT,
    COUNT(*),
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'EMPTY' END::TEXT
  FROM public."NEW_Budget_Concepts";
  
  -- Verificar NEW_Budget_Packs
  RETURN QUERY
  SELECT 
    'NEW_Budget_Packs'::TEXT,
    COUNT(*),
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'EMPTY' END::TEXT
  FROM public."NEW_Budget_Packs";
  
  -- Verificar NEW_Budget_Discounts
  RETURN QUERY
  SELECT 
    'NEW_Budget_Discounts'::TEXT,
    COUNT(*),
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'EMPTY' END::TEXT
  FROM public."NEW_Budget_Discounts";
  
  -- Verificar NEW_Budget_Default_Components
  RETURN QUERY
  SELECT 
    'NEW_Budget_Default_Components'::TEXT,
    COUNT(*),
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'EMPTY' END::TEXT
  FROM public."NEW_Budget_Default_Components";
  
  -- Verificar NEW_Budget_Structure
  RETURN QUERY
  SELECT 
    'NEW_Budget_Structure'::TEXT,
    COUNT(*),
    CASE WHEN COUNT(*) > 0 THEN 'HAS_DATA' ELSE 'READY' END::TEXT
  FROM public."NEW_Budget_Structure";
  
  -- Verificar NEW_Budget_Items
  RETURN QUERY
  SELECT 
    'NEW_Budget_Items'::TEXT,
    COUNT(*),
    CASE WHEN COUNT(*) > 0 THEN 'HAS_DATA' ELSE 'READY' END::TEXT
  FROM public."NEW_Budget_Items";
END;
$$ LANGUAGE plpgsql;

-- Ejecutar validación
SELECT * FROM validate_budget_migration();

-- Crear datos de prueba si es necesario
DO $$
DECLARE
  test_project_id UUID;
  test_budget_id UUID;
BEGIN
  -- Buscar un proyecto existente para pruebas
  SELECT id INTO test_project_id 
  FROM public."NEW_Projects" 
  LIMIT 1;
  
  -- Si existe un proyecto, crear un presupuesto de prueba
  IF test_project_id IS NOT NULL THEN
    -- Crear presupuesto de prueba
    INSERT INTO public."NEW_Budget_Structure" (
      budget_type,
      status,
      subtotal,
      total,
      discount_percentage,
      project_id
    ) VALUES (
      'project',
      'draft',
      1000,
      1000,
      0,
      test_project_id
    )
    RETURNING id INTO test_budget_id;
    
    -- Agregar algunos items de prueba
    INSERT INTO public."NEW_Budget_Items" (
      budget_id,
      name,
      price,
      quantity,
      line_total,
      is_custom,
      is_discount,
      order_index
    ) VALUES 
    (test_budget_id, 'Concepto de Prueba 1', 500, 1, 500, true, false, 1),
    (test_budget_id, 'Concepto de Prueba 2', 500, 1, 500, true, false, 2);
    
    RAISE NOTICE 'Presupuesto de prueba creado con ID: %', test_budget_id;
  ELSE
    RAISE NOTICE 'No se encontraron proyectos para crear presupuesto de prueba';
  END IF;
END;
$$;

-- Crear vista para monitoreo del sistema migrado
CREATE OR REPLACE VIEW budget_migration_status AS
SELECT 
  'Conceptos Migrados' as component,
  COUNT(*) as count,
  'NEW_Budget_Concepts' as table_name
FROM public."NEW_Budget_Concepts"
UNION ALL
SELECT 
  'Packs Migrados' as component,
  COUNT(*) as count,
  'NEW_Budget_Packs' as table_name
FROM public."NEW_Budget_Packs"
UNION ALL
SELECT 
  'Descuentos Configurados' as component,
  COUNT(*) as count,
  'NEW_Budget_Discounts' as table_name
FROM public."NEW_Budget_Discounts"
UNION ALL
SELECT 
  'Componentes Base' as component,
  COUNT(*) as count,
  'NEW_Budget_Default_Components' as table_name
FROM public."NEW_Budget_Default_Components"
UNION ALL
SELECT 
  'Presupuestos Nuevos' as component,
  COUNT(*) as count,
  'NEW_Budget_Structure' as table_name
FROM public."NEW_Budget_Structure"
UNION ALL
SELECT 
  'Items de Presupuesto' as component,
  COUNT(*) as count,
  'NEW_Budget_Items' as table_name
FROM public."NEW_Budget_Items";

-- Verificar el estado de la migración
SELECT * FROM budget_migration_status ORDER BY component;