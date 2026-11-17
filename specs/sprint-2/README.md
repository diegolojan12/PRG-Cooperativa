# Sprint 2 · Recuperación, administración, interfaz, referidos, registro y cuenta de la Cooperativa

| Campo | Valor |
| ----- | ----- |
| Estado | Implementado y verificado · correcciones de trazabilidad aplicadas el 2026-11-16 |
| Semanas | 11–12 |
| Historias | **HU-004 a HU-016** (columna *Sprint* de la hoja `BKL-G1`) y **HU-055 a HU-057** (configuración del perfil, movidas al Sprint 2 el 2026-11-17) |
| Objetivo | Que el usuario recupere su acceso, que la administración opere la plataforma sola, que toda pantalla se entienda sin ayuda, y que cualquier persona cree y active su cuenta, vincule su cuenta de la Cooperativa y que los referidos se gestionen con trazabilidad |
| Fuentes | `Backlog_del_producto.xlsx` · `DocumentacionResumenRequisitos.xlsx` (UR, RF, RNF, hoja *Trazabilidad*) · `Anexo_02_-_Documento_Vision_Proyecto_PRG` v1.2.0 · `Anexo_01_-_Acta_de_Constitucion_Proyecto` · `SUMA-Diagramas_Vistas.eapx` (CU-01 a CU-38) |
| Reorganización | El 2026-11-16 se alineó con el backlog. Entraron HU-004 a HU-012 (antes documentadas en `sprint-1/`). HU-017 a HU-022, que se construyeron en este sprint, son del Sprint 3 y sus specs están en [`sprint-3/`](../sprint-3/README.md) |

## Funcionalidades

| # | Funcionalidad | HU | Casos de uso | Spec | Plan | Tareas | Estado |
| - | ------------- | -- | ------------ | ---- | ---- | ------ | ------ |
| 01 | Recuperación de acceso | HU-004 | CU-02.3, CU-02.5 | [spec](01-recuperacion-de-acceso/especificacion.md) | [plan](01-recuperacion-de-acceso/plan.md) | [tareas](01-recuperacion-de-acceso/tareas.md) | Verificada |
| 02 | Administración: usuarios, configuración, bitácora, tablero y respaldo | HU-005, HU-006, HU-007 | CU-15, CU-17, CU-19, CU-20 | [spec](02-administracion/especificacion.md) | [plan](02-administracion/plan.md) | [tareas](02-administracion/tareas.md) | Verificada · respaldo por programar |
| 03 | Interfaz clara, avisos y ayuda en formularios | HU-008, HU-009, HU-010 | Transversal (CU-02.4) | [spec](03-interfaz/especificacion.md) | [plan](03-interfaz/plan.md) | [tareas](03-interfaz/tareas.md) | Verificada · revisión WCAG pendiente |
| 04 | Gestión de referidos | HU-011, HU-012 | CU-06, CU-06.1, CU-06.2, CU-06.5, CU-06.6 | [spec](04-referidos/especificacion.md) | [plan](04-referidos/plan.md) | [tareas](04-referidos/tareas.md) | Verificada |
| 05 | Registro en 3 pasos y confirmación del correo | HU-013, HU-014 | CU-01, CU-01.1 a CU-01.4, CU-19.2 | [spec](05-registro-y-confirmacion/especificacion.md) | [plan](05-registro-y-confirmacion/plan.md) | [tareas](05-registro-y-confirmacion/tareas.md) | Verificada |
| 06 | Vinculación y verificación de la cuenta de la Cooperativa | HU-015, HU-016 | CU-04, CU-04.1, CU-04.2, CU-05.4, CU-18, CU-18.1 | [spec](06-cuenta-cooperativa/especificacion.md) | [plan](06-cuenta-cooperativa/plan.md) | [tareas](06-cuenta-cooperativa/tareas.md) | Verificada |
| 07 | Configuración del perfil | HU-055, HU-056, HU-057 | CU-03, CU-03.1 a CU-03.4, CU-19.2 | [spec](07-configuracion-perfil/especificacion.md) | [plan](07-configuracion-perfil/plan.md) | [tareas](07-configuracion-perfil/tareas.md) | Verificada |

## Matriz de trazabilidad

