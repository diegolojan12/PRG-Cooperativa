import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { Interfaz, Modulo } from '../models/domain';
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
  // El módulo viene del data de la ruta o del parámetro :modulo (módulos aún sin pantalla).
  const modulo = (route.data['modulo'] ?? route.params['modulo']) as Modulo;
  return session.puede(modulo)
    ? true
    : router.createUrlTree(['/panel/acceso-denegado']);
};

/** Elige entre rutas hermanas según el alcance del rol (administrador vs. resto). Sin nombres de rol fijos. */
export const esAdminMatch =
  (esperado: boolean): CanMatchFn =>
  async () => {
    const session = inject(SessionStore);
    const usuario = await session.cargar();
    return !!usuario && usuario.esAdmin === esperado;
  };

/** Elige la experiencia (red social o panel) que el rol tiene configurada (HU-002). */
export const interfazMatch =
  (interfaz: Interfaz): CanMatchFn =>
  async () => {
    const session = inject(SessionStore);
    const usuario = await session.cargar();
    return !!usuario && usuario.interfaz === interfaz;
  };
