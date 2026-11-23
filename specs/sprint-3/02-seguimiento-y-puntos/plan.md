# Plan técnico · Estado de referidos, dictamen y puntos automáticos

Especificación: [`especificacion.md`](especificacion.md) · Estado: Implementado

## 1. Chequeo contra la constitución

| Principio | ¿Se cumple? | Nota |
| --------- | ----------- | ---- |
| II. Nada quemado | Sí | Valores de puntos en `Configuracion`; la vista de socio o de administración depende de `esAdmin`, no del nombre del rol |
| III. Seguridad | Sí | El socio solo recibe la proyección `consultaSocio()`; dictamen bajo `FOR UPDATE` |
| IV. Trazabilidad | Sí | `Dictamen de referido`, `Parámetro actualizado`; movimientos inmutables por clave |
| V. Prueba por criterio | Sí | Ver §7 |
| VII. Arquitectura | Sí | `AcreditacionPuntos` y `MovimientoPuntos` en `dominio/administracion.mjs`; `Referido.consultaSocio()` en `dominio/referidos.mjs` |

## 2. Modelo de datos · `backend/prisma/sprint2.sql`

| Cambio | Para qué |
| ------ | -------- |
| `MovimientoPuntos.clave` como nueva clave primaria (`actividad:evento:usuario`) | Varios destinatarios por referido e idempotencia (CA-07, CA-11) |
| `MovimientoPuntos.actividad` (obligatoria) y `referidoId` opcional | Actividades que no son referidos (CA-09) |
| Datos anteriores migrados a `referido:<id>:<usuario>` con actividad `REFERIDO` | Conservar los créditos del Sprint 1 (CA-13) |
| Índice `notificacion_destinatario (usuarioId, id)` | Bandeja rápida para el sondeo |
| Parámetros `puntosCapacitacion`, `puntosTrivia`, `puntosTaller`, `puntosReto` (0) y `valorPunto` (0.00) | RF-14-3, RF-14-4 (sembrados en `Database.init()`) |

## 3. API

| Método | Ruta | Acceso | Respuestas |
| ------ | ---- | ------ | ---------- |
| GET | `/api/referidos?pagina&estado&buscar` | módulo `referidos` | Socio: 10 por página con `{id, nombre (de pila), creadoEn, estado}`; administración: 20 con todos los datos |
| PATCH | `/api/referidos/:id/dictamen` | `admin(req,'referidos')` | 200 · 409 (no pendiente o cuenta no Aprobada); acredita a socio y referido |
| GET | `/api/notificaciones/bandeja?pagina` | módulo `notificaciones`, **sin renovar sesión** | 200 `{items, sinLeer, porPagina: 20, cuentaEstado, cuentaVerificada}` |
| PATCH | `/api/notificaciones/:id/leer` · `/api/notificaciones/leer` | destinatario | 200 · 404 si no es suyo |
| PUT | `/api/configuracion` | `admin(req,'configuracion')` | acepta los puntos por acción y `valorPunto` |

## 4. Dominio

- `Referido.consultaSocio()` → `{id, nombre: nombreDePila, creadoEn, estado}` (RF-39-1).
- `Referido.aprobar(estadoCuenta, fecha)` exige `CuentaCooperativa.estaAprobada`.
- `AcreditacionPuntos.registrar(actividad, eventoId, usuarios, fecha, client, importes?)` — exige transacción;
  lee el parámetro de la actividad; `INSERT … ON CONFLICT (clave) DO NOTHING`; notifica solo si insertó.
- `MovimientoPuntos(usuarioId, actividad, eventoId, cantidad, fecha)` — entero de 0 a 10 000.
- `ParametroGlobal` acepta `valorPunto` con 2 decimales.

## 5. Frontend

| Pantalla | Ruta | Archivos |
| -------- | ---- | -------- |
| Mis referidos (10 por página, nombre de pila, fecha, estado) | `/panel/referidos` | `features/referidos/referidos.page.*` |
| Dictamen | `/panel/referidos` (administración) | `features/referidos/referidos.page.*` |
| Bandeja de notificaciones con «sin leer» y sondeo cada 3 s | `/panel/notificaciones` + ambos shells | `features/notificaciones/notificaciones.page.ts`, `notificaciones.store.ts` (`sondear()`) |
| Puntos por acción y valor del punto | `/panel/configuracion` | `features/administracion/configuracion.page.*` |

