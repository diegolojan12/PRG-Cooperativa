import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { Modulo, Rol } from '../models/domain';
import { SessionStore } from './session.store';

// inject() se llama siempre ANTES de cualquier await.
export const authGuard: CanActivateFn = async () => {
  const session = inject(SessionStore);
  const router = inject(Router);
  return (await session.cargar()) ? true : router.createUrlTree(['/iniciar-sesion']);
};

/** RF-08-4: rechaza el acceso a módulos que el rol no tiene, con mensaje de acceso denegado. */
export const moduloGuard: CanActivateFn = async (route) => {
  const session = inject(SessionStore);
  const router = inject(Router);
  await session.cargar();
  return session.puede(route.data['modulo'] as Modulo)
    ? true
    : router.createUrlTree(['/panel/acceso-denegado']);
};

/** Elige entre rutas hermanas según el rol (p. ej. tablero del admin vs. resumen del socio). */
export const rolMatch =
  (...roles: Rol[]): CanMatchFn =>
  async () => {
    const session = inject(SessionStore);
    const usuario = await session.cargar();
    return !!usuario && roles.includes(usuario.rol);
  };
