# Resultado de subtareas · G2 · Sprints 1 a 3

Fecha: 2026-11-19. Alcance autorizado: HU-001 a HU-029, sin añadir historias nuevas.

Actualización posterior autorizada (2026-11-19): HU-056 (G2-76) y HU-057 (G2-77) se asignaron al
Sprint 2 (58), con prioridad Alta y conservando su estado Por hacer. El resultado de 121 subtareas
de este informe sigue referido a HU-001 a HU-029. HU-055 no se movió ni se vinculó como duplicada:
el usuario pidió analizar su consolidación en HU-023 antes de decidir su retirada.

**Resultado verificado en Jira: 121 subtareas vinculadas a sus historias y sprints; 75 Listo y 46 Por hacer.**
Se crearon 117 nuevas (G2-88 a G2-204) y se revisaron las cuatro existentes G2-84 a G2-87.
Se asignó prioridad a las 29 historias y sus 121 subtareas. No se cambiaron las descripciones ni
los estados generales de las historias. HU-055 a HU-057 no se movieron ni se duplicaron sus subtareas.

## Criterio aplicado

- Listo: trabajo implementado con evidencia de código y pruebas suficiente para el alcance de esa subtarea.
- Por hacer: falta código, decisión de alcance, especificación o una comprobación requerida. La descripción de Jira explica el motivo.
- Alta: acceso, protección de datos, validaciones principales y reglas de negocio de puntos/campañas.
- Media: interfaz, consultas, ayuda y comprobaciones de uso que no bloquean las reglas anteriores.
- Un componente genérico o una pantalla de ejemplo no demuestran una funcionalidad completa.
- No se confundió una recepción real de 2FA con pruebas de entrega de recuperación o registro.
- Algunos padres ya figuraban Listo y conservan ese estado aunque ahora tienen subtareas de validación pendientes. Esta revisión informa y actualiza las subtareas, sin reabrir automáticamente las historias.

## Verificaciones realizadas

| Comprobación | Resultado |
| --- | --- |
| Backend npm run test:sprint | 33/33 pasan con PostgreSQL aislado |
| Backend npm run test:correo | 4/4 pasan con SMTP local y PostgreSQL aislado |
| Frontend npm test -- --watch=false --ts-config tsconfig.spec.json | 17/17 pasan |
| Smoke de navegador en datos aislados | Siete flujos originales y comprobaciones adicionales de perfil/privacidad y acuerdos pasan; sin errores JavaScript |
| Vinculación, sprint, tipo, estado y prioridad de subtareas | 121/121 comprobadas; 0 diferencias con el resultado esperado |
| Descripciones y estados generales de las historias | Conservados; solo se ajustaron sus prioridades |

El primer intento de frontend con la configuración implícita falló al localizar las pruebas en la compilación.
La ejecución con tsconfig.spec.json explícito pasó sin modificar el código ni la configuración del producto.
El navegador prueba la compilación disponible, junto con pruebas de API sobre el código fuente actual.
No se realizaron nuevas mediciones con participantes, cámara nativa o bandejas reales.

## Resumen por historia

