# Plan técnico · Vinculación y verificación de la cuenta de la Cooperativa

Especificación: [`especificacion.md`](especificacion.md) · Estado: Implementado

## 1. Chequeo contra la constitución

| Principio | ¿Se cumple? | Nota |
| --------- | ----------- | ---- |
| II. Nada quemado | Sí | Quién vincula sale de la experiencia del rol (`Rol.interfaz='COMUNIDAD'` sin `alcanceGlobal`), no de `rol === 'SOCIO'` |
| III. Seguridad | Sí | Número cifrado; bloqueo `pg_advisory_xact_lock` por número para evitar dos vinculaciones simultáneas |
| IV. Trazabilidad | Sí | `Vinculación solicitada` y `Revisión de cuenta vinculada` en `Actividad` |
| V. Prueba por criterio | Sí | Ver §7 |
| VII. Arquitectura | Sí | Reglas en `CuentaCooperativa` (`dominio/acceso.mjs`); un único punto de verificación (RNF-24) |

## 2. Modelo de datos

Sin tablas nuevas: usa las columnas del Sprint 1 (`Usuario.cuenta`, `tipoCuenta`, `cuentaEstado`, `cuentaIndice`,
`cuentaSolicitadaEn`, `cuentaRevisadaEn`). `cuentaEstado` acepta `PENDIENTE`, `APROBADO`/`APROBADA` y `RECHAZADO`/`RECHAZADA`
(los dos sufijos por compatibilidad con datos anteriores; `Usuario` siempre los publica como `APROBADO`/`RECHAZADO`).

## 3. API

| Método | Ruta | Acceso | Respuestas |
| ------ | ---- | ------ | ---------- |
| GET | `/api/auth/cuenta?mostrar=1` | sesión, rol participante | 200 `{numero, tipo, estado}` (enmascarado salvo `mostrar=1`) · 403 |
| POST | `/api/auth/cuenta` | sesión, rol participante | 201 `{cuentaEstado: 'PENDIENTE'}` · 400 · 403 · 409 (pendiente propia o número ya vinculado) |
| GET | `/api/usuarios/cuentas-pendientes?pagina` | `admin(req,'usuarios')` | 200 `{items:[{id,nombre,tipo,numero,fecha,diasHabiles}], porPagina: 20}` |
| PATCH | `/api/usuarios/:id/cuenta` | `admin(req,'usuarios')` | 200 · 400 (estado inválido o rechazo sin motivo) · 404 · 409 (no pendiente o número aprobado en otra cuenta) |
| GET | `/api/notificaciones/bandeja` | sesión | 200 con `cuentaEstado` y `cuentaVerificada` para refrescar la interfaz sin volver a entrar |

Helpers en `api.mjs`: `esParticipante(rol)`, `participa(clave)`, `ROLES_PARTICIPANTES` (subconsulta SQL).

## 4. Dominio

`CuentaCooperativa` — valida tipo y 10 dígitos, `aprobar(fecha)`, `rechazar(motivo, fecha)` (solo desde Pendiente),
`numeroEnmascarado()` (`******` + 4 últimos), `estaAprobada(estado)`.

## 5. Frontend

| Pantalla | Ruta | Archivos |
| -------- | ---- | -------- |
| Mi cuenta (vincular, ver estado, mostrar número) | `/panel/mi-cuenta` (shell Comunidad) | `features/resumen/mi-cuenta.page.ts` |
| Paso 2 del registro | `/registro` | `features/publico/registro.page.html` |
| Cola de cuentas pendientes (resaltado > 2 días hábiles) | `/panel/usuarios` | `features/administracion/usuarios.page.*` |
| Aviso «Vincular mi cuenta» | `/panel`, `/panel/referidos` | `features/comunidad/feed.page.html`, `features/referidos/referidos.page.html` |
| Estado de la cuenta en vivo | — | `NotificacionesStore.sondear()` actualiza `cuentaEstado` cada 3 s |

## 6. Bitácora

| Acción | `datos` |
| ------ | ------- |
| `Vinculación solicitada` | `objetivoId` = usuario |
| `Revisión de cuenta vinculada` | `objetivoId`, `anterior`, `nuevo`, `motivo` |

## 7. Estrategia de pruebas

| Criterio | Prueba (`backend/test/sprint.test.mjs`) |
| -------- | --------------------------------------- |
| CA-01, CA-05 a CA-12 (bloqueo), CA-15 | `HU-015 / HU-016 / RF-06: vinculación, cola de revisión, rechazo y nuevo intento` |
| CA-02, CA-03, CA-04, CA-13 | `RF-11: vinculación, código, registro asociado y exportación privada` |
| CA-08 (número aprobado en otra cuenta) | `RF-11: vinculación…` |
| CA-12, CA-14 | Revisión de pantallas (inicio y Referidos); los módulos abiertos no consultan la cuenta |

## 8. Decisiones y riesgos

| Decisión | Alternativas descartadas | Motivo |
| -------- | ------------------------ | ------ |
| Verificación manual en un único endpoint | Integración con la Cooperativa | Fuera de alcance (acta); RNF-24 pide un único punto de cambio |
| Autorizar por experiencia del rol | `rol === 'SOCIO'` (así venía en la rama `sprint-2`) | Constitución II; un rol nuevo con experiencia Comunidad también puede vincular |
| Sondeo de 3 s | WebSocket | Cumple el máximo de 5 s sin infraestructura extra; la consulta no renueva la sesión |
