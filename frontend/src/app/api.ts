import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
export interface User {
  id: number;
  nombre: string;
  correo: string;
  rol: 'ADMIN' | 'SOCIO';
  activo: boolean;
  celular: string;
  modulos: string[];
}
@Injectable({ providedIn: 'root' })
export class Api {
  private http = inject(HttpClient);
  private router = inject(Router);
  async call<T = any>(method: string, path: string, body?: unknown): Promise<T> {
    try {
      return await firstValueFrom(this.http.request<T>(method, '/api' + path, { body }));
    } catch (error) {
      const e = error as HttpErrorResponse;
      if (e.status === 401 && path !== '/auth/login') {
        void this.router.navigate(['/iniciar-sesion'], { queryParams: { expired: '1' } });
      }
      const message = e.error?.message;
      throw new Error(
        (Array.isArray(message) ? message.join('. ') : message) ||
          'No se pudo conectar con el servidor. Vuelve a intentarlo.',
      );
    }
  }
}
