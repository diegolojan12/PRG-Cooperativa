import express from 'express';
import { randomBytes } from 'node:crypto';
import { AceptacionTerminos, AvisoPrivacidad, CodigoVerificacion, CuentaCooperativa, Rol, Usuario, errorDeDominio } from './dominio/acceso.mjs';
import { CodigoReferido, Referido } from './dominio/referidos.mjs';
import { rutasCapacitaciones } from './dominio/capacitaciones.mjs';
import { rutasParticipacion } from './dominio/participacion.mjs';
import { rutasTrivia } from './dominio/trivia.mjs';
import { gestor } from './dominio/actividades.mjs';
import { Campanias, provinciasCobertura } from './dominio/campanias.mjs';
import { Gamificacion } from './dominio/gamificacion.mjs';
import { rutasPerfil } from './dominio/perfil.mjs';
import { ConfirmacionCorreo } from './dominio/confirmacion-correo.mjs';
import { AcreditacionPuntos, Notificacion, ParametroGlobal, RegistroAuditoria, PUNTOS_POR_ACCION } from './dominio/administracion.mjs';
import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
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
const POR_PAGINA_SOCIO = 10;
const POR_PAGINA_REFERIDOS = 20; // RF-11-3
const POR_PAGINA_BITACORA = 50; // RF-42-2
const REINTENTOS_CORREO = 3; // RNF-14
const ESPERA_REINTENTO_MS = 5 * 60_000; // RNF-14
const TEXTO_MAX_CONFIG = 500; // RF-14-1
// Feriados nacionales de fecha fija en Ecuador (MM-DD). Los móviles (Carnaval,
// Viernes Santo) y los traslados se agregarán cuando exista el calendario oficial.
const FERIADOS = ['01-01', '05-01', '05-24', '08-10', '10-09', '11-02', '11-03', '12-25'];

const digest = CodigoVerificacion.huella;
const now = () => new Date().toISOString();
const fail = (message, status = 400, campos) => {
  throw errorDeDominio(message, status, campos);
};
/** RNF-12: rechaza etiquetas o código incrustado en campos de texto. */
const text = (value, max = 200, campo) => {
  const result = typeof value === 'string' ? value.trim() : '';
  if (result.length > max)
    fail('El texto supera el límite permitido.', 400, campo ? { [campo]: 'Usa hasta ' + max + ' caracteres.' } : undefined);
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
  if (nombre.length < 3 || nombre.split(/\s+/).length < 2)
    fail('Ingresa nombres y apellidos.', 400, {
      nombre: 'Escribe al menos un nombre y un apellido, por ejemplo Carlos Torres.',
    });
  if (!/^09\d{8}$/.test(celular))
    fail('Ingresa un celular de 10 dígitos que empiece por 09.', 400, {
      celular: 'Usa 10 dígitos que empiecen por 09, por ejemplo 0991234567.',
    });
  return { nombre, correo, celular };
};
const publicUser = (user) => new Usuario(user);
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
  const parsed = new Date(value + 'T00:00:00Z');
  if (Number.isNaN(+parsed) || parsed.toISOString().slice(0, 10) !== value)
    fail('La fecha no existe.', 400, { [campo]: 'Elige una fecha válida.' });
  return value;
};
// Los filtros por día corresponden a la hora continental de Ecuador (UTC−5).
const inicioDelDia = (value) => new Date(value + 'T00:00:00-05:00').toISOString();
const finDelDia = (value) => new Date(value + 'T23:59:59.999-05:00').toISOString();
const csv = (value) => '"' + String(value ?? '')
  .replace(/^(\s*[=+@-]|[\t\r\n])/, "'$&")
  .replaceAll('"', '""') + '"';
const mask = (correo) => correo.replace(/^(.).*(@.*)$/, '$1***$2');

