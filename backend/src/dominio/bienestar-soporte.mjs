import { randomBytes, randomUUID } from 'node:crypto';
import { errorDeDominio as error } from './acceso.mjs';
import { gestor, requerido } from './actividades.mjs';

const CATEGORIAS = [
  'NUTRICION',
  'ACTIVIDAD_FISICA',
  'SALUD_MENTAL',
  'PREVENCION',
];

export class ContenidoSalud {
  constructor(body, text) {
    const titulo = requerido(body.titulo, 100, 'titulo', text);
    const descripcion = requerido(body.descripcion, 2000, 'descripcion', text);
    const { tipo, categoria } = body;
    if (
      !['ARTICULO', 'SERVICIO'].includes(tipo) ||
      (tipo === 'ARTICULO' && !CATEGORIAS.includes(categoria))
    )
      throw error(
        'Selecciona el tipo de contenido y una categoría para los artículos.',
      );
    Object.assign(this, {
      titulo,
      descripcion,
      tipo,
      categoria: tipo === 'ARTICULO' ? categoria : null,
    });
  }
}

export class SolicitudSoporte {
  static codigo() {
    return randomBytes(3).toString('hex').toUpperCase();
  }
  static siguiente(estado) {
    return { ABIERTA: 'EN_ATENCION', EN_ATENCION: 'CERRADA' }[estado];
  }
}

export function rutasBienestarSoporte({
  db,
  route,
  current,
  admin,
  text,
  now,
  pagina,
  log,
  notify,
}) {
  const lock = db.sqlite ? '' : ' FOR UPDATE';
  route('get', '/salud', async (req, res) => {
    const u = await current(req, 'panel');
    const items = await db.query(
      'SELECT * FROM "ContenidoSalud"' +
        (u.rol === 'SOCIO' ? " WHERE estado='PUBLICADO'" : '') +
        ' ORDER BY fecha DESC,id',
    );
    res.json({
      categorias: CATEGORIAS,
      articulos: items.filter((x) => x.tipo === 'ARTICULO'),
      servicios: items.filter((x) => x.tipo === 'SERVICIO'),
    });
  });
  const guardar = (crear) => async (req, res) => {
    const u = await gestor(req, current);
    const c = new ContenidoSalud(req.body, text);
    const id = crear ? randomUUID() : req.params.id;
    await db.transaction(async (client) => {
      const valores = [id, c.titulo, c.descripcion, c.tipo, c.categoria];
      const [r] = await db.query(
        crear
          ? 'INSERT INTO "ContenidoSalud" (id,titulo,descripcion,tipo,categoria,fecha) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id'
          : 'UPDATE "ContenidoSalud" SET titulo=$2,descripcion=$3,tipo=$4,categoria=$5 WHERE id=$1 RETURNING id',
        crear ? [...valores, now()] : valores,
        client,
      );
      if (!r) throw error('No se encontró el contenido.', 404);
      await log(
        req,
        u,
        crear ? 'Contenido de salud creado' : 'Contenido de salud editado',
        c.titulo,
        client,
        { datos: { contenidoId: id } },
      );
    });
    res.status(crear ? 201 : 200).json({ id });
  };
  route('post', '/salud', guardar(true));
  route('put', '/salud/:id', guardar(false));
  route('patch', '/salud/:id/estado', async (req, res) => {
    const u = await gestor(req, current);
    const { estado } = req.body;
    if (!['PUBLICADO', 'BORRADOR'].includes(estado))
      throw error('Selecciona Publicado o Borrador.');
    await db.transaction(async (client) => {
      const [c] = await db.query(
        'UPDATE "ContenidoSalud" SET estado=$2,fecha=$3 WHERE id=$1 AND estado<>$2 RETURNING titulo',
        [req.params.id, estado, now()],
        client,
      );
      if (!c) throw error('El contenido no existe o ya tiene ese estado.', 409);
      await log(req, u, 'Estado de contenido de salud', c.titulo, client, {
        datos: { contenidoId: req.params.id, estado },
      });
    });
    res.json({ ok: true });
  });

  route('get', '/soporte', async (req, res) => {
    const u = await current(req, 'ayuda');
    const actual = pagina(req.query.pagina);
    const global = u.rol === 'ADMIN';
    const args = global ? [] : [u.id];
    const where = global ? '' : ' WHERE s."usuarioId"=$1';
    const [{ total }] = await db.query(
      'SELECT COUNT(*) AS total FROM "SolicitudSoporte" s' + where,
      args,
    );
    const items = await db.query(
      'SELECT s.codigo,s.descripcion,s.fecha,s.estado,s.respuesta,s.cierre' +
        (global ? ',u.nombre AS titular' : '') +
        ' FROM "SolicitudSoporte" s JOIN "Usuario" u ON u.id=s."usuarioId"' +
        where +
        ' ORDER BY s.fecha DESC,s.codigo LIMIT 20 OFFSET ' +
        (actual - 1) * 20,
      args,
    );
    res.json({ items, total: Number(total), pagina: actual, porPagina: 20 });
  });
  route('post', '/soporte', async (req, res) => {
    const u = await current(req, 'ayuda');
    const descripcion = requerido(
      req.body.descripcion,
      1000,
      'descripcion',
      text,
    );
    const r = await db.transaction(async (client) => {
      for (let intento = 0; intento < 5; intento++) {
        const [fila] = await db.query(
          `INSERT INTO "SolicitudSoporte" (codigo,"usuarioId",descripcion,fecha) VALUES ($1,$2,$3,$4)
           ON CONFLICT DO NOTHING RETURNING codigo,estado`,
          [SolicitudSoporte.codigo(), u.id, descripcion, now()],
          client,
        );
        if (fila) {
          await log(
            req,
            u,
            'Solicitud de soporte abierta',
            'Solicitud ' + fila.codigo,
            client,
          );
          return fila;
        }
      }
      throw error('Intenta enviar tu solicitud nuevamente.', 503);
    });
    res.status(201).json(r);
  });
  route('patch', '/soporte/:codigo', async (req, res) => {
    const u = await admin(req, 'ayuda');
    const { estado } = req.body;
    if (!['EN_ATENCION', 'CERRADA'].includes(estado))
      throw error('Selecciona un estado válido.');
    const respuesta =
      estado === 'CERRADA'
        ? requerido(req.body.respuesta, 1000, 'respuesta', text)
        : null;
    await db.transaction(async (client) => {
      const [s] = await db.query(
        'SELECT * FROM "SolicitudSoporte" WHERE codigo=$1' + lock,
        [req.params.codigo],
        client,
      );
      if (!s || SolicitudSoporte.siguiente(s.estado) !== estado)
        throw error(
          'La solicitud debe pasar a En atención antes de cerrar.',
          409,
        );
      await db.query(
        'UPDATE "SolicitudSoporte" SET estado=$2,respuesta=$3,cierre=$4 WHERE codigo=$1',
        [s.codigo, estado, respuesta, respuesta ? now() : null],
        client,
      );
      if (respuesta)
        await notify(
          s.usuarioId,
          'Respuesta de soporte · ' + s.codigo,
          respuesta,
          client,
        );
      await log(req, u, 'Estado de solicitud de soporte', s.codigo, client, {
        objetivoId: s.usuarioId,
        datos: { estado },
      });
    });
    res.json({ ok: true });
  });
}
