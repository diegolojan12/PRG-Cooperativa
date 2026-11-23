-- HU-001 / HU-002: roles, módulos y permisos administrables desde la base de datos.
-- Ejecutar con npm run db:init (los datos de partida los inserta la aplicación al iniciar).
CREATE TABLE IF NOT EXISTS "Rol" (
  clave TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL DEFAULT '',
  sistema BOOLEAN NOT NULL DEFAULT FALSE,
  "requiereSegundoFactor" BOOLEAN NOT NULL DEFAULT FALSE,
  "alcanceGlobal" BOOLEAN NOT NULL DEFAULT FALSE,
  interfaz TEXT NOT NULL DEFAULT 'COMUNIDAD',
  disponibles TEXT NOT NULL DEFAULT '[]',
  obligatorios TEXT NOT NULL DEFAULT '[]',
  "creadoEn" TEXT
);
CREATE TABLE IF NOT EXISTS "Modulo" (
  clave TEXT PRIMARY KEY,
  etiqueta TEXT NOT NULL,
  grupo TEXT NOT NULL,
  icono TEXT NOT NULL,
  orden INTEGER NOT NULL,
  ambito TEXT NOT NULL DEFAULT 'COMUN',
  disponible BOOLEAN NOT NULL DEFAULT TRUE
);
