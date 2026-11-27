# Tareas · Estado de referidos, dictamen y puntos automáticos

> Revisión de auditoría 2026-11-26: la validación de cuentas y referidos es automática contra la base institucional autorizada. El administrador solo consulta. La implementación y las pruebas de esta revisión están pendientes; la evidencia del flujo manual es histórica. Véase [validación automática](../../validacion-automatica.md).

## Revisión de auditoría · trabajo pendiente

- [ ] A01 — Concretar fuente institucional y contrato de identidad, vigencia y condición habilitada (RF-50, RNF-23, RNF-24).
- [ ] A02 — Validación automática, persistencia de evidencia y reintentos cada 5 minutos; no decidir ante falla técnica (RF-05-4, RF-50-2).
- [ ] A03 — Disparar reevaluación por registro activo, cuenta validada y asociación corregida (RF-11-4).
- [ ] A04 — Integridad, unicidad y transacción de estado, créditos de ambas partes y avisos idempotentes (RF-12-2, RNF-20).
- [ ] A05 — Retirar dictamen manual de API y pantallas; conservar consulta y seguimiento (UR-08, UR-16, RF-05-3, RF-11-3).
- [ ] A06 — Probar titularidad correcta e incorrecta, fuente caída o desactualizada, concurrencia, reinicio, rollback y autorización; medir plazos y carga.
- [x] A07a — Casos de uso y clases revisados en `SUMA-Diagramas_Vistas.eapx`, PDF y SVG (2026-11-26).
- [ ] A07b — Adaptar secuencias y actividades afectadas e ilustraciones antiguas de Word; el código sigue pendiente.

Estos ítems no están implementados ni verificados. Véase [la revisión general](../../validacion-automatica.md).

## Tareas y verificación históricas · flujo manual sustituido

Las casillas completadas y resultados siguientes se refieren a la versión anterior de los criterios y no acreditan la automatización.

Plan: [`plan.md`](plan.md) · Estado: Revisión de automatización pendiente

## Fase 1 · Datos

- [x] T01 — `sprint2.sql`: nueva clave de `MovimientoPuntos`, `actividad`, migración de créditos anteriores (CA-07, CA-11, CA-13)
- [x] T02 — Índice de la bandeja de notificaciones (CA-03)
- [x] T03 — Parámetros de puntos por acción y `valorPunto` sembrados en `init()` (CA-12)

## Fase 2 · Pruebas

- [x] T04 — `RF-11: vinculación…` (CA-06, CA-07, CA-10, CA-12, CA-13)
- [x] T05 — `HU-022: acreditar una actividad interna…` (CA-09, CA-11)
- [x] T06 — `RF-39: las notificaciones se leen por destinatario…` (CA-03, CA-04)

## Fase 3 · Backend

- [x] T07 — `Referido.consultaSocio()` y paginación de 10 para el socio (CA-01, CA-02)
- [x] T08 — Dictamen atómico con acreditación a socio y referido (CA-05 a CA-08)
- [x] T09 — `AcreditacionPuntos` y `MovimientoPuntos` con clave idempotente (CA-09 a CA-11)
- [x] T10 — `/notificaciones/bandeja` sin renovar sesión (CA-04)
- [x] T11 — `ParametroGlobal` con `valorPunto` (CA-12)
- [x] T12 — Vista por capacidad (`esAdmin`) en vez de `rol === 'ADMIN'` en listados, alta y exportación

## Fase 4 · Frontend

- [x] T13 — Lista del socio con nombre de pila, fecha y estado (CA-01)
- [x] T14 — Bandeja con contador sin leer y sondeo cada 3 s en los shells Comunidad y Panel (CA-03)
- [x] T15 — Configuración de puntos por acción y valor del punto (CA-12)

## Fase 5 · Cierre

- [ ] T16 — Decidir con el PO los puntos del referido mientras no haya campañas (P-01)

## Verificación

| Criterio | Prueba que lo cubre | ¿Pasa? |
| -------- | ------------------- | ------ |
| CA-01, CA-02 | `RF-11 / RNF-12` · `RF-11: vinculación…` | Sí |
| CA-03, CA-04 | `RF-39` · `RF-11-4` | Sí |
| CA-05 | `RF-11-4` | Sí |
| CA-06, CA-07 | `RF-11: vinculación…` | Sí |
| CA-08 | `RF-42: el dictamen deja en la bitácora el estado anterior y el nuevo` | Sí |
| CA-09, CA-11 | `HU-022` | Sí |
| CA-10, CA-12, CA-13 | `RF-11: vinculación…` | Sí |

<!-- TRAZABILIDAD-VIGENTE -->
## Trazabilidad revisada al 26 de noviembre de 2026

| Referencia | Valor |
| --- | --- |
| Sprint planificado | 3 |
| Historias | HU-020 · HU-021 · HU-022 |
| Épicas de BKL-G1 | EPI-07 · EPI-08 · EPI-10 |
| Requisitos de usuario | UR-15 · UR-16 · UR-19 · UR-24 · UR-44 |
| Requisitos funcionales | RF-11-2 · RF-11-4 · RF-12 (RF-12-1, RF-12-2) · RF-14-3 · RF-14-4 · RF-38 (RF-38-1) · RF-39 (RF-39-1, RF-39-2) · RF-42 |
| Requisitos no funcionales | RNF-01 · RNF-13 · RNF-20 |
| Casos de uso | CU-06 Consultar referidos · CU-06.2 Validar automáticamente un referido (revisado en auditoría 1) (extend) · CU-06.4 Acreditar los puntos al socio y al referido (extend de CU-06.2) · CU-36 Consultar notificaciones |
| Diagram_ID de comportamiento | 45 Sequence; 46 Activity; 47 Sequence; 48 Activity |
| Modelo UML revisado: casos de uso y clases | [SUMA-Diagramas_Vistas.eapx](../../../../SUMA-Diagramas_Vistas.eapx) |
| Registro general | [Matriz completa de las 61 historias](../../TRAZABILIDAD.md) |

La construcción adelantada no cambia el sprint planificado. Los CA conservan sus identificadores y se interpretan junto con la ruta de esta especificación. Las pruebas y tareas conservan su evidencia; esta actualización documental no acredita verificaciones nuevas.
<!-- /TRAZABILIDAD-VIGENTE -->
