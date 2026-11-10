import { randomUUID } from 'node:crypto';
import { errorDeDominio as error } from './acceso.mjs';

const TRANSICIONES = {
  BORRADOR: ['ACTIVA', 'FINALIZADA'],
  ACTIVA: ['PAUSADA', 'FINALIZADA'],
  PAUSADA: ['ACTIVA', 'FINALIZADA'],
  FINALIZADA: [],
};

export function provinciasCobertura() {
  return [
    ...new Set(
      (process.env.SUMA_PROVINCIAS || 'Loja,Zamora Chinchipe,El Oro')
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean),
    ),
  ].slice(0, 8);
}

export const hoyEcuador = () =>
  new Date(Date.now() - 5 * 3_600_000).toISOString().slice(0, 10);

export function fechaValida(fecha) {
  if (typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha))
    return false;
  const d = new Date(fecha + 'T00:00:00Z');
  return Number.isFinite(+d) && d.toISOString().slice(0, 10) === fecha;
}

export class Campania {
  constructor(body, texto) {
    const titulo = texto(body.titulo, 100, 'titulo');
    if (!titulo) throw error('Ingresa el título de la campaña.');
    const { inicio, fin, puntosSocio, puntosReferido } = body;
    if (!fechaValida(inicio) || !fechaValida(fin) || fin <= inicio)
      throw error('La fecha de fin debe ser posterior a la de inicio.');
    if (
      ![puntosSocio, puntosReferido].every(
        (n) => Number.isInteger(n) && n >= 1 && n <= 10000,
      )
    )
      throw error('Cada premio debe ser un número entero de 1 a 10000.');
    const provincias = Array.isArray(body.provincias)
      ? [...new Set(body.provincias)]
      : [];
    const catalogo = provinciasCobertura();
    if (
      !provincias.length ||
      provincias.length > 8 ||
      provincias.some((p) => !catalogo.includes(p))
    )
      throw error(
        'Elige entre una y ocho provincias del catálogo de cobertura.',
      );
    Object.assign(this, {
      titulo,
      inicio,
      fin,
      puntosSocio,
      puntosReferido,
      provincias,
    });
  }

  static validarCambio(actual, estado) {
    if (!TRANSICIONES[actual]?.includes(estado))
      throw error('El cambio de estado no está permitido.', 409);
  }

  static vigente(campania, fecha = hoyEcuador()) {
    return (
      campania?.estado === 'ACTIVA' &&
      campania.inicio <= fecha &&
      campania.fin >= fecha
    );
  }
}

export class Campanias {
  constructor(db, log) {
    this.db = db;
    this.log = log;
  }

  async serializar(client) {
    if (!this.db.sqlite)
      await this.db.query('SELECT pg_advisory_xact_lock(15274007)', [], client);
  }

  async listar(provincia, soloVigentes) {
    const c = hoyEcuador();
    const where = soloVigentes
      ? `WHERE c.estado='ACTIVA' AND c.inicio<=$1 AND c.fin>=$1
      AND EXISTS (SELECT 1 FROM "CampaniaProvincia" cp WHERE cp."campaniaId"=c.id AND cp.provincia=$2)`
      : '';
    const filas = await this.db.query(
      `SELECT c.*, p.provincia FROM "Campania" c JOIN "CampaniaProvincia" p ON p."campaniaId"=c.id
       ${where} ORDER BY c.inicio DESC,c.id,p.provincia`,
      soloVigentes ? [c, provincia ?? null] : [],
    );
    const items = new Map();
    for (const { provincia: p, ...campania } of filas) {
      if (!items.has(campania.id))
        items.set(campania.id, { ...campania, provincias: [] });
      items.get(campania.id).provincias.push(p);
    }
    return [...items.values()];
  }

  async guardar(req, usuario, id, campania) {
    await this.db.transaction(async (client) => {
      await this.serializar(client);
      const { titulo, inicio, fin, puntosSocio, puntosReferido, provincias } =
        campania;
      const [actual] = id
        ? await this.db.query(
            'SELECT * FROM "Campania" WHERE id=$1',
            [id],
            client,
          )
        : [];
      if (id && !actual) throw error('No se encontró la campaña.', 404);
      if (actual?.estado === 'FINALIZADA')
        throw error('Una campaña finalizada no se puede editar.', 409);
      if (actual?.estado === 'ACTIVA')
        await this.validarCobertura(id, inicio, fin, provincias, client);
      const nuevoId = id ?? randomUUID();
      await this.db.query(
        `INSERT INTO "Campania" (id,titulo,inicio,fin,"puntosSocio","puntosReferido") VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT(id) DO UPDATE SET titulo=$2,inicio=$3,fin=$4,"puntosSocio"=$5,"puntosReferido"=$6`,
        [nuevoId, titulo, inicio, fin, puntosSocio, puntosReferido],
        client,
      );
      await this.db.query(
        'DELETE FROM "CampaniaProvincia" WHERE "campaniaId"=$1',
        [nuevoId],
        client,
      );
      for (const provincia of provincias)
        await this.db.query(
          'INSERT INTO "CampaniaProvincia" ("campaniaId",provincia) VALUES ($1,$2)',
          [nuevoId, provincia],
          client,
        );
      await this.log(
        req,
        usuario,
        id ? 'Campaña editada' : 'Campaña creada',
        titulo,
        client,
        { datos: { campaniaId: nuevoId } },
      );
    });
  }

