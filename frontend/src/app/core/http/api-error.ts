import { HttpErrorResponse } from '@angular/common/http';

export interface ErrorApi {
  status: number;
  mensaje: string;
  /** Causa y corrección por campo (RF-49-2, RNF-16). */
  campos: Record<string, string>;
  bloqueadoHasta?: string;
}

/** Convierte cualquier error HTTP en un mensaje legible para la persona usuaria. */
export function leerError(error: unknown): ErrorApi {
  if (error instanceof HttpErrorResponse) {
    const body = (error.error ?? {}) as {
      message?: string | string[];
      campos?: Record<string, string>;
      bloqueadoHasta?: string;
    };
    const message = Array.isArray(body.message) ? body.message.join('. ') : body.message;
    return {
      status: error.status,
      mensaje:
        message ||
        (error.status === 0
          ? 'No se pudo conectar con el servidor. Revisa tu conexión y vuelve a intentarlo.'
          : 'No se pudo completar la operación. Vuelve a intentarlo.'),
      campos: body.campos ?? {},
      bloqueadoHasta: body.bloqueadoHasta,
    };
  }
  return {
    status: 0,
    mensaje: 'Ocurrió un error inesperado. Vuelve a intentarlo.',
    campos: {},
  };
}