| Historia | Sprint | Prioridad | Listo | Por hacer |
| --- | --- | --- | --- | --- |
| [HU-001](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-21) | 1 | Alta | 4 | 0 |
| [HU-002](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-22) | 1 | Alta | 4 | 0 |
| [HU-003](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-23) | 1 | Alta | 5 | 0 |
| [HU-004](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-24) | 2 | Alta | 3 | 1 |
| [HU-005](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-25) | 2 | Media | 4 | 0 |
| [HU-006](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-26) | 2 | Media | 4 | 0 |
| [HU-007](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-27) | 2 | Alta | 4 | 0 |
| [HU-008](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-28) | 2 | Media | 1 | 3 |
| [HU-009](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-29) | 2 | Media | 2 | 1 |
| [HU-010](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-30) | 2 | Media | 2 | 1 |
| [HU-011](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-31) | 2 | Alta | 3 | 2 |
| [HU-012](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-32) | 2 | Alta | 2 | 2 |
| [HU-013](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-33) | 2 | Alta | 4 | 1 |
| [HU-014](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-34) | 2 | Alta | 3 | 1 |
| [HU-015](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-35) | 2 | Alta | 3 | 1 |
| [HU-016](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-36) | 2 | Alta | 4 | 1 |
| [HU-017](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-37) | 3 | Alta | 3 | 1 |
| [HU-018](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-38) | 3 | Media | 3 | 1 |
| [HU-019](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-39) | 3 | Alta | 2 | 2 |
| [HU-020](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-40) | 3 | Media | 3 | 1 |
| [HU-021](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-41) | 3 | Alta | 3 | 1 |
| [HU-022](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-42) | 3 | Alta | 2 | 2 |
| [HU-023](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-43) | 3 | Media | 2 | 3 |
| [HU-024](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-44) | 3 | Media | 2 | 2 |
| [HU-025](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-45) | 3 | Alta | 0 | 5 |
| [HU-026](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-46) | 3 | Alta | 0 | 5 |
| [HU-027](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-47) | 3 | Media | 0 | 4 |
| [HU-028](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-48) | 3 | Alta | 0 | 4 |
| [HU-029](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-49) | 3 | Alta | 3 | 1 |

## Detalle de subtareas

### HU-001 - Poder gestionar los roles y permisos del sistema

Padre: [G2-21](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-21). Evidencia: Pantallas Roles/Usuarios, API de roles y usuarios y prueba HU-001/RF-08.

| Subtarea | Estado | Prioridad | Comprobación o pendiente |
| --- | --- | --- | --- |
| [G2-84 · Preparar la gestión de roles](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-84) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-85 · Guardar la asignación y retirada de permisos](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-85) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-86 · Crear cuentas internas y su activación](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-86) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-87 · Verificar permisos y registrar cambios](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-87) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |

### HU-002 - Poder gestionar los accesos a los distintos módulos

Padre: [G2-22](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-22). Evidencia: Menú y guards del frontend, autorización del servidor, pruebas RF-08 y smoke por rol.

| Subtarea | Estado | Prioridad | Comprobación o pendiente |
| --- | --- | --- | --- |
| [G2-88 · Construir el menú según los permisos](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-88) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-89 · Proteger las rutas y consultas de cada módulo](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-89) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-90 · Actualizar el acceso cuando cambien los permisos](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-90) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-91 · Probar la navegación de cada rol](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-91) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |

### HU-003 - Poder crear mi sesión e iniciar o cerrar de forma segura

Padre: [G2-23](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-23). Evidencia: API de sesión y 2FA, control de inactividad, pruebas RF-04/RNF-06 y SMTP local; el usuario confirmó recepción real del código de acceso.

| Subtarea | Estado | Prioridad | Comprobación o pendiente |
| --- | --- | --- | --- |
| [G2-92 · Validar las credenciales de acceso](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-92) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-93 · Gestionar el inicio y cierre de sesión](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-93) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-94 · Cerrar sesiones por inactividad](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-94) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-95 · Validar el segundo factor del administrador](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-95) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-96 · Probar el flujo completo de acceso](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-96) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |

### HU-004 - Poder recuperar el acceso a mi sesión

Padre: [G2-24](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-24). Evidencia: Pantalla de recuperación, API forgot/reset y pruebas RF-07/SMTP local. Falta medir el correo real de recuperación.

| Subtarea | Estado | Prioridad | Comprobación o pendiente |
| --- | --- | --- | --- |
| [G2-97 · Preparar el formulario de recuperación](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-97) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-98 · Generar y enviar el enlace temporal](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-98) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-99 · Restablecer la contraseña con el enlace](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-99) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-100 · Probar la recuperación y la entrega del correo](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-100) | Por hacer | Alta | Falta medir la entrega del correo real de recuperación; la recepción confirmada fue del segundo factor. |

### HU-005 - Poder usar un panel de administración central

Padre: [G2-25](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-25). Evidencia: Tablero administrativo, API de indicadores, RF-45-1 y smoke de navegación.

