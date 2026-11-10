import { randomUUID } from 'node:crypto';
import pdfmake from 'pdfmake';
import { errorDeDominio as error } from './acceso.mjs';
import {
  DIA,
  entero,
  gestor,
  participante,
  requerido,
  serializarUsuario,
} from './actividades.mjs';
import { PreguntaEvaluacion } from './trivia.mjs';

pdfmake.setUrlAccessPolicy(() => false);
pdfmake.setLocalAccessPolicy((fuente) =>
  [
    'Helvetica',
    'Helvetica-Bold',
    'Helvetica-Oblique',
    'Helvetica-BoldOblique',
  ].includes(fuente),
);
pdfmake.addFonts({
  Suma: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
});

export class Capacitacion {
  constructor(body, text) {
    const titulo = requerido(body.titulo, 100, 'titulo', text);
    const descripcion = requerido(body.descripcion, 500, 'descripcion', text);
    if (!Array.isArray(body.preguntas) || body.preguntas.length > 30)
      throw error('Ingresa un cuestionario de hasta treinta preguntas.');
    Object.assign(this, {
      titulo,
      descripcion,
      preguntas: body.preguntas.map((p) => new PreguntaEvaluacion(p, text)),
    });
  }
}

export class ResultadoCapacitacion {
  constructor(preguntas, respuestas, nombre, curso, fecha) {
    if (!Array.isArray(respuestas) || preguntas.length !== respuestas.length)
      throw error('Responde todas las preguntas.');
    const aciertos = respuestas.reduce((n, respuesta, i) => {
      entero(
        respuesta,
        0,
        preguntas[i].opciones.length - 1,
        'Selecciona una opción válida en cada pregunta.',
      );
      return n + Number(respuesta === preguntas[i].correcta);
    }, 0);
    const total = preguntas.length;
    const certificado = aciertos * 100 >= total * 70 ? randomUUID() : null;
    Object.assign(this, { aciertos, total, certificado, nombre, curso, fecha });
  }

  static pdf(r) {
    return pdfmake
      .createPdf({
        pageSize: 'A4',
        pageMargins: [55, 60, 55, 60],
        defaultStyle: { font: 'Suma', fontSize: 13 },
        content: [
          { text: 'SUMA', color: '#233456', bold: true, fontSize: 18 },
          {
            text: 'Certificado de aprobación',
            bold: true,
            fontSize: 26,
            margin: [0, 28, 0, 14],
          },
          { text: r.nombreCertificado, bold: true, fontSize: 19 },
          {
            text: 'Aprobó la capacitación «' + r.cursoCertificado + '».',
            margin: [0, 12, 0, 18],
          },
          {
            text:
              'Resultado: ' +
              r.aciertos +
              ' de ' +
              r.total +
              ' respuestas correctas.',
          },
          { text: 'Fecha de emisión: ' + r.fecha.slice(0, 10) },
          {
            text: 'Código de validación: ' + r.certificado,
            margin: [0, 16, 0, 0],
          },
        ],
      })
      .getBuffer();
  }
}

