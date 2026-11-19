# Plan · Privacidad y acuerdos

Spec: [especificacion.md](especificacion.md). Estado: pendiente de validación con la cooperativa.

Reutilizar la implementación existente: privacidad en Mi perfil y PerfilPublico, PATCH /api/auth/perfil/privacidad, GET /api/perfiles/:id, y publicación versionada GET/POST /api/configuracion/aviso en Configuración. Conservar las migraciones ya aplicadas y las aceptaciones anteriores.

La interfaz administrativa ya permite editar términos y aviso. No publicar documentos nuevos hasta acordar el contenido. Registro mantiene la aceptación del texto vigente de prueba en desarrollo.

Pruebas existentes: backend/test/sprint.test.mjs, bloques HU-055 / HU-056 / RF-03 / RF-46 y RF-47-4. Repetir la validación funcional después de acordar los criterios y el contenido; las pruebas existentes no equivalen a aceptación oficial.
