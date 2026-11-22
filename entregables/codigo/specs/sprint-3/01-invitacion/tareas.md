# Tareas · Enlace, QR, compartir y alta por enlace

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
