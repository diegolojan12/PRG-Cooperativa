import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import pg from 'pg';

export function hashPassword(value) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(value, salt, 64).toString('hex')}`;
}
export function verifyPassword(value, stored) {
  if (!stored?.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  const expected = Buffer.from(hash, 'hex');
  const actual = scryptSync(value, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/* ---------- Modelo de dominio (Documento de Visión v1.1.0, RF-08-1, RF-11-4) ---------- */
export const ROLES = ['ADMIN', 'GESTOR', 'SOCIO'];
export const STATES = ['PENDIENTE', 'APROBADO', 'RECHAZADO'];
export const MODULES = [
  'panel',
  'referidos',
  'usuarios',
  'roles',
  'configuracion',
  'actividad',
  'notificaciones',
  'ayuda',
];
export const SOCIO_MODULES = ['panel', 'referidos', 'notificaciones', 'ayuda'];
export const GESTOR_MODULES = ['panel', 'notificaciones', 'ayuda'];
/** Módulos que cada rol puede llegar a tener (el resto se bloquea en Roles). */
export const ROLE_LIMITS = {
  ADMIN: MODULES,
  GESTOR: GESTOR_MODULES,
  SOCIO: SOCIO_MODULES,
};
/** Módulos que cada rol debe conservar siempre. */
export const ROLE_REQUIRED = {
  ADMIN: ['panel', 'ayuda', 'usuarios', 'roles'],
  GESTOR: ['panel', 'ayuda'],
  SOCIO: ['panel', 'ayuda'],
};

const SQLITE_SCHEMA = `CREATE TABLE IF NOT EXISTS "Usuario" (
  id INTEGER PRIMARY KEY AUTOINCREMENT, cedula TEXT UNIQUE, correo TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL, rol TEXT NOT NULL DEFAULT 'SOCIO', "creadoEn" TEXT DEFAULT CURRENT_TIMESTAMP,
  "passwordHash" TEXT, celular TEXT, activo INTEGER NOT NULL DEFAULT 1, cuenta TEXT, "tipoCuenta" TEXT,
  "cuentaEstado" TEXT, "intentosFallidos" INTEGER NOT NULL DEFAULT 0, "bloqueadoHasta" TEXT);
