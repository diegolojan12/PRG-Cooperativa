# Matriz de trazabilidad de las especificaciones de SUMA

Revisión 22 de noviembre de 2026. Fuente de planificación: `entregables/Backlog_del_producto.xlsx`, hoja BKL-G1. Fuente de requisitos: `entregables/DocumentacionResumenRequisitos (1).xlsx`. Modelo: `entregables/SUMA-Diagramas_Vistas_Textos_Centrados.eapx`. Las rutas anteriores son relativas a la raíz del proyecto.

HU-055 se conserva como duplicada de HU-023; el perfil se planifica en Sprint 3 y EPI-06. HU-056 y HU-057 se planifican en Sprint 5 y EPI-20. Los cuatro IDs nuevos corresponden a HU-058 (favoritos/meta), HU-059 (búsqueda), HU-060 (ajuste) y HU-061 (encuestas). «Usuario General» es una categoría que agrupa usuarios; las reglas de acceso de cada función se documentan por capacidad y propiedad.

Las HU del Sprint 1 y 2 usan los RF y UR delimitados en sus especificaciones y en la revisión de trazabilidad. Para historias posteriores sin spec propia, la relación procede de la matriz UR del Excel y expresa contribución al RF padre, sin acreditar cada subrequisito ni su implementación. Los CU reproducen las etiquetas guardadas en EA; las historias transversales de interfaz no requieren un CU independiente.

## Las 61 historias del backlog

