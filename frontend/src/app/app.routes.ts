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
        path: 'perfil',
        data: { titulo: 'Mi perfil' },
        loadComponent: () =>
          import('./features/fidelizacion/perfil.page').then((m) => m.PerfilPage),
      },
      {
        path: 'puntos',
        canActivate: [moduloGuard],
        data: { modulo: 'panel', titulo: 'Mis puntos' },
        loadComponent: () =>
          import('./features/fidelizacion/puntos.page').then((m) => m.PuntosPage),
      },
      {
        path: 'campanias',
        canActivate: [moduloGuard],
        data: { modulo: 'referidos', titulo: 'Campañas' },
        loadComponent: () =>
          import('./features/fidelizacion/campanias.page').then((m) => m.CampaniasPage),
      },
      {
        path: 'gamificacion',
        canMatch: [rolMatch('ADMIN')],
        canActivate: [moduloGuard],
        data: { modulo: 'configuracion', titulo: 'Niveles e insignias' },
        loadComponent: () =>
          import('./features/fidelizacion/gamificacion.page').then((m) => m.GamificacionPage),
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
        path: 'retos',
        canActivate: [moduloGuard],
        data: { modulo: 'panel', titulo: 'Retos' },
        loadComponent: () => import('./features/participacion/retos.page').then((m) => m.RetosPage),
      },
      {
        path: 'talleres',
        canActivate: [moduloGuard],
        data: { modulo: 'panel', titulo: 'Talleres' },
        loadComponent: () =>
          import('./features/participacion/talleres.page').then((m) => m.TalleresPage),
      },
      {
        path: 'juegos',
        canActivate: [moduloGuard],
        data: { modulo: 'panel', titulo: 'Trivia financiera' },
        loadComponent: () =>
          import('./features/participacion/juegos.page').then((m) => m.JuegosPage),
      },
      {
        path: 'capacitaciones',
        canActivate: [moduloGuard],
        data: { modulo: 'panel', titulo: 'Capacitaciones' },
        loadComponent: () =>
          import('./features/participacion/capacitaciones.page').then((m) => m.CapacitacionesPage),
      },
      {
        path: 'acceso-denegado',
        data: { titulo: 'Acceso denegado' },
        title: 'Acceso denegado · SUMA',
        loadComponent: () =>
          import('./features/ayuda/acceso-denegado.page').then((m) => m.AccesoDenegadoPage),
      },
      { path: 'aprende', redirectTo: 'capacitaciones', pathMatch: 'full' },
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
