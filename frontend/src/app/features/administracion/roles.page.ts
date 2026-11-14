import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { SessionStore } from '../../core/auth/session.store';
import { leerError } from '../../core/http/api-error';
import { Modulo, ModuloCatalogo, RolPermiso } from '../../core/models/domain';
import { AvisoService } from '../../core/ui/aviso.service';
import { CampoComponent } from '../../shared/campo/campo.component';
import { IconComponent } from '../../shared/icon/icon.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { sinCodigo } from '../../shared/validacion';
import { AdministracionApi } from './administracion.api';

/** Clave técnica a partir del nombre: "Asesor comercial" → ASESOR_COMERCIAL. */
const claveDe = (nombre: string): string =>
  nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 30);

/**
 * HU-001 y HU-002. Roles, módulos y reglas (obligatorios / no disponibles) vienen del
 * servidor: aquí no hay ninguna lista de roles ni de módulos escrita en el código.
 */
@Component({
  selector: 'app-roles-page',
  imports: [IconComponent, ReactiveFormsModule, CampoComponent, ModalComponent],
  template: `
    <div class="s-page-heading">
      <div>
        <span class="s-eyebrow muted">ADMINISTRA TU COMUNIDAD</span>
        <h1>Roles y permisos</h1>
        <p>Define qué puede ver y hacer cada tipo de cuenta.</p>
      </div>
      <button type="button" class="s-primary" (click)="abrirCrear()">
        <app-icon name="plus" />Nuevo rol
      </button>
    </div>
    <div class="s-info-banner">
      <app-icon name="roles" />
      <div>
        <strong>El acceso correcto para cada persona</strong>
        <p>
          Marca los módulos que verá cada rol: el menú de quien inicie sesión se ajusta al guardar.
          Las casillas bloqueadas son obligatorias para el rol o no están disponibles para él.
        </p>
      </div>
    </div>
    @if (error()) {
      <div class="s-empty s-card" role="alert">
        <p>{{ error() }}</p>
        <button type="button" class="s-primary" (click)="cargar()">Volver a intentar</button>
      </div>
    }
    <div class="s-role-grid">
      @for (role of roles(); track role.rol) {
        <section class="s-card s-role-card" [attr.aria-labelledby]="'rol-' + role.rol">
          <div class="s-role-head">
            <span class="s-feature-icon" [class.yellow]="role.alcanceGlobal"
              ><app-icon [name]="role.alcanceGlobal ? 'roles' : 'usuarios'"
            /></span>
            <div>
              <h2 [id]="'rol-' + role.rol">{{ role.nombre }}</h2>
              <p>{{ role.descripcion }}</p>
              <small class="s-muted"
                >{{ role.usuarios }} {{ role.usuarios === 1 ? 'persona' : 'personas' }} ·
                {{ role.interfaz === 'COMUNIDAD' ? 'Vista de comunidad' : 'Vista de panel' }}
                @if (role.requiereSegundoFactor) {
                  · Segundo factor
                }
                @if (role.sistema) {
                  · Rol del sistema
                }</small
              >
            </div>
          </div>
          <span class="s-nav-label">ACCESO A LOS MÓDULOS</span>
          @for (item of catalogo(); track item.id) {
            @if (role.disponibles.includes(item.id) || role.modulos.includes(item.id)) {
              <label class="s-permission"
                ><span
                  ><app-icon [name]="item.icono" />{{ item.etiqueta }}
                  @if (role.obligatorios.includes(item.id)) {
                    <small class="s-muted">Obligatorio</small>
                  } @else if (!item.disponible) {
                    <small class="s-muted">Próximamente</small>
                  }</span
                ><input
                  type="checkbox"
                  [checked]="role.modulos.includes(item.id)"
                  [disabled]="bloqueado(role, item.id) || ocupado()"
                  (change)="alternar(role, item.id, $any($event.target).checked)"
              /></label>
            }
          }
          <div class="s-form-actions">
            @if (!role.sistema) {
              <button
                type="button"
                class="s-secondary"
                [disabled]="ocupado()"
                (click)="porEliminar.set(role)"
              >
                <app-icon name="trash" />Eliminar
              </button>
            }
            <button type="button" class="s-primary" [disabled]="ocupado()" (click)="guardar(role)">
              Guardar permisos <app-icon name="check" />
            </button>
          </div>
        </section>
      }
    </div>

    @if (creando()) {
      <app-modal [ocupado]="ocupado()" (cerrar)="creando.set(false)">
        <span class="s-feature-icon yellow"><app-icon name="roles" /></span>
        <h2 id="dialogTitle">Nuevo rol</h2>
        <p>Crea un tipo de cuenta. Luego marca sus módulos y asígnalo en Usuarios.</p>
        <form [formGroup]="form" (ngSubmit)="crear()" novalidate>
          <app-campo
            para="rolNombre"
            etiqueta="Nombre del rol"
            ayuda="Cómo verán este rol las personas. Ejemplo: Asesor comercial."
            [requerido]="true"
            [error]="errorCampo('nombre')"
          >
            <input
              id="rolNombre"
              formControlName="nombre"
              maxlength="60"
              aria-describedby="rolNombre-ayuda rolNombre-error"
            />
          </app-campo>
          <app-campo
            para="rolDescripcion"
            etiqueta="Descripción"
            ayuda="Una frase que explique para qué sirve este rol (hasta 200 caracteres)."
            [opcional]="true"
          >
            <input
              id="rolDescripcion"
              formControlName="descripcion"
              maxlength="200"
              aria-describedby="rolDescripcion-ayuda"
            />
          </app-campo>
          <app-campo
            para="rolInterfaz"
            etiqueta="Experiencia al entrar"
            ayuda="Comunidad muestra la red social del socio; Panel muestra el menú lateral de gestión."
            [requerido]="true"
          >
            <select id="rolInterfaz" formControlName="interfaz" aria-describedby="rolInterfaz-ayuda">
              <option value="COMUNIDAD">Comunidad (red social)</option>
              <option value="ADMINISTRACION">Panel de gestión</option>
            </select>
          </app-campo>
          <div class="s-field">
            <label class="s-consent"
              ><input
                id="rol2fa"
                type="checkbox"
                formControlName="requiereSegundoFactor"
                aria-describedby="rol2fa-ayuda"
              /><span>Exigir segundo factor por correo al iniciar sesión</span></label
            >
            <small class="s-help" id="rol2fa-ayuda"
              >Recomendado para roles que gestionan información sensible.</small
            >
          </div>
          <div class="s-form-actions">
            <button type="button" class="s-secondary" [disabled]="ocupado()" (click)="creando.set(false)">
              Cancelar</button
            ><button type="submit" class="s-primary" [disabled]="ocupado()">
              {{ ocupado() ? 'Creando…' : 'Crear rol' }}
            </button>
          </div>
        </form>
      </app-modal>
    }
    @if (porEliminar(); as r) {
      <app-modal [ocupado]="ocupado()" (cerrar)="porEliminar.set(null)">
        <span class="s-feature-icon"><app-icon name="trash" /></span>
        <h2 id="dialogTitle">¿Eliminar el rol {{ r.nombre }}?</h2>
        <p>
          Solo se puede eliminar si nadie lo usa. Esta acción queda registrada en la bitácora.
        </p>
        <div class="s-form-actions">
          <button type="button" class="s-secondary" [disabled]="ocupado()" (click)="porEliminar.set(null)">
            Conservarlo</button
          ><button type="button" class="s-primary" [disabled]="ocupado()" (click)="eliminar(r)">
            {{ ocupado() ? 'Eliminando…' : 'Eliminar rol' }}
          </button>
        </div>
      </app-modal>
    }
  `,
})
export class RolesPage implements OnInit {
  private api = inject(AdministracionApi);
  private avisos = inject(AvisoService);
  private session = inject(SessionStore);
  private fb = inject(FormBuilder).nonNullable;
  readonly roles = signal<RolPermiso[]>([]);
  readonly catalogo = signal<ModuloCatalogo[]>([]);
  readonly error = signal('');
  readonly ocupado = signal(false);
  readonly creando = signal(false);
  readonly enviado = signal(false);
  readonly porEliminar = signal<RolPermiso | null>(null);
  readonly erroresServidor = signal<Record<string, string>>({});
  readonly hayRoles = computed(() => this.roles().length > 0);

  readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(60), sinCodigo]],
    descripcion: ['', [Validators.maxLength(200), sinCodigo]],
    interfaz: ['COMUNIDAD'],
    requiereSegundoFactor: [false],
  });

  ngOnInit(): void {
    void this.cargar();
  }
  async cargar(): Promise<void> {
    this.error.set('');
    try {
      const [roles, catalogo] = await Promise.all([
        firstValueFrom(this.api.roles()),
        firstValueFrom(this.api.modulos()),
      ]);
      this.roles.set(roles);
      this.catalogo.set(catalogo);
    } catch (error) {
      this.error.set(leerError(error).mensaje);
    }
  }
  bloqueado(role: RolPermiso, modulo: Modulo): boolean {
    return role.obligatorios.includes(modulo) || !role.disponibles.includes(modulo);
  }
  alternar(role: RolPermiso, modulo: Modulo, activo: boolean): void {
    this.roles.update((lista) =>
      lista.map((r) =>
        r.rol !== role.rol
          ? r
          : {
              ...r,
              modulos: activo ? [...r.modulos, modulo] : r.modulos.filter((m) => m !== modulo),
            },
      ),
    );
  }
  async guardar(role: RolPermiso): Promise<void> {
    if (this.ocupado()) return;
    this.ocupado.set(true);
    try {
      const actual = this.roles().find((r) => r.rol === role.rol) ?? role;
      await firstValueFrom(this.api.guardarRol(actual.rol, actual.modulos));
      await this.session.refrescar();
      this.avisos.exito(`Permisos de ${role.nombre} guardados.`);
    } catch (error) {
      this.avisos.error(leerError(error).mensaje);
    } finally {
      this.ocupado.set(false);
    }
  }

  errorCampo(campo: 'nombre'): string | null {
    const servidor = this.erroresServidor()[campo] ?? this.erroresServidor()['clave'];
    if (servidor) return servidor;
    const c = this.form.controls[campo];
    return this.enviado() && c.invalid
      ? 'Escribe entre 3 y 60 caracteres en texto simple, por ejemplo Asesor comercial.'
      : null;
  }
  abrirCrear(): void {
    this.enviado.set(false);
    this.erroresServidor.set({});
    this.form.reset({ nombre: '', descripcion: '', interfaz: 'COMUNIDAD', requiereSegundoFactor: false });
    this.creando.set(true);
  }
  async crear(): Promise<void> {
    this.enviado.set(true);
    if (this.form.invalid || this.ocupado()) return;
    const v = this.form.getRawValue();
    this.ocupado.set(true);
    this.erroresServidor.set({});
    try {
      await firstValueFrom(this.api.crearRol({ ...v, clave: claveDe(v.nombre) }));
      this.creando.set(false);
      this.avisos.exito(`Rol ${v.nombre} creado. Marca sus módulos y guarda los permisos.`);
      await this.cargar();
    } catch (error) {
      const e = leerError(error);
      this.erroresServidor.set(e.campos);
      this.avisos.error(e.mensaje);
    } finally {
      this.ocupado.set(false);
    }
  }
  async eliminar(role: RolPermiso): Promise<void> {
    if (this.ocupado()) return;
    this.ocupado.set(true);
    try {
      await firstValueFrom(this.api.eliminarRol(role.rol));
      this.porEliminar.set(null);
      this.avisos.exito(`Rol ${role.nombre} eliminado.`);
      await this.cargar();
    } catch (error) {
      this.avisos.error(leerError(error).mensaje);
    } finally {
      this.ocupado.set(false);
    }
  }
}
