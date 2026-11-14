import {
  createHash,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from 'node:crypto';

export function errorDeDominio(message, status = 400, campos) {
  return Object.assign(new Error(message), { status, campos });
}

export const INTERFACES = Object.freeze(['COMUNIDAD', 'ADMINISTRACION']);

const comoLista = (valor) =>
  Array.isArray(valor) ? valor : JSON.parse(valor || '[]');

/**
 * Rol del sistema (HU-001). Se construye siempre desde la fila de la tabla "Rol":
 * el código ya no conoce una lista cerrada de roles, de modo que se pueden crear
 * roles nuevos sin modificar la autorización.
 *
 * - alcanceGlobal: ve y gestiona los datos de todos los socios (rol administrador).
 * - interfaz: experiencia que recibe al entrar (COMUNIDAD = red social, ADMINISTRACION = panel).
 * - disponibles: módulos que se le pueden otorgar. obligatorios: módulos que no puede perder.
 */
export class Rol {
  constructor(fila) {
    Object.assign(this, {
      clave: fila.clave,
      nombre: fila.nombre,
      descripcion: fila.descripcion ?? '',
      sistema: Boolean(fila.sistema),
      requiereSegundoFactor: Boolean(fila.requiereSegundoFactor),
      alcanceGlobal: Boolean(fila.alcanceGlobal),
      interfaz: fila.interfaz,
      disponibles: comoLista(fila.disponibles),
      obligatorios: comoLista(fila.obligatorios),
    });
  }

  /** Valida los datos de un rol nuevo; nunca puede ser de alcance global (no escala privilegios). */
  static crear({ clave, nombre, descripcion, interfaz, requiereSegundoFactor }, catalogo) {
    if (typeof clave !== 'string' || !/^[A-Z][A-Z0-9_]{2,29}$/.test(clave))
      throw errorDeDominio('La clave del rol no es válida.', 400, {
        clave: 'Usa de 3 a 30 caracteres: mayúsculas, números y guion bajo. Ejemplo: ASESOR_COMERCIAL.',
      });
    if (typeof nombre !== 'string' || nombre.length < 3 || nombre.length > 60)
      throw errorDeDominio('El nombre del rol no es válido.', 400, {
        nombre: 'Escribe entre 3 y 60 caracteres. Ejemplo: Asesor comercial.',
      });
    if (!INTERFACES.includes(interfaz))
      throw errorDeDominio('Elige la experiencia del rol.', 400, {
        interfaz: 'Elige Comunidad (red social) o Administración (panel).',
      });
    return new Rol({
      clave,
      nombre,
      descripcion: descripcion ?? '',
      sistema: false,
      requiereSegundoFactor: requiereSegundoFactor === true,
      alcanceGlobal: false,
      interfaz,
      disponibles: catalogo.filter((m) => m.ambito === 'COMUN').map((m) => m.id),
      obligatorios: ['panel', 'ayuda'].filter((m) => catalogo.some((c) => c.id === m)),
    });
  }

  /** HU-001: valida y normaliza la lista de módulos que se quiere asignar al rol. */
  validarPermisos(modulos, catalogo) {
    if (!Array.isArray(modulos) || modulos.some((m) => typeof m !== 'string'))
      throw errorDeDominio('Permisos no válidos.');
    const existentes = new Set(catalogo.map((m) => m.id));
    if (modulos.some((m) => !existentes.has(m)))
      throw errorDeDominio('Permisos no válidos.');
    if (modulos.some((m) => !this.disponibles.includes(m)))
      throw errorDeDominio('Ese módulo no está disponible para este rol.');
    if (!this.obligatorios.every((m) => modulos.includes(m)))
      throw errorDeDominio(`El rol debe conservar: ${this.obligatorios.join(', ')}.`);
    return [...new Set(modulos)];
  }

  asignarA(usuario) {
    usuario.rol = this.clave;
  }
}

/** Módulo funcional del catálogo (HU-002). ambito ADMIN = solo roles de alcance global. */
export class Modulo {
  constructor({ id, etiqueta, grupo, icono, ambito, disponible }) {
    Object.assign(this, { id, etiqueta, grupo, icono, ambito, disponible: Boolean(disponible) });
  }
  get esDeAdministracion() {
    return this.ambito === 'ADMIN';
  }
}

/** Sesión autenticada con cierre por 15 minutos de inactividad (HU-003, RF-04-3). */
export class Sesion {
  static INACTIVIDAD_MS = 15 * 60_000;
  /** Instante en que vencerá una sesión cuya última acción ocurre en `ahora`. */
  static vencimiento(ahora = Date.now()) {
    return new Date(ahora + Sesion.INACTIVIDAD_MS).toISOString();
  }
  constructor(huella, usuarioId, expira) {
    Object.assign(this, { huella, usuarioId, expira });
  }
  estaVigente(ahora = new Date()) {
    return new Date(this.expira) > ahora;
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
