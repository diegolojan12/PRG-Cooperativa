import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SessionStore } from '../auth/session.store';
import { AvisoService } from '../ui/aviso.service';

const RUTAS_AUTH = ['/api/auth/login', '/api/auth/2fa', '/api/auth/me'];

/** Distingue una sesión vencida (motivo=inactividad) de un visitante anónimo (A3). */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const session = inject(SessionStore);
  const avisos = inject(AvisoService);
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const esAuth = RUTAS_AUTH.some((ruta) => req.url.endsWith(ruta));
      if (error.status === 401 && !esAuth) {
        const habiaSesion = session.autenticado();
        session.limpiar();
        void router.navigate(['/iniciar-sesion'], {
          queryParams: habiaSesion ? { motivo: 'inactividad' } : {},
        });
      } else if (error.status === 403) {
        avisos.error(
          (error.error as { message?: string } | null)?.message ??
            'No tienes permiso para realizar esta acción.',
        );
      }
      return throwError(() => error);
    }),
  );
};
