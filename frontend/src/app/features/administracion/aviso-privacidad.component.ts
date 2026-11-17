import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { leerError } from '../../core/http/api-error';
import { AvisoService } from '../../core/ui/aviso.service';
import { CampoComponent } from '../../shared/campo/campo.component';
import { IconComponent } from '../../shared/icon/icon.component';
import { MENSAJE_SIN_CODIGO, sinCodigo } from '../../shared/validacion';
import { AdministracionApi, EstadoAviso } from './administracion.api';

type CampoAviso = 'version' | 'terminos' | 'privacidad';

/**
 * RF-47-4 · CU-19: el administrador publica una nueva versión numerada de los términos y del
 * aviso de privacidad. Queda exactamente 1 vigente y el registro exige aceptarla (RF-47-1).
 */
@Component({
  selector: 'app-aviso-privacidad-admin',
  imports: [ReactiveFormsModule, CampoComponent, IconComponent],
  template: `
    <section class="s-card s-settings" aria-labelledby="avisoTitulo">
      <div class="s-card-heading">
        <div>
          <h2 id="avisoTitulo">Términos y aviso de privacidad</h2>
          <p>
            @if (estado()?.vigente; as vigente) {
              Versión vigente: <strong>{{ vigente.version }}</strong> ·
              {{ estado()?.aceptaciones }} aceptaciones registradas.
            } @else {
              Aún no hay una versión publicada.
            }
          </p>
        </div>
        <app-icon name="configuracion" />
      </div>
      <form [formGroup]="form" (ngSubmit)="publicar()" novalidate>
        <app-campo
          para="avisoVersion"
          etiqueta="Nueva versión"
          ayuda="Número mayor que la versión vigente, por ejemplo 1.1."
          [requerido]="true"
          [error]="errorDe('version')"
        >
          <input
            id="avisoVersion"
            formControlName="version"
            inputmode="decimal"
            aria-describedby="avisoVersion-ayuda avisoVersion-error"
            [attr.aria-invalid]="!!errorDe('version')"
          />
        </app-campo>
        <app-campo
          para="avisoTerminos"
          etiqueta="Términos de uso"
          ayuda="Texto completo que la persona acepta al registrarse. Mínimo 20 caracteres."
          [requerido]="true"
          [error]="errorDe('terminos')"
        >
          <textarea
            id="avisoTerminos"
            rows="5"
            formControlName="terminos"
            aria-describedby="avisoTerminos-ayuda avisoTerminos-error"
            [attr.aria-invalid]="!!errorDe('terminos')"
          ></textarea>
        </app-campo>
        <app-campo
          para="avisoPrivacidad"
          etiqueta="Aviso de privacidad"
          ayuda="Explica qué datos se guardan y para qué. Mínimo 20 caracteres."
          [requerido]="true"
          [error]="errorDe('privacidad')"
        >
          <textarea
            id="avisoPrivacidad"
            rows="5"
            formControlName="privacidad"
            aria-describedby="avisoPrivacidad-ayuda avisoPrivacidad-error"
            [attr.aria-invalid]="!!errorDe('privacidad')"
          ></textarea>
        </app-campo>
        <button class="s-primary" type="submit" [disabled]="ocupado()">
          {{ ocupado() ? 'Publicando…' : 'Publicar nueva versión' }}<app-icon name="check" />
        </button>
      </form>
    </section>
  `,
})
export class AvisoPrivacidadAdminComponent implements OnInit {
  private api = inject(AdministracionApi);
  private avisos = inject(AvisoService);
  private fb = inject(FormBuilder).nonNullable;
  readonly estado = signal<EstadoAviso | null>(null);
  readonly ocupado = signal(false);
  readonly enviado = signal(false);
  readonly erroresServidor = signal<Record<string, string>>({});
  readonly form = this.fb.group({
    version: ['', [Validators.required, Validators.pattern(/^\d+(?:\.\d+)*$/)]],
    terminos: ['', [Validators.required, Validators.minLength(20), sinCodigo]],
    privacidad: ['', [Validators.required, Validators.minLength(20), sinCodigo]],
  });

  ngOnInit(): void {
    void this.cargar();
  }

  async cargar(): Promise<void> {
    try {
      const estado = await firstValueFrom(this.api.avisoPrivacidad());
      this.estado.set(estado);
      if (estado.vigente)
        this.form.patchValue({
          terminos: estado.vigente.terminos,
          privacidad: estado.vigente.privacidad,
        });
    } catch (error) {
      this.avisos.error(leerError(error).mensaje);
    }
  }

  errorDe(campo: CampoAviso): string | null {
    const servidor = this.erroresServidor()[campo];
    if (servidor) return servidor;
    const c = this.form.controls[campo];
    if (!this.enviado() || c.valid) return null;
    if (c.hasError('codigo')) return MENSAJE_SIN_CODIGO;
    if (campo === 'version') return 'Usa números separados por puntos, por ejemplo 1.1.';
    return 'Escribe el texto completo, de al menos 20 caracteres.';
  }

  async publicar(): Promise<void> {
    this.enviado.set(true);
    this.erroresServidor.set({});
    if (this.form.invalid || this.ocupado()) return;
    this.ocupado.set(true);
    try {
      const { version } = await firstValueFrom(this.api.publicarAviso(this.form.getRawValue()));
      this.enviado.set(false);
      this.form.controls.version.reset('');
      this.avisos.exito(`Versión ${version} publicada. Los nuevos registros deberán aceptarla.`);
      await this.cargar();
    } catch (error) {
      const e = leerError(error);
      this.erroresServidor.set(e.campos);
      this.avisos.error(e.mensaje);
    } finally {
      this.ocupado.set(false);
    }
  }
}
