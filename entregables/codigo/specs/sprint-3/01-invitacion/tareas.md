# Tareas · Enlace, QR, compartir y alta por enlace

> Revisión de auditoría 2026-11-26: la validación de cuentas y referidos es automática contra la base institucional autorizada. El administrador solo consulta. La implementación y las pruebas de esta revisión están pendientes; la evidencia del flujo manual es histórica. Véase [validación automática](../../validacion-automatica.md).

Plan: [`plan.md`](plan.md) · Estado: Completado (pruebas en dispositivo pendientes)

## Fase 1 · Pruebas

- [x] T01 — `RF-11: vinculación, código, registro asociado y exportación privada` (CA-01 a CA-04, CA-10, CA-12)
- [x] T02 — Prueba de CA-13 (`HU-019 / CA-13`, 2026-11-16). CA-11 no puede darse en el alta: el código pertenece a una cuenta existente y el correo es único; la regla queda en el código como defensa

## Fase 2 · Backend

- [x] T03 — `CodigoReferido` con generación aleatoria y enlace validado (CA-01, CA-02)
- [x] T04 — Asignar código al aprobar la cuenta (CA-01)
- [x] T05 — `POST /referidos/mi-codigo` con QR PNG de 256 px (CA-02 a CA-04)
- [x] T06 — Validar y aplicar `codigoReferido` en el registro, en la misma transacción (CA-10 a CA-13)
- [x] T07 — Buscar al socio por experiencia del rol, no por `rol='SOCIO'`

## Fase 3 · Frontend

- [x] T08 — `InvitacionComponent` con copiar, WhatsApp (≤ 300 caracteres), Facebook, menú nativo y descarga del QR (CA-03, CA-05 a CA-07)
- [x] T09 — Bloque «Invita y gana» en el inicio del socio (CA-04, CA-08)
- [x] T10 — QR y código visibles en *Mi cuenta* (CA-03)
- [x] T11 — Precargar `?ref=` en el paso 3 del registro (CA-09)

## Fase 4 · Cierre

- [ ] T12 — Lectura del QR con cámara nativa en Android e iOS, 20 pruebas (RNF-19)
- [ ] T13 — Prueba cronometrada de compartir con 10 participantes (RNF-21)

## Verificación

| Criterio | Prueba que lo cubre | ¿Pasa? |
| -------- | ------------------- | ------ |
| CA-01 a CA-04 | `RF-11: vinculación…` | Sí |
| CA-05 a CA-08 | Pantalla · `e2e/smoke.cjs` | Sí (2026-11-16) |
| CA-09 | `e2e/smoke.cjs` | Sí (2026-11-16) |
| CA-10, CA-12 | `RF-11: vinculación…` | Sí |
| CA-11 | — | No aplica en el alta (ver T02) |
| CA-13 | `HU-019 / CA-13: el registro con código enlaza el referido cargado a mano` | Sí |

<!-- TRAZABILIDAD-VIGENTE -->
## Trazabilidad revisada al 26 de noviembre de 2026

| Referencia | Valor |
| --- | --- |
| Sprint planificado | 3 |
| Historias | HU-017 · HU-018 · HU-019 |
| Épicas de BKL-G1 | EPI-07 |
| Requisitos de usuario | UR-10 · UR-11 · UR-12 · UR-13 |
| Requisitos funcionales | RF-09 (RF-09-1 a RF-09-3) · RF-10 (RF-10-1 a RF-10-3) · RF-01-5 · RF-11 · RF-11-1 |
| Requisitos no funcionales | RNF-17 · RNF-18 · RNF-19 · RNF-21 |
| Casos de uso | CU-05 Invitar nuevos socios · CU-05.1 Obtener el enlace de referido · CU-05.2 Descargar el código QR de invitación (extend) · CU-05.3 Compartir el enlace por WhatsApp o redes sociales (extend, actor secundario Redes sociales) · CU-05.4 Comprobar que la cuenta vinculada esté aprobada (include) · CU-01.3 Vincular el registro a un referido (extend) |
| Diagram_ID de comportamiento | 31 Sequence; 32 Activity; 101 Sequence; 102 Activity |
| Modelo UML revisado: casos de uso y clases | [SUMA-Diagramas_Vistas.eapx](../../../../SUMA-Diagramas_Vistas.eapx) |
| Registro general | [Matriz completa de las 61 historias](../../TRAZABILIDAD.md) |

La construcción adelantada no cambia el sprint planificado. Los CA conservan sus identificadores y se interpretan junto con la ruta de esta especificación. Las pruebas y tareas conservan su evidencia; esta actualización documental no acredita verificaciones nuevas.
<!-- /TRAZABILIDAD-VIGENTE -->
