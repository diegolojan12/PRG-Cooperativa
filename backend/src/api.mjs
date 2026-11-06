import express from 'express';
import { createHash, randomBytes } from 'node:crypto';
import nodemailer from 'nodemailer';
import {
  Database,
  hashPassword,
  verifyPassword,
  MODULES,
  SOCIO_MODULES,
} from './database.mjs';

const digest = (value) => createHash('sha256').update(value).digest('hex');
const now = () => new Date().toISOString();
const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};
const text = (value, max = 200) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';
const email = (value) => {
  const result = text(value, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result))
    fail('Ingresa un correo electrónico válido.');
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
    fail(
      'La contraseña debe tener entre 8 y 128 caracteres, una mayúscula y un número.',
    );
  return value;
};
const person = (body) => {
  const nombre = text(body.nombre, 100),
    correo = email(body.correo),
    celular = text(body.celular, 10);
  if (nombre.length < 5 || nombre.split(/\s+/).length < 2)
    fail('Ingresa nombres y apellidos.');
  if (!/^09\d{8}$/.test(celular))
    fail('Ingresa un celular de 10 dígitos que empiece por 09.');
  return { nombre, correo, celular };
};
const publicUser = (user) => ({
  id: user.id,
  nombre: user.nombre,
  correo: user.correo,
  rol: user.rol,
  activo: !!user.activo,
  celular: user.celular,
});
const STATES = ['PENDIENTE', 'CONTACTADO', 'VALIDADO', 'RECHAZADO'];