| HU | Épica | UR | RF / RNF | Caso de uso | Criterios | Prueba (`backend/test/sprint.test.mjs` salvo indicación) |
| -- | ----- | -- | -------- | ----------- | --------- | -------------------------------------------------------- |
| HU-004 Recuperación | EPI-02 | UR-05 | RF-07, RF-07-1, RF-07-2 · RNF-22 | CU-02.3, CU-02.5 | 01 · CA-01 a CA-06 | `RF-07` · `producción nunca expone…` · `e2e/smoke.cjs` |
| HU-005 Panel | EPI-03 | UR-49 | RF-45-1 | CU-15 | 02 · CA-13 a CA-15, CA-17 | `RF-45-1: tablero con 6 indicadores` |
| HU-006 Configuración | EPI-03 | UR-46 | RF-14, RF-14-1 a RF-14-4 | CU-19, CU-19.1 | 02 · CA-06 a CA-09 | `RF-14 / RF-14-2 / RF-42` |
| HU-007 Bitácora | EPI-03 | UR-48 | RF-42, RF-42-1, RF-42-2 · RNF-08, RNF-13 | CU-20, CU-20.1 | 02 · CA-10 a CA-12, CA-16 | `RF-14 / RF-14-2 / RF-42` · `npm run db:respaldo` |
| HU-008 Interfaz | EPI-04 | UR-04, UR-53 | RF-49-4 · RNF-18 | CU-02.4 | 03 · CA-01, CA-02, CA-07 | `features.spec.ts` · `e2e/smoke.cjs` (390 px) |
| HU-009 Avisos | EPI-04 | UR-53 | RF-49-3 · RNF-15 | — | 03 · CA-03, CA-04 | `auth.spec.ts` |
| HU-010 Ayuda | EPI-04 | UR-53 | RF-49-1, RF-49-2 · RNF-16 | — | 03 · CA-05, CA-06 | `features.spec.ts` |
| HU-011 Gestión de referidos | EPI-05 | UR-13, UR-54 | RF-11, RF-11-5, RF-11-6 · RNF-12 | CU-06.5, CU-06.6 | 04 · CA-01 a CA-05, CA-09, CA-14 a CA-18, CA-20 | `RF-11 / RNF-12` · `RF-11-6` · `RF-11-5` (x2) |
| HU-012 Administración de referidos | EPI-05 | UR-16, UR-17 | RF-11-3, RF-11-4 | CU-06, CU-06.1, CU-06.2 | 04 · CA-06 a CA-08, CA-10 a CA-13, CA-19 | `RF-11 / RNF-12` · `días hábiles` · `RF-11-4` · `T-01` |
| HU-013 Registro | EPI-06 | UR-01, UR-14, UR-22, UR-52 | RF-01-1 a RF-01-6, RF-47-1, RF-47-2, RF-47-4, RF-08-2 · RNF-04, RNF-05, RNF-10, RNF-16 | CU-01, CU-01.1, CU-01.4, CU-19.2 | 05 · CA-01 a CA-08, CA-15 a CA-21 | `HU-013 / HU-014` · `T-01` · `RF-47-4` · `HU-014 / CA-15` |
| HU-014 Confirmar correo | EPI-06 | UR-02 | RF-02-1 a RF-02-3 · RNF-14 | CU-01.2 | 05 · CA-09 a CA-13 | `HU-013 / HU-014` |
| HU-015 Vincular cuenta | EPI-06 | UR-07, UR-09, UR-14 | RF-05-1, RF-05-2, RF-05-5, RF-05-6, RF-06 · RNF-05, RNF-23 | CU-04, CU-04.1, CU-04.2, CU-05.4 | 06 | `HU-015 / HU-016 / RF-06` · `RF-11: vinculación…` |
| HU-016 Verificar cuentas | EPI-08 | UR-08, UR-44 | RF-05-3, RF-05-4, RF-39, RF-42 · RNF-24 | CU-18, CU-18.1, CU-36 | 06 | `HU-015 / HU-016 / RF-06` |
| HU-055 Administrar mi perfil | EPI-20 | UR-06 | RF-03, RF-03-1 a RF-03-3 · RNF-04, RNF-05 | CU-03, CU-03.1, CU-03.3, CU-03.4 | 07 · CA-01 a CA-08 | `HU-055 / HU-056 / RF-03 / RF-46` |
| HU-056 Elegir qué datos son públicos | EPI-20 | UR-51 | RF-46, RF-46-1 a RF-46-3 | CU-03.2 | 07 · CA-09 a CA-12 | `HU-055 / HU-056 / RF-03 / RF-46` |
| HU-057 Acuerdos de privacidad | EPI-20 | UR-52 | RF-47-4 | CU-19.2 | 07 · CA-13 | `RF-47-4` |

