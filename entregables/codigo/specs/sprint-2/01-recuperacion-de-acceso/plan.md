# Plan técnico · Recuperación de acceso

Especificación: [`especificacion.md`](especificacion.md) · Estado: Implementado

## 1. Chequeo contra la constitución

| Principio | ¿Se cumple? | Nota |
| --------- | ----------- | ---- |
| III. Seguridad | Sí | Solo la huella SHA-256 del token; respuesta idéntica exista o no el correo; límite por IP |
| IV. Trazabilidad | Sí | `Recuperación solicitada` y `Contraseña actualizada` en `Actividad` |
| V. Prueba por criterio | Sí | Ver §6 |

## 2. Modelo de datos

| Tabla | Migración | Uso |
| ----- | --------- | --- |
| `Recuperacion` (`token` = huella, `usuarioId`, `expira`) | `sprint1.sql` | Enlace de un solo uso; también para activar cuentas creadas por el administrador |

Constantes en `api.mjs`: `RECUPERACION_MS` 30 min · `ACTIVACION_MS` 24 h.

## 3. API

| Método | Ruta | Respuestas |
| ------ | ---- | ---------- |
| POST | `/api/auth/forgot` | 200 siempre (no revela si el correo existe) · 429 (límite por IP) |
| POST | `/api/auth/reset` | 200 (revoca sesiones y 2FA) · 400 (token inválido, usado o vencido, o contraseña débil) |

`createResetLink()` borra el enlace anterior del usuario antes de crear el nuevo, dentro de una transacción.

## 4. Frontend

| Pantalla | Ruta | Archivos |
| -------- | ---- | -------- |
| Pedir enlace y definir contraseña | `/recuperar-contrasena` y `/recuperar-contrasena?token=` | `features/publico/recuperar.page.*` |

## 5. Bitácora

| Acción | Cuándo |
| ------ | ------ |
| `Recuperación solicitada` | `POST /auth/forgot` con un correo existente |
| `Contraseña actualizada` | `POST /auth/reset` correcto |

## 6. Estrategia de pruebas

| Criterio | Prueba |
| -------- | ------ |
| CA-01, CA-03, CA-05 | `RF-07: recuperación de un solo uso que revoca sesiones` (`backend/test/sprint.test.mjs`) |
| CA-02, CA-06 | `producción nunca expone enlaces ni códigos` |
| CA-04 | Validación `password()` compartida con el registro (`HU-013 / HU-014…`) |
| Flujo completo | `e2e/smoke.cjs` · «recuperación de contraseña desde interfaz» |

<!-- TRAZABILIDAD-VIGENTE -->
## Trazabilidad vigente al 22 de noviembre de 2026

| Referencia | Valor |
| --- | --- |
| Sprint planificado | 2 |
| Historias | HU-004 |
| Épicas de BKL-G1 | EPI-02 |
| Requisitos de usuario | UR-05 |
| Requisitos funcionales | RF-07 · RF-07-1 · RF-07-2 |
| Requisitos no funcionales | RNF-03 · RNF-04 · RNF-12 · RNF-14 · RNF-22 |
| Casos de uso | CU-02.3 Solicitar recuperación de acceso (extend de CU-02) · CU-02.5 Restablecer la contraseña (extend de CU-02.3) |
| Diagram_ID de comportamiento | 39 Sequence; 40 Activity |
| Modelo UML vigente | [SUMA-Diagramas_Vistas.eapx](../../../../SUMA-Diagramas_Vistas.eapx) |
| Registro general | [Matriz completa de las 61 historias](../../TRAZABILIDAD.md) |

La construcción adelantada no cambia el sprint planificado. Los CA conservan sus identificadores y se interpretan junto con la ruta de esta especificación. Las pruebas y tareas conservan su evidencia; esta actualización documental no acredita verificaciones nuevas.
<!-- /TRAZABILIDAD-VIGENTE -->