| Subtarea | Estado | Prioridad | Comprobación o pendiente |
| --- | --- | --- | --- |
| [G2-101 · Preparar la pantalla principal de administración](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-101) | Listo | Media | Implementación revisada; ver evidencia de la historia. |
| [G2-102 · Conectar los indicadores disponibles](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-102) | Listo | Media | Implementación revisada; ver evidencia de la historia. |
| [G2-103 · Restringir el panel a administración](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-103) | Listo | Media | Implementación revisada; ver evidencia de la historia. |
| [G2-104 · Verificar el dashboard](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-104) | Listo | Media | Implementación revisada; ver evidencia de la historia. |

### HU-006 - Poder configurar las opciones generales de la plataforma

Padre: [G2-26](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-26). Evidencia: Formulario Configuración, ParametroGlobal, persistencia y bitácora; prueba RF-14/RF-42 y smoke.

| Subtarea | Estado | Prioridad | Comprobación o pendiente |
| --- | --- | --- | --- |
| [G2-105 · Preparar el formulario de configuración general](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-105) | Listo | Media | Implementación revisada; ver evidencia de la historia. |
| [G2-106 · Validar los valores configurables](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-106) | Listo | Media | Implementación revisada; ver evidencia de la historia. |
| [G2-107 · Guardar y aplicar la configuración](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-107) | Listo | Media | Implementación revisada; ver evidencia de la historia. |
| [G2-108 · Probar y auditar las modificaciones](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-108) | Listo | Media | Implementación revisada; ver evidencia de la historia. |

### HU-007 - Poder consultar el registro de actividades del sistema

Padre: [G2-27](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-27). Evidencia: API y pantalla Actividad; prueba de filtros y rechazo de UPDATE/DELETE por bitácora inmutable.

| Subtarea | Estado | Prioridad | Comprobación o pendiente |
| --- | --- | --- | --- |
| [G2-109 · Registrar las acciones operativas importantes](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-109) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-110 · Preparar la consulta de la bitácora](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-110) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-111 · Proteger el historial de actividad](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-111) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-112 · Verificar la trazabilidad de las operaciones](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-112) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |

### HU-008 - Poder usar una interfaz visual clara y fácil de entender

Padre: [G2-28](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-28). Evidencia: Shells y estilos adaptables; smoke en Chromium a 390 y 1440 px. No es matriz completa de dispositivos/navegadores.

| Subtarea | Estado | Prioridad | Comprobación o pendiente |
| --- | --- | --- | --- |
| [G2-113 · Adaptar las pantallas a móvil y escritorio](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-113) | Por hacer | Media | Falta completar y registrar la revisión entre 360 y 1920 px; el smoke cubre solo algunas resoluciones. |
| [G2-114 · Preparar menús adaptables](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-114) | Listo | Media | Implementación revisada; ver evidencia de la historia. |
| [G2-115 · Revisar la accesibilidad de la interfaz](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-115) | Por hacer | Media | Falta revisión formal de teclado, foco y contraste. |
| [G2-116 · Probar la interfaz en los navegadores previstos](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-116) | Por hacer | Media | Falta matriz de navegadores; la prueba automatizada disponible usa Chromium. |

### HU-009 - Poder interactuar con mensajes y alertas visuales

Padre: [G2-29](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-29). Evidencia: AvisoService/AvisoComponent, avisos de formularios y pruebas del cliente; falta validación con tecnologías de asistencia.

| Subtarea | Estado | Prioridad | Comprobación o pendiente |
| --- | --- | --- | --- |
| [G2-117 · Preparar los avisos de éxito y error](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-117) | Listo | Media | Implementación revisada; ver evidencia de la historia. |
| [G2-118 · Conectar los avisos con las operaciones](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-118) | Listo | Media | Implementación revisada; ver evidencia de la historia. |
| [G2-119 · Verificar que los avisos sean comprensibles y accesibles](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-119) | Por hacer | Media | Existen roles ARIA; falta comprobar el anuncio con tecnologías de asistencia. |

### HU-010 - Poder recibir asistencia visual en los formularios

Padre: [G2-30](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-30). Evidencia: CampoComponent y errores por campo, pruebas del cliente y formularios del smoke; falta revisión exhaustiva del alcance.

