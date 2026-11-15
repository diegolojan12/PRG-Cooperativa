# Plan técnico · Registro en 3 pasos y confirmación del correo

Especificación: [`especificacion.md`](especificacion.md) · Estado: Implementado

## 1. Chequeo contra la constitución

| Principio | ¿Se cumple? | Nota |
| --------- | ----------- | ---- |
| II. Nada quemado | Sí | Rol por defecto `SOCIO` = clave del rol del sistema (RF-08-2); textos del aviso por versión |
| III. Seguridad | Sí | Código y token solo como huella; 5 intentos; producción sin SMTP no registra ni muestra códigos |
| IV. Trazabilidad | Sí | `Registro`, `Referido asociado por código` en `Actividad`; evidencia en `AceptacionTerminos` |
| V. Prueba por criterio | Sí | Ver §7 |
| VI. Accesibilidad | Sí | Barra de progreso con porcentaje, ayuda y error por campo, foco en el primer error |
| VII. Arquitectura | Sí | `ConfirmacionCorreo` en `dominio/confirmacion-correo.mjs`; `AvisoPrivacidad`/`AceptacionTerminos` en `dominio/acceso.mjs` |

## 2. Modelo de datos · `backend/prisma/sprint2.sql`

| Cambio | Para qué |
| ------ | -------- |
| `Usuario.correoVerificado BOOLEAN DEFAULT TRUE` | Las cuentas anteriores siguen activas; el registro nuevo inserta `false` (RF-02-3) |
| `Usuario.celularIndice` + índice | Unicidad del celular cifrado (RF-01-2, RNF-05) |
| Tabla `ConfirmacionCorreo` (`usuarioId` PK, `token`, `tokenExpira`, `huella`, `vence`, `intentos`, `reenvios`) | Código de 6 dígitos, 10 min, 5 intentos, 3 reenvíos por hora |
| Tabla `AvisoPrivacidad` (`version` PK, `terminos`, `privacidad`) | Textos versionados (clase `AvisoPrivacidad` del EAPX) |
| Tabla `AceptacionTerminos` (`usuarioId`, `version`, `fecha`) | Evidencia RF-47-2 (clase `AceptacionTerminos` del EAPX, `Usuario 1 — 1..* AceptacionTerminos`) |

La migración se registra en `SumaMigracion` y se aplica una sola vez desde `Database.init()` (`MIGRACIONES` en `backend/src/database.mjs`).

## 3. API

| Método | Ruta | Acceso | Respuestas |
| ------ | ---- | ------ | ---------- |
| GET | `/api/auth/aviso-privacidad` | público | 200 `{version, terminos, privacidad}` · 503 si no hay aviso publicado en producción |
| POST | `/api/auth/register` | público | 201 `{requiereConfirmacion, token, destino}` · 400 (`campos`) · 403 (registro cerrado) · 409 (correo, celular o cuenta ya usados) · 503 |
| POST | `/api/auth/confirmar-correo` | `token` de reanudación | 200 · 400 |
| POST | `/api/auth/reenviar-confirmacion` | `token` de reanudación | 200 · 429 (3 reenvíos por hora) |
| POST | `/api/auth/login` | público | además de lo del Sprint 1: 200 `{requiereConfirmacion, token}` sin cookie si el correo no está confirmado |

En desarrollo (`ENABLE_DEV_RESET_LINK=true`) las respuestas traen `devCodigo`; en producción nunca.

## 4. Dominio

- `AvisoPrivacidad.vigente()` — lee `SUMA_AVISO_VERSION`, `SUMA_TERMINOS`, `SUMA_PRIVACIDAD`; en desarrollo usa la versión `0.1` de prueba.
- `AceptacionTerminos(aviso, aceptado, version, fecha)` — exige `aceptado === true` y la versión vigente.
- `ConfirmacionCorreo` — `iniciar`, `reanudar`, `confirmar`, `reenviar`, `pendiente` (operaciones del diagrama de clases).
- `CodigoVerificacion.segundoFactor()` genera los 6 dígitos; la huella se firma con HMAC.

## 5. Frontend

| Pantalla | Ruta | Archivos |
| -------- | ---- | -------- |
| Registro en 3 pasos | `/registro?ref=CODIGO` | `features/publico/registro.page.ts`, `registro.page.html` |
| Confirmar correo | `/confirmar-correo` | `features/publico/confirmar-correo.page.ts` |
| Inicio de sesión (redirige a confirmar) | `/iniciar-sesion` | `features/publico/login.page.ts` |
| Cliente HTTP | — | `core/auth/auth.api.ts` |

## 6. Bitácora

`Registro` (`objetivoId` = nuevo usuario) · `Referido asociado por código` (si llegó con código, `datos.socioId`).

## 7. Estrategia de pruebas

| Criterio | Prueba (`backend/test/sprint.test.mjs`) |
| -------- | --------------------------------------- |
| CA-03, CA-05, CA-06, CA-07, CA-09 a CA-13 | `HU-013 / HU-014: consentimiento, unicidad, confirmación, vencimiento y reenvíos` |
| CA-03 (cuenta), CA-14 | `RF-11: vinculación, código, registro asociado y exportación privada` |
| CA-15 | `producción nunca expone enlaces ni códigos` (no se muestran códigos); el bloqueo del registro sin SMTP no tiene prueba propia |
| CA-08 | Indirecta: en `RF-11: vinculación…` la cuenta nueva usa módulos del rol Socio (`/referidos`, `/auth/cuenta`) |
| CA-01, CA-02, CA-04 | Frontend: `registro.page` (progreso y conservación de datos) · `e2e/smoke.cjs` (alta por enlace a 390 px) |
| Migración sobre datos del Sprint 1 | Verificada manualmente en PostgreSQL 16 (créditos y cuentas anteriores conservados; doble `init()` sin error) |

## 8. Decisiones y riesgos

| Decisión | Alternativas descartadas | Motivo |
| -------- | ------------------------ | ------ |
| Token de reanudación de 24 h + código de 10 min | Enlace mágico por correo | El backlog pide un código de 6 dígitos |
| Cuentas anteriores = confirmadas | Forzar confirmación a todos | No romper el acceso de los usuarios del Sprint 1 |
| Aviso por variables de entorno | Pantalla de publicación | RF-47-4 queda fuera del sprint; evita textos sin aprobar |
| Cola de correo en memoria | Cola persistente | Igual que el Sprint 1; los reintentos solo se hacen mientras el código sigue vigente |
