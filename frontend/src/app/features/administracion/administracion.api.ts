import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  Actividad,
  Configuracion,
  CuentaPendiente,
  Modulo,
  OpcionesActividad,
  Pagina,
  Rol,
  RolPermiso,
  Usuario,
} from '../../core/models/domain';

export interface FiltroActividad {
  pagina: number;
  desde?: string;
  hasta?: string;
  usuarioId?: number | '';
  accion?: string;
}

const params = (f: object) => {
  let result = new HttpParams();
  for (const [clave, valor] of Object.entries(f))
    if (valor !== undefined && valor !== null && valor !== '')
      result = result.set(clave, String(valor));
  return result;
};

@Injectable({ providedIn: 'root' })
export class AdministracionApi {
  private http = inject(HttpClient);

  usuarios(pagina: number, buscar: string) {
    return this.http.get<Pagina<Usuario>>('/api/usuarios', { params: params({ pagina, buscar }) });
  }
  crearUsuario(datos: { nombre: string; correo: string; rol: Rol }) {
    return this.http.post<Usuario & { devResetUrl?: string }>('/api/usuarios', datos);
  }
  actualizarUsuario(id: number, datos: { rol: Rol; activo: boolean }) {
    return this.http.patch<{ ok: true }>(`/api/usuarios/${id}`, datos);
  }
  cuentasPendientes(pagina: number) {
    return this.http.get<Pagina<CuentaPendiente>>('/api/usuarios/cuentas-pendientes', {
      params: params({ pagina }),
    });
  }
  verificarCuenta(id: number, estado: 'APROBADO' | 'RECHAZADO', motivo: string) {
    return this.http.patch<{ ok: true }>(`/api/usuarios/${id}/cuenta`, { estado, motivo });
  }
  roles() {
    return this.http.get<RolPermiso[]>('/api/roles');
  }
  guardarRol(rol: Rol, modulos: Modulo[]) {
    return this.http.put<{ ok: true }>(`/api/roles/${rol}`, { modulos });
  }
  configuracion() {
    return this.http.get<Configuracion>('/api/configuracion');
  }
  guardarConfiguracion(datos: Configuracion) {
    return this.http.put<{ ok: true }>('/api/configuracion', datos);
  }
  actividad(f: FiltroActividad) {
    return this.http.get<Pagina<Actividad>>('/api/actividad', { params: params(f) });
  }
  opcionesActividad() {
    return this.http.get<OpcionesActividad>('/api/actividad/opciones');
  }
}
