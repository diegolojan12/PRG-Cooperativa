import express from 'express';
import { createHash, randomBytes, randomInt } from 'node:crypto';
import nodemailer from 'nodemailer';
import {
  Database,
  hashPassword,
  verifyPassword,
  MODULES,
  ROLES,
  STATES,
  ROLE_LIMITS,
  ROLE_REQUIRED,
} from './database.mjs';

/* ---------- Constantes documentadas ---------- */
const INACTIVIDAD_MS = 15 * 60_000; // RF-04-3
const BLOQUEO_MS = 15 * 60_000; // RF-04-2
const MAX_INTENTOS = 5; // RF-04-2
const CODIGO_2FA_MS = 5 * 60_000; // RNF-06
const RECUPERACION_MS = 30 * 60_000; // RF-07-1
const ACTIVACION_MS = 24 * 3600_000; // cuentas creadas por el administrador
const ASOCIACION_DIAS = 30; // RF-11-5
const POR_PAGINA_REFERIDOS = 20; // RF-11-3
const POR_PAGINA_BITACORA = 50; // RF-42-2
const REINTENTOS_CORREO = 3; // RNF-14
const ESPERA_REINTENTO_MS = 5 * 60_000; // RNF-14
const TEXTO_MAX_CONFIG = 500; // RF-14-1
// Feriados nacionales de fecha fija en Ecuador (MM-DD). Los móviles (Carnaval,
// Viernes Santo) y los traslados se agregarán cuando exista el calendario oficial.
const FERIADOS = ['01-01', '05-01', '05-24', '08-10', '10-09', '11-02', '11-03', '12-25'];

const digest = (value) => createHash('sha256').update(value).digest('hex');
const now = () => new Date().toISOString();
const fail = (message, status = 400, campos) => {
  throw Object.assign(new Error(message), { status, campos });
};
/** RNF-12: rechaza etiquetas o código incrustado en campos de texto. */
const text = (value, max = 200, campo) => {
  const result = typeof value === 'string' ? value.trim().slice(0, max) : '';
  if (/<\s*\/?\s*[a-z!]/i.test(result) || /\b(script|javascript):/i.test(result))
    fail(
      'No se permiten etiquetas HTML ni código. Escribe solo texto.',
      400,
      campo ? { [campo]: 'Quita los símbolos < > y escribe solo texto.' } : undefined,
    );
  return result;
};
const email = (value, campo = 'correo') => {
  const result = text(value, 254, campo).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result))
    fail('Ingresa un correo electrónico válido, por ejemplo nombre@correo.com.', 400, {
      [campo]: 'Escribe el correo completo, por ejemplo nombre@correo.com.',
    });
  return result;
};
const password = (value) => {
  if (
    typeof value !== 'string' ||
    value.length < 8 ||
    value.length > 128 ||
    !/[A-Z]/.test(value) ||
    !/\d/.test(value)
  )
    fail('La contraseña debe tener entre 8 y 128 caracteres, una mayúscula y un número.', 400, {
      clave: 'Usa al menos 8 caracteres, una mayúscula y un número.',
    });
  return value;
};
const person = (body) => {
  const nombre = text(body.nombre, 100, 'nombre'),
    correo = email(body.correo),
    celular = text(body.celular, 10, 'celular');
  if (nombre.length < 5 || nombre.split(/\s+/).length < 2)
    fail('Ingresa nombres y apellidos.', 400, {
      nombre: 'Escribe al menos un nombre y un apellido, por ejemplo Carlos Torres.',
    });
  if (!/^09\d{8}$/.test(celular))
    fail('Ingresa un celular de 10 dígitos que empiece por 09.', 400, {
      celular: 'Usa 10 dígitos que empiecen por 09, por ejemplo 0991234567.',
    });
  return { nombre, correo, celular };
};
const publicUser = (user) => ({
  id: user.id,
  nombre: user.nombre,
  correo: user.correo,
  rol: user.rol,
  activo: !!user.activo,
  celular: user.celular,
  creadoEn: user.creadoEn,
});
/** Fechas guardadas como texto ISO (o "YYYY-MM-DD HH:MM:SS" en SQLite) o Date (PostgreSQL). */
const toDate = (value) => {
  if (value instanceof Date) return value;
  const raw = String(value ?? '');
  return new Date(/^\d{4}-\d{2}-\d{2} \d/.test(raw) ? raw.replace(' ', 'T') + 'Z' : raw);
};
/** Días hábiles completos desde una fecha (sin fines de semana ni feriados fijos). */
export function diasHabiles(desde, hasta = new Date()) {
  const inicio = toDate(desde);
  if (Number.isNaN(inicio.getTime())) return 0;
  const dia = new Date(Date.UTC(inicio.getUTCFullYear(), inicio.getUTCMonth(), inicio.getUTCDate()));
  let total = 0;
  dia.setUTCDate(dia.getUTCDate() + 1);
  while (dia <= hasta) {
    const semana = dia.getUTCDay();
    const mmdd = dia.toISOString().slice(5, 10);
    if (semana !== 0 && semana !== 6 && !FERIADOS.includes(mmdd)) total++;
    dia.setUTCDate(dia.getUTCDate() + 1);
  }
  return total;
}
const pagina = (value) => Math.max(1, Math.min(10_000, Number.parseInt(value, 10) || 1));
const fecha = (value, campo) => {
  if (value === undefined || value === '') return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    fail('Usa fechas con el formato AAAA-MM-DD.', 400, { [campo]: 'Ejemplo: 2026-11-10.' });
  return value;
};
const finDelDia = (value) => value && `${value}T23:59:59.999Z`;
const mask = (correo) => correo.replace(/^(.).*(@.*)$/, '$1***$2');

