# Plan técnico · Gestión de referidos

Especificación: [`especificacion.md`](especificacion.md) · Estado: Implementado

## 1. Chequeo contra la constitución

| Principio | ¿Se cumple? | Nota |
| --------- | ----------- | ---- |
| II. Nada quemado | Sí | Puntos desde `Configuracion.puntosReferido`; acceso por módulo `referidos` |
| III. Seguridad | Sí | El filtro por `socioId` se aplica en el servidor; correo y celular cifrados con índice HMAC |
| IV. Trazabilidad | Sí | Bajas lógicas; todas las acciones en `Actividad` |
| V. Prueba por criterio | Sí | Ver §7 |
| VI. Accesibilidad | Sí | Campos con `CampoComponent` y avisos con `AvisoService` |
| VII. Arquitectura | Sí | Estados y dictamen en `dominio/referidos.mjs` |

## 2. Modelo de datos

| Tabla / columnas | Migración |
| ---------------- | --------- |
| `Referido` (`nombre`, `correo`, `celular`, `estado`, `socioId`, `notas`, `creadoEn`) | `sprint1.sql` |
| `Referido.eliminadoEn`, `eliminadoPor`, `motivoBaja`, `usuarioId`; se quita `UNIQUE(correo)` | `sprint1-auditoria.sql` |
| `Referido.fechaDecision`, `campania`, `provincia`, `correoIndice` | `sprint1-dominio.sql` |
| `MovimientoPuntos` (`referidoId` PK, `usuarioId`, `cantidad`, `fecha`) | `sprint1-dominio.sql` |
| `Notificacion` | `sprint1.sql` |

Unicidad del correo: solo entre filas con `eliminadoEn IS NULL`, comparando `correoIndice`.

## 3. API

| Método | Ruta | Acceso | Respuestas |
| ------ | ---- | ------ | ---------- |
| GET | `/api/referidos?page&estado&desde&hasta&buscar&campania&provincia` | módulo `referidos` (socio: solo los suyos) | 200 `{items, total, porPagina: 20, porEstado}` · 400 |
| GET | `/api/referidos/exportar` | módulo `referidos` | 200 (hasta 5000 filas con los mismos filtros) |
| POST | `/api/referidos` | módulo `referidos` | 201 · 400 (`campos`) · 409 (duplicado) |
| PATCH | `/api/referidos/:id` | dueño, solo *Pendiente* | 200 · 403 · 404 |
| PATCH | `/api/referidos/:id/dictamen` | `admin(req, 'referidos')` | 200 · 403 · 409 (no pendiente o cuenta no aprobada) |
| PATCH | `/api/referidos/:id/baja` | `current(req, 'referidos')`: el dueño, solo si está *Pendiente* | 200 · 400 (sin motivo) · 403 |
| GET | `/api/referidos/asociables` | `admin(req, 'referidos')` | 200 `{usuarios, socios}` |
| POST | `/api/referidos/asociar` | `admin(req, 'referidos')` | 201 · 400 (mismo usuario) · 409 (más de 30 días) |

`admin(req, modulo)` = sesión válida + módulo asignado + rol con `alcanceGlobal` (si no, 403).
| GET | `/api/notificaciones` · PATCH `/api/notificaciones/leer` | módulo `notificaciones` | 200 |

`diasHabiles(desde, hasta)` en `api.mjs` calcula el atraso (`diasHabilesPendiente`).

## 4. Dominio

`backend/src/dominio/referidos.mjs` — `Referido.estados`, `aprobar(estadoCuenta, fecha)`, `rechazar(fecha)`;
solo dictamina *Pendientes* y exige `CuentaCooperativa.estaAprobada`.
`backend/src/dominio/administracion.mjs` — `MovimientoPuntos` (entero entre 0 y 10000), `Notificacion`.

## 5. Frontend

| Pantalla | Ruta | Archivos |
| -------- | ---- | -------- |
| Referidos (socio y administración) | `/panel/referidos` | `features/referidos/referidos.page.*`, `referidos.api.ts`, `referidos.routes.ts` |
| Notificaciones | `/panel/notificaciones` | `features/notificaciones/notificaciones.page.ts`, `notificaciones.store.ts` |
| Paginador | — | `shared/paginador/paginador.component.ts` |
| Modelos y estados | — | `core/models/domain.ts` |

## 6. Bitácora

`Referido registrado` · `Referido actualizado` · `Dictamen de referido` · `Referido dado de baja` · `Asociación manual`.

## 7. Estrategia de pruebas

| Criterio | Prueba (`backend/test/sprint.test.mjs`) |
| -------- | --------------------------------------- |
| CA-01 a CA-07 | `RF-11 / RNF-12: valida, rechaza código, evita duplicados y pagina de 20` |
| CA-08 | `días hábiles: excluye fines de semana y feriados fijos de Ecuador` + atraso de "carlos" en `RF-11 / RNF-12` |
| CA-09 a CA-13 | `RF-11-4: dictamen reservado a administración y con cuenta vinculada aprobada` |
| CA-12 (puntos) | `RF-14 / RF-14-2 / RF-42` (`/api/overview` devuelve 100 puntos) |
| CA-14 a CA-16 | `RF-11-6: baja lógica que conserva el historial` |
| CA-17, CA-18 | `RF-11-5: asociación manual dentro de 30 días` (el límite de 30 días no tiene prueba propia) |
| Frontend | `features.spec.ts` (listado, baja) · `e2e/smoke.cjs` (CRUD + dictamen + baja) |

## 8. Decisiones y riesgos

| Decisión | Alternativas descartadas | Motivo |
| -------- | ------------------------ | ------ |
| Baja lógica con `eliminadoEn` | Borrado físico | Conservar el historial (auditoría) |
| Unicidad del correo solo entre activos | `UNIQUE` en la columna | Permite volver a referir tras una baja |
| Feriados fijos en código | Tabla de feriados | Suficiente para el Sprint 1; los feriados móviles quedan fuera (riesgo aceptado) |
