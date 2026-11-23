# SUMA · Backend

API REST de SUMA en Node.js 24 sobre PostgreSQL.

## Estructura

| Carpeta / archivo | Qué contiene |
| --- | --- |
| `src/main.ts` | Arranque con NestJS: cabeceras de seguridad (helmet), CORS y montaje de la API en `/api`. |
| `src/app.module.ts` | Módulo raíz de Nest (observabilidad opcional con NestJS Observe). |
| `src/api.mjs` | Rutas HTTP: validan la entrada, verifican sesión y permisos y coordinan cada caso de uso. |
| `src/dominio/` | Reglas de negocio como clases propias (Rol, Usuario, Sesion, Referido…), sin dependencias de framework ni de base de datos. |
| `src/database.mjs` | Acceso a PostgreSQL con SQL parametrizado (`pg`), cifrado de datos personales y aplicación de migraciones. |
| `src/infraestructura/` | Adaptadores externos (envío de correo por SMTP). |
| `migraciones/` | Cambios de esquema por sprint (`sprintN-tema.sql`), idempotentes. Se aplican una sola vez al iniciar. |
| `scripts/` | Tareas de operación: crear la base, migrar, cuentas de prueba, administrador, respaldo, correo. |
| `test/` | Pruebas de integración contra PostgreSQL (cada prueba usa un esquema aislado). |

## Comandos

```bash
npm ci
npm run db:crear      # crea usuario y base (necesita PGADMIN_URL)
npm run db:init       # aplica migraciones y datos de partida
npm run build
npm run start:local   # API en http://localhost:3000
npm test              # pruebas de la API y de correo
npm run lint
```

Para agregar una tabla o columna: crea `migraciones/sprintN-tema.sql` y añade su nombre a la lista
`MIGRACIONES` de `src/database.mjs`. No edites migraciones ya publicadas.

Guía completa (una PC y laboratorio de 3 PC): [docs/LABORATORIO.md](../docs/LABORATORIO.md).
