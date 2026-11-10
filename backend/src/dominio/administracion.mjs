import { errorDeDominio } from './acceso.mjs';

export const PUNTOS_POR_ACCION = Object.freeze({
  puntosCapacitacion: 'Capacitación aprobada',
  puntosTrivia: 'Partida de trivia',
  puntosTaller: 'Asistencia a taller',
  puntosReto: 'Reto cumplido',
});

export class ParametroGlobal {
  constructor(nombre, valor) {
    Object.assign(this, { nombre, valor });
  }
  actualizar(valor) {
    const nuevo =
      typeof valor === 'string' || typeof valor === 'number'
        ? String(valor).trim()
        : '';
    if (this.nombre === 'valorPunto') {
      if (!/^\d{1,8}(?:\.\d{1,2})?$/.test(nuevo))
        throw errorDeDominio(
          'Ingresa un valor en dólares con hasta dos decimales.',
          400,
          {
            valorPunto: 'Ejemplo: 0.25.',
          },
        );
      this.valor = Number(nuevo).toFixed(2);
    } else {
      if (!/^\d{1,5}$/.test(nuevo) || Number(nuevo) > 10000)
        throw errorDeDominio(
          'Los puntos deben ser un número entero entre 0 y 10000.',
          400,
          {
            [this.nombre]:
              'Escribe un número entero sin decimales entre 0 y 10000.',
          },
        );
      this.valor = String(Number(nuevo));
    }
    return this.valor;
  }
}

export class RegistroAuditoria {
  constructor({ usuario, accion, detalle, ip, objetivoId, datos, fecha }) {
    Object.assign(this, {
      usuarioId: usuario?.id ?? null,
      actor: usuario?.nombre ?? 'Sistema',
      accion,
      detalle,
      ip: ip ?? null,
      objetivoId: objetivoId ?? null,
      datos: JSON.stringify(datos ?? {}),
      fecha,
    });
    Object.freeze(this);
  }
}

export class Notificacion {
  constructor(usuarioId, titulo, mensaje, fecha, leida = false) {
    Object.assign(this, {
      usuarioId,
      titulo,
      mensaje,
      fecha,
      leida: Boolean(leida),
    });
  }
  marcarLeida() {
    this.leida = true;
  }
}

const PARAMETRO_ACTIVIDAD = {
  REFERIDO: 'puntosReferido',
  CAPACITACION: 'puntosCapacitacion',
  TRIVIA: 'puntosTrivia',
  TALLER: 'puntosTaller',
  RETO: 'puntosReto',
};

export class MovimientoPuntos {
  constructor(usuarioId, actividad, eventoId, cantidad, fecha) {
    if (!Number.isSafeInteger(cantidad) || cantidad < 0 || cantidad > 10000)
      throw errorDeDominio('El parámetro de puntos no es válido.', 409);
    const clave = actividad.toLowerCase() + ':' + eventoId + ':' + usuarioId;
    Object.assign(this, {
      clave,
      usuarioId,
      actividad,
      cantidad,
      fecha,
      referidoId: actividad === 'REFERIDO' ? eventoId : null,
    });
  }
}

/** Invocar desde una actividad confirmada, dentro de su propia transacción. */
export class AcreditacionPuntos {
  constructor(db, notificar) {
    this.db = db;
    this.notificar = notificar;
  }

  async registrar(
    actividad,
    eventoId,
    usuarios,
    fecha,
    client,
    importes = new Map(),
  ) {
    const parametro = PARAMETRO_ACTIVIDAD[actividad];
    if (!Object.hasOwn(PARAMETRO_ACTIVIDAD, actividad) || !client)
      throw new Error(
        'La acreditación exige una actividad válida y una transacción.',
      );
    const [config] = await this.db.query(
      'SELECT valor FROM "Configuracion" WHERE clave=$1',
      [parametro],
      client,
    );
    for (const usuarioId of new Set(usuarios)) {
      const m = new MovimientoPuntos(
        usuarioId,
        actividad,
        eventoId,
        importes.get(usuarioId) ?? Number(config?.valor),
        fecha,
      );
      const [creado] = await this.db.query(
        'INSERT INTO "MovimientoPuntos" (clave,"usuarioId","referidoId",actividad,cantidad,fecha) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (clave) DO NOTHING RETURNING clave',
        [m.clave, m.usuarioId, m.referidoId, m.actividad, m.cantidad, m.fecha],
        client,
      );
      if (creado)
        await this.notificar(
          usuarioId,
          'Puntos acreditados',
          'Ganaste ' + m.cantidad + ' puntos.',
          client,
        );
    }
  }
}