export function rutasCapacitaciones({
  db,
  route,
  current,
  text,
  now,
  pagina,
  log,
  gamificacion,
  acreditacion,
  cargaBinaria,
}) {
  const lock = db.sqlite ? '' : ' FOR UPDATE';

  route('get', '/capacitaciones', async (req, res) => {
    const u = await current(req, 'panel');
    const actual = pagina(req.query.pagina);
    const condicion = u.rol === 'SOCIO' ? " WHERE c.estado='ACTIVA'" : '';
    const [{ total }] = await db.query(
      'SELECT COUNT(*) AS total FROM "Capacitacion" c' + condicion,
    );
    const items = await db.query(
      `SELECT c.id,c.titulo,c.descripcion,c.estado,
       EXISTS (SELECT 1 FROM "MaterialCapacitacion" m WHERE m."capacitacionId"=c.id) AS material,
       EXISTS (SELECT 1 FROM "ResultadoCapacitacion" r WHERE r."capacitacionId"=c.id AND r."usuarioId"=$1 AND certificado IS NOT NULL) AS aprobada
       FROM "Capacitacion" c${condicion} ORDER BY c.titulo,c.id LIMIT 10 OFFSET $2`,
      [u.id, (actual - 1) * 10],
    );
    res.json({ items, total: Number(total), pagina: actual, porPagina: 10 });
  });

  route('get', '/capacitaciones/:id', async (req, res) => {
    const u = await current(req, 'panel');
    const [c] = await db.query('SELECT * FROM "Capacitacion" WHERE id=$1', [
      req.params.id,
    ]);
    if (!c || (u.rol === 'SOCIO' && c.estado !== 'ACTIVA'))
      throw error('La capacitación no está disponible.', 404);
    const preguntas = JSON.parse(c.preguntas);
    res.json({
      ...c,
      preguntas:
        u.rol === 'SOCIO'
          ? preguntas.map(PreguntaEvaluacion.publica)
          : preguntas,
    });
  });

  const guardar = (crear) => async (req, res) => {
    const u = await gestor(req, current);
    const curso = new Capacitacion(req.body, text);
    const id = crear ? randomUUID() : req.params.id;
    await db.transaction(async (client) => {
      if (!crear) {
        const [c] = await db.query(
          'SELECT estado FROM "Capacitacion" WHERE id=$1' + lock,
          [id],
          client,
        );
        if (!c || c.estado === 'INACTIVA')
          throw error('La capacitación no se puede editar.', 409);
        if (c.estado === 'ACTIVA' && curso.preguntas.length < 5)
          throw error('Una capacitación publicada requiere cinco preguntas.');
      }
      await db.query(
        crear
          ? 'INSERT INTO "Capacitacion" (id,titulo,descripcion,preguntas,version) VALUES ($1,$2,$3,$4,$5)'
          : 'UPDATE "Capacitacion" SET titulo=$2,descripcion=$3,preguntas=$4,version=$5 WHERE id=$1',
        [
          id,
          curso.titulo,
          curso.descripcion,
          JSON.stringify(curso.preguntas),
          randomUUID(),
        ],
        client,
      );
      await log(
        req,
        u,
        crear ? 'Capacitación creada' : 'Capacitación editada',
        curso.titulo,
        client,
        { datos: { capacitacionId: id } },
      );
    });
    res.status(crear ? 201 : 200).json({ id });
  };
  route('post', '/capacitaciones', guardar(true));
  route('put', '/capacitaciones/:id', guardar(false));

  route(
    'post',
    '/capacitaciones/:id/material',
    async (req, res) => {
      const u = await gestor(req, current);
      const archivo = req.body;
      if (
        !Buffer.isBuffer(archivo) ||
        !archivo.length ||
        archivo.length > 50 * 1024 * 1024
      )
        throw error('Selecciona un archivo de hasta 50 MB.');
      const pdf = archivo.subarray(0, 5).toString() === '%PDF-';
      const mp4 = archivo.subarray(4, 8).toString() === 'ftyp';
      if (!pdf && !mp4) throw error('El material debe ser PDF o MP4.');
      const mime = pdf ? 'application/pdf' : 'video/mp4';
      const nombre = pdf ? 'material.pdf' : 'material.mp4';
      await db.transaction(async (client) => {
        const [c] = await db.query(
          'SELECT estado FROM "Capacitacion" WHERE id=$1' + lock,
          [req.params.id],
          client,
        );
        if (!c || c.estado === 'INACTIVA')
          throw error('La capacitación no se puede editar.', 409);
        await db.query(
          `INSERT INTO "MaterialCapacitacion" ("capacitacionId",nombre,mime,contenido) VALUES ($1,$2,$3,$4)
         ON CONFLICT ("capacitacionId") DO UPDATE SET nombre=$2,mime=$3,contenido=$4`,
          [req.params.id, nombre, mime, archivo.toString('base64')],
          client,
        );
        await log(req, u, 'Material actualizado', nombre, client, {
          datos: { capacitacionId: req.params.id },
        });
      });
      res.json({ ok: true });
    },
    ...cargaBinaria('50mb'),
  );

  route('get', '/capacitaciones/:id/material', async (req, res) => {
    const u = await current(req, 'panel');
    const [m] = await db.query(
      `SELECT m.*,c.estado FROM "MaterialCapacitacion" m JOIN "Capacitacion" c ON c.id=m."capacitacionId"
       WHERE c.id=$1`,
      [req.params.id],
    );
    if (!m || (u.rol === 'SOCIO' && m.estado !== 'ACTIVA'))
      throw error('El material no está disponible.', 404);
    res
      .attachment(m.nombre)
      .type(m.mime)
      .send(Buffer.from(m.contenido, 'base64'));
  });
  route('patch', '/capacitaciones/:id/estado', async (req, res) => {
    const u = await gestor(req, current);
    const { estado } = req.body;
    await db.transaction(async (client) => {
      const [c] = await db.query(
        'SELECT * FROM "Capacitacion" WHERE id=$1' + lock,
        [req.params.id],
        client,
      );
      if (
        !c ||
        !(
          (c.estado === 'BORRADOR' && estado === 'ACTIVA') ||
          (c.estado === 'ACTIVA' && estado === 'INACTIVA')
        )
      )
        throw error('El cambio de estado no está permitido.', 409);
      if (estado === 'ACTIVA') {
        const [m] = await db.query(
          'SELECT nombre FROM "MaterialCapacitacion" WHERE "capacitacionId"=$1',
          [c.id],
          client,
        );
        if (!m || JSON.parse(c.preguntas).length < 5)
          throw error(
            'Publica con un material y al menos cinco preguntas.',
            409,
          );
      }
      await db.query(
        'UPDATE "Capacitacion" SET estado=$2 WHERE id=$1',
        [c.id, estado],
        client,
      );
      await log(req, u, 'Estado de capacitación', c.titulo, client, {
        datos: { capacitacionId: c.id, estado },
      });
    });
    res.json({ ok: true });
  });
  route('post', '/capacitaciones/:id/evaluar', async (req, res) => {
    const u = await participante(req, current);
    const resultado = await db.transaction(async (client) => {
      await serializarUsuario(db, u.id, client);
      const [previo] = await db.query(
        'SELECT aciertos,total,certificado FROM "ResultadoCapacitacion" WHERE "usuarioId"=$1 AND "capacitacionId"=$2 AND certificado IS NOT NULL',
        [u.id, req.params.id],
        client,
      );
      if (previo) return previo;
      const [c] = await db.query(
        'SELECT * FROM "Capacitacion" WHERE id=$1' +
          (db.sqlite ? '' : ' FOR SHARE'),
        [req.params.id],
        client,
      );
      if (c?.estado !== 'ACTIVA' || req.body.version !== c.version)
        throw error(
          'La capacitación cambió. Vuelve a abrir la evaluación.',
          409,
        );
      const [{ total }] = await db.query(
        'SELECT COUNT(*) AS total FROM "ResultadoCapacitacion" WHERE "usuarioId"=$1 AND "capacitacionId"=$2 AND fecha>$3',
        [u.id, c.id, new Date(Date.now() - DIA).toISOString()],
        client,
      );
      if (Number(total) >= 3)
        throw error('Ya tienes tres intentos en las últimas 24 horas.', 429);
      const r = new ResultadoCapacitacion(
        JSON.parse(c.preguntas),
        req.body.respuestas,
        u.nombre,
        c.titulo,
        now(),
      );
      await db.query(
        `INSERT INTO "ResultadoCapacitacion" (id,"capacitacionId","usuarioId",fecha,aciertos,total,certificado,"nombreCertificado","cursoCertificado")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          randomUUID(),
          c.id,
          u.id,
          r.fecha,
          r.aciertos,
          r.total,
          r.certificado,
          r.nombre,
          r.curso,
        ],
        client,
      );
      if (r.certificado) {
        await acreditacion.registrar(
          'CAPACITACION',
          c.id,
          [u.id],
          r.fecha,
          client,
        );
        await gamificacion.registrar(
          u.id,
          'CAPACITACION',
          c.id,
          r.fecha,
          client,
        );
      }
      return {
        aciertos: r.aciertos,
        total: r.total,
        certificado: r.certificado,
      };
    });
    res.json(resultado);
  });
  route('get', '/capacitaciones/:id/certificado', async (req, res) => {
    const u = await participante(req, current);
    const [r] = await db.query(
      'SELECT * FROM "ResultadoCapacitacion" WHERE "capacitacionId"=$1 AND "usuarioId"=$2 AND certificado IS NOT NULL',
      [req.params.id, u.id],
    );
    if (!r)
      throw error('Aún no tienes un certificado para esta capacitación.', 404);
    res
      .attachment('SUMA-certificado.pdf')
      .type('application/pdf')
      .send(await ResultadoCapacitacion.pdf(r));
  });
  route('get', '/certificados/:codigo', async (req, res) => {
    const [r] = await db.query(
      'SELECT "cursoCertificado" AS curso,fecha FROM "ResultadoCapacitacion" WHERE certificado=$1',
      [req.params.codigo],
    );
    if (!r) throw error('Código de certificado no encontrado.', 404);
    res.json(r);
  });
}
