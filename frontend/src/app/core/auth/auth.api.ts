import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  AvisoPrivacidad,
  DesafioConfirmacion,
  EstadoReferido,
  RespuestaLogin,
  Usuario,
} from '../models/domain';

export interface NuevoSocio {
  nombre: string;
  correo: string;
  celular: string;
  clave: string;
  confirmacionClave: string;
  aceptaTerminos: boolean;
  versionAviso: string;
  cuenta?: string;
  codigoReferido?: string;
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
    return this.http.post<DesafioConfirmacion>('/api/auth/register', datos);
  }
  avisoPrivacidad() {
    return this.http.get<AvisoPrivacidad>('/api/auth/aviso-privacidad');
  }
  confirmarCorreo(token: string, codigo: string) {
    return this.http.post<{ ok: true }>('/api/auth/confirmar-correo', {
      token,
      codigo,
    });
  }
  reenviarConfirmacion(token: string) {
    return this.http.post<{ ok: true; devCodigo?: string }>('/api/auth/reenviar-confirmacion', {
      token,
    });
  }
  cuentaVinculada(mostrar = false) {
    return this.http.get<{ numero: string; tipo: string; estado: EstadoReferido } | null>(
      '/api/auth/cuenta',
      { params: mostrar ? { mostrar: '1' } : {} },
    );
  }
  vincularCuenta(datos: { cuenta: string; tipoCuenta: string }) {
    return this.http.post<{ cuentaEstado: 'PENDIENTE'; cuentaVerificada: false }>(
      '/api/auth/cuenta',
      datos,
    );
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
