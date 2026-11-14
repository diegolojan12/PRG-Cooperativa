import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { SessionStore } from '../../core/auth/session.store';
import { leerError } from '../../core/http/api-error';
import { CuentaPendiente, OpcionRol, Pagina, Rol, Usuario } from '../../core/models/domain';
import { AvisoService } from '../../core/ui/aviso.service';
import { CampoComponent } from '../../shared/campo/campo.component';
import { IconComponent } from '../../shared/icon/icon.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { PaginadorComponent } from '../../shared/paginador/paginador.component';
import {
  MENSAJE_SIN_CODIGO,
  emailPattern,
  nombreCompleto,
  sinCodigo,
} from '../../shared/validacion';
import { AdministracionApi } from './administracion.api';

@Component({
  selector: 'app-usuarios-page',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    CampoComponent,
    IconComponent,
    ModalComponent,
    PaginadorComponent,
  ],
  templateUrl: './usuarios.page.html',
})
export class UsuariosPage implements OnInit, OnDestroy {
  private api = inject(AdministracionApi);
  private avisos = inject(AvisoService);
  protected session = inject(SessionStore);
  private fb = inject(FormBuilder).nonNullable;
  private timer?: ReturnType<typeof setTimeout>;

  /** Los roles salen de la base de datos (HU-001): crear uno nuevo no exige cambiar esta pantalla. */
  readonly roles = signal<OpcionRol[]>([]);
  readonly etiquetas = computed(() =>
    Object.fromEntries(this.roles().map((r) => [r.rol, r.nombre])),
  );
  readonly ayudaRol = computed(() =>
    Object.fromEntries(this.roles().map((r) => [r.rol, r.descripcion || 'Elige el rol de la persona.'])),
  );
  readonly rolesAdmin = computed(() => new Set(this.roles().filter((r) => r.alcanceGlobal).map((r) => r.rol)));
  readonly pagina = signal(1);
  readonly busqueda = signal('');
  readonly datos = signal<Pagina<Usuario> | null>(null);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly modal = signal<'crear' | 'gestionar' | 'cuentas' | null>(null);
  readonly seleccionado = signal<Usuario | null>(null);
  readonly ocupado = signal(false);
  readonly enviado = signal(false);
  readonly erroresServidor = signal<Record<string, string>>({});
  readonly enlaceDev = signal<string | null>(null);

  readonly cuentas = signal<Pagina<CuentaPendiente> | null>(null);
  readonly cuentaSeleccionada = signal<CuentaPendiente | null>(null);
  readonly errorCuentas = signal('');
  readonly revisionForm = this.fb.group({
    estado: ['APROBADO' as 'APROBADO' | 'RECHAZADO'],
    motivo: ['', [Validators.maxLength(300), sinCodigo]],
  });

  async abrirCuentas(pagina = 1): Promise<void> {
    this.modal.set('cuentas');
    this.cuentaSeleccionada.set(null);
    this.cuentas.set(null);
    this.errorCuentas.set('');
    try {
      this.cuentas.set(await firstValueFrom(this.api.cuentasPendientes(pagina)));
    } catch (error) {
      this.errorCuentas.set(leerError(error).mensaje);
    }
  }

  seleccionarCuenta(cuenta: CuentaPendiente): void {
    this.cuentaSeleccionada.set(cuenta);
    this.revisionForm.reset();
    this.errorCuentas.set('');
  }

  async revisarCuenta(): Promise<void> {
    const cuenta = this.cuentaSeleccionada();
    if (!cuenta || this.ocupado()) return;
    const { estado, motivo } = this.revisionForm.getRawValue();
    if (this.revisionForm.invalid || (estado === 'RECHAZADO' && !motivo.trim())) {
      this.errorCuentas.set(
        'Si rechazas la solicitud, escribe un motivo de hasta 300 caracteres en texto simple.',
      );
      return;
    }
    this.ocupado.set(true);
    this.errorCuentas.set('');
    try {
      await firstValueFrom(this.api.verificarCuenta(cuenta.id, estado, motivo));
      this.avisos.exito('Revisión de cuenta registrada.');
      await this.abrirCuentas();
    } catch (error) {
      this.errorCuentas.set(leerError(error).mensaje);
    } finally {
      this.ocupado.set(false);
    }
  }

