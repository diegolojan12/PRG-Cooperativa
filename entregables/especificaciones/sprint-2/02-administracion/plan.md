# Plan técnico · Administración: usuarios, configuración, bitácora y tablero

Especificación: [`especificacion.md`](especificacion.md) · Estado: Implementado

## 1. Chequeo contra la constitución

| Principio | ¿Se cumple? | Nota |
| --------- | ----------- | ---- |
| II. Nada quemado | Sí | Parámetros en `Configuracion`; roles válidos leídos de `Rol` |
| III. Seguridad | Sí | Todo con `admin(req, modulo)`; el enlace de activación solo guarda su huella |
| IV. Trazabilidad | Sí | Trigger `actividad_inmutable`; `objetivoId` y `datos` estructurados |
| V. Prueba por criterio | Sí | Ver §7 |
| VI. Accesibilidad | Sí | `CampoComponent` en configuración y usuarios |
| VII. Arquitectura | Sí | `ParametroGlobal` y `RegistroAuditoria` en `dominio/administracion.mjs` |

## 2. Modelo de datos

| Tabla / columnas | Migración |
| ---------------- | --------- |
| `Configuracion` (`clave` PK, `valor`) | `sprint1.sql` |
| `Actividad` (`usuarioId`, `actor`, `accion`, `detalle`, `fecha`) | `sprint1.sql` |
| `Actividad.ip`, `objetivoId`, `datos` + trigger `actividad_inmutable` (BEFORE UPDATE OR DELETE) | `sprint1-auditoria.sql` |
| `Usuario.cuentaSolicitadaEn`, `cuentaRevisadaEn`, `cuentaIndice` | `sprint1-dominio.sql` |

Claves internas de `Configuracion` que no se exponen: `verificadorCifrado`, `demoInicializado`.

## 3. API

| Método | Ruta | Módulo (con alcance global) | Respuestas |
| ------ | ---- | --------------------------- | ---------- |
| GET | `/api/usuarios` | `usuarios` | 200 |
| POST | `/api/usuarios` | `usuarios` | 201 (+ enlace de activación de 24 h) · 400 (nombre o rol inválido) · 403 |
| PATCH | `/api/usuarios/:id` | `usuarios` | 200 · 400 (rol inválido o quitarse su propio acceso de administrador) · 404 |
| GET | `/api/usuarios/cuentas-pendientes` | `usuarios` | 200 paginado |
| PATCH | `/api/usuarios/:id/cuenta` | `usuarios` | 200 · 400 (estado distinto de Aprobado/Rechazado) · 404 · 409 (número ya aprobado en otra cuenta) |
| GET / PUT | `/api/configuracion` | `configuracion` | 200 · 400 (`campos`) |
| GET | `/api/actividad?page&desde&hasta&usuarioId&accion` | `actividad` | 200 `{items, total, porPagina: 50}` · 400 |
| GET | `/api/actividad/opciones` | `actividad` | 200 (usuarios y acciones para los filtros) |
| GET | `/api/indicadores` | `panel` | 200 `{indicadores: [6]}` · 403 |
| GET | `/api/overview` | sesión | 200 (resumen propio: puntos, referidos) |

## 4. Dominio

`backend/src/dominio/administracion.mjs`:

- `ParametroGlobal#actualizar(valor)` — entero de 1 a 5 cifras, ≤ 10000.
- `RegistroAuditoria` — objeto congelado con `usuarioId`, `actor`, `accion`, `detalle`, `ip`, `objetivoId`, `datos`, `fecha`.

`PUT /configuracion` corre en una transacción con `SELECT … FOR UPDATE` y escribe una fila de bitácora por parámetro cambiado.

## 5. Frontend

| Pantalla | Ruta | Archivos |
| -------- | ---- | -------- |
| Tablero (administración) | `/panel` con `esAdminMatch(true)` | `features/resumen/tablero.page.*` |
| Resumen (otros roles del panel) | `/panel` | `features/resumen/resumen.page.*` |
| Usuarios y cuentas pendientes | `/panel/usuarios` | `features/administracion/usuarios.page.*` |
| Configuración | `/panel/configuracion` | `features/administracion/configuracion.page.*` |
| Registro de actividad | `/panel/actividad` | `features/administracion/actividad.page.*` |
| Cliente HTTP | — | `features/administracion/administracion.api.ts` |