export async function createApi(database) {
  const db = database || new Database();
  await db.init();
  const router = express.Router();
  router.use(express.json({ limit: '32kb' }));
  router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      const allowed = new URL(process.env.FRONTEND_URL || 'http://localhost:4200').origin;
      if (req.headers.origin && req.headers.origin !== allowed)
        return res.status(403).json({ message: 'Origen no permitido.' });
      if (req.headers['sec-fetch-site'] === 'cross-site')
        return res.status(403).json({ message: 'Solicitud no permitida.' });
    }
    next();
  });
  const route = (method, path, fn) =>
    router[method](path, async (req, res, next) => {
      try {
        await fn(req, res);
      } catch (error) {
        next(error);
      }
    });

  /* ---------- Bitácora (RF-42-1: usuario, acción, IP y fecha) ---------- */
  const log = (req, user, accion, detalle, client, extra = {}) =>
    db.query(
      'INSERT INTO "Actividad" ("usuarioId",actor,accion,detalle,ip,"objetivoId",datos,fecha) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [
        user?.id || null,
        user?.nombre || 'Sistema',
        accion,
        detalle,
        req.ip || null,
        extra.objetivoId ?? null,
        JSON.stringify(extra.datos ?? {}),
        now(),
      ],
      client,
    );
  const notify = (id, titulo, mensaje, client) =>
    db.query(
      'INSERT INTO "Notificacion" ("usuarioId",titulo,mensaje,fecha) VALUES ($1,$2,$3,$4)',
      [id, titulo, mensaje, now()],
      client,
    );

  /* ---------- Correo con reintentos (RNF-14: 3 reintentos cada 5 min) ---------- */
  const transporter = process.env.SMTP_HOST
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 1025),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
          : undefined,
      })
    : null;
  // La cola vive en memoria a propósito: los mensajes incluyen enlaces y códigos
  // de un solo uso que no deben persistirse en texto plano.
  function sendMail(message, intento = 0) {
    if (!transporter) return;
    transporter
      .sendMail({ from: process.env.SMTP_FROM || 'SUMA <no-reply@suma.ec>', ...message })
      .catch(() => {
        if (intento >= REINTENTOS_CORREO) {
          console.error(`No se pudo entregar "${message.subject}" tras ${intento + 1} intentos.`);
          return;
        }
        setTimeout(() => sendMail(message, intento + 1), ESPERA_REINTENTO_MS).unref();
      });
  }

  /* ---------- Sesión ---------- */
  const readToken = (req) =>
    (req.headers.cookie || '')
      .split(';')
      .map((x) => x.trim())
      .find((x) => x.startsWith('suma_session='))
      ?.slice(13);
  async function current(req, module) {
    const raw = readToken(req);
    if (!raw) fail('Inicia sesión para continuar.', 401);
    const [user] = await db.query(
      'SELECT u.* FROM "Sesion" s JOIN "Usuario" u ON u.id=s."usuarioId" WHERE s.token=$1 AND s.expira>$2',
      [digest(raw), now()],
    );
    if (!user || !user.activo) fail('Tu sesión terminó. Vuelve a ingresar.', 401);
    // RF-04-3: cada petición válida renueva la ventana de 15 minutos.
    await db.query('UPDATE "Sesion" SET expira=$2 WHERE token=$1', [
      digest(raw),
      new Date(Date.now() + INACTIVIDAD_MS).toISOString(),
    ]);
    const [role] = await db.query('SELECT modulos FROM "RolPermiso" WHERE rol=$1', [user.rol]);
    user.modulos = JSON.parse(role?.modulos || '[]');
    if (module && !user.modulos.includes(module))
      fail('No tienes permiso para acceder a este módulo.', 403);
    return user;
  }
  async function admin(req, module) {
    const user = await current(req, module);
    if (user.rol !== 'ADMIN') fail('Esta acción requiere una cuenta de administrador.', 403);
    return user;
  }
  async function openSession(req, res, user) {
    const token = randomBytes(32).toString('hex');
    await db.query('DELETE FROM "Sesion" WHERE expira<$1', [now()]);
    await db.query('INSERT INTO "Sesion" (token,"usuarioId",expira) VALUES ($1,$2,$3)', [
      digest(token),
      user.id,
      new Date(Date.now() + INACTIVIDAD_MS).toISOString(),
    ]);
    await log(req, user, 'Inicio de sesión', 'Acceso a la plataforma');
    res.cookie('suma_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
    const [role] = await db.query('SELECT modulos FROM "RolPermiso" WHERE rol=$1', [user.rol]);
    return { ...publicUser(user), modulos: JSON.parse(role?.modulos || '[]') };
  }
  const devExpose = () =>
    process.env.NODE_ENV !== 'production' && process.env.ENABLE_DEV_RESET_LINK === 'true';

  /* Límite por IP como defensa adicional (el bloqueo documentado es por cuenta). */
  const buckets = new Map();
  function rate(req, key, limit = 8) {
    const id = `${req.ip}:${key}`,
      stamp = Date.now();
    let bucket = buckets.get(id);
    if (!bucket || stamp - bucket.start > 15 * 60 * 1000) {
      bucket = { start: stamp, count: 0 };
      buckets.set(id, bucket);
    }
    if (++bucket.count > limit) fail('Demasiados intentos. Vuelve a intentarlo en 15 minutos.', 429);
    if (buckets.size > 5000)
      for (const [id, b] of buckets) if (stamp - b.start > 15 * 60 * 1000) buckets.delete(id);
  }

  route('get', '/health', async (_, res) => {
    await db.query('SELECT 1 AS ok');
    res.json({ status: 'ok', app: 'SUMA', database: db.sqlite ? 'SQLite' : 'PostgreSQL' });
  });

  /* ---------- Autenticación (RF-04, RNF-06) ---------- */
  route('post', '/auth/login', async (req, res) => {
    rate(req, 'login', 30);
    const correo = email(req.body.correo),
      clave = req.body.clave;
    if (typeof clave !== 'string' || clave.length > 128)
      fail('Correo o contraseña incorrectos.', 401);
    const [user] = await db.query('SELECT * FROM "Usuario" WHERE correo=$1', [correo]);
    if (user?.bloqueadoHasta && user.bloqueadoHasta > now())
      return res.status(423).json({
        message: 'Tu cuenta está bloqueada 15 minutos por 5 intentos fallidos consecutivos.',
        bloqueadoHasta: user.bloqueadoHasta,
      });
    if (!user || !user.activo || !verifyPassword(clave, user.passwordHash)) {
      if (user) {
        const intentos = Number(user.intentosFallidos || 0) + 1;
        const bloquear = intentos >= MAX_INTENTOS;
        const hasta = bloquear ? new Date(Date.now() + BLOQUEO_MS).toISOString() : null;
        await db.query(
          'UPDATE "Usuario" SET "intentosFallidos"=$2, "bloqueadoHasta"=$3 WHERE id=$1',
          [user.id, bloquear ? 0 : intentos, hasta],
        );
        if (bloquear) {
          await log(req, user, 'Cuenta bloqueada', `${MAX_INTENTOS} intentos fallidos consecutivos`);
          return res.status(423).json({
            message: 'Tu cuenta está bloqueada 15 minutos por 5 intentos fallidos consecutivos.',
            bloqueadoHasta: hasta,
          });
        }
      }
      fail('Correo o contraseña incorrectos.', 401);
    }
    await db.query(
      'UPDATE "Usuario" SET "intentosFallidos"=0, "bloqueadoHasta"=NULL WHERE id=$1',
      [user.id],
    );
    if (user.rol === 'ADMIN') {
      // RNF-06: segundo factor por correo en el 100 % de los accesos de administradores.
      const desafioId = randomBytes(16).toString('hex');
      const codigo = String(randomInt(0, 1_000_000)).padStart(6, '0');
      await db.query('DELETE FROM "DosFactor" WHERE "usuarioId"=$1 OR expira<$2', [user.id, now()]);
      await db.query(
        'INSERT INTO "DosFactor" (id,"usuarioId",codigo,expira) VALUES ($1,$2,$3,$4)',
        [digest(desafioId), user.id, digest(codigo), new Date(Date.now() + CODIGO_2FA_MS).toISOString()],
      );
      sendMail({
        to: user.correo,
        subject: 'Tu código de acceso a SUMA',
        text: `Tu código de verificación es ${codigo}. Vence en 5 minutos y solo funciona una vez.`,
      });
      return res.json({
        requiere2fa: true,
        desafioId,
        destino: mask(user.correo),
        ...(devExpose() ? { devCodigo: codigo } : {}),
      });
    }
    res.json(await openSession(req, res, user));
  });
  route('post', '/auth/2fa', async (req, res) => {
    rate(req, '2fa', 20);
    const desafioId = text(req.body.desafioId, 64),
      codigo = text(req.body.codigo, 6);
    const [challenge] = await db.query('SELECT * FROM "DosFactor" WHERE id=$1 AND expira>$2', [
      digest(desafioId),
      now(),
    ]);
    if (!challenge) fail('El código venció. Vuelve a iniciar sesión para recibir uno nuevo.', 401);
    if (!/^\d{6}$/.test(codigo) || digest(codigo) !== challenge.codigo) {
      const intentos = Number(challenge.intentos) + 1;
      if (intentos >= MAX_INTENTOS)
        await db.query('DELETE FROM "DosFactor" WHERE id=$1', [challenge.id]);
      else
        await db.query('UPDATE "DosFactor" SET intentos=$2 WHERE id=$1', [challenge.id, intentos]);
      fail('El código no es correcto. Revisa los 6 dígitos que enviamos a tu correo.', 401, {
        codigo: 'Escribe los 6 dígitos del correo, por ejemplo 482913.',
      });
    }
    await db.query('DELETE FROM "DosFactor" WHERE id=$1', [challenge.id]);
    const [user] = await db.query('SELECT * FROM "Usuario" WHERE id=$1', [challenge.usuarioId]);
    if (!user?.activo) fail('Correo o contraseña incorrectos.', 401);
    res.json(await openSession(req, res, user));
  });
  route('post', '/auth/logout', async (req, res) => {
    const user = await current(req);
    await db.query('DELETE FROM "Sesion" WHERE token=$1', [digest(readToken(req))]);
    await log(req, user, 'Cierre de sesión', 'Sesión cerrada por el usuario');
    res.clearCookie('suma_session', { path: '/' }).json({ ok: true });
  });
  route('get', '/auth/me', async (req, res) => {
    const user = await current(req);
    res.json({ ...publicUser(user), modulos: user.modulos });
  });
  route('post', '/auth/register', async (req, res) => {
    rate(req, 'register', 12);
    const [setting] = await db.query('SELECT valor FROM "Configuracion" WHERE clave=$1', [
      'registroAbierto',
    ]);
    if (setting?.valor !== 'true') fail('El registro está cerrado. Contacta a la cooperativa.', 403);
    const p = person(req.body),
      clave = password(req.body.clave);
    // La Visión v1.1.0 no solicita cédula; la cuenta vinculada tiene 10 dígitos (HU-015).
    const cuenta = text(req.body.cuenta, 10) || null;
    if (cuenta && (!/^\d{10}$/.test(cuenta) || !['ahorros', 'corriente'].includes(req.body.tipoCuenta)))
      fail('Revisa los datos de la cuenta.', 400, {
        cuenta: 'El número de cuenta tiene 10 dígitos, por ejemplo 2100123456.',
      });
    await db.transaction(async (client) => {
      const [user] = await db.query(
        'INSERT INTO "Usuario" (nombre,correo,celular,"passwordHash",cuenta,"tipoCuenta","cuentaEstado") VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
        [
          p.nombre,
          p.correo,
          p.celular,
          hashPassword(clave),
          cuenta,
          cuenta ? req.body.tipoCuenta : null,
          cuenta ? 'PENDIENTE' : null,
        ],
        client,
      );
      await log(req, user, 'Registro', 'Nuevo socio registrado', client, { objetivoId: user.id });
      await notify(
        user.id,
        'Bienvenido a SUMA',
        cuenta
          ? 'Tu solicitud de vinculación está pendiente de verificación.'
          : 'Tu perfil está listo para sumar.',
        client,
      );
    });
    res.status(201).json({ ok: true });
  });
  const resetUrl = (token) =>
    `${process.env.FRONTEND_URL || 'http://localhost:4200'}/recuperar-contrasena?token=${token}`;
  async function createResetLink(userId, ms) {
    const token = randomBytes(32).toString('hex');
    await db.query('DELETE FROM "Recuperacion" WHERE "usuarioId"=$1', [userId]);
    await db.query('INSERT INTO "Recuperacion" (token,"usuarioId",expira) VALUES ($1,$2,$3)', [
      digest(token),
      userId,
      new Date(Date.now() + ms).toISOString(),
    ]);
    return resetUrl(token);
  }
  route('post', '/auth/forgot', async (req, res) => {
    rate(req, 'forgot', 5);
    const correo = email(req.body.correo);
    const [user] = await db.query('SELECT * FROM "Usuario" WHERE correo=$1', [correo]);
    const result = {
      message: 'Si el correo está registrado, recibirás instrucciones para recuperar tu contraseña.',
    };
    if (user?.activo) {
      const url = await createResetLink(user.id, RECUPERACION_MS);
      sendMail({
        to: correo,
        subject: 'Recupera tu acceso a SUMA',
        text: `Crea una nueva contraseña: ${url}\nEl enlace vence en 30 minutos. Si no lo solicitaste, ignora este mensaje.`,
      });
      if (devExpose()) result.devResetUrl = url;
      await log(req, user, 'Recuperación solicitada', 'Se generó un enlace temporal');
    }
    res.json(result);
  });
  route('post', '/auth/reset', async (req, res) => {
    rate(req, 'reset', 10);
    const clave = password(req.body.clave),
      token = text(req.body.token, 64);
    await db.transaction(async (client) => {
      const [reset] = await db.query(
        'DELETE FROM "Recuperacion" WHERE token=$1 AND expira>$2 RETURNING "usuarioId"',
        [digest(token), now()],
        client,
      );
      if (!reset) fail('El enlace venció o ya se utilizó. Solicita uno nuevo.');
      await db.query(
        'UPDATE "Usuario" SET "passwordHash"=$2, "intentosFallidos"=0, "bloqueadoHasta"=NULL WHERE id=$1',
        [reset.usuarioId, hashPassword(clave)],
        client,
      );
      await db.query('DELETE FROM "Sesion" WHERE "usuarioId"=$1', [reset.usuarioId], client);
      const [user] = await db.query('SELECT * FROM "Usuario" WHERE id=$1', [reset.usuarioId], client);
      await log(req, user, 'Contraseña actualizada', 'Se cerraron todas las sesiones anteriores', client);
    });
    res.json({ message: 'Contraseña actualizada. Ya puedes iniciar sesión.' });
  });

  /* ---------- Resumen del socio y tablero del administrador ---------- */
  const setting = async (clave) =>
    (await db.query('SELECT valor FROM "Configuracion" WHERE clave=$1', [clave]))[0]?.valor;
  route('get', '/overview', async (req, res) => {
    const user = await current(req, 'panel');
    const own = user.rol !== 'ADMIN';
    const referrals = await db.query(
      `SELECT estado,"creadoEn" FROM "Referido" WHERE "eliminadoEn" IS NULL ${own ? 'AND "socioId"=$1' : ''}`,
      own ? [user.id] : [],
    );
    const states = Object.fromEntries(
      STATES.map((state) => [state, referrals.filter((x) => x.estado === state).length]),
    );
    res.json({
      referidos: referrals.length,
      mes: referrals.filter((x) => String(x.creadoEn).startsWith(now().slice(0, 7))).length,
      estados: states,
      puntos: states.APROBADO * Number(await setting('puntosReferido')),
      bienvenida: await setting('mensajeBienvenida'),
      demo: process.env.SEED_DEMO === 'true' && process.env.NODE_ENV !== 'production',
    });
  });
  // RF-45 / RF-45-1: 6 indicadores; los que dependen de sprints futuros vuelven en 0.
  route('get', '/indicadores', async (req, res) => {
    await admin(req, 'panel');
    const refs = await db.query('SELECT estado FROM "Referido" WHERE "eliminadoEn" IS NULL');
    const aprobados = refs.filter((x) => x.estado === 'APROBADO').length;
    const inicioMes = `${now().slice(0, 7)}-01T00:00:00.000Z`;
    const [activos] = await db.query(
      'SELECT COUNT(DISTINCT "usuarioId") AS total FROM "Actividad" WHERE accion=$1 AND fecha>=$2',
      ['Inicio de sesión', inicioMes],
    );
    const [socios] = await db.query(
      'SELECT COUNT(*) AS total FROM "Usuario" WHERE activo=$1 AND rol=$2',
      [true, 'SOCIO'],
    );
    const pendientes = await db.query(
      'SELECT "creadoEn" FROM "Referido" WHERE "eliminadoEn" IS NULL AND estado=$1',
      ['PENDIENTE'],
    );
    res.json({
      generadoEn: now(),
      sociosActivos: Number(socios.total),
      pendientesAtrasados: pendientes.filter((x) => diasHabiles(x.creadoEn) > 2).length,
      estados: Object.fromEntries(
        STATES.map((s) => [s, refs.filter((x) => x.estado === s).length]),
      ),
      indicadores: [
        { id: 'referidos', etiqueta: 'Referidos registrados', valor: refs.length, unidad: '' },
        {
          id: 'aprobados',
          etiqueta: '% de referidos aprobados',
          valor: refs.length ? Math.round((aprobados / refs.length) * 1000) / 10 : 0,
          unidad: '%',
        },
        {
          id: 'activos',
          etiqueta: 'Usuarios activos en el mes',
          valor: Number(activos.total),
          unidad: '',
        },
        {
          id: 'otorgados',
          etiqueta: 'Puntos otorgados',
          valor: aprobados * Number(await setting('puntosReferido')),
          unidad: 'pts',
        },
        { id: 'canjeados', etiqueta: 'Puntos canjeados', valor: 0, unidad: 'pts', disponibleDesde: 'Sprint 5' },
        { id: 'talleres', etiqueta: 'Inscripciones a talleres', valor: 0, unidad: '', disponibleDesde: 'Sprint 5' },
      ],
    });
  });

  /* ---------- Referidos (RF-11-3 a RF-11-6) ---------- */
  function referralFilters(req, user) {
    const where = ['r."eliminadoEn" IS NULL'],
      values = [];
    const add = (sql, value) => {
      values.push(value);
      where.push(sql.replace('?', `$${values.length}`));
    };
    if (user.rol !== 'ADMIN') add('r."socioId"=?', user.id);
    const q = req.query;
    if (q.estado) {
      if (!STATES.includes(q.estado)) fail('Estado no válido.');
      add('r.estado=?', q.estado);
    }
    const desde = fecha(q.desde, 'desde'),
      hasta = fecha(q.hasta, 'hasta');
    if (desde) add('r."creadoEn">=?', desde);
    if (hasta) add('r."creadoEn"<=?', finDelDia(hasta));
    const buscar = text(q.buscar, 100, 'buscar');
    if (buscar) {
      values.push(`%${buscar.toLowerCase()}%`);
      const n = `$${values.length}`;
      where.push(`(LOWER(r.nombre) LIKE ${n} OR LOWER(r.correo) LIKE ${n} OR LOWER(u.nombre) LIKE ${n})`);
    }
    return { sql: where.join(' AND '), values };
  }
  const shapeReferral = (r) => ({
    ...r,
    diasHabilesPendiente: r.estado === 'PENDIENTE' ? diasHabiles(r.creadoEn) : 0,
  });
  route('get', '/referidos', async (req, res) => {
    const user = await current(req, 'referidos');
    const { sql, values } = referralFilters(req, user);
    const porPagina = Math.min(50, Number.parseInt(req.query.porPagina, 10) || POR_PAGINA_REFERIDOS);
    const actual = pagina(req.query.pagina);
    const from = 'FROM "Referido" r JOIN "Usuario" u ON u.id=r."socioId"';
    const [{ total }] = await db.query(`SELECT COUNT(*) AS total ${from} WHERE ${sql}`, values);
    const rows = await db.query(
      `SELECT r.*,u.nombre AS socio ${from} WHERE ${sql} ORDER BY r.id DESC LIMIT ${porPagina} OFFSET ${(actual - 1) * porPagina}`,
      values,
    );
    const scope = user.rol === 'ADMIN' ? '' : 'AND "socioId"=$1';
    const counts = await db.query(
      `SELECT estado, COUNT(*) AS total FROM "Referido" WHERE "eliminadoEn" IS NULL ${scope} GROUP BY estado`,
      user.rol === 'ADMIN' ? [] : [user.id],
    );
    res.json({
      items: rows.map(shapeReferral),
      total: Number(total),
      pagina: actual,
      porPagina,
      porEstado: Object.fromEntries(
        STATES.map((s) => [s, Number(counts.find((c) => c.estado === s)?.total || 0)]),
      ),
    });
  });
  route('get', '/referidos/exportar', async (req, res) => {
    const user = await current(req, 'referidos');
    const { sql, values } = referralFilters(req, user);
    const rows = await db.query(
      `SELECT r.*,u.nombre AS socio FROM "Referido" r JOIN "Usuario" u ON u.id=r."socioId" WHERE ${sql} ORDER BY r.id DESC LIMIT 5000`,
      values,
    );
    res.json(rows.map(shapeReferral));
  });
  route('post', '/referidos', async (req, res) => {
    const user = await current(req, 'referidos'),
      p = person(req.body);
    if (req.body.consentimiento !== true)
      fail('Confirma que tienes autorización para compartir estos datos.', 400, {
        consentimiento: 'Marca la casilla para confirmar que la persona te autorizó.',
      });
    const row = await db.transaction(async (client) => {
      const [ref] = await db.query(
        'INSERT INTO "Referido" (nombre,correo,celular,"socioId","creadoEn",notas) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
        [p.nombre, p.correo, p.celular, user.id, now(), text(req.body.notas, 500, 'notas')],
        client,
      );
      await log(req, user, 'Referido registrado', `Referido #${ref.id}: ${p.nombre}`, client, {
        objetivoId: ref.id,
      });
      await notify(user.id, 'Referido registrado', `${p.nombre} se añadió a tus referidos.`, client);
      return ref;
    });
    res.status(201).json(row);
  });
  async function findReferral(id, user, client) {
    const [ref] = await db.query(
      'SELECT * FROM "Referido" WHERE id=$1 AND "eliminadoEn" IS NULL',
      [Number(id)],
      client,
    );
    if (!ref || (user.rol !== 'ADMIN' && ref.socioId !== user.id))
      fail('No se encontró el referido.', 404);
    return ref;
  }
  route('patch', '/referidos/:id', async (req, res) => {
    const user = await current(req, 'referidos');
    await db.transaction(async (client) => {
      const ref = await findReferral(req.params.id, user, client);
      if (user.rol !== 'ADMIN' && ref.estado !== 'PENDIENTE')
        fail('Solo puedes editar tus referidos pendientes. El estado lo actualiza administración.', 403);
      const p = person(req.body);
      await db.query(
        'UPDATE "Referido" SET nombre=$2,correo=$3,celular=$4,notas=$5 WHERE id=$1',
        [ref.id, p.nombre, p.correo, p.celular, text(req.body.notas, 500, 'notas')],
        client,
      );
      await log(req, user, 'Referido actualizado', `Referido #${ref.id}: ${p.nombre}`, client, {
        objetivoId: ref.id,
      });
    });
    res.json({ ok: true });
  });
  // RF-11-4: el dictamen lo emite administración y solo sobre referidos Pendientes.
  route('patch', '/referidos/:id/dictamen', async (req, res) => {
    const user = await admin(req, 'referidos');
    const estado = req.body.estado;
    if (!['APROBADO', 'RECHAZADO'].includes(estado))
      fail('Elige Aprobado o Rechazado.', 400, { estado: 'Selecciona Aprobado o Rechazado.' });
    await db.transaction(async (client) => {
      const ref = await findReferral(req.params.id, user, client);
      if (ref.estado !== 'PENDIENTE')
        fail('Solo se dictaminan referidos en estado Pendiente.', 409);
      if (estado === 'APROBADO') {
        const [cuenta] = await db.query(
          'SELECT "cuentaEstado" FROM "Usuario" WHERE correo=$1',
          [ref.correo],
          client,
        );
        if (cuenta?.cuentaEstado !== 'APROBADA')
          fail(
            'No se puede aprobar: la cuenta vinculada del referido aún no está Aprobada. La verificación de cuentas llega con la vinculación (Sprint 2).',
            409,
          );
      }
      await db.query('UPDATE "Referido" SET estado=$2 WHERE id=$1', [ref.id, estado], client);
      await log(req, user, 'Dictamen de referido', `Referido #${ref.id}: ${estado}`, client, {
        objetivoId: ref.id,
        datos: { anterior: ref.estado, nuevo: estado },
      });
      await notify(
        ref.socioId,
        'Tu referido tiene novedades',
        `${ref.nombre}: ${estado === 'APROBADO' ? 'aprobado' : 'rechazado'}.`,
        client,
      );
    });
    res.json({ ok: true });
  });
  // RF-11-6: baja lógica que conserva el historial.
  route('patch', '/referidos/:id/baja', async (req, res) => {
    const user = await current(req, 'referidos');
    const motivo = text(req.body.motivo, 300, 'motivo');
    if (motivo.length < 5)
      fail('Indica el motivo de la baja.', 400, {
        motivo: 'Escribe al menos 5 caracteres, por ejemplo: Datos duplicados.',
      });
    await db.transaction(async (client) => {
      const ref = await findReferral(req.params.id, user, client);
      if (user.rol !== 'ADMIN' && ref.estado !== 'PENDIENTE')
        fail('Solo puedes dar de baja referidos pendientes.', 403);
      await db.query(
        'UPDATE "Referido" SET "eliminadoEn"=$2,"eliminadoPor"=$3,"motivoBaja"=$4 WHERE id=$1',
        [ref.id, now(), user.id, motivo],
        client,
      );
      await log(req, user, 'Referido dado de baja', `Referido #${ref.id}: ${ref.nombre}`, client, {
        objetivoId: ref.id,
        datos: { motivo },
      });
    });
    res.json({ ok: true });
  });
  // RF-11-5: asociación manual de un usuario registrado sin código (máx. 30 días).
  const limiteAsociacion = () => new Date(Date.now() - ASOCIACION_DIAS * 86400000);
  route('get', '/referidos/asociables', async (req, res) => {
    await admin(req, 'referidos');
    const users = await db.query(
      'SELECT u.* FROM "Usuario" u WHERE u.rol=$1 AND u.activo=$2 AND NOT EXISTS (SELECT 1 FROM "Referido" r WHERE r.correo=u.correo AND r."eliminadoEn" IS NULL) ORDER BY u.id DESC',
      ['SOCIO', true],
    );
    const socios = await db.query(
      'SELECT id,nombre,correo FROM "Usuario" WHERE rol=$1 AND activo=$2 ORDER BY nombre',
      ['SOCIO', true],
    );
    res.json({
      usuarios: users.filter((u) => toDate(u.creadoEn) >= limiteAsociacion()).map(publicUser),
      socios,
    });
  });
  route('post', '/referidos/asociar', async (req, res) => {
    const user = await admin(req, 'referidos');
    const usuarioId = Number(req.body.usuarioId),
      socioId = Number(req.body.socioId);
    if (!usuarioId || !socioId || usuarioId === socioId)
      fail('Elige un usuario y un socio referidor distintos.', 400, {
        socioId: 'El socio referidor debe ser otra persona.',
      });
    const row = await db.transaction(async (client) => {
      const [target] = await db.query('SELECT * FROM "Usuario" WHERE id=$1', [usuarioId], client);
      const [socio] = await db.query(
        'SELECT * FROM "Usuario" WHERE id=$1 AND rol=$2 AND activo=$3',
        [socioId, 'SOCIO', true],
        client,
      );
      if (!target || !socio) fail('No se encontró el usuario o el socio.', 404);
      if (toDate(target.creadoEn) < limiteAsociacion())
        fail('Solo se puede asociar dentro de los 30 días siguientes al registro.', 409);
      const [ref] = await db.query(
        'INSERT INTO "Referido" (nombre,correo,celular,"socioId","creadoEn",notas,"usuarioId") VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
        [
          target.nombre,
          target.correo,
          target.celular || '',
          socio.id,
          now(),
          'Asociación manual por administración',
          target.id,
        ],
        client,
      );
      await log(req, user, 'Asociación manual', `${target.nombre} → ${socio.nombre}`, client, {
        objetivoId: ref.id,
        datos: { usuarioId: target.id, socioId: socio.id },
      });
      await notify(socio.id, 'Nuevo referido asociado', `${target.nombre} se asoció a tus referidos.`, client);
      return ref;
    });
    res.status(201).json(row);
  });

  /* ---------- Usuarios y roles (RF-08) ---------- */
  route('get', '/usuarios', async (req, res) => {
    await admin(req, 'usuarios');
    const buscar = text(req.query.buscar, 100, 'buscar').toLowerCase();
    const values = buscar ? [`%${buscar}%`] : [];
    const where = buscar ? 'WHERE LOWER(nombre) LIKE $1 OR LOWER(correo) LIKE $1' : '';
    const porPagina = POR_PAGINA_REFERIDOS,
      actual = pagina(req.query.pagina);
    const [{ total }] = await db.query(`SELECT COUNT(*) AS total FROM "Usuario" ${where}`, values);
    const rows = await db.query(
      `SELECT * FROM "Usuario" ${where} ORDER BY id LIMIT ${porPagina} OFFSET ${(actual - 1) * porPagina}`,
      values,
    );
    res.json({ items: rows.map(publicUser), total: Number(total), pagina: actual, porPagina });
  });
  // RF-08-2: solo el administrador crea cuentas de Gestor de contenidos o Administrador.
  route('post', '/usuarios', async (req, res) => {
    const user = await admin(req, 'usuarios');
    const nombre = text(req.body.nombre, 100, 'nombre'),
      correo = email(req.body.correo),
      rol = req.body.rol;
    if (nombre.length < 5 || nombre.split(/\s+/).length < 2)
      fail('Ingresa nombres y apellidos.', 400, {
        nombre: 'Escribe al menos un nombre y un apellido.',
      });
    if (!ROLES.includes(rol)) fail('Rol no válido.', 400, { rol: 'Elige uno de los 3 roles.' });
    const created = await db.transaction(async (client) => {
      const [nuevo] = await db.query(
        'INSERT INTO "Usuario" (nombre,correo,rol) VALUES ($1,$2,$3) RETURNING *',
        [nombre, correo, rol],
        client,
      );
      await log(req, user, 'Cuenta creada', `${nombre}: ${rol}`, client, {
        objetivoId: nuevo.id,
        datos: { rolNuevo: rol },
      });
      return nuevo;
    });
    // La persona define su contraseña con un enlace de un solo uso (24 h).
    const url = await createResetLink(created.id, ACTIVACION_MS);
    sendMail({
      to: correo,
      subject: 'Activa tu cuenta en SUMA',
      text: `Se creó tu cuenta de ${rol.toLowerCase()}. Define tu contraseña: ${url}\nEl enlace vence en 24 horas.`,
    });
    res.status(201).json({ ...publicUser(created), ...(devExpose() ? { devResetUrl: url } : {}) });
  });
  route('patch', '/usuarios/:id', async (req, res) => {
    const user = await admin(req, 'usuarios'),
      id = Number(req.params.id),
      { rol, activo } = req.body;
    if (!ROLES.includes(rol) || typeof activo !== 'boolean') fail('Rol o estado no válido.');
    if (id === user.id && (rol !== 'ADMIN' || !activo))
      fail('No puedes quitar tu propio acceso de administrador.');
    await db.transaction(async (client) => {
      const [target] = await db.query('SELECT * FROM "Usuario" WHERE id=$1', [id], client);
      if (!target) fail('Usuario no encontrado.', 404);
      await db.query('UPDATE "Usuario" SET rol=$2,activo=$3 WHERE id=$1', [id, rol, activo], client);
      await db.query('DELETE FROM "Sesion" WHERE "usuarioId"=$1', [id], client);
      // RF-08-5: ID del autor (usuarioId), ID del usuario (objetivoId) y nuevo rol.
      await log(
        req,
        user,
        target.rol !== rol ? 'Rol actualizado' : 'Usuario actualizado',
        `${target.nombre}: ${rol}, ${activo ? 'activo' : 'inactivo'}`,
        client,
        { objetivoId: id, datos: { rolAnterior: target.rol, rolNuevo: rol, activo } },
      );
    });
    res.json({ ok: true });
  });
  route('get', '/roles', async (req, res) => {
    await admin(req, 'roles');
    const rows = await db.query('SELECT * FROM "RolPermiso"');
    res.json(
      ROLES.map((rol) => ({
        rol,
        modulos: JSON.parse(rows.find((x) => x.rol === rol)?.modulos || '[]'),
        disponibles: ROLE_LIMITS[rol],
        obligatorios: ROLE_REQUIRED[rol],
      })),
    );
  });
  route('put', '/roles/:rol', async (req, res) => {
    const user = await admin(req, 'roles'),
      rol = req.params.rol,
      modulos = req.body.modulos;
    if (!ROLES.includes(rol) || !Array.isArray(modulos) || modulos.some((x) => !MODULES.includes(x)))
      fail('Permisos no válidos.');
    if (modulos.some((x) => !ROLE_LIMITS[rol].includes(x)))
      fail('Ese módulo no está disponible para este rol.');
    if (!ROLE_REQUIRED[rol].every((x) => modulos.includes(x)))
      fail(`El rol debe conservar: ${ROLE_REQUIRED[rol].join(', ')}.`);
    await db.transaction(async (client) => {
      const [before] = await db.query('SELECT modulos FROM "RolPermiso" WHERE rol=$1', [rol], client);
      await db.query(
        'INSERT INTO "RolPermiso" (rol,modulos) VALUES ($1,$2) ON CONFLICT (rol) DO UPDATE SET modulos=$2',
        [rol, JSON.stringify([...new Set(modulos)])],
        client,
      );
      await log(req, user, 'Permisos actualizados', `Rol ${rol}: ${modulos.join(', ')}`, client, {
        datos: { rol, anterior: JSON.parse(before?.modulos || '[]'), nuevo: modulos },
      });
    });
    res.json({ ok: true });
  });

  /* ---------- Configuración (RF-14) ---------- */
  route('get', '/configuracion', async (req, res) => {
    await admin(req, 'configuracion');
    res.json(
      Object.fromEntries(
        (await db.query('SELECT * FROM "Configuracion"')).map((x) => [x.clave, x.valor]),
      ),
    );
  });
  route('put', '/configuracion', async (req, res) => {
    const user = await admin(req, 'configuracion');
    const puntos = String(req.body.puntosReferido ?? '').trim();
    const values = {
      contacto: email(req.body.contacto, 'contacto'),
      puntosReferido: puntos,
      registroAbierto: String(req.body.registroAbierto),
      mensajeBienvenida: text(req.body.mensajeBienvenida, TEXTO_MAX_CONFIG + 1, 'mensajeBienvenida'),
    };
    if (!/^\d{1,5}$/.test(puntos) || Number(puntos) > 10000)
      fail('Los puntos deben ser un número entero entre 0 y 10000.', 400, {
        puntosReferido: 'Escribe un número entero sin decimales entre 0 y 10000, por ejemplo 100.',
      });
    if (!['true', 'false'].includes(values.registroAbierto)) fail('Elige si el registro está abierto.');
    if (!values.mensajeBienvenida || values.mensajeBienvenida.length > TEXTO_MAX_CONFIG)
      fail(`El mensaje de bienvenida debe tener entre 1 y ${TEXTO_MAX_CONFIG} caracteres.`, 400, {
        mensajeBienvenida: `Escribe un saludo de máximo ${TEXTO_MAX_CONFIG} caracteres.`,
      });
    await db.transaction(async (client) => {
      const anteriores = Object.fromEntries(
        (await db.query('SELECT * FROM "Configuracion"', [], client)).map((x) => [x.clave, x.valor]),
      );
      for (const [parametro, nuevo] of Object.entries(values)) {
        if (anteriores[parametro] === nuevo) continue;
        await db.query('UPDATE "Configuracion" SET valor=$2 WHERE clave=$1', [parametro, nuevo], client);
        // RF-14-2: parámetro, valor anterior y valor nuevo.
        await log(req, user, 'Parámetro actualizado', parametro, client, {
          datos: { parametro, anterior: anteriores[parametro], nuevo },
        });
      }
    });
    res.json({ ok: true });
  });

  /* ---------- Bitácora (RF-42-2) ---------- */
  route('get', '/actividad', async (req, res) => {
    await admin(req, 'actividad');
    const where = [],
      values = [];
    const add = (sql, value) => {
      values.push(value);
      where.push(sql.replace('?', `$${values.length}`));
    };
    const desde = fecha(req.query.desde, 'desde'),
      hasta = fecha(req.query.hasta, 'hasta');
    if (desde) add('fecha>=?', desde);
    if (hasta) add('fecha<=?', finDelDia(hasta));
    if (req.query.usuarioId) add('"usuarioId"=?', Number(req.query.usuarioId));
    if (req.query.accion) add('accion=?', text(req.query.accion, 100));
    const sql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const actual = pagina(req.query.pagina);
    const [{ total }] = await db.query(`SELECT COUNT(*) AS total FROM "Actividad" ${sql}`, values);
    const rows = await db.query(
      `SELECT * FROM "Actividad" ${sql} ORDER BY id DESC LIMIT ${POR_PAGINA_BITACORA} OFFSET ${(actual - 1) * POR_PAGINA_BITACORA}`,
      values,
    );
    res.json({
      items: rows.map((x) => ({ ...x, datos: x.datos ? JSON.parse(x.datos) : {} })),
      total: Number(total),
      pagina: actual,
      porPagina: POR_PAGINA_BITACORA,
    });
  });
  route('get', '/actividad/opciones', async (req, res) => {
    await admin(req, 'actividad');
    res.json({
      usuarios: await db.query('SELECT id,nombre FROM "Usuario" ORDER BY nombre'),
      acciones: (await db.query('SELECT DISTINCT accion FROM "Actividad" ORDER BY accion')).map(
        (x) => x.accion,
      ),
    });
  });

  /* ---------- Notificaciones y ayuda ---------- */
  route('get', '/notificaciones', async (req, res) => {
    const user = await current(req, 'notificaciones');
    res.json(
      await db.query(
        'SELECT * FROM "Notificacion" WHERE "usuarioId"=$1 ORDER BY id DESC LIMIT 100',
        [user.id],
      ),
    );
  });
  route('patch', '/notificaciones/leer', async (req, res) => {
    const user = await current(req, 'notificaciones');
    await db.query('UPDATE "Notificacion" SET leida=$2 WHERE "usuarioId"=$1', [user.id, true]);
    res.json({ ok: true });
  });
  route('get', '/ayuda', async (req, res) => {
    await current(req, 'ayuda');
    res.json({ contacto: await setting('contacto') });
  });
  router.use((_req, res) => res.status(404).json({ message: 'Ruta no encontrada.' }));
  router.use((error, _req, res, _next) => {
    const duplicate =
      error.code === '23505' || String(error.message).includes('UNIQUE constraint failed');
    const status = duplicate ? 409 : error.status || 500;
    if (status >= 500) console.error('Error API:', error.message);
    res.status(status).json({
      message: duplicate
        ? 'Ese correo ya está registrado. Usa otro correo.'
        : status >= 500
          ? 'No se pudo completar la operación. Inténtalo de nuevo.'
          : error.message,
      ...(duplicate ? { campos: { correo: 'Ese correo ya existe. Escribe uno diferente.' } } : {}),
      ...(error.campos ? { campos: error.campos } : {}),
    });
  });
  return { router, db };
}
