# Plan técnico · Gestión de referidos

> Revisión de auditoría 2026-11-26: la validación de cuentas y referidos es automática contra la base institucional autorizada. El administrador solo consulta. La implementación y las pruebas de esta revisión están pendientes; la evidencia del flujo manual es histórica. Véase [validación automática](../../validacion-automatica.md).

## Diseño vigente tras auditoría · 2026-11-26

Aplicar [la revisión de validación automática](../../validacion-automatica.md). El código y las API descritos en el antecedente todavía implementan decisiones manuales y no acreditan este diseño.

1. Implementar un servicio interno de validación con acceso institucional de solo lectura o réplica autorizada y vigente. Comprobar identidad institucional, cuenta, condición habilitada y unicidad; no usar datos autodeclarados como prueba.
2. Persistir solicitud, intentos, causa, resultado, fuente, versión de regla y próximo reintento. Las fallas técnicas conservan Pendiente y se reintentan cada 5 minutos; requisitos no completados disparan reevaluación al cambiar.
3. Ejecutar reevaluación tras registro activo, vinculación aprobada y asociación corregida. Conservar alta manual, filtros y exportación comercial; no equivalen a aprobar.
4. Sustituir los contratos de dictamen manual `PATCH /api/usuarios/:id/cuenta` y `PATCH /api/referidos/:id/dictamen`: ningún usuario, incluido administrador, puede decidir estados. El servicio interno persiste el resultado. Las rutas de vinculación y consulta siguen autorizadas por sesión, capacidad y propiedad.
5. Usar restricciones únicas e integridad referencial para cuentas y relaciones. Confirmar aprobación de referido, créditos a ambas partes y eventos de aviso en una transacción; deduplicar por evento y destinatario, con recuperación después de reinicio.
6. Retirar botones de aprobar/rechazar y la cola de revisión humana. Mostrar resultado, requisito faltante o incidencia y reintento. La administración conserva consulta de resultados, configuración, reportes y bitácora.
7. Verificar tiempos de RF-50 (5 s total), RF-11-4 (2 s), RF-12-2 (2 s), RF-39 (5 s), concurrencia, recuperación e imposibilidad de forzar aprobación desde cliente o administración. Los límites y sus puntos de medición figuran en la revisión general.

Dependencias: acceso autorizado, diccionario de datos, vínculo de identidad verificable, condición habilitada y vigencia de la fuente. Migraciones y contrato concreto se definirán al implementar; no se acreditan tablas, rutas nuevas ni pruebas inexistentes.

## Antecedente técnico del flujo manual · sustituido

El contenido siguiente conserva las decisiones y pruebas del código anterior. Sus rutas de aprobación, colas de revisión y decisiones manuales quedan sustituidas por el diseño vigente anterior.

Especificación: [`especificacion.md`](especificacion.md) · Estado: Diseño revisado; implementación pendiente

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
| CA-17, CA-18 | `RF-11-5: asociación manual dentro de 30 días` · `RF-11-5: no se asocia a quien se registró hace más de 30 días` |
| CA-19 | `T-01: la provincia es obligatoria en el registro y la hereda el referido` |
| CA-20 | `RF-11-5: no se asocia…` (asociables y socios por `ROLES_PARTICIPANTES`) |
| Frontend | `features.spec.ts` (listado, baja) · `e2e/smoke.cjs` (CRUD + dictamen + baja) |

## 8. Decisiones y riesgos

| Decisión | Alternativas descartadas | Motivo |
| -------- | ------------------------ | ------ |
| Baja lógica con `eliminadoEn` | Borrado físico | Conservar el historial (auditoría) |
| Unicidad del correo solo entre activos | `UNIQUE` en la columna | Permite volver a referir tras una baja |
| Feriados fijos en código | Tabla de feriados | Suficiente para el Sprint 1; los feriados móviles quedan fuera (riesgo aceptado) |

<!-- TRAZABILIDAD-VIGENTE -->
## Trazabilidad revisada al 26 de noviembre de 2026

| Referencia | Valor |
| --- | --- |
| Sprint planificado | 2 |
| Historias | HU-011 · HU-012 |
| Épicas de BKL-G1 | EPI-05 |
| Requisitos de usuario | UR-13 · UR-16 · UR-17 · UR-54 |
| Requisitos funcionales | RF-11 · RF-11-3 · RF-11-4 · RF-11-5 · RF-11-6 |
| Requisitos no funcionales | RNF-12 · RNF-13 |
| Casos de uso | CU-06 Consultar referidos · CU-06.1 Filtrar (extend) · CU-06.2 Validar automáticamente (extend; revisado en auditoría 1) · CU-06.5 Gestionar los datos de un referido (extend) · CU-06.6 Asociar manualmente (extend) |
| Diagram_ID de comportamiento | 45 Sequence; 46 Activity; 47 Sequence; 48 Activity |
| Modelo UML revisado: casos de uso y clases | [SUMA-Diagramas_Vistas.eapx](../../../../SUMA-Diagramas_Vistas.eapx) |
| Registro general | [Matriz completa de las 61 historias](../../TRAZABILIDAD.md) |

La construcción adelantada no cambia el sprint planificado. Los CA conservan sus identificadores y se interpretan junto con la ruta de esta especificación. Las pruebas y tareas conservan su evidencia; esta actualización documental no acredita verificaciones nuevas.
<!-- /TRAZABILIDAD-VIGENTE -->
