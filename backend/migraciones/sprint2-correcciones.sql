-- Correcciones de trazabilidad del Sprint 2 (T-01 y RF-47-4).
-- T-01: provincia del usuario, necesaria para limitar campañas y avisos (UR-22, RF-13-8, RF-37)
-- y para el filtro por provincia del listado de referidos (RF-11-3).
ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS provincia TEXT;
-- Las personas referidas que ya tienen cuenta heredan la provincia de su usuario.
UPDATE "Referido" r SET provincia=u.provincia FROM "Usuario" u WHERE r."usuarioId"=u.id AND r.provincia IS NULL AND u.provincia IS NOT NULL;
-- RF-47-4: el administrador publica versiones numeradas del aviso; exactamente 1 queda vigente.
ALTER TABLE "AvisoPrivacidad" ADD COLUMN IF NOT EXISTS vigente BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "AvisoPrivacidad" ADD COLUMN IF NOT EXISTS "publicadoEn" TEXT;
ALTER TABLE "AvisoPrivacidad" ADD COLUMN IF NOT EXISTS "publicadoPor" INTEGER REFERENCES "Usuario"(id);
CREATE UNIQUE INDEX IF NOT EXISTS aviso_privacidad_un_vigente ON "AvisoPrivacidad"(vigente) WHERE vigente;
-- La versión aceptada más reciente queda como vigente en las bases existentes.
UPDATE "AvisoPrivacidad" SET vigente=TRUE, "publicadoEn"=COALESCE("publicadoEn", to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
WHERE version=(SELECT version FROM "AvisoPrivacidad" ORDER BY string_to_array(version, '.')::int[] DESC LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM "AvisoPrivacidad" WHERE vigente);
