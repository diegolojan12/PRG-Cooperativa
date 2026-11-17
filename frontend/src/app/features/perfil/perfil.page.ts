import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthApi } from '../../core/auth/auth.api';
import { SessionStore } from '../../core/auth/session.store';
import { leerError } from '../../core/http/api-error';
import { Usuario } from '../../core/models/domain';
import { AvisoService } from '../../core/ui/aviso.service';
import { CampoComponent } from '../../shared/campo/campo.component';

/**
 * Configuración del perfil (Sprint 2).
 * HU-055 · UR-06 · RF-03: consultar los 4 datos, actualizar nombre, celular, provincia, correo (confirmado
 * con código) y contraseña, o dar de baja la cuenta (baja lógica).
 * HU-056 · UR-51 · RF-46: perfil Público o Privado (Privado por defecto); correo, celular y cuenta nunca se muestran.
 */
@Component({
  selector: 'app-perfil-page',
  imports: [ReactiveFormsModule, CampoComponent],
  template: `
    <div class="s-page-heading"><h1>Mi perfil</h1></div>

    <section class="s-card s-settings" aria-labelledby="datosTitulo">
      <h2 id="datosTitulo">Datos personales</h2>
      <form [formGroup]="datos" (ngSubmit)="guardarDatos()" novalidate>
        <app-campo para="perfilNombre" etiqueta="Nombres y apellidos" [requerido]="true"
          ayuda="Escribe al menos un nombre y un apellido. Ej. Carlos Torres." [error]="errores()['nombre'] ?? null">
          <input id="perfilNombre" formControlName="nombre" maxlength="100" autocomplete="name"
            aria-describedby="perfilNombre-ayuda perfilNombre-error" [attr.aria-invalid]="!!errores()['nombre']" />
        </app-campo>
        <app-campo para="perfilCelular" etiqueta="Celular" [requerido]="true"
          ayuda="10 dígitos que empiecen por 09. Ej. 0991234567." [error]="errores()['celular'] ?? null">
          <input id="perfilCelular" formControlName="celular" inputmode="numeric" maxlength="10" autocomplete="tel"
            aria-describedby="perfilCelular-ayuda perfilCelular-error" [attr.aria-invalid]="!!errores()['celular']" />
        </app-campo>
        <app-campo para="perfilProvincia" etiqueta="Provincia" [requerido]="true"
          ayuda="Con ella verás las campañas de tu provincia." [error]="errores()['provincia'] ?? null">
          <select id="perfilProvincia" formControlName="provincia"
            aria-describedby="perfilProvincia-ayuda perfilProvincia-error" [attr.aria-invalid]="!!errores()['provincia']">
            <option value="" disabled>Elige tu provincia</option>
            @for (p of provincias(); track p) {
              <option [value]="p">{{ p }}</option>
            }
          </select>
        </app-campo>
        <button type="submit" class="s-primary" [disabled]="ocupado() || datos.pristine">Guardar cambios</button>
      </form>
    </section>

    <section class="s-card s-settings" aria-labelledby="correoTitulo">
      <h2 id="correoTitulo">Correo de acceso</h2>
      <p>Inicias sesión con <strong>{{ usuario()?.correo }}</strong>.</p>
      @if (!destino()) {
        <form [formGroup]="correo" (ngSubmit)="pedirCodigo()" novalidate>
          <app-campo para="correoNuevo" etiqueta="Correo nuevo" [requerido]="true"
            ayuda="Te enviaremos un código para confirmarlo. Ej. nombre@correo.com." [error]="errores()['correo'] ?? null">
            <input id="correoNuevo" type="email" formControlName="correo" maxlength="254" autocomplete="email"
              aria-describedby="correoNuevo-ayuda correoNuevo-error" [attr.aria-invalid]="!!errores()['correo']" />
          </app-campo>
          <app-campo para="correoClave" etiqueta="Contraseña actual" [requerido]="true"
            ayuda="La pedimos para proteger tu cuenta." [error]="errores()['claveCorreo'] ?? null">
            <input id="correoClave" type="password" formControlName="clave" autocomplete="current-password"
              aria-describedby="correoClave-ayuda correoClave-error" [attr.aria-invalid]="!!errores()['claveCorreo']" />
          </app-campo>
          <button type="submit" class="s-secondary" [disabled]="ocupado()">Enviar código</button>
        </form>
      } @else {
        <form (submit)="$event.preventDefault(); confirmarCorreo(codigo.value)" novalidate>
          <p>Escribe el código que enviamos a {{ destino() }}. Vence en 10 minutos.</p>
          @if (devCodigo(); as demo) {
            <p class="s-muted">Código de prueba <strong>{{ demo }}</strong></p>
          }
          <app-campo para="codigoCorreo" etiqueta="Código de confirmación" [requerido]="true"
            ayuda="Seis dígitos." [error]="errores()['codigo'] ?? null">
            <input #codigo id="codigoCorreo" inputmode="numeric" maxlength="6" autocomplete="one-time-code"
              aria-describedby="codigoCorreo-ayuda codigoCorreo-error" [attr.aria-invalid]="!!errores()['codigo']" />
          </app-campo>
          <div class="s-heading-actions">
            <button type="button" class="s-secondary" (click)="destino.set('')">Cancelar</button>
            <button type="submit" class="s-primary" [disabled]="ocupado()">Confirmar correo</button>
          </div>
        </form>
      }
    </section>

    <section class="s-card s-settings" aria-labelledby="claveTitulo">
      <h2 id="claveTitulo">Contraseña</h2>
      <form [formGroup]="clave" (ngSubmit)="cambiarClave()" novalidate>
        <app-campo para="claveActual" etiqueta="Contraseña actual" [requerido]="true"
          ayuda="La que usas hoy para entrar." [error]="errores()['actual'] ?? null">
          <input id="claveActual" type="password" formControlName="actual" autocomplete="current-password"
            aria-describedby="claveActual-ayuda claveActual-error" [attr.aria-invalid]="!!errores()['actual']" />
        </app-campo>
        <app-campo para="claveNueva" etiqueta="Contraseña nueva" [requerido]="true"
          ayuda="Al menos 8 caracteres, una mayúscula y un número." [error]="errores()['nueva'] ?? null">
          <input id="claveNueva" type="password" formControlName="nueva" autocomplete="new-password"
            aria-describedby="claveNueva-ayuda claveNueva-error" [attr.aria-invalid]="!!errores()['nueva']" />
        </app-campo>
        <app-campo para="claveConfirmacion" etiqueta="Repite la contraseña nueva" [requerido]="true"
          ayuda="Escríbela igual que arriba." [error]="errores()['confirmacion'] ?? null">
          <input id="claveConfirmacion" type="password" formControlName="confirmacion" autocomplete="new-password"
            aria-describedby="claveConfirmacion-ayuda claveConfirmacion-error" [attr.aria-invalid]="!!errores()['confirmacion']" />
        </app-campo>
        <button type="submit" class="s-secondary" [disabled]="ocupado()">Cambiar contraseña</button>
      </form>
    </section>

    <section class="s-card s-settings" aria-labelledby="privacidadTitulo">
      <h2 id="privacidadTitulo">Privacidad</h2>
      <p>
        Con el perfil <strong>Público</strong>, los demás socios ven solo tu nombre de pila, tu nivel y tus insignias.
        Tu correo, tu celular y tu número de cuenta nunca se muestran a nadie.
      </p>
      <fieldset class="s-choice-row">
        <legend class="cm-sr">Visibilidad del perfil</legend>
        <label class="s-check-row">
          <input type="radio" name="visibilidad" [checked]="!usuario()?.perfilPublico" [disabled]="ocupado()"
            (change)="cambiarPrivacidad(false)" />
          Privado <span class="s-muted">(recomendado)</span>
        </label>
        <label class="s-check-row">
          <input type="radio" name="visibilidad" [checked]="!!usuario()?.perfilPublico" [disabled]="ocupado()"
            (change)="cambiarPrivacidad(true)" />
          Público
        </label>
      </fieldset>
    </section>

    @if (!usuario()?.esAdmin) {
      <section class="s-card s-settings s-danger-zone" aria-labelledby="bajaTitulo">
        <h2 id="bajaTitulo">Dar de baja mi cuenta</h2>
        <p>Tu cuenta se desactiva y se cierra tu sesión. Conservamos tu historial y tus referidos; para volver, contacta a soporte.</p>
        <form [formGroup]="baja" (ngSubmit)="darDeBaja()" novalidate>
          <app-campo para="bajaMotivo" etiqueta="Motivo" [opcional]="true"
            ayuda="Nos ayuda a mejorar. Hasta 200 caracteres." [error]="errores()['motivo'] ?? null">
            <textarea id="bajaMotivo" formControlName="motivo" maxlength="200"
              aria-describedby="bajaMotivo-ayuda bajaMotivo-error"></textarea>
          </app-campo>
          <app-campo para="bajaClave" etiqueta="Contraseña actual" [requerido]="true"
            ayuda="Confirma que eres tú." [error]="errores()['claveBaja'] ?? null">
            <input id="bajaClave" type="password" formControlName="clave" autocomplete="current-password"
              aria-describedby="bajaClave-ayuda bajaClave-error" [attr.aria-invalid]="!!errores()['claveBaja']" />
          </app-campo>
          <label class="s-check-row">
            <input type="checkbox" formControlName="confirmo" />
            Entiendo que mi cuenta quedará desactivada.
          </label>
          <button type="submit" class="s-danger" [disabled]="ocupado() || !baja.controls.confirmo.value">
            Dar de baja mi cuenta
          </button>
        </form>
      </section>
    }
  `,
})
export class PerfilPage implements OnInit {
  private auth = inject(AuthApi);
  private sesion = inject(SessionStore);
  private avisos = inject(AvisoService);
  private router = inject(Router);
  private fb = inject(FormBuilder).nonNullable;

