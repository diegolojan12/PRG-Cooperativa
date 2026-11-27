# PRG-Cooperativa · SUMA

Plataforma de referidos y fidelización de la Cooperativa de Ahorro y Crédito Padre Julián Lorente.
Stack: Angular (frontend) · Node.js + Express/NestJS (backend) · PostgreSQL. Sin Docker.

- **Revisión de la primera auditoría (2026-11-26):** [Validación automática de asociados y referidos](specs/validacion-automatica.md). Requisitos actualizados; implementación pendiente.
- **Especificaciones (SDD), fuente de verdad del producto:** [specs/README.md](specs/README.md)
- **Cómo ejecutarla y montar el laboratorio de 3 PC:** [docs/LABORATORIO.md](docs/LABORATORIO.md)
- **HU-001, HU-002 y HU-003 (roles, menú por rol, sesión) y análisis del diagrama de clases:** [docs/SPRINT1-HU-001-002-003.md](docs/SPRINT1-HU-001-002-003.md)
- **Trazabilidad del Sprint 1:** [docs/CORRECCIONES-AUDITORIA-SPRINT1.md](docs/CORRECCIONES-AUDITORIA-SPRINT1.md)
- **Trazabilidad del Sprint 2 (registro, vinculación e invitaciones):** [docs/TRAZABILIDAD-SPRINT2.md](docs/TRAZABILIDAD-SPRINT2.md) · [specs/sprint-2](specs/sprint-2/README.md)

Pruebas de API: `npm run test:sprint` en `backend` (necesita PostgreSQL; cada prueba usa un esquema aislado).

Diagramas revisados según el ejemplo de clase (auditoría 1): 16 generales con los módulos exactos de la matriz, RF-01 a RF-50 y 50 hijos con sus 179 subrequisitos. Archivos: [modelo editable](entregables/SUMA-Diagramas_Vistas.eapx), [PDF con casos y clases](entregables/SUMA-Casos-de-uso-y-clases-Auditoria1.pdf) e [índice de diagramas SVG](entregables/diagramas/Revision-auditoria-1/index.html). Las secuencias y actividades manuales anteriores están marcadas como históricas.

Clases unificadas a partir de las 37 originales y del código del backend: [CRC en Word](entregables/SUMA-CRC-Clases.docx) y [diagrama único ampliable](entregables/SUMA-Clases-Unificado.pdf). El CRC distingue 19 clases implementadas, 23 originales pendientes y 14 propuestas (una es interfaz).