| Subtarea | Estado | Prioridad | Comprobación o pendiente |
| --- | --- | --- | --- |
| [G2-120 · Añadir ayudas y ejemplos a los campos](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-120) | Listo | Media | Implementación revisada; ver evidencia de la historia. |
| [G2-121 · Mostrar errores junto al campo correspondiente](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-121) | Listo | Media | Implementación revisada; ver evidencia de la historia. |
| [G2-122 · Revisar los formularios del sprint](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-122) | Por hacer | Media | Falta registrar la revisión completa de todos los formularios del alcance. |

### HU-011 - Poder crear, modificar o inactivar registros de referidos

Padre: [G2-31](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-31). Evidencia: CRUD de referidos y baja lógica con pruebas RF-11/RNF-12/RF-11-6; decisión de permisos todavía abierta.

| Subtarea | Estado | Prioridad | Comprobación o pendiente |
| --- | --- | --- | --- |
| [G2-123 · Acordar el alcance de acceso a referidos](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-123) | Por hacer | Alta | Jira permite acceso sin restricción de rol; las specs y el código aplican permisos y propiedad. Falta acordar el texto. |
| [G2-124 · Preparar el alta y edición de referidos](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-124) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-125 · Validar los datos y evitar duplicados](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-125) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-126 · Aplicar la baja lógica de referidos](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-126) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-127 · Probar la gestión y sus permisos](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-127) | Por hacer | Alta | La aceptación de los permisos depende de resolver la diferencia de alcance de HU-011. |

### HU-012 - Poder administrar el listado completo de todos los referidos

Padre: [G2-32](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-32). Evidencia: Listado, filtros y paginación del servidor/cliente; pruebas RF-11. El acceso global debe conciliarse.

| Subtarea | Estado | Prioridad | Comprobación o pendiente |
| --- | --- | --- | --- |
| [G2-128 · Acordar quién puede consultar el listado global](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-128) | Por hacer | Alta | Falta conciliar el listado global sin restricción de rol de Jira con el acceso administrativo implementado. |
| [G2-129 · Preparar la tabla y su paginación](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-129) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-130 · Aplicar los filtros del listado](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-130) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-131 · Probar filtros y restricciones del listado](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-131) | Por hacer | Alta | Falta aceptar la regla de acceso; los filtros y la paginación ya tienen pruebas. |

### HU-013 - Poder registrarme en 3 pasos

Padre: [G2-33](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-33). Evidencia: Registro en tres pasos y validaciones, HU-013/HU-014 y smoke. Tiempo de usuario pendiente.

| Subtarea | Estado | Prioridad | Comprobación o pendiente |
| --- | --- | --- | --- |
| [G2-132 · Preparar el registro en tres pasos](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-132) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-133 · Validar los datos personales y duplicados](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-133) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-134 · Integrar la cuenta y el código de referido opcionales](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-134) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-135 · Validar la contraseña y la aceptación de términos](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-135) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-136 · Probar el alta y medir su duración](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-136) | Por hacer | Alta | El registro tiene pruebas funcionales; falta medir el proceso de tres minutos con participantes. |

### HU-014 - Poder confirmar mi correo con un código

Padre: [G2-34](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-34). Evidencia: ConfirmacionCorreo, pantalla de confirmación y pruebas HU-013/HU-014/SMTP local. Tiempo de entrega real pendiente.

| Subtarea | Estado | Prioridad | Comprobación o pendiente |
| --- | --- | --- | --- |
| [G2-137 · Generar y enviar el código de confirmación](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-137) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-138 · Preparar la pantalla para confirmar el correo](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-138) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-139 · Controlar los reenvíos del código](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-139) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-140 · Probar la confirmación y la entrega del correo](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-140) | Por hacer | Alta | Confirmación funcional probada con SMTP local; falta medir la recepción real de este flujo. |

### HU-015 - Poder vincular mi cuenta de ahorros o corriente

Padre: [G2-35](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-35). Evidencia: Vinculación, máscara, unicidad, estado y permisos; pruebas HU-015/HU-016/RF-06. Canje aún es de un sprint posterior.

