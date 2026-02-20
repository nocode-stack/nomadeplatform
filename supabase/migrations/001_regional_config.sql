-- =====================================
-- MIGRACIÓN 1: Tabla regional_config
-- =====================================
-- Centraliza IVA, IEDMT, textos legales por ubicación

CREATE TABLE IF NOT EXISTS regional_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location TEXT UNIQUE NOT NULL,
    iva_rate NUMERIC NOT NULL DEFAULT 0,
    iva_label TEXT NOT NULL DEFAULT 'IVA',
    iedmt_rate NUMERIC NOT NULL DEFAULT 0,
    iedmt_applies BOOLEAN NOT NULL DEFAULT false,
    currency TEXT NOT NULL DEFAULT 'EUR',
    legal_text TEXT,
    legal_text_extra TEXT,
    budget_footer TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Datos iniciales
INSERT INTO regional_config (location, iva_rate, iva_label, iedmt_rate, iedmt_applies, legal_text, legal_text_extra, budget_footer)
VALUES
  (
    'peninsula',
    21,
    'IVA',
    0.0475,
    true,
    'Este presupuesto no incluye impuestos de matriculación. Este importe se deberá abonar por parte del cliente una vez comprado el vehículo. El importe de matriculación puede variar según la antigüedad del vehículo u otros factores, quedando exentos, personas con un 30% o más de discapacidad, personas con dependencia, autónomos o empresas. Este presupuesto no incluye los costes de transporte. El coste del transporte nacional es de 1.200€ (consultar para entregas fuera de España)',
    NULL,
    '© Nomade Vans S.L. — Todos los derechos reservados.'
  ),
  (
    'canarias',
    7,
    'IGIC',
    0,
    false,
    'Este presupuesto no incluye impuestos de matriculación. Este importe se deberá abonar por parte del cliente una vez comprado el vehículo. El importe de matriculación puede variar según la antigüedad del vehículo u otros factores, quedando exentos, personas con un 30% o más de discapacidad, personas con dependencia, autónomos o empresas. Este presupuesto no incluye los costes de transporte. El coste del transporte nacional es de 1.200€ (consultar para entregas fuera de España)',
    'Operación prevista con destino a Canarias, territorio no incluido en el ámbito de aplicación del IVA. Facturación exenta de IVA conforme al artículo 21 de la Ley 37/1992 (LIVA), condicionada a la correcta tramitación aduanera y acreditación de la salida efectiva del territorio IVA peninsular. En destino se aplicará el Impuesto General Indirecto Canario (IGIC) correspondiente. En caso de no acreditarse la salida efectiva del territorio IVA, se aplicará el IVA vigente (21%).',
    '© Nomade Vans S.L. — Todos los derechos reservados.'
  ),
  (
    'internacional',
    0,
    'N/A',
    0,
    false,
    'Este presupuesto no incluye impuestos de matriculación. Este importe se deberá abonar por parte del cliente una vez comprado el vehículo. El importe de matriculación puede variar según la antigüedad del vehículo u otros factores, quedando exentos, personas con un 30% o más de discapacidad, personas con dependencia, autónomos o empresas. Este presupuesto no incluye los costes de transporte. El coste del transporte nacional es de 1.200€ (consultar para entregas fuera de España)',
    'Operación prevista como exportación internacional fuera del territorio de aplicación del IVA. Facturación exenta de IVA conforme al artículo 21 de la Ley 37/1992 (LIVA), condicionada a la correcta tramitación aduanera y acreditación de la salida efectiva del territorio de la Unión Europea. Los impuestos, aranceles o tributos que resulten exigibles en el país de destino serán asumidos por el cliente. En caso de no formalizarse la exportación o no acreditarse la salida efectiva, se aplicará el IVA vigente (21%).',
    '© Nomade Vans S.L. — Todos los derechos reservados.'
  );
