-- =====================================
-- MIGRACIÓN 2: Añadir price_export a TODAS las tablas de opciones
-- =====================================
-- ESTRATEGIA SEGURA: Mantener columns existentes (price_modifier / price)
-- como precio Península. Solo AÑADIR price_export para Canarias/Internacional.
-- Así la app actual sigue funcionando sin cambios inmediatos.
--
-- price_modifier / price = Precio Península (IVA incluido)
-- price_export           = Precio Canarias/Internacional (sin IVA)

-- ─── model_options ──────────────────
ALTER TABLE model_options
  ADD COLUMN IF NOT EXISTS price_export NUMERIC NOT NULL DEFAULT 0;

UPDATE model_options SET price_export = price_modifier WHERE price_export = 0;


-- ─── engine_options ─────────────────
ALTER TABLE engine_options
  ADD COLUMN IF NOT EXISTS price_export NUMERIC NOT NULL DEFAULT 0;

-- Campo para restringir motores por ubicación
-- Motores manuales NO disponibles para Internacional
ALTER TABLE engine_options
  ADD COLUMN IF NOT EXISTS available_locations TEXT[] NOT NULL DEFAULT '{peninsula,canarias,internacional}';

-- Copiar precio actual como base
UPDATE engine_options SET price_export = price_modifier WHERE price_export = 0;

-- Restringir manuales a Península y Canarias solamente
UPDATE engine_options
  SET available_locations = '{peninsula,canarias}'
  WHERE LOWER(transmission) = 'manual';


-- ─── exterior_color_options ─────────
ALTER TABLE exterior_color_options
  ADD COLUMN IF NOT EXISTS price_export NUMERIC NOT NULL DEFAULT 0;

UPDATE exterior_color_options SET price_export = price_modifier WHERE price_export = 0;


-- ─── interior_color_options ─────────
ALTER TABLE interior_color_options
  ADD COLUMN IF NOT EXISTS price_export NUMERIC NOT NULL DEFAULT 0;

UPDATE interior_color_options SET price_export = price_modifier WHERE price_export = 0;


-- ─── NEW_Budget_Packs ───────────────
-- (campo actual es 'price', no 'price_modifier')
ALTER TABLE "NEW_Budget_Packs"
  ADD COLUMN IF NOT EXISTS price_export NUMERIC NOT NULL DEFAULT 0;

UPDATE "NEW_Budget_Packs" SET price_export = COALESCE(price, 0) WHERE price_export = 0;


-- ─── NEW_Budget_Electric ────────────
-- (campo actual es 'price')
ALTER TABLE "NEW_Budget_Electric"
  ADD COLUMN IF NOT EXISTS price_export NUMERIC NOT NULL DEFAULT 0;

UPDATE "NEW_Budget_Electric" SET price_export = COALESCE(price, 0) WHERE price_export = 0;


-- ─── NEW_Budget_Additional_Items ────
-- (campo actual es 'price')
ALTER TABLE "NEW_Budget_Additional_Items"
  ADD COLUMN IF NOT EXISTS price_export NUMERIC NOT NULL DEFAULT 0;

UPDATE "NEW_Budget_Additional_Items" SET price_export = COALESCE(price, 0) WHERE price_export = 0;
