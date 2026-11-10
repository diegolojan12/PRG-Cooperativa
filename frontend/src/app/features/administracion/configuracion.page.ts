import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { leerError } from '../../core/http/api-error';
import { Configuracion } from '../../core/models/domain';
import { AvisoService } from '../../core/ui/aviso.service';
import { CampoComponent } from '../../shared/campo/campo.component';
import { IconComponent } from '../../shared/icon/icon.component';
import { MENSAJE_SIN_CODIGO, emailPattern, sinCodigo } from '../../shared/validacion';
import { AdministracionApi } from './administracion.api';

/** RF-14-1: numéricos solo enteros; textos hasta 500 caracteres. */
export const TEXTO_MAX = 500;
export const PUNTOS_MAX = 10000;

@Component({
  selector: 'app-configuracion-page',
  imports: [ReactiveFormsModule, CampoComponent, IconComponent],
  templateUrl: './configuracion.page.html',
})
export class ConfiguracionPage implements OnInit {
  private api = inject(AdministracionApi);
  private avisos = inject(AvisoService);
  private fb = inject(FormBuilder).nonNullable;
  readonly textoMax = TEXTO_MAX;
  readonly puntosMax = PUNTOS_MAX;
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly ocupado = signal(false);
  readonly enviado = signal(false);
  readonly erroresServidor = signal<Record<string, string>>({});

  readonly form = this.fb.group({
    contacto: ['', [Validators.required, Validators.pattern(emailPattern)]],
    mensajeBienvenida: ['', [Validators.required, Validators.maxLength(TEXTO_MAX), sinCodigo]],
    puntosReferido: [
      null as number | null,
      [Validators.required, Validators.pattern(/^\d+$/), Validators.max(PUNTOS_MAX)],
    ],
    registroAbierto: ['true' as Configuracion['registroAbierto']],
  });

  ngOnInit(): void {
    void this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set('');
    try {
      const config = await firstValueFrom(this.api.configuracion());
      this.form.reset({
        contacto: config.contacto,
        mensajeBienvenida: config.mensajeBienvenida,
        puntosReferido: Number(config.puntosReferido),
        registroAbierto: config.registroAbierto,
      });
    } catch (error) {
      this.error.set(leerError(error).mensaje);
    } finally {
      this.cargando.set(false);
    }
  }

  errorDe(campo: 'contacto' | 'mensajeBienvenida' | 'puntosReferido'): string | null {
    const servidor = this.erroresServidor()[campo];
    if (servidor) return servidor;
    const c = this.form.controls[campo];
    if (!this.enviado() || c.valid) return null;
    switch (campo) {
      case 'contacto':
        return 'Escribe un correo completo, por ejemplo soporte@cooperativa.ec.';
      case 'mensajeBienvenida':
        if (c.hasError('codigo')) return MENSAJE_SIN_CODIGO;
        return c.hasError('maxlength')
          ? `Acorta el mensaje a ${TEXTO_MAX} caracteres como máximo.`
          : 'Escribe un saludo para el panel de la comunidad.';
      case 'puntosReferido':
        return c.hasError('pattern')
          ? 'Usa solo números enteros, sin decimales ni signos. Por ejemplo 100.'
          : `Escribe un número entero entre 0 y ${PUNTOS_MAX}.`;
    }
  }

  async guardar(): Promise<void> {
    this.enviado.set(true);
    this.erroresServidor.set({});
    if (this.form.invalid || this.ocupado()) return;
    this.ocupado.set(true);
    try {
      const datos = this.form.getRawValue();
      await firstValueFrom(
        this.api.guardarConfiguracion({
          ...datos,
          puntosReferido: String(datos.puntosReferido ?? ''),
        }),
      );
      this.enviado.set(false);
      this.avisos.exito('Configuración guardada. Cada cambio quedó en el registro de actividad.');
    } catch (error) {
      const e = leerError(error);
      this.erroresServidor.set(e.campos);
      this.avisos.error(e.mensaje);
    } finally {
      this.ocupado.set(false);
    }
  }
}