| Subtarea | Estado | Prioridad | Comprobación o pendiente |
| --- | --- | --- | --- |
| [G2-141 · Preparar la vinculación en registro y cuenta personal](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-141) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-142 · Validar y guardar la cuenta vinculada](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-142) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-143 · Aplicar las restricciones por cuenta no aprobada](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-143) | Por hacer | Alta | La restricción para referir existe; el canje no está integrado todavía en su historia posterior. |
| [G2-144 · Probar vinculación y acceso a las demás funciones](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-144) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |

### HU-016 - Poder verificar las cuentas vinculadas

Padre: [G2-36](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-36). Evidencia: Cola de revisión, dictamen, bitácora y avisos; pruebas HU-015/HU-016/RF-06. Latencias pendientes.

| Subtarea | Estado | Prioridad | Comprobación o pendiente |
| --- | --- | --- | --- |
| [G2-145 · Preparar la cola de cuentas pendientes](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-145) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-146 · Identificar solicitudes atrasadas](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-146) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-147 · Guardar la aprobación o rechazo](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-147) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-148 · Notificar el resultado al titular](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-148) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-149 · Probar la revisión y medir sus tiempos](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-149) | Por hacer | Alta | La revisión y avisos tienen pruebas funcionales; faltan mediciones de dos y cinco segundos. |

### HU-017 - Poder obtener mi enlace y código QR de referido

Padre: [G2-37](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-37). Evidencia: Generación de código/enlace/QR y descarga verificada en smoke; faltan cámara nativa y medición.

| Subtarea | Estado | Prioridad | Comprobación o pendiente |
| --- | --- | --- | --- |
| [G2-150 · Generar el código único del socio](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-150) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-151 · Construir el enlace y el QR descargable](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-151) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-152 · Condicionar la invitación a la cuenta aprobada](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-152) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-153 · Probar generación, descarga y lectura del QR](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-153) | Por hacer | Alta | La descarga del QR funciona; falta escaneo con cámara nativa y medición del plazo de generación. |

### HU-018 - Poder compartir mi enlace por WhatsApp o redes sociales

Padre: [G2-38](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-38). Evidencia: InvitacionComponent: copiar, WhatsApp, Facebook y navigator.share; smoke verifica enlace y QR. Falta medición con personas.

| Subtarea | Estado | Prioridad | Comprobación o pendiente |
| --- | --- | --- | --- |
| [G2-154 · Preparar la copia del enlace](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-154) | Listo | Media | Implementación revisada; ver evidencia de la historia. |
| [G2-155 · Preparar el envío a WhatsApp y Facebook](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-155) | Listo | Media | Implementación revisada; ver evidencia de la historia. |
| [G2-156 · Integrar el menú de compartir del dispositivo](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-156) | Listo | Media | Implementación revisada; ver evidencia de la historia. |
| [G2-157 · Medir y probar la acción de compartir](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-157) | Por hacer | Media | Falta medir compartir en quince segundos con usuarios y dispositivos. |

### HU-019 - Que mi código se llene automáticamente cuando alguien se registra con mi enlace

Padre: [G2-39](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-39). Evidencia: Alta asociada con código y HU-019/CA-13; escenario de código propio y plazo requieren revisión.

| Subtarea | Estado | Prioridad | Comprobación o pendiente |
| --- | --- | --- | --- |
| [G2-158 · Leer el código desde el enlace o QR](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-158) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-159 · Validar los códigos ingresados](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-159) | Por hacer | Alta | Falta resolver y demostrar el escenario de código propio, que la spec declara no aplicable al registro nuevo. |
| [G2-160 · Crear la relación de referido pendiente](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-160) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-161 · Probar el registro con invitación](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-161) | Por hacer | Alta | El registro asociado está probado; falta medición del plazo de tres segundos. |

### HU-020 - Poder ver el estado de mis referidos

Padre: [G2-40](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-40). Evidencia: Consulta personal, estados y avisos; pruebas RF-39 y RF-11. Tiempo real de notificación pendiente.

