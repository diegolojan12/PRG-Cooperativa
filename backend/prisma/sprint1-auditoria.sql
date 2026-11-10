-- Correcciones de la auditoría del Sprint 1. Ejecutar con npm run db:init.
-- Roles y estados documentados (RF-08-1, RF-11-4)
UPDATE "Referido" SET estado='PENDIENTE' WHERE estado='CONTACTADO';
UPDATE "Referido" SET estado='APROBADO' WHERE estado='VALIDADO';

-- Bloqueo por cuenta tras 5 intentos fallidos (RF-04-2) y estado de cuenta vinculada (RF-11-4)
ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "intentosFallidos" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "bloqueadoHasta" TEXT;
ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "cuentaEstado" TEXT;

-- Segundo factor para administradores (RNF-06)
CREATE TABLE IF NOT EXISTS "DosFactor" (id TEXT PRIMARY KEY, "usuarioId" INTEGER NOT NULL REFERENCES "Usuario"(id) ON DELETE CASCADE, codigo TEXT NOT NULL, expira TEXT NOT NULL, intentos INTEGER NOT NULL DEFAULT 0);

-- Baja lógica y asociación manual de referidos (RF-11-5, RF-11-6)
ALTER TABLE "Referido" ADD COLUMN IF NOT EXISTS "eliminadoEn" TEXT;
ALTER TABLE "Referido" ADD COLUMN IF NOT EXISTS "eliminadoPor" INTEGER REFERENCES "Usuario"(id);
ALTER TABLE "Referido" ADD COLUMN IF NOT EXISTS "motivoBaja" TEXT;
ALTER TABLE "Referido" ADD COLUMN IF NOT EXISTS "usuarioId" INTEGER REFERENCES "Usuario"(id);
ALTER TABLE "Referido" DROP CONSTRAINT IF EXISTS "Referido_correo_key";
CREATE UNIQUE INDEX IF NOT EXISTS referido_correo_activo ON "Referido"(correo) WHERE "eliminadoEn" IS NULL;

-- Bitácora completa e inmutable (RF-42-1, RF-08-5, RF-14-2)
ALTER TABLE "Actividad" ADD COLUMN IF NOT EXISTS ip TEXT;
ALTER TABLE "Actividad" ADD COLUMN IF NOT EXISTS "objetivoId" INTEGER;
ALTER TABLE "Actividad" ADD COLUMN IF NOT EXISTS datos TEXT;
CREATE OR REPLACE FUNCTION bitacora_inmutable() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION 'La bitácora es inmutable'; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS actividad_inmutable ON "Actividad";
CREATE TRIGGER actividad_inmutable BEFORE UPDATE OR DELETE ON "Actividad"
  FOR EACH ROW EXECUTE FUNCTION bitacora_inmutable();
