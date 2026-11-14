import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  Asociables,
  EstadoReferido,
  NuevoReferido,
  PaginaReferidos,
  Referido,
} from '../../core/models/domain';

export interface FiltroReferidos {
  pagina: number;
  estado?: EstadoReferido | '';
  desde?: string;
  hasta?: string;
  buscar?: string;
  campania?: string;
  provincia?: string;
}

export const POR_PAGINA_REFERIDOS = 20; // RF-11-3

const params = (f: Partial<FiltroReferidos>) => {
  let result = new HttpParams();
  for (const [clave, valor] of Object.entries(f))
    if (valor !== undefined && valor !== null && valor !== '')
      result = result.set(clave, String(valor));
  return result;
};

@Injectable({ providedIn: 'root' })
export class ReferidosApi {
  private http = inject(HttpClient);

  listar(f: FiltroReferidos) {
    return this.http.get<PaginaReferidos>('/api/referidos', {
      params: params(f).set('porPagina', POR_PAGINA_REFERIDOS),
    });
  }
  exportar(f: FiltroReferidos) {
    const filtros: Partial<FiltroReferidos> = { ...f };
    delete filtros.pagina;
    return this.http.get<Referido[]>('/api/referidos/exportar', { params: params(filtros) });
  }
  crear(datos: NuevoReferido) {
    return this.http.post<Referido>('/api/referidos', datos);
  }
  editar(id: number, datos: NuevoReferido) {
    return this.http.patch<{ ok: true }>(`/api/referidos/${id}`, datos);
  }
  dictaminar(id: number, estado: Exclude<EstadoReferido, 'PENDIENTE'>) {
    return this.http.patch<{ ok: true }>(`/api/referidos/${id}/dictamen`, { estado });
  }
  darDeBaja(id: number, motivo: string) {
    return this.http.patch<{ ok: true }>(`/api/referidos/${id}/baja`, { motivo });
  }
  asociables() {
    return this.http.get<Asociables>('/api/referidos/asociables');
  }
  asociar(usuarioId: number, socioId: number) {
    return this.http.post<Referido>('/api/referidos/asociar', { usuarioId, socioId });
  }
}