| Subtarea | Estado | Prioridad | Comprobación o pendiente |
| --- | --- | --- | --- |
| [G2-162 · Preparar el listado personal de referidos](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-162) | Listo | Media | Implementación revisada; ver evidencia de la historia. |
| [G2-163 · Consultar el estado actualizado](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-163) | Listo | Media | Implementación revisada; ver evidencia de la historia. |
| [G2-164 · Avisar los cambios de estado](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-164) | Listo | Media | Implementación revisada; ver evidencia de la historia. |
| [G2-165 · Probar la privacidad y el tiempo del aviso](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-165) | Por hacer | Media | La privacidad tiene pruebas; falta medir notificación en máximo cinco segundos. |

### HU-021 - Poder aprobar o rechazar a los referidos

Padre: [G2-41](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-41). Evidencia: Dictamen atómico y puntos para ambas partes; pruebas RF-11-4/RF-42. Latencias pendientes.

| Subtarea | Estado | Prioridad | Comprobación o pendiente |
| --- | --- | --- | --- |
| [G2-166 · Preparar la decisión sobre un referido](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-166) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-167 · Validar la cuenta vinculada y el estado previo](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-167) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-168 · Guardar el dictamen y acreditar ambas partes](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-168) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-169 · Probar permisos, concurrencia y tiempos](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-169) | Por hacer | Alta | La integridad y duplicados tienen pruebas; falta medir decisión y acreditación en dos segundos. |

### HU-022 - Poder recibir puntos automáticamente por mis actividades

Padre: [G2-42](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-42). Evidencia: AcreditacionPuntos idempotente y avisos; prueba HU-022. Las actividades de módulos futuros siguen fuera de integración.

| Subtarea | Estado | Prioridad | Comprobación o pendiente |
| --- | --- | --- | --- |
| [G2-170 · Identificar las actividades que otorgan puntos](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-170) | Por hacer | Alta | La acreditación genérica existe; falta delimitar las actividades de este sprint frente a módulos futuros. |
| [G2-171 · Acreditar puntos sin duplicar eventos](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-171) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-172 · Notificar los puntos ganados](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-172) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-173 · Probar la acreditación y sus tiempos](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-173) | Por hacer | Alta | Cantidad e idempotencia probadas; faltan mediciones de acreditación y aviso. |

### HU-023 - Poder actualizar mis datos o dar de baja mi cuenta

Padre: [G2-43](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-43). Evidencia: PerfilPage, API de edición/correo/baja, prueba HU-055/HU-056 y verificación visual del socio. Falta conciliar cuatro datos, tiempo y duplicidad.

| Subtarea | Estado | Prioridad | Comprobación o pendiente |
| --- | --- | --- | --- |
| [G2-174 · Acordar la reutilización del perfil de HU-055](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-174) | Por hacer | Media | HU-023 y HU-055 cubren edición y baja del mismo perfil; falta acordar cuál conserva ese alcance. |
| [G2-175 · Mostrar y actualizar los datos del perfil](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-175) | Por hacer | Media | Edición implementada; falta conciliar los cuatro datos: Excel incluye estado de cuenta y la pantalla muestra provincia, dejando la cuenta en Mi cuenta. |
| [G2-176 · Confirmar el correo nuevo antes de sustituirlo](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-176) | Listo | Media | Implementación revisada; ver evidencia de la historia. |
| [G2-177 · Aplicar la baja conservando el historial](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-177) | Listo | Media | Implementación revisada; ver evidencia de la historia. |
| [G2-178 · Probar los cambios de perfil y su duración](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-178) | Por hacer | Media | Hay pruebas funcionales de perfil; falta medición con usuarios de actualización en dos minutos. |

### HU-024 - Poder descargar la lista de referidos pendientes

Padre: [G2-44](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-44). Evidencia: Endpoint CSV y botón Exportar pendientes, prueba de exportación privada y smoke. Spec propia y plazo pendientes.

