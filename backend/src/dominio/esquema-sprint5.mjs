export const SPRINT5_DDL = `
CREATE TABLE IF NOT EXISTS "Premio" (
  id TEXT PRIMARY KEY, nombre TEXT NOT NULL, "nombreClave" TEXT UNIQUE NOT NULL, descripcion TEXT NOT NULL,
  costo INTEGER NOT NULL CHECK (costo>0), stock INTEGER NOT NULL CHECK (stock>=0), activo INTEGER NOT NULL DEFAULT 1,
  foto TEXT, "fotoMime" TEXT
);
CREATE TABLE IF NOT EXISTS "Canje" (
  id TEXT PRIMARY KEY, "usuarioId" INTEGER NOT NULL REFERENCES "Usuario"(id), "premioId" TEXT NOT NULL REFERENCES "Premio"(id),
  solicitud TEXT NOT NULL, premio TEXT NOT NULL, costo INTEGER NOT NULL, fecha TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'PENDIENTE', UNIQUE ("usuarioId",solicitud)
);
CREATE INDEX IF NOT EXISTS canje_fecha ON "Canje"(fecha);
CREATE TABLE IF NOT EXISTS "Publicacion" (
  id TEXT PRIMARY KEY, "autorId" INTEGER NOT NULL REFERENCES "Usuario"(id), texto TEXT NOT NULL,
  fecha TEXT NOT NULL, estado TEXT NOT NULL DEFAULT 'VISIBLE', oficial INTEGER NOT NULL DEFAULT 0,
  "fijadaHasta" TEXT, imagen TEXT, "imagenMime" TEXT
);
CREATE TABLE IF NOT EXISTS "Comentario" (
  id TEXT PRIMARY KEY, "publicacionId" TEXT NOT NULL REFERENCES "Publicacion"(id),
  "autorId" INTEGER NOT NULL REFERENCES "Usuario"(id), texto TEXT NOT NULL,
  fecha TEXT NOT NULL, estado TEXT NOT NULL DEFAULT 'VISIBLE'
);
CREATE INDEX IF NOT EXISTS comentario_publicacion ON "Comentario"("publicacionId",fecha);
CREATE TABLE IF NOT EXISTS "Reaccion" (
  "publicacionId" TEXT NOT NULL REFERENCES "Publicacion"(id), "usuarioId" INTEGER NOT NULL REFERENCES "Usuario"(id),
  PRIMARY KEY ("publicacionId","usuarioId")
);
CREATE TABLE IF NOT EXISTS "Reporte" (
  tipo TEXT NOT NULL, "contenidoId" TEXT NOT NULL, "usuarioId" INTEGER NOT NULL REFERENCES "Usuario"(id),
  motivo TEXT NOT NULL, fecha TEXT NOT NULL, resuelto TEXT, PRIMARY KEY (tipo,"contenidoId","usuarioId")
);
CREATE TABLE IF NOT EXISTS "ContenidoSalud" (
  id TEXT PRIMARY KEY, tipo TEXT NOT NULL, categoria TEXT, titulo TEXT NOT NULL, descripcion TEXT NOT NULL,
  fecha TEXT NOT NULL, estado TEXT NOT NULL DEFAULT 'BORRADOR'
);
CREATE TABLE IF NOT EXISTS "SolicitudSoporte" (
  codigo TEXT PRIMARY KEY, "usuarioId" INTEGER NOT NULL REFERENCES "Usuario"(id),
  descripcion TEXT NOT NULL, fecha TEXT NOT NULL, estado TEXT NOT NULL DEFAULT 'ABIERTA', respuesta TEXT, cierre TEXT
);
CREATE INDEX IF NOT EXISTS soporte_usuario ON "SolicitudSoporte"("usuarioId",fecha);
`;
