# Correcciones de la Auditoría Frontend · Sprint 1

Referencia: _Auditoría Frontend Sprint 1 · Plataforma de Referidos CPJL_ (10/11/2026) y documentos
corregidos (Resumen de Requisitos, Trazabilidad HU/RF/RNF).

## Estado por brecha

| ID  | Brecha                                    | Estado        | Dónde                                                                                      |
| --- | ----------------------------------------- | ------------- | ------------------------------------------------------------------------------------------ |
| G01 | Estados Pendiente/Aprobado/Rechazado      | Corregido     | `core/models/domain.ts`, `database.mjs` (migra CONTACTADO→PENDIENTE, VALIDADO→APROBADO)    |
| G02 | Rol Gestor de contenidos                  | Corregido     | `ROLES`, `GESTOR_MODULES`, `ROLE_LIMITS/ROLE_REQUIRED`; Roles lee reglas de `/roles`       |
| G03 | Cierre por 15 min de inactividad          | Corregido     | Expiración deslizante en `current()` + `InactividadService` (compartido entre pestañas)    |
| G04 | Bloqueo tras 5 fallos por cuenta          | Corregido     | `intentosFallidos`/`bloqueadoHasta`; respuesta 423 y alerta persistente en Login           |
| G05 | 2FA por correo para administradores       | Corregido     | `POST /auth/login` → desafío; `POST /auth/2fa` (6 dígitos, 5 min, 1 uso)                   |
| G06 | Baja lógica de referidos                  | Corregido     | `PATCH /referidos/:id/baja` con motivo; unicidad de correo solo entre activos              |
| G07 | Bitácora con IP, inmutable, filtros, 50   | Corregido     | Columnas `ip/objetivoId/datos`, triggers, `GET /actividad?desde&hasta&usuarioId&accion`    |
| G08 | Listado global 20/pág., filtros, atraso   | Corregido     | Paginación en servidor, filtros estado/fecha/búsqueda, días hábiles (feriados fijos EC)    |
| G09 | Cifrado AES-256 de datos personales       | **Pendiente** | Requiere índice ciego para el login por correo; decidir con backend                        |
| G10 | Tablero admin con 6 indicadores           | Corregido     | `GET /indicadores`; `TableroPage` separado de `ResumenPage`                                |
| G11 | Dictamen con cuenta vinculada Aprobada    | Corregido     | `PATCH /referidos/:id/dictamen` responde 409 hasta que exista RF-05 (Sprint 2)             |
| G12 | Asociación manual (30 días)               | Corregido     | `GET /referidos/asociables`, `POST /referidos/asociar`                                     |
| G13 | Bitácora de configuración anterior/nuevo  | Corregido     | Una fila por parámetro modificado                                                          |
| G14 | Bitácora de roles estructurada            | Corregido     | `objetivoId` + `datos.rolAnterior/rolNuevo`                                                |
| G15 | Admin crea cuentas Gestor/Admin           | Corregido     | `POST /usuarios` + enlace de activación de 24 h                                            |
| G16 | Ayuda y error en el 100 % de los campos   | Corregido     | `CampoComponent` (ayuda obligatoria); los botones ya no se deshabilitan por validación     |
| G17 | Avisos de éxito y error distinguibles     | Corregido     | `AvisoService` + `AvisoComponent` (role alert/status, color e icono)                       |
| G18 | Correos con 3 reintentos cada 5 min       | Corregido     | Cola en memoria (no persiste enlaces/códigos en texto plano)                               |
| G19 | Panel monolítico, sin guards ni lazy      | Corregido     | `core/ shared/ layout/ features/`, `authGuard`, `moduloGuard`, `rolMatch`, `loadComponent` |
| G20 | Menú desplegable bajo 768 px              | Corregido     | `panel.css` `@media (max-width: 767.98px)`                                                 |
| G21 | Registro sin cédula; cuenta de 10 dígitos | Corregido     | `registro.page.*`, `/auth/register`                                                        |
| G22 | ESLint (32 errores) y pre-commit          | Corregido     | 0 errores; ESLint en `lint-staged`                                                         |
| G23 | Dependencias sin uso y PWA                | Corregido     | Quitados PrimeNG, primeicons, chart.js, ng2-charts, socket.io-client; SW + manifest        |
| G24 | Respaldo diario y retención 5 años        | **Pendiente** | Operación/infraestructura (pg_dump programado)                                             |

## Migración de base de datos

- **SQLite (desarrollo):** automática al iniciar (`Database.init()`), incluida la reconstrucción de
  `Referido` para quitar el `UNIQUE` en línea.
- **PostgreSQL:** `npm run db:init` aplica `backend/prisma/sprint1-auditoria.sql` una sola vez.

## Verificación

- `backend`: `npm run test:sprint` — 17 pruebas por criterio de aceptación.
- `frontend`: `npx ng test --watch=false` — 16 pruebas (guards, inactividad, avisos, menú por rol,
  campos, listado, baja, configuración); `npx ng lint` sin errores; `npx ng build` con carga diferida.
- `e2e`: `node smoke.cjs` — flujo completo en Chromium (2FA, tablero, CRUD + dictamen + baja,
  configuración, móvil 390 px, recuperación y registro).

## Decisiones que siguen abiertas con el Product Owner (sección 3.2 de la auditoría)

- El socio conserva la baja lógica de sus referidos **Pendientes**; si el PO decide que solo
  administración da de baja, basta con cambiar `current` por `admin` en `PATCH /referidos/:id/baja`.
- Límite de texto de configuración alineado a **500** caracteres (RF-14-1).
- Filtros de campaña y provincia visibles pero deshabilitados con su sprint de disponibilidad.
- "SUMA" se mantiene como nombre del producto hasta confirmación del PO.