| Subtarea | Estado | Prioridad | Comprobación o pendiente |
| --- | --- | --- | --- |
| [G2-179 · Especificar el alcance de la exportación comercial](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-179) | Por hacer | Media | El CSV existe, pero aún falta especificación propia y trazabilidad de HU-024. |
| [G2-180 · Consultar únicamente referidos pendientes](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-180) | Listo | Media | Implementación revisada; ver evidencia de la historia. |
| [G2-181 · Generar y descargar el CSV](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-181) | Listo | Media | Implementación revisada; ver evidencia de la historia. |
| [G2-182 · Probar el archivo, sus permisos y tiempo](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-182) | Por hacer | Media | Contenido y acceso probados; falta medir la descarga en diez segundos. |

### HU-025 - Poder crear y configurar campañas de referidos

Padre: [G2-45](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-45). Evidencia: No hay entidad/API/pantalla operativa completa de campañas ni su spec desarrollada.

| Subtarea | Estado | Prioridad | Comprobación o pendiente |
| --- | --- | --- | --- |
| [G2-183 · Especificar la campaña antes de implementarla](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-183) | Por hacer | Alta | No hay implementación completa ni especificación aprobada de esta funcionalidad. |
| [G2-184 · Preparar el formulario y guardar campañas](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-184) | Por hacer | Alta | No hay implementación completa ni especificación aprobada de esta funcionalidad. |
| [G2-185 · Validar los límites de la campaña](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-185) | Por hacer | Alta | No hay implementación completa ni especificación aprobada de esta funcionalidad. |
| [G2-186 · Evitar campañas activas superpuestas](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-186) | Por hacer | Alta | No hay implementación completa ni especificación aprobada de esta funcionalidad. |
| [G2-187 · Probar la creación de campañas](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-187) | Por hacer | Alta | No hay implementación completa ni especificación aprobada de esta funcionalidad. |

### HU-026 - Poder activar, pausar o finalizar una campaña

Padre: [G2-46](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-46). Evidencia: No hay flujo operativo de estados de campaña, pausa de puntos o avisos por activación.

| Subtarea | Estado | Prioridad | Comprobación o pendiente |
| --- | --- | --- | --- |
| [G2-188 · Especificar los cambios de estado permitidos](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-188) | Por hacer | Alta | No hay implementación completa ni especificación aprobada de esta funcionalidad. |
| [G2-189 · Implementar los controles de estado](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-189) | Por hacer | Alta | No hay implementación completa ni especificación aprobada de esta funcionalidad. |
| [G2-190 · Aplicar la pausa a la acreditación de puntos](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-190) | Por hacer | Alta | No hay implementación completa ni especificación aprobada de esta funcionalidad. |
| [G2-191 · Avisar la activación por provincia](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-191) | Por hacer | Alta | No hay implementación completa ni especificación aprobada de esta funcionalidad. |
| [G2-192 · Probar transiciones y tiempos](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-192) | Por hacer | Alta | No hay implementación completa ni especificación aprobada de esta funcionalidad. |

### HU-027 - Poder ver las campañas vigentes y sus premios

Padre: [G2-47](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-47). Evidencia: No hay consulta/pantalla operativa de campañas vigentes por provincia.

| Subtarea | Estado | Prioridad | Comprobación o pendiente |
| --- | --- | --- | --- |
| [G2-193 · Especificar la consulta de campañas vigentes](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-193) | Por hacer | Media | No hay implementación completa ni especificación aprobada de esta funcionalidad. |
| [G2-194 · Consultar las campañas aplicables al usuario](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-194) | Por hacer | Media | No hay implementación completa ni especificación aprobada de esta funcionalidad. |
| [G2-195 · Mostrar premios y fecha de fin](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-195) | Por hacer | Media | No hay implementación completa ni especificación aprobada de esta funcionalidad. |
| [G2-196 · Probar la visibilidad de las campañas](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-196) | Por hacer | Media | No hay implementación completa ni especificación aprobada de esta funcionalidad. |

### HU-028 - Poder consultar mi saldo y mi historial de puntos

Padre: [G2-48](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-48). Evidencia: Existe tabla de movimientos y suma de puntos; faltan los dos saldos separados y el historial paginado.

