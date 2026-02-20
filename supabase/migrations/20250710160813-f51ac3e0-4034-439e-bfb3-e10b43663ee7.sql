-- Migración de datos de clients a NEW_Clients
-- Insertamos los datos existentes mapeando los campos correspondientes

INSERT INTO "NEW_Clients" (
  name,
  email, 
  phone,
  dni,
  address,
  birthdate,
  created_at,
  updated_at
)
SELECT 
  name,
  email,
  phone,
  dni,
  address,
  birth_date,
  created_at,
  COALESCE(updated_at, now())
FROM clients
WHERE NOT EXISTS (
  SELECT 1 FROM "NEW_Clients" nc 
  WHERE nc.email = clients.email AND nc.name = clients.name
);

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_new_clients_email ON "NEW_Clients"(email);
CREATE INDEX IF NOT EXISTS idx_new_clients_name ON "NEW_Clients"(name);

-- Habilitar RLS en NEW_Clients si no está habilitado
ALTER TABLE "NEW_Clients" ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS similares a la tabla original
DROP POLICY IF EXISTS "Enable all access for now" ON "NEW_Clients";
CREATE POLICY "Enable all access for now" ON "NEW_Clients"
  FOR ALL USING (true) WITH CHECK (true);