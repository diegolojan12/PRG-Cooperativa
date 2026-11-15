import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SessionStore } from '../../core/auth/session.store';
import { leerError } from '../../core/http/api-error';
import {
  Asociables,
  ESTADOS,
  ETIQUETAS_ESTADO,
  EstadoReferido,
  PaginaReferidos,
  Referido,
} from '../../core/models/domain';
import { AvisoService } from '../../core/ui/aviso.service';
import { CampoComponent } from '../../shared/campo/campo.component';
import { IconComponent } from '../../shared/icon/icon.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { PaginadorComponent } from '../../shared/paginador/paginador.component';
import {
  MENSAJE_SIN_CODIGO,
  celularPattern,
  emailPattern,
  nombreCompleto,
  sinCodigo,
} from '../../shared/validacion';
import { InvitacionComponent } from './invitacion.component';
import { FiltroReferidos, ReferidosApi } from './referidos.api';

type Modal = 'form' | 'dictamen' | 'baja' | 'asociar';

@Component({
  selector: 'app-referidos-page',
  imports: [
    DatePipe,
    RouterLink,
    InvitacionComponent,
    ReactiveFormsModule,
    CampoComponent,
    IconComponent,
    ModalComponent,
    PaginadorComponent,
  ],
  templateUrl: './referidos.page.html',
})
export class ReferidosPage implements OnInit, OnDestroy {
  private api = inject(ReferidosApi);
  private avisos = inject(AvisoService);
  private route = inject(ActivatedRoute);
  protected session = inject(SessionStore);
  private fb = inject(FormBuilder).nonNullable;
  private consulta = 0;
  private busquedaTimer?: ReturnType<typeof setTimeout>;

  readonly estados = ESTADOS;
  readonly etiquetas = ETIQUETAS_ESTADO;
  readonly porPagina = computed(
    () => this.datos()?.porPagina ?? (this.session.esAdmin() ? 20 : 10),
  );
  readonly filtros = signal<FiltroReferidos>({
    pagina: 1,
    estado: '',
    buscar: '',
    desde: '',
    hasta: '',
    campania: '',
    provincia: '',
  });
  readonly datos = signal<PaginaReferidos | null>(null);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly modal = signal<Modal | null>(null);
  readonly seleccionado = signal<Referido | null>(null);
  readonly ocupado = signal(false);
  readonly enviado = signal(false);
  readonly erroresServidor = signal<Record<string, string>>({});
  readonly errorModal = signal('');
  readonly asociables = signal<Asociables | null>(null);
  readonly hayFiltros = computed(() => {
    const f = this.filtros();
    return !!(f.estado || f.buscar || f.desde || f.hasta || f.campania || f.provincia);
  });

