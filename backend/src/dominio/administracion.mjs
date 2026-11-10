import { errorDeDominio } from './acceso.mjs';

export class ParametroGlobal {
  constructor(nombre, valor) {
    Object.assign(this, { nombre, valor });
  }
  actualizar(valor) {
    const nuevo =
      typeof valor === 'string' || typeof valor === 'number'
        ? String(valor).trim()
        : '';
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

/** Crédito del socio por un referido aprobado, con el valor vigente al aprobar. */
export class MovimientoPuntos {
  constructor(referidoId, usuarioId, cantidad, fecha) {
    if (!Number.isSafeInteger(cantidad) || cantidad < 0 || cantidad > 10000)
      throw errorDeDominio('El parámetro de puntos no es válido.', 409);
    Object.assign(this, { referidoId, usuarioId, cantidad, fecha });
  }
}
