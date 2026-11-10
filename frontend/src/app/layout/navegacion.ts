import { Modulo, Rol } from '../core/models/domain';

export interface ItemNav {
  id: Modulo;
  label: string;
  group: string;
}
export const NAVEGACION: readonly ItemNav[] = [
  { id: 'panel', label: 'Resumen', group: 'Tu espacio' },
  { id: 'referidos', label: 'Referidos', group: 'Tu espacio' },
  { id: 'usuarios', label: 'Usuarios', group: 'Administración' },
  { id: 'roles', label: 'Roles y permisos', group: 'Administración' },
  { id: 'configuracion', label: 'Configuración', group: 'Administración' },
  { id: 'actividad', label: 'Registro de actividad', group: 'Administración' },
  { id: 'notificaciones', label: 'Notificaciones', group: 'Comunidad' },
  { id: 'ayuda', label: 'Centro de ayuda', group: 'Comunidad' },
];

export interface ModuloFuturo {
  id: string;
  label: string;
  icon: string;
  roles: Rol[];
}
/** Módulos de sprints posteriores que el menú anuncia como "Próximamente". */
export const MODULOS_FUTUROS: readonly ModuloFuturo[] = [
  { id: 'retos', label: 'Retos y recompensas', icon: 'gift', roles: ['ADMIN', 'SOCIO'] },
  {
    id: 'capacitaciones',
    label: 'Capacitaciones y talleres',
    icon: 'book',
    roles: ['ADMIN', 'GESTOR', 'SOCIO'],
  },
  { id: 'juegos', label: 'Juegos', icon: 'game', roles: ['ADMIN', 'GESTOR', 'SOCIO'] },
  { id: 'publicaciones', label: 'Publicaciones', icon: 'post', roles: ['ADMIN', 'GESTOR'] },
  { id: 'reportes', label: 'Reportes', icon: 'report', roles: ['ADMIN'] },
  { id: 'aprende', label: 'Aprende', icon: 'book', roles: ['SOCIO'] },
  { id: 'comunidad', label: 'Comunidad', icon: 'usuarios', roles: ['SOCIO'] },
  { id: 'recompensas', label: 'Recompensas', icon: 'points', roles: ['SOCIO'] },
  { id: 'perfil', label: 'Mi perfil', icon: 'profile', roles: ['GESTOR', 'SOCIO'] },
];