  async validarCobertura(id, inicio, fin, provincias, client) {
    const solapadas = await this.db.query(
      `SELECT p.provincia FROM "Campania" c JOIN "CampaniaProvincia" p ON p."campaniaId"=c.id
       WHERE c.id<>$1 AND c.estado='ACTIVA' AND c.inicio<=$2 AND c.fin>=$3`,
      [id, fin, inicio],
      client,
    );
    if (solapadas.some((p) => provincias.includes(p.provincia)))
      throw error(
        'Otra campaña activa cubre esa provincia durante el período elegido.',
        409,
      );
  }

  async cambiarEstado(req, usuario, id, estado, fecha) {
    await this.db.transaction(async (client) => {
      await this.serializar(client);
      const [c] = await this.db.query(
        'SELECT * FROM "Campania" WHERE id=$1',
        [id],
        client,
      );
      if (!c) throw error('No se encontró la campaña.', 404);
      Campania.validarCambio(c.estado, estado);
      if (estado === 'ACTIVA') {
        const provincias = await this.db.query(
          'SELECT provincia FROM "CampaniaProvincia" WHERE "campaniaId"=$1',
          [id],
          client,
        );
        await this.validarCobertura(
          id,
          c.inicio,
          c.fin,
          provincias.map((p) => p.provincia),
          client,
        );
        await this.db.query(
          `INSERT INTO "Notificacion" ("usuarioId",titulo,mensaje,fecha)
           SELECT u.id,$2,$3,$4 FROM "Usuario" u
           JOIN "CampaniaProvincia" p ON p.provincia=u.provincia
           WHERE p."campaniaId"=$1 AND u.activo=$5 AND u."correoVerificado"=$5`,
          [id, 'Campaña de referidos activada', c.titulo, fecha, true],
          client,
        );
      }
      await this.db.query(
        'UPDATE "Campania" SET estado=$2 WHERE id=$1',
        [id, estado],
        client,
      );
      await this.log(req, usuario, 'Estado de campaña', c.titulo, client, {
        datos: { campaniaId: id, anterior: c.estado, estado },
      });
    });
  }

  async vincular(referidoId, socioId, client) {
    const [c] = await this.db.query(
      `SELECT c.id,c.titulo,u.provincia FROM "Usuario" u JOIN "CampaniaProvincia" p ON p.provincia=u.provincia
       JOIN "Campania" c ON c.id=p."campaniaId" WHERE u.id=$1 AND c.estado='ACTIVA' AND c.inicio<=$2 AND c.fin>=$2`,
      [socioId, hoyEcuador()],
      client,
    );
    if (c)
      await this.db.query(
        'UPDATE "Referido" SET "campaniaId"=$2,campania=$3,provincia=$4 WHERE id=$1 AND "campaniaId" IS NULL',
        [referidoId, c.id, c.titulo, c.provincia],
        client,
      );
    else
      await this.db.query(
        'UPDATE "Referido" SET provincia=(SELECT provincia FROM "Usuario" WHERE id=$2) WHERE id=$1 AND provincia IS NULL',
        [referidoId, socioId],
        client,
      );
  }

  async premio(ref, client) {
    const [c] = await this.db.query(
      'SELECT * FROM "Campania" WHERE id=$1' +
        (this.db.sqlite ? '' : ' FOR SHARE'),
      [ref.campaniaId],
      client,
    );
    return Campania.vigente(c) ? c : null;
  }

  rutas({ route, current, admin, text, now }) {
    route('get', '/campanias', async (req, res) => {
      const usuario = await current(req, 'referidos');
      res.json({
        provincias: provinciasCobertura(),
        items: await this.listar(usuario.provincia, usuario.rol !== 'ADMIN'),
      });
    });
    route('post', '/campanias', async (req, res) => {
      const usuario = await admin(req, 'referidos');
      await this.guardar(req, usuario, null, new Campania(req.body, text));
      res.status(201).json({ ok: true });
    });
    route('put', '/campanias/:id', async (req, res) => {
      const usuario = await admin(req, 'referidos');
      await this.guardar(
        req,
        usuario,
        req.params.id,
        new Campania(req.body, text),
      );
      res.json({ ok: true });
    });
    route('patch', '/campanias/:id/estado', async (req, res) => {
      const usuario = await admin(req, 'referidos');
      await this.cambiarEstado(
        req,
        usuario,
        req.params.id,
        req.body.estado,
        now(),
      );
      res.json({ ok: true });
    });
  }
}