| Subtarea | Estado | Prioridad | Comprobación o pendiente |
| --- | --- | --- | --- |
| [G2-197 · Especificar saldos y movimientos](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-197) | Por hacer | Alta | No hay implementación completa ni especificación aprobada de esta funcionalidad. |
| [G2-198 · Calcular y consultar los dos saldos](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-198) | Por hacer | Alta | No hay implementación completa ni especificación aprobada de esta funcionalidad. |
| [G2-199 · Preparar el historial paginado](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-199) | Por hacer | Alta | No hay implementación completa ni especificación aprobada de esta funcionalidad. |
| [G2-200 · Probar saldos, orden y privacidad](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-200) | Por hacer | Alta | No hay implementación completa ni especificación aprobada de esta funcionalidad. |

### HU-029 - Poder configurar los puntos por acción y el valor del punto

Padre: [G2-49](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-49). Evidencia: ParametroGlobal, parámetros por actividad y valorPunto, pantalla Configuración y prueba RF-14/RF-42. Formalización de HU-029 pendiente.

| Subtarea | Estado | Prioridad | Comprobación o pendiente |
| --- | --- | --- | --- |
| [G2-201 · Formalizar las reglas existentes en las specs](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-201) | Por hacer | Alta | Los parámetros existen; falta formalizar su reutilización en spec/plan/tareas de HU-029. |
| [G2-202 · Preparar los valores por acción y el valor del punto](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-202) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-203 · Validar y aplicar las reglas de puntos](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-203) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |
| [G2-204 · Probar y auditar cada cambio](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-204) | Listo | Alta | Implementación revisada; ver evidencia de la historia. |

## HU-055, HU-056 y HU-057: lo que existe y recomendación

Se comprobaron en código y navegador, sin modificar su planificación en Jira:

| Historia | Evidencia actual | Recomendación para acordar con el usuario |
| --- | --- | --- |
| HU-055 · Administrar mi perfil | PerfilPage con edición, cambio de correo/clave y baja; API y pruebas HU-055/HU-056 | Se solapa con HU-023. Conservar HU-023 como principal en Sprint 3 y vincular HU-055 como duplicada, manteniendo ID e historial y reutilizando la evidencia; no contabilizar ambas como dos desarrollos. |
| HU-056 · Datos públicos | Público/Privado en Mi perfil; protección de datos del servidor. Nivel e insignias siguen como valores vacíos de módulos futuros. | Ubicar la base de privacidad en Sprint 2, coherente con las specs y la protección desde el registro. Conciliar primero el criterio: Jira habla de ocultar correo/teléfono y la spec nunca permite mostrarlos a terceros. No declarar completo un perfil público con nivel/insignias futuros. |
| HU-057 · Acuerdos de privacidad | Formulario de versiones en Configuración; publicación/aceptación en API y pruebas RF-47-4 | Ubicarla en Sprint 2 junto al registro y consentimiento. Verificar textos acordados y aceptación; no hace falta volver a construir lo que ya funciona. |

Las tres no tienen sprint asignado actualmente en Jira. Su existencia en las specs de Sprint 2 no prueba
que se hayan asignado allí; se verificaron esos datos por separado. No se ejecutaron estos movimientos
ni el vínculo de duplicidad: son recomendaciones de alcance para el siguiente acuerdo.

La duplicidad significa que HU-023 y HU-055 repiten edición y baja del mismo perfil; no son dos pantallas distintas.
No se propone borrar una historia, renumerar las demás ni volver a programar la función. Una vez decidido
el padre principal, se actualiza la trazabilidad de las specs para conservar ambas referencias.

## Dónde ver las pantallas

- Socio: avatar/enlace **Mi perfil**, ruta /panel/perfil: datos, correo, contraseña, privacidad y baja.
- Administrador: **Configuración**, ruta /panel/configuracion: **Términos y aviso de privacidad**.
- El administrador no ve la baja propia en Mi perfil; esa protección está implementada deliberadamente.
- [Captura del perfil del socio](../.local/qa-subtareas/SUMA-perfil-privacidad-socio.png).
- [Captura de acuerdos de privacidad](../.local/qa-subtareas/SUMA-acuerdos-privacidad.png).

Las capturas proceden de cuentas de prueba y base aislada. No contienen las credenciales de Gmail.
