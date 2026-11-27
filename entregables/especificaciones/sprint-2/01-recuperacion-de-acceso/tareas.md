# Tareas · Recuperación de acceso

Plan: [`plan.md`](plan.md) · Estado: Completado

- [x] T01 — Tabla `Recuperacion` en `sprint1.sql` (CA-01)
- [x] T02 — `POST /auth/forgot` con respuesta idéntica y enlace de 30 min (CA-01, CA-02)
- [x] T03 — `POST /auth/reset` de un solo uso que revoca sesiones y 2FA (CA-03, CA-05)
- [x] T04 — Regla de contraseña en servidor y en pantalla (CA-04)
- [x] T05 — Ocultar `devResetUrl` en producción (CA-06)
- [x] T06 — Pantalla `recuperar.page` (pedir enlace y nueva contraseña)
- [x] T07 — Prueba `RF-07` y paso de recuperación en `e2e/smoke.cjs`
- [ ] T08 — Medir RNF-22 (5 min) con usuarios y RNF-14 con SMTP real

## Verificación (2026-11-16)

| Criterio | Prueba | ¿Pasa? |
| -------- | ------ | ------ |
| CA-01, CA-03, CA-05 | `RF-07` · `e2e/smoke.cjs` | Sí |
| CA-02, CA-06 | `producción nunca expone enlaces ni códigos` | Sí |
| CA-04 | `HU-013 / HU-014…` (misma validación) | Sí |

<!-- TRAZABILIDAD-VIGENTE -->
## Trazabilidad vigente al 22 de noviembre de 2026

| Referencia | Valor |
| --- | --- |
| Sprint planificado | 2 |
| Historias | HU-004 |
| Épicas de BKL-G1 | EPI-02 |
| Requisitos de usuario | UR-05 |
| Requisitos funcionales | RF-07 · RF-07-1 · RF-07-2 |
| Requisitos no funcionales | RNF-03 · RNF-04 · RNF-12 · RNF-14 · RNF-22 |
| Casos de uso | CU-02.3 Solicitar recuperación de acceso (extend de CU-02) · CU-02.5 Restablecer la contraseña (extend de CU-02.3) |
| Diagram_ID de comportamiento | 39 Sequence; 40 Activity |
| Modelo UML vigente | [SUMA-Diagramas_Vistas.eapx](../../../SUMA-Diagramas_Vistas.eapx) |
| Registro general | [Matriz completa de las 61 historias](../../TRAZABILIDAD.md) |

La construcción adelantada no cambia el sprint planificado. Los CA conservan sus identificadores y se interpretan junto con la ruta de esta especificación. Las pruebas y tareas conservan su evidencia; esta actualización documental no acredita verificaciones nuevas.
<!-- /TRAZABILIDAD-VIGENTE -->
