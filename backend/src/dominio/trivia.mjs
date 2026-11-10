import { randomUUID } from 'node:crypto';
import { errorDeDominio as error } from './acceso.mjs';
import {
  DIA,
  entero,
  gestor,
  participante,
  requerido,
  serializarUsuario,
} from './actividades.mjs';

export const TEMAS = ['AHORRO', 'CREDITO', 'PRESUPUESTO', 'INVERSION'];
export const DIFICULTADES = ['BASICO', 'INTERMEDIO', 'AVANZADO'];

export class PreguntaEvaluacion {
  constructor(body, text) {
    const enunciado = requerido(body?.enunciado, 300, 'enunciado', text);
    if (
      !Array.isArray(body.opciones) ||
      body.opciones.length < 2 ||
      body.opciones.length > 4
    )
      throw error('Ingresa de dos a cuatro opciones.');
    const opciones = body.opciones.map((opcion) =>
      requerido(opcion, 160, 'opciones', text),
    );
    if (new Set(opciones.map((x) => x.toLowerCase())).size !== opciones.length)
      throw error('Las opciones deben ser distintas.');
    const correcta = entero(
      body.correcta,
      0,
      opciones.length - 1,
      'Marca exactamente una opción correcta.',
    );
    Object.assign(this, { enunciado, opciones, correcta });
  }

  static publica({ enunciado, opciones }) {
    return { enunciado, opciones };
  }
}

export class PreguntaTrivia extends PreguntaEvaluacion {
  constructor(body, text) {
    super(body, text);
    if (!TEMAS.includes(body.tema) || !DIFICULTADES.includes(body.dificultad))
      throw error('Elige el tema y la dificultad.');
    Object.assign(this, { tema: body.tema, dificultad: body.dificultad });
  }
}

export class PartidaTrivia {
  static consulta(p) {
    const vigente = !p.completada && Date.parse(p.vencePartida) > Date.now();
    const preguntas = JSON.parse(p.preguntas);
    return {
      id: p.id,
      numero: p.indice + 1,
      total: preguntas.length,
      vence: p.vence,
      estado:
        p.completada === 1 ? 'COMPLETADA' : vigente ? 'EN_CURSO' : 'VENCIDA',
      ...(vigente
        ? { pregunta: PreguntaEvaluacion.publica(preguntas[p.indice]) }
        : { aciertos: p.aciertos }),
    };
  }
}

