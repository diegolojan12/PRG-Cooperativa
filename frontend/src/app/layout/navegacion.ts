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

export interface FuncionNav {
  id: string;
  label: string;
  icon: string;
  roles: Rol[];
  permiso?: Modulo;
}

export const FUNCIONES: readonly FuncionNav[] = [
  { id: 'perfil', label: 'Mi perfil', icon: 'profile', roles: ['GESTOR', 'SOCIO', 'ADMIN'] },
  { id: 'puntos', label: 'Mis puntos', icon: 'points', permiso: 'panel', roles: ['SOCIO'] },
  {
    id: 'campanias',
    label: 'Campañas',
    icon: 'referidos',
    permiso: 'referidos',
    roles: ['SOCIO', 'ADMIN'],
  },
  {
    id: 'gamificacion',
    label: 'Niveles e insignias',
    icon: 'gift',
    permiso: 'configuracion',
    roles: ['ADMIN'],
  },
];
