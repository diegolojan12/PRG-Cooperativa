import { CuentaCooperativa, errorDeDominio } from './acceso.mjs';

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
}
