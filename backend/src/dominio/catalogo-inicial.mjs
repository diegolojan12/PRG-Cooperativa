/**
 * Datos SEMILLA del catálogo de acceso (HU-001, HU-002).
 *
 * Esto NO es la fuente de verdad: solo se inserta en la base la primera vez
 * (INSERT ... ON CONFLICT DO NOTHING). Desde entonces los roles, los módulos y
 * los permisos viven en las tablas "Rol", "Modulo" y "RolPermiso" y se administran
 * desde la pantalla Roles y permisos. Agregar un rol o un módulo nuevo no requiere
 * tocar el código de autorización.
 *
 * ambito: 'ADMIN' = módulo de administración (solo roles de alcance global);
 *         'COMUN' = módulo que puede otorgarse a cualquier rol.
 * disponible: false = el módulo existe en el catálogo pero su pantalla llega en un sprint posterior.
 */
export const MODULOS_INICIALES = [
  { clave: 'panel', etiqueta: 'Resumen', grupo: 'Tu espacio', icono: 'panel', ambito: 'COMUN', disponible: true },
  { clave: 'referidos', etiqueta: 'Referidos', grupo: 'Tu espacio', icono: 'referidos', ambito: 'COMUN', disponible: true },
  { clave: 'comunidad', etiqueta: 'Comunidad', grupo: 'Comunidad', icono: 'usuarios', ambito: 'COMUN', disponible: false },
  { clave: 'aprende', etiqueta: 'Capacitaciones y talleres', grupo: 'Comunidad', icono: 'book', ambito: 'COMUN', disponible: false },
  { clave: 'juegos', etiqueta: 'Juegos', grupo: 'Comunidad', icono: 'game', ambito: 'COMUN', disponible: false },
  { clave: 'retos', etiqueta: 'Retos', grupo: 'Comunidad', icono: 'gift', ambito: 'COMUN', disponible: false },
  { clave: 'recompensas', etiqueta: 'Recompensas', grupo: 'Comunidad', icono: 'points', ambito: 'COMUN', disponible: false },
  { clave: 'bienestar', etiqueta: 'Salud y bienestar', grupo: 'Comunidad', icono: 'heart', ambito: 'COMUN', disponible: false },
  { clave: 'publicaciones', etiqueta: 'Publicaciones', grupo: 'Contenidos', icono: 'post', ambito: 'COMUN', disponible: false },
  { clave: 'usuarios', etiqueta: 'Usuarios', grupo: 'Administración', icono: 'usuarios', ambito: 'ADMIN', disponible: true },
  { clave: 'roles', etiqueta: 'Roles y permisos', grupo: 'Administración', icono: 'roles', ambito: 'ADMIN', disponible: true },
  { clave: 'configuracion', etiqueta: 'Configuración', grupo: 'Administración', icono: 'configuracion', ambito: 'ADMIN', disponible: true },
  { clave: 'actividad', etiqueta: 'Registro de actividad', grupo: 'Administración', icono: 'actividad', ambito: 'ADMIN', disponible: true },
  { clave: 'reportes', etiqueta: 'Reportes', grupo: 'Administración', icono: 'report', ambito: 'ADMIN', disponible: false },
  { clave: 'notificaciones', etiqueta: 'Notificaciones', grupo: 'Comunidad', icono: 'notificaciones', ambito: 'COMUN', disponible: true },
  { clave: 'ayuda', etiqueta: 'Centro de ayuda', grupo: 'Comunidad', icono: 'ayuda', ambito: 'COMUN', disponible: true },
];

/** Roles de partida del sistema (no se pueden eliminar; sí se les pueden cambiar los permisos). */
export const ROLES_INICIALES = [
  {
    clave: 'ADMIN',
    nombre: 'Administrador',
    descripcion: 'Gestiona usuarios, permisos, configuración y bitácora. Ingresa con segundo factor.',
    requiereSegundoFactor: true,
    alcanceGlobal: true,
    interfaz: 'ADMINISTRACION',
    disponibles: null, // null = todos los módulos del catálogo
    obligatorios: ['panel', 'ayuda', 'usuarios', 'roles'],
    modulos: [
      'panel', 'referidos', 'usuarios', 'roles', 'configuracion', 'actividad', 'notificaciones', 'ayuda',
      'aprende', 'juegos', 'retos', 'publicaciones', 'reportes',
    ],
  },
  {
    clave: 'GESTOR',
    nombre: 'Gestor de contenidos',
    descripcion: 'Publica y mantiene capacitaciones, talleres, juegos y material educativo.',
    requiereSegundoFactor: false,
    alcanceGlobal: false,
    interfaz: 'ADMINISTRACION',
    disponibles: ['panel', 'notificaciones', 'ayuda', 'aprende', 'juegos', 'retos', 'bienestar', 'publicaciones'],
    obligatorios: ['panel', 'ayuda'],
    modulos: ['panel', 'notificaciones', 'ayuda', 'aprende', 'juegos', 'publicaciones'],
  },
  {
    clave: 'SOCIO',
    nombre: 'Socio',
    descripcion: 'Participa en la comunidad, comparte referidos, aprende, juega y gana recompensas.',
    requiereSegundoFactor: false,
    alcanceGlobal: false,
    interfaz: 'COMUNIDAD',
    disponibles: [
      'panel', 'referidos', 'notificaciones', 'ayuda', 'comunidad', 'aprende', 'juegos', 'retos',
      'recompensas', 'bienestar',
    ],
    obligatorios: ['panel', 'ayuda'],
    modulos: [
      'panel', 'referidos', 'notificaciones', 'ayuda', 'comunidad', 'aprende', 'juegos', 'retos',
      'recompensas',
    ],
  },
];
