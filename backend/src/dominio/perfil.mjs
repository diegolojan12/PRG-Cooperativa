import { errorDeDominio } from './acceso.mjs';

/**
 * Perfil que ven los demás usuarios (HU-056 · UR-51 · RF-46).
 * RF-46-1: solo existe si el dueño lo marcó Público (Privado por defecto).
 * RF-46-2: nunca incluye correo, celular ni número de cuenta.
 * RF-46-3: muestra exactamente 3 datos: nombre de pila, nivel e insignias
 * (nivel e insignias llegan en el Sprint 4, HU-031 y HU-033; hasta entonces van vacíos).
 */
export class PerfilPublico {
  static desde(fila) {
    if (!fila?.activo || !fila.perfilPublico)
      throw errorDeDominio('Este perfil es privado.', 404);
    return new PerfilPublico(fila);
  }
  constructor({ id, nombre }) {
    this.id = id;
    this.nombre = String(nombre ?? '').trim().split(/\s+/)[0];
    this.nivel = null;
    this.insignias = [];
  }
}
