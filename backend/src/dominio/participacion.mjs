import { randomUUID } from 'node:crypto';
import { errorDeDominio as error } from './acceso.mjs';
import {
  DIA,
  HORA,
  entero,
  gestor,
  participante,
  requerido,
  serializarUsuario,
} from './actividades.mjs';
import { fechaValida, hoyEcuador } from './campanias.mjs';
import { LOGROS } from './gamificacion.mjs';

export class Reto {
  constructor(body, text) {
    const titulo = requerido(body.titulo, 100, 'titulo', text);
    const descripcion = requerido(body.descripcion, 500, 'descripcion', text);
    const { inicio, fin, actividad } = body;
    if (!fechaValida(inicio) || !fechaValida(fin) || fin <= inicio)
      throw error('La fecha final del reto debe ser posterior al inicio.');
    if (!LOGROS.includes(actividad) || actividad === 'RETO')
      throw error('Elige la actividad del reto.');
    const meta = entero(
      body.meta,
      1,
      1000,
      'La meta debe estar entre 1 y 1000.',
    );
    const premio = entero(
      body.premio,
      0,
      10000,
      'El premio debe estar entre 0 y 10000.',
    );
    Object.assign(this, {
      id: randomUUID(),
      titulo,
      descripcion,
      inicio,
      fin,
      actividad,
      meta,
      premio,
    });
  }
}

export class ProgresoReto {
  static porcentaje(avance, meta) {
    return Math.min(100, Math.floor((100 * avance) / meta));
  }
}

export class Taller {
  constructor(body, text) {
    const titulo = requerido(body.titulo, 100, 'titulo', text);
    const descripcion = requerido(body.descripcion, 500, 'descripcion', text);
    const lugar = requerido(body.lugar, 160, 'lugar', text);
    const inicio =
      typeof body.inicio === 'string' ? Date.parse(body.inicio) : NaN;
    if (!Number.isFinite(inicio) || inicio <= Date.now())
      throw error('El taller debe comenzar en el futuro.');
    const cupos = entero(
      body.cupos,
      1,
      10000,
      'Indica un número entero positivo de cupos.',
    );
    Object.assign(this, {
      titulo,
      descripcion,
      lugar,
      inicio: new Date(inicio).toISOString(),
      cupos,
    });
  }
}

export class Inscripcion {
  static puedeAnular(taller) {
    return Date.parse(taller.inicio) - Date.now() >= DIA;
  }
  static asistencia(taller, valor) {
    const delta = Date.now() - Date.parse(taller.inicio);
    if (delta < 0 || delta > 2 * DIA)
      throw error(
        'La asistencia se registra desde el inicio hasta 48 horas después.',
        409,
      );
    if (!['ASISTIO', 'NO_ASISTIO'].includes(valor))
      throw error('Selecciona Asistió o No asistió.');
    return valor;
  }
}

