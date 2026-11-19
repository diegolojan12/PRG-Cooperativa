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