CREATE TABLE IF NOT EXISTS "RolPermiso" (rol TEXT PRIMARY KEY, modulos TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS "Sesion" (token TEXT PRIMARY KEY, "usuarioId" INTEGER NOT NULL REFERENCES "Usuario"(id) ON DELETE CASCADE, expira TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS "Recuperacion" (token TEXT PRIMARY KEY, "usuarioId" INTEGER NOT NULL REFERENCES "Usuario"(id) ON DELETE CASCADE, expira TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS "DosFactor" (id TEXT PRIMARY KEY, "usuarioId" INTEGER NOT NULL REFERENCES "Usuario"(id) ON DELETE CASCADE, codigo TEXT NOT NULL, expira TEXT NOT NULL, intentos INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS "Referido" (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL, correo TEXT NOT NULL, celular TEXT NOT NULL, estado TEXT NOT NULL DEFAULT 'PENDIENTE', "socioId" INTEGER NOT NULL REFERENCES "Usuario"(id), "creadoEn" TEXT NOT NULL, notas TEXT DEFAULT '', "eliminadoEn" TEXT, "eliminadoPor" INTEGER REFERENCES "Usuario"(id), "motivoBaja" TEXT, "usuarioId" INTEGER REFERENCES "Usuario"(id));
CREATE UNIQUE INDEX IF NOT EXISTS referido_correo_activo ON "Referido"(correo) WHERE "eliminadoEn" IS NULL;
CREATE INDEX IF NOT EXISTS "Referido_socioId_idx" ON "Referido"("socioId");
CREATE TABLE IF NOT EXISTS "Actividad" (id INTEGER PRIMARY KEY AUTOINCREMENT, "usuarioId" INTEGER REFERENCES "Usuario"(id), actor TEXT NOT NULL, accion TEXT NOT NULL, detalle TEXT NOT NULL, fecha TEXT NOT NULL, ip TEXT, "objetivoId" INTEGER, datos TEXT);
CREATE INDEX IF NOT EXISTS "Actividad_fecha_idx" ON "Actividad"(fecha);
CREATE TABLE IF NOT EXISTS "Notificacion" (id INTEGER PRIMARY KEY AUTOINCREMENT, "usuarioId" INTEGER NOT NULL REFERENCES "Usuario"(id) ON DELETE CASCADE, titulo TEXT NOT NULL, mensaje TEXT NOT NULL, leida INTEGER NOT NULL DEFAULT 0, fecha TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS "Configuracion" (clave TEXT PRIMARY KEY, valor TEXT NOT NULL);`;

/* RF-42-1: la bitácora es inmutable (no admite UPDATE ni DELETE). */
const SQLITE_TRIGGERS = `CREATE TRIGGER IF NOT EXISTS actividad_inmutable_upd BEFORE UPDATE ON "Actividad"
  BEGIN SELECT RAISE(ABORT, 'La bitácora es inmutable'); END;
CREATE TRIGGER IF NOT EXISTS actividad_inmutable_del BEFORE DELETE ON "Actividad"
  BEGIN SELECT RAISE(ABORT, 'La bitácora es inmutable'); END;`;

export class Database {
  constructor(url = process.env.DATABASE_URL || 'file:./data/suma.db') {
    this.sqlite = url.startsWith('file:');
    if (this.sqlite) {
      const filename = resolve(url.slice(5));
      mkdirSync(dirname(filename), { recursive: true });
      this.db = new DatabaseSync(filename);
      this.db.exec(
        'PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;',
      );
    } else {
      this.pool = new pg.Pool({ connectionString: url, max: 10 });
    }
  }
  async query(sql, values = [], client) {
    if (!this.sqlite)
      return (await (client || this.pool).query(sql, values)).rows;
    // Reorder numbered parameters too: UPDATE ... $2 ... WHERE id=$1.
    const params = [];
    const statement = sql
      .replace(/\$(\d+)/g, (_, n) => {
        params.push(values[Number(n) - 1]);
        return '?';
      })
      .replace(/\bILIKE\b/g, 'LIKE');
    const query = this.db.prepare(statement);
    return query.all(
      ...params.map((v) => (typeof v === 'boolean' ? Number(v) : v)),
    );
  }
  async transaction(work) {
    if (this.sqlite) {
      // Callbacks are queued so async boundaries never interleave transactions.
      const previous = this.queue || Promise.resolve();
      let release;
      this.queue = new Promise((r) => {
        release = r;
      });
      await previous;
      this.db.exec('BEGIN IMMEDIATE');
      try {
        const result = await work();
        this.db.exec('COMMIT');
        return result;
      } catch (error) {
        this.db.exec('ROLLBACK');
        throw error;
      } finally {
        release();
      }
    }
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  /** Agrega columnas faltantes en bases SQLite creadas antes de la auditoría. */
  migrateSqlite() {
    const columns = (table) =>
      new Set(
        this.db
          .prepare(`PRAGMA table_info("${table}")`)
          .all()
          .map((c) => c.name),
      );
    const ensure = (table, definitions) => {
      const existing = columns(table);
      for (const [name, definition] of definitions)
        if (!existing.has(name))
          this.db.exec(
            `ALTER TABLE "${table}" ADD COLUMN "${name}" ${definition}`,
          );
    };
    ensure('Usuario', [
      ['cuentaEstado', 'TEXT'],
      ['intentosFallidos', 'INTEGER NOT NULL DEFAULT 0'],
      ['bloqueadoHasta', 'TEXT'],
    ]);
    ensure('Actividad', [
      ['ip', 'TEXT'],
      ['objetivoId', 'INTEGER'],
      ['datos', 'TEXT'],
    ]);
    // El correo de Referido era UNIQUE en línea: se reconstruye la tabla para
    // que la unicidad aplique solo a referidos activos (baja lógica, RF-11-6).
    const legacyUnique = this.db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='Referido' AND name LIKE 'sqlite_autoindex_Referido%'",
      )
      .all();
    if (legacyUnique.length) {
      this.db.exec(`BEGIN;
        ALTER TABLE "Referido" RENAME TO "Referido_old";
        DROP INDEX IF EXISTS "Referido_socioId_idx";
        CREATE TABLE "Referido" (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL, correo TEXT NOT NULL, celular TEXT NOT NULL, estado TEXT NOT NULL DEFAULT 'PENDIENTE', "socioId" INTEGER NOT NULL REFERENCES "Usuario"(id), "creadoEn" TEXT NOT NULL, notas TEXT DEFAULT '', "eliminadoEn" TEXT, "eliminadoPor" INTEGER REFERENCES "Usuario"(id), "motivoBaja" TEXT, "usuarioId" INTEGER REFERENCES "Usuario"(id));
        INSERT INTO "Referido" (id,nombre,correo,celular,estado,"socioId","creadoEn",notas)
          SELECT id,nombre,correo,celular,estado,"socioId","creadoEn",notas FROM "Referido_old";
        DROP TABLE "Referido_old";
        COMMIT;`);
    } else {
      ensure('Referido', [
        ['eliminadoEn', 'TEXT'],
        ['eliminadoPor', 'INTEGER REFERENCES "Usuario"(id)'],
        ['motivoBaja', 'TEXT'],
        ['usuarioId', 'INTEGER REFERENCES "Usuario"(id)'],
      ]);
    }
  }
  async init() {
    if (this.sqlite) {
      // Las tablas existentes conservan su forma; se migran antes de crear índices nuevos.
      const hasReferido = this.db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='Referido'",
        )
        .all().length;
      if (hasReferido) this.migrateSqlite();
      this.db.exec(SQLITE_SCHEMA);
      this.db.exec(SQLITE_TRIGGERS);
    } else {
      // Explicit migration command avoids mutating an existing PostgreSQL automatically.
      await this.query('SELECT "bloqueadoHasta" FROM "Usuario" LIMIT 1');
    }
    // Estados documentados: Pendiente / Aprobado / Rechazado (G01).
    await this.query('UPDATE "Referido" SET estado=$1 WHERE estado=$2', [
      'PENDIENTE',
      'CONTACTADO',
    ]);
    await this.query('UPDATE "Referido" SET estado=$1 WHERE estado=$2', [
      'APROBADO',
      'VALIDADO',
    ]);
    for (const [rol, modulos] of [
      ['ADMIN', MODULES],
      ['GESTOR', GESTOR_MODULES],
      ['SOCIO', SOCIO_MODULES],
    ]) {
      await this.query(
        'INSERT INTO "RolPermiso" (rol,modulos) VALUES ($1,$2) ON CONFLICT (rol) DO NOTHING',
        [rol, JSON.stringify(modulos)],
      );
    }
    for (const [clave, valor] of Object.entries({
      contacto: 'soporte@suma.ec',
      puntosReferido: '100',
      registroAbierto: 'true',
      mensajeBienvenida: 'Cada conexión suma. Sigamos creciendo juntos.',
    })) {
      await this.query(
        'INSERT INTO "Configuracion" (clave,valor) VALUES ($1,$2) ON CONFLICT (clave) DO NOTHING',
        [clave, valor],
      );
    }
    if (
      process.env.SEED_DEMO === 'true' &&
      process.env.NODE_ENV !== 'production'
    ) {
      const [done] = await this.query(
        'SELECT valor FROM "Configuracion" WHERE clave=$1',
        ['demoInicializado'],
      );
      if (!done) await this.seed();
    }
  }
  async seed() {
    for (const [correo, nombre, rol] of [
      ['admin@suma.ec', 'Andrea Molina', 'ADMIN'],
      ['gestor@suma.ec', 'Gabriel Ortiz', 'GESTOR'],
      ['socio@suma.ec', 'Daniela Medina', 'SOCIO'],
    ]) {
      const rows = await this.query(
        'INSERT INTO "Usuario" (correo,nombre,rol,"passwordHash",celular) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (correo) DO NOTHING RETURNING id',
        [correo, nombre, rol, hashPassword('Suma2026!'), '0991234567'],
      );
      if (rows.length)
        await this.query(
          'INSERT INTO "Notificacion" ("usuarioId",titulo,mensaje,fecha) VALUES ($1,$2,$3,$4)',
          [
            rows[0].id,
            '¡Bienvenido a SUMA!',
            'Tu cuenta de prueba está lista. Explora tu panel y registra tu primer referido.',
            new Date().toISOString(),
          ],
        );
    }
    const [socio] = await this.query(
      'SELECT id FROM "Usuario" WHERE correo=$1',
      ['socio@suma.ec'],
    );
    const fiveDaysAgo = new Date(Date.now() - 5 * 86400000).toISOString();
    for (const [nombre, correo, celular, estado, creadoEn] of [
      ['Carlos Torres', 'carlos@ejemplo.ec', '0990000001', 'PENDIENTE', fiveDaysAgo],
      ['María López', 'maria@ejemplo.ec', '0990000002', 'PENDIENTE', new Date().toISOString()],
      ['Luis Ramírez', 'luis@ejemplo.ec', '0990000003', 'APROBADO', new Date().toISOString()],
    ]) {
      const [exists] = await this.query(
        'SELECT id FROM "Referido" WHERE correo=$1 AND "eliminadoEn" IS NULL',
        [correo],
      );
      if (!exists)
        await this.query(
          'INSERT INTO "Referido" (nombre,correo,celular,estado,"socioId","creadoEn") VALUES ($1,$2,$3,$4,$5,$6)',
          [nombre, correo, celular, estado, socio.id, creadoEn],
        );
    }
    await this.query(
      'INSERT INTO "Configuracion" (clave,valor) VALUES ($1,$2) ON CONFLICT (clave) DO NOTHING',
      ['demoInicializado', 'true'],
    );
  }
  async close() {
    if (this.sqlite) this.db.close();
    else await this.pool.end();
  }
}
