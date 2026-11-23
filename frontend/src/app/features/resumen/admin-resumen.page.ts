import { DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SessionStore } from '../../core/auth/session.store';
import { Tablero } from '../../core/models/domain';
import { IconComponent } from '../../shared/icon/icon.component';

@Component({
  selector: 'app-admin-resumen',
  imports: [RouterLink, IconComponent, DecimalPipe],
  templateUrl: './admin-resumen.page.html',
  styleUrl: './admin-resumen.page.css',
})
export class AdminResumenPage implements OnInit {
  private readonly http = inject(HttpClient);
  protected readonly session = inject(SessionStore);
  protected readonly nombre = computed(() => this.session.usuario()?.nombre.trim().split(/\s+/)[0]);
  private readonly tablero = signal<Tablero | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal(false);
  protected readonly tarjetas = computed(() => [
    {
      icono: 'usuarios',
      etiqueta: 'Usuarios registrados',
      valor: this.tablero()?.usuariosRegistrados,
      tono: 'amarillo',
      futuro: false,
    },
    {
      icono: 'referidos',
      etiqueta: 'Referidos aprobados',
      valor: this.tablero()?.estados.APROBADO,
      tono: 'marino',
      futuro: false,
    },
    { icono: 'campania', etiqueta: 'Campañas activas', valor: 0, tono: 'azul', futuro: true },
    {
      icono: 'capas',
      etiqueta: 'Contenidos publicados',
      valor: 0,
      tono: 'blanco',
      futuro: true,
    },
  ]);

  ngOnInit(): void {
    void this.cargarIndicadores();
  }

  protected async cargarIndicadores(): Promise<void> {
    this.cargando.set(true);
    this.error.set(false);
    try {
      this.tablero.set(await firstValueFrom(this.http.get<Tablero>('/api/indicadores')));
    } catch {
      this.error.set(true);
    } finally {
      this.cargando.set(false);
    }
  }
  protected readonly actividad = [
    { icono: 'campania', texto: 'Se creó la campaña «Referidos 2026»', hora: 'Hace 2 h' },
    { icono: 'game', texto: 'Se publicó el juego «Trivia financiera»', hora: 'Hace 5 h' },
    { icono: 'book', texto: 'Se programó el taller «Finanzas personales»', hora: 'Hace 8 h' },
    { icono: 'post', texto: 'Se aprobó una nueva publicación', hora: 'Hace 12 h' },
  ];
  protected readonly pendientes = [
    { icono: 'post', texto: 'Contenido por moderar', cantidad: 5 },
    { icono: 'campania', texto: 'Campañas por revisar', cantidad: 2 },
    { icono: 'book', texto: 'Inscripciones a talleres', cantidad: 3 },
    { icono: 'usuarios', texto: 'Referidos por aprobar', cantidad: 7 },
  ];
  protected readonly serie = [
    { fecha: '23 oct', referidos: 16, activos: 9 },
    { fecha: '30 oct', referidos: 23, activos: 12 },
    { fecha: '6 nov', referidos: 27, activos: 16 },
    { fecha: '13 nov', referidos: 34, activos: 20 },
    { fecha: '20 nov', referidos: 42, activos: 24 },
  ];
  protected readonly trazos = (['referidos', 'activos'] as const).map((campo) => {
    const puntos = this.serie.map((fila, i) => ({
      x: 5 + (90 * i) / (this.serie.length - 1),
      y: 100 - 2 * fila[campo],
    }));
    const borde = puntos.map(({ x, y }) => `${x}% ${y}%`).join(', ');
    const retorno = [...puntos]
      .reverse()
      .map(({ x, y }) => `${x}% ${y + 1.5}%`)
      .join(', ');
    return {
      campo,
      puntos,
      linea: `polygon(${borde}, ${retorno})`,
      area: `polygon(5% 100%, ${borde}, 95% 100%)`,
    };
  });
}
