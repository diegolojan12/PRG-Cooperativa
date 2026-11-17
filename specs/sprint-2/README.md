# Sprint 2 · Registro, vinculación e invitaciones

| Campo | Valor |
| ----- | ----- |
| Estado | Implementado y verificado · correcciones de trazabilidad aplicadas el 2026-11-16 (ver [Correcciones](#correcciones-de-trazabilidad-2026-11-16)) |
| Semanas | 11–12 (hoja `BKL-G1` del Backlog del producto) |
| Alcance según el backlog | Columna *Sprint* de `BKL-G1` (fuente correcta, confirmada el 2026-11-16): **Sprint 1 = HU-001 a HU-003 · Sprint 2 = HU-004 a HU-016 · Sprint 3 = HU-017 a HU-029**. Esta carpeta se armó con la tabla *Sprint Backlog* anterior (Sprint 2 = HU-013 a HU-022): HU-004 a HU-012 están en [`sprint-1/`](../sprint-1/README.md) y HU-017 a HU-022 quedan programadas por adelantado respecto del Sprint 3. |
| Objetivo | Que cualquier persona cree y active su cuenta sola, vincule su cuenta de la Cooperativa, y que el socio verificado invite con su enlace o QR y reciba puntos cuando su referido se aprueba |
| Fuentes | `Backlog_del_producto.xlsx` · `DocumentacionResumenRequisitos.xlsx` (UR, RF, RNF, hoja *Trazabilidad*) · `Anexo_02_-_Documento_Vision_Proyecto_PRG` v1.2.0 · `Anexo_01_-_Acta_de_Constitucion_Proyecto` · `SUMA-Diagramas_Vistas.eapx` (CU-01 a CU-38 y diagrama de clases) |
| Modo SDD | Especificado a partir del backlog y la ERS; implementación tomada de la rama `origin/sprint-2` (commit `48f1760`) e integrada en `main` con los ajustes listados abajo |

## Funcionalidades

| # | Funcionalidad | HU | Casos de uso | Spec | Plan | Tareas | Estado |
| - | ------------- | -- | ------------ | ---- | ---- | ------ | ------ |
| 01 | Registro en 3 pasos y confirmación del correo | HU-013, HU-014 | CU-01, CU-01.1, CU-01.2, CU-01.4, CU-19.2 | [spec](01-registro-y-confirmacion/especificacion.md) | [plan](01-registro-y-confirmacion/plan.md) | [tareas](01-registro-y-confirmacion/tareas.md) | Verificada |
| 02 | Vinculación y verificación de la cuenta de la Cooperativa | HU-015, HU-016 | CU-04, CU-04.1, CU-04.2, CU-05.4, CU-18, CU-18.1 | [spec](02-cuenta-cooperativa/especificacion.md) | [plan](02-cuenta-cooperativa/plan.md) | [tareas](02-cuenta-cooperativa/tareas.md) | Verificada |
| 03 | Enlace, QR, compartir y alta por enlace | HU-017, HU-018, HU-019 | CU-05, CU-05.1, CU-05.2, CU-05.3, CU-01.3 | [spec](03-invitacion/especificacion.md) | [plan](03-invitacion/plan.md) | [tareas](03-invitacion/tareas.md) | Verificada · pruebas en dispositivo pendientes |
| 04 | Estado de referidos, dictamen y puntos automáticos | HU-020, HU-021, HU-022 | CU-06, CU-06.2, CU-06.4, CU-36 | [spec](04-seguimiento-y-puntos/especificacion.md) | [plan](04-seguimiento-y-puntos/plan.md) | [tareas](04-seguimiento-y-puntos/tareas.md) | Verificada |

## Matriz de trazabilidad

| HU | Épica | UR | RF / RNF | Clases (EAPX) | Prueba (`backend/test/sprint.test.mjs`) |
| -- | ----- | -- | -------- | ------------- | --------------------------------------- |
| HU-013 Registro en 3 pasos | EPI-06 | UR-01, UR-13, UR-14, UR-22, UR-52 | RF-01-1 a 01-6 (con provincia), RF-47-1, 47-2, 47-4, RF-08-2 · RNF-04, 05, 10, 16 | `Usuario`, `AvisoPrivacidad`, `AceptacionTerminos` | `HU-013 / HU-014…` · `T-01…` · `RF-47-4…` · `HU-014 / CA-15…` |
| HU-014 Confirmar correo | EPI-06 | UR-02 | RF-02-1 a 02-3 · RNF-14 | `ConfirmacionCorreo`, `CodigoVerificacion` | `HU-013 / HU-014…` |
| HU-015 Vincular cuenta | EPI-06 | UR-07, UR-09, UR-14 | RF-05-1, 05-2, 05-5, 05-6, RF-06 · RNF-05, 23 | `CuentaCooperativa` | `HU-015 / HU-016 / RF-06…` · `RF-11: vinculación…` |
| HU-016 Verificar cuentas | EPI-08 | UR-08, UR-44 | RF-05-3, 05-4, RF-39, RF-42 · RNF-24 | `CuentaCooperativa`, `Notificacion` | `HU-015 / HU-016 / RF-06…` |
| HU-017 Enlace y QR | EPI-07 | UR-10, UR-11 | RF-09-1 a 09-3, RF-06-2 · RNF-19 | `CodigoReferido` | `RF-11: vinculación…` |
| HU-018 Compartir | EPI-07 | UR-12 | RF-10-1 a 10-3 · RNF-17, 21 | — (frontend) | Pantalla · `e2e/smoke.cjs` |
| HU-019 Alta por enlace | EPI-07 | UR-13 | RF-01-5, RF-11, RF-11-1 | `CodigoReferido`, `Referido` | `RF-11: vinculación…` · `e2e/smoke.cjs` |
| HU-020 Estado de referidos | EPI-07 | UR-15, UR-44 | RF-11-2, RF-39-1, 39-2 | `Referido.consultaSocio`, `Notificacion` | `RF-11 / RNF-12…` · `RF-39…` |
| HU-021 Dictamen | EPI-08 | UR-16, UR-19 | RF-11-4, RF-12-2, RF-42 | `Referido`, `AcreditacionPuntos` | `RF-11-4…` · `RF-11: vinculación…` · `RF-42: el dictamen…` |
| HU-022 Puntos automáticos | EPI-10 | UR-24 | RF-12-1, RF-14-3, 14-4, RF-38-1 · RNF-20 | `MovimientoPuntos`, `AcreditacionPuntos` | `HU-022…` · `RF-11: vinculación…` |

## Ajustes al integrar la rama `sprint-2` en `main`

La rama partía de un `main` anterior a los roles dinámicos (commit `24e6019`). Al traerla:

1. **Roles sin nombres en el código (constitución II).** Se reemplazaron `rol === 'ADMIN'` y `rol === 'SOCIO'` por
   `esAdmin` (alcance global) y `esParticipante()` / `ROLES_PARTICIPANTES` (experiencia *Comunidad*).
2. **Solo PostgreSQL (constitución VII).** Se eliminaron el esquema y las ramas de SQLite; `sprint2` se agregó a la lista
   única de migraciones de `Database.init()`.
3. **Experiencia del socio.** *Mi cuenta* pasó al shell *Comunidad* (`/panel/mi-cuenta`), y el inicio del socio
   (`FeedPage`) tiene el bloque «Invita y gana». El resumen del Gestor quedó igual que en `main`.
4. **Sondeo de notificaciones** en `NotificacionesStore.sondear()`, usado por los dos shells.
5. **Edición de referidos:** se mantuvo la regla de `main` (el socio edita sus Pendientes, HU-011), en lugar de
   «solo administración» que traía la rama.
6. **Prueba nueva:** `HU-015 / HU-016 / RF-06` (cola de revisión, rechazo, nuevo intento, bloqueo de referir, rol sin Comunidad).
7. **Migración** probada sobre una base con datos del Sprint 1 (créditos y cuentas conservados; doble `init()` sin error).

## Adelantos de otros sprints que ya están en el código

| Qué | HU de destino | Nota |
| --- | ------------- | ---- |
| Exportar Pendientes a CSV (`GET /referidos/exportar`) | HU-024 · Sprint 3 | Columnas de RF-11-7; falta su spec |
| Puntos por acción y valor del punto en Configuración | HU-029 · Sprint 3 | Cubre RF-14-3 y RF-14-4; falta su spec |

## Correcciones de trazabilidad (2026-11-16)

Revisión completa de UR → CU → HU → código hasta el Sprint 2. Detalle de cada caso de uso en
[`docs/CASOS-USO-FALTANTES-SPRINT1-2.md`](../../docs/CASOS-USO-FALTANTES-SPRINT1-2.md).

| Qué | Dónde |
| --- | ----- |
| Tabla *Sprint Backlog* alineada con la columna *Sprint* de cada HU (Sprint 1 = HU-001 a HU-003; la columna no se tocó); HU-005, HU-006, HU-011, HU-012, HU-013, HU-021 y HU-022 corregidas; HU-055 a HU-058 nuevas para UR-42, UR-43, UR-47 y UR-50 | `Backlog_del_producto.xlsx` |
| UR-54 (registro manual de referidos), provincia en RF-01 y RF-01-1, RF-08-1 (roles base y adicionales), RF-12-2 (puntos sin campañas), RF-45-1 (usuario activo), hojas *Trazabilidad* y *MODULOS* | `DocumentacionResumenRequisitos.xlsx` |
| CU-16 a CU-38 y 15 sub-casos nuevos, 16 relaciones corregidas a `include` / `extend`, generalización Prospecto → Socio, valores etiquetados UR, HU, RF y Sprint en los 88 casos | `SUMA-Diagramas_Vistas.eapx` |
| Versión 1.2.0, provincia en los supuestos y ubicación de los diagramas | Documento de Visión |
| Provincia obligatoria en el registro (`Usuario.provincia`, `GET /api/auth/provincias`), heredada por el referido | `api.mjs`, `registro.page`, `sprint2-correcciones.sql` |
| Publicación de versiones del aviso de privacidad desde Configuración (RF-47-4) | `POST /api/configuracion/aviso`, `aviso-privacidad.component.ts` |
| Roles sin nombres escritos en la asociación manual y los indicadores; regla única del nombre; usuarios activos sin contar inicios de sesión | `api.mjs` |
| Lint del backend sin errores; `schema.prisma` regenerado desde la base; carpeta `modules/` sin uso eliminada | `backend/`, raíz |
| Prueba de navegador sobre PostgreSQL (esquema propio) y con la experiencia Comunidad del socio | `e2e/smoke.cjs` |
| Respaldo diario y conservación de 5 años (RNF-08, RNF-13) | `npm run db:respaldo` |
| Protocolo de pruebas con usuarios y dispositivos | [`docs/PROTOCOLO-PRUEBAS-USUARIOS.md`](../../docs/PROTOCOLO-PRUEBAS-USUARIOS.md) |

## Decisiones abiertas con el Product Owner

| # | Decisión | Spec |
| - | -------- | ---- |
| 1 | Textos oficiales de términos y aviso de privacidad (versión 1.0) | 01 · P-01 |
| 2 | Proveedor SMTP de producción | 01 · P-02 |
| 3 | Cómo se comprueba la titularidad de la cuenta | 02 · P-01 |
| 4 | Dominio oficial del enlace y texto del mensaje de WhatsApp | 03 · P-01, P-02 |
| 5 | ~~Puntos del referido mientras no haya campañas~~ Aplicado: `puntosReferido` para ambas partes (RF-12-2), a confirmar | 04 · P-01 |
| 6 | ~~Columna *Sprint* del backlog~~ Resuelta: la columna es la correcta; se corrigió la tabla *Sprint Backlog* | Este README |
| 7 | Provincia obligatoria en el registro (aplicada), roles base más roles adicionales (RF-08-1) y UR-54 para el registro manual de referidos: confirmar | Correcciones |

## Pendientes para cerrar el sprint al 100 %

1. ~~Pruebas de API: bitácora del dictamen (04 · CA-08), registro sin SMTP (01 · CA-15), plazo de 30 días y arranque sin `SUMA_DATA_KEY`~~ Hechas.
   El código propio no se puede usar en el alta (el correo es único) y el referido precargado lo cubre `e2e/smoke.cjs`.
2. ~~Ejecutar `e2e/smoke.cjs`~~ Pasa completo (2026-11-16).
3. Pruebas con usuarios y dispositivos: 3 minutos de registro (RNF-10), 15 s para compartir (RNF-21), lectura del QR (RNF-19),
   según [`docs/PROTOCOLO-PRUEBAS-USUARIOS.md`](../../docs/PROTOCOLO-PRUEBAS-USUARIOS.md).
4. SMTP real y medición de entrega en menos de 60 s (RNF-14).

## Verificación del sprint

| Comando | Resultado (2026-11-16) |
| ------- | ---------------------- |
| `cd backend && npm run test:sprint` | 31/31 pasan (PostgreSQL 16, esquema aislado) |
| `cd backend && npm run lint` | 0 errores |
| `cd backend && npm run build` | Compila |
| `cd frontend && npx ng test --watch=false` | 17/17 pasan |
| `cd frontend && npx ng lint` | Sin errores |
| `cd frontend && npx ng build` | Compila, con carga diferida |
| `cd e2e && node smoke.cjs` | Pasa: 7 bloques en Chromium, sin errores de JavaScript |


## Documento previo

[`docs/TRAZABILIDAD-SPRINT2.md`](../../docs/TRAZABILIDAD-SPRINT2.md) — trazabilidad escrita por el equipo en la rama `sprint-2`, actualizada a `main`.
