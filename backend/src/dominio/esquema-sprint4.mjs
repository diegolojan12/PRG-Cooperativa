export const SPRINT4_DDL = `
CREATE TABLE IF NOT EXISTS "Reto" (
  id TEXT PRIMARY KEY, titulo TEXT NOT NULL, descripcion TEXT NOT NULL, actividad TEXT NOT NULL,
  meta INTEGER NOT NULL, premio INTEGER NOT NULL, inicio TEXT NOT NULL, fin TEXT NOT NULL, activo INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS "ProgresoReto" (
  "retoId" TEXT NOT NULL REFERENCES "Reto"(id), "usuarioId" INTEGER NOT NULL REFERENCES "Usuario"(id),
  avance INTEGER NOT NULL DEFAULT 0, completado TEXT, PRIMARY KEY ("retoId","usuarioId")
);
CREATE INDEX IF NOT EXISTS progreso_usuario ON "ProgresoReto"("usuarioId");
CREATE TABLE IF NOT EXISTS "Taller" (
  id TEXT PRIMARY KEY, titulo TEXT NOT NULL, descripcion TEXT NOT NULL,
  inicio TEXT NOT NULL, lugar TEXT NOT NULL, cupos INTEGER NOT NULL, estado TEXT NOT NULL DEFAULT 'ACTIVO'
);
CREATE TABLE IF NOT EXISTS "Inscripcion" (
  "tallerId" TEXT NOT NULL REFERENCES "Taller"(id), "usuarioId" INTEGER NOT NULL REFERENCES "Usuario"(id),
  fecha TEXT NOT NULL, estado TEXT NOT NULL, asistencia TEXT, PRIMARY KEY ("tallerId","usuarioId")
);
CREATE TABLE IF NOT EXISTS "Recordatorio" (
  tipo TEXT NOT NULL, evento TEXT NOT NULL, "usuarioId" INTEGER NOT NULL REFERENCES "Usuario"(id),
  fecha TEXT NOT NULL, PRIMARY KEY (tipo,evento,"usuarioId")
);
CREATE TABLE IF NOT EXISTS "PreguntaTrivia" (
  id TEXT PRIMARY KEY, enunciado TEXT NOT NULL, opciones TEXT NOT NULL, correcta INTEGER NOT NULL,
  tema TEXT NOT NULL, dificultad TEXT NOT NULL, activa INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS "PartidaTrivia" (
  id TEXT PRIMARY KEY, "usuarioId" INTEGER NOT NULL REFERENCES "Usuario"(id), fecha TEXT NOT NULL, vence TEXT NOT NULL,
  "vencePartida" TEXT NOT NULL, preguntas TEXT NOT NULL, indice INTEGER NOT NULL DEFAULT 0,
  aciertos INTEGER NOT NULL DEFAULT 0, completada INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS partida_usuario ON "PartidaTrivia"("usuarioId",fecha);
CREATE TABLE IF NOT EXISTS "Capacitacion" (
  id TEXT PRIMARY KEY, titulo TEXT NOT NULL, descripcion TEXT NOT NULL, preguntas TEXT NOT NULL, version TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'BORRADOR'
);
CREATE TABLE IF NOT EXISTS "MaterialCapacitacion" (
  "capacitacionId" TEXT PRIMARY KEY REFERENCES "Capacitacion"(id), nombre TEXT NOT NULL, mime TEXT NOT NULL, contenido TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS "ResultadoCapacitacion" (
  id TEXT PRIMARY KEY, "capacitacionId" TEXT NOT NULL REFERENCES "Capacitacion"(id),
  "usuarioId" INTEGER NOT NULL REFERENCES "Usuario"(id), fecha TEXT NOT NULL, aciertos INTEGER NOT NULL,
  total INTEGER NOT NULL, certificado TEXT UNIQUE, "nombreCertificado" TEXT NOT NULL, "cursoCertificado" TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS evaluacion_usuario ON "ResultadoCapacitacion"("usuarioId","capacitacionId",fecha);
`;
