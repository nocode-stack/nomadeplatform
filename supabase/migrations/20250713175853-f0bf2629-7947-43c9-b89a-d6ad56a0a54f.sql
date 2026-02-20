-- Eliminar funciones y triggers que usan budget_number
DROP FUNCTION IF EXISTS generate_new_budget_number() CASCADE;
DROP FUNCTION IF EXISTS set_new_budget_number() CASCADE;

-- Verificar que no haya triggers sobre NEW_Budget que usen budget_number
-- Los triggers para budget_code ya existen y funcionan correctamente