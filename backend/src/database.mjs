import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import pg from 'pg';
import { SPRINT4_DDL } from './dominio/esquema-sprint4.mjs';
import { SPRINT3_DDL } from './dominio/esquema-sprint3.mjs';
import { ProteccionDatos } from './dominio/proteccion-datos.mjs';
import { Rol } from './dominio/acceso.mjs';
import { Referido } from './dominio/referidos.mjs';
import { PUNTOS_POR_ACCION } from './dominio/administracion.mjs';

const CLIENTE_SQLITE = Symbol('transacción SQLite');

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
export const ROLES = Rol.nombres;
export const STATES = Referido.estados;
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
  id INTEGER PRIMARY KEY AUTOINCREMENT, cedula TEXT UNIQUE, correo TEXT UNIQUE NOT NULL, "correoIndice" TEXT,
  nombre TEXT NOT NULL, rol TEXT NOT NULL DEFAULT 'SOCIO', "creadoEn" TEXT DEFAULT CURRENT_TIMESTAMP,
  "passwordHash" TEXT, celular TEXT, activo INTEGER NOT NULL DEFAULT 1, cuenta TEXT, "tipoCuenta" TEXT,
  "cuentaEstado" TEXT, "intentosFallidos" INTEGER NOT NULL DEFAULT 0, "bloqueadoHasta" TEXT, "codigoReferido" TEXT, "cuentaIndice" TEXT, "cuentaSolicitadaEn" TEXT, "cuentaRevisadaEn" TEXT, "celularIndice" TEXT, "correoVerificado" INTEGER NOT NULL DEFAULT 1, provincia TEXT, visibilidad TEXT NOT NULL DEFAULT 'PRIVADO');