## 6. Bitácora

`Dictamen de referido` (`datos: {anterior, nuevo}`) · `Parámetro actualizado` (`datos: {parametro, anterior, nuevo}`).

## 7. Estrategia de pruebas

| Criterio | Prueba (`backend/test/sprint.test.mjs`) |
| -------- | --------------------------------------- |
| CA-01, CA-02 | `RF-11 / RNF-12: valida, rechaza código y pagina de 10 para socio o 20 para administración` · `RF-11: vinculación…` (nombre de pila) |
| CA-03, CA-04 | `RF-39: las notificaciones se leen por destinatario sin renovar la sesión al consultar` · `RF-11-4` (aviso al socio) |
| CA-05 | `RF-11-4: dictamen reservado a administración y con cuenta vinculada aprobada` |
| CA-06, CA-07, CA-10, CA-12, CA-13 | `RF-11: vinculación…` (dos aprobaciones simultáneas → 200 y 409; 2 créditos de 100; «Ganaste 100 puntos.»; cambio a 500 no altera lo acreditado) |
| CA-09, CA-11 | `HU-022: acreditar una actividad interna es idempotente y usa su parámetro` |
| CA-08 | `RF-42: el dictamen deja en la bitácora el estado anterior y el nuevo` |
| CA-12 (bitácora de parámetros) | `RF-14 / RF-14-2 / RF-42` |

## 8. Decisiones y riesgos

| Decisión | Alternativas descartadas | Motivo |
| -------- | ------------------------ | ------ |
| Clave determinista por evento y destinatario | Bandera «acreditado» en el referido | Idempotencia para cualquier actividad futura |
| Mismo `puntosReferido` para ambas partes | Inventar un parámetro de bienvenida | Las campañas (HU-025, Sprint 3) definen los dos valores; la regla quedó en RF-12-2 (P-01 por confirmar con el PO) |
| Sondeo de la bandeja que no renueva la sesión | Renovar en cada consulta | Si renovara, una pestaña abierta impediría el cierre por inactividad (RF-04-3) |

<!-- TRAZABILIDAD-VIGENTE -->
## Trazabilidad vigente al 22 de noviembre de 2026

| Referencia | Valor |
| --- | --- |
| Sprint planificado | 3 |
| Historias | HU-020 · HU-021 · HU-022 |
| Épicas de BKL-G1 | EPI-07 · EPI-08 · EPI-10 |
| Requisitos de usuario | UR-15 · UR-16 · UR-19 · UR-24 · UR-44 |
| Requisitos funcionales | RF-11-2 · RF-11-4 · RF-12 (RF-12-1, RF-12-2) · RF-14-3 · RF-14-4 · RF-38 (RF-38-1) · RF-39 (RF-39-1, RF-39-2) · RF-42 |
| Requisitos no funcionales | RNF-01 · RNF-13 · RNF-20 |
| Casos de uso | CU-06 Consultar referidos · CU-06.2 Aprobar o rechazar un referido (extend) · CU-06.4 Acreditar los puntos al socio y al referido (extend de CU-06.2) · CU-36 Consultar notificaciones |
| Diagram_ID de comportamiento | 45 Sequence; 46 Activity; 47 Sequence; 48 Activity |
| Modelo UML vigente | [SUMA-Diagramas_Vistas_Textos_Centrados.eapx](../../../entregables/SUMA-Diagramas_Vistas_Textos_Centrados.eapx) |
| Registro general | [Matriz completa de las 61 historias](../../TRAZABILIDAD.md) |

La construcción adelantada no cambia el sprint planificado. Los CA conservan sus identificadores y se interpretan junto con la ruta de esta especificación. Las pruebas y tareas conservan su evidencia; esta actualización documental no acredita verificaciones nuevas.
<!-- /TRAZABILIDAD-VIGENTE -->