export function rutasParticipacion({
  db,
  route,
  current,
  admin,
  text,
  now,
  log,
  notify,
  gamificacion,
  acreditacion,
}) {
  const lock = db.sqlite ? '' : ' FOR UPDATE';
  const cursoVigente = (reto) =>
    reto?.activo && reto.inicio <= hoyEcuador() && reto.fin >= hoyEcuador();

  gamificacion.alEvento = async (usuarioId, actividad, fecha, client) => {
    const retos = await db.query(
      `SELECT r.id,r.meta,r.premio,p.avance FROM "Reto" r JOIN "ProgresoReto" p ON r.id=p."retoId"
       WHERE p."usuarioId"=$1 AND r.actividad=$2 AND r.activo=1 AND r.inicio<=$3 AND r.fin>=$3
       AND p.completado IS NULL ORDER BY r.id` +
        (db.sqlite ? '' : ' FOR SHARE OF r'),
      [usuarioId, actividad, hoyEcuador()],
      client,
    );
    for (const r of retos) {
      const avance = r.avance + 1;
      const completado = avance >= r.meta ? fecha : null;
      await db.query(
        'UPDATE "ProgresoReto" SET avance=$3,completado=$4 WHERE "retoId"=$1 AND "usuarioId"=$2',
        [r.id, usuarioId, avance, completado],
        client,
      );
      if (completado) {
        await acreditacion.registrar(
          'RETO',
          r.id,
          [usuarioId],
          fecha,
          client,
          new Map([[usuarioId, r.premio]]),
        );
        await gamificacion.registrar(usuarioId, 'RETO', r.id, fecha, client);
      }
    }
  };

  route('get', '/retos', async (req, res) => {
    const u = await current(req, 'panel');
    const filas = await db.query(
      `SELECT r.*,p.avance,p.completado FROM "Reto" r LEFT JOIN "ProgresoReto" p
       ON p."retoId"=r.id AND p."usuarioId"=$1
       WHERE $2=1 OR (r.activo=1 AND r.inicio<=$3 AND r.fin>=$3) ORDER BY r.fin,r.id`,
      [u.id, Number(u.rol === 'ADMIN'), hoyEcuador()],
    );
    res.json(
      filas.map((r) => ({
        ...r,
        porcentaje: ProgresoReto.porcentaje(r.avance ?? 0, r.meta),
        inscrito: r.avance !== null,
      })),
    );
  });
  route('post', '/retos', async (req, res) => {
    const u = await admin(req, 'panel');
    const r = new Reto(req.body, text);
    await db.transaction(async (client) => {
      await db.query(
        'INSERT INTO "Reto" (id,titulo,descripcion,actividad,meta,premio,inicio,fin) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
        [
          r.id,
          r.titulo,
          r.descripcion,
          r.actividad,
          r.meta,
          r.premio,
          r.inicio,
          r.fin,
        ],
        client,
      );
      await log(req, u, 'Reto creado', r.titulo, client, {
        datos: { retoId: r.id },
      });
    });
    res.status(201).json({ id: r.id });
  });
  route('patch', '/retos/:id/finalizar', async (req, res) => {
    const u = await admin(req, 'panel');
    await db.transaction(async (client) => {
      const [r] = await db.query(
        'UPDATE "Reto" SET activo=0 WHERE id=$1 AND activo=1 RETURNING titulo',
        [req.params.id],
        client,
      );
      if (!r)
        throw error('No existe un reto activo con ese identificador.', 404);
      await log(req, u, 'Reto finalizado', r.titulo, client, {
        datos: { retoId: req.params.id },
      });
    });
    res.json({ ok: true });
  });
  route('post', '/retos/:id/participar', async (req, res) => {
    const u = await participante(req, current);
    await db.transaction(async (client) => {
      await serializarUsuario(db, u.id, client);
      const [r] = await db.query(
        'SELECT * FROM "Reto" WHERE id=$1' + (db.sqlite ? '' : ' FOR SHARE'),
        [req.params.id],
        client,
      );
      if (!cursoVigente(r)) throw error('El reto no está disponible.', 409);
      await db.query(
        'INSERT INTO "ProgresoReto" ("retoId","usuarioId") VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [r.id, u.id],
        client,
      );
    });
    res.json({ ok: true });
  });

  async function buscarTaller(id, client) {
    const [t] = await db.query(
      'SELECT * FROM "Taller" WHERE id=$1' + lock,
      [id],
      client,
    );
    if (!t || t.estado !== 'ACTIVO')
      throw error('El taller no está disponible.', 404);
    return t;
  }

  route('get', '/talleres', async (req, res) => {
    const u = await current(req, 'panel');
    const filas = await db.query(
      `SELECT t.*, i.estado AS inscripcion,i.asistencia,
       (SELECT COUNT(*) FROM "Inscripcion" c WHERE c."tallerId"=t.id AND c.estado='CONFIRMADA') AS inscritos
       FROM "Taller" t LEFT JOIN "Inscripcion" i ON i."tallerId"=t.id AND i."usuarioId"=$1
       WHERE $2=1 OR (t.estado='ACTIVO' AND t.inicio>$3) OR i.estado IS NOT NULL ORDER BY t.inicio,t.id`,
      [u.id, Number(u.rol !== 'SOCIO'), now()],
    );
    res.json(
      filas.map((t) => ({
        ...t,
        disponibles: t.cupos - Number(t.inscritos),
        puedeAnular:
          t.inscripcion === 'CONFIRMADA' && Inscripcion.puedeAnular(t),
      })),
    );
  });
  const guardarTaller = (crear) => async (req, res) => {
    const u = await gestor(req, current);
    const t = new Taller(req.body, text);
    const id = crear ? randomUUID() : req.params.id;
    await db.transaction(async (client) => {
      if (!crear) {
        const actual = await buscarTaller(id, client);
        if (Date.parse(actual.inicio) <= Date.now())
          throw error('El taller ya comenzó.', 409);
        const [{ total }] = await db.query(
          'SELECT COUNT(*) AS total FROM "Inscripcion" WHERE "tallerId"=$1 AND estado=$2',
          [id, 'CONFIRMADA'],
          client,
        );
        if (t.cupos < Number(total))
          throw error(
            'Los cupos no pueden ser menores que los inscritos.',
            409,
          );
        await db.query(
          'UPDATE "Taller" SET titulo=$2,descripcion=$3,inicio=$4,lugar=$5,cupos=$6 WHERE id=$1',
          [id, t.titulo, t.descripcion, t.inicio, t.lugar, t.cupos],
          client,
        );
        if (actual.inicio !== t.inicio)
          await db.query(
            'DELETE FROM "Recordatorio" WHERE tipo=$1 AND evento=$2',
            ['TALLER', id],
            client,
          );
      } else {
        await db.query(
          'INSERT INTO "Taller" (id,titulo,descripcion,inicio,lugar,cupos) VALUES ($1,$2,$3,$4,$5,$6)',
          [id, t.titulo, t.descripcion, t.inicio, t.lugar, t.cupos],
          client,
        );
      }
      await log(
        req,
        u,
        crear ? 'Taller publicado' : 'Taller editado',
        t.titulo,
        client,
        { datos: { tallerId: id } },
      );
    });
    res.status(crear ? 201 : 200).json({ id });
  };
  route('post', '/talleres', guardarTaller(true));
  route('put', '/talleres/:id', guardarTaller(false));
  route('patch', '/talleres/:id/cancelar', async (req, res) => {
    const u = await gestor(req, current);
    await db.transaction(async (client) => {
      const t = await buscarTaller(req.params.id, client);
      if (Date.parse(t.inicio) <= Date.now())
        throw error('No se puede cancelar un taller que ya comenzó.', 409);
      await db.query(
        'UPDATE "Taller" SET estado=$2 WHERE id=$1',
        [t.id, 'CANCELADO'],
        client,
      );
      const inscripciones = await db.query(
        'UPDATE "Inscripcion" SET estado=$2 WHERE "tallerId"=$1 AND estado=$3 RETURNING "usuarioId"',
        [t.id, 'CANCELADA', 'CONFIRMADA'],
        client,
      );
      for (const i of inscripciones)
        await notify(i.usuarioId, 'Taller cancelado', t.titulo, client);
      await log(req, u, 'Taller cancelado', t.titulo, client, {
        datos: { tallerId: t.id, liberadas: inscripciones.length },
      });
    });
    res.json({ ok: true });
  });
  route('post', '/talleres/:id/inscripcion', async (req, res) => {
    const u = await participante(req, current);
    await db.transaction(async (client) => {
      const t = await buscarTaller(req.params.id, client);
      if (Date.parse(t.inicio) <= Date.now())
        throw error('El taller ya comenzó.', 409);
      const [{ total }] = await db.query(
        'SELECT COUNT(*) AS total FROM "Inscripcion" WHERE "tallerId"=$1 AND estado=$2',
        [t.id, 'CONFIRMADA'],
        client,
      );
      if (Number(total) >= t.cupos)
        throw error('El taller ya no tiene cupos.', 409);
      const [i] = await db.query(
        `INSERT INTO "Inscripcion" ("tallerId","usuarioId",fecha,estado) VALUES ($1,$2,$3,'CONFIRMADA')
         ON CONFLICT ("tallerId","usuarioId") DO UPDATE SET estado='CONFIRMADA',fecha=$3
         WHERE "Inscripcion".estado='ANULADA' RETURNING "usuarioId"`,
        [t.id, u.id, now()],
        client,
      );
      if (!i) throw error('Ya tienes una inscripción en este taller.', 409);
      await notify(u.id, 'Inscripción confirmada', t.titulo, client);
    });
    res.status(201).json({ ok: true });
  });
  route('delete', '/talleres/:id/inscripcion', async (req, res) => {
    const u = await participante(req, current);
    await db.transaction(async (client) => {
      const t = await buscarTaller(req.params.id, client);
      if (!Inscripcion.puedeAnular(t))
        throw error('Solo puedes anular hasta 24 horas antes del taller.', 409);
      const [i] = await db.query(
        'UPDATE "Inscripcion" SET estado=$3 WHERE "tallerId"=$1 AND "usuarioId"=$2 AND estado=$4 RETURNING "usuarioId"',
        [t.id, u.id, 'ANULADA', 'CONFIRMADA'],
        client,
      );
      if (!i) throw error('No existe una inscripción confirmada.', 404);
    });
    res.json({ ok: true });
  });
  route('get', '/talleres/:id/asistencia', async (req, res) => {
    await gestor(req, current);
    res.json(
      await db.query(
        `SELECT u.id,u.nombre,i.asistencia FROM "Inscripcion" i JOIN "Usuario" u ON u.id=i."usuarioId"
       WHERE i."tallerId"=$1 AND i.estado='CONFIRMADA' ORDER BY u.nombre,u.id`,
        [req.params.id],
      ),
    );
  });
  route('patch', '/talleres/:id/asistencia/:usuario', async (req, res) => {
    const u = await gestor(req, current);
    const usuarioId = entero(
      Number(req.params.usuario),
      1,
      2147483647,
      'Selecciona un inscrito válido.',
    );
    await db.transaction(async (client) => {
      const t = await buscarTaller(req.params.id, client);
      const asistencia = Inscripcion.asistencia(t, req.body.asistencia);
      const [i] = await db.query(
        `UPDATE "Inscripcion" SET asistencia=$3 WHERE "tallerId"=$1 AND "usuarioId"=$2
         AND estado='CONFIRMADA' AND asistencia IS NULL RETURNING asistencia`,
        [t.id, usuarioId, asistencia],
        client,
      );
      if (!i)
        throw error(
          'La asistencia ya se registró o la inscripción no existe.',
          409,
        );
      if (asistencia === 'ASISTIO') {
        await acreditacion.registrar(
          'TALLER',
          t.id,
          [usuarioId],
          now(),
          client,
        );
        await gamificacion.registrar(usuarioId, 'TALLER', t.id, now(), client);
      }
      await log(req, u, 'Asistencia registrada', t.titulo, client, {
        objetivoId: usuarioId,
        datos: { tallerId: t.id, asistencia },
      });
    });
    res.json({ ok: true });
  });

  return async function recordatorios(ahora = Date.now()) {
    await db.transaction(async (client) => {
      const iso = (horas) => new Date(ahora + horas * HORA).toISOString();
      const talleres = await db.query(
        `SELECT t.id,t.titulo,i."usuarioId" FROM "Taller" t JOIN "Inscripcion" i ON t.id=i."tallerId"
         JOIN "Usuario" u ON u.id=i."usuarioId" WHERE t.estado='ACTIVO' AND i.estado='CONFIRMADA'
         AND u.activo=$3 AND t.inicio>=$1 AND t.inicio<$2`,
        [iso(24), iso(25), true],
        client,
      );
      const candidatos = await db.query(
        `SELECT r.id,r.titulo,r.fin,p."usuarioId" FROM "Reto" r JOIN "ProgresoReto" p ON r.id=p."retoId"
         JOIN "Usuario" u ON u.id=p."usuarioId" WHERE r.activo=1 AND p.avance>0 AND p.completado IS NULL
         AND u.activo=$3 AND r.fin>=$1 AND r.fin<=$2`,
        [iso(66).slice(0, 10), iso(73).slice(0, 10), true],
        client,
      );
      const retos = candidatos.filter((r) => {
        const horas =
          (Date.parse(r.fin + 'T23:59:59.999-05:00') - ahora) / HORA;
        return horas >= 72 && horas < 73;
      });
      for (const [tipo, filas, titulo] of [
        ['TALLER', talleres, 'Tu taller empieza mañana'],
        ['RETO', retos, 'Tu reto termina pronto'],
      ]) {
        for (const fila of filas) {
          const [creado] = await db.query(
            `INSERT INTO "Recordatorio" (tipo,evento,"usuarioId",fecha) VALUES ($1,$2,$3,$4)
             ON CONFLICT DO NOTHING RETURNING evento`,
            [tipo, fila.id, fila.usuarioId, now()],
            client,
          );
          if (creado) await notify(fila.usuarioId, titulo, fila.titulo, client);
        }
      }
    });
  };
}
