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