export async function createApi(database) {
  const db = database || new Database();
  await db.init();
  const cifrar = (campo, valor) => db.datos.cifrar(campo, valor);
  const correoIndice = (correo) => db.datos.correoIndice(correo);
  const cuentaIndice = (numero) => numero ? db.datos.huella('cuenta:' + numero) ?? null : null;
  const celularIndice = (celular) => db.datos.huella('celular:' + celular) ?? null;
  const claveCorreo = (correo) => correoIndice(correo) ?? correo;
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
  const route = (method, path, fn, ...middleware) =>
    router[method](path, ...middleware, async (req, res, next) => {
      try {
        if (req.body === undefined) req.body = {};
        if (!req.body || Array.isArray(req.body) || typeof req.body !== 'object')
          fail('Envía los campos en un objeto JSON.');
        await fn(req, res);
      } catch (error) {
        next(error);
      }
    });

  /* ---------- Bitácora (RF-42-1: usuario, acción, IP y fecha) ---------- */
  const log = (req, usuario, accion, detalle, client, extra = {}) => {
    const r = new RegistroAuditoria({ usuario, accion, detalle, ip: req.ip, ...extra, fecha: now() });
    return db.query(
      'INSERT INTO "Actividad" ("usuarioId",actor,accion,detalle,ip,"objetivoId",datos,fecha) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [r.usuarioId, r.actor, r.accion, r.detalle, r.ip, r.objetivoId, r.datos, r.fecha],
      client,
    );
  };
  const notify = (id, titulo, mensaje, client) => {
    const n = new Notificacion(id, titulo, mensaje, now());
    return db.query(
      'INSERT INTO "Notificacion" ("usuarioId",titulo,mensaje,fecha) VALUES ($1,$2,$3,$4)',
      [n.usuarioId, n.titulo, n.mensaje, n.fecha],
      client,
    );
  };

  const confirmacionCorreo = new ConfirmacionCorreo(db);
  const acreditacion = new AcreditacionPuntos(db, notify);
  const gamificacion = new Gamificacion(db, notify);
  const campanias = new Campanias(db, log);

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
  function sendMail(message, intento = 0, vence, sigueVigente) {
    if (!transporter || (vence && Date.parse(vence) <= Date.now())) return;
    transporter
      .sendMail({ from: process.env.SMTP_FROM || 'SUMA <no-reply@suma.ec>', ...message })
      .catch(() => {
        if (intento >= REINTENTOS_CORREO) {
          console.error(`No se pudo entregar "${message.subject}" tras ${intento + 1} intentos.`);
          return;
        }
        setTimeout(async () => {
          try {
            if (!sigueVigente || await sigueVigente())
              sendMail(message, intento + 1, vence, sigueVigente);
          } catch {
            console.error('No se pudo comprobar la vigencia del correo antes de reintentar.');
          }
        }, ESPERA_REINTENTO_MS).unref();
      });
  }

  /* ---------- Sesión ---------- */
  const readToken = (req) =>
    (req.headers.cookie || '')
      .split(';')
      .map((x) => x.trim())
      .find((x) => x.startsWith('suma_session='))
      ?.slice(13);
  async function current(req, module, renovar = true) {
    const raw = readToken(req);
    if (!raw) fail('Inicia sesión para continuar.', 401);
    const [user] = await db.query(
      'SELECT u.* FROM "Sesion" s JOIN "Usuario" u ON u.id=s."usuarioId" WHERE s.token=$1 AND s.expira>$2',
      [digest(raw), now()],
    );
    if (!user || !user.activo || !user.correoVerificado) fail('Tu sesión terminó. Vuelve a ingresar.', 401);
    const [role] = await db.query('SELECT modulos FROM "RolPermiso" WHERE rol=$1', [user.rol]);
    user.modulos = JSON.parse(role?.modulos || '[]');
    if (module && !user.modulos.includes(module))
      fail('No tienes permiso para acceder a este módulo.', 403);
    if (renovar) {
      const expira = new Date(Date.now() + INACTIVIDAD_MS).toISOString();
      await db.query('UPDATE "Sesion" SET expira=$2 WHERE token=$1 AND expira<$2 AND expira>$3', [
        digest(raw), expira, now(),
      ]);
    }
    return user;
  }
  async function admin(req, module) {
    const user = await current(req, module);
    if (user.rol !== 'ADMIN') fail('Esta acción requiere una cuenta de administrador.', 403);
    return user;
  }
  async function openSession(req, res, user) {
    const token = CodigoVerificacion.token();
    await db.transaction(async (client) => {
      const [actual] = await db.query(
        'SELECT * FROM "Usuario" WHERE id=$1' + (db.sqlite ? '' : ' FOR UPDATE'), [user.id], client,
      );
      if (!actual?.activo || !actual.correoVerificado || actual.passwordHash !== user.passwordHash || actual.rol !== user.rol)
        fail('Tus credenciales cambiaron. Vuelve a iniciar sesión.', 401);
      await db.query('DELETE FROM "Sesion" WHERE expira<$1', [now()], client);
      await db.query('INSERT INTO "Sesion" (token,"usuarioId",expira) VALUES ($1,$2,$3)', [
        digest(token), user.id, new Date(Date.now() + INACTIVIDAD_MS).toISOString(),
      ], client);
      await log(req, user, 'Inicio de sesión', 'Acceso a la plataforma', client);
    });
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
    const [user] = await db.query('SELECT * FROM "Usuario" WHERE COALESCE("correoIndice",correo)=$1', [claveCorreo(correo)]);
    if (user?.bloqueadoHasta && user.bloqueadoHasta > now())
      return res.status(423).json({
        message: 'Tu cuenta está bloqueada 15 minutos por 5 intentos fallidos consecutivos.',
        bloqueadoHasta: user.bloqueadoHasta,
      });
    if (!user || !user.activo || !verifyPassword(clave, user.passwordHash)) {
      if (user) {
        const ahora = now();
        const hasta = new Date(Date.now() + BLOQUEO_MS).toISOString();
        const [actualizado] = await db.query(
          `UPDATE "Usuario" SET "intentosFallidos"=CASE WHEN "intentosFallidos"+1 >= $2 THEN 0 ELSE "intentosFallidos"+1 END,
          "bloqueadoHasta"=CASE WHEN "intentosFallidos"+1 >= $2 THEN $3 ELSE NULL END
          WHERE id=$1 AND ("bloqueadoHasta" IS NULL OR "bloqueadoHasta"<=$4) AND "passwordHash"=$5
          RETURNING "bloqueadoHasta"`,
          [user.id, MAX_INTENTOS, hasta, ahora, user.passwordHash],
        );
        const bloquear = actualizado?.bloqueadoHasta;
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
    const requiereSegundoFactor = user.correoVerificado && new Rol(user.rol).requiereSegundoFactor;
    const desafioId = requiereSegundoFactor ? randomBytes(16).toString('hex') : null;
    const codigo = requiereSegundoFactor ? CodigoVerificacion.segundoFactor() : null;
    await db.transaction(async (client) => {
      const [actual] = await db.query(
        'UPDATE "Usuario" SET "intentosFallidos"=0, "bloqueadoHasta"=NULL WHERE id=$1 AND "passwordHash"=$2 AND rol=$3 AND activo=$4 AND ("bloqueadoHasta" IS NULL OR "bloqueadoHasta"<=$5) RETURNING id',
        [user.id, user.passwordHash, user.rol, true, now()], client,
      );
      if (!actual) fail('No se pudo iniciar sesión. Intenta de nuevo más tarde.', 401);
      if (requiereSegundoFactor) {
        await db.query('DELETE FROM "DosFactor" WHERE "usuarioId"=$1 OR expira<$2', [user.id, now()], client);
        await db.query(
          'INSERT INTO "DosFactor" (id,"usuarioId",codigo,expira) VALUES ($1,$2,$3,$4)',
          [digest(desafioId), user.id, digest(codigo), new Date(Date.now() + CODIGO_2FA_MS).toISOString()],
          client,
        );
      }
    });
    if (!user.correoVerificado) {
      const token = await confirmacionCorreo.reanudar(user.id);
      if (token) return res.json({ requiereConfirmacion: true, token, destino: mask(user.correo) });
      fail('Vuelve a intentar iniciar sesión.', 409);
    }
    if (requiereSegundoFactor) {
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
    if (!/^\d{6}$/.test(codigo) || !new CodigoVerificacion(challenge.codigo, challenge.expira).esValido(codigo)) {
      await db.query('UPDATE "DosFactor" SET intentos=intentos+1 WHERE id=$1 AND intentos<$2', [challenge.id, MAX_INTENTOS]);
      fail('El código no es correcto. Revisa los 6 dígitos que enviamos a tu correo.', 401, {
        codigo: 'Escribe los 6 dígitos del correo, por ejemplo 482913.',
      });
    }
    const [user] = await db.transaction(async (client) => {
      // Bloquea primero al usuario, igual que login, cambio de rol y recuperación.
      const [usuario] = await db.query(
        'SELECT * FROM "Usuario" WHERE id=$1' + (db.sqlite ? '' : ' FOR UPDATE'), [challenge.usuarioId], client,
      );
      if (!usuario?.activo || usuario.rol !== 'ADMIN') fail('Vuelve a iniciar sesión.', 401);
      const [consumido] = await db.query(
        'DELETE FROM "DosFactor" WHERE id=$1 AND expira>$2 AND intentos<$3 RETURNING id',
        [challenge.id, now(), MAX_INTENTOS], client,
      );
      if (!consumido) fail('El código venció o ya se utilizó. Vuelve a iniciar sesión.', 401);
      return [usuario];
    });
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
  async function validarCuentaDisponible(numero, client) {
    const clave = cuentaIndice(numero) ?? numero;
    if (!db.sqlite) await db.query('SELECT pg_advisory_xact_lock(15274002, hashtext($1))', [clave], client);
    const [duplicada] = await db.query(
      'SELECT id FROM "Usuario" WHERE COALESCE("cuentaIndice",cuenta)=$1 AND "cuentaEstado" IN ($2,$3,$4)',
      [clave, 'PENDIENTE', 'APROBADA', 'APROBADO'], client,
    );
    if (duplicada) fail('La cuenta ya está vinculada a otro perfil.', 409, {
      cuenta: 'Ingresa otra cuenta o consulta con soporte.',
    });
  }

  route('get', '/auth/cuenta', async (req, res) => {
    const usuario = await current(req);
    if (usuario.rol !== 'SOCIO') fail('La vinculación es para socios y clientes.', 403);
    const cuenta = usuario.cuenta
      ? new CuentaCooperativa(usuario.cuenta, usuario.tipoCuenta, usuario.cuentaEstado)
      : null;
    res.json(cuenta && {
      numero: req.query.mostrar === '1' ? cuenta.numeroCuenta : cuenta.numeroEnmascarado(),
      tipo: cuenta.tipoCuenta, estado: publicUser(usuario).cuentaEstado,
    });
  });
  route('post', '/auth/cuenta', async (req, res) => {
    const usuario = await current(req);
    if (usuario.rol !== 'SOCIO') fail('La vinculación es para socios y clientes.', 403);
    const cuenta = new CuentaCooperativa(req.body.cuenta, req.body.tipoCuenta);
    await db.transaction(async (client) => {
      const [actual] = await db.query(
        'SELECT "cuentaEstado",rol,activo FROM "Usuario" WHERE id=$1' + (db.sqlite ? '' : ' FOR UPDATE'), [usuario.id], client,
      );
      if (!actual?.activo || actual.rol !== 'SOCIO') fail('No tienes permiso para vincular una cuenta.', 403);
      if (actual.cuentaEstado && !['RECHAZADA','RECHAZADO'].includes(actual.cuentaEstado))
        fail('Ya tienes una cuenta vinculada o pendiente de revisión.', 409);
      await validarCuentaDisponible(cuenta.numeroCuenta, client);
      await db.query(
        'UPDATE "Usuario" SET cuenta=$2,"tipoCuenta"=$3,"cuentaIndice"=$4,"cuentaEstado"=$5,"cuentaSolicitadaEn"=$6,"cuentaRevisadaEn"=NULL WHERE id=$1',
        [usuario.id, cifrar('cuenta', cuenta.numeroCuenta), cuenta.tipoCuenta, cuentaIndice(cuenta.numeroCuenta), cuenta.estado, now()], client,
      );
      await log(req, usuario, 'Vinculación solicitada', 'Cuenta pendiente de revisión', client, { objetivoId: usuario.id });
    });
    res.status(201).json({ cuentaEstado: cuenta.estado, cuentaVerificada: false });
  });
  const enviarConfirmacion = (correo, prueba) => sendMail({
    to: correo,
    subject: 'Confirma tu correo en SUMA',
    text: 'Tu código de confirmación es ' + prueba.codigo + '. Vence en 10 minutos y es de un solo uso.',
  }, 0, prueba.vence, () => confirmacionCorreo.pendiente(prueba.huella));
  const exigirCorreoDisponible = () => {
    if (!transporter && !devExpose()) fail('La confirmación por correo no está disponible en este momento.', 503);
  };

  route('get', '/auth/aviso-privacidad', async (_, res) => {
    res.json(AvisoPrivacidad.vigente());
  });
  route('post', '/auth/confirmar-correo', async (req, res) => {
    rate(req, 'confirmar-correo', 30);
    const resultado = await confirmacionCorreo.confirmar(req.body.token, req.body.codigo, async (id, client) => {
      const [u] = await db.query('SELECT id,nombre FROM "Usuario" WHERE id=$1', [id], client);
      await log(req, u, 'Correo actualizado', 'El titular confirmó su nuevo correo', client, { objetivoId: id });
    });
    if (!resultado)
      fail('El código no es correcto, venció o agotó sus intentos. Solicita otro.', 400, {
        codigo: 'Verifica los seis dígitos o solicita un código nuevo.',
      });
    if (resultado.cambioCorreo) res.clearCookie('suma_session', { path: '/' });
    res.json({ ok: true, ...resultado });
  });
  route('post', '/auth/reenviar-confirmacion', async (req, res) => {
    rate(req, 'reenviar-confirmacion', 15);
    exigirCorreoDisponible();
    const prueba = await confirmacionCorreo.reenviar(req.body.token);
    enviarConfirmacion(prueba.correo, prueba);
    res.json({ ok: true, ...(devExpose() ? { devCodigo: prueba.codigo } : {}) });
  });
  rutasPerfil({ db, route, current, fail, person, password, verifyPassword, hashPassword,
    confirmacionCorreo, enviarConfirmacion, exigirCorreoDisponible, devExpose, mask, gamificacion, log });
  campanias.rutas({ route, current, admin, text, now });
  gamificacion.rutas({ route, current, admin, text, now, pagina, log });
  const cargaBinaria = (limit, autorizar = (req) => gestor(req, current)) => [
    async (req, _res, next) => {
      try { await autorizar(req, 'panel'); next(); }
      catch (error) { next(error); }
    },
    express.raw({ type: 'application/octet-stream', limit, inflate: false }),
  ];
  const contextoActividades = { db, route, current, admin, text, now, pagina, log, notify, gamificacion, acreditacion, cargaBinaria };
  const recordatorios = rutasParticipacion(contextoActividades);
  rutasTrivia(contextoActividades);
  rutasCapacitaciones(contextoActividades);
  route('get', '/provincias', (_, res) => res.json(provinciasCobertura()));

  route('post', '/auth/register', async (req, res) => {
    rate(req, 'register', 12);
    const [setting] = await db.query('SELECT valor FROM "Configuracion" WHERE clave=$1', [
      'registroAbierto',
    ]);
    if (setting?.valor !== 'true') fail('El registro está cerrado. Contacta a la cooperativa.', 403);
    const p = person(req.body),
      clave = password(req.body.clave);
    if (clave !== req.body.confirmacionClave)
      fail('Las contraseñas no coinciden.', 400, { confirmacionClave: 'Repite exactamente la contraseña.' });
    const aviso = AvisoPrivacidad.vigente();
    const aceptacion = new AceptacionTerminos(aviso, req.body.aceptaTerminos, req.body.versionAviso, now());
    exigirCorreoDisponible();
    const provincia = req.body.provincia || null;
    if (provincia && !provinciasCobertura().includes(provincia))
      fail('Selecciona una provincia de la lista.', 400, { provincia: 'Elige una provincia válida.' });
    const cuenta = req.body.cuenta
      ? new CuentaCooperativa(req.body.cuenta, req.body.tipoCuenta)
      : null;
    const codigo = req.body.codigoReferido
      ? new CodigoReferido(text(req.body.codigoReferido, 8, 'codigoReferido').toUpperCase())
      : null;
    const prueba = await db.transaction(async (client) => {
      let socio;
      if (codigo) {
        [socio] = await db.query(
          'SELECT id,correo,"cuentaEstado" FROM "Usuario" WHERE "codigoReferido"=$1 AND rol=$2 AND activo=$3' + (db.sqlite ? '' : ' FOR UPDATE'),
          [codigo.codigo, 'SOCIO', true], client,
        );
        if (!CuentaCooperativa.estaAprobada(socio?.cuentaEstado) || socio.correo === p.correo)
          fail('El código no pertenece a un socio con una cuenta aprobada.', 400, {
            codigoReferido: 'Revisa el código o continúa sin él.',
          });
      }
      if (cuenta) await validarCuentaDisponible(cuenta.numeroCuenta, client);
      const indice = celularIndice(p.celular);
      if (!db.sqlite) await db.query('SELECT pg_advisory_xact_lock(15274004, hashtext($1))', [indice ?? p.celular], client);
      const [duplicado] = await db.query(
        'SELECT id FROM "Usuario" WHERE COALESCE("celularIndice",celular)=$1', [indice ?? p.celular], client,
      );
      if (duplicado) fail('Ese celular ya está registrado.', 409, { celular: 'Escribe otro número o recupera tu cuenta.' });
      await db.query('INSERT INTO "AvisoPrivacidad" (version,terminos,privacidad) VALUES ($1,$2,$3) ON CONFLICT (version) DO NOTHING',
        [aviso.version, aviso.terminos, aviso.privacidad], client);
      const [publicado] = await db.query('SELECT terminos,privacidad FROM "AvisoPrivacidad" WHERE version=$1', [aviso.version], client);
      if (publicado.terminos !== aviso.terminos || publicado.privacidad !== aviso.privacidad)
        fail('La versión publicada del aviso cambió. Contacta con soporte.', 503);
      const [user] = await db.query(
        'INSERT INTO "Usuario" (nombre,correo,celular,"passwordHash",cuenta,"tipoCuenta","cuentaEstado","correoIndice","cuentaIndice","cuentaSolicitadaEn","celularIndice","correoVerificado",provincia) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *',
        [
          p.nombre,
          cifrar('correo', p.correo),
          cifrar('celular', p.celular),
          hashPassword(clave),
          cifrar('cuenta', cuenta?.numeroCuenta ?? null),
          cuenta?.tipoCuenta ?? null,
          cuenta?.estado ?? null,
          correoIndice(p.correo),
          cuentaIndice(cuenta?.numeroCuenta),
          cuenta ? now() : null,
          indice,
          false,
          provincia,
        ],
        client,
      );
      await db.query('INSERT INTO "AceptacionTerminos" ("usuarioId",version,fecha) VALUES ($1,$2,$3)',
        [user.id, aceptacion.version, aceptacion.fecha], client);
      if (socio) {
        const [previo] = await db.query(
          'SELECT id,"socioId",estado FROM "Referido" WHERE COALESCE("correoIndice",correo)=$1 AND "eliminadoEn" IS NULL' + (db.sqlite ? '' : ' FOR UPDATE'),
          [claveCorreo(p.correo)], client,
        );
        if (previo && (previo.socioId !== socio.id || previo.estado !== 'PENDIENTE'))
          fail('Ya existe un referido activo con ese correo.', 409, { codigoReferido: 'Contacta a soporte para revisar la asociación.' });
        const [ref] = previo
          ? await db.query('UPDATE "Referido" SET "usuarioId"=$2,nombre=$3,celular=$4 WHERE id=$1 RETURNING id', [
              previo.id, user.id, p.nombre, cifrar('celular', p.celular),
            ], client)
          : await db.query(
              'INSERT INTO "Referido" (nombre,correo,celular,"socioId","creadoEn","usuarioId","correoIndice") VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
              [p.nombre, cifrar('correo', p.correo), cifrar('celular', p.celular), socio.id, now(), user.id, correoIndice(p.correo)], client,
            );
        await campanias.vincular(ref.id, socio.id, client);
        await log(req, user, 'Referido asociado por código', 'Registro mediante invitación', client, { objetivoId: ref.id, datos: { socioId: socio.id } });
        await notify(socio.id, 'Nuevo referido asociado', new Referido({ nombre: p.nombre }).nombreDePila + ' se registró con tu código.', client);
      }
      await log(req, user, 'Registro', 'Nuevo socio registrado', client, { objetivoId: user.id });
      await notify(
        user.id,
        'Bienvenido a SUMA',
        cuenta
          ? 'Tu solicitud de vinculación está pendiente de verificación.'
          : 'Tu perfil está listo para sumar.',
        client,
      );
      return confirmacionCorreo.iniciar(user.id, client);
    });
    enviarConfirmacion(p.correo, prueba);
    res.status(201).json({
      ok: true, requiereConfirmacion: true, token: prueba.token, destino: mask(p.correo),
      ...(devExpose() ? { devCodigo: prueba.codigo } : {}),
    });
  });
  const resetUrl = (token) =>
    `${process.env.FRONTEND_URL || 'http://localhost:4200'}/recuperar-contrasena?token=${token}`;
  async function createResetLink(userId, ms, client) {
    const token = CodigoVerificacion.token();
    await db.query('SELECT id FROM "Usuario" WHERE id=$1' + (db.sqlite ? '' : ' FOR UPDATE'), [userId], client);
    await db.query('DELETE FROM "Recuperacion" WHERE "usuarioId"=$1', [userId], client);
    await db.query('INSERT INTO "Recuperacion" (token,"usuarioId",expira) VALUES ($1,$2,$3)', [
      digest(token), userId, new Date(Date.now() + ms).toISOString(),
    ], client);
    return resetUrl(token);
  }
  route('post', '/auth/forgot', async (req, res) => {
    rate(req, 'forgot', 5);
    const correo = email(req.body.correo);
    const [user] = await db.query('SELECT * FROM "Usuario" WHERE COALESCE("correoIndice",correo)=$1', [claveCorreo(correo)]);
    const result = {
      message: 'Si el correo está registrado, recibirás instrucciones para recuperar tu contraseña.',
    };
    if (user?.activo) {
      const url = await db.transaction((client) => createResetLink(user.id, RECUPERACION_MS, client));
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
      const [pendiente] = await db.query('SELECT "usuarioId" FROM "Recuperacion" WHERE token=$1 AND expira>$2', [digest(token), now()], client);
      if (!pendiente) fail('El enlace venció o ya se utilizó. Solicita uno nuevo.');
      await db.query('SELECT id FROM "Usuario" WHERE id=$1' + (db.sqlite ? '' : ' FOR UPDATE'), [pendiente.usuarioId], client);
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
      await db.query('DELETE FROM "DosFactor" WHERE "usuarioId"=$1', [reset.usuarioId], client);
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
    const progreso = await gamificacion.resumen(user.id);
    const [totalGeneral] = own ? [] : await db.query('SELECT COALESCE(SUM(cantidad),0) AS total FROM "MovimientoPuntos" WHERE tipo=$1', ['CREDITO']);
    res.json({
      referidos: referrals.length,
      mes: referrals.filter((x) => String(x.creadoEn).startsWith(now().slice(0, 7))).length,
      estados: states,
      ...progreso,
      puntos: own ? progreso.saldo : Number(totalGeneral.total),
      bienvenida: await setting('mensajeBienvenida'),
      demo: process.env.SEED_DEMO === 'true' && process.env.NODE_ENV !== 'production',
    });
  });
  async function indicadores() {
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
    const [movimientos] = await db.query(
      "SELECT COALESCE(SUM(CASE WHEN tipo='CREDITO' THEN cantidad ELSE 0 END),0) AS otorgados FROM \"MovimientoPuntos\"",
    );
    const [{ total: inscripciones }] = await db.query('SELECT COUNT(*) AS total FROM "Inscripcion" WHERE estado=$1', ['CONFIRMADA']);
    return {
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
          valor: Number(movimientos.otorgados),
          unidad: 'pts',
        },
        { id: 'canjeados', etiqueta: 'Puntos canjeados', valor: 0, unidad: 'pts', disponibleDesde: 'Sprint 5' },
        { id: 'talleres', etiqueta: 'Inscripciones a talleres', valor: Number(inscripciones), unidad: '' },
      ],
    };
  }
  route('get', '/indicadores', async (req, res) => {
    await admin(req, 'panel');
    res.json(await indicadores());
  });

  /* ---------- Referidos (RF-11-3 a RF-11-6) ---------- */
  function referralFilters(req, user, soloPendientes = false) {
    const where = ['r."eliminadoEn" IS NULL'],
      values = [];
    const add = (sql, value) => {
      values.push(value);
      where.push(sql.replace('?', `$${values.length}`));
    };
    if (user.rol !== 'ADMIN') add('r."socioId"=?', user.id);
    const q = req.query;
    if (soloPendientes) add('r.estado=?', 'PENDIENTE');
    else if (q.estado) {
      if (!STATES.includes(q.estado)) fail('Estado no válido.');
      add('r.estado=?', q.estado);
    }
    const desde = fecha(q.desde, 'desde'),
      hasta = fecha(q.hasta, 'hasta');
    if (desde && hasta && desde > hasta) fail('La fecha inicial debe ser anterior o igual a la final.', 400, { hasta: 'Selecciona una fecha igual o posterior al inicio.' });
    if (desde) add('r."creadoEn">=?', inicioDelDia(desde));
    if (hasta) add('r."creadoEn"<=?', finDelDia(hasta));
    if (user.rol === 'ADMIN') {
      if (q.campania) add('r.campania=?', text(q.campania, 100, 'campania'));
      if (q.provincia) add('r.provincia=?', text(q.provincia, 100, 'provincia'));
    }
    const buscar = text(q.buscar, 100, 'buscar').toLowerCase();
    if (buscar) {
      if (user.rol === 'ADMIN') {
        values.push('%' + buscar + '%');
        const n = '$' + values.length;
        values.push(claveCorreo(buscar));
        const correo = '$' + values.length;
        where.push('(LOWER(r.nombre) LIKE ' + n + ' OR COALESCE(r."correoIndice",r.correo)=' + correo + ' OR LOWER(u.nombre) LIKE ' + n + ')');
      } else {
        const nombreDePila = db.sqlite
          ? "SUBSTR(TRIM(r.nombre), 1, INSTR(TRIM(r.nombre) || ' ', ' ') - 1)"
          : "SPLIT_PART(TRIM(r.nombre), ' ', 1)";
        add('LOWER(' + nombreDePila + ') LIKE ?', '%' + buscar + '%');
      }
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
    const porPagina = user.rol === 'ADMIN' ? POR_PAGINA_REFERIDOS : POR_PAGINA_SOCIO;
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
    let filtros;
    if (user.rol === 'ADMIN') {
      const opciones = await db.query('SELECT DISTINCT campania, provincia FROM "Referido" WHERE "eliminadoEn" IS NULL');
      const valores = (campo) => [...new Set(opciones.map((r) => r[campo]).filter(Boolean))].sort();
      filtros = { campanias: valores('campania'), provincias: valores('provincia') };
    }
    res.json({
      items: rows.map((r) => user.rol === 'ADMIN' ? shapeReferral(r) : new Referido(r).consultaSocio()),
      total: Number(total),
      pagina: actual,
      porPagina,
      filtros,
      porEstado: Object.fromEntries(
        STATES.map((s) => [s, Number(counts.find((c) => c.estado === s)?.total || 0)]),
      ),
    });
  });
  route('get', '/referidos/exportar', async (req, res) => {
    await admin(req, 'referidos');
    const { sql, values } = referralFilters(req, { rol: 'ADMIN' }, true);
    const rows = await db.query(
      'SELECT r.nombre,r.correo,r.celular,u.nombre AS socio,r."creadoEn" FROM "Referido" r JOIN "Usuario" u ON u.id=r."socioId" WHERE ' + sql + ' ORDER BY r.id DESC',
      values,
    );
    const lineas = [
      ['Nombre', 'Correo', 'Celular', 'Socio referidor', 'Fecha de registro'],
      ...rows.map((r) => [r.nombre, r.correo, r.celular, r.socio, r.creadoEn]),
    ];
    res.attachment('SUMA-referidos.csv').type('text/csv').send('\uFEFF' + lineas.map((fila) => fila.map(csv).join(',')).join('\r\n'));
  });
  async function generarCodigo(usuario, client) {
    if (usuario.codigoReferido) return usuario.codigoReferido;
    if (!db.sqlite) await db.query('SELECT pg_advisory_xact_lock(15274005)', [], client);
    for (let intento = 0; intento < 5; intento++) {
      const codigo = CodigoReferido.generar().codigo;
      const [actual] = await db.query(
        'UPDATE "Usuario" SET "codigoReferido"=$2 WHERE id=$1 AND NOT EXISTS (SELECT 1 FROM "Usuario" WHERE "codigoReferido"=$2) RETURNING "codigoReferido"',
        [usuario.id, codigo], client,
      );
      if (actual) return actual.codigoReferido;
    }
    fail('No se pudo generar el enlace. Inténtalo de nuevo.', 503);
  }

  route('post', '/referidos/mi-codigo', async (req, res) => {
    const user = await current(req, 'referidos');
    const codigo = await db.transaction(async (client) => {
      const [actual] = await db.query(
        'SELECT id,rol,activo,"cuentaEstado","codigoReferido" FROM "Usuario" WHERE id=$1' + (db.sqlite ? '' : ' FOR UPDATE'),
        [user.id], client,
      );
      if (!actual?.activo || actual.rol !== 'SOCIO' || !CuentaCooperativa.estaAprobada(actual.cuentaEstado))
        fail('Necesitas una cuenta de la Cooperativa aprobada para generar tu enlace.', 403);
      return generarCodigo(actual, client);
    });
    const enlace = new CodigoReferido(codigo).enlace(process.env.FRONTEND_URL || 'http://localhost:4200');
    res.json({ codigo, enlace, qr: await QRCode.toDataURL(enlace, { width: 256 }) });
  });
  route('post', '/referidos', async (req, res) => {
    const user = await current(req, 'referidos'),
      p = person(req.body);
    if (user.rol === 'SOCIO' && !CuentaCooperativa.estaAprobada(user.cuentaEstado))
      fail('Vincula y verifica tu cuenta de la Cooperativa antes de referir.', 403);
    if (p.correo === user.correo) fail('Usa los datos de otra persona. No puedes referirte a ti mismo.', 400, {
      correo: 'Escribe el correo de la persona que quieres referir.',
    });
    if (req.body.consentimiento !== true)
      fail('Confirma que tienes autorización para compartir estos datos.', 400, {
        consentimiento: 'Marca la casilla para confirmar que la persona te autorizó.',
      });
    const row = await db.transaction(async (client) => {
      const [ref] = await db.query(
        'INSERT INTO "Referido" (nombre,correo,celular,"socioId","creadoEn",notas,"correoIndice") VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
        [p.nombre, cifrar('correo', p.correo), cifrar('celular', p.celular), user.id, now(), text(req.body.notas, 500, 'notas'), correoIndice(p.correo)],
        client,
      );
      await campanias.vincular(ref.id, user.id, client);
      await log(req, user, 'Referido registrado', `Referido #${ref.id}: ${p.nombre}`, client, {
        objetivoId: ref.id,
      });
      await notify(user.id, 'Referido registrado', new Referido(ref).nombreDePila + ' se añadió a tus referidos.', client);
      return ref;
    });
    res.status(201).json(user.rol === 'ADMIN' ? shapeReferral(row) : new Referido(row).consultaSocio());
  });
  async function findReferral(id, user, client) {
    const numero = Number(id);
    if (!Number.isSafeInteger(numero) || numero < 1) fail('No se encontró el referido.', 404);
    const [ref] = await db.query(
      'SELECT * FROM "Referido" WHERE id=$1 AND "eliminadoEn" IS NULL' + (db.sqlite ? '' : ' FOR UPDATE'),
      [numero],
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
      if (user.rol !== 'ADMIN') fail('La edición de datos está reservada a administración.', 403);
      if (ref.usuarioId) fail('Los datos de esta persona están vinculados a su cuenta.', 409);
      const p = person(req.body);
      await db.query(
        'UPDATE "Referido" SET nombre=$2,correo=$3,celular=$4,notas=$5,"correoIndice"=$6 WHERE id=$1',
        [ref.id, p.nombre, cifrar('correo', p.correo), cifrar('celular', p.celular), text(req.body.notas, 500, 'notas'), correoIndice(p.correo)],
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
      const decision = new Referido(ref);
      const fechaDecision = now();
      let destinatario = ref.usuarioId;
      if (estado === 'APROBADO') {
        const [cuenta] = await db.query(
          ref.usuarioId
            ? 'SELECT id,"cuentaEstado" FROM "Usuario" WHERE id=$1 AND activo=$2 AND "correoVerificado"=$2'
            : 'SELECT id,"cuentaEstado" FROM "Usuario" WHERE COALESCE("correoIndice",correo)=$1 AND activo=$2 AND "correoVerificado"=$2',
          [ref.usuarioId ?? claveCorreo(ref.correo), true], client,
        );
        decision.aprobar(cuenta?.cuentaEstado, fechaDecision);
        destinatario = cuenta.id;
      } else {
        decision.rechazar(fechaDecision);
      }
      await db.query('UPDATE "Referido" SET estado=$2,"fechaDecision"=$3,"usuarioId"=$4 WHERE id=$1', [
        ref.id, decision.estado, decision.fechaDecision, destinatario ?? null,
      ], client);
      if (decision.estado === 'APROBADO') {
        const premio = ref.campaniaId ? await campanias.premio(ref, client) : null;
        if (!ref.campaniaId || premio) {
          const importes = premio ? new Map([[ref.socioId, premio.puntosSocio], [destinatario, premio.puntosReferido]]) : new Map();
          await acreditacion.registrar('REFERIDO', ref.id, [ref.socioId, destinatario], fechaDecision, client, importes);
        }
        await gamificacion.registrar(ref.socioId, 'REFERIDO', ref.id, fechaDecision, client);
      }
      await log(req, user, 'Dictamen de referido', `Referido #${ref.id}: ${estado}`, client, {
        objetivoId: ref.id,
        datos: { anterior: ref.estado, nuevo: estado },
      });
      await notify(
        ref.socioId,
        'Tu referido tiene novedades',
        decision.nombreDePila + (estado === 'APROBADO' ? ': aprobado.' : ': rechazado.'),
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
      'SELECT u.* FROM "Usuario" u WHERE u.rol=$1 AND u.activo=$2 AND NOT EXISTS (SELECT 1 FROM "Referido" r WHERE r."usuarioId"=u.id OR (COALESCE(r."correoIndice",r.correo)=COALESCE(u."correoIndice",u.correo) AND r."eliminadoEn" IS NULL)) ORDER BY u.id DESC',
      ['SOCIO', true],
    );
    const socios = await db.query(
      'SELECT id,nombre,correo FROM "Usuario" WHERE rol=$1 AND activo=$2 AND "cuentaEstado" IN ($3,$4) ORDER BY nombre',
      ['SOCIO', true, 'APROBADA', 'APROBADO'],
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
    if (![usuarioId, socioId].every((id) => Number.isSafeInteger(id) && id > 0) || usuarioId === socioId)
      fail('Elige un usuario y un socio referidor distintos.', 400, {
        socioId: 'El socio referidor debe ser otra persona.',
      });
    const row = await db.transaction(async (client) => {
      const [target] = await db.query(
        'SELECT * FROM "Usuario" WHERE id=$1 AND rol=$2 AND activo=$3' + (db.sqlite ? '' : ' FOR UPDATE'),
        [usuarioId, 'SOCIO', true], client,
      );
      const [socio] = await db.query(
        'SELECT * FROM "Usuario" WHERE id=$1 AND rol=$2 AND activo=$3',
        [socioId, 'SOCIO', true],
        client,
      );
      if (!target || !socio) fail('No se encontró el usuario o el socio.', 404);
      if (!CuentaCooperativa.estaAprobada(socio.cuentaEstado))
        fail('El socio referidor debe tener una cuenta aprobada.', 409, { socioId: 'Selecciona un socio con cuenta verificada.' });
      if (toDate(target.creadoEn) < limiteAsociacion())
        fail('Solo se puede asociar dentro de los 30 días siguientes al registro.', 409);
      const [existente] = await db.query(
        'SELECT id FROM "Referido" WHERE "usuarioId"=$1 OR (COALESCE("correoIndice",correo)=$2 AND "eliminadoEn" IS NULL)',
        [target.id, claveCorreo(target.correo)], client,
      );
      if (existente) fail('Este usuario ya tiene un referido asociado.', 409);
      const [ref] = await db.query(
        'INSERT INTO "Referido" (nombre,correo,celular,"socioId","creadoEn",notas,"usuarioId","correoIndice") VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
        [
          target.nombre,
          cifrar('correo', target.correo),
          cifrar('celular', target.celular || ''),
          socio.id,
          now(),
          'Asociación manual por administración',
          target.id,
          correoIndice(target.correo),
        ],
        client,
      );
      await campanias.vincular(ref.id, socio.id, client);
      await log(req, user, 'Asociación manual', `${target.nombre} → ${socio.nombre}`, client, {
        objetivoId: ref.id,
        datos: { usuarioId: target.id, socioId: socio.id },
      });
      await notify(socio.id, 'Nuevo referido asociado', new Referido(ref).nombreDePila + ' se asoció a tus referidos.', client);
      return ref;
    });
    res.status(201).json(row);
  });

  /* ---------- Usuarios y roles (RF-08) ---------- */
  route('get', '/usuarios', async (req, res) => {
    await admin(req, 'usuarios');
    const buscar = text(req.query.buscar, 100, 'buscar').toLowerCase();
    const values = buscar ? ['%' + buscar + '%', claveCorreo(buscar)] : [];
    const where = buscar ? 'WHERE LOWER(nombre) LIKE $1 OR COALESCE("correoIndice",correo)=$2' : '';
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
  route('get', '/usuarios/cuentas-pendientes', async (req, res) => {
    await admin(req, 'usuarios');
    const actual = pagina(req.query.pagina);
    const where = 'WHERE activo=$1 AND "cuentaEstado"=$2 AND cuenta IS NOT NULL';
    const args = [true, 'PENDIENTE'];
    const [{ total }] = await db.query('SELECT COUNT(*) AS total FROM "Usuario" ' + where, args);
    const filas = await db.query(
      'SELECT id,nombre,cuenta,"tipoCuenta","creadoEn","cuentaSolicitadaEn" FROM "Usuario" ' + where +
      ' ORDER BY COALESCE("cuentaSolicitadaEn",CAST("creadoEn" AS TEXT)),id LIMIT 20 OFFSET ' + (actual - 1) * 20, args,
    );
    res.json({
      total: Number(total), pagina: actual, porPagina: 20,
      items: filas.map((fila) => ({
        id: fila.id, nombre: fila.nombre, tipo: fila.tipoCuenta,
        numero: new CuentaCooperativa(fila.cuenta, fila.tipoCuenta).numeroEnmascarado(),
        fecha: fila.cuentaSolicitadaEn ?? fila.creadoEn, diasHabiles: diasHabiles(fila.cuentaSolicitadaEn ?? fila.creadoEn),
      })),
    });
  });
  route('patch', '/usuarios/:id/cuenta', async (req, res) => {
    const adminUser = await admin(req, 'usuarios');
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) fail('No se encontró la cuenta vinculada.', 404);
    const { estado } = req.body;
    if (!['APROBADO', 'RECHAZADO'].includes(estado)) fail('Elige Aprobado o Rechazado.', 400, {
      estado: 'Selecciona un resultado de la revisión.',
    });
    await db.transaction(async (client) => {
      const [fila] = await db.query(
        'SELECT id,cuenta,"tipoCuenta","cuentaEstado",activo,rol,"codigoReferido" FROM "Usuario" WHERE id=$1' + (db.sqlite ? '' : ' FOR UPDATE'), [id], client,
      );
      if (!fila?.cuenta || !fila.activo) fail('No se encontró la cuenta vinculada.', 404);
      const cuenta = new CuentaCooperativa(fila.cuenta, fila.tipoCuenta, fila.cuentaEstado);
      if (estado === 'APROBADO') {
        const claveCuenta = cuentaIndice(cuenta.numeroCuenta) ?? cuenta.numeroCuenta;
        if (!db.sqlite) await db.query('SELECT pg_advisory_xact_lock(15274002, hashtext($1))', [claveCuenta], client);
        const [otra] = await db.query(
          'SELECT id FROM "Usuario" WHERE COALESCE("cuentaIndice",cuenta)=$1 AND id<>$2 AND "cuentaEstado" IN ($3,$4)',
          [claveCuenta, id, 'APROBADA', 'APROBADO'], client,
        );
        if (otra) fail('Este número ya está aprobado en otra cuenta.', 409);
        cuenta.aprobar(now());
        if (fila.rol === 'SOCIO') await generarCodigo(fila, client);
      }
      else cuenta.rechazar(text(req.body.motivo, 300, 'motivo'), now());
      await db.query('UPDATE "Usuario" SET "cuentaEstado"=$2,"cuentaRevisadaEn"=$3 WHERE id=$1', [id, cuenta.estado, cuenta.fechaRevision], client);
      await log(req, adminUser, 'Revisión de cuenta vinculada', 'Dictamen de vinculación', client, {
        objetivoId: id, datos: { anterior: fila.cuentaEstado, nuevo: cuenta.estado, motivo: cuenta.motivo },
      });
      await notify(id, 'Revisión de tu cuenta vinculada', estado === 'APROBADO'
        ? 'Tu cuenta vinculada fue aprobada.'
        : 'Tu cuenta vinculada fue rechazada. Motivo: ' + cuenta.motivo, client);
    });
    res.json({ ok: true });
  });
  route('post', '/usuarios', async (req, res) => {
    const user = await admin(req, 'usuarios');
    const nombre = text(req.body.nombre, 100, 'nombre'),
      correo = email(req.body.correo),
      rol = req.body.rol;
    if (nombre.length < 5 || nombre.split(/\s+/).length < 2)
      fail('Ingresa nombres y apellidos.', 400, {
        nombre: 'Escribe al menos un nombre y un apellido.',
      });
    const nuevoRol = new Rol(rol);
    const { created, url } = await db.transaction(async (client) => {
      const [nuevo] = await db.query(
        'INSERT INTO "Usuario" (nombre,correo,rol,"correoIndice") VALUES ($1,$2,$3,$4) RETURNING *',
        [nombre, cifrar('correo', correo), nuevoRol.nombre, correoIndice(correo)],
        client,
      );
      await log(req, user, 'Cuenta creada', `${nombre}: ${rol}`, client, {
        objetivoId: nuevo.id,
        datos: { rolNuevo: rol },
      });
      return { created: nuevo, url: await createResetLink(nuevo.id, ACTIVACION_MS, client) };
    });
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
    if (!Number.isSafeInteger(id) || id < 1) fail('Usuario no encontrado.', 404);
    if (!ROLES.includes(rol) || typeof activo !== 'boolean') fail('Rol o estado no válido.');
    if (id === user.id && (rol !== 'ADMIN' || !activo))
      fail('No puedes quitar tu propio acceso de administrador.');
    await db.transaction(async (client) => {
      const [target] = await db.query('SELECT * FROM "Usuario" WHERE id=$1' + (db.sqlite ? '' : ' FOR UPDATE'), [id], client);
      if (!target) fail('Usuario no encontrado.', 404);
      const rolAnterior = target.rol;
      new Rol(rol).asignarA(target);
      await db.query('UPDATE "Usuario" SET rol=$2,activo=$3 WHERE id=$1', [id, target.rol, activo], client);
      await db.query('DELETE FROM "DosFactor" WHERE "usuarioId"=$1', [id], client);
      await db.query('DELETE FROM "Sesion" WHERE "usuarioId"=$1', [id], client);
      // RF-08-5: ID del autor (usuarioId), ID del usuario (objetivoId) y nuevo rol.
      await log(
        req,
        user,
        rolAnterior !== rol ? 'Rol actualizado' : 'Usuario actualizado',
        `${target.nombre}: ${rol}, ${activo ? 'activo' : 'inactivo'}`,
        client,
        { objetivoId: id, datos: { rolAnterior, rolNuevo: rol, activo } },
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
        (await db.query('SELECT * FROM "Configuracion" WHERE clave NOT IN ($1,$2)', ['verificadorCifrado', 'demoInicializado'])).map((x) => [x.clave, x.valor]),
      ),
    );
  });
  route('put', '/configuracion', async (req, res) => {
    const user = await admin(req, 'configuracion');
    const values = {
      contacto: email(req.body.contacto, 'contacto'),
      registroAbierto: typeof req.body.registroAbierto === 'boolean'
        ? String(req.body.registroAbierto)
        : req.body.registroAbierto,
      mensajeBienvenida: text(req.body.mensajeBienvenida, TEXTO_MAX_CONFIG, 'mensajeBienvenida'),
      puntosReferido: new ParametroGlobal('puntosReferido').actualizar(req.body.puntosReferido),
    };
    for (const clave of [...Object.keys(PUNTOS_POR_ACCION), 'valorPunto']) {
      if (Object.hasOwn(req.body, clave))
        values[clave] = new ParametroGlobal(clave).actualizar(req.body[clave]);
    }
    if (!['true', 'false'].includes(values.registroAbierto)) fail('Elige si el registro está abierto.');
    if (!values.mensajeBienvenida || values.mensajeBienvenida.length > TEXTO_MAX_CONFIG)
      fail(`El mensaje de bienvenida debe tener entre 1 y ${TEXTO_MAX_CONFIG} caracteres.`, 400, {
        mensajeBienvenida: `Escribe un saludo de máximo ${TEXTO_MAX_CONFIG} caracteres.`,
      });
    await db.transaction(async (client) => {
      const anteriores = Object.fromEntries(
        (await db.query('SELECT * FROM "Configuracion" ORDER BY clave' + (db.sqlite ? '' : ' FOR UPDATE'), [], client)).map((x) => [x.clave, x.valor]),
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
    if (desde && hasta && desde > hasta) fail('La fecha inicial debe ser anterior o igual a la final.', 400, { hasta: 'Selecciona una fecha igual o posterior al inicio.' });
    if (desde) add('fecha>=?', inicioDelDia(desde));
    if (hasta) add('fecha<=?', finDelDia(hasta));
    if (req.query.usuarioId) {
      const id = Number(req.query.usuarioId);
      if (!Number.isSafeInteger(id) || id < 1) fail('Elige un usuario válido.', 400, { usuarioId: 'Selecciona un usuario de la lista.' });
      add('"usuarioId"=?', id);
    }
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
    const user = await current(req, 'notificaciones', false);
    res.json(
      await db.query(
        'SELECT * FROM "Notificacion" WHERE "usuarioId"=$1 ORDER BY id DESC LIMIT 100',
        [user.id],
      ),
    );
  });
  route('get', '/notificaciones/bandeja', async (req, res) => {
    const user = await current(req, 'notificaciones', false);
    const actual = pagina(req.query.pagina);
    const [conteos] = await db.query(
      'SELECT COUNT(*) AS total, SUM(CASE WHEN leida=$2 THEN 1 ELSE 0 END) AS "sinLeer" FROM "Notificacion" WHERE "usuarioId"=$1', [user.id, false],
    );
    const items = await db.query(
      'SELECT id,titulo,mensaje,leida,fecha FROM "Notificacion" WHERE "usuarioId"=$1 ORDER BY id DESC LIMIT 20 OFFSET ' + (actual - 1) * 20, [user.id],
    );
    const { cuentaEstado, cuentaVerificada } = publicUser(user);
    res.json({ items, pagina: actual, porPagina: 20, total: Number(conteos.total), sinLeer: Number(conteos.sinLeer), cuentaEstado, cuentaVerificada });
  });
  route('patch', '/notificaciones/:id/leer', async (req, res) => {
    const user = await current(req, 'notificaciones');
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) fail('No se encontró la notificación.', 404);
    const n = new Notificacion(user.id);
    n.marcarLeida();
    const [actualizada] = await db.query('UPDATE "Notificacion" SET leida=$3 WHERE id=$1 AND "usuarioId"=$2 RETURNING id', [id, n.usuarioId, n.leida]);
    if (!actualizada) fail('No se encontró la notificación.', 404);
    res.json({ ok: true });
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
  return { router, db, recordatorios };
}
