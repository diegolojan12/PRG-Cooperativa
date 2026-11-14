import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { RespuestaLogin, Usuario } from '../models/domain';

export interface NuevoSocio {
  nombre: string;
  correo: string;
  celular: string;
  clave: string;
  cuenta?: string;
  tipoCuenta?: 'ahorros' | 'corriente';
}

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private http = inject(HttpClient);

  login(correo: string, clave: string) {
    return this.http.post<RespuestaLogin>('/api/auth/login', { correo, clave });
  }
  verificar2fa(desafioId: string, codigo: string) {
    return this.http.post<Usuario>('/api/auth/2fa', { desafioId, codigo });
  }
  logout() {
    return this.http.post<{ ok: true }>('/api/auth/logout', {});
  }
  registrar(datos: NuevoSocio) {
    return this.http.post<{ ok: true }>('/api/auth/register', datos);
  }
  olvido(correo: string) {
    return this.http.post<{ message: string; devResetUrl?: string }>('/api/auth/forgot', {
      correo,
    });
  }
  restablecer(token: string, clave: string) {
    return this.http.post<{ message: string }>('/api/auth/reset', { token, clave });
  }
}