## 6. Bitácora

`Cuenta creada` (`datos.rolNuevo`, `objetivoId`) · `Rol actualizado` / `Usuario actualizado` ·
`Revisión de cuenta vinculada` · `Parámetro actualizado` (`datos: {parametro, anterior, nuevo}`).

## 7. Estrategia de pruebas

| Criterio | Prueba (`backend/test/sprint.test.mjs`) |
| -------- | --------------------------------------- |
| CA-01 a CA-03 | `RF-08-2: solo el administrador crea cuentas de Gestor o Administrador` |
| CA-04 | `RF-04-4` · `HU-001` |
| CA-05 | `HU-015 / HU-016 / RF-06: vinculación, cola de revisión, rechazo y nuevo intento` |
| CA-06 a CA-12 | `RF-14 / RF-14-2 / RF-42: configuración y bitácora completa` |
| CA-13, CA-14 | `RF-45-1: tablero con 6 indicadores` |
| CA-15 | `RF-08-1 / RF-08-4` (`/api/indicadores` → 403 para el socio) |
| CA-16 | `npm run db:respaldo` (`backend/scripts/respaldo.mjs`, `pg_dump --format=custom`); restauración con `pg_restore` (RNF-09) |
| CA-17 | `RF-45-1: tablero con 6 indicadores` |
| Frontend | `features.spec.ts` (configuración) · `e2e/smoke.cjs` (tablero, configuración) |

## 8. Decisiones y riesgos

| Decisión | Alternativas descartadas | Motivo |
| -------- | ------------------------ | ------ |
| Inmutabilidad con trigger en PostgreSQL | Solo no exponer endpoints de edición | Protege incluso ante acceso directo a la base |
| Indicadores futuros con `disponibleDesde` | Ocultarlos | El tablero ya tiene su forma final y dice cuándo llega cada dato |
| Activación por enlace de 24 h | Contraseña temporal enviada por correo | Nadie más conoce la contraseña |

<!-- TRAZABILIDAD-VIGENTE -->
## Trazabilidad vigente al 22 de noviembre de 2026

| Referencia | Valor |
| --- | --- |
| Sprint planificado | 2 |
| Historias | HU-005 · HU-006 · HU-007 |
| Épicas de BKL-G1 | EPI-03 |
| Requisitos de usuario | UR-04 · UR-46 · UR-48 · UR-49 |
| Requisitos funcionales | RF-08-2 · RF-14 · RF-14-1 · RF-14-2 · RF-14-3 · RF-14-4 · RF-42 · RF-42-1 · RF-42-2 · RF-45-1 |
| Requisitos no funcionales | RNF-08 · RNF-09 · RNF-13 · RNF-15 |
| Casos de uso | CU-17 Gestionar usuarios de la plataforma · CU-19 Configurar los parámetros (CU-19.1 puntos por acción, CU-19.2 versión de los términos) · CU-20 Consultar la bitácora (CU-20.1 filtrar) · CU-15 Consultar indicadores |
| Diagram_ID de comportamiento | 71 Sequence; 72 Activity; CU-15 (tablero) y CU-20 (bitácora) tienen vistas Use Case 18 y 29, sin pareja de comportamiento propia |
| Modelo UML vigente | [SUMA-Diagramas_Vistas_Textos_Centrados.eapx](../../../SUMA-Diagramas_Vistas_Textos_Centrados.eapx) |
| Registro general | [Matriz completa de las 61 historias](../../TRAZABILIDAD.md) |

La construcción adelantada no cambia el sprint planificado. Los CA conservan sus identificadores y se interpretan junto con la ruta de esta especificación. Las pruebas y tareas conservan su evidencia; esta actualización documental no acredita verificaciones nuevas.
<!-- /TRAZABILIDAD-VIGENTE -->
