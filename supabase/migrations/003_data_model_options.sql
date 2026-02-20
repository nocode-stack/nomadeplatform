-- =====================================
-- DATOS: model_options — precios reales
-- =====================================
-- Ejecutar DESPUÉS de 002_add_regional_prices.sql

-- Neo: 67.500€ peninsula / 55.790€ export
UPDATE model_options
  SET price_modifier = 67500, price_export = 55790
  WHERE name = 'Neo';

-- Neo S: 67.500€ peninsula / 55.790€ export
UPDATE model_options
  SET price_modifier = 67500, price_export = 55790
  WHERE name = 'Neo S';

-- Neo Mini: 67.500€ peninsula / 55.790€ export
UPDATE model_options
  SET price_modifier = 67500, price_export = 55790
  WHERE name = 'Neo Mini';

-- Space: 69.900€ peninsula / 57.770€ export
UPDATE model_options
  SET price_modifier = 69900, price_export = 57770
  WHERE name = 'Space';
