import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { SessionStore } from '../../core/auth/session.store';
import { leerError } from '../../core/http/api-error';
import { AvisoService } from '../../core/ui/aviso.service';
import { CampoComponent } from '../../shared/campo/campo.component';
import { Campania, FidelizacionApi } from './fidelizacion.api';

@Component({
  selector: 'app-campanias-page',
  imports: [ReactiveFormsModule, CampoComponent],
  templateUrl: './campanias.page.html',
})
export class CampaniasPage implements OnInit {
  private api = inject(FidelizacionApi);
  protected session = inject(SessionStore);
  private avisos = inject(AvisoService);
  private fb = inject(FormBuilder).nonNullable;
  readonly items = signal<Campania[]>([]);
  readonly provincias = signal<string[]>([]);
  readonly seleccion = signal<string[]>([]);
  readonly editando = signal<string | null>(null);
  readonly formulario = signal(false);
  readonly cargando = signal(true);
  readonly ocupado = signal(false);
  readonly error = signal('');
  readonly estados = {
    BORRADOR: 'Borrador',
    ACTIVA: 'Activa',
    PAUSADA: 'Pausada',
    FINALIZADA: 'Finalizada',
  };
  readonly form = this.fb.group({
    titulo: ['', [Validators.required, Validators.maxLength(100)]],
    inicio: ['', Validators.required],
    fin: ['', Validators.required],
    puntosSocio: [100, [Validators.required, Validators.min(1), Validators.max(10000)]],
    puntosReferido: [100, [Validators.required, Validators.min(1), Validators.max(10000)]],
  });

  ngOnInit(): void {
    void this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando.set(true);
    try {
      const r = await firstValueFrom(this.api.campanias());
      this.provincias.set(r.provincias);
      this.items.set(r.items);
    } catch (e) {
      this.error.set(leerError(e).mensaje);
    } finally {
      this.cargando.set(false);
    }
  }

  abrir(campania?: Campania): void {
    this.error.set('');
    this.editando.set(campania?.id ?? null);
    this.seleccion.set(campania?.provincias ?? []);
    this.form.reset(campania ?? {});
    this.formulario.set(true);
  }

  marcar(provincia: string, checked: boolean): void {
    this.seleccion.update((p) => (checked ? [...p, provincia] : p.filter((x) => x !== provincia)));
  }

  async guardar(): Promise<void> {
    const datos = this.form.getRawValue();
    if (this.form.invalid || !this.seleccion().length || datos.fin <= datos.inicio) {
      this.error.set(
        'Ingresa el título, una fecha de fin posterior a la de inicio, dos premios válidos y al menos una provincia.',
      );
      return;
    }
    await this.ejecutar(async () => {
      await firstValueFrom(
        this.api.guardarCampania(this.editando(), { ...datos, provincias: this.seleccion() }),
      );
      this.formulario.set(false);
    });
  }

  cambiar(id: string, estado: Campania['estado']): void {
    void this.ejecutar(() => firstValueFrom(this.api.cambiarCampania(id, estado)));
  }

  private async ejecutar(accion: () => Promise<unknown>): Promise<void> {
    if (this.ocupado()) return;
    this.ocupado.set(true);
    this.error.set('');
    try {
      await accion();
      this.avisos.exito('Guardamos la campaña.');
      await this.cargar();
    } catch (e) {
      this.error.set(leerError(e).mensaje);
    } finally {
      this.ocupado.set(false);
    }
  }
}
