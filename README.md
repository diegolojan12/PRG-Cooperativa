# PRG-Cooperativa · SUMA

Plataforma de referidos y fidelización de la Cooperativa de Ahorro y Crédito Padre Julián Lorente.
Stack: Angular (frontend) · Node.js + Express/NestJS (backend) · PostgreSQL. Sin Docker.

- **Especificaciones (SDD), fuente de verdad del producto:** [specs/README.md](specs/README.md)
- **Cómo ejecutarla y montar el laboratorio de 3 PC:** [docs/LABORATORIO.md](docs/LABORATORIO.md)
- **HU-001, HU-002 y HU-003 (roles, menú por rol, sesión) y análisis del diagrama de clases:** [docs/SPRINT1-HU-001-002-003.md](docs/SPRINT1-HU-001-002-003.md)
- **Trazabilidad del Sprint 1:** [docs/CORRECCIONES-AUDITORIA-SPRINT1.md](docs/CORRECCIONES-AUDITORIA-SPRINT1.md)
- **Trazabilidad del Sprint 2 (registro, vinculación e invitaciones):** [docs/TRAZABILIDAD-SPRINT2.md](docs/TRAZABILIDAD-SPRINT2.md) · [specs/sprint-2](specs/sprint-2/README.md)

Pruebas de API: `npm run test:sprint` en `backend` (necesita PostgreSQL; cada prueba usa un esquema aislado).
