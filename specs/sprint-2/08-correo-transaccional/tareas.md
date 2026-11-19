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
