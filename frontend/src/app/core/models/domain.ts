/**
 * Modelo de dominio único (Documento de Visión v1.1.0, RF-08-1, RF-11-4).
 * El compilador señala cualquier uso de estados o roles no documentados.
 */
export type Rol = 'ADMIN' | 'GESTOR' | 'SOCIO';
export type EstadoReferido = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
export type Modulo =
  | 'panel'
  | 'referidos'
  | 'usuarios'
  | 'roles'
  | 'configuracion'
  | 'actividad'
  | 'notificaciones'
  | 'ayuda';

export const ROLES: readonly Rol[] = ['ADMIN', 'GESTOR', 'SOCIO'];
export const ESTADOS: readonly EstadoReferido[] = ['PENDIENTE', 'APROBADO', 'RECHAZADO'];

export const ETIQUETAS_ROL: Record<Rol, string> = {
  ADMIN: 'Administrador',
  GESTOR: 'Gestor de contenidos',
  SOCIO: 'Socio',
};
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
  cuentaVerificada?: boolean;
  cuentaEstado?: EstadoReferido | null;
}

export interface Desafio2fa {
  requiere2fa: true;
  desafioId: string;
  destino: string;
  devCodigo?: string;
}
export interface DesafioConfirmacion {
  requiereConfirmacion: true;
  token: string;
  destino: string;
  devCodigo?: string;
}
export interface AvisoPrivacidad {
  version: string;
  terminos: string;
  privacidad: string;
}
export type RespuestaLogin = Usuario | Desafio2fa | DesafioConfirmacion;
export const requiere2fa = (r: RespuestaLogin): r is Desafio2fa => 'requiere2fa' in r;

export interface Referido {
  id: number;
  nombre: string;
  correo?: string;
  celular?: string;
  estado: EstadoReferido;
  socio?: string;
  socioId?: number;
  usuarioId?: number | null;
  fechaDecision?: string | null;
  notas?: string | null;
  creadoEn: string;
  /** Calculado en el servidor sin fines de semana ni feriados de Ecuador. */
  diasHabilesPendiente?: number;
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
  saldo?: number;
  acumulados?: number;
  nivel?: { nombre: string; siguiente: string | null; faltan: number };
  sinLeer?: number;
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
  modulos: Modulo[];
  disponibles: Modulo[];
  obligatorios: Modulo[];
}

export interface Configuracion {
  contacto: string;
  puntosReferido: string;
  registroAbierto: 'true' | 'false';
  mensajeBienvenida: string;
  puntosCapacitacion?: string;
  puntosTrivia?: string;
  puntosTaller?: string;
  puntosReto?: string;
  valorPunto?: string;
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
