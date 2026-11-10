import { randomUUID } from 'node:crypto';
import { errorDeDominio as error } from './acceso.mjs';

export const LOGROS = Object.freeze([
  'REFERIDO',
  'CAPACITACION',
  'RETO',
  'TRIVIA',
  'TALLER',
]);

export class Nivel {
  static validar(niveles, texto) {
    if (!Array.isArray(niveles) || niveles.length < 2 || niveles.length > 10)
      throw error('Define entre dos y diez niveles.');
    const datos = niveles.map((nivel) => ({
      nombre: texto(nivel?.nombre, 60, 'nombre'),
      umbral: nivel?.umbral,
    }));
    if (
      datos[0].umbral !== 0 ||
      datos.some(
        (n, i) =>
          !n.nombre ||
          !Number.isSafeInteger(n.umbral) ||
          n.umbral < 0 ||
          (i && n.umbral <= datos[i - 1].umbral),
      )
    )
      throw error(
        'El primer nivel inicia en cero. Los siguientes umbrales deben ser enteros y crecientes.',
      );
    return datos;
  }

  static calcular(niveles, acumulados) {
    const indice = niveles.findIndex((n) => n.umbral > acumulados);
    const actual = niveles[indice < 0 ? niveles.length - 1 : indice - 1];
    const siguiente = niveles[indice] ?? null;
    return {
      nombre: actual.nombre,
      siguiente: siguiente?.nombre ?? null,
      faltan: siguiente ? siguiente.umbral - acumulados : 0,
    };
  }
}

export class Insignia {
  constructor(body, texto) {
    const nombre = texto(body.nombre, 80, 'nombre');
    const imagen = texto(body.imagen, 400, 'imagen');
    const { actividad, meta } = body;
    if (!nombre || !/^(?:https:\/\/|\/(?!\/))[^\s]+$/.test(imagen))
      throw error(
        'Ingresa un nombre y una URL HTTPS o ruta local para la imagen.',
      );
    if (!LOGROS.includes(actividad) || !Number.isSafeInteger(meta) || meta < 1)
      throw error('Selecciona un logro válido y una meta entera positiva.');
    Object.assign(this, { id: randomUUID(), nombre, imagen, actividad, meta });
  }
}

export class Gamificacion {
  constructor(db, notify) {
    this.db = db;
    this.notify = notify;
  }

  async niveles(client) {
    const [fila] = await this.db.query(
      'SELECT valor FROM "Configuracion" WHERE clave=$1',
      ['niveles'],
      client,
    );
    return JSON.parse(fila.valor);
  }

  async saldo(usuarioId, client) {
    const [fila] = await this.db.query(
      `SELECT COALESCE(SUM(CASE WHEN tipo='CREDITO' THEN cantidad ELSE -cantidad END),0) AS saldo,
       COALESCE(SUM(CASE WHEN tipo='CREDITO' THEN cantidad ELSE 0 END),0) AS acumulados
       FROM "MovimientoPuntos" WHERE "usuarioId"=$1`,
      [usuarioId],
      client,
    );
    return { saldo: Number(fila.saldo), acumulados: Number(fila.acumulados) };
  }

  async resumen(usuarioId) {
    const [puntos, niveles] = await Promise.all([
      this.saldo(usuarioId),
      this.niveles(),
    ]);
    const [{ total }] = await this.db.query(
      'SELECT COUNT(*) AS total FROM "Notificacion" WHERE "usuarioId"=$1 AND leida=$2',
      [usuarioId, false],
    );
    return {
      ...puntos,
      nivel: Nivel.calcular(niveles, puntos.acumulados),
      sinLeer: Number(total),
    };
  }

  async obtenidas(usuarioId) {
    return this.db.query(
      `SELECT i.id,i.nombre,i.imagen,o.fecha FROM "InsigniaObtenida" o JOIN "Insignia" i ON i.id=o."insigniaId"
       WHERE o."usuarioId"=$1 ORDER BY o.fecha DESC,i.id`,
      [usuarioId],
    );
  }

  async otorgar(usuarioId, insignia, fecha, client) {
    const [ganada] = await this.db.query(
      `INSERT INTO "InsigniaObtenida" ("usuarioId","insigniaId",fecha)
       VALUES ($1,$2,$3) ON CONFLICT DO NOTHING RETURNING "insigniaId"`,
      [usuarioId, insignia.id, fecha],
      client,
    );
    if (ganada)
      await this.notify(
        usuarioId,
        'Nueva insignia',
        'Ganaste «' + insignia.nombre + '».',
        client,
      );
  }

  async registrar(usuarioId, actividad, evento, fecha, client) {
    if (!LOGROS.includes(actividad) || !client)
      throw new Error('El logro requiere un evento válido y una transacción.');
    if (!this.db.sqlite)
      await this.db.query(
        'SELECT pg_advisory_xact_lock(15274009,$1)',
        [usuarioId],
        client,
      );
    const [registrado] = await this.db.query(
      `INSERT INTO "EventoLogro" ("usuarioId",actividad,evento,fecha)
       VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING RETURNING evento`,
      [usuarioId, actividad, String(evento), fecha],
      client,
    );
    if (!registrado) return;
    const [{ total }] = await this.db.query(
      'SELECT COUNT(*) AS total FROM "EventoLogro" WHERE "usuarioId"=$1 AND actividad=$2',
      [usuarioId, actividad],
      client,
    );
    const insignias = await this.db.query(
      'SELECT id,nombre FROM "Insignia" WHERE actividad=$1 AND activa=1 AND meta<=$2',
      [actividad, Number(total)],
      client,
    );
    for (const insignia of insignias)
      await this.otorgar(usuarioId, insignia, fecha, client);
    await this.alEvento?.(usuarioId, actividad, fecha, client);
  }