export function rutasTrivia({
  db,
  route,
  current,
  text,
  log,
  now,
  acreditacion,
  gamificacion,
}) {
  const lock = db.sqlite ? '' : ' FOR UPDATE';

  route('get', '/trivia/preguntas', async (req, res) => {
    await gestor(req, current);
    const dificultad = req.query.dificultad || null;
    if (dificultad && !DIFICULTADES.includes(dificultad))
      throw error('Elige una dificultad válida.');
    const filas = await db.query(
      'SELECT * FROM "PreguntaTrivia"' +
        (dificultad ? ' WHERE dificultad=$1' : '') +
        ' ORDER BY tema,enunciado,id',
      dificultad ? [dificultad] : [],
    );
    res.json(filas.map((p) => ({ ...p, opciones: JSON.parse(p.opciones) })));
  });
  const guardar = (crear) => async (req, res) => {
    const u = await gestor(req, current);
    const p = new PreguntaTrivia(req.body, text);
    const id = crear ? randomUUID() : req.params.id;
    await db.transaction(async (client) => {
      const [fila] = await db.query(
        crear
          ? 'INSERT INTO "PreguntaTrivia" (id,enunciado,opciones,correcta,tema,dificultad) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id'
          : 'UPDATE "PreguntaTrivia" SET enunciado=$2,opciones=$3,correcta=$4,tema=$5,dificultad=$6 WHERE id=$1 RETURNING id',
        [
          id,
          p.enunciado,
          JSON.stringify(p.opciones),
          p.correcta,
          p.tema,
          p.dificultad,
        ],
        client,
      );
      if (!fila) throw error('No se encontró la pregunta.', 404);
      await log(
        req,
        u,
        crear ? 'Pregunta de trivia creada' : 'Pregunta de trivia editada',
        p.tema,
        client,
        { datos: { preguntaId: id } },
      );
    });
    res.status(crear ? 201 : 200).json({ id });
  };
  route('post', '/trivia/preguntas', guardar(true));
  route('put', '/trivia/preguntas/:id', guardar(false));
  route('patch', '/trivia/preguntas/:id/inactivar', async (req, res) => {
    const u = await gestor(req, current);
    await db.transaction(async (client) => {
      const [p] = await db.query(
        'UPDATE "PreguntaTrivia" SET activa=0 WHERE id=$1 AND activa=1 RETURNING id',
        [req.params.id],
        client,
      );
      if (!p) throw error('No se encontró una pregunta activa.', 404);
      await log(
        req,
        u,
        'Pregunta de trivia inactivada',
        'Banco de preguntas',
        client,
        { datos: { preguntaId: p.id } },
      );
    });
    res.json({ ok: true });
  });

  route('post', '/trivia/partidas', async (req, res) => {
    const u = await participante(req, current);
    const partida = await db.transaction(async (client) => {
      await serializarUsuario(db, u.id, client);
      const fecha = Date.now();
      const [pendiente] = await db.query(
        'SELECT * FROM "PartidaTrivia" WHERE "usuarioId"=$1 AND completada=0 AND "vencePartida">$2 ORDER BY fecha DESC LIMIT 1',
        [u.id, new Date(fecha).toISOString()],
        client,
      );
      if (pendiente) return pendiente;
      const [{ total }] = await db.query(
        'SELECT COUNT(*) AS total FROM "PartidaTrivia" WHERE "usuarioId"=$1 AND fecha>$2',
        [u.id, new Date(fecha - DIA).toISOString()],
        client,
      );
      if (Number(total) >= 3)
        throw error('Ya iniciaste tres partidas en las últimas 24 horas.', 429);
      const filas = await db.query(
        'SELECT enunciado,opciones,correcta FROM "PreguntaTrivia" WHERE activa=1 ORDER BY RANDOM() LIMIT 10',
        [],
        client,
      );
      if (filas.length !== 10)
        throw error('La trivia necesita al menos diez preguntas activas.', 409);
      const preguntas = filas.map((p) => ({
        ...p,
        opciones: JSON.parse(p.opciones),
      }));
      const [p] = await db.query(
        'INSERT INTO "PartidaTrivia" (id,"usuarioId",fecha,vence,"vencePartida",preguntas) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
        [
          randomUUID(),
          u.id,
          new Date(fecha).toISOString(),
          new Date(fecha + 30_000).toISOString(),
          new Date(fecha + 300_000).toISOString(),
          JSON.stringify(preguntas),
        ],
        client,
      );
      return p;
    });
    res.json(PartidaTrivia.consulta(partida));
  });
  route('post', '/trivia/partidas/:id/respuesta', async (req, res) => {
    const u = await participante(req, current);
    const resultado = await db.transaction(async (client) => {
      await serializarUsuario(db, u.id, client);
      const [p] = await db.query(
        'SELECT * FROM "PartidaTrivia" WHERE id=$1 AND "usuarioId"=$2' + lock,
        [req.params.id, u.id],
        client,
      );
      if (!p) throw error('No se encontró la partida.', 404);
      const tiempo = Date.now();
      if (p.completada || Date.parse(p.vencePartida) <= tiempo) return p;
      if (req.body.numero !== p.indice + 1)
        throw error('Esta pregunta ya fue respondida. Retoma la partida.', 409);
      const preguntas = JSON.parse(p.preguntas);
      const pregunta = preguntas[p.indice];
      const { opcion } = req.body;
      if (opcion !== null)
        entero(
          opcion,
          0,
          pregunta.opciones.length - 1,
          'Selecciona una opción válida.',
        );
      if (opcion === null && Date.parse(p.vence) > tiempo)
        throw error('La pregunta sigue abierta.', 409);
      const indice = p.indice + 1;
      const aciertos =
        p.aciertos +
        Number(Date.parse(p.vence) > tiempo && opcion === pregunta.correcta);
      const completa = indice === preguntas.length;
      const [fila] = await db.query(
        'UPDATE "PartidaTrivia" SET indice=$2,aciertos=$3,vence=$4,completada=$5 WHERE id=$1 RETURNING *',
        [
          p.id,
          indice,
          aciertos,
          new Date(
            Math.min(tiempo + 30_000, Date.parse(p.vencePartida)),
          ).toISOString(),
          Number(completa),
        ],
        client,
      );
      if (completa) {
        await acreditacion.registrar('TRIVIA', p.id, [u.id], now(), client);
        await gamificacion.registrar(u.id, 'TRIVIA', p.id, now(), client);
      }
      return fila;
    });
    res.json(PartidaTrivia.consulta(resultado));
  });
}
