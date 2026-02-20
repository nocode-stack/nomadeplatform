
-- Agregar nuevos campos a la tabla de vehículos
ALTER TABLE public.vehicles 
ADD COLUMN ubicacion TEXT CHECK (ubicacion IN ('nomade', 'concesionario', 'taller', 'cliente')) DEFAULT 'nomade',
ADD COLUMN estado_pago TEXT CHECK (estado_pago IN ('pagada', 'no_pagada', 'pendiente')) DEFAULT 'pendiente',
ADD COLUMN fecha_pago DATE NULL;

-- Actualizar vehículos existentes con valores por defecto
UPDATE public.vehicles 
SET ubicacion = 'nomade', estado_pago = 'pendiente' 
WHERE ubicacion IS NULL OR estado_pago IS NULL;
