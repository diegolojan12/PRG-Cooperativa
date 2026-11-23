# Plan · Correo transaccional

Especificación: [especificacion.md](especificacion.md).

- Extraer transporte y reintentos a `backend/src/infraestructura/correo.mjs`, conservando Nodemailer (sin dependencias nuevas).
- Variables del servidor: `SMTP_SERVICE` o `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_REQUIRE_TLS`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`; opcionalmente `SMTP_AUTH_TYPE=oauth2` y `SMTP_ACCESS_TOKEN`.
- Gmail para desarrollo (465/TLS); Microsoft 365 y Yahoo como perfiles de infraestructura; host explícito para otros proveedores. STARTTLS obligatorio para conexiones remotas sin TLS implícito. Solo servidores locales de laboratorio pueden usar SMTP sin TLS.
- `verificar-correo.mjs` usa `verify()` y no envía mensajes. El diagnóstico no imprime errores crudos del proveedor.
- 2FA y recuperación adjuntan vencimiento y consulta de vigencia, como ya hacía la confirmación de correo.
- No crear una redirección global. Un script explícito cambia el correo del administrador existente, con índices de cifrado, bitácora y revocación de sesiones/desafíos.
- Pruebas: configuración, TLS, OAuth2 externo, reintentos con reloj/control de agenda inyectado; integración de API con SMTP local y PostgreSQL aislado. Luego suites de sprint, Angular, lint, compilación y smoke e2e.
- No se almacena el correo particular ni secretos como configuración por defecto del repositorio.

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
| Modelo UML vigente | [SUMA-Diagramas_Vistas_Textos_Centrados.eapx](../../../entregables/SUMA-Diagramas_Vistas_Textos_Centrados.eapx) |
| Registro general | [Matriz completa de las 61 historias](../../TRAZABILIDAD.md) |

La construcción adelantada no cambia el sprint planificado. Los CA conservan sus identificadores y se interpretan junto con la ruta de esta especificación. Las pruebas y tareas conservan su evidencia; esta actualización documental no acredita verificaciones nuevas.
<!-- /TRAZABILIDAD-VIGENTE -->
