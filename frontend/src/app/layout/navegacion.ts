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
  {
    id: 'recompensas',
    label: 'Recompensas',
    icon: 'gift',
    permiso: 'panel',
    roles: ['SOCIO', 'ADMIN'],
  },
  {
    id: 'comunidad',
    label: 'Comunidad',
    icon: 'post',
    permiso: 'panel',
    roles: ['SOCIO', 'ADMIN'],
  },
  {
    id: 'comunidad',
    label: 'Publicaciones',
    icon: 'post',
    permiso: 'panel',
    roles: ['GESTOR'],
  },
  {
    id: 'salud',
    label: 'Salud y bienestar',
    icon: 'book',
    permiso: 'panel',
    roles: ['SOCIO', 'GESTOR', 'ADMIN'],
  },
  {
    id: 'soporte',
    label: 'Soporte',
    icon: 'ayuda',
    permiso: 'ayuda',
    roles: ['SOCIO', 'GESTOR', 'ADMIN'],
  },
  { id: 'retos', label: 'Retos', icon: 'gift', permiso: 'panel', roles: ['SOCIO', 'ADMIN'] },
  {
    id: 'juegos',
    label: 'Trivia financiera',
    icon: 'game',
    permiso: 'panel',
    roles: ['SOCIO', 'GESTOR', 'ADMIN'],
  },
  {
    id: 'talleres',
    label: 'Talleres',
    icon: 'book',
    permiso: 'panel',
    roles: ['SOCIO', 'GESTOR', 'ADMIN'],
  },
  {
    id: 'capacitaciones',
    label: 'Capacitaciones',
    icon: 'book',
    permiso: 'panel',
    roles: ['SOCIO', 'GESTOR', 'ADMIN'],
  },
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