export async function createApi(database) {
  const db = database || new Database();
  await db.init();
  const router = express.Router();
  router.use(express.json({ limit: '32kb' }));
  router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      const allowed = new URL(
        process.env.FRONTEND_URL || 'http://localhost:4200',
      ).origin;
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
  const log = (user, accion, detalle, client) =>
    db.query(
      'INSERT INTO "Actividad" ("usuarioId",actor,accion,detalle,fecha) VALUES ($1,$2,$3,$4,$5)',
      [user?.id || null, user?.nombre || 'Sistema', accion, detalle, now()],
      client,
    );
  const notify = (id, titulo, mensaje, client) =>
    db.query(
      'INSERT INTO "Notificacion" ("usuarioId",titulo,mensaje,fecha) VALUES ($1,$2,$3,$4)',
      [id, titulo, mensaje, now()],
      client,
    );
  async function current(req, module) {
    const raw = (req.headers.cookie || '')
      .split(';')
      .map((x) => x.trim())
      .find((x) => x.startsWith('suma_session='))
      ?.slice(13);
    if (!raw) fail('Inicia sesión para continuar.', 401);
    const [user] = await db.query(
      'SELECT u.* FROM "Sesion" s JOIN "Usuario" u ON u.id=s."usuarioId" WHERE s.token=$1 AND s.expira>$2',
      [digest(raw), now()],
    );
    if (!user || !user.activo)
      fail('Tu sesión terminó. Vuelve a ingresar.', 401);
    const [role] = await db.query(
      'SELECT modulos FROM "RolPermiso" WHERE rol=$1',
      [user.rol],
    );
    user.modulos = JSON.parse(role?.modulos || '[]');
    if (module && !user.modulos.includes(module))
      fail('No tienes permiso para acceder a este módulo.', 403);
    return user;
  }
  async function admin(req, module) {
    const user = await current(req, module);
    if (user.rol !== 'ADMIN')
      fail('Esta acción requiere una cuenta de administrador.', 403);
    return user;
  }
  const buckets = new Map();
  function rate(req, key, limit = 8) {
    const id = `${req.ip}:${key}`,
      stamp = Date.now();
    let bucket = buckets.get(id);
    if (!bucket || stamp - bucket.start > 15 * 60 * 1000) {
      bucket = { start: stamp, count: 0 };
      buckets.set(id, bucket);
    }
    if (++bucket.count > limit)
      fail('Demasiados intentos. Vuelve a intentarlo en 15 minutos.', 429);
    if (buckets.size > 5000)
      for (const [id, b] of buckets)
        if (stamp - b.start > 15 * 60 * 1000) buckets.delete(id);
  }
  route('get', '/health', async (_, res) => {
    await db.query('SELECT 1 AS ok');
    res.json({
      status: 'ok',
      app: 'SUMA',
      database: db.sqlite ? 'SQLite' : 'PostgreSQL',
    });
  });
  route('post', '/auth/login', async (req, res) => {
    rate(req, 'login');
    const correo = email(req.body.correo),
      clave = req.body.clave;
    if (typeof clave !== 'string' || clave.length > 128)
      fail('Correo o contraseña incorrectos.', 401);
    const [user] = await db.query('SELECT * FROM "Usuario" WHERE correo=$1', [
      correo,
    ]);
    if (!user || !user.activo || !verifyPassword(clave, user.passwordHash))
      fail('Correo o contraseña incorrectos.', 401);
    const token = randomBytes(32).toString('hex');
    await db.query('DELETE FROM "Sesion" WHERE expira<$1', [now()]);
    await db.query(
      'INSERT INTO "Sesion" (token,"usuarioId",expira) VALUES ($1,$2,$3)',
      [
        digest(token),
        user.id,
        new Date(Date.now() + 8 * 3600000).toISOString(),
      ],
    );
    await log(user, 'Inicio de sesión', 'Acceso a la plataforma');
    res.cookie('suma_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 8 * 3600000,
      path: '/',
    });
    res.json(publicUser(user));
  });
  route('post', '/auth/logout', async (req, res) => {
    const user = await current(req);
    const token = (req.headers.cookie || '')
      .split(';')
      .map((x) => x.trim())
      .find((x) => x.startsWith('suma_session='))
      ?.slice(13);
    await db.query('DELETE FROM "Sesion" WHERE token=$1', [digest(token)]);
    await log(user, 'Cierre de sesión', 'Sesión cerrada por el usuario');
    res.clearCookie('suma_session', { path: '/' }).json({ ok: true });
  });
  route('get', '/auth/me', async (req, res) => {
    const user = await current(req);
    res.json({ ...publicUser(user), modulos: user.modulos });
  });
  route('post', '/auth/register', async (req, res) => {
    rate(req, 'register', 12);
    const [setting] = await db.query(
      'SELECT valor FROM "Configuracion" WHERE clave=$1',
      ['registroAbierto'],
    );
    if (setting?.valor !== 'true')
      fail('El registro está cerrado. Contacta a la cooperativa.', 403);
    const p = person(req.body),
      clave = password(req.body.clave);
    const cedula = text(req.body.cedula, 10) || null,
      cuenta = text(req.body.cuenta, 12) || null;
    if (cedula && !/^\d{10}$/.test(cedula))
      fail('La cédula debe tener 10 dígitos.');
    if (
      cuenta &&
      (!/^\d{8,12}$/.test(cuenta) ||
        !cedula ||
        !['ahorros', 'corriente'].includes(req.body.tipoCuenta))
    )
      fail('Revisa los datos de la cuenta.');
    await db.transaction(async (client) => {
      const [user] = await db.query(
        'INSERT INTO "Usuario" (nombre,correo,celular,"passwordHash",cedula,cuenta,"tipoCuenta") VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
        [
          p.nombre,
          p.correo,
          p.celular,
          hashPassword(clave),
          cedula,
          cuenta,
          cuenta ? req.body.tipoCuenta : null,
        ],
        client,
      );
      await log(user, 'Registro', 'Nuevo socio registrado', client);
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
  route('post', '/auth/forgot', async (req, res) => {
    rate(req, 'forgot', 5);
    const correo = email(req.body.correo);
    const [user] = await db.query('SELECT * FROM "Usuario" WHERE correo=$1', [
      correo,
    ]);
    const result = {
      message:
        'Si el correo está registrado, recibirás instrucciones para recuperar tu contraseña.',
    };
    if (user?.activo) {
      const token = randomBytes(32).toString('hex');
      await db.query('DELETE FROM "Recuperacion" WHERE "usuarioId"=$1', [
        user.id,
      ]);
      await db.query(
        'INSERT INTO "Recuperacion" (token,"usuarioId",expira) VALUES ($1,$2,$3)',
        [
          digest(token),
          user.id,
          new Date(Date.now() + 30 * 60000).toISOString(),
        ],
      );
      const url = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/internas/recuperar.html?token=${token}`;
      if (process.env.SMTP_HOST) {
        try {
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 1025),
            secure: process.env.SMTP_SECURE === 'true',
            auth: process.env.SMTP_USER
              ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
              : undefined,
          });
          await transporter.sendMail({
            from: process.env.SMTP_FROM || 'SUMA <no-reply@suma.ec>',
            to: correo,
            subject: 'Recupera tu acceso a SUMA',
            text: `Crea una nueva contraseña: ${url}\nEl enlace vence en 30 minutos. Si no lo solicitaste, ignora este mensaje.`,
          });
        } catch {
          console.error(
            'No se pudo entregar el correo de recuperación. Revisa SMTP.',
          );
        }
      }
      if (
        process.env.NODE_ENV !== 'production' &&
        process.env.ENABLE_DEV_RESET_LINK === 'true'
      )
        result.devResetUrl = url;
      await log(
        user,
        'Recuperación solicitada',
        'Se generó un enlace temporal',
      );
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
        'UPDATE "Usuario" SET "passwordHash"=$2 WHERE id=$1',
        [reset.usuarioId, hashPassword(clave)],
        client,
      );
      await db.query(
        'DELETE FROM "Sesion" WHERE "usuarioId"=$1',
        [reset.usuarioId],
        client,
      );
      const [user] = await db.query(
        'SELECT * FROM "Usuario" WHERE id=$1',
        [reset.usuarioId],
        client,
      );
      await log(
        user,
        'Contraseña actualizada',
        'Se cerraron todas las sesiones anteriores',
        client,
      );
    });
    res.json({ message: 'Contraseña actualizada. Ya puedes iniciar sesión.' });
  });
  route('get', '/overview', async (req, res) => {
    const user = await current(req, 'panel');
    const referrals = await db.query(
      `SELECT estado,"creadoEn" FROM "Referido" ${user.rol === 'ADMIN' ? '' : 'WHERE "socioId"=$1'}`,
      user.rol === 'ADMIN' ? [] : [user.id],
    );
    const [members] = await db.query(
      'SELECT COUNT(*) AS total FROM "Usuario" WHERE activo=$1 AND rol=$2',
      [true, 'SOCIO'],
    );
    const [points] = await db.query(
      'SELECT valor FROM "Configuracion" WHERE clave=$1',
      ['puntosReferido'],
    );
    const [welcome] = await db.query(
      'SELECT valor FROM "Configuracion" WHERE clave=$1',
      ['mensajeBienvenida'],
    );
    const states = Object.fromEntries(
      STATES.map((state) => [
        state,
        referrals.filter((x) => x.estado === state).length,
      ]),
    );
    res.json({
      socios: Number(members.total),
      referidos: referrals.length,
      mes: referrals.filter((x) =>
        String(x.creadoEn).startsWith(now().slice(0, 7)),
      ).length,
      estados: states,
      puntos: states.VALIDADO * Number(points.valor),
      bienvenida: welcome.valor,
      demo:
        process.env.SEED_DEMO === 'true' &&
        process.env.NODE_ENV !== 'production',
    });
  });
  route('get', '/referidos', async (req, res) => {
    const user = await current(req, 'referidos');
    const rows = await db.query(
      `SELECT r.*,u.nombre AS socio FROM "Referido" r JOIN "Usuario" u ON u.id=r."socioId" ${user.rol === 'ADMIN' ? '' : 'WHERE r."socioId"=$1'} ORDER BY r.id DESC`,
      user.rol === 'ADMIN' ? [] : [user.id],
    );
    res.json(rows);
  });
  route('post', '/referidos', async (req, res) => {
    const user = await current(req, 'referidos'),
      p = person(req.body);
    if (req.body.consentimiento !== true)
      fail('Confirma que tienes autorización para compartir estos datos.');
    const row = await db.transaction(async (client) => {
      const [ref] = await db.query(
        'INSERT INTO "Referido" (nombre,correo,celular,"socioId","creadoEn",notas) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
        [
          p.nombre,
          p.correo,
          p.celular,
          user.id,
          now(),
          text(req.body.notas, 500),
        ],
        client,
      );
      await log(
        user,
        'Referido registrado',
        `Referido #${ref.id}: ${p.nombre}`,
        client,
      );
      await notify(
        user.id,
        'Referido registrado',
        `${p.nombre} se añadió a tus referidos.`,
        client,
      );
      return ref;
    });
    res.status(201).json(row);
  });
  route('patch', '/referidos/:id', async (req, res) => {
    const user = await current(req, 'referidos');
    await db.transaction(async (client) => {
      const [ref] = await db.query(
        'SELECT * FROM "Referido" WHERE id=$1',
        [Number(req.params.id)],
        client,
      );
      if (!ref || (user.rol !== 'ADMIN' && ref.socioId !== user.id))
        fail('No se encontró el referido.', 404);
      const p = person(req.body),
        estado = req.body.estado || ref.estado;
      if (!STATES.includes(estado)) fail('Estado no válido.');
      if (
        user.rol !== 'ADMIN' &&
        (estado !== ref.estado || ref.estado !== 'PENDIENTE')
      )
        fail(
          'Solo puedes editar tus referidos pendientes. El estado lo actualiza administración.',
          403,
        );
      await db.query(
        'UPDATE "Referido" SET nombre=$2,correo=$3,celular=$4,estado=$5,notas=$6 WHERE id=$1',
        [
          ref.id,
          p.nombre,
          p.correo,
          p.celular,
          estado,
          text(req.body.notas, 500),
        ],
        client,
      );
      await log(
        user,
        'Referido actualizado',
        `Referido #${ref.id}: ${estado}`,
        client,
      );
      if (estado !== ref.estado)
        await notify(
          ref.socioId,
          'Tu referido tiene novedades',
          `${p.nombre}: ${estado.toLowerCase()}.`,
          client,
        );
    });
    res.json({ ok: true });
  });
  route('delete', '/referidos/:id', async (req, res) => {
    const user = await current(req, 'referidos');
    await db.transaction(async (client) => {
      const [ref] = await db.query(
        'SELECT * FROM "Referido" WHERE id=$1',
        [Number(req.params.id)],
        client,
      );
      if (!ref || (user.rol !== 'ADMIN' && ref.socioId !== user.id))
        fail('No se encontró el referido.', 404);
      if (user.rol !== 'ADMIN' && ref.estado !== 'PENDIENTE')
        fail('Solo puedes eliminar referidos pendientes.', 403);
      await db.query('DELETE FROM "Referido" WHERE id=$1', [ref.id], client);
      await log(
        user,
        'Referido eliminado',
        `Referido #${ref.id}: ${ref.nombre}`,
        client,
      );
    });
    res.json({ ok: true });
  });
  route('get', '/usuarios', async (req, res) => {
    await admin(req, 'usuarios');
    res.json(
      (await db.query('SELECT * FROM "Usuario" ORDER BY id')).map(publicUser),
    );
  });
  route('patch', '/usuarios/:id', async (req, res) => {
    const user = await admin(req, 'usuarios'),
      id = Number(req.params.id),
      { rol, activo } = req.body;
    if (!['ADMIN', 'SOCIO'].includes(rol) || typeof activo !== 'boolean')
      fail('Rol o estado no válido.');
    if (id === user.id && (rol !== 'ADMIN' || !activo))
      fail('No puedes quitar tu propio acceso de administrador.');
    await db.transaction(async (client) => {
      const [target] = await db.query(
        'SELECT * FROM "Usuario" WHERE id=$1',
        [id],
        client,
      );
      if (!target) fail('Usuario no encontrado.', 404);
      await db.query(
        'UPDATE "Usuario" SET rol=$2,activo=$3 WHERE id=$1',
        [id, rol, activo],
        client,
      );
      await db.query('DELETE FROM "Sesion" WHERE "usuarioId"=$1', [id], client);
      await log(
        user,
        'Usuario actualizado',
        `${target.nombre}: ${rol}, ${activo ? 'activo' : 'inactivo'}`,
        client,
      );
    });
    res.json({ ok: true });
  });
  route('get', '/roles', async (req, res) => {
    await admin(req, 'roles');
    res.json(
      (await db.query('SELECT * FROM "RolPermiso" ORDER BY rol')).map((x) => ({
        rol: x.rol,
        modulos: JSON.parse(x.modulos),
      })),
    );
  });
  route('put', '/roles/:rol', async (req, res) => {
    const user = await admin(req, 'roles'),
      rol = req.params.rol,
      modulos = req.body.modulos;
    if (
      !['ADMIN', 'SOCIO'].includes(rol) ||
      !Array.isArray(modulos) ||
      modulos.some((x) => !MODULES.includes(x))
    )
      fail('Permisos no válidos.');
    if (rol === 'SOCIO' && modulos.some((x) => !SOCIO_MODULES.includes(x)))
      fail(
        'Los módulos administrativos solo están disponibles para administradores.',
      );
    if (!['panel', 'ayuda'].every((x) => modulos.includes(x)))
      fail('Panel y ayuda deben permanecer disponibles.');
    if (
      rol === 'ADMIN' &&
      !['usuarios', 'roles'].every((x) => modulos.includes(x))
    )
      fail(
        'Conserva el acceso a usuarios y roles para administrar la plataforma.',
      );
    await db.transaction(async (client) => {
      await db.query(
        'UPDATE "RolPermiso" SET modulos=$2 WHERE rol=$1',
        [rol, JSON.stringify([...new Set(modulos)])],
        client,
      );
      await log(
        user,
        'Permisos actualizados',
        `Rol ${rol}: ${modulos.join(', ')}`,
        client,
      );
    });
    res.json({ ok: true });
  });
  route('get', '/configuracion', async (req, res) => {
    await admin(req, 'configuracion');
    res.json(
      Object.fromEntries(
        (await db.query('SELECT * FROM "Configuracion"')).map((x) => [
          x.clave,
          x.valor,
        ]),
      ),
    );
  });
  route('put', '/configuracion', async (req, res) => {
    const user = await admin(req, 'configuracion');
    const values = {
      contacto: email(req.body.contacto),
      puntosReferido: String(req.body.puntosReferido),
      registroAbierto: String(req.body.registroAbierto),
      mensajeBienvenida: text(req.body.mensajeBienvenida, 240),
    };
    if (
      !/^\d{1,5}$/.test(values.puntosReferido) ||
      !['true', 'false'].includes(values.registroAbierto) ||
      !values.mensajeBienvenida
    )
      fail('Revisa los valores de configuración.');
    await db.transaction(async (client) => {
      for (const [key, value] of Object.entries(values))
        await db.query(
          'UPDATE "Configuracion" SET valor=$2 WHERE clave=$1',
          [key, value],
          client,
        );
      await log(
        user,
        'Configuración actualizada',
        'Se guardaron los ajustes de la plataforma',
        client,
      );
    });
    res.json({ ok: true });
  });
  route('get', '/actividad', async (req, res) => {
    await admin(req, 'actividad');
    res.json(
      await db.query('SELECT * FROM "Actividad" ORDER BY id DESC LIMIT 250'),
    );
  });
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
    await db.query('UPDATE "Notificacion" SET leida=$2 WHERE "usuarioId"=$1', [
      user.id,
      true,
    ]);
    res.json({ ok: true });
  });
  route('get', '/ayuda', async (req, res) => {
    await current(req, 'ayuda');
    const [row] = await db.query(
      'SELECT valor FROM "Configuracion" WHERE clave=$1',
      ['contacto'],
    );
    res.json({ contacto: row.valor });
  });
  router.use((_req, res) =>
    res.status(404).json({ message: 'Ruta no encontrada.' }),
  );
  router.use((error, _req, res, _next) => {
    const duplicate =
      error.code === '23505' ||
      String(error.message).includes('UNIQUE constraint failed');
    const status = duplicate ? 409 : error.status || 500;
    if (status >= 500) console.error('Error API:', error.message);
    res
      .status(status)
      .json({
        message: duplicate
          ? 'El correo o la cédula ya están registrados.'
          : status >= 500
            ? 'No se pudo completar la operación. Inténtalo de nuevo.'
            : error.message,
      });
  });
  return { router, db };
}
