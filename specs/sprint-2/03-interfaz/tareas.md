# Tareas · Interfaz clara, avisos y ayuda en formularios

Plan: [`plan.md`](plan.md) · Estado: Completado (falta la revisión formal de accesibilidad)

- [x] T01 — `AvisoService` y `AvisoComponent` únicos para toda la aplicación (CA-03, CA-04 · G17)
- [x] T02 — `CampoComponent` con ayuda obligatoria y error con causa y corrección (CA-05, CA-06 · G16)
- [x] T03 — Menú completo desde 768 px y desplegable en pantallas menores (CA-01, CA-02 · G20)
- [x] T04 — Barra inferior + «Más» en la experiencia Comunidad (CA-02)
- [x] T05 — Pruebas en `features.spec.ts`, `auth.spec.ts` y `e2e/smoke.cjs`
- [ ] T06 — Revisión con axe o WAVE y navegación con teclado (RNF-15)
- [ ] T07 — Prueba en Chrome, Edge, Firefox y Safari y de 360 a 1 920 px (RNF-17, RNF-18)

## Verificación (2026-11-16)

| Criterio | Prueba | ¿Pasa? |
| -------- | ------ | ------ |
| CA-01, CA-07 | `features.spec.ts` | Sí |
| CA-02 | `e2e/smoke.cjs` (390 px) | Sí |
| CA-03, CA-04 | `auth.spec.ts` | Sí |
| CA-05, CA-06 | `features.spec.ts` | Sí |
