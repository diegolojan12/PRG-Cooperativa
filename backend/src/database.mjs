import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
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
    const statement = sql.replace(/\$(\d+)/g, (_, n) => {
      params.push(values[Number(n) - 1]);
      return '?';
    });
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
  async init() {
    if (this.sqlite) {
      this.db.exec(`CREATE TABLE IF NOT EXISTS "Usuario" (
        id INTEGER PRIMARY KEY AUTOINCREMENT, cedula TEXT UNIQUE, correo TEXT UNIQUE NOT NULL,
        nombre TEXT NOT NULL, rol TEXT NOT NULL DEFAULT 'SOCIO', "creadoEn" TEXT DEFAULT CURRENT_TIMESTAMP,
        "passwordHash" TEXT, celular TEXT, activo INTEGER NOT NULL DEFAULT 1, cuenta TEXT, "tipoCuenta" TEXT);
        CREATE TABLE IF NOT EXISTS "RolPermiso" (rol TEXT PRIMARY KEY, modulos TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS "Sesion" (token TEXT PRIMARY KEY, "usuarioId" INTEGER NOT NULL REFERENCES "Usuario"(id) ON DELETE CASCADE, expira TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS "Recuperacion" (token TEXT PRIMARY KEY, "usuarioId" INTEGER NOT NULL REFERENCES "Usuario"(id) ON DELETE CASCADE, expira TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS "Referido" (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL, correo TEXT NOT NULL UNIQUE, celular TEXT NOT NULL, estado TEXT NOT NULL DEFAULT 'PENDIENTE', "socioId" INTEGER NOT NULL REFERENCES "Usuario"(id), "creadoEn" TEXT NOT NULL, notas TEXT DEFAULT '');
        CREATE TABLE IF NOT EXISTS "Actividad" (id INTEGER PRIMARY KEY AUTOINCREMENT, "usuarioId" INTEGER REFERENCES "Usuario"(id), actor TEXT NOT NULL, accion TEXT NOT NULL, detalle TEXT NOT NULL, fecha TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS "Notificacion" (id INTEGER PRIMARY KEY AUTOINCREMENT, "usuarioId" INTEGER NOT NULL REFERENCES "Usuario"(id) ON DELETE CASCADE, titulo TEXT NOT NULL, mensaje TEXT NOT NULL, leida INTEGER NOT NULL DEFAULT 0, fecha TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS "Configuracion" (clave TEXT PRIMARY KEY, valor TEXT NOT NULL);`);
    } else {
      // Explicit migration command avoids mutating an existing PostgreSQL automatically.
      await this.query('SELECT "passwordHash" FROM "Usuario" LIMIT 1');
    }
    for (const [rol, modulos] of [
      ['ADMIN', MODULES],
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
    for (const [correo, nombre, rol, cedula] of [
      ['admin@suma.ec', 'Andrea Molina', 'ADMIN', '1100000001'],
      ['socio@suma.ec', 'Daniela Medina', 'SOCIO', '1100000002'],
    ]) {
      const rows = await this.query(
        'INSERT INTO "Usuario" (correo,nombre,rol,cedula,"passwordHash",celular) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (correo) DO NOTHING RETURNING id',
        [correo, nombre, rol, cedula, hashPassword('Suma2026!'), '0991234567'],
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
    for (const [nombre, correo, celular, estado] of [
      ['Carlos Torres', 'carlos@ejemplo.ec', '0990000001', 'PENDIENTE'],
      ['María López', 'maria@ejemplo.ec', '0990000002', 'CONTACTADO'],
      ['Luis Ramírez', 'luis@ejemplo.ec', '0990000003', 'VALIDADO'],
    ]) {
      await this.query(
        'INSERT INTO "Referido" (nombre,correo,celular,estado,"socioId","creadoEn") VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (correo) DO NOTHING',
        [nombre, correo, celular, estado, socio.id, new Date().toISOString()],
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
