import { randomUUID } from 'node:crypto';
import { errorDeDominio as error } from './acceso.mjs';
import { DIA, entero, gestor, requerido } from './actividades.mjs';
import { imagenValida, responderImagen } from './imagenes.mjs';

const ESTADOS = {
  ocultar: 'OCULTA',
  restaurar: 'VISIBLE',
  eliminar: 'ELIMINADA',
};
const TABLAS = { PUBLICACION: 'Publicacion', COMENTARIO: 'Comentario' };
const MOTIVOS = ['OFENSIVO', 'SPAM', 'FALSO', 'OTRO'];

export class ContenidoComunidad {
  static texto(body, limite, text) {
    return requerido(body.texto, limite, 'texto', text);
  }
}
export class Publicacion extends ContenidoComunidad {
  static fechaFin(dias) {
    return new Date(
      Date.now() +
        entero(dias, 1, 30, 'Fija la publicación de uno a treinta días.') * DIA,
    ).toISOString();
  }
}
export class Comentario extends ContenidoComunidad {}
export class Reaccion {
  static cambio(activa) {
    if (typeof activa !== 'boolean')
      throw error('Indica si deseas marcar Me gusta.');
    return activa;
  }
}
export class Reporte {
  static validar(tipo, motivo) {
    if (!Object.hasOwn(TABLAS, tipo) || !MOTIVOS.includes(motivo))
      throw error('Selecciona un contenido y un motivo válidos.');
  }
}