  rutas({ route, current, admin, text, now, pagina, log }) {
    route('get', '/puntos', async (req, res) => {
      const u = await current(req, 'panel');
      const actual = pagina(req.query.pagina);
      const [resumen, [{ total }], items] = await Promise.all([
        this.resumen(u.id),
        this.db.query(
          'SELECT COUNT(*) AS total FROM "MovimientoPuntos" WHERE "usuarioId"=$1',
          [u.id],
        ),
        this.db.query(
          `SELECT clave,actividad,cantidad,tipo,fecha FROM "MovimientoPuntos"
           WHERE "usuarioId"=$1 ORDER BY fecha DESC,clave LIMIT 20 OFFSET $2`,
          [u.id, (actual - 1) * 20],
        ),
      ]);
      res.json({
        ...resumen,
        items,
        total: Number(total),
        pagina: actual,
        porPagina: 20,
      });
    });
    route('get', '/puntos/ranking', async (req, res) => {
      await current(req, 'panel');
      const [niveles, filas] = await Promise.all([
        this.niveles(),
        this.db.query(
          `SELECT u.id,u.nombre,COALESCE(SUM(m.cantidad),0) AS acumulados FROM "Usuario" u
           LEFT JOIN "MovimientoPuntos" m ON m."usuarioId"=u.id AND m.tipo='CREDITO'
           WHERE u.activo=$1 AND u."correoVerificado"=$1 AND u.rol='SOCIO' AND u.visibilidad='PUBLICO'
           GROUP BY u.id,u.nombre ORDER BY acumulados DESC,u.id LIMIT 10`,
          [true],
        ),
      ]);
      res.json(
        filas.map((u) => ({
          id: u.id,
          nombre: u.nombre.trim().split(/\s+/)[0],
          nivel: Nivel.calcular(niveles, Number(u.acumulados)).nombre,
          puntos: Number(u.acumulados),
        })),
      );
    });
    route('get', '/perfiles/:id', async (req, res) => {
      await current(req, 'panel');
      const id = Number(req.params.id);
      if (!Number.isSafeInteger(id) || id < 1)
        throw error('Perfil no disponible.', 404);
      const [u] = await this.db.query(
        `SELECT id,nombre FROM "Usuario" WHERE id=$1 AND activo=$2 AND "correoVerificado"=$2 AND rol='SOCIO' AND visibilidad='PUBLICO'`,
        [id, true],
      );
      if (!u) throw error('Perfil no disponible.', 404);
      const { acumulados } = await this.saldo(u.id);
      res.json({
        nombre: u.nombre.trim().split(/\s+/)[0],
        nivel: Nivel.calcular(await this.niveles(), acumulados).nombre,
        insignias: await this.obtenidas(u.id),
      });
    });
    route('get', '/gamificacion/niveles', async (req, res) => {
      await admin(req, 'configuracion');
      res.json(await this.niveles());
    });
    route('put', '/gamificacion/niveles', async (req, res) => {
      const usuario = await admin(req, 'configuracion');
      const niveles = Nivel.validar(req.body.niveles, text);
      await this.db.transaction(async (client) => {
        await this.db.query(
          'UPDATE "Configuracion" SET valor=$2 WHERE clave=$1',
          ['niveles', JSON.stringify(niveles)],
          client,
        );
        await log(
          req,
          usuario,
          'Niveles actualizados',
          'Umbrales de fidelización',
          client,
          { datos: { niveles } },
        );
      });
      res.json({ ok: true });
    });
    route('get', '/gamificacion/insignias', async (req, res) => {
      await admin(req, 'configuracion');
      res.json(
        await this.db.query('SELECT * FROM "Insignia" ORDER BY nombre,id'),
      );
    });
    route('post', '/gamificacion/insignias', async (req, res) => {
      const usuario = await admin(req, 'configuracion');
      const i = new Insignia(req.body, text);
      await this.db.transaction(async (client) => {
        await this.db.query(
          'INSERT INTO "Insignia" (id,nombre,imagen,actividad,meta) VALUES ($1,$2,$3,$4,$5)',
          [i.id, i.nombre, i.imagen, i.actividad, i.meta],
          client,
        );
        const socios = await this.db.query(
          `SELECT e."usuarioId" FROM "EventoLogro" e JOIN "Usuario" u ON u.id=e."usuarioId"
           WHERE e.actividad=$1 AND u.activo=$2 GROUP BY e."usuarioId" HAVING COUNT(*)>=$3`,
          [i.actividad, true, i.meta],
          client,
        );
        for (const socio of socios)
          await this.otorgar(socio.usuarioId, i, now(), client);
        await log(req, usuario, 'Insignia creada', i.nombre, client, {
          datos: { insigniaId: i.id },
        });
      });
      res.status(201).json(i);
    });
    route(
      'patch',
      '/gamificacion/insignias/:id/inactivar',
      async (req, res) => {
        const usuario = await admin(req, 'configuracion');
        await this.db.transaction(async (client) => {
          const [i] = await this.db.query(
            'UPDATE "Insignia" SET activa=0 WHERE id=$1 AND activa=1 RETURNING id,nombre',
            [req.params.id],
            client,
          );
          if (!i)
            throw error(
              'No existe una insignia activa con ese identificador.',
              404,
            );
          await log(req, usuario, 'Insignia inactivada', i.nombre, client, {
            datos: { insigniaId: i.id },
          });
        });
        res.json({ ok: true });
      },
    );
  }
}
