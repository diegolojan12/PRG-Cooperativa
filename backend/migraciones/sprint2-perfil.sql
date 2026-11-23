-- Configuración del perfil (Sprint 2): HU-055 administrar mi perfil (UR-06, RF-03)
-- y HU-056 elegir qué datos son públicos (UR-51, RF-46).
-- RF-46-1: el perfil es Público o Privado, Privado por defecto.
-- RF-46-2: el correo, el celular y el número de cuenta nunca se muestran a otros usuarios, por eso no hay columnas para publicarlos.
ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "perfilPublico" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "Usuario" DROP COLUMN IF EXISTS "correoPublico";
ALTER TABLE "Usuario" DROP COLUMN IF EXISTS "celularPublico";
-- RF-03-3: la baja es lógica; se conservan el historial, los referidos y la bitácora.
ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "bajaEn" TEXT;
ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "bajaMotivo" TEXT;
-- RF-03-2: el correo nuevo solo reemplaza al actual después de confirmarlo con un código de 6 dígitos.
CREATE TABLE IF NOT EXISTS "CambioCorreo" (
  "usuarioId" INTEGER PRIMARY KEY REFERENCES "Usuario"(id) ON DELETE CASCADE,
  correo TEXT NOT NULL,
  "correoIndice" TEXT,
  huella TEXT NOT NULL,
  vence TEXT NOT NULL,
  intentos INTEGER NOT NULL DEFAULT 0
);
