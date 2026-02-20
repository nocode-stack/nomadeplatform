-- PASO 1: Limpiar triggers duplicados en NEW_Clients
-- Solo eliminamos triggers que ejecutan las MISMAS funciones

-- ===== GRUPO 1: Triggers de conversión prospect→client =====
-- Mantener: sync_project_status_with_client_trigger (más completo: INSERT OR UPDATE)
-- Eliminar: create_project_on_client_conversion y on_client_status_change (duplicados)

DROP TRIGGER IF EXISTS create_project_on_client_conversion ON public."NEW_Clients";
DROP TRIGGER IF EXISTS on_client_status_change ON public."NEW_Clients";

-- ===== GRUPO 2: Triggers de sincronización de contratos =====
-- Mantener: sync_client_data_to_contracts_insert_trigger (AFTER INSERT)
-- Mantener: sync_client_data_to_contracts_trigger (AFTER UPDATE)  
-- Eliminar: sync_client_data_trigger (duplicado de UPDATE)

DROP TRIGGER IF EXISTS sync_client_data_trigger ON public."NEW_Clients";

-- ===== VERIFICACIÓN: Verificar que los triggers necesarios siguen activos =====
SELECT 
  tgname as trigger_name,
  CASE 
    WHEN tgtype & 1 = 1 THEN 'ROW'
    ELSE 'STATEMENT'
  END as trigger_type,
  CASE 
    WHEN tgtype & 2 = 2 THEN 'BEFORE'
    ELSE 'AFTER'
  END as timing,
  CASE 
    WHEN tgtype & 4 = 4 THEN 'INSERT '
    ELSE ''
  END ||
  CASE 
    WHEN tgtype & 8 = 8 THEN 'DELETE '
    ELSE ''
  END ||
  CASE 
    WHEN tgtype & 16 = 16 THEN 'UPDATE '
    ELSE ''
  END as events,
  pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger 
WHERE tgrelid = (SELECT oid FROM pg_class WHERE relname = 'NEW_Clients')
  AND tgname NOT LIKE 'RI_ConstraintTrigger%'
ORDER BY tgname;