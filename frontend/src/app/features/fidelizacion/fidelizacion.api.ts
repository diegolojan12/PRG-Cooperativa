import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { DesafioConfirmacion, Pagina } from '../../core/models/domain';

export interface InsigniaObtenida {
  id: string;
  nombre: string;
  imagen: string;
  fecha: string;
}
export interface PerfilPublico {
  nombre: string;
  nivel: string;
  insignias: InsigniaObtenida[];
}
export interface Perfil {
  nombre: string;
  correo: string;
  celular: string | null;
  cuentaEstado: string | null;
  provincia: string | null;
  provincias: string[];
  visibilidad: 'PRIVADO' | 'PUBLICO';
  insignias: InsigniaObtenida[];
}
export interface Nivel {
  nombre: string;
  umbral: number;
}
export interface Progreso {
  nombre: string;
  siguiente: string | null;
  faltan: number;
}
export interface Movimiento {
  clave: string;
  actividad: string;
  cantidad: number;
  tipo: 'CREDITO' | 'DEBITO';
  fecha: string;
}
export interface Saldo extends Pagina<Movimiento> {
  saldo: number;
  acumulados: number;
  nivel: Progreso;
  sinLeer: number;
}
export interface Ranking {
  id: number;
  nombre: string;
  nivel: string;
  puntos: number;
}
export interface CampaniaDatos {
  titulo: string;
  inicio: string;
  fin: string;
  provincias: string[];
  puntosSocio: number;
  puntosReferido: number;
}
export interface Campania extends CampaniaDatos {
  id: string;
  estado: 'BORRADOR' | 'ACTIVA' | 'PAUSADA' | 'FINALIZADA';
}
export interface InsigniaDatos {
  nombre: string;
  imagen: string;
  actividad: string;
  meta: number;
}
export interface Insignia extends InsigniaDatos {
  id: string;
  activa: number;
}

@Injectable({ providedIn: 'root' })
export class FidelizacionApi {
  private http = inject(HttpClient);
  perfil() {
    return this.http.get<Perfil>('/api/perfil');
  }
  guardarPerfil(datos: {
    nombre: string;
    correo: string;
    celular: string;
    provincia: string;
    claveActual: string;
    claveNueva: string;
  }) {
    return this.http.patch<{
      ok: true;
      requiereIngreso: boolean;
      confirmacion?: DesafioConfirmacion;
    }>('/api/perfil', datos);
  }
  privacidad(visibilidad: Perfil['visibilidad']) {
    return this.http.patch('/api/perfil/privacidad', { visibilidad });
  }
  baja(claveActual: string) {
    return this.http.delete('/api/perfil', { body: { claveActual } });
  }
  puntos(pagina: number) {
    return this.http.get<Saldo>('/api/puntos', { params: { pagina } });
  }
  ranking() {
    return this.http.get<Ranking[]>('/api/puntos/ranking');
  }
  publico(id: number) {
    return this.http.get<PerfilPublico>('/api/perfiles/' + id);
  }
  campanias() {
    return this.http.get<{ provincias: string[]; items: Campania[] }>('/api/campanias');
  }
  guardarCampania(id: string | null, datos: CampaniaDatos) {
    return id
      ? this.http.put('/api/campanias/' + id, datos)
      : this.http.post('/api/campanias', datos);
  }
  cambiarCampania(id: string, estado: Campania['estado']) {
    return this.http.patch('/api/campanias/' + id + '/estado', { estado });
  }
  niveles() {
    return this.http.get<Nivel[]>('/api/gamificacion/niveles');
  }
  guardarNiveles(niveles: Nivel[]) {
    return this.http.put('/api/gamificacion/niveles', { niveles });
  }
  insignias() {
    return this.http.get<Insignia[]>('/api/gamificacion/insignias');
  }
  crearInsignia(datos: InsigniaDatos) {
    return this.http.post('/api/gamificacion/insignias', datos);
  }
  inactivarInsignia(id: string) {
    return this.http.patch('/api/gamificacion/insignias/' + id + '/inactivar', {});
  }
}
