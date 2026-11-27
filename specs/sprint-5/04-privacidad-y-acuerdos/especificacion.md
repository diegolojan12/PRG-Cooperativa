# Especificación · Privacidad del perfil y acuerdos

| Campo | Valor |
| --- | --- |
| Épicas | EPI-20 |
| Sprint | 5 · G2 Sprint 5 (56) |
| Historias | HU-056 (G2-76) · HU-057 (G2-77) |
| Requisitos | UR-51, UR-52 · RF-46, RF-47-4 |
| Casos de uso | CU-03.2 · CU-19.2 |
| Estado | Planificada; implementación adelantada existente, aceptación pendiente |

## Objetivo

Acordar con la cooperativa la visibilidad del perfil y los términos y aviso de privacidad. El 2026-11-19 el usuario retiró estas historias del Sprint 2 y las asignó al Sprint 5. No se publican textos oficiales ni plantillas nuevas con este cambio.

## Historias

- **HU-056:** Como usuario, deseo elegir qué información personal es pública o privada para proteger mis datos frente a otros usuarios.
- **HU-057:** Como administrador, deseo gestionar los acuerdos de privacidad para asegurar que el sistema cumpla las reglas de protección de datos.

## Criterios trasladados

Se conservan los identificadores de la especificación anterior para no perder trazabilidad. Se revisarán con la cooperativa antes de aceptar las historias.

| ID | Requisito | Dado | Cuando | Entonces |
| --- | --- | --- | --- | --- |
| CA-09 | HU-056 · RF-46-1 | un usuario nuevo | se registra | su perfil es **Privado** |
| CA-10 | HU-056 · RF-46-1 | un usuario | elige Público o Privado | se guarda en máximo 3 s; solo se aceptan esos 2 valores |
| CA-11 | HU-056 · RF-46-2 · RF-46-3 | otro usuario | abre un perfil Público | ve solo nombre de pila, nivel e insignias; nunca correo, celular ni cuenta |
| CA-12 | HU-056 · RF-46-1 | otro usuario | abre un perfil Privado o dado de baja | no lo ve (404) |
| CA-13 | HU-057 · RF-47-4 | un administrador | publica una versión numerada del aviso | queda exactamente 1 vigente y los registros nuevos deben aceptarla (implementado en `02-administracion` y `05-registro-y-confirmacion`) |

Criterios trasladados desde registro, conservando sus identificadores de origen:

| ID de origen | Requisito | Dado | Cuando | Entonces |
| --- | --- | --- | --- | --- |
| Registro CA-17 | RF-47-4 | administrador en Configuración | publica una versión mayor con textos de al menos 20 caracteres | queda una sola vigente y se audita la versión anterior y nueva |
| Registro CA-18 | RF-47-4 | versión igual, menor o inválida | intenta publicarla | se rechaza |
| Registro CA-19 | RF-47-1, RF-47-4 | una persona aceptó una versión anterior | envía su registro | debe abrir y aceptar la versión vigente |

## Decisiones pendientes

1. Aprobar los textos oficiales, responsable y canal de contacto con la cooperativa.
2. Conciliar el criterio de HU-056 con UR-51 y RF-46-2: el código nunca expone correo, celular ni cuenta. No se amplía su visibilidad.
3. Revisar el solapamiento de HU-052 con HU-056; no se modifica ni cierra HU-052 con esta decisión.
4. Verificar la integración de nivel e insignias cuando estén disponibles.

## Historial

| Fecha | Cambio |
| --- | --- |
| 2026-11-19 | HU-056 y HU-057 pasan del Sprint 2 al Sprint 5 por decisión del usuario; se conserva código y pruebas existentes. |

<!-- TRAZABILIDAD-VIGENTE -->
## Trazabilidad vigente al 22 de noviembre de 2026

| Referencia | Valor |
| --- | --- |
| Sprint planificado | 5 |
| Historias | HU-056 · HU-057 |
| Épicas de BKL-G1 | EPI-20 |
| Requisitos de usuario | UR-51, UR-52 |
| Requisitos funcionales | RF-46, RF-47-4 |
| Requisitos no funcionales | Véase criterios y requisitos aplicables |
| Casos de uso | CU-03.2 · CU-19.2 |
| Diagram_ID de comportamiento | 41 Sequence; 42 Activity; 71 Sequence; 72 Activity |
| Modelo UML vigente | [SUMA-Diagramas_Vistas.eapx](../../../entregables/SUMA-Diagramas_Vistas.eapx) |
| Registro general | [Matriz completa de las 61 historias](../../TRAZABILIDAD.md) |

La construcción adelantada no cambia el sprint planificado. Los CA conservan sus identificadores y se interpretan junto con la ruta de esta especificación. Las pruebas y tareas conservan su evidencia; esta actualización documental no acredita verificaciones nuevas.
<!-- /TRAZABILIDAD-VIGENTE -->
