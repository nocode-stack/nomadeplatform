
-- Eliminar campos de facturación de la tabla projects ya que deben estar en clients
ALTER TABLE public.projects DROP COLUMN IF EXISTS billing_type;
ALTER TABLE public.projects DROP COLUMN IF EXISTS billing_name;
ALTER TABLE public.projects DROP COLUMN IF EXISTS billing_email;
ALTER TABLE public.projects DROP COLUMN IF EXISTS billing_phone;
ALTER TABLE public.projects DROP COLUMN IF EXISTS billing_address;
ALTER TABLE public.projects DROP COLUMN IF EXISTS billing_dni;
ALTER TABLE public.projects DROP COLUMN IF EXISTS billing_company_name;
ALTER TABLE public.projects DROP COLUMN IF EXISTS billing_company_cif;
ALTER TABLE public.projects DROP COLUMN IF EXISTS billing_company_address;

-- Eliminar también otros campos que no son específicos del proyecto
ALTER TABLE public.projects DROP COLUMN IF EXISTS commercial_name;
ALTER TABLE public.projects DROP COLUMN IF EXISTS total_amount;
ALTER TABLE public.projects DROP COLUMN IF EXISTS paid_amount;
ALTER TABLE public.projects DROP COLUMN IF EXISTS pending_amount;
ALTER TABLE public.projects DROP COLUMN IF EXISTS currency;
ALTER TABLE public.projects DROP COLUMN IF EXISTS delivery_date;
ALTER TABLE public.projects DROP COLUMN IF EXISTS actual_end_date;
ALTER TABLE public.projects DROP COLUMN IF EXISTS planned_end_date;
ALTER TABLE public.projects DROP COLUMN IF EXISTS start_date;
ALTER TABLE public.projects DROP COLUMN IF EXISTS status;
ALTER TABLE public.projects DROP COLUMN IF EXISTS priority;
ALTER TABLE public.projects DROP COLUMN IF EXISTS progress;
ALTER TABLE public.projects DROP COLUMN IF EXISTS manual_status_control;
ALTER TABLE public.projects DROP COLUMN IF EXISTS notes;

-- Comentarios para documentar qué debe contener la tabla projects
COMMENT ON TABLE public.projects IS 'Información específica del proyecto: especificaciones técnicas y vinculación con cliente y slot de producción';
COMMENT ON COLUMN public.projects.code IS 'Código único del proyecto';
COMMENT ON COLUMN public.projects.model IS 'Modelo del vehículo (Neo, Neo S, Neo Mini)';
COMMENT ON COLUMN public.projects.power IS 'Motorización del vehículo';
COMMENT ON COLUMN public.projects.interior_color IS 'Color del mobiliario interior';
COMMENT ON COLUMN public.projects.exterior_color IS 'Color exterior del vehículo';
COMMENT ON COLUMN public.projects.electric_system IS 'Sistema eléctrico instalado';
COMMENT ON COLUMN public.projects.extra_packages IS 'Paquetes extra y personalizaciones';
COMMENT ON COLUMN public.projects.created_at IS 'Fecha de creación del proyecto';
