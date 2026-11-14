import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), provideHttpClient()],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('conserva la portada SUMA en la ruta pública', async () => {
    const harness = await RouterTestingHarness.create('/');
    expect(harness.routeNativeElement?.querySelector('.logotipo')?.textContent).toContain('SUMA');
    expect(harness.routeNativeElement?.querySelector('.linkLogin')?.getAttribute('href')).toBe(
      '/iniciar-sesion',
    );
  });

  it('conserva el token de los enlaces de recuperación anteriores', async () => {
    const harness = await RouterTestingHarness.create(
      '/internas/recuperar.html?token=token-prueba',
    );
    expect(TestBed.inject(Router).url).toBe('/recuperar-contrasena?token=token-prueba');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(
      'Crea tu nueva contraseña',
    );
  });
});
