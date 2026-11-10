import { randomUUID } from 'node:crypto';
import { CuentaCooperativa, errorDeDominio as error } from './acceso.mjs';
import {
  entero,
  participante,
  requerido,
  serializarUsuario,
} from './actividades.mjs';
import { imagenValida, responderImagen } from './imagenes.mjs';

export class Premio {
  constructor(body, text) {
    const nombre = requerido(body.nombre, 100, 'nombre', text);
    const descripcion = requerido(body.descripcion, 500, 'descripcion', text);
    const costo = entero(
      body.costo,
      1,
      2147483647,
      'El costo debe ser un entero mayor que cero.',
    );
    const stock = entero(
      body.stock,
      1,
      2147483647,
      'El stock debe ser un entero mayor que cero.',
    );
    Object.assign(this, {
      nombre,
      nombreClave: nombre.normalize('NFKC').toLowerCase(),
      descripcion,
      costo,
      stock,
    });
  }

  static disponible(premio) {
    return Boolean(premio?.activo && premio.foto && premio.stock > 0);
  }
}

export class Canje {
  static siguiente(estado) {
    return { PENDIENTE: 'LISTO', LISTO: 'ENTREGADO' }[estado];
  }
  static etiqueta(estado) {
    return {
      PENDIENTE: 'Pendiente',
      LISTO: 'Listo para retiro',
      ENTREGADO: 'Entregado',
    }[estado];
  }
}

