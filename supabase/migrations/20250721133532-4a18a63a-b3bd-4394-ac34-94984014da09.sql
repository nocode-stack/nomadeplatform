
-- Fase 1: Mejora de Base de Datos para Precios Dinámicos de Sistemas Eléctricos

-- Agregar columna pack_pricing_rules a NEW_Budget_Electric
ALTER TABLE public."NEW_Budget_Electric" 
ADD COLUMN pack_pricing_rules JSONB DEFAULT NULL;

-- Comentar la estructura esperada del JSONB
COMMENT ON COLUMN public."NEW_Budget_Electric".pack_pricing_rules IS 
'Reglas de precios por pack en formato JSONB. Estructura esperada:
{
  "Adventure": {"type": "free", "reason": "Incluido en pack"},
  "Ultimate": {"type": "free", "reason": "Incluido en pack"},
  "pack_id_uuid": {"type": "discount", "amount": 500, "reason": "Descuento pack"}
}';

-- Crear función para calcular precio de sistema eléctrico según pack
CREATE OR REPLACE FUNCTION public.calculate_electric_system_price_for_pack(
  system_id UUID,
  pack_id UUID DEFAULT NULL,
  pack_name TEXT DEFAULT NULL
)
RETURNS TABLE(
  final_price NUMERIC,
  original_price NUMERIC,
  discount_amount NUMERIC,
  is_free BOOLEAN,
  discount_reason TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  electric_system RECORD;
  pack_rule JSONB;
  rule_type TEXT;
  rule_amount NUMERIC;
  rule_reason TEXT;
BEGIN
  -- Obtener datos del sistema eléctrico
  SELECT * INTO electric_system
  FROM public."NEW_Budget_Electric"
  WHERE id = system_id AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sistema eléctrico no encontrado: %', system_id;
  END IF;
  
  -- Inicializar valores por defecto
  final_price := electric_system.price;
  original_price := electric_system.price;
  discount_amount := 0;
  is_free := false;
  discount_reason := null;
  
  -- Si hay reglas de pack definidas
  IF electric_system.pack_pricing_rules IS NOT NULL THEN
    -- Buscar regla por pack_id primero, luego por pack_name
    IF pack_id IS NOT NULL THEN
      pack_rule := electric_system.pack_pricing_rules->pack_id::text;
    END IF;
    
    IF pack_rule IS NULL AND pack_name IS NOT NULL THEN
      pack_rule := electric_system.pack_pricing_rules->pack_name;
    END IF;
    
    -- Aplicar regla si existe
    IF pack_rule IS NOT NULL THEN
      rule_type := pack_rule->>'type';
      rule_amount := (pack_rule->>'amount')::NUMERIC;
      rule_reason := pack_rule->>'reason';
      
      CASE rule_type
        WHEN 'free' THEN
          final_price := 0;
          discount_amount := original_price;
          is_free := true;
          discount_reason := COALESCE(rule_reason, 'Incluido en pack');
        WHEN 'discount' THEN
          discount_amount := COALESCE(rule_amount, 0);
          final_price := GREATEST(0, original_price - discount_amount);
          discount_reason := COALESCE(rule_reason, 'Descuento por pack');
        WHEN 'fixed_price' THEN
          final_price := COALESCE(rule_amount, original_price);
          discount_amount := GREATEST(0, original_price - final_price);
          discount_reason := COALESCE(rule_reason, 'Precio especial por pack');
      END CASE;
    END IF;
  END IF;
  
  -- Fallback a discount_price si no hay reglas específicas y existe descuento
  IF electric_system.pack_pricing_rules IS NULL AND electric_system.discount_price IS NOT NULL 
     AND electric_system.discount_price < electric_system.price THEN
    final_price := electric_system.discount_price;
    discount_amount := electric_system.price - electric_system.discount_price;
    discount_reason := 'Precio con descuento';
  END IF;
  
  RETURN NEXT;
END;
$$;

-- Insertar reglas de ejemplo para sistemas existentes
UPDATE public."NEW_Budget_Electric" 
SET pack_pricing_rules = '{
  "Adventure": {"type": "free", "reason": "Incluido en pack Adventure"},
  "Ultimate": {"type": "free", "reason": "Incluido en pack Ultimate"}
}'
WHERE name ILIKE '%litio%' AND NOT name ILIKE '%+%' AND NOT name ILIKE '%plus%' AND NOT name ILIKE '%pro%';

UPDATE public."NEW_Budget_Electric" 
SET pack_pricing_rules = '{
  "Adventure": {"type": "discount", "amount": 300, "reason": "Descuento pack Adventure"},
  "Ultimate": {"type": "discount", "amount": 500, "reason": "Descuento pack Ultimate"}
}'
WHERE (name ILIKE '%litio+%' OR name ILIKE '%litio plus%' OR name ILIKE '%pro%') AND is_active = true;

-- Crear índice para mejorar performance en consultas JSONB
CREATE INDEX IF NOT EXISTS idx_electric_pack_pricing_rules 
ON public."NEW_Budget_Electric" USING GIN (pack_pricing_rules);

-- Agregar función trigger para validar formato de pack_pricing_rules
CREATE OR REPLACE FUNCTION public.validate_pack_pricing_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validar que el JSONB tenga la estructura correcta si no es NULL
  IF NEW.pack_pricing_rules IS NOT NULL THEN
    -- Verificar que cada valor tenga al menos 'type'
    IF NOT (
      SELECT bool_and(
        jsonb_typeof(value) = 'object' AND 
        value ? 'type' AND 
        value->>'type' IN ('free', 'discount', 'fixed_price')
      )
      FROM jsonb_each(NEW.pack_pricing_rules) AS entry(key, value)
    ) THEN
      RAISE EXCEPTION 'pack_pricing_rules debe tener formato válido: {"pack_name": {"type": "free|discount|fixed_price", "amount": number, "reason": "text"}}';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger para validación
DROP TRIGGER IF EXISTS validate_pack_pricing_rules_trigger ON public."NEW_Budget_Electric";
CREATE TRIGGER validate_pack_pricing_rules_trigger
  BEFORE INSERT OR UPDATE ON public."NEW_Budget_Electric"
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_pack_pricing_rules();
