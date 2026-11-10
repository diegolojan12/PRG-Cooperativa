import { errorDeDominio as error } from './acceso.mjs';

export const HORA = 3_600_000;
export const DIA = 24 * HORA;

export function entero(n, min, max, mensaje) {
  if (!Number.isSafeInteger(n) || n < min || n > max) throw error(mensaje);
  return n;
}

export function requerido(valor, max, campo, texto) {
  const resultado = texto(valor, max, campo);
  if (!resultado)
    throw error('Completa el campo ' + campo + '.', 400, {
      [campo]: 'Este campo es obligatorio.',
    });
  return resultado;
}

export async function participante(req, current) {
  const u = await current(req, 'panel');
  if (u.rol !== 'SOCIO')
    throw error('Esta actividad es para socios y clientes.', 403);
  return u;
}

export async function gestor(req, current) {
  const u = await current(req, 'panel');
  if (!['GESTOR', 'ADMIN'].includes(u.rol))
    throw error(
      'Esta operación requiere permiso de gestión de contenidos.',
      403,
    );
  return u;
}

export async function serializarUsuario(db, usuarioId, client) {
  if (!db.sqlite)
    await db.query(
      'SELECT pg_advisory_xact_lock(15274009,$1)',
      [usuarioId],
      client,
    );
}
