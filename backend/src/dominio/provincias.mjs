import { errorDeDominio } from './acceso.mjs';

/** Las 24 provincias del Ecuador (T-01). Las campañas elegirán entre las 8 donde opera la Cooperativa (RF-13-4). */
export const PROVINCIAS = Object.freeze([
  'Azuay', 'Bolívar', 'Cañar', 'Carchi', 'Chimborazo', 'Cotopaxi', 'El Oro', 'Esmeraldas',
  'Galápagos', 'Guayas', 'Imbabura', 'Loja', 'Los Ríos', 'Manabí', 'Morona Santiago', 'Napo',
  'Orellana', 'Pastaza', 'Pichincha', 'Santa Elena', 'Santo Domingo de los Tsáchilas',
  'Sucumbíos', 'Tungurahua', 'Zamora Chinchipe',
]);

/** Devuelve la provincia válida o falla con el campo marcado. `opcional` admite vacío. */
export function provincia(valor, { opcional = false } = {}) {
  if ((valor === undefined || valor === null || valor === '') && opcional) return null;
  if (typeof valor !== 'string' || !PROVINCIAS.includes(valor))
    throw errorDeDominio('Elige tu provincia de la lista.', 400, {
      provincia: 'Selecciona la provincia donde vives, por ejemplo Loja.',
    });
  return valor;
}