export function rutasRecompensas({
  db,
  route,
  current,
  admin,
  text,
  now,
  pagina,
  log,
  notify,
  gamificacion,
  cargaBinaria,
  fecha,
  inicioDelDia,
  finDelDia,
}) {
  const lock = db.sqlite ? '' : ' FOR UPDATE';

  route('get', '/premios', async (req, res) => {
    const u = await current(req, 'panel');
    const where =
      u.rol === 'ADMIN'
        ? ''
        : ' WHERE activo=1 AND stock>0 AND foto IS NOT NULL';
    const items = await db.query(
      'SELECT id,nombre,descripcion,costo,stock,activo,CASE WHEN foto IS NULL THEN 0 ELSE 1 END AS foto FROM "Premio"' +
        where +
        ' ORDER BY nombre,id',
    );
    res.json({
      items,
      saldo: (await gamificacion.saldo(u.id)).saldo,
      cuentaVerificada: CuentaCooperativa.estaAprobada(u.cuentaEstado),
    });
  });
  const guardar = (crear) => async (req, res) => {
    const u = await admin(req, 'panel');
    const premio = new Premio(req.body, text);
    const id = crear ? randomUUID() : req.params.id;
    await db.transaction(async (client) => {
      if (!db.sqlite)
        await db.query(
          'SELECT pg_advisory_xact_lock(15274011,hashtext($1))',
          [premio.nombreClave],
          client,
        );
      const [otro] = await db.query(
        'SELECT id FROM "Premio" WHERE "nombreClave"=$1 AND id<>$2',
        [premio.nombreClave, id],
        client,
      );
      if (otro) throw error('Ya existe un premio con ese nombre.', 409);
      const [p] = await db.query(
        crear
          ? 'INSERT INTO "Premio" (id,nombre,"nombreClave",descripcion,costo,stock) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id'
          : 'UPDATE "Premio" SET nombre=$2,"nombreClave"=$3,descripcion=$4,costo=$5,stock=$6 WHERE id=$1 RETURNING id',
        [
          id,
          premio.nombre,
          premio.nombreClave,
          premio.descripcion,
          premio.costo,
          premio.stock,
        ],
        client,
      );
      if (!p) throw error('El premio no existe.', 404);
      await log(
        req,
        u,
        crear ? 'Premio creado' : 'Premio actualizado',
        premio.nombre,
        client,
        { datos: { premioId: id } },
      );
    });
    res.status(crear ? 201 : 200).json({ id });
  };
  route('post', '/premios', guardar(true));
  route('put', '/premios/:id', guardar(false));
  route(
    'post',
    '/premios/:id/foto',
    async (req, res) => {
      const u = await admin(req, 'panel');
      const f = imagenValida(req.body);
      await db.transaction(async (client) => {
        const [p] = await db.query(
          'UPDATE "Premio" SET foto=$2,"fotoMime"=$3 WHERE id=$1 RETURNING nombre',
          [req.params.id, f.contenido, f.mime],
          client,
        );
        if (!p) throw error('El premio no existe.', 404);
        await log(req, u, 'Foto de premio actualizada', p.nombre, client, {
          datos: { premioId: req.params.id },
        });
      });
      res.json({ ok: true });
    },
    ...cargaBinaria('2mb', admin),
  );
  route('get', '/premios/:id/foto', async (req, res) => {
    const u = await current(req, 'panel');
    const [p] = await db.query(
      'SELECT foto,"fotoMime",activo,stock FROM "Premio" WHERE id=$1',
      [req.params.id],
    );
    if (!p?.foto || (u.rol !== 'ADMIN' && !Premio.disponible(p)))
      throw error('Foto no disponible.', 404);
    responderImagen(res, p.foto, p.fotoMime);
  });
  route('patch', '/premios/:id/inactivar', async (req, res) => {
    const u = await admin(req, 'panel');
    await db.transaction(async (client) => {
      const [p] = await db.query(
        'UPDATE "Premio" SET activo=0 WHERE id=$1 AND activo=1 RETURNING nombre',
        [req.params.id],
        client,
      );
      if (!p)
        throw error('No existe un premio activo con ese identificador.', 404);
      await log(req, u, 'Premio inactivado', p.nombre, client, {
        datos: { premioId: req.params.id },
      });
    });
    res.json({ ok: true });
  });

  route('post', '/canjes', async (req, res) => {
    const usuario = await participante(req, current);
    const { premioId, solicitud } = req.body;
    if (
      typeof premioId !== 'string' ||
      typeof solicitud !== 'string' ||
      !/^[a-f0-9-]{36}$/i.test(solicitud)
    )
      throw error('Selecciona un premio y confirma el canje.');
    const canje = await db.transaction(async (client) => {
      await serializarUsuario(db, usuario.id, client);
      const [previo] = await db.query(
        'SELECT id,"premioId",premio,costo,fecha,estado FROM "Canje" WHERE "usuarioId"=$1 AND solicitud=$2',
        [usuario.id, solicitud],
        client,
      );
      if (previo) {
        if (previo.premioId !== premioId)
          throw error('La solicitud corresponde a otro premio.', 409);
        return previo;
      }
      const [u] = await db.query(
        'SELECT "cuentaEstado",activo FROM "Usuario" WHERE id=$1' +
          (db.sqlite ? '' : ' FOR SHARE'),
        [usuario.id],
        client,
      );
      if (!u?.activo || !CuentaCooperativa.estaAprobada(u.cuentaEstado))
        throw error('Verifica tu cuenta antes de canjear premios.', 403);
      const [p] = await db.query(
        'SELECT id,nombre,costo,stock,activo,CASE WHEN foto IS NULL THEN 0 ELSE 1 END AS foto FROM "Premio" WHERE id=$1' +
          lock,
        [premioId],
        client,
      );
      if (!Premio.disponible(p))
        throw error('El premio ya no está disponible.', 409);
      if ((await gamificacion.saldo(usuario.id, client)).saldo < p.costo)
        throw error('Tu saldo no cubre el costo del premio.', 409);
      const id = randomUUID(),
        fecha = now();
      await db.query(
        'UPDATE "Premio" SET stock=stock-1 WHERE id=$1',
        [p.id],
        client,
      );
      const [r] = await db.query(
        'INSERT INTO "Canje" (id,"usuarioId","premioId",solicitud,premio,costo,fecha) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id,premio,costo,fecha,estado',
        [id, usuario.id, p.id, solicitud, p.nombre, p.costo, fecha],
        client,
      );
      await db.query(
        `INSERT INTO "MovimientoPuntos" (clave,"usuarioId",actividad,cantidad,fecha,tipo)
         VALUES ($1,$2,'CANJE',$3,$4,'DEBITO')`,
        ['canje:' + id, usuario.id, p.costo, fecha],
        client,
      );
      await notify(
        usuario.id,
        'Canje registrado',
        p.nombre + ' · Pendiente',
        client,
      );
      await log(req, usuario, 'Premio canjeado', p.nombre, client, {
        datos: { canjeId: id, costo: p.costo },
      });
      return r;
    });
    res.status(201).json(canje);
  });
  route('get', '/canjes', async (req, res) => {
    const u = await current(req, 'panel');
    const global = u.rol === 'ADMIN';
    const desde = fecha(req.query.desde, 'desde'),
      hasta = fecha(req.query.hasta, 'hasta');
    if (desde && hasta && desde > hasta)
      throw error('La fecha inicial debe ser anterior a la final.');
    const args = [],
      where = [];
    const add = (campo, op, valor) => {
      args.push(valor);
      where.push(campo + op + '$' + args.length);
    };
    if (!global) add('c."usuarioId"', '=', u.id);
    if (desde) add('c.fecha', '>=', inicioDelDia(desde));
    if (hasta) add('c.fecha', '<=', finDelDia(hasta));
    const condicion = where.length ? ' WHERE ' + where.join(' AND ') : '';
    const actual = pagina(req.query.pagina),
      porPagina = global ? 50 : 20;
    const [{ total }] = await db.query(
      'SELECT COUNT(*) AS total FROM "Canje" c' + condicion,
      args,
    );
    const items = await db.query(
      'SELECT c.id,c.premio,c.costo,c.fecha,c.estado' +
        (global ? ',u.nombre AS socio' : '') +
        ' FROM "Canje" c JOIN "Usuario" u ON u.id=c."usuarioId"' +
        condicion +
        ' ORDER BY c.fecha DESC,c.id LIMIT ' +
        porPagina +
        ' OFFSET ' +
        (actual - 1) * porPagina,
      args,
    );
    res.json({ items, total: Number(total), pagina: actual, porPagina });
  });
  route('patch', '/canjes/:id/entrega', async (req, res) => {
    const u = await admin(req, 'panel');
    await db.transaction(async (client) => {
      const [r] = await db.query(
        'SELECT * FROM "Canje" WHERE id=$1' + lock,
        [req.params.id],
        client,
      );
      if (
        !r ||
        Canje.siguiente(r.estado) !== req.body.estado ||
        !req.body.estado
      )
        throw error(
          'El canje debe avanzar de Pendiente a Listo para retiro y luego a Entregado.',
          409,
        );
      await db.query(
        'UPDATE "Canje" SET estado=$2 WHERE id=$1',
        [r.id, req.body.estado],
        client,
      );
      await notify(
        r.usuarioId,
        'Estado de tu canje',
        r.premio + ' · ' + Canje.etiqueta(req.body.estado),
        client,
      );
      await log(req, u, 'Entrega de premio', r.premio, client, {
        objetivoId: r.usuarioId,
        datos: { canjeId: r.id, estado: req.body.estado },
      });
    });
    res.json({ ok: true });
  });
}