export function rutasComunidad({
  db,
  route,
  current,
  admin,
  text,
  now,
  pagina,
  log,
  cargaBinaria,
}) {
  const lock = db.sqlite ? '' : ' FOR UPDATE';

  async function buscar(tipo, id, client, incluirOculto = false) {
    const tabla = TABLAS[tipo];
    const [fila] = await db.query(
      'SELECT id,"autorId",estado' +
        (tipo === 'PUBLICACION' ? ',oficial' : ',"publicacionId"') +
        ' FROM "' +
        tabla +
        '" WHERE id=$1' +
        (client ? lock : ''),
      [id],
      client,
    );
    if (
      !fila ||
      fila.estado === 'ELIMINADA' ||
      (!incluirOculto && fila.estado !== 'VISIBLE')
    )
      throw error('El contenido no está disponible.', 404);
    return fila;
  }

  route('get', '/comunidad', async (req, res) => {
    const u = await current(req, 'panel');
    const actual = pagina(req.query.pagina);
    const [{ total }] = await db.query(
      'SELECT COUNT(*) AS total FROM "Publicacion" WHERE estado=$1',
      ['VISIBLE'],
    );
    const items = await db.query(
      `SELECT p.id,p.texto,p.fecha,p.oficial,p."fijadaHasta",CASE WHEN p.imagen IS NULL THEN 0 ELSE 1 END AS imagen,
        CASE WHEN a.visibilidad='PUBLICO' OR p.oficial=1 OR p."autorId"=$1 THEN a.nombre ELSE 'Socio' END AS autor,
        CASE WHEN p."autorId"=$1 THEN 1 ELSE 0 END AS propia,
        (SELECT COUNT(*) FROM "Reaccion" r WHERE r."publicacionId"=p.id) AS reacciones,
        EXISTS(SELECT 1 FROM "Reaccion" r WHERE r."publicacionId"=p.id AND r."usuarioId"=$1) AS meGusta
       FROM "Publicacion" p JOIN "Usuario" a ON a.id=p."autorId" WHERE p.estado='VISIBLE'
       ORDER BY CASE WHEN p."fijadaHasta">$2 THEN 0 ELSE 1 END,p.fecha DESC,p.id LIMIT 10 OFFSET $3`,
      [u.id, now(), (actual - 1) * 10],
    );
    res.json({
      items: items.map((p) => ({
        ...p,
        autor: p.autor.split(/\s+/)[0],
        reacciones: Number(p.reacciones),
      })),
      total: Number(total),
      pagina: actual,
      porPagina: 10,
    });
  });
  route('post', '/comunidad', async (req, res) => {
    const u = await current(req, 'panel');
    const contenido = Publicacion.texto(req.body, 500, text);
    const id = randomUUID();
    await db.transaction(async (client) => {
      await db.query(
        'INSERT INTO "Publicacion" (id,"autorId",texto,fecha,oficial) VALUES ($1,$2,$3,$4,$5)',
        [id, u.id, contenido, now(), Number(u.rol !== 'SOCIO')],
        client,
      );
      await log(req, u, 'Publicación creada', 'Muro de la comunidad', client, {
        datos: { publicacionId: id },
      });
    });
    res.status(201).json({ id });
  });
  route('patch', '/comunidad/:id', async (req, res) => {
    const u = await current(req, 'panel');
    const contenido = Publicacion.texto(req.body, 500, text);
    await db.transaction(async (client) => {
      const p = await buscar('PUBLICACION', req.params.id, client);
      if (p.autorId !== u.id)
        throw error('Solo el autor puede editar la publicación.', 403);
      await db.query(
        'UPDATE "Publicacion" SET texto=$2 WHERE id=$1',
        [p.id, contenido],
        client,
      );
      await log(req, u, 'Publicación editada', 'Muro de la comunidad', client, {
        datos: { publicacionId: p.id },
      });
    });
    res.json({ ok: true });
  });
  route(
    'post',
    '/comunidad/:id/imagen',
    async (req, res) => {
      const u = await current(req, 'panel');
      const img = imagenValida(req.body);
      await db.transaction(async (client) => {
        const p = await buscar('PUBLICACION', req.params.id, client);
        if (p.autorId !== u.id)
          throw error('Solo el autor puede subir la imagen.', 403);
        await db.query(
          'UPDATE "Publicacion" SET imagen=$2,"imagenMime"=$3 WHERE id=$1',
          [p.id, img.contenido, img.mime],
          client,
        );
      });
      res.json({ ok: true });
    },
    ...cargaBinaria('2mb', current),
  );
  route('get', '/comunidad/:id/imagen', async (req, res) => {
    await current(req, 'panel');
    const [img] = await db.query(
      'SELECT imagen,"imagenMime" FROM "Publicacion" WHERE id=$1 AND estado=$2',
      [req.params.id, 'VISIBLE'],
    );
    if (!img?.imagen) throw error('La imagen no está disponible.', 404);
    responderImagen(res, img.imagen, img.imagenMime);
  });

  const borrar = (tipo) => async (req, res) => {
    const u = await current(req, 'panel');
    await db.transaction(async (client) => {
      const p = await buscar(tipo, req.params.id, client, true);
      if (p.autorId !== u.id)
        throw error('Solo el autor puede retirar este contenido.', 403);
      await db.query(
        'UPDATE "' +
          TABLAS[tipo] +
          '" SET estado=$2' +
          (tipo === 'PUBLICACION' ? ',"fijadaHasta"=NULL' : '') +
          ' WHERE id=$1',
        [p.id, 'ELIMINADA'],
        client,
      );
      await log(req, u, 'Contenido retirado', 'Retiro por el autor', client, {
        datos: { id: p.id, tipo },
      });
    });
    res.json({ ok: true });
  };
  route('delete', '/comunidad/comentarios/:id', borrar('COMENTARIO'));
  route('delete', '/comunidad/:id', borrar('PUBLICACION'));

  route('get', '/comunidad/:id/comentarios', async (req, res) => {
    const u = await current(req, 'panel');
    await buscar('PUBLICACION', req.params.id);
    const filas = await db.query(
      `SELECT c.id,c.texto,c.fecha,CASE WHEN u.visibilidad='PUBLICO' OR c."autorId"=$2 THEN u.nombre ELSE 'Socio' END AS autor,
       CASE WHEN c."autorId"=$2 THEN 1 ELSE 0 END AS propio
       FROM "Comentario" c JOIN "Usuario" u ON u.id=c."autorId" JOIN "Publicacion" p ON p.id=c."publicacionId"
       WHERE p.id=$1 AND p.estado='VISIBLE' AND c.estado='VISIBLE' ORDER BY c.fecha,c.id`,
      [req.params.id, u.id],
    );
    res.json(filas.map((c) => ({ ...c, autor: c.autor.split(/\s+/)[0] })));
  });
  route('post', '/comunidad/:id/comentarios', async (req, res) => {
    const u = await current(req, 'panel');
    const contenido = Comentario.texto(req.body, 250, text);
    await db.transaction(async (client) => {
      const p = await buscar('PUBLICACION', req.params.id, client);
      await db.query(
        'INSERT INTO "Comentario" (id,"publicacionId","autorId",texto,fecha) VALUES ($1,$2,$3,$4,$5)',
        [randomUUID(), p.id, u.id, contenido, now()],
        client,
      );
    });
    res.status(201).json({ ok: true });
  });
  route('put', '/comunidad/:id/reaccion', async (req, res) => {
    const u = await current(req, 'panel');
    const activa = Reaccion.cambio(req.body.activa);
    await db.transaction(async (client) => {
      const p = await buscar('PUBLICACION', req.params.id, client);
      await db.query(
        activa
          ? 'INSERT INTO "Reaccion" ("publicacionId","usuarioId") VALUES ($1,$2) ON CONFLICT DO NOTHING'
          : 'DELETE FROM "Reaccion" WHERE "publicacionId"=$1 AND "usuarioId"=$2',
        [p.id, u.id],
        client,
      );
    });
    res.json({ ok: true });
  });
  route('patch', '/comunidad/:id/fijar', async (req, res) => {
    const u = await gestor(req, current);
    const fin =
      req.body.dias === null ? null : Publicacion.fechaFin(req.body.dias);
    await db.transaction(async (client) => {
      if (!db.sqlite)
        await db.query('SELECT pg_advisory_xact_lock(15274012)', [], client);
      const p = await buscar('PUBLICACION', req.params.id, client);
      if (!p.oficial || (u.rol !== 'ADMIN' && p.autorId !== u.id))
        throw error('Solo se fijan publicaciones oficiales propias.', 403);
      if (fin) {
        const [{ total }] = await db.query(
          'SELECT COUNT(*) AS total FROM "Publicacion" WHERE estado=$1 AND "fijadaHasta">$2 AND id<>$3',
          ['VISIBLE', now(), p.id],
          client,
        );
        if (Number(total) >= 3)
          throw error('Ya hay tres publicaciones fijadas.', 409);
      }
      await db.query(
        'UPDATE "Publicacion" SET "fijadaHasta"=$2 WHERE id=$1',
        [p.id, fin],
        client,
      );
      await log(req, u, 'Fijación de publicación', 'Muro oficial', client, {
        datos: { publicacionId: p.id, hasta: fin },
      });
    });
    res.json({ ok: true });
  });

  route('post', '/comunidad/reportes', async (req, res) => {
    const u = await current(req, 'panel');
    const { tipo, id, motivo } = req.body;
    Reporte.validar(tipo, motivo);
    await db.transaction(async (client) => {
      const p = await buscar(tipo, id, client);
      if (p.autorId === u.id)
        throw error('No puedes reportar tu propio contenido.');
      if (tipo === 'COMENTARIO')
        await buscar('PUBLICACION', p.publicacionId, client);
      const [r] = await db.query(
        `INSERT INTO "Reporte" (tipo,"contenidoId","usuarioId",motivo,fecha) VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT DO NOTHING RETURNING motivo`,
        [tipo, id, u.id, motivo, now()],
        client,
      );
      if (!r) throw error('Ya reportaste este contenido.', 409);
      const [{ total }] = await db.query(
        'SELECT COUNT(*) AS total FROM "Reporte" WHERE tipo=$1 AND "contenidoId"=$2 AND resuelto IS NULL',
        [tipo, id],
        client,
      );
      if (Number(total) >= 3) {
        await db.query(
          'UPDATE "' +
            TABLAS[tipo] +
            '" SET estado=$2' +
            (tipo === 'PUBLICACION' ? ',"fijadaHasta"=NULL' : '') +
            ' WHERE id=$1',
          [id, 'OCULTA'],
          client,
        );
        await log(
          req,
          u,
          'Contenido oculto por reportes',
          'Tres reportes de usuarios distintos',
          client,
          { datos: { id, tipo } },
        );
      }
    });
    res.status(201).json({ ok: true });
  });
  route('get', '/comunidad/moderacion', async (req, res) => {
    await admin(req, 'panel');
    const actual = pagina(req.query.pagina);
    const union = `SELECT id,texto,estado,fecha,'PUBLICACION' AS tipo FROM "Publicacion" WHERE estado<>'ELIMINADA'
      UNION ALL SELECT id,texto,estado,fecha,'COMENTARIO' AS tipo FROM "Comentario" WHERE estado<>'ELIMINADA'`;
    const [{ total }] = await db.query(
      'SELECT COUNT(*) AS total FROM (' + union + ') contenido',
    );
    const items = await db.query(
      `SELECT c.*,(SELECT COUNT(*) FROM "Reporte" r WHERE r.tipo=c.tipo AND r."contenidoId"=c.id AND r.resuelto IS NULL) AS reportes
       FROM (${union}) c ORDER BY reportes DESC,c.fecha DESC,c.id LIMIT 20 OFFSET $1`,
      [(actual - 1) * 20],
    );
    res.json({
      items: items.map((c) => ({ ...c, reportes: Number(c.reportes) })),
      total: Number(total),
      pagina: actual,
      porPagina: 20,
    });
  });
  route('patch', '/comunidad/moderacion/:tipo/:id', async (req, res) => {
    const u = await admin(req, 'panel');
    const { tipo, id } = req.params;
    const { accion } = req.body;
    if (!Object.hasOwn(TABLAS, tipo) || !Object.hasOwn(ESTADOS, accion))
      throw error('Selecciona una operación válida.');
    await db.transaction(async (client) => {
      const p = await buscar(tipo, id, client, true);
      const estado = ESTADOS[accion];
      if (p.estado === estado)
        throw error('El contenido ya está en ese estado.', 409);
      await db.query(
        'UPDATE "' +
          TABLAS[tipo] +
          '" SET estado=$2' +
          (tipo === 'PUBLICACION' ? ',"fijadaHasta"=NULL' : '') +
          ' WHERE id=$1',
        [id, estado],
        client,
      );
      await db.query(
        'UPDATE "Reporte" SET resuelto=$3 WHERE tipo=$1 AND "contenidoId"=$2 AND resuelto IS NULL',
        [tipo, id, now()],
        client,
      );
      await log(
        req,
        u,
        'Contenido moderado',
        'Moderación comunitaria',
        client,
        { datos: { id, tipo, anterior: p.estado, estado } },
      );
    });
    res.json({ ok: true });
  });
}
