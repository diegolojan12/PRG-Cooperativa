# Tareas · Configuración del perfil

Plan: [`plan.md`](plan.md) · Estado: Implementación adelantada; aceptación de HU-023 pendiente

## Fase 1 · Pruebas

- [x] T01 — `HU-055 / HU-056 / RF-03 / RF-46: configuración del perfil` (CA-02 a CA-08, CA-14)

## Fase 2 · Backend

- [x] T02 — Migración `sprint2-perfil.sql` y `schema.prisma` (`perfilPublico`, `bajaEn`, `bajaMotivo`, `CambioCorreo`)
- [x] T03 — `PATCH /auth/perfil` con las mismas reglas del registro y unicidad del celular (CA-02, CA-03)
- [x] T04 — Cambio de correo con código: `ConfirmacionCorreo.iniciarCambio()` / `confirmarCambio()` (CA-04, CA-05)
- [x] T05 — `POST /auth/perfil/clave` y cierre de las demás sesiones (CA-06)
- [x] T07 — `POST /auth/perfil/baja`: baja lógica, cierre de sesión, bloqueo para administradores (CA-07, CA-08)

## Fase 3 · Frontend

- [x] T08 — Página *Mi perfil* con 5 secciones y ayuda en todos los campos
- [x] T09 — Ruta `/panel/perfil` en las dos experiencias y enlace desde la tarjeta del usuario

## Fase 4 · Documentación

- [x] T10 — CU-03 con sus sub-casos en el EAPX; backlog Excel y Jira; matriz de trazabilidad

La numeración de criterios y tareas se conserva para trazabilidad. T06 y CA-09 a CA-13 pasan al Sprint 5. No se cambió el estado de HU-023 ni de HU-055 en Jira.

## Correspondencia de la prueba histórica

El nombre literal `HU-055 / HU-056 / RF-03 / RF-46: configuración del perfil` se conserva porque así existe en `backend/test/sprint.test.mjs`. Su parte RF-03 se traza a HU-023 (Sprint 3, EPI-06; HU-055 duplicada) y su parte RF-46 a HU-056 (Sprint 5, EPI-20). El nombre de la prueba no reasigna las historias al Sprint 2.

<!-- TRAZABILIDAD-VIGENTE -->
## Trazabilidad vigente al 22 de noviembre de 2026

| Referencia | Valor |
| --- | --- |
| Sprint planificado | 3 |
| Historias | HU-023 · HU-055 duplicada histórica, sin entrega adicional |
| Épicas de BKL-G1 | EPI-06 |
| Requisitos de usuario | UR-06 Mantener los datos al día |
| Requisitos funcionales | RF-03 (RF-03-1 a RF-03-3) · RF-42 |
| Requisitos no funcionales | RNF-04 · RNF-05 · RNF-12 · RNF-16 |
| Casos de uso | CU-03, CU-03.1, CU-03.3 y CU-03.4 |
| Diagram_ID de comportamiento | 35 Sequence; 36 Activity; 41 Sequence; 42 Activity |
| Modelo UML vigente | [SUMA-Diagramas_Vistas_Textos_Centrados.eapx](../../../entregables/SUMA-Diagramas_Vistas_Textos_Centrados.eapx) |
| Registro general | [Matriz completa de las 61 historias](../../TRAZABILIDAD.md) |

La construcción adelantada no cambia el sprint planificado. Los CA conservan sus identificadores y se interpretan junto con la ruta de esta especificación. Las pruebas y tareas conservan su evidencia; esta actualización documental no acredita verificaciones nuevas.
<!-- /TRAZABILIDAD-VIGENTE -->
