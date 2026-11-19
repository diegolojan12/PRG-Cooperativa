# Auditoría G2 · Sprints 1 a 3 · 2026-11-19

**Actualización de alcance posterior:** HU-011/HU-012 se alinearon con permisos; HU-055 duplica HU-023. HU-056 y HU-057 se trasladaron al Sprint 5 por instrucción del usuario, sin cerrarlas. Los textos oficiales esperan conversación con la cooperativa. Gmail está configurado y el usuario confirmó recepción de 2FA; las mediciones RNF siguen diferidas. Las tablas siguientes conservan el diagnóstico histórico anterior a estos acuerdos.

**Dictamen: el proyecto no está completo al 100 % hasta el Sprint 3.** Se contrastaron las 32 historias
HU-001 a HU-029 y HU-055 a HU-057, sus descripciones y estados de G2, las specs, rutas/API, modelo de
datos y pruebas disponibles. El inventario inicial de G2 contenía 20 épicas y 61 historias.
Los sprints 4/5 solo se consultaron como límite del alcance; no se auditaron ni implementaron.
La revisión de Enterprise Architect queda para la etapa posterior solicitada por el usuario.

Fuente: [tablero G2 / 4](https://dbastianlojan12-1792785883104.atlassian.net/jira/software/projects/G2/boards/4/backlog).
Seguimiento: [G2-82 · Correo real](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-82)
y [G2-83 · Brechas SDD](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-83).

«Base funcional verificada» significa código y pruebas existentes; no certifica cada criterio de
aceptación, tiempos con usuarios, accesibilidad, operación en producción ni recepción de correo.
«Listo» en Jira no demuestra cumplimiento al 100 %. No se calcula un porcentaje global mezclando
historias y criterios de tamaños diferentes. Las referencias de pruebas sin ruta corresponden a
backend/test/sprint.test.mjs; las del cliente, a frontend/src/app/.

## Sprint 1

| HU / Jira / estado observado | Spec (dentro de specs/) | Evidencia | Resultado y pendiente |
| --- | --- | --- | --- |
| HU-001 / [G2-21](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-21) / Listo | sprint-1/01-roles-y-permisos | Roles/permisos y creación de cuentas internas; HU-001/RF-08/RF-08-2 | Base funcional; activación por correo real pendiente |
| HU-002 / [G2-22](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-22) / Listo | sprint-1/01-roles-y-permisos | Menú desde catálogo, guards y servidor; RF-08 y auth.spec.ts | Base funcional verificada |
| HU-003 / [G2-23](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-23) / Listo | sprint-1/02-sesion-y-acceso | Login, 2FA por capacidad, cookie, bloqueo/inactividad/revocación; RF-04/RNF-06 | Correo real y medición con usuarios pendientes |

RNF-05 transversal: AES-256-GCM/HMAC, migración e índices tienen pruebas; faltan custodia y respaldo
de SUMA_DATA_KEY (sprint-1/03-proteccion-datos, T10). CA-18 de sesión figuraba como excepción
sin prueba; ahora se añadió prueba de reintentos y descarte de mensajes vencidos/sustituidos.
La cola continúa en memoria y pierde reintentos al reiniciar.

## Sprint 2

| HU / Jira / estado observado | Spec (dentro de specs/) | Evidencia | Resultado y pendiente |
| --- | --- | --- | --- |
| HU-004 / [G2-24](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-24) / Listo | sprint-2/01-recuperacion-de-acceso | /auth/forgot, /auth/reset, 30 min/un uso, revocación; RF-07 y SMTP local | Entrega en 60 s y recuperación con usuarios en 5 min pendientes |
| HU-005 / [G2-25](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-25) / Listo | sprint-2/02-administracion | /indicadores y tablero con seis indicadores; RF-45-1 | Base verificada; indicadores de módulos futuros se identifican como pendientes |
| HU-006 / [G2-26](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-26) / Listo | sprint-2/02-administracion | /configuracion y validaciones; RF-14/RF-42 | Base funcional; credenciales SMTP en configuración del servidor |
| HU-007 / [G2-27](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-27) / Listo | sprint-2/02-administracion | /actividad, filtros, paginación, trigger inmutable y script de respaldo | Falta programar respaldo diario y comprobar retención/restauración operativa |
| HU-008 / [G2-28](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-28) / Listo | sprint-2/03-interfaz | Shells, menú adaptable, guards; features.spec.ts | Matriz navegadores/dispositivos 360–1920 px y accesibilidad pendientes |
| HU-009 / [G2-29](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-29) / Listo | sprint-2/03-interfaz | AvisoService/AvisoComponent y ARIA; auth.spec.ts | Base funcional; revisión integral WCAG pendiente |
| HU-010 / [G2-30](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-30) / Listo | sprint-2/03-interfaz | CampoComponent con ayuda y errores; features.spec.ts | Base funcional; revisión de todos los formularios/dispositivos pendiente |
| HU-011 / [G2-31](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-31) / Listo | sprint-2/04-referidos | Alta, edición, baja lógica, privacidad; RF-11/RNF-12/RF-11-6 | Jira dice independiente del rol; spec/código aplican permisos y propiedad: resolver con PO |
| HU-012 / [G2-32](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-32) / Listo | sprint-2/04-referidos | Listado global, filtros y paginación; RF-11/RF-11-4 | Jira dice sin restricción de rol; spec/código reservan vista global a administración |
| HU-013 / [G2-33](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-33) / Listo | sprint-2/05-registro-y-confirmacion | Tres pasos, provincia, unicidad, términos versionados; HU-013/HU-014/RF-47-4 | Faltan textos oficiales y medición de registro con usuarios en 3 min |
| HU-014 / [G2-34](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-34) / Listo | sprint-2/05-registro-y-confirmacion | Código seis dígitos/10 min, reenvíos, confirmación; SMTP local y API | Falta credencial del remitente y recepción real en 60 s |
| HU-015 / [G2-35](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-35) / Listo | sprint-2/06-cuenta-cooperativa | /auth/cuenta, máscara, unicidad y bloqueo para referir; HU-015/HU-016/RF-06 | Base verificada; comprobación de titularidad sigue como decisión abierta |
| HU-016 / [G2-36](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-36) / Listo | sprint-2/06-cuenta-cooperativa | Cola, dictamen, avisos y bitácora; HU-015/HU-016/RF-06 | Base verificada; tiempos reales de operación no certificados |
| HU-055 / [G2-75](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-75) / Por hacer | sprint-3/03-configuracion-perfil (HU-023) / sprint-5/04-privacidad-y-acuerdos (HU-056) | Perfil, correo nuevo con código, contraseña y baja; prueba HU-055/HU-056 | Código existe; Jira Por hacer y duplicidad con HU-023 por conciliar |
| HU-056 / [G2-76](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-76) / Por hacer | sprint-3/03-configuracion-perfil (HU-023) / sprint-5/04-privacidad-y-acuerdos (HU-056) | Privacidad, campos permitidos y 404 privado; prueba RF-46 | Código existe; revisar nivel/insignias aún futuros antes de cierre integral |
| HU-057 / [G2-77](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-77) / Por hacer | sprint-2/07 y sprint-2/05 | Aviso versionado vigente y aceptación obligatoria; RF-47-4 | Código existe; textos oficiales y estado Jira por conciliar |

**Discrepancia HU-011/HU-012:** no es posible declarar cumplidos a la vez el literal de Jira
«independientemente del rol / sin restricción de rol» y las reglas de privacidad de las specs.
Se requiere decisión del PO para ajustar el texto a RF-08 y la privacidad ya implementada, o
rediseñar explícitamente el alcance. No se amplió el acceso a datos personales en esta revisión.

## Sprint 3

Jira tiene seis historias Listo y siete Por hacer. Es un conteo de seguimiento, no un porcentaje
de aceptación integral. HU-023, HU-024 y HU-029 tienen código reutilizable aunque no spec propia.

| HU / Jira / estado observado | Spec (dentro de specs/) | Evidencia | Resultado y pendiente |
| --- | --- | --- | --- |
| HU-017 / [G2-37](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-37) / Listo | sprint-3/01-invitacion | Código único, enlace y QR PNG; RF-11: vinculación… | Pruebas con cámara nativa Android/iOS pendientes (RNF-19) |
| HU-018 / [G2-38](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-38) / Listo | sprint-3/01-invitacion | Copiar, WhatsApp, Facebook y compartir; InvitacionComponent | Compartir en 15 s con participantes pendiente (RNF-21) |
| HU-019 / [G2-39](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-39) / Listo | sprint-3/01-invitacion | Prellenado y alta asociada sin duplicar; HU-019/CA-13 | CA-11 auto-referencia declarado no aplicable al alta: revisar/documentar excepción |
| HU-020 / [G2-40](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-40) / Listo | sprint-3/02-seguimiento-y-puntos | Lista privada del socio, estados, avisos y sondeo; RF-39/RF-11 | Base funcional; latencia real de notificación no certificada |
| HU-021 / [G2-41](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-41) / Listo | sprint-3/02-seguimiento-y-puntos | Dictamen atómico, puntos a ambas partes y bitácora; RF-11-4/RF-42 | Decisión de puntos del referido sin campañas pendiente (T16) |
| HU-022 / [G2-42](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-42) / Listo | sprint-3/02-seguimiento-y-puntos | AcreditacionPuntos idempotente y notificación; prueba HU-022 | Referido integrado; adaptador genérico no implementa módulos futuros de retos/trivia/talleres/capacitaciones |
| HU-023 / [G2-43](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-43) / Por hacer | Sin spec propia; reutiliza sprint-2/07 | Perfil, correo, clave y baja existentes bajo HU-055 | Conciliar duplicidad con HU-055 y medir edición en 2 min |
| HU-024 / [G2-44](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-44) / Por hacer | Solo backlog | /referidos/exportar, botón Exportar pendientes y prueba CSV privada | Especificación/plan/tareas propios y medición de descarga en 10 s |
| HU-025 / [G2-45](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-45) / Por hacer | Solo backlog | Solo columna y filtro de campaña en referidos | Sin entidad/API/UI operativa: faltan fechas, provincias, puntos diferenciados, solapamientos y tiempo de creación |
| HU-026 / [G2-46](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-46) / Por hacer | Solo backlog | No hay flujo de campaña implementado | Faltan Borrador/Activa/Pausada/Finalizada, restricciones, puntos en pausa, avisos y tiempos |
| HU-027 / [G2-47](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-47) / Por hacer | Solo backlog | Sin API ni pantalla operativa de campañas vigentes | Faltan campañas activas por provincia, puntos para ambas partes y fecha de fin |
| HU-028 / [G2-48](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-48) / Por hacer | Solo backlog | MovimientoPuntos y suma de puntos en /overview | Faltan saldo disponible/acumulado separado e historial API/UI de 20 por página descendente |
| HU-029 / [G2-49](https://dbastianlojan12-1792785883104.atlassian.net/browse/G2-49) / Por hacer | Parcial en sprint-2/02 y sprint-3/02 | ParametroGlobal, reglas 0–10000, valorPunto con dos decimales y bitácora; pantalla Configuración | Formalizar spec/plan/tareas de HU-029 y trazabilidad de sus pruebas |

Las vistas comunidad/seccion.page.ts y contenido-ejemplo.ts se declaran vistas previas; no son
módulos operativos. Niveles, ranking, inicio e insignias pertenecen al Sprint 4 (HU-030 a HU-034).
La fila del README de Sprint 3 que los incluía era contradictoria con backlog.md.

## Estado de sprints del tablero 4

| ID | Sprint | Estado observado |
| --- | --- | --- |
| 57 | G2 Sprint 1 | Activo |
| 58 | G2 Sprint 2 | Activo |
| 54 | G2 Sprint 3 | Futuro |
| 55 / 56 | G2 Sprint 4 / 5 | Futuros |
| 20 / 53 | Cierres anteriores 1 / 2 | Cerrados, reparto antiguo de historias |

Datos leídos con listJiraBoardSprints, no inferidos de descripciones. No se iniciaron/cerraron
sprints ni se cambiaron estados de historias. HU-055 a HU-057 siguen Por hacer pese al código
existente y a su asignación documental a Sprint 2; revisar todos los criterios antes de cerrarlas.

## Cambio de correo implementado

- Spec/plan/tareas: specs/sprint-2/08-correo-transaccional/.
- Adaptador backend/src/infraestructura/correo.mjs: SMTP/TLS, perfiles Gmail/Microsoft 365/Yahoo,
  host personalizado y OAuth2 con token externo; límites de conexión y reintentos con vigencia.
- Se preservó la descripción original y se ampliaron criterios en G2-21, G2-23, G2-24, G2-34 y G2-75.
- Administrador local cambiado de admin@suma.ec a nixx2409@gmail.com, conservando su contraseña.
  Se actualizan correo/índice según el cifrado de la base, bitácora y revocación de sesiones/desafíos.
- No hay redirección global: los demás usuarios conservan sus propios destinatarios.
- Para administrador el segundo factor es un código de seis dígitos/5 min; la recuperación es
  un enlace/30 min; el registro usa código/10 min; la activación interna usa enlace/24 h.
- Gmail elegido para desarrollo. **No hay credencial del remitente ni evidencia de bandeja real**.
  SMTP de loopback y verify() no acreditan RNF-14 (60 segundos).
- Guía: [CORREO-TRANSACCIONAL.md](CORREO-TRANSACCIONAL.md).
  Configuración local oculta: scripts/configurar-correo.ps1. Diagnóstico sin envío: npm run mail:verify.
- La renovación de tokens OAuth2 genéricos es externa; no se implementó consentimiento OAuth.

## Verificación de esta revisión

| Comprobación | Resultado |
| --- | --- |
| backend: npm run test:sprint | 33/33 pasan, PostgreSQL aislado |
| backend: npm run test:correo | 4/4 pasan, SMTP de loopback + PostgreSQL aislado; sin enviar a Internet |
| frontend: npm test -- --watch=false | 17/17 pasan |
| backend: npm run lint | 0 errores; 7 advertencias existentes en acceso/API/suite de sprint |
| frontend: npm run lint | Pasa |
| backend: npm run build | Pasa; Prisma requirió acceso autorizado al directorio temporal de Windows |
| frontend: npm run build | Pasa |
| Parser PowerShell de scripts/configurar-correo.ps1 | Sintaxis correcta; ejecución con credenciales reales pendiente |
| node e2e/smoke.cjs | Pasa: 7 bloques en Chromium y sin errores de JavaScript; se instalaron dependencias/navegador y se autorizó acceso a AppData |
| Correo real / tiempos con usuarios / dispositivos | Pendiente, no sustituido por simulación |

## Pendientes para cierre integral

1. Credencial del remitente y entrega real medida (G2-82).
2. Permisos HU-011/HU-012, duplicidad HU-023/HU-055 y conciliación HU-055 a HU-057.
3. Spec antes de código para campañas HU-025 a HU-027 e historial/saldos HU-028.
4. Formalizar la reutilización de CSV y reglas de puntos HU-024/HU-029.
5. Accesibilidad, navegadores/dispositivos y tiempos de registro, acceso, recuperación, compartir y QR,
   siguiendo docs/PROTOCOLO-PRUEBAS-USUARIOS.md. Latencias/volumen no certificados por una sola suite.
6. Programación del respaldo diario, prueba de restauración/retención, textos oficiales de privacidad,
   custodia de clave y decisión de titularidad de la cuenta Cooperativa.
7. Conciliar calendario del tablero y aprobar cierres antes de la revisión posterior de diagramas EA.
