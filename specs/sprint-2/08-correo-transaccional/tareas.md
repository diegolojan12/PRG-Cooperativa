# Tareas · Correo transaccional

- [x] T01 — Pruebas de configuración, TLS y reintentos (CA-01 a CA-04).
- [x] T02 — Adaptador compartido y vigencia de mensajes (CA-01 a CA-04, CA-08).
- [x] T03 — Diagnóstico SMTP y guía de configuración Gmail/otros (CA-06).
- [x] T04 — Cambio explícito del correo del administrador, cifrado y auditado (CA-05).
- [x] T05 — Integración SMTP local de 2FA, recuperación y confirmación (CA-07).
- [x] T06 — Verificación de suites y matriz de Jira/specs/código hasta Sprint 3.
- [ ] T07 — Medición RNF-14 diferida. Gmail ya está configurado y el usuario confirmó recepción real de 2FA; no se ha medido el 95 % de entregas de todos los flujos.

## Verificación

2026-11-19: backend `test:sprint` 33/33; `test:correo` 4/4 (incluye API + SMTP de loopback + PostgreSQL
aislado); frontend 17/17; lint de ambos sin errores (backend conserva 7 advertencias existentes);
compilación de ambos correcta; smoke Chromium de siete bloques correcto y sin errores JavaScript.
Parser PowerShell correcto. El diagnóstico inicial sin proveedor es histórico; posteriormente el usuario configuró Gmail y confirmó una recepción real.

No declarar entrega real ni cierre al 100 % sin T07 y las pruebas de usuario pendientes de las specs originales.
Seguimiento: G2-82 (correo real), G2-83 (auditoría); informe en `docs/AUDITORIA-G2-SPRINTS-1-3-2026-11-19.md`.

<!-- TRAZABILIDAD-VIGENTE -->
## Trazabilidad vigente al 22 de noviembre de 2026

| Referencia | Valor |
| --- | --- |
| Sprint planificado | Transversal a Sprint 1 y 2; cambio de correo reutilizado por HU-023 del Sprint 3 |
| Historias | HU-001 · HU-003 · HU-004 · HU-014 · HU-023 |
| Épicas de BKL-G1 | EPI-01 · EPI-02 · EPI-06 |
| Requisitos de usuario | Transversal; véase requisito aplicable |
| Requisitos funcionales | RF-08-2, RF-07, RF-02, RF-03 |
| Requisitos no funcionales | RNF-06, RNF-12, RNF-14 |
| Casos de uso | CU-17.2/17.3 · CU-02.2/02.3/02.5 · CU-01.2 · CU-03.4 (reutilización) |
| Diagram_ID de comportamiento | 34 Sequence; 37 Sequence; 39 Sequence; 67 Sequence |
| Modelo UML vigente | [SUMA-Diagramas_Vistas.eapx](../../../entregables/SUMA-Diagramas_Vistas.eapx) |
| Registro general | [Matriz completa de las 61 historias](../../TRAZABILIDAD.md) |

La construcción adelantada no cambia el sprint planificado. Los CA conservan sus identificadores y se interpretan junto con la ruta de esta especificación. Las pruebas y tareas conservan su evidencia; esta actualización documental no acredita verificaciones nuevas.
<!-- /TRAZABILIDAD-VIGENTE -->
