import { readFileSync } from 'node:fs';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import pg from 'pg';
import { ProteccionDatos } from './dominio/proteccion-datos.mjs';
import { MODULOS_INICIALES, ROLES_INICIALES } from './dominio/catalogo-inicial.mjs';
import { Referido } from './dominio/referidos.mjs';

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

/* ---------- Modelo de dominio (Documento de Visión v1.1.0, RF-08-1, RF-11-4) ----------
 * Los roles, módulos y permisos NO están en el código: viven en las tablas "Rol",
 * "Modulo" y "RolPermiso" (HU-001). Aquí solo se exportan los estados de referido. */
export const STATES = Referido.estados;

/** Migraciones en orden. Cada una se aplica una sola vez (tabla SumaMigracion). */
const MIGRACIONES = ['sprint1', 'sprint1-auditoria', 'sprint1-dominio', 'sprint1-roles'];

export class Database {
  /**
   * SUMA trabaja únicamente con PostgreSQL.
   * @param url postgresql://usuario:clave@host:5432/base
   * @param opciones.esquema esquema aislado (lo usan las pruebas automáticas)
   */
  constructor(url = process.env.DATABASE_URL, { esquema } = {}) {
    if (!/^postgres(ql)?:\/\//.test(url ?? ''))
      throw new Error(
        'DATABASE_URL debe ser una URL de PostgreSQL, por ejemplo postgresql://suma:suma_dev@localhost:5432/suma',
      );
    this.datos = new ProteccionDatos();
    this.esquema = esquema;
    this.pool = new pg.Pool({
      connectionString: url,
      max: 10,
      ...(esquema ? { options: `-c search_path=${esquema}` } : {}),
    });
  }
  async query(sql, values = [], client) {
    return (await this.queryRaw(sql, values, client)).map((fila) => this.datos.abrirFila(fila));
  }
  async queryRaw(sql, values = [], client) {
    return (await (client || this.pool).query(sql, values)).rows;
  }
  async transaction(work) {
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
  /** Aplica las migraciones pendientes; el bloqueo evita que dos servidores migren a la vez. */
  async migrar() {
    await this.transaction(async (client) => {
      await client.query('SELECT pg_advisory_xact_lock(15274000)');
      await client.query('CREATE TABLE IF NOT EXISTS "SumaMigracion" (nombre TEXT PRIMARY KEY)');
      for (const nombre of MIGRACIONES) {
        const [hecha] = await this.query('SELECT nombre FROM "SumaMigracion" WHERE nombre=$1', [nombre], client);
        if (hecha) continue;
        await client.query(readFileSync(new URL(`../prisma/${nombre}.sql`, import.meta.url), 'utf8'));
        await this.query('INSERT INTO "SumaMigracion" (nombre) VALUES ($1)', [nombre], client);
      }
    });
  }
  async init() {
    await this.migrar();
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
    await this.sembrarAcceso();
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
  /**
   * Siembra el catálogo de módulos y los roles del sistema SOLO si faltan.
   * Nunca pisa lo que el administrador ya cambió en Roles y permisos.
   */
  async sembrarAcceso() {
    let orden = 0;
    for (const m of MODULOS_INICIALES) {
      orden += 10;
      await this.query(
        'INSERT INTO "Modulo" (clave,etiqueta,grupo,icono,orden,ambito,disponible) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (clave) DO NOTHING',
        [m.clave, m.etiqueta, m.grupo, m.icono, orden, m.ambito, m.disponible],
      );
    }
    for (const r of ROLES_INICIALES) {
      const disponibles = r.disponibles ?? MODULOS_INICIALES.map((m) => m.clave);
      const creado = await this.query(
        'INSERT INTO "Rol" (clave,nombre,descripcion,sistema,"requiereSegundoFactor","alcanceGlobal",interfaz,disponibles,obligatorios,"creadoEn") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (clave) DO NOTHING RETURNING clave',
        [
          r.clave, r.nombre, r.descripcion, true, r.requiereSegundoFactor, r.alcanceGlobal,
          r.interfaz, JSON.stringify(disponibles), JSON.stringify(r.obligatorios), new Date().toISOString(),
        ],
      );
      const [actual] = await this.query('SELECT modulos FROM "RolPermiso" WHERE rol=$1', [r.clave]);
      // Base nueva: permisos de partida. Base existente (anterior a HU-001): se conservan los
      // permisos que ya tenía y solo se suman los módulos nuevos del catálogo, una única vez.
      if (!actual || creado.length) {
        const previos = actual ? JSON.parse(actual.modulos || '[]') : [];
        const unidos = [...new Set([...previos, ...r.modulos])];
        await this.query(
          'INSERT INTO "RolPermiso" (rol,modulos) VALUES ($1,$2) ON CONFLICT (rol) DO UPDATE SET modulos=$2',
          [r.clave, JSON.stringify(unidos)],
        );
      }
    }
  }
  async protegerDatosExistentes() {
    await this.transaction(async (client) => {
      await this.query('SELECT pg_advisory_xact_lock(15274001)', [], client);
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
        'INSERT INTO "Usuario" (correo,nombre,rol,"passwordHash",celular,"correoIndice","cuentaEstado") VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING RETURNING id',
        [this.datos.cifrar('correo', correo), nombre, rol, hashPassword('Suma2026!'), this.datos.cifrar('celular', celular), this.datos.correoIndice(correo), rol === 'SOCIO' ? 'APROBADO' : null],
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
    await this.pool.end();
  }
}
