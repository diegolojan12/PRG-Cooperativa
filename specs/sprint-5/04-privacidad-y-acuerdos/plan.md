# Plan · Privacidad y acuerdos

Spec: [especificacion.md](especificacion.md). Estado: pendiente de validación con la cooperativa.

Reutilizar la implementación existente: privacidad en Mi perfil y PerfilPublico, PATCH /api/auth/perfil/privacidad, GET /api/perfiles/:id, y publicación versionada GET/POST /api/configuracion/aviso en Configuración. Conservar las migraciones ya aplicadas y las aceptaciones anteriores.

La interfaz administrativa ya permite editar términos y aviso. No publicar documentos nuevos hasta acordar el contenido. Registro mantiene la aceptación del texto vigente de prueba en desarrollo.

Pruebas existentes: backend/test/sprint.test.mjs, bloques HU-055 / HU-056 / RF-03 / RF-46 y RF-47-4. Repetir la validación funcional después de acordar los criterios y el contenido; las pruebas existentes no equivalen a aceptación oficial.

## Correspondencia de la prueba histórica

El nombre literal `HU-055 / HU-056 / RF-03 / RF-46: configuración del perfil` se conserva porque así existe en `backend/test/sprint.test.mjs`. Su parte RF-03 se traza a HU-023 (Sprint 3, EPI-06; HU-055 duplicada) y su parte RF-46 a HU-056 (Sprint 5, EPI-20). El nombre de la prueba no reasigna las historias al Sprint 2.

<!-- TRAZABILIDAD-VIGENTE -->
## Trazabilidad vigente al 22 de noviembre de 2026

| Referencia | Valor |
| --- | --- |
| Sprint planificado | 5 |
| Historias | HU-056 · HU-057 |
| Épicas de BKL-G1 | EPI-20 |
| Requisitos de usuario | UR-51, UR-52 |
| Requisitos funcionales | RF-46, RF-47-4 |
| Requisitos no funcionales | Véase criterios y requisitos aplicables |
| Casos de uso | CU-03.2 · CU-19.2 |
| Diagram_ID de comportamiento | 41 Sequence; 42 Activity; 71 Sequence; 72 Activity |
| Modelo UML vigente | [SUMA-Diagramas_Vistas.eapx](../../../entregables/SUMA-Diagramas_Vistas.eapx) |
| Registro general | [Matriz completa de las 61 historias](../../TRAZABILIDAD.md) |

La construcción adelantada no cambia el sprint planificado. Los CA conservan sus identificadores y se interpretan junto con la ruta de esta especificación. Las pruebas y tareas conservan su evidencia; esta actualización documental no acredita verificaciones nuevas.
<!-- /TRAZABILIDAD-VIGENTE -->
