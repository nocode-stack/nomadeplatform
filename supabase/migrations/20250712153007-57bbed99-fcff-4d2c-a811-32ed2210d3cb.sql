-- Agregar campos para el sistema de pagos detallado
ALTER TABLE public."NEW_Contracts" 
ADD COLUMN payment_first_percentage numeric(5,2),
ADD COLUMN payment_first_amount numeric(10,2),
ADD COLUMN payment_second_percentage numeric(5,2),
ADD COLUMN payment_second_amount numeric(10,2),
ADD COLUMN payment_third_percentage numeric(5,2),
ADD COLUMN payment_third_amount numeric(10,2);