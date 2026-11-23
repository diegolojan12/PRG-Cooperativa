# Tareas · Gestión de referidos

Plan: [`plan.md`](plan.md) · Estado: Base implementada; edición del socio en interfaz pendiente. P-01 confirmada en la especificación

## Fase 1 · Datos

- [x] T01 — Tabla `Referido` y `Notificacion` (`sprint1.sql`) (CA-01)
- [x] T02 — Columnas de baja lógica y fin del `UNIQUE(correo)` (`sprint1-auditoria.sql`) (CA-14, CA-15)
- [x] T03 — `fechaDecision`, `campania`, `provincia`, `correoIndice`, `MovimientoPuntos` (`sprint1-dominio.sql`) (CA-07, CA-12)
- [x] T04 — Migración de estados CONTACTADO→PENDIENTE, VALIDADO→APROBADO (G01)

## Fase 2 · Pruebas

- [x] T05 — `RF-11 / RNF-12`, `RF-11-4`, `RF-11-5`, `RF-11-6`, `días hábiles`
- [x] T06 — Prueba del límite de 30 días en la asociación manual (CA-18): `RF-11-5: no se asocia a quien se registró hace más de 30 días`

## Fase 3 · Backend

- [x] T07 — Alta con validación, consentimiento, saneamiento y duplicados (CA-01 a CA-05)
- [x] T08 — Listado de 20 por página con filtros, `porEstado` y `diasHabilesPendiente` (CA-06 a CA-08 · G08)
- [x] T09 — Aislamiento por socio en el servidor (CA-09)
- [x] T10 — Dictamen solo de administración con cuenta aprobada, puntos y notificación (CA-10 a CA-13 · G11)
- [x] T11 — Baja lógica con motivo (CA-14 a CA-16 · G06)
- [x] T12 — Asociación manual dentro de 30 días (CA-17, CA-18 · G12)
- [x] T13 — Exportación con los mismos filtros
- [x] T18 — Provincia heredada del usuario en el alta por código y en la asociación manual (CA-19 · 2026-11-16)
- [x] T19 — `ROLES_PARTICIPANTES` en asociables y asociación manual (CA-20 · 2026-11-16)

## Fase 4 · Frontend

- [x] T14 — Pantalla de referidos: alta, edición administrativa, filtros, paginación, atraso resaltado y baja con motivo; la edición del socio se sigue en T20
- [x] T15 — Dictamen y asociación manual en la vista de administración
- [x] T16 — Notificaciones del socio

## Fase 5 · Cierre

- [x] T17 — P-02 resuelta con el backlog; P-01 confirmada por el usuario al autorizar la corrección de HU-011/HU-012 en Jira (2026-11-19)

## Verificación

| Criterio | Prueba que lo cubre | ¿Pasa? |
| -------- | ------------------- | ------ |
| CA-01 a CA-07 | `RF-11 / RNF-12` | Sí |
| CA-08 | `días hábiles` · `RF-11 / RNF-12` | Sí |
| CA-09 a CA-13 | `RF-11-4` | Sí |
| CA-14 a CA-16 | `RF-11-6` | Sí |
| CA-17 | `RF-11-5` | Sí |
| CA-18 | `RF-11-5` (mismo usuario) · `RF-11-5: no se asocia… 30 días` | Sí |
| CA-19 | `T-01: la provincia es obligatoria en el registro y la hereda el referido` | Sí |
| CA-20 | `RF-11-5: no se asocia… 30 días` (lista de socios por rol participante) | Sí |

## Pendiente de integración de HU-011

- [ ] T20 — Completar edición de referidos propios Pendientes y no vinculados para el socio desde la interfaz, con datos propios autorizados y prueba del recorrido completo (RF-11, CA-09). Conservar el listado privado y los permisos por propiedad.

<!-- TRAZABILIDAD-VIGENTE -->
## Trazabilidad vigente al 22 de noviembre de 2026

| Referencia | Valor |
| --- | --- |
| Sprint planificado | 2 |
| Historias | HU-011 · HU-012 |
| Épicas de BKL-G1 | EPI-05 |
| Requisitos de usuario | UR-13 · UR-16 · UR-17 · UR-54 |
| Requisitos funcionales | RF-11 · RF-11-3 · RF-11-4 · RF-11-5 · RF-11-6 |
| Requisitos no funcionales | RNF-12 · RNF-13 |
| Casos de uso | CU-06 Consultar referidos · CU-06.1 Filtrar (extend) · CU-06.2 Aprobar o rechazar (extend) · CU-06.5 Gestionar los datos de un referido (extend) · CU-06.6 Asociar manualmente (extend) |
| Diagram_ID de comportamiento | 45 Sequence; 46 Activity; 47 Sequence; 48 Activity |
| Modelo UML vigente | [SUMA-Diagramas_Vistas_Textos_Centrados.eapx](../../../../SUMA-Diagramas_Vistas_Textos_Centrados.eapx) |
| Registro general | [Matriz completa de las 61 historias](../../TRAZABILIDAD.md) |

La construcción adelantada no cambia el sprint planificado. Los CA conservan sus identificadores y se interpretan junto con la ruta de esta especificación. Las pruebas y tareas conservan su evidencia; esta actualización documental no acredita verificaciones nuevas.
<!-- /TRAZABILIDAD-VIGENTE -->
