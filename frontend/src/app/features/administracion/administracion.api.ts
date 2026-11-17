import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  Actividad,
  Configuracion,
  CuentaPendiente,
  Modulo,
  ModuloCatalogo,
  OpcionRol,
  OpcionesActividad,
  Pagina,
  Rol,
  RolPermiso,
  Usuario,
} from '../../core/models/domain';

/** RF-47-4: estado de los términos y el aviso de privacidad publicados. */
export interface EstadoAviso {
  vigente: { version: string; terminos: string; privacidad: string } | null;
  historial: { version: string; vigente: boolean; publicadoEn: string | null }[];
  aceptaciones: number;
}

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
  opcionesRol() {
    return this.http.get<OpcionRol[]>('/api/roles/opciones');
  }
  modulos() {
    return this.http.get<ModuloCatalogo[]>('/api/modulos');
  }
  crearRol(datos: {
    clave: string;
    nombre: string;
    descripcion: string;
    interfaz: string;
    requiereSegundoFactor: boolean;
  }) {
    return this.http.post<RolPermiso>('/api/roles', datos);
  }
  eliminarRol(rol: Rol) {
    return this.http.delete<{ ok: true }>(`/api/roles/${rol}`);
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
  avisoPrivacidad() {
    return this.http.get<EstadoAviso>('/api/configuracion/aviso');
  }
  publicarAviso(datos: { version: string; terminos: string; privacidad: string }) {
    return this.http.post<{ version: string }>('/api/configuracion/aviso', datos);
  }
  actividad(f: FiltroActividad) {
    return this.http.get<Pagina<Actividad>>('/api/actividad', { params: params(f) });
  }
  opcionesActividad() {
    return this.http.get<OpcionesActividad>('/api/actividad/opciones');
  }
}