  readonly usuario = this.sesion.usuario;
  readonly provincias = signal<string[]>([]);
  readonly ocupado = signal(false);
  readonly errores = signal<Record<string, string>>({});
  readonly destino = signal('');
  readonly devCodigo = signal<string | undefined>(undefined);

  readonly datos = this.fb.group({
    nombre: ['', Validators.required],
    celular: ['', [Validators.required, Validators.pattern(/^09\d{8}$/)]],
    provincia: ['', Validators.required],
  });
  readonly correo = this.fb.group({ correo: ['', [Validators.required, Validators.email]], clave: [''] });
  readonly clave = this.fb.group({ actual: [''], nueva: [''], confirmacion: [''] });
  readonly baja = this.fb.group({ motivo: [''], clave: [''], confirmo: [false] });

  ngOnInit(): void {
    this.llenarDatos(this.usuario());
    firstValueFrom(this.auth.provincias())
      .then((lista) => this.provincias.set(lista))
      .catch(() => this.avisos.error('No pudimos cargar las provincias.'));
  }

  private llenarDatos(u: Usuario | null): void {
    if (!u) return;
    this.datos.reset({ nombre: u.nombre, celular: u.celular ?? '', provincia: u.provincia ?? '' });
  }

  /** Ejecuta una acción y traduce los errores del servidor a los campos del formulario. */
  private async ejecutar<T>(accion: () => Promise<T>, renombrar: Record<string, string> = {}): Promise<T | null> {
    if (this.ocupado()) return null;
    this.ocupado.set(true);
    this.errores.set({});
    try {
      return await accion();
    } catch (error) {
      const e = leerError(error);
      const campos: Record<string, string> = {};
      for (const [campo, mensaje] of Object.entries(e.campos)) campos[renombrar[campo] ?? campo] = mensaje;
      this.errores.set(campos);
      this.avisos.error(e.mensaje);
      return null;
    } finally {
      this.ocupado.set(false);
    }
  }

