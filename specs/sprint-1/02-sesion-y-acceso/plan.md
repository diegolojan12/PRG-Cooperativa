# Plan técnico · Sesión y acceso

Especificación: [`especificacion.md`](especificacion.md) · Estado: Implementado

## 1. Chequeo contra la constitución

| Principio | ¿Se cumple? | Nota |
| --------- | ----------- | ---- |
| II. Nada quemado | Sí | Segundo factor según `Rol.requiereSegundoFactor` |
| III. Seguridad | Sí | Solo se guardan huellas SHA-256 de tokens y códigos; cookie `httpOnly`, `sameSite=lax`, `secure` en producción |
| IV. Trazabilidad | Sí | Inicio de sesión, cierre y bloqueos en `Actividad` |
| V. Prueba por criterio | Sí | Ver §7 |
| VI. Accesibilidad | Sí | Alerta persistente de bloqueo en Login; ayuda y error en cada campo |
| VII. Arquitectura | Sí | `Sesion` y `CodigoVerificacion` en `dominio/acceso.mjs` |

## 2. Modelo de datos

| Tabla / columnas | Migración | Uso |
| ---------------- | --------- | --- |
| `Usuario` (`passwordHash`, `activo`) | `sprint1.sql` | Credenciales |
| `Usuario.intentosFallidos`, `bloqueadoHasta` | `sprint1-auditoria.sql` | Bloqueo (RF-04-2) |
| `Sesion` (`token` = huella, `usuarioId`, `expira`) | `sprint1.sql` | Sesión con vencimiento deslizante |
| `DosFactor` (`id`, `usuarioId`, huella del código, `expira`, `intentos`) | `sprint1-auditoria.sql` | Desafío de segundo factor |

Constantes de tiempo en `api.mjs`: `BLOQUEO_MS` 15 min · `CODIGO_2FA_MS` 5 min · `ESPERA_REINTENTO_MS` 5 min ·
`Sesion.INACTIVIDAD_MS` 15 min.

## 3. API

| Método | Ruta | Respuestas |
| ------ | ---- | ---------- |
| POST | `/api/auth/login` | 200 (sesión, `{requiere2fa, desafioId}` o `{requiereConfirmacion}`) · 401 · 403 (origen) · 423 (`bloqueadoHasta`) |
| POST | `/api/auth/2fa` | 200 + cookie `suma_session` · 401 |
| POST | `/api/auth/logout` | 200 |
| GET | `/api/auth/me` | 200 · 401 (vencida o cuenta inactiva) |

En desarrollo (`ENABLE_DEV_RESET_LINK=true`) la respuesta del login trae `devCodigo`; en producción nunca.

## 4. Dominio

`backend/src/dominio/acceso.mjs`:

- `Sesion.vencimiento()`; `current()` en `api.mjs` renueva `expira` en cada petición.
- `CodigoVerificacion.huella()`, `.segundoFactor()`, `.token()`, `esValido(valor, ahora)` (un uso, vigencia).

Correo: cola en memoria con 3 reintentos cada 5 min; no guarda códigos en texto plano.

## 5. Frontend

| Pantalla / servicio | Ruta | Archivos |
| ------------------- | ---- | -------- |
| Inicio de sesión + 2FA | `/iniciar-sesion` | `features/publico/login.page.*` |
| Cierre por inactividad entre pestañas | — | `core/auth/inactividad.service.ts` |
| Estado de sesión y 401 | — | `core/auth/session.store.ts`, `core/http/auth.interceptor.ts` |

## 6. Bitácora

| Acción | Cuándo |
| ------ | ------ |
| `Inicio de sesión` | Sesión creada (tras el 2FA cuando aplica) |
| `Cierre de sesión` | `POST /auth/logout` |
| `Cuenta bloqueada` | Quinto intento fallido |
| `Usuario actualizado` | Desactivación de la cuenta (`datos.activo=false`, `objetivoId`) |

## 7. Estrategia de pruebas

| Criterio | Prueba (`backend/test/sprint.test.mjs`) |
| -------- | --------------------------------------- |
| CA-01 a CA-05 | `RF-04-1 / RNF-06: credenciales, origen y segundo factor del administrador` |
| CA-06 | `RF-04-2: bloqueo de 15 minutos tras 5 intentos fallidos consecutivos` |
| CA-07, CA-08 | `RF-04-3: la sesión se renueva con cada acción y vence tras 15 min sin acciones` |
| CA-08 (cliente) | `frontend/src/app/core/auth/auth.spec.ts` (inactividad) |
| CA-09, CA-10 | `RF-04-4: desactivar cuenta y cerrar sesión` |
| CA-17 | `producción nunca expone enlaces ni códigos` |
| CA-18 | Sin prueba automatizada: la cola vive en memoria (decisión de §8) |
| Flujo completo | `e2e/smoke.cjs` · «portada, acceso administrador con 2FA y tablero» |

## 8. Decisiones y riesgos

| Decisión | Alternativas descartadas | Motivo |
| -------- | ------------------------ | ------ |
| Sesión opaca en cookie + tabla `Sesion` | JWT en `localStorage` | Se revoca al instante (logout, desactivación, recuperación) y no queda expuesta a XSS |
| Vencimiento deslizante en servidor + aviso en cliente | Solo temporizador en cliente | El servidor es la autoridad; el cliente solo redirige a tiempo |
| Cola de correo en memoria | Cola persistente (BullMQ/Redis) | Los códigos de un solo uso no se guardan en claro; los reintentos se pierden si el proceso se reinicia (riesgo aceptado, P-13 de la revisión del 2026-11-16) |
