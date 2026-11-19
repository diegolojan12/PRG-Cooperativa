import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessionStore } from '../../core/auth/session.store';
import { IconComponent } from '../../shared/icon/icon.component';

/** Propuesta visual: los ejemplos no representan contenidos almacenados. */
@Component({
  selector: 'app-gestor',
  imports: [RouterLink, IconComponent],
  templateUrl: './gestor.page.html',
  styleUrl: './gestor.page.css',
})
export class GestorPage {
  private readonly session = inject(SessionStore);
  readonly nombre = computed(() => this.session.usuario()?.nombre.split(' ')[0] ?? '');
  readonly accesos = computed(() =>
    this.session
      .menu()
      .filter((item) =>
        ['aprende', 'juegos', 'publicaciones', 'retos', 'bienestar'].includes(item.id),
      ),
  );
  readonly indicadores = [
    {
      icono: 'post',
      valor: '24',
      titulo: 'Publicaciones',
      detalle: '18 publicadas · 6 borradores',
      tono: 'amarillo',
    },
    {
      icono: 'game',
      valor: '6',
      titulo: 'Juegos disponibles',
      detalle: 'Experiencias para aprender',
      tono: 'azul',
    },
    {
      icono: 'book',
      valor: '8',
      titulo: 'Capacitaciones y talleres',
      detalle: 'Aprendizaje en comunidad',
      tono: 'claro',
    },
    {
      icono: 'clock',
      valor: '5',
      titulo: 'Pendientes de revisión',
      detalle: 'Contenidos por revisar',
      tono: 'crema',
    },
  ];
  readonly contenidos = [
    {
      icono: 'book',
      titulo: 'Finanzas para tu día a día',
      tipo: 'Capacitación',
      estado: 'Publicado',
      clase: 'publicado',
      fecha: '19 nov',
    },
    {
      icono: 'game',
      titulo: 'Trivia: aprende y comparte',
      tipo: 'Juego',
      estado: 'Borrador',
      clase: 'borrador',
      fecha: '18 nov',
    },
    {
      icono: 'post',
      titulo: 'Pequeños hábitos, grandes cambios',
      tipo: 'Publicación',
      estado: 'Programado',
      clase: 'programado',
      fecha: '17 nov',
    },
  ];
}
