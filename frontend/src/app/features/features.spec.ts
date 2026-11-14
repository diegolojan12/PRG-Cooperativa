import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, Type, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SessionStore } from '../core/auth/session.store';
import { Interfaz, ItemMenu, Modulo, PaginaReferidos, Rol, Usuario } from '../core/models/domain';
import { ComunidadShellComponent } from '../layout/comunidad-shell.component';
import { ShellComponent } from '../layout/shell.component';
import { CampoComponent } from '../shared/campo/campo.component';
import { ConfiguracionPage } from './administracion/configuracion.page';
import { ReferidosPage } from './referidos/referidos.page';

/** Catálogo de módulos tal como lo entrega el servidor (tabla Modulo). */
const CATALOGO: ItemMenu[] = [
  { id: 'panel', etiqueta: 'Resumen', grupo: 'Tu espacio', icono: 'panel', disponible: true },
  { id: 'referidos', etiqueta: 'Referidos', grupo: 'Tu espacio', icono: 'referidos', disponible: true },
  { id: 'aprende', etiqueta: 'Capacitaciones y talleres', grupo: 'Comunidad', icono: 'book', disponible: false },
  { id: 'publicaciones', etiqueta: 'Publicaciones', grupo: 'Contenidos', icono: 'post', disponible: false },
  { id: 'usuarios', etiqueta: 'Usuarios', grupo: 'Administración', icono: 'usuarios', disponible: true },
  { id: 'actividad', etiqueta: 'Registro de actividad', grupo: 'Administración', icono: 'actividad', disponible: true },
  { id: 'configuracion', etiqueta: 'Configuración', grupo: 'Administración', icono: 'configuracion', disponible: true },
  { id: 'notificaciones', etiqueta: 'Notificaciones', grupo: 'Comunidad', icono: 'notificaciones', disponible: true },
  { id: 'ayuda', etiqueta: 'Centro de ayuda', grupo: 'Comunidad', icono: 'ayuda', disponible: true },
];
const PERFILES: Record<string, { modulos: Modulo[]; esAdmin: boolean; interfaz: Interfaz; rolNombre: string }> = {
  ADMIN: {
    modulos: ['panel', 'referidos', 'usuarios', 'actividad', 'configuracion', 'notificaciones', 'ayuda'],
    esAdmin: true,
    interfaz: 'ADMINISTRACION',
    rolNombre: 'Administrador',
  },
  GESTOR: {
    modulos: ['panel', 'aprende', 'publicaciones', 'notificaciones', 'ayuda'],
    esAdmin: false,
    interfaz: 'ADMINISTRACION',
    rolNombre: 'Gestor de contenidos',
  },
  SOCIO: {
    modulos: ['panel', 'referidos', 'aprende', 'notificaciones', 'ayuda'],
    esAdmin: false,
    interfaz: 'COMUNIDAD',
    rolNombre: 'Socio',
  },
};
const usuario = (rol: Rol): Usuario => {
  const perfil = PERFILES[rol];
  return {
    id: 1,
    nombre: 'Persona Prueba',
    correo: 'persona@suma.ec',
    rol,
    activo: true,
    ...perfil,
    menu: CATALOGO.filter((m) => perfil.modulos.includes(m.id)),
  };
};

const setup = (rol: Rol) => {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
  });
  TestBed.inject(SessionStore).usuario.set(usuario(rol));
  return TestBed.inject(HttpTestingController);
};

describe('Menú por rol (HU-002, RF-08-3)', () => {
  const opciones = (rol: Rol, tipo: Type<unknown> = ShellComponent, etiqueta = 'Navegación principal') => {
    const http = setup(rol);
    const fixture = TestBed.createComponent(tipo);
    fixture.detectChanges();
    http.match(() => true).forEach((r) => r.flush([]));
    const enlaces = Array.from<HTMLElement>(
      fixture.nativeElement.querySelectorAll(`nav[aria-label="${etiqueta}"] a`),
    ).map((a) => a.textContent?.trim() ?? '');
    fixture.destroy();
    return enlaces;
  };

  it('el administrador ve los módulos de administración', () => {
    const menu = opciones('ADMIN');
    expect(menu).toContain('Usuarios');
    expect(menu).toContain('Registro de actividad');
  });
  it('el gestor de contenidos ve solo sus opciones', () => {
    const menu = opciones('GESTOR');
    expect(menu).not.toContain('Referidos');
    expect(menu).not.toContain('Usuarios');
    expect(menu).toContain('Publicaciones');
  });
  it('el socio recibe la experiencia de comunidad, sin opciones administrativas', () => {
    const menu = opciones('SOCIO', ComunidadShellComponent);
    expect(menu).toContain('Inicio');
    expect(menu).toContain('Referidos');
    expect(menu).not.toContain('Usuarios');
    expect(menu).not.toContain('Configuración');
  });
  it('un rol nuevo creado por el administrador obtiene exactamente el menú que se le asignó', () => {
    PERFILES['ASESOR'] = {
      modulos: ['panel', 'ayuda'],
      esAdmin: false,
      interfaz: 'COMUNIDAD',
      rolNombre: 'Asesor comercial',
    };
    const menu = opciones('ASESOR', ComunidadShellComponent);
    expect(menu).toEqual(['Inicio', 'Centro de ayuda']);
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
    expect(req.request.params.get('porPagina')).toBe('20');
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
    page.form.setValue({
      contacto: 'soporte@suma.ec',
      mensajeBienvenida: 'Hola',
      puntosReferido: 10.5,
      registroAbierto: 'true',
    });
    void page.guardar();
    expect(page.errorDe('puntosReferido')).toContain('sin decimales');
  });
});
