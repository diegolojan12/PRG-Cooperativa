import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SessionStore } from '../../core/auth/session.store';
import { leerError } from '../../core/http/api-error';
import { AvisoService } from '../../core/ui/aviso.service';
import { CampoComponent } from '../../shared/campo/campo.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { FidelizacionApi, Perfil } from './fidelizacion.api';

@Component({
  selector: 'app-perfil-page',
  imports: [RouterLink, ReactiveFormsModule, CampoComponent, ModalComponent],
  templateUrl: './perfil.page.html',
})
export class PerfilPage implements OnInit {
  private api = inject(FidelizacionApi);
  protected session = inject(SessionStore);
  private avisos = inject(AvisoService);
  private router = inject(Router);
  private fb = inject(FormBuilder).nonNullable;

  readonly datos = signal<Perfil | null>(null);
  readonly error = signal('');
  readonly errores = signal<Record<string, string>>({});
  readonly ocupado = signal(false);
  readonly bajaAbierta = signal(false);
  readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    correo: ['', [Validators.required, Validators.email]],
    celular: ['', [Validators.required, Validators.pattern(/^09\d{8}$/)]],
    provincia: [''],
    claveActual: ['', Validators.required],
    claveNueva: [''],
  });

  ngOnInit(): void {
    void this.cargar();
  }

  async cargar(): Promise<void> {
    this.error.set('');
    try {
      const datos = await firstValueFrom(this.api.perfil());
      this.datos.set(datos);
      this.form.reset({
        nombre: datos.nombre,
        correo: datos.correo,
        celular: datos.celular ?? '',
        provincia: datos.provincia ?? '',
      });
    } catch (e) {
      this.error.set(leerError(e).mensaje);
    }
  }

  async guardar(): Promise<void> {
    if (this.ocupado()) return;
    this.errores.set({});
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Revisa los datos y escribe tu contraseña actual.');
      return;
    }
    this.ocupado.set(true);
    this.error.set('');
    try {
      const r = await firstValueFrom(this.api.guardarPerfil(this.form.getRawValue()));
      if (r.requiereIngreso) this.session.limpiar();
      if (r.confirmacion) {
        await this.router.navigate(['/confirmar-correo'], {
          state: { confirmacion: r.confirmacion },
        });
      } else if (r.requiereIngreso) {
        await this.router.navigate(['/iniciar-sesion']);
      } else {
        this.avisos.exito('Guardamos tu perfil.');
        await this.session.refrescar();
        await this.cargar();
      }
    } catch (e) {
      const error = leerError(e);
      this.errores.set(error.campos);
      this.error.set(error.mensaje);
    } finally {
      this.ocupado.set(false);
    }
  }

  async privacidad(visibilidad: Perfil['visibilidad']): Promise<void> {
    if (this.ocupado()) return;
    this.ocupado.set(true);
    this.error.set('');
    try {
      await firstValueFrom(this.api.privacidad(visibilidad));
      this.datos.update((p) => p && { ...p, visibilidad });
      this.avisos.exito('Guardamos tu visibilidad.');
    } catch (e) {
      this.error.set(leerError(e).mensaje);
    } finally {
      this.ocupado.set(false);
    }
  }

  async baja(clave: string): Promise<void> {
    if (this.ocupado()) return;
    this.ocupado.set(true);
    this.error.set('');
    try {
      await firstValueFrom(this.api.baja(clave));
      this.session.limpiar();
      await this.router.navigate(['/iniciar-sesion']);
    } catch (e) {
      this.error.set(leerError(e).mensaje);
    } finally {
      this.ocupado.set(false);
    }
  }
}
