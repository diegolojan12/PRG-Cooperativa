# Tareas · Vinculación y verificación de la cuenta de la Cooperativa

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

## Fase 1 · Pruebas

- [x] T01 — `RF-11: vinculación, código, registro asociado y exportación privada` (CA-02 a CA-04, CA-08, CA-13)
- [x] T02 — `HU-015 / HU-016 / RF-06` (CA-01, CA-05 a CA-12, CA-15) · añadida al integrar en `main`

## Fase 2 · Backend

- [x] T03 — `GET/POST /auth/cuenta` con enmascarado y revelación por el titular (CA-01 a CA-06)
- [x] T04 — Bloqueo por número (`pg_advisory_xact_lock`) y unicidad Pendiente/Aprobado (CA-02)
- [x] T05 — Cola `GET /usuarios/cuentas-pendientes`: antigüedad, 20 por página, `diasHabiles` (CA-07)
- [x] T06 — `PATCH /usuarios/:id/cuenta`: Aprobado/Rechazado con motivo, bitácora y aviso en la misma transacción (CA-08 a CA-10)
- [x] T07 — Generar el código de referido al aprobar (CA-13)
- [x] T08 — RF-06-1: `POST /referidos` y `/referidos/mi-codigo` exigen cuenta Aprobada (CA-11)
- [x] T09 — Sustituir `rol === 'SOCIO'` por `esParticipante()` / `participa()` (CA-15, constitución II)

## Fase 3 · Frontend

- [x] T10 — `MiCuentaPage` dentro del shell Comunidad (CA-01, CA-04 a CA-06)
- [x] T11 — Aviso «Vincular mi cuenta» en inicio y Referidos (CA-12)
- [x] T12 — Cola con resaltado de más de 2 días hábiles en Usuarios (CA-07)
- [x] T13 — Estado de la cuenta refrescado por el sondeo de notificaciones (CA-09, CA-13)

## Verificación

| Criterio | Prueba que lo cubre | ¿Pasa? |
| -------- | ------------------- | ------ |
| CA-01 | `HU-015 / HU-016 / RF-06` | Sí |
| CA-02, CA-03, CA-04 | `RF-11: vinculación…` | Sí |
| CA-05, CA-06 | `HU-015 / HU-016 / RF-06` | Sí |
| CA-07 | `HU-015 / HU-016 / RF-06` | Sí |
| CA-08 | `HU-015 / HU-016 / RF-06` · `RF-11: vinculación…` | Sí |
| CA-09, CA-10 | `HU-015 / HU-016 / RF-06` (aviso) · `RF-11: vinculación…` | Sí (la bitácora no se consulta en la prueba) |
| CA-11 | `HU-015 / HU-016 / RF-06` · `RF-11: vinculación…` | Sí |
| CA-12, CA-14 | Revisión de pantallas | Implementado |
| CA-13 | `RF-11: vinculación…` | Sí |
| CA-15 | `HU-015 / HU-016 / RF-06` | Sí |

<!-- TRAZABILIDAD-VIGENTE -->
## Trazabilidad revisada al 26 de noviembre de 2026

| Referencia | Valor |
| --- | --- |
| Sprint planificado | 2 |
| Historias | HU-015 · HU-016 |
| Épicas de BKL-G1 | EPI-06 · EPI-08 |
| Requisitos de usuario | UR-07 · UR-08 · UR-09 · UR-14 · UR-44 |
| Requisitos funcionales | RF-05 (RF-05-1 a RF-05-6) · RF-06 (RF-06-1 a RF-06-3) · RF-39 · RF-42 |
| Requisitos no funcionales | RNF-05 · RNF-12 · RNF-16 · RNF-23 · RNF-24 |
| Casos de uso | CU-04 Solicitar vinculación de cuenta cooperativa · CU-04.1 Validar los datos y la unicidad de la cuenta (include) · CU-04.2 Registrar solicitud para validación automática (revisado en auditoría 1) (include) · CU-05.4 Comprobar que la cuenta vinculada esté aprobada (include de CU-05 y CU-12) · CU-18 Validar automáticamente una cuenta vinculada (revisado en auditoría 1) · CU-18.1 Generar el código y el enlace de referido (extend) |
| Diagram_ID de comportamiento | 43 Sequence; 44 Activity; 69 Sequence; 70 Activity; 101 Sequence; 102 Activity |
| Modelo UML revisado: casos de uso y clases | [SUMA-Diagramas_Vistas.eapx](../../../../SUMA-Diagramas_Vistas.eapx) |
| Registro general | [Matriz completa de las 61 historias](../../TRAZABILIDAD.md) |

La construcción adelantada no cambia el sprint planificado. Los CA conservan sus identificadores y se interpretan junto con la ruta de esta especificación. Las pruebas y tareas conservan su evidencia; esta actualización documental no acredita verificaciones nuevas.
<!-- /TRAZABILIDAD-VIGENTE -->
