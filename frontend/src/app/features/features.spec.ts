import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SessionStore } from '../core/auth/session.store';
import { Modulo, PaginaReferidos, Rol, Usuario } from '../core/models/domain';
import { ShellComponent } from '../layout/shell.component';
import { CampoComponent } from '../shared/campo/campo.component';
import { ConfiguracionPage } from './administracion/configuracion.page';
import { ReferidosPage } from './referidos/referidos.page';

const MODULOS: Record<Rol, Modulo[]> = {
  ADMIN: [
    'panel',
    'referidos',
    'usuarios',
    'roles',
    'configuracion',
    'actividad',
    'notificaciones',
    'ayuda',
  ],
  GESTOR: ['panel', 'notificaciones', 'ayuda'],
  SOCIO: ['panel', 'referidos', 'notificaciones', 'ayuda'],
};
const usuario = (rol: Rol): Usuario => ({
  id: 1,
  nombre: 'Persona Prueba',
  correo: 'persona@suma.ec',
  rol,
  activo: true,
  modulos: MODULOS[rol],
});

const setup = (rol: Rol) => {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
  });
  TestBed.inject(SessionStore).usuario.set(usuario(rol));
  return TestBed.inject(HttpTestingController);
};

describe('Menú por rol (RF-08-3)', () => {
  const opciones = (rol: Rol) => {
    const http = setup(rol);
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();
    http.match(() => true).forEach((r) => r.flush([]));
    const enlaces = Array.from<HTMLElement>(
      fixture.nativeElement.querySelectorAll('nav[aria-label="Navegación principal"] a'),
    ).map((a) => a.textContent?.trim() ?? '');
    fixture.destroy();
    return enlaces;
  };

  it('el administrador ve los módulos de administración', () => {
    const menu = opciones('ADMIN');
    expect(menu).toContain('Usuarios');
    expect(menu).toContain('Registro de actividad');
  });
  it('el socio no ve opciones administrativas', () => {
    const menu = opciones('SOCIO');
    expect(menu).toContain('Referidos');
    expect(menu).not.toContain('Usuarios');
    expect(menu).not.toContain('Configuración');
  });
  it('el gestor de contenidos ve solo sus opciones', () => {
    const menu = opciones('GESTOR');
    expect(menu).not.toContain('Referidos');
    expect(menu).not.toContain('Usuarios');
    expect(menu).toContain('Publicaciones');
  });
});

@Component({
  imports: [CampoComponent],
  template: `<app-campo para="x" etiqueta="Correo" ayuda="Ej. nombre@correo.com" [error]="error()"
    ><input id="x"
  /></app-campo>`,
})
class CampoHost {
  readonly error = signal<string | null>(null);
}

describe('Campos con ayuda y error (RF-49-1, RF-49-2)', () => {
  it('muestra la ayuda y, si hay error, la causa y corrección debajo', () => {
    const fixture = TestBed.createComponent(CampoHost);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('#x-ayuda')?.textContent).toContain('nombre@correo.com');
    expect(el.querySelector('.s-field-error')).toBeNull();
    fixture.componentInstance.error.set('Falta el dominio. Escribe nombre@correo.com.');
    fixture.detectChanges();
    expect(el.querySelector('.s-field-error')).not.toBeNull();
    expect(el.querySelector('#x-error')?.textContent).toContain('Falta el dominio');
  });
});

describe('Referidos (RF-11-3, RF-11-6)', () => {
  const pagina: PaginaReferidos = {
    items: [
      {
        id: 1,
        nombre: 'Carlos Torres',
        correo: 'carlos@ejemplo.ec',
        celular: '0990000001',
        estado: 'PENDIENTE',
        socio: 'Daniela Medina',
        socioId: 2,
        notas: '',
        creadoEn: '2026-11-02T10:00:00.000Z',
        diasHabilesPendiente: 4,
      },
    ],
    total: 41,
    pagina: 1,
    porPagina: 20,
    porEstado: { PENDIENTE: 1, APROBADO: 0, RECHAZADO: 0 },
  };

  it('pide 20 por página, resalta Pendientes atrasados y da de baja con PATCH', async () => {
    const http = setup('ADMIN');
    const fixture = TestBed.createComponent(ReferidosPage);
    fixture.detectChanges();
    const req = http.expectOne((r) => r.url === '/api/referidos');
    expect(req.request.params.has('porPagina')).toBe(false);
    req.flush(pagina);
    await fixture.whenStable();
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('tr.s-row-late')).not.toBeNull();
    expect(el.querySelector('.s-chip-alert')?.textContent).toContain('4 días hábiles');
    expect(el.textContent).toContain('Página 1 de 3');

    const page = fixture.componentInstance;
    page.abrirBaja(pagina.items[0]);
    page.bajaForm.controls.motivo.setValue('abc');
    void page.darDeBaja();
    expect(page.errorBaja()).toContain('al menos 5 caracteres');
    page.bajaForm.controls.motivo.setValue('Datos duplicados');
    const done = page.darDeBaja();
    const baja = http.expectOne('/api/referidos/1/baja');
    expect(baja.request.method).toBe('PATCH');
    expect(baja.request.body).toEqual({ motivo: 'Datos duplicados' });
    baja.flush({ ok: true });
    await Promise.resolve();
    await Promise.resolve();
    http.expectOne((r) => r.url === '/api/referidos').flush(pagina);
    await done;
  });

  it('no deshabilita el envío: marca los campos y explica la causa (RNF-16)', () => {
    setup('SOCIO');
    const page = TestBed.createComponent(ReferidosPage).componentInstance;
    page.abrirFormulario();
    page.form.patchValue({ nombre: 'Carlos', correo: 'carlos@', celular: '123' });
    void page.guardar();
    expect(page.errorReferido('nombre')).toContain('apellido');
    expect(page.errorReferido('correo')).toContain('nombre@correo.com');
    expect(page.errorReferido('celular')).toContain('09');
    expect(page.errorReferido('consentimiento')).toContain('Marca la casilla');
  });
});

describe('Configuración (RF-14-1)', () => {
  it('rechaza decimales con un mensaje que explica la corrección', () => {
    setup('ADMIN');
    const page = TestBed.createComponent(ConfiguracionPage).componentInstance;
    page.form.patchValue({
      contacto: 'soporte@suma.ec',
      mensajeBienvenida: 'Hola',
      puntosReferido: 10.5,
      registroAbierto: 'true',
    });
    void page.guardar();
    expect(page.errorDe('puntosReferido')).toContain('sin decimales');
  });
});