CREATE TABLE IF NOT EXISTS "RolPermiso" (rol TEXT PRIMARY KEY, modulos TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS "Sesion" (token TEXT PRIMARY KEY, "usuarioId" INTEGER NOT NULL REFERENCES "Usuario"(id) ON DELETE CASCADE, expira TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS "Recuperacion" (token TEXT PRIMARY KEY, "usuarioId" INTEGER NOT NULL REFERENCES "Usuario"(id) ON DELETE CASCADE, expira TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS "DosFactor" (id TEXT PRIMARY KEY, "usuarioId" INTEGER NOT NULL REFERENCES "Usuario"(id) ON DELETE CASCADE, codigo TEXT NOT NULL, expira TEXT NOT NULL, intentos INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS "Referido" (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL, correo TEXT NOT NULL, "correoIndice" TEXT, celular TEXT NOT NULL, estado TEXT NOT NULL DEFAULT 'PENDIENTE', "socioId" INTEGER NOT NULL REFERENCES "Usuario"(id), "creadoEn" TEXT NOT NULL, notas TEXT DEFAULT '', "eliminadoEn" TEXT, "eliminadoPor" INTEGER REFERENCES "Usuario"(id), "motivoBaja" TEXT, "usuarioId" INTEGER REFERENCES "Usuario"(id), "fechaDecision" TEXT, campania TEXT, provincia TEXT, "campaniaId" TEXT);
CREATE UNIQUE INDEX IF NOT EXISTS referido_correo_activo ON "Referido"(correo) WHERE "eliminadoEn" IS NULL;
CREATE INDEX IF NOT EXISTS usuario_cuenta_indice ON "Usuario"(COALESCE("cuentaIndice",cuenta));
CREATE UNIQUE INDEX IF NOT EXISTS usuario_codigo_referido ON "Usuario"("codigoReferido");
CREATE UNIQUE INDEX IF NOT EXISTS usuario_correo_indice ON "Usuario"(COALESCE("correoIndice",correo));
CREATE UNIQUE INDEX IF NOT EXISTS referido_correo_indice ON "Referido"(COALESCE("correoIndice",correo)) WHERE "eliminadoEn" IS NULL;
CREATE INDEX IF NOT EXISTS "Referido_socioId_idx" ON "Referido"("socioId");
CREATE TABLE IF NOT EXISTS "Actividad" (id INTEGER PRIMARY KEY AUTOINCREMENT, "usuarioId" INTEGER REFERENCES "Usuario"(id), actor TEXT NOT NULL, accion TEXT NOT NULL, detalle TEXT NOT NULL, fecha TEXT NOT NULL, ip TEXT, "objetivoId" INTEGER, datos TEXT);
CREATE INDEX IF NOT EXISTS "Actividad_fecha_idx" ON "Actividad"(fecha);
CREATE TABLE IF NOT EXISTS "Notificacion" (id INTEGER PRIMARY KEY AUTOINCREMENT, "usuarioId" INTEGER NOT NULL REFERENCES "Usuario"(id) ON DELETE CASCADE, titulo TEXT NOT NULL, mensaje TEXT NOT NULL, leida INTEGER NOT NULL DEFAULT 0, fecha TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS "MovimientoPuntos" (clave TEXT PRIMARY KEY, "referidoId" INTEGER REFERENCES "Referido"(id), "usuarioId" INTEGER NOT NULL REFERENCES "Usuario"(id), actividad TEXT NOT NULL, cantidad INTEGER NOT NULL CHECK (cantidad >= 0), fecha TEXT NOT NULL, tipo TEXT NOT NULL DEFAULT 'CREDITO');
CREATE INDEX IF NOT EXISTS movimiento_usuario ON "MovimientoPuntos"("usuarioId");
CREATE TABLE IF NOT EXISTS "Configuracion" (clave TEXT PRIMARY KEY, valor TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS "ConfirmacionCorreo" ("usuarioId" INTEGER PRIMARY KEY REFERENCES "Usuario"(id) ON DELETE CASCADE, token TEXT UNIQUE NOT NULL, "tokenExpira" TEXT NOT NULL, huella TEXT NOT NULL, vence TEXT NOT NULL, intentos INTEGER NOT NULL DEFAULT 0, reenvios TEXT NOT NULL DEFAULT '[]', "correoPendiente" TEXT, "correoPendienteIndice" TEXT);
CREATE TABLE IF NOT EXISTS "AvisoPrivacidad" (version TEXT PRIMARY KEY, terminos TEXT NOT NULL, privacidad TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS "AceptacionTerminos" ("usuarioId" INTEGER NOT NULL REFERENCES "Usuario"(id), version TEXT NOT NULL REFERENCES "AvisoPrivacidad"(version), fecha TEXT NOT NULL, PRIMARY KEY ("usuarioId",version));
CREATE INDEX IF NOT EXISTS usuario_celular_indice ON "Usuario"((COALESCE("celularIndice",celular)));
CREATE INDEX IF NOT EXISTS notificacion_destinatario ON "Notificacion"("usuarioId",id);`;

/* RF-42-1: la bitácora es inmutable (no admite UPDATE ni DELETE). */
const SQLITE_TRIGGERS = `CREATE TRIGGER IF NOT EXISTS actividad_inmutable_upd BEFORE UPDATE ON "Actividad"
  BEGIN SELECT RAISE(ABORT, 'La bitácora es inmutable'); END;
CREATE TRIGGER IF NOT EXISTS actividad_inmutable_del BEFORE DELETE ON "Actividad"
  BEGIN SELECT RAISE(ABORT, 'La bitácora es inmutable'); END;`;

export class Database {
  constructor(url = process.env.DATABASE_URL || 'file:./data/suma.db') {
    this.datos = new ProteccionDatos();
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
    return (await this.queryRaw(sql, values, client)).map((fila) => this.datos.abrirFila(fila));
  }
  async queryRaw(sql, values = [], client) {
    if (!this.sqlite)
      return (await (client || this.pool).query(sql, values)).rows;
    if (client !== CLIENTE_SQLITE) await this.queue;
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
      try {
        this.db.exec('BEGIN IMMEDIATE');
        try {
          const result = await work(CLIENTE_SQLITE);
          this.db.exec('COMMIT');
          return result;
        } catch (error) {
          this.db.exec('ROLLBACK');
          throw error;
        }
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
      ['correoIndice', 'TEXT'],
      ['celularIndice', 'TEXT'],
      ['correoVerificado', 'INTEGER NOT NULL DEFAULT 1'],
      ['provincia', 'TEXT'],
      ['visibilidad', "TEXT NOT NULL DEFAULT 'PRIVADO'"],
      ['codigoReferido', 'TEXT'],
      ['cuentaIndice', 'TEXT'],
      ['cuentaSolicitadaEn', 'TEXT'],
      ['cuentaRevisadaEn', 'TEXT'],
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
        CREATE TABLE "Referido" (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL, correo TEXT NOT NULL, "correoIndice" TEXT, celular TEXT NOT NULL, estado TEXT NOT NULL DEFAULT 'PENDIENTE', "socioId" INTEGER NOT NULL REFERENCES "Usuario"(id), "creadoEn" TEXT NOT NULL, notas TEXT DEFAULT '', "eliminadoEn" TEXT, "eliminadoPor" INTEGER REFERENCES "Usuario"(id), "motivoBaja" TEXT, "usuarioId" INTEGER REFERENCES "Usuario"(id), "fechaDecision" TEXT, campania TEXT, provincia TEXT, "campaniaId" TEXT);
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
        ['correoIndice', 'TEXT'],
        ['fechaDecision', 'TEXT'],
        ['campania', 'TEXT'],
        ['campaniaId', 'TEXT'],
        ['provincia', 'TEXT'],
      ]);
    }
    const movimientos = columns('MovimientoPuntos');
    if (movimientos.size && !movimientos.has('clave')) {
      this.db.exec(`BEGIN;
        ALTER TABLE "MovimientoPuntos" RENAME TO "MovimientoPuntos_s1";
        CREATE TABLE IF NOT EXISTS "MovimientoPuntos" (clave TEXT PRIMARY KEY, "referidoId" INTEGER REFERENCES "Referido"(id), "usuarioId" INTEGER NOT NULL REFERENCES "Usuario"(id), actividad TEXT NOT NULL, cantidad INTEGER NOT NULL CHECK (cantidad >= 0), fecha TEXT NOT NULL, tipo TEXT NOT NULL DEFAULT 'CREDITO');
        INSERT INTO "MovimientoPuntos" (clave,"referidoId","usuarioId",actividad,cantidad,fecha)
  SELECT 'referido:' || "referidoId" || ':' || "usuarioId","referidoId","usuarioId",'REFERIDO',cantidad,fecha FROM "MovimientoPuntos_s1";
        DROP TABLE "MovimientoPuntos_s1";
        COMMIT;`);
    }
    if (columns('MovimientoPuntos').size)
      ensure('MovimientoPuntos', [['tipo', "TEXT NOT NULL DEFAULT 'CREDITO'"]]);
    if (columns('ConfirmacionCorreo').size)
      ensure('ConfirmacionCorreo', [['correoPendiente', 'TEXT'], ['correoPendienteIndice', 'TEXT']]);
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
      this.db.exec(SPRINT3_DDL);
      this.db.exec(SPRINT4_DDL);
      this.db.exec(SQLITE_TRIGGERS);
    } else {
      // Explicit migration command avoids mutating an existing PostgreSQL automatically.
      await this.query('SELECT "correoVerificado","celularIndice" FROM "Usuario" LIMIT 1');
    }
    await this.protegerDatosExistentes();
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
      ...Object.fromEntries(Object.keys(PUNTOS_POR_ACCION).map((clave) => [clave, '0'])),
      valorPunto: '0.00',
      niveles: JSON.stringify([{ nombre: 'Inicial', umbral: 0 }, { nombre: 'Conector', umbral: 100 }]),
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
  async protegerDatosExistentes() {
    await this.transaction(async (client) => {
      if (!this.sqlite) await this.query('SELECT pg_advisory_xact_lock(15274001)', [], client);
      const clave = 'verificadorCifrado';
      const [actual] = await this.query('SELECT valor FROM "Configuracion" WHERE clave=$1', [clave], client);
      const verificador = this.datos.huella('suma:verificador:v1');
      if (actual && actual.valor !== verificador)
        throw new Error('SUMA_DATA_KEY no coincide con la clave de esta base de datos.');
      if (!verificador) return;
      for (const tabla of ['Usuario', 'Referido']) {
        const campos = tabla === 'Usuario' ? ['correo', 'celular', 'cuenta'] : ['correo', 'celular'];
        const seleccionar = 'SELECT id,' + campos.join(',') + ' FROM "' + tabla + '" WHERE "correoIndice" IS NULL';
        const actualizar = 'UPDATE "' + tabla + '" SET "correoIndice"=$2,' +
          campos.map((campo, i) => campo + '=$' + (i + 3)).join(',') +
          (tabla === 'Usuario' ? ',"cuentaIndice"=$6' : '') + ' WHERE id=$1';
        const filas = await this.queryRaw(seleccionar, [], client);
        for (const fila of filas) {
          const valores = campos.map((campo) => this.datos.cifrar(campo, fila[campo]));
          if (tabla === 'Usuario') valores.push(fila.cuenta ? this.datos.huella('cuenta:' + fila.cuenta) : null);
          await this.query(actualizar, [fila.id, this.datos.correoIndice(fila.correo), ...valores], client);
        }
      }
      const telefonos = await this.query(
        'SELECT id,celular FROM "Usuario" WHERE "celularIndice" IS NULL AND celular IS NOT NULL', [], client,
      );
      for (const fila of telefonos)
        await this.query('UPDATE "Usuario" SET "celularIndice"=$2 WHERE id=$1',
          [fila.id, this.datos.huella('celular:' + fila.celular)], client);
      if (!actual) await this.query('INSERT INTO "Configuracion" (clave,valor) VALUES ($1,$2)', [clave, verificador], client);
    });
  }
  async seed() {
    for (const [correo, nombre, rol, celular] of [
      ['admin@suma.ec', 'Andrea Molina', 'ADMIN', '0991234501'],
      ['gestor@suma.ec', 'Gabriel Ortiz', 'GESTOR', '0991234502'],
      ['socio@suma.ec', 'Daniela Medina', 'SOCIO', '0991234503'],
    ]) {
      const rows = await this.query(
        'INSERT INTO "Usuario" (correo,nombre,rol,"passwordHash",celular,"correoIndice","cuentaEstado","celularIndice") VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING RETURNING id',
        [this.datos.cifrar('correo', correo), nombre, rol, hashPassword('Suma2026!'), this.datos.cifrar('celular', celular), this.datos.correoIndice(correo), rol === 'SOCIO' ? 'APROBADO' : null, this.datos.huella('celular:' + celular) ?? null],
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
      'SELECT id FROM "Usuario" WHERE COALESCE("correoIndice",correo)=$1',
      [this.datos.correoIndice('socio@suma.ec') ?? 'socio@suma.ec'],
    );
    const fiveDaysAgo = new Date(Date.now() - 5 * 86400000).toISOString();
    for (const [nombre, correo, celular, estado, creadoEn] of [
      ['Carlos Torres', 'carlos@ejemplo.ec', '0990000001', 'PENDIENTE', fiveDaysAgo],
      ['María López', 'maria@ejemplo.ec', '0990000002', 'PENDIENTE', new Date().toISOString()],
      ['Luis Ramírez', 'luis@ejemplo.ec', '0990000003', 'APROBADO', new Date().toISOString()],
    ]) {
      const [exists] = await this.query(
        'SELECT id FROM "Referido" WHERE COALESCE("correoIndice",correo)=$1 AND "eliminadoEn" IS NULL',
        [this.datos.correoIndice(correo) ?? correo],
      );
      if (!exists)
        await this.query(
          'INSERT INTO "Referido" (nombre,correo,celular,estado,"socioId","creadoEn","correoIndice") VALUES ($1,$2,$3,$4,$5,$6,$7)',
          [nombre, this.datos.cifrar('correo', correo), this.datos.cifrar('celular', celular), estado, socio.id, creadoEn, this.datos.correoIndice(correo)],
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