| Historia | Épica | Sprint | UR | RF asociados | CU etiquetados en EA | Especificación o planificación |
| --- | --- | --- | --- | --- | --- | --- |
| HU-001 | EPI-01 | 1 | UR-04 | RF-08, RF-08-1, RF-08-2, RF-08-5 | CU-16, CU-17 | [sprint-1/01-roles-y-permisos](sprint-1/01-roles-y-permisos/especificacion.md); [sprint-2/08-correo-transaccional](sprint-2/08-correo-transaccional/especificacion.md) |
| HU-002 | EPI-01 | 1 | UR-04 | RF-08-3, RF-08-4 | CU-16, CU-02.4 | [sprint-1/01-roles-y-permisos](sprint-1/01-roles-y-permisos/especificacion.md) |
| HU-003 | EPI-02 | 1 | UR-03 | RF-04, RF-04-1, RF-04-2, RF-04-3, RF-04-4 | CU-02, CU-02.1, CU-02.2, CU-02.6 | [sprint-1/02-sesion-y-acceso](sprint-1/02-sesion-y-acceso/especificacion.md); [sprint-2/08-correo-transaccional](sprint-2/08-correo-transaccional/especificacion.md) |
| HU-004 | EPI-02 | 2 | UR-05 | RF-07, RF-07-1, RF-07-2 | CU-02.3, CU-02.5 | [sprint-2/01-recuperacion-de-acceso](sprint-2/01-recuperacion-de-acceso/especificacion.md); [sprint-2/08-correo-transaccional](sprint-2/08-correo-transaccional/especificacion.md) |
| HU-005 | EPI-03 | 2 | UR-04, UR-49 | RF-45-1, RF-08-3, RF-08-4 | CU-15 | [sprint-2/02-administracion](sprint-2/02-administracion/especificacion.md) |
| HU-006 | EPI-03 | 2 | UR-46 | RF-14, RF-14-1, RF-14-2, RF-14-3, RF-14-4 | CU-19 | [sprint-2/02-administracion](sprint-2/02-administracion/especificacion.md) |
| HU-007 | EPI-03 | 2 | UR-48 | RF-42, RF-42-1, RF-42-2 | CU-20.1, CU-20 | [sprint-2/02-administracion](sprint-2/02-administracion/especificacion.md) |
| HU-008 | EPI-04 | 2 | UR-04, UR-53 | RF-49-4, RF-08-3, RF-08-4 | CU-02.4 | [sprint-2/03-interfaz](sprint-2/03-interfaz/especificacion.md) |
| HU-009 | EPI-04 | 2 | UR-53 | RF-49, RF-49-3 | Transversal de interfaz | [sprint-2/03-interfaz](sprint-2/03-interfaz/especificacion.md) |
| HU-010 | EPI-04 | 2 | UR-53 | RF-49-1, RF-49-2 | Transversal de interfaz | [sprint-2/03-interfaz](sprint-2/03-interfaz/especificacion.md) |
| HU-011 | EPI-05 | 2 | UR-54, UR-13 | RF-11, RF-11-5, RF-11-6 | CU-06.5, CU-06.6 | [sprint-2/04-referidos](sprint-2/04-referidos/especificacion.md) |
| HU-012 | EPI-05 | 2 | UR-16, UR-17 | RF-11-3, RF-11-4 | CU-06, CU-06.1, CU-06.6 | [sprint-2/04-referidos](sprint-2/04-referidos/especificacion.md) |
| HU-013 | EPI-06 | 2 | UR-01, UR-13, UR-14, UR-52 | RF-01, RF-01-1, RF-01-2, RF-01-3, RF-01-4, RF-01-5, RF-01-6, RF-47-1, RF-47-2, RF-08-2 | CU-01, CU-01.1, CU-01.4 | [sprint-2/05-registro-y-confirmacion](sprint-2/05-registro-y-confirmacion/especificacion.md) |
| HU-014 | EPI-06 | 2 | UR-02 | RF-02, RF-02-1, RF-02-2, RF-02-3 | CU-01.2 | [sprint-2/05-registro-y-confirmacion](sprint-2/05-registro-y-confirmacion/especificacion.md); [sprint-2/08-correo-transaccional](sprint-2/08-correo-transaccional/especificacion.md) |
| HU-015 | EPI-06 | 2 | UR-07, UR-09, UR-14 | RF-05-1, RF-05-2, RF-05-5, RF-05-6, RF-06, RF-06-1, RF-06-2, RF-06-3 | CU-04, CU-04.1, CU-04.2, CU-05.4 | [sprint-2/06-cuenta-cooperativa](sprint-2/06-cuenta-cooperativa/especificacion.md) |
| HU-016 | EPI-08 | 2 | UR-08, UR-44 | RF-05-3, RF-05-4, RF-39, RF-39-1, RF-39-2, RF-42 | CU-18 | [sprint-2/06-cuenta-cooperativa](sprint-2/06-cuenta-cooperativa/especificacion.md) |
| HU-017 | EPI-07 | 3 | UR-09, UR-10, UR-11 | RF-06, RF-09 | CU-05, CU-05.1, CU-05.2, CU-05.4, CU-18.1 | [sprint-3/01-invitacion](sprint-3/01-invitacion/especificacion.md) |
| HU-018 | EPI-07 | 3 | UR-12 | RF-10, RF-48 | CU-05, CU-05.3 | [sprint-3/01-invitacion](sprint-3/01-invitacion/especificacion.md) |
| HU-019 | EPI-07 | 3 | UR-13 | RF-01, RF-11 | CU-01, CU-01.3 | [sprint-3/01-invitacion](sprint-3/01-invitacion/especificacion.md) |
| HU-020 | EPI-07 | 3 | UR-15, UR-44 | RF-11, RF-39, RF-37, RF-38, RF-40 | CU-06, CU-36 | [sprint-3/02-seguimiento-y-puntos](sprint-3/02-seguimiento-y-puntos/especificacion.md) |
| HU-021 | EPI-08 | 3 | UR-16, UR-19 | RF-11, RF-12 | CU-06.2, CU-06.4 | [sprint-3/02-seguimiento-y-puntos](sprint-3/02-seguimiento-y-puntos/especificacion.md) |
| HU-022 | EPI-10 | 3 | UR-24, UR-44 | RF-12, RF-20, RF-22, RF-25, RF-38, RF-48, RF-37, RF-39, RF-40 | CU-36, CU-06.4 | [sprint-3/02-seguimiento-y-puntos](sprint-3/02-seguimiento-y-puntos/especificacion.md) |
| HU-023 | EPI-06 | 3 | UR-06 | RF-03 | CU-03, CU-03.1, CU-03.3, CU-03.4 | [sprint-2/08-correo-transaccional](sprint-2/08-correo-transaccional/especificacion.md); [sprint-3/03-configuracion-perfil](sprint-3/03-configuracion-perfil/especificacion.md) |
| HU-024 | EPI-08 | 3 | UR-18 | RF-11 | CU-06.3 | [Backlog](backlog.md) |
| HU-025 | EPI-09 | 3 | UR-20, UR-21, UR-22 | RF-13 | CU-07, CU-07.1, CU-07.2 | [Backlog](backlog.md) |
| HU-026 | EPI-09 | 3 | UR-23, UR-44 | RF-13, RF-37, RF-38, RF-39, RF-40 | CU-36, CU-21 | [Backlog](backlog.md) |
| HU-027 | EPI-09 | 3 | UR-21 | RF-13 | Véase relación por caso padre | [Backlog](backlog.md) |
| HU-028 | EPI-10 | 3 | UR-24 | RF-12, RF-20, RF-22, RF-25, RF-38, RF-48 | CU-08, CU-08.1 | [Backlog](backlog.md) |
| HU-029 | EPI-10 | 3 | UR-46 | RF-14 | CU-19.1 | [Backlog](backlog.md) |
| HU-030 | EPI-10 | 4 | UR-25 | RF-16, RF-48 | Véase relación por caso padre | [Backlog](backlog.md) |
| HU-031 | EPI-10 | 4 | UR-25 | RF-16, RF-48 | CU-08, CU-08.2 | [Backlog](backlog.md) |
| HU-032 | EPI-10 | 4 | UR-24 | RF-12, RF-20, RF-22, RF-25, RF-38, RF-48 | Véase relación por caso padre | [Backlog](backlog.md) |
| HU-033 | EPI-10 | 4 | UR-26 | RF-17 | CU-08 | [Backlog](backlog.md) |
| HU-034 | EPI-10 | 4 | UR-26 | RF-17 | Véase relación por caso padre | [Backlog](backlog.md) |
| HU-035 | EPI-11 | 4 | UR-27 | RF-18, RF-40 | CU-22 | [Backlog](backlog.md) |
| HU-036 | EPI-11 | 4 | UR-27 | RF-18, RF-40 | CU-23 | [Backlog](backlog.md) |
| HU-037 | EPI-11 | 4 | UR-28 | RF-19 | CU-24 | [Backlog](backlog.md) |
| HU-038 | EPI-11 | 4 | UR-29 | RF-20 | CU-09, CU-09.1, CU-09.2 | [Backlog](backlog.md) |
| HU-039 | EPI-12 | 4 | UR-30 | RF-21 | CU-25 | [Backlog](backlog.md) |
| HU-040 | EPI-12 | 4 | UR-31 | RF-22 | CU-10, CU-10.1, CU-10.2 | [Backlog](backlog.md) |
| HU-041 | EPI-12 | 4 | UR-32 | RF-23 | CU-26 | [Backlog](backlog.md) |
| HU-042 | EPI-12 | 4 | UR-33 | RF-24, RF-40 | CU-11, CU-11.1, CU-11.2 | [Backlog](backlog.md) |
| HU-043 | EPI-12 | 4 | UR-34 | RF-25 | CU-27 | [Backlog](backlog.md) |
| HU-044 | EPI-13 | 5 | UR-39 | RF-32 | CU-32 | [Backlog](backlog.md) |
| HU-045 | EPI-13 | 5 | UR-40 | RF-33 | CU-12, CU-12.1, CU-12.2, CU-12.3 | [Backlog](backlog.md) |
| HU-046 | EPI-13 | 5 | UR-41 | RF-33 | CU-33 | [Backlog](backlog.md) |
| HU-047 | EPI-14 | 5 | UR-35 | RF-26, RF-27, RF-28 | CU-13, CU-13.4 | [Backlog](backlog.md) |
| HU-048 | EPI-14 | 5 | UR-35 | RF-26, RF-27, RF-28 | CU-13.1, CU-13.2 | [Backlog](backlog.md) |
| HU-049 | EPI-14 | 5 | UR-36 | RF-26, RF-29 | CU-28 | [Backlog](backlog.md) |
| HU-050 | EPI-14 | 5 | UR-37 | RF-30 | CU-13.3, CU-29 | [Backlog](backlog.md) |
| HU-051 | EPI-15 | 5 | UR-38 | RF-31 | CU-30, CU-31 | [Backlog](backlog.md) |
| HU-052 | EPI-15 | 5 | UR-51 | RF-46 | Véase relación por caso padre | [Backlog](backlog.md) |
| HU-053 | EPI-15 | 5 | UR-45 | RF-41 | CU-14, CU-14.1, CU-14.2 | [Backlog](backlog.md) |
| HU-054 | EPI-16 | 5 | UR-49 | RF-43, RF-45 | CU-15, CU-15.1, CU-15.2 | [Backlog](backlog.md) |
| HU-055 | EPI-20 | 3 (duplicada de HU-023) | UR-06 | RF-03 | CU-03 (histórico; véase HU-023) | [sprint-3/03-configuracion-perfil](sprint-3/03-configuracion-perfil/especificacion.md) |
| HU-056 | EPI-20 | 5 | UR-51 | RF-46 | CU-03.2 | [sprint-5/04-privacidad-y-acuerdos](sprint-5/04-privacidad-y-acuerdos/especificacion.md) |
| HU-057 | EPI-20 | 5 | UR-52 | RF-47 | CU-19.2 | [sprint-5/04-privacidad-y-acuerdos](sprint-5/04-privacidad-y-acuerdos/especificacion.md) |
| HU-058 | EPI-13 | Por planificar | UR-42 | RF-34, RF-35 | CU-34 | [Backlog](backlog.md) |
| HU-059 | EPI-15 | Por planificar | UR-43 | RF-36 | CU-35 | [Backlog](backlog.md) |
| HU-060 | EPI-10 | Por planificar | UR-47 | RF-15 | CU-37 | [Backlog](backlog.md) |
| HU-061 | EPI-12 | Por planificar | UR-50 | RF-44 | CU-38 | [Backlog](backlog.md) |

## Uso del modelo UML

El modelo contiene 137 diagramas (59 Use Case, 38 Sequence, 38 Activity, contexto y clases). Los 89 elementos UseCase anteriores tienen etiquetas UR/HU/RF/Sprint; 65 subcasos nuevos se relacionan mediante ParentID y todavía no tienen etiquetas propias. Los siete óvalos de navegación no representan requisitos nuevos. Las tablas de cada funcionalidad indican sus Diagram_ID. CU-15 y CU-20 no tienen pareja propia de secuencia/actividad.

## Convenciones de evidencia

Las pruebas que conservan el nombre histórico HU-055/HU-056 son localizadores del código existente; la parte RF-03 se asigna a HU-023/S3 y la parte RF-46 a HU-056/S5. Los resultados fechados se mantienen como históricos. Los requisitos de sprints posteriores no se califican como incumplidos por estar planificados.
