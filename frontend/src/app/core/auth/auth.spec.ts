import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { vi } from 'vitest';
import { authInterceptor } from '../http/auth.interceptor';
import { Usuario } from '../models/domain';
import { AvisoService } from '../ui/aviso.service';
import { authGuard, moduloGuard } from './guards';
import { InactividadService } from './inactividad.service';
import { SessionStore } from './session.store';

const socio: Usuario = {
  id: 2,
  nombre: 'Daniela Medina',
  correo: 'socio@suma.ec',
  rol: 'SOCIO',
  activo: true,
  modulos: ['panel', 'referidos', 'notificaciones', 'ayuda'],
};

describe('Sesión, guards e interceptor (HU-002, HU-003)', () => {
  let http: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });
  afterEach(() => vi.useRealTimers());

  const run = (guard: typeof authGuard, data: Record<string, unknown> = {}) =>
    TestBed.runInInjectionContext(() =>
      guard({ data } as unknown as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as Promise<boolean | UrlTree>;

  it('authGuard envía al visitante anónimo a iniciar sesión sin hablar de inactividad', async () => {
    const result = run(authGuard);
    http
      .expectOne('/api/auth/me')
      .flush({ message: 'Inicia sesión' }, { status: 401, statusText: '' });
    expect(router.serializeUrl((await result) as UrlTree)).toBe('/iniciar-sesion');
  });

  it('moduloGuard muestra acceso denegado si el rol no tiene el módulo (RF-08-4)', async () => {
    TestBed.inject(SessionStore).usuario.set(socio);
    expect(await run(moduloGuard, { modulo: 'referidos' })).toBe(true);
    const denied = await run(moduloGuard, { modulo: 'usuarios' });
    expect(router.serializeUrl(denied as UrlTree)).toBe('/panel/acceso-denegado');
  });

  it('un 401 con sesión activa redirige con motivo=inactividad (RF-04-3)', async () => {
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    TestBed.inject(SessionStore).usuario.set(socio);
    const request = firstValueFrom(TestBed.inject(HttpClient).get('/api/referidos'));
    http.expectOne('/api/referidos').flush({}, { status: 401, statusText: '' });
    await expect(request).rejects.toBeTruthy();
    expect(navigate).toHaveBeenCalledWith(['/iniciar-sesion'], {
      queryParams: { motivo: 'inactividad' },
    });
    expect(TestBed.inject(SessionStore).usuario()).toBeNull();
  });

  it('un 403 muestra un aviso de error', async () => {
    const request = firstValueFrom(TestBed.inject(HttpClient).get('/api/usuarios'));
    http
      .expectOne('/api/usuarios')
      .flush({ message: 'No tienes permiso.' }, { status: 403, statusText: '' });
    await expect(request).rejects.toBeTruthy();
    expect(TestBed.inject(AvisoService).actual()).toEqual({
      tipo: 'error',
      texto: 'No tienes permiso.',
    });
  });

  it('cierra la sesión del cliente tras 15 minutos sin actividad y la actividad reinicia el conteo', () => {
    vi.useFakeTimers();
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    TestBed.inject(SessionStore).usuario.set(socio);
    const service = TestBed.inject(InactividadService);
    service.iniciar();
    vi.advanceTimersByTime(14 * 60_000);
    document.dispatchEvent(new KeyboardEvent('keydown'));
    vi.advanceTimersByTime(14 * 60_000);
    expect(navigate).not.toHaveBeenCalled();
    vi.advanceTimersByTime(60_000 + 1);
    expect(navigate).toHaveBeenCalledWith(['/iniciar-sesion'], {
      queryParams: { motivo: 'inactividad' },
    });
    expect(TestBed.inject(SessionStore).usuario()).toBeNull();
    service.detener();
  });
});

describe('Avisos (RF-49, RF-49-3)', () => {
  afterEach(() => vi.useRealTimers());

  it('distingue éxito y error y los muestra al menos 4 segundos', () => {
    vi.useFakeTimers();
    const avisos = TestBed.inject(AvisoService);
    avisos.exito('Guardado');
    expect(avisos.actual()?.tipo).toBe('exito');
    vi.advanceTimersByTime(3999);
    expect(avisos.actual()).not.toBeNull();
    avisos.error('Falló');
    expect(avisos.actual()?.tipo).toBe('error');
    vi.advanceTimersByTime(7999);
    expect(avisos.actual()).not.toBeNull();
    vi.advanceTimersByTime(2);
    expect(avisos.actual()).toBeNull();
  });
});
