# Sprint 3 · Invitaciones, seguimiento y fidelización

| Campo | Valor |
| ----- | ----- |
| Estado | En parte: HU-017 a HU-022 implementadas y verificadas por adelantado durante el Sprint 2; HU-023 documentada con implementación adelantada; HU-024 a HU-029 pendientes de especificación/aceptación |
| Semanas | 13–14 |
| Historias | **HU-017 a HU-029** (columna *Sprint* de la hoja `BKL-G1`) |
| Objetivo | Que el socio verificado invite con su enlace o QR, siga a sus referidos y reciba puntos, y que la administración maneje campañas, puntos, niveles e insignias |

## Funcionalidades

| # | Funcionalidad | HU | Casos de uso | Spec | Plan | Tareas | Estado |
| - | ------------- | -- | ------------ | ---- | ---- | ------ | ------ |
| 01 | Enlace, QR, compartir y alta por enlace | HU-017, HU-018, HU-019 | CU-05, CU-05.1 a CU-05.4, CU-01.3, CU-18.1 | [spec](01-invitacion/especificacion.md) | [plan](01-invitacion/plan.md) | [tareas](01-invitacion/tareas.md) | Verificada · pruebas en dispositivo pendientes |
| 02 | Estado de referidos, dictamen y puntos automáticos | HU-020, HU-021, HU-022 | CU-06, CU-06.2, CU-06.4, CU-36 | [spec](02-seguimiento-y-puntos/especificacion.md) | [plan](02-seguimiento-y-puntos/plan.md) | [tareas](02-seguimiento-y-puntos/tareas.md) | Verificada |
| 03 | Datos del perfil y baja | HU-023 (HU-055 duplicada) | CU-03 | [spec](03-configuracion-perfil/especificacion.md) | [plan](03-configuracion-perfil/plan.md) | [tareas](03-configuracion-perfil/tareas.md) | Implementación adelantada; aceptación pendiente |
| — | Lista comercial, campañas, saldo y reglas de puntos | HU-024 a HU-029 | CU-03, CU-06.3, CU-07, CU-08 | — | — | — | Por especificar; perfil, CSV y reglas tienen código reutilizable ([auditoría G2](../../docs/AUDITORIA-G2-SPRINTS-1-3-2026-11-19.md)) |

## Matriz de trazabilidad (historias ya implementadas)

| HU | Épica | UR | RF / RNF | Caso de uso | Prueba (`backend/test/sprint.test.mjs` salvo indicación) |
| -- | ----- | -- | -------- | ----------- | -------------------------------------------------------- |
| HU-017 Enlace y QR | EPI-07 | UR-10, UR-11 | RF-09-1 a RF-09-3, RF-06-2 · RNF-19 | CU-05.1, CU-05.2, CU-18.1 | `RF-11: vinculación…` |
| HU-018 Compartir | EPI-07 | UR-12 | RF-10-1 a RF-10-3 · RNF-17, RNF-21 | CU-05.3 | `e2e/smoke.cjs` |
| HU-019 Alta por enlace | EPI-07 | UR-13 | RF-01-5, RF-11, RF-11-1 | CU-01.3 | `RF-11: vinculación…` · `HU-019 / CA-13` · `e2e/smoke.cjs` |
| HU-020 Estado de referidos | EPI-07 | UR-15, UR-44 | RF-11-2, RF-39-1, RF-39-2 | CU-06, CU-36 | `RF-11 / RNF-12…` · `RF-39…` |
| HU-021 Dictamen | EPI-08 | UR-16, UR-19 | RF-11-4, RF-12-2, RF-42 | CU-06.2, CU-06.4 | `RF-11-4…` · `RF-11: vinculación…` · `RF-42: el dictamen…` |
| HU-022 Puntos automáticos | EPI-10 | UR-24 | RF-12-1, RF-14-3, RF-14-4, RF-38-1 · RNF-20 | CU-06.4 | `HU-022…` · `RF-11: vinculación…` |

## Decisiones abiertas con el Product Owner

| # | Decisión | Spec |
| - | -------- | ---- |
| 1 | Dominio oficial del enlace y texto del mensaje de WhatsApp | 01 · P-01, P-02 |
| 2 | Puntos del referido mientras no haya campañas: aplicado `puntosReferido` para ambas partes (RF-12-2), falta confirmación | 02 · P-01 |

## Pendientes

1. Lectura del QR con cámara nativa (RNF-19) y compartir en 15 segundos (RNF-21) con usuarios y dispositivos.
2. Especificar HU-023 a HU-029 antes de implementarlas.
