import { inject } from '@angular/core';
import { RedirectFunction, Router, Routes } from '@angular/router';
import { authGuard, moduloGuard, rolMatch } from './core/auth/guards';
import { Modulo } from './core/models/domain';

const legacyAuth =
  (path: string): RedirectFunction =>
  ({ queryParams }) =>
    inject(Router).createUrlTree([path], { queryParams });

/** Ruta de un módulo del panel protegida por permiso del rol (RF-08-3, RF-08-4). */
const modulo = (id: Modulo, titulo: string, load: Routes[number]['loadComponent']) => ({
  path: id,
  canActivate: [moduloGuard],
  data: { modulo: id, titulo },
  title: `${titulo} · SUMA`,
  loadComponent: load,
});

export const routes: Routes = [
  {
    path: '',
    title: 'SUMA · Tu comunidad',
    loadComponent: () => import('./features/publico/landing.page').then((m) => m.LandingPage),
  },
  { path: 'index.html', redirectTo: '', pathMatch: 'full' },
  {
    path: 'iniciar-sesion',
    title: 'Iniciar sesión · SUMA',
    loadComponent: () => import('./features/publico/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'registro',
    title: 'Crear cuenta · SUMA',
    loadComponent: () => import('./features/publico/registro.page').then((m) => m.RegistroPage),
  },
  {
    path: 'confirmar-correo',
    title: 'Confirmar correo · SUMA',
    loadComponent: () =>
      import('./features/publico/confirmar-correo.page').then((m) => m.ConfirmarCorreoPage),
  },
  {
    path: 'recuperar-contrasena',
    title: 'Recuperar acceso · SUMA',
    loadComponent: () => import('./features/publico/recuperar.page').then((m) => m.RecuperarPage),
  },
  {
    path: 'internas/iniciar-sesion.html',
    redirectTo: legacyAuth('/iniciar-sesion'),
    pathMatch: 'full',
  },
  { path: 'internas/registro.html', redirectTo: legacyAuth('/registro'), pathMatch: 'full' },
  {
    path: 'internas/recuperar.html',
    redirectTo: legacyAuth('/recuperar-contrasena'),
    pathMatch: 'full',
  },
  {
    path: 'panel',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        canMatch: [rolMatch('ADMIN')],
        data: { titulo: 'Tablero' },
        title: 'Tablero · SUMA',
        loadComponent: () => import('./features/resumen/tablero.page').then((m) => m.TableroPage),
      },
      {
        path: '',
        pathMatch: 'full',
        data: { titulo: 'Resumen' },
        title: 'Mi comunidad · SUMA',
        loadComponent: () => import('./features/resumen/resumen.page').then((m) => m.ResumenPage),
      },
      {
        path: 'mi-cuenta',
        canMatch: [rolMatch('SOCIO')],
        data: { titulo: 'Mi cuenta vinculada' },
        title: 'Mi cuenta vinculada · SUMA',
        loadComponent: () =>
          import('./features/resumen/mi-cuenta.page').then((m) => m.MiCuentaPage),
      },
      {
        path: 'referidos',
        canActivate: [moduloGuard],
        data: { modulo: 'referidos', titulo: 'Referidos' },
        title: 'Referidos · SUMA',
        loadChildren: () =>
          import('./features/referidos/referidos.routes').then((m) => m.REFERIDOS_ROUTES),
      },
      modulo('usuarios', 'Usuarios', () =>
        import('./features/administracion/usuarios.page').then((m) => m.UsuariosPage),
      ),
      modulo('roles', 'Roles y permisos', () =>
        import('./features/administracion/roles.page').then((m) => m.RolesPage),
      ),
      modulo('configuracion', 'Configuración', () =>
        import('./features/administracion/configuracion.page').then((m) => m.ConfiguracionPage),
      ),
      modulo('actividad', 'Registro de actividad', () =>
        import('./features/administracion/actividad.page').then((m) => m.ActividadPage),
      ),
      modulo('notificaciones', 'Notificaciones', () =>
        import('./features/notificaciones/notificaciones.page').then((m) => m.NotificacionesPage),
      ),
      modulo('ayuda', 'Centro de ayuda', () =>
        import('./features/ayuda/ayuda.page').then((m) => m.AyudaPage),
      ),
      {
        path: 'acceso-denegado',
        data: { titulo: 'Acceso denegado' },
        title: 'Acceso denegado · SUMA',
        loadComponent: () =>
          import('./features/ayuda/acceso-denegado.page').then((m) => m.AccesoDenegadoPage),
      },
      {
        path: '**',
        data: { titulo: 'Página no disponible' },
        loadComponent: () =>
          import('./features/ayuda/proximamente.page').then((m) => m.PaginaNoDisponible),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