  readonly crearForm = this.fb.group({
    nombre: ['', [Validators.required, nombreCompleto, Validators.maxLength(100), sinCodigo]],
    correo: ['', [Validators.required, Validators.pattern(emailPattern)]],
    rol: ['' as Rol, Validators.required],
  });
  readonly gestionForm = this.fb.group({
    rol: ['' as Rol, Validators.required],
    activo: [true],
  });

  ngOnInit(): void {
    void this.cargarRoles();
    void this.cargar();
  }
  async cargarRoles(): Promise<void> {
    try {
      const lista = await firstValueFrom(this.api.opcionesRol());
      this.roles.set(lista);
      const alta = lista.find((r) => !r.alcanceGlobal && r.interfaz === 'ADMINISTRACION') ?? lista[0];
      if (alta) this.crearForm.controls.rol.setValue(alta.rol);
    } catch (error) {
      this.error.set(leerError(error).mensaje);
    }
  }
  ngOnDestroy(): void {
    clearTimeout(this.timer);
  }

  async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set('');
    try {
      this.datos.set(await firstValueFrom(this.api.usuarios(this.pagina(), this.busqueda())));
    } catch (error) {
      this.error.set(leerError(error).mensaje);
    } finally {
      this.cargando.set(false);
    }
  }
  buscar(valor: string): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.busqueda.set(valor.trim());
      this.irA(1);
    }, 300);
  }
  irA(pagina: number): void {
    this.pagina.set(pagina);
    void this.cargar();
  }

  errorCrear(campo: 'nombre' | 'correo' | 'rol'): string | null {
    const servidor = this.erroresServidor()[campo];
    if (servidor) return servidor;
    const c = this.crearForm.controls[campo];
    if (!this.enviado() || c.valid) return null;
    if (c.hasError('codigo')) return MENSAJE_SIN_CODIGO;
    return campo === 'nombre'
      ? 'Escribe nombre y apellido, por ejemplo Gabriel Ortiz.'
      : campo === 'correo'
        ? 'El correo está incompleto. Escríbelo completo, por ejemplo nombre@correo.com.'
        : 'Elige uno de los roles de la lista.';
  }

  abrirCrear(): void {
    this.enviado.set(false);
    this.erroresServidor.set({});
    this.enlaceDev.set(null);
    const alta = this.roles().find((r) => !r.alcanceGlobal && r.interfaz === 'ADMINISTRACION') ?? this.roles()[0];
    this.crearForm.reset({ nombre: '', correo: '', rol: alta?.rol ?? '' });
    this.modal.set('crear');
  }
  abrirGestion(usuario: Usuario): void {
    this.seleccionado.set(usuario);
    this.gestionForm.reset({ rol: usuario.rol, activo: usuario.activo });
    this.modal.set('gestionar');
  }
  cerrar(): void {
    if (!this.ocupado()) this.modal.set(null);
  }

  async crear(): Promise<void> {
    this.enviado.set(true);
    if (this.crearForm.invalid || this.ocupado()) return;
    this.ocupado.set(true);
    this.erroresServidor.set({});
    try {
      const creado = await firstValueFrom(this.api.crearUsuario(this.crearForm.getRawValue()));
      this.modal.set(null);
      this.enlaceDev.set(creado.devResetUrl ?? null);
      this.avisos.exito(
        `Cuenta de ${(this.etiquetas()[creado.rol] ?? creado.rol).toLowerCase()} creada. Enviamos a ${creado.correo} un enlace para definir su contraseña.`,
      );
      await this.cargar();
    } catch (error) {
      const e = leerError(error);
      this.erroresServidor.set(e.campos);
      this.avisos.error(e.mensaje);
    } finally {
      this.ocupado.set(false);
    }
  }

  async guardar(): Promise<void> {
    const usuario = this.seleccionado();
    if (!usuario || this.ocupado()) return;
    this.ocupado.set(true);
    try {
      await firstValueFrom(this.api.actualizarUsuario(usuario.id, this.gestionForm.getRawValue()));
      this.modal.set(null);
      this.avisos.exito('Usuario actualizado. Sus sesiones anteriores se cerraron.');
      await this.cargar();
    } catch (error) {
      this.avisos.error(leerError(error).mensaje);
    } finally {
      this.ocupado.set(false);
    }
  }
}
