import { Component, OnInit, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SessionStore } from '../../core/auth/session.store';
import { leerError } from '../../core/http/api-error';
import { ETIQUETAS_ROL, Modulo, Rol, RolPermiso } from '../../core/models/domain';
import { AvisoService } from '../../core/ui/aviso.service';
import { IconComponent } from '../../shared/icon/icon.component';
import { NAVEGACION } from '../../layout/navegacion';
import { AdministracionApi } from './administracion.api';

const DESCRIPCION: Record<Rol, string> = {
  ADMIN: 'Gestiona y acompaña a la comunidad.',
  GESTOR: 'Publica y mantiene los contenidos.',
  SOCIO: 'Participa y comparte oportunidades.',
};

/** Las reglas de qué casillas se bloquean vienen del servidor (A5), no de listas locales. */
@Component({
  selector: 'app-roles-page',
  imports: [IconComponent],
  template: `
    <div class="s-page-heading">
      <div>
        <span class="s-eyebrow muted">ADMINISTRA TU COMUNIDAD</span>
        <h1>Roles y permisos</h1>
        <p>Define qué puede ver y hacer cada tipo de cuenta.</p>
      </div>
    </div>
    <div class="s-info-banner">
      <app-icon name="roles" />
      <div>
        <strong>El acceso correcto para cada persona</strong>
        <p>
          Hay 3 roles. Las casillas bloqueadas son obligatorias para el rol o no están disponibles
          para él.
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
            <span class="s-feature-icon" [class.yellow]="role.rol === 'ADMIN'"
              ><app-icon [name]="role.rol === 'ADMIN' ? 'roles' : 'usuarios'"
            /></span>
            <div>
              <h2 [id]="'rol-' + role.rol">{{ etiquetas[role.rol] }}</h2>
              <p>{{ descripcion[role.rol] }}</p>
            </div>
          </div>
          <span class="s-nav-label">ACCESO A LOS MÓDULOS</span>
          @for (item of nav; track item.id) {
            <label class="s-permission"
              ><span
                ><app-icon [name]="item.id" />{{ item.label }}
                @if (bloqueado(role, item.id)) {
                  <small class="s-muted">{{
                    role.obligatorios.includes(item.id) ? 'Obligatorio' : 'No disponible'
                  }}</small>
                }</span
              ><input
                type="checkbox"
                [checked]="role.modulos.includes(item.id)"
                [disabled]="bloqueado(role, item.id) || ocupado()"
                (change)="alternar(role, item.id, $any($event.target).checked)"
            /></label>
          }
          <button type="button" class="s-primary" [disabled]="ocupado()" (click)="guardar(role)">
            Guardar permisos <app-icon name="check" />
          </button>
        </section>
      }
    </div>
  `,
})
export class RolesPage implements OnInit {
  private api = inject(AdministracionApi);
  private avisos = inject(AvisoService);
  private session = inject(SessionStore);
  readonly roles = signal<RolPermiso[]>([]);
  readonly error = signal('');
  readonly ocupado = signal(false);
  readonly nav = NAVEGACION;
  readonly etiquetas = ETIQUETAS_ROL;
  readonly descripcion = DESCRIPCION;

  ngOnInit(): void {
    void this.cargar();
  }
  async cargar(): Promise<void> {
    this.error.set('');
    try {
      this.roles.set(await firstValueFrom(this.api.roles()));
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
      this.avisos.exito(`Permisos de ${this.etiquetas[role.rol]} guardados.`);
    } catch (error) {
      this.avisos.error(leerError(error).mensaje);
    } finally {
      this.ocupado.set(false);
    }
  }
}
