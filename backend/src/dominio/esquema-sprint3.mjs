export const SPRINT3_DDL = `
CREATE TABLE IF NOT EXISTS "Campania" (
  id TEXT PRIMARY KEY, titulo TEXT NOT NULL, inicio TEXT NOT NULL, fin TEXT NOT NULL,
  "puntosSocio" INTEGER NOT NULL, "puntosReferido" INTEGER NOT NULL,
  estado TEXT NOT NULL DEFAULT 'BORRADOR'
);
CREATE TABLE IF NOT EXISTS "CampaniaProvincia" (
  "campaniaId" TEXT NOT NULL REFERENCES "Campania"(id) ON DELETE CASCADE,
  provincia TEXT NOT NULL, PRIMARY KEY ("campaniaId",provincia)
);
CREATE INDEX IF NOT EXISTS campania_provincia ON "CampaniaProvincia"(provincia);
CREATE TABLE IF NOT EXISTS "Insignia" (
  id TEXT PRIMARY KEY, nombre TEXT NOT NULL, imagen TEXT NOT NULL,
  actividad TEXT NOT NULL, meta INTEGER NOT NULL, activa INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS "InsigniaObtenida" (
  "usuarioId" INTEGER NOT NULL REFERENCES "Usuario"(id),
  "insigniaId" TEXT NOT NULL REFERENCES "Insignia"(id), fecha TEXT NOT NULL,
  PRIMARY KEY ("usuarioId","insigniaId")
);
CREATE TABLE IF NOT EXISTS "EventoLogro" (
  "usuarioId" INTEGER NOT NULL REFERENCES "Usuario"(id),
  actividad TEXT NOT NULL, evento TEXT NOT NULL, fecha TEXT NOT NULL,
  PRIMARY KEY ("usuarioId",actividad,evento)
);
INSERT INTO "EventoLogro" ("usuarioId",actividad,evento,fecha)
  SELECT "socioId",'REFERIDO',CAST(id AS TEXT),COALESCE("fechaDecision","creadoEn")
  FROM "Referido" WHERE estado='APROBADO' ON CONFLICT DO NOTHING;
`;
