/**
 * Modelo de dominio único (Documento de Visión v1.1.0, RF-08-1, RF-11-4).
 * El compilador señala cualquier uso de estados o roles no documentados.
 */
/** Clave de un rol (p. ej. ADMIN, SOCIO). Los roles se administran en la base de datos (HU-001). */
export type Rol = string;
export type EstadoReferido = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
/** Clave de un módulo del catálogo (tabla Modulo). */
export type Modulo = string;

/** Experiencia que recibe un rol al entrar: red social para socios o panel de administración. */
export type Interfaz = 'COMUNIDAD' | 'ADMINISTRACION';

export interface ItemMenu {
  id: Modulo;
  etiqueta: string;
  grupo: string;
  icono: string;
  /** false = el módulo existe en el catálogo pero su pantalla llega en un sprint posterior. */
  disponible: boolean;
}

export interface ModuloCatalogo extends ItemMenu {
  ambito: 'ADMIN' | 'COMUN';
}

export const ESTADOS: readonly EstadoReferido[] = ['PENDIENTE', 'APROBADO', 'RECHAZADO'];

export const ETIQUETAS_ESTADO: Record<EstadoReferido, string> = {
  PENDIENTE: 'Pendiente',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
};

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: Rol;
  activo: boolean;
  celular?: string | null;
  creadoEn?: string;
  modulos: Modulo[];
  /** Menú del usuario, calculado en el servidor a partir de los permisos de su rol (HU-002). */
  menu: ItemMenu[];
  esAdmin: boolean;
  interfaz: Interfaz;
  rolNombre: string;
  cuentaVerificada?: boolean;
  cuentaEstado?: EstadoReferido | null;
}

export interface Desafio2fa {
  requiere2fa: true;
  desafioId: string;
  destino: string;
  devCodigo?: string;
}
export type RespuestaLogin = Usuario | Desafio2fa;
export const requiere2fa = (r: RespuestaLogin): r is Desafio2fa => 'requiere2fa' in r;

export interface Referido {
  id: number;
  nombre: string;
  correo: string;
  celular: string;
  estado: EstadoReferido;
  socio: string;
  socioId: number;
  notas: string | null;
  creadoEn: string;
  /** Calculado en el servidor sin fines de semana ni feriados de Ecuador. */
  diasHabilesPendiente: number;
}
export interface NuevoReferido {
  nombre: string;
  correo: string;
  celular: string;
  notas: string;
  consentimiento?: boolean;
}

export interface Pagina<T> {
  items: T[];
  total: number;
  pagina: number;
  porPagina: number;
}
export interface PaginaReferidos extends Pagina<Referido> {
  porEstado: Record<EstadoReferido, number>;
  filtros?: { campanias: string[]; provincias: string[] };
}

export interface Resumen {
  referidos: number;
  mes: number;
  estados: Record<EstadoReferido, number>;
  puntos: number;
  bienvenida: string;
  demo: boolean;
}

export interface Indicador {
  id: string;
  etiqueta: string;
  valor: number;
  unidad: string;
  disponibleDesde?: string;
}
export interface Tablero {
  generadoEn: string;
  sociosActivos: number;
  pendientesAtrasados: number;
  estados: Record<EstadoReferido, number>;
  indicadores: Indicador[];
}

export interface RolPermiso {
  rol: Rol;
  nombre: string;
  descripcion: string;
  sistema: boolean;
  requiereSegundoFactor: boolean;
  alcanceGlobal: boolean;
  interfaz: Interfaz;
  modulos: Modulo[];
  disponibles: Modulo[];
  obligatorios: Modulo[];
  usuarios: number;
}

export interface OpcionRol {
  rol: Rol;
  nombre: string;
  descripcion: string;
  alcanceGlobal: boolean;
  interfaz: Interfaz;
}

export interface Configuracion {
  contacto: string;
  puntosReferido: string;
  registroAbierto: 'true' | 'false';
  mensajeBienvenida: string;
}

export interface Actividad {
  id: number;
  usuarioId: number | null;
  actor: string;
  accion: string;
  detalle: string;
  ip: string | null;
  objetivoId: number | null;
  datos: Record<string, unknown>;
  fecha: string;
}
export interface OpcionesActividad {
  usuarios: { id: number; nombre: string }[];
  acciones: string[];
}

export interface Notificacion {
  id: number;
  titulo: string;
  mensaje: string;
  leida: boolean | number;
  fecha: string;
}

export interface Asociables {
  usuarios: Usuario[];
  socios: { id: number; nombre: string; correo: string }[];
}

export interface CuentaPendiente {
  id: number;
  nombre: string;
  tipo: 'ahorros' | 'corriente';
  numero: string;
  fecha: string;
  diasHabiles: number;
}