  readonly form = this.fb.group({
    nombre: ['', [Validators.required, nombreCompleto, Validators.maxLength(100), sinCodigo]],
    correo: [
      '',
      [Validators.required, Validators.pattern(emailPattern), Validators.maxLength(254)],
    ],
    celular: ['', [Validators.required, Validators.pattern(celularPattern)]],
    notas: ['', [Validators.maxLength(500), sinCodigo]],
    consentimiento: [false],
  });
  readonly dictamenForm = this.fb.group({
    estado: ['' as '' | Exclude<EstadoReferido, 'PENDIENTE'>, Validators.required],
  });
  readonly bajaForm = this.fb.group({
    motivo: [
      '',
      [Validators.required, Validators.minLength(5), Validators.maxLength(300), sinCodigo],
    ],
  });
  readonly asociarForm = this.fb.group({
    usuarioId: [0, Validators.min(1)],
    socioId: [0, Validators.min(1)],
  });

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const estado = params.get('estado') as EstadoReferido | null;
    if (estado && ESTADOS.includes(estado)) this.filtros.update((f) => ({ ...f, estado }));
    void this.cargar();
    if (params.has('nuevo') && (this.session.esAdmin() || this.session.usuario()?.cuentaVerificada))
      this.abrirFormulario();
  }
  ngOnDestroy(): void {
    clearTimeout(this.busquedaTimer);
  }

  async cargar(): Promise<void> {
    const consulta = ++this.consulta;
    this.cargando.set(true);
    this.error.set('');
    try {
      const datos = await firstValueFrom(this.api.listar(this.filtros()));
      if (consulta === this.consulta) this.datos.set(datos);
    } catch (error) {
      if (consulta === this.consulta) this.error.set(leerError(error).mensaje);
    } finally {
      if (consulta === this.consulta) this.cargando.set(false);
    }
  }

  filtrar(cambio: Partial<FiltroReferidos>): void {
    this.filtros.update((f) => ({ ...f, ...cambio, pagina: cambio.pagina ?? 1 }));
    void this.cargar();
  }
  buscar(valor: string): void {
    clearTimeout(this.busquedaTimer);
    this.busquedaTimer = setTimeout(() => this.filtrar({ buscar: valor.trim() }), 300);
  }
  limpiarFiltros(): void {
    this.filtrar({ estado: '', buscar: '', desde: '', hasta: '', campania: '', provincia: '' });
  }

  atrasado(ref: Referido): boolean {
    return ref.estado === 'PENDIENTE' && (ref.diasHabilesPendiente ?? 0) > 2;
  }
  puedeEditar(ref: Referido): boolean {
    return this.session.esAdmin() && !ref.usuarioId;
  }
  puedeDarDeBaja(ref: Referido): boolean {
    return this.session.esAdmin() || ref.estado === 'PENDIENTE';
  }
  puedeDictaminar(ref: Referido): boolean {
    return this.session.esAdmin() && ref.estado === 'PENDIENTE';
  }

  /* ---------- Errores por campo: causa y corrección (RF-49-2) ---------- */
  private reiniciarErrores(): void {
    this.enviado.set(false);
    this.erroresServidor.set({});
    this.errorModal.set('');
  }
  errorReferido(
    campo: 'nombre' | 'correo' | 'celular' | 'notas' | 'consentimiento',
  ): string | null {
    const servidor = this.erroresServidor()[campo];
    if (servidor) return servidor;
    if (!this.enviado()) return null;
    const c = this.form.controls[campo];
    switch (campo) {
      case 'nombre':
        if (c.hasError('codigo')) return MENSAJE_SIN_CODIGO;
        return c.invalid
          ? 'Falta el apellido. Escribe nombre y apellido, por ejemplo Carlos Torres.'
          : null;
      case 'correo':
        return c.invalid
          ? 'El correo está incompleto. Escríbelo completo, por ejemplo nombre@correo.com.'
          : null;
      case 'celular':
        return c.invalid ? 'Usa 10 dígitos que empiecen por 09, por ejemplo 0991234567.' : null;
      case 'notas':
        if (c.hasError('codigo')) return MENSAJE_SIN_CODIGO;
        return c.invalid ? 'Acorta la nota a 500 caracteres como máximo.' : null;
      case 'consentimiento':
        return !this.seleccionado() && !c.value
          ? 'Marca la casilla para confirmar que la persona te autorizó a compartir sus datos.'
          : null;
    }
  }
  errorDictamen(): string | null {
    return this.enviado() && this.dictamenForm.invalid
      ? 'Elige Aprobado o Rechazado para registrar el dictamen.'
      : null;
  }
  errorBaja(): string | null {
    const servidor = this.erroresServidor()['motivo'];
    if (servidor) return servidor;
    const c = this.bajaForm.controls.motivo;
    if (!this.enviado() || c.valid) return null;
    if (c.hasError('codigo')) return MENSAJE_SIN_CODIGO;
    return 'Escribe el motivo con al menos 5 caracteres, por ejemplo: Datos duplicados.';
  }
  errorAsociar(campo: 'usuarioId' | 'socioId'): string | null {
    const servidor = this.erroresServidor()[campo];
    if (servidor) return servidor;
    if (!this.enviado() || this.asociarForm.controls[campo].valid) return null;
    return campo === 'usuarioId'
      ? 'Elige a la persona que se registró sin código.'
      : 'Elige al socio que la recomendó.';
  }

  /* ---------- Modales ---------- */
  abrirFormulario(ref?: Referido): void {
    this.reiniciarErrores();
    this.seleccionado.set(ref ?? null);
    this.form.reset({
      nombre: ref?.nombre ?? '',
      correo: ref?.correo ?? '',
      celular: ref?.celular ?? '',
      notas: ref?.notas ?? '',
      consentimiento: false,
    });
    this.modal.set('form');
  }
  abrirDictamen(ref: Referido): void {
    this.reiniciarErrores();
    this.seleccionado.set(ref);
    this.dictamenForm.reset({ estado: '' });
    this.modal.set('dictamen');
  }
  abrirBaja(ref: Referido): void {
    this.reiniciarErrores();
    this.seleccionado.set(ref);
    this.bajaForm.reset({ motivo: '' });
    this.modal.set('baja');
  }
  async abrirAsociar(): Promise<void> {
    this.reiniciarErrores();
    this.asociarForm.reset({ usuarioId: 0, socioId: 0 });
    this.asociables.set(null);
    this.modal.set('asociar');
    try {
      this.asociables.set(await firstValueFrom(this.api.asociables()));
    } catch (error) {
      this.errorModal.set(leerError(error).mensaje);
    }
  }
  cerrarModal(): void {
    if (!this.ocupado()) this.modal.set(null);
  }

  private async ejecutar(accion: () => Promise<string>): Promise<void> {
    if (this.ocupado()) return;
    this.ocupado.set(true);
    this.erroresServidor.set({});
    this.errorModal.set('');
    try {
      const mensaje = await accion();
      this.modal.set(null);
      this.avisos.exito(mensaje);
      await this.cargar();
    } catch (error) {
      const e = leerError(error);
      this.erroresServidor.set(e.campos);
      this.errorModal.set(e.mensaje);
      this.avisos.error(e.mensaje);
    } finally {
      this.ocupado.set(false);
    }
  }

  async guardar(): Promise<void> {
    this.enviado.set(true);
    const nuevo = !this.seleccionado();
    if (this.form.invalid || (nuevo && !this.form.controls.consentimiento.value)) return;
    const datos = this.form.getRawValue();
    await this.ejecutar(async () => {
      const ref = this.seleccionado();
      if (ref) {
        await firstValueFrom(this.api.editar(ref.id, datos));
        return 'Referido actualizado correctamente.';
      }
      await firstValueFrom(this.api.crear({ ...datos, consentimiento: true }));
      return '¡Una nueva conexión! Tu referido fue registrado.';
    });
  }
  async dictaminar(): Promise<void> {
    this.enviado.set(true);
    const estado = this.dictamenForm.controls.estado.value;
    const ref = this.seleccionado();
    if (!estado || !ref) return;
    await this.ejecutar(async () => {
      await firstValueFrom(this.api.dictaminar(ref.id, estado));
      return `Dictamen registrado: ${this.etiquetas[estado]}.`;
    });
  }
  async darDeBaja(): Promise<void> {
    this.enviado.set(true);
    const ref = this.seleccionado();
    if (this.bajaForm.invalid || !ref) return;
    await this.ejecutar(async () => {
      await firstValueFrom(this.api.darDeBaja(ref.id, this.bajaForm.controls.motivo.value.trim()));
      return 'Referido dado de baja. Su historial se conserva en la bitácora.';
    });
  }
  async asociar(): Promise<void> {
    this.enviado.set(true);
    if (this.asociarForm.invalid) return;
    const { usuarioId, socioId } = this.asociarForm.getRawValue();
    await this.ejecutar(async () => {
      await firstValueFrom(this.api.asociar(Number(usuarioId), Number(socioId)));
      return 'Asociación registrada correctamente.';
    });
  }

  async exportar(): Promise<void> {
    try {
      const archivo = await firstValueFrom(this.api.exportar(this.filtros()));
      const url = URL.createObjectURL(archivo);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'SUMA-referidos.csv';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      this.avisos.exito('Listado de referidos pendientes exportado.');
    } catch (error) {
      this.avisos.error(leerError(error).mensaje);
    }
  }
}
