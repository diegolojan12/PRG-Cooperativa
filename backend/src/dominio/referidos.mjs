import { randomInt } from 'node:crypto';
import { CuentaCooperativa, errorDeDominio } from './acceso.mjs';

export class CodigoReferido {
  constructor(codigo) {
    if (typeof codigo !== 'string' || !/^[A-Z0-9]{8}$/.test(codigo))
      throw errorDeDominio(
        'El código de referido debe tener 8 letras o números.',
        400,
        {
          codigoReferido: 'Escribe el código completo o déjalo vacío.',
        },
      );
    this.codigo = codigo;
  }
  static generar() {
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return new CodigoReferido(
      Array.from({ length: 8 }, () => letras[randomInt(letras.length)]).join(
        '',
      ),
    );
  }
  enlace(origen) {
    const url = new URL('/registro', origen);
    url.searchParams.set('ref', this.codigo);
    if (
      !['https:', 'http:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.href.length > 300
    )
      throw errorDeDominio(
        'La URL oficial de invitación no está configurada correctamente.',
        503,
      );
    return url.href;
  }
}

export class Referido {
  static estados = Object.freeze(['PENDIENTE', 'APROBADO', 'RECHAZADO']);
  constructor(fila) {
    Object.assign(this, fila);
  }
  get nombreDePila() {
    return this.nombre.trim().split(/\s+/)[0];
  }
  aprobar(estadoCuenta, fechaDecision) {
    this.#dictaminar('APROBADO', fechaDecision, estadoCuenta);
  }
  rechazar(fechaDecision) {
    this.#dictaminar('RECHAZADO', fechaDecision);
  }
  #dictaminar(estado, fechaDecision, estadoCuenta) {
    if (this.estado !== 'PENDIENTE')
      throw errorDeDominio(
        'Solo se dictaminan referidos en estado Pendiente.',
        409,
      );
    if (estado === 'APROBADO' && !CuentaCooperativa.estaAprobada(estadoCuenta))
      throw errorDeDominio(
        'La cuenta vinculada del referido debe estar Aprobada.',
        409,
      );
    Object.assign(this, { estado, fechaDecision });
  }
  consultaSocio() {
    return {
      id: this.id,
      nombre: this.nombreDePila,
      creadoEn: this.creadoEn,
      estado: this.estado,
    };
  }
}