  async guardarDatos(): Promise<void> {
    const cambios = Object.fromEntries(
      Object.entries(this.datos.getRawValue()).filter(([k]) => this.datos.get(k)?.dirty),
    );
    const usuario = await this.ejecutar(() => firstValueFrom(this.auth.actualizarPerfil(cambios)));
    if (!usuario) return;
    this.sesion.usuario.set(usuario);
    this.llenarDatos(usuario);
    this.avisos.exito('Tus datos se actualizaron.');
  }

  async pedirCodigo(): Promise<void> {
    const { correo, clave } = this.correo.getRawValue();
    const r = await this.ejecutar(() => firstValueFrom(this.auth.solicitarCambioCorreo(correo.trim(), clave)), {
      clave: 'claveCorreo',
    });
    if (!r) return;
    this.destino.set(r.destino);
    this.devCodigo.set(r.devCodigo);
    this.correo.reset();
  }

  async confirmarCorreo(codigo: string): Promise<void> {
    const usuario = await this.ejecutar(() => firstValueFrom(this.auth.confirmarCambioCorreo(codigo.trim())));
    if (!usuario) return;
    this.sesion.usuario.set(usuario);
    this.destino.set('');
    this.avisos.exito('Tu correo cambió. Desde ahora inicias sesión con él.');
  }

  async cambiarClave(): Promise<void> {
    const { actual, nueva, confirmacion } = this.clave.getRawValue();
    const r = await this.ejecutar(() => firstValueFrom(this.auth.cambiarClave(actual, nueva, confirmacion)), {
      clave: 'nueva',
    });
    if (!r) return;
    this.clave.reset();
    this.avisos.exito('Tu contraseña cambió. Cerramos tus otras sesiones abiertas.');
  }

  async cambiarPrivacidad(perfilPublico: boolean): Promise<void> {
    const usuario = await this.ejecutar(() => firstValueFrom(this.auth.actualizarPrivacidad(perfilPublico)));
    if (!usuario) return;
    this.sesion.usuario.set(usuario);
    this.avisos.exito(perfilPublico ? 'Tu perfil ahora es Público.' : 'Tu perfil ahora es Privado.');
  }

  async darDeBaja(): Promise<void> {
    const { clave, motivo } = this.baja.getRawValue();
    const r = await this.ejecutar(() => firstValueFrom(this.auth.darDeBaja(clave, motivo.trim())), {
      clave: 'claveBaja',
    });
    if (!r) return;
    this.sesion.limpiar();
    this.avisos.exito('Tu cuenta se dio de baja. Gracias por ser parte de SUMA.');
    await this.router.navigate(['/']);
  }
}
