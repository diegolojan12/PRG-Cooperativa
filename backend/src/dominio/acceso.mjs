import {
  createHash,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from 'node:crypto';

export function errorDeDominio(message, status = 400, campos) {
  return Object.assign(new Error(message), { status, campos });
}

export class Rol {
  static nombres = Object.freeze(['ADMIN', 'GESTOR', 'SOCIO']);
  constructor(nombre) {
    if (!Rol.nombres.includes(nombre))
      throw errorDeDominio('Rol no válido.', 400, {
        rol: 'Elige uno de los 3 roles.',
      });
    this.nombre = nombre;
  }
  get requiereSegundoFactor() {
    return this.nombre === 'ADMIN';
  }
  asignarA(usuario) {
    usuario.rol = this.nombre;
  }
}

export class Usuario {
  constructor({
    id,
    nombre,
    correo,
    rol,
    activo,
    celular,
    creadoEn,
    cuentaEstado,
  }) {
    const cuentaVerificada = CuentaCooperativa.estaAprobada(cuentaEstado);
    Object.assign(this, {
      id,
      nombre,
      correo,
      rol,
      activo: Boolean(activo),
      celular,
      creadoEn,
      cuentaVerificada,
      cuentaEstado: cuentaVerificada
        ? 'APROBADO'
        : cuentaEstado === 'RECHAZADA'
          ? 'RECHAZADO'
          : (cuentaEstado ?? null),
    });
  }
}

export class CodigoVerificacion {
  static huella(valor) {
    return createHash('sha256').update(valor).digest('hex');
  }
  static segundoFactor() {
    return String(randomInt(1_000_000)).padStart(6, '0');
  }
  static token() {
    return randomBytes(32).toString('hex');
  }
  constructor(huella, expira, usado = false) {
    Object.assign(this, { huella, expira, usado });
  }
  esValido(valor, ahora = new Date(), firmar = CodigoVerificacion.huella) {
    const esperado = Buffer.from(this.huella, 'hex');
    const recibido = Buffer.from(firmar(valor), 'hex');
    return (
      !this.usado &&
      new Date(this.expira) > ahora &&
      esperado.length === recibido.length &&
      timingSafeEqual(esperado, recibido)
    );
  }
}

export class CuentaCooperativa {
  constructor(numeroCuenta, tipoCuenta, estado = 'PENDIENTE') {
    if (
      typeof numeroCuenta !== 'string' ||
      !/^\d{10}$/.test(numeroCuenta) ||
      !['ahorros', 'corriente'].includes(tipoCuenta)
    )
      throw errorDeDominio('Revisa los datos de la cuenta.', 400, {
        cuenta: 'Elige el tipo de cuenta e ingresa exactamente 10 dígitos.',
      });
    Object.assign(this, { numeroCuenta, tipoCuenta, estado });
  }
  static estaAprobada(estado) {
    return estado === 'APROBADA' || estado === 'APROBADO';
  }
  aprobar(fechaRevision) {
    this.#dictaminar('APROBADO', fechaRevision);
  }
  rechazar(motivo, fechaRevision) {
    if (!motivo)
      throw errorDeDominio('Indica el motivo del rechazo.', 400, {
        motivo: 'Escribe el motivo del rechazo.',
      });
    this.#dictaminar('RECHAZADO', fechaRevision);
    this.motivo = motivo;
  }
  #dictaminar(estado, fechaRevision) {
    if (this.estado !== 'PENDIENTE')
      throw errorDeDominio('Solo se pueden verificar cuentas pendientes.', 409);
    Object.assign(this, { estado, fechaRevision });
  }
  numeroEnmascarado() {
    return '******' + this.numeroCuenta.slice(-4);
  }
}
export class AvisoPrivacidad {
  static vigente() {
    const {
      SUMA_AVISO_VERSION: version,
      SUMA_TERMINOS: terminos,
      SUMA_PRIVACIDAD: privacidad,
    } = process.env;
    if (
      version &&
      /^\d+(?:\.\d+)*$/.test(version) &&
      terminos?.trim() &&
      privacidad?.trim()
    )
      return new AvisoPrivacidad(version, terminos.trim(), privacidad.trim());
    if (
      process.env.NODE_ENV !== 'production' &&
      !version &&
      !terminos &&
      !privacidad
    )
      return new AvisoPrivacidad(
        '0.1',
        'Entorno académico de prueba. Usa datos ficticios.',
        'SUMA guarda los datos de prueba para gestionar el acceso y la vinculación de cuentas.',
      );
    throw errorDeDominio(
      'El registro está pendiente de publicar los términos y el aviso de privacidad.',
      503,
    );
  }
  constructor(version, terminos, privacidad) {
    Object.assign(this, { version, terminos, privacidad });
  }
}

export class AceptacionTerminos {
  constructor(aviso, aceptado, version, fecha) {
    if (aceptado !== true || version !== aviso.version)
      throw errorDeDominio(
        'Revisa y acepta los términos y el aviso vigente.',
        400,
        {
          aceptaTerminos:
            'Abre los textos vigentes y marca la casilla de aceptación.',
        },
      );
    this.version = version;
    this.fecha = fecha;
  }
}
