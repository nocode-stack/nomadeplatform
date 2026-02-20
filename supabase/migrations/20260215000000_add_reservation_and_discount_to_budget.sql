-- Add reservation_amount and discount_percentage to NEW_Budget table
ALTER TABLE "public"."NEW_Budget" ADD COLUMN "reservation_amount" numeric DEFAULT 0;
ALTER TABLE "public"."NEW_Budget" ADD COLUMN "discount_percentage" numeric DEFAULT 0;

COMMENT ON COLUMN "public"."NEW_Budget"."reservation_amount" IS 'Monto de la reserva pagado por el cliente';
COMMENT ON COLUMN "public"."NEW_Budget"."discount_percentage" IS 'Porcentaje de descuento aplicado al total del presupuesto';