## Correcciones de trazabilidad (2026-11-16)

| Qué | Dónde |
| --- | ----- |
| Specs reorganizadas por el sprint real de cada HU; spec de sesión separada en sesión (Sprint 1) y recuperación (Sprint 2); spec nueva de interfaz | `specs/` |
| Tabla *Sprint Backlog* alineada con la columna *Sprint* (la columna no se tocó); HU-005, HU-006, HU-011, HU-012, HU-013, HU-021 y HU-022 corregidas; HU-058 a HU-061 nuevas (antes numeradas HU-055 a HU-058; Jira ya usaba esos números) | `Backlog_del_producto.xlsx` |
| UR-54, provincia en RF-01 y RF-01-1, RF-08-1, RF-12-2, RF-45-1, RF-47-4; hojas *Trazabilidad* y *MODULOS* | `DocumentacionResumenRequisitos.xlsx` |
| CU-16 a CU-38 y 15 sub-casos, 16 relaciones corregidas, valores etiquetados UR, HU, RF y Sprint | `SUMA-Diagramas_Vistas.eapx` · [`docs/CASOS-USO-FALTANTES-SPRINT1-2.md`](../../docs/CASOS-USO-FALTANTES-SPRINT1-2.md) |
| Provincia obligatoria, publicación de versiones del aviso, roles por experiencia, usuario activo, respaldo diario, lint, `schema.prisma`, prueba de navegador sobre PostgreSQL | Código (ver specs 02, 04 y 05) |

## Decisiones abiertas con el Product Owner

| # | Decisión | Spec | Estado |
| - | -------- | ---- | ------ |
| 1 | Textos oficiales de términos y aviso de privacidad (versión 1.0) | 05 · P-01 | Abierta; ya se pueden publicar desde Configuración |
| 2 | Proveedor SMTP de producción | 05 · P-02 · 01 · P-01 | Abierta |
| 3 | Cómo se comprueba la titularidad de la cuenta | 06 · P-01 | Abierta |
| 4 | Provincia obligatoria en el registro | 05 · P-03 | Aplicada, falta confirmación |
| 5 | El socio puede dar de baja sus referidos *Pendientes* (UR-54) | 04 · P-01 | Aplicada, falta confirmación |
| 6 | ¿Se mantiene «SUMA» como nombre del producto? | 02 · P-02 | Abierta |

## Pendientes para cerrar el sprint al 100 %

1. Pruebas con usuarios y dispositivos: registro en 3 minutos (RNF-10), recuperación en 5 minutos (RNF-22), accesibilidad
   (RNF-15) y navegadores (RNF-17), según [`docs/PROTOCOLO-PRUEBAS-USUARIOS.md`](../../docs/PROTOCOLO-PRUEBAS-USUARIOS.md).
2. SMTP real y medición de la entrega en menos de 60 s (RNF-14).
3. Programar `npm run db:respaldo` en el servidor (02 · T19).

## Verificación del sprint (2026-11-16)

| Comando | Resultado |
| ------- | --------- |
| `cd backend && npm run test:sprint` | 32/32 pasan (PostgreSQL 16, esquema aislado) |
| `cd backend && npm run lint` | 0 errores |
| `cd backend && npm run build` | Compila |
| `cd frontend && npx ng test --watch=false` | 17/17 pasan |
| `cd frontend && npx ng lint && npx ng build` | Sin errores; compila con carga diferida |
| `cd e2e && node smoke.cjs` | Pasa: 7 bloques en Chromium, sin errores de JavaScript |

## Documento previo

[`docs/TRAZABILIDAD-SPRINT2.md`](../../docs/TRAZABILIDAD-SPRINT2.md) — trazabilidad escrita por el equipo en la rama `sprint-2`, actualizada a `main`.
