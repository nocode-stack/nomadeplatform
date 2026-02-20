-- Eliminar políticas existentes y recrear correctamente (con el nombre correcto de tabla)
DROP POLICY IF EXISTS "Users can view all billing records" ON public."NEW_Billing";
DROP POLICY IF EXISTS "Users can create billing records" ON public."NEW_Billing";
DROP POLICY IF EXISTS "Users can update billing records" ON public."NEW_Billing";
DROP POLICY IF EXISTS "Users can delete billing records" ON public."NEW_Billing";

-- Crear políticas RLS correctas para NEW_Billing
CREATE POLICY "Enable read access for all users" ON public."NEW_Billing"
FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public."NEW_Billing"
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users only" ON public."NEW_Billing"
FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for authenticated users only" ON public."NEW_Billing"
FOR DELETE USING (auth.uid() IS NOT NULL);