# Especificación · Configuración del perfil

| Campo | Valor |
| ----- | ----- |
| Sprint | 3 · HU-023; implementación adelantada, aceptación pendiente |
| Historias | HU-023 Actualizar mis datos o dar de baja mi cuenta · HU-055 vinculada como duplicada de HU-023 |
| Épicas | EPI-06 Crear mi cuenta y vincularla con la Cooperativa (HU-023, BKL-G1!B29). HU-055 se conserva como duplicada histórica, sin entrega adicional. |
| Requisitos de usuario | UR-06 Mantener los datos al día |
| Requisitos funcionales | RF-03 (RF-03-1 a RF-03-3) · RF-42 |
| No funcionales | RNF-04 · RNF-05 · RNF-12 · RNF-16 |
| Casos de uso (EAPX) | CU-03, CU-03.1, CU-03.3 y CU-03.4 |
| Clases | Usuario · ConfirmacionCorreo · CambioCorreo |
| Estado | Implementación existente; cierre de HU-023 pendiente de sus verificaciones |

## 1. Problema y objetivo

El usuario no podía corregir sus datos ni irse de la plataforma. UR-06 pide actualizar nombre, correo y celular en menos de 2 minutos.

## 2. Actores

| Actor | Qué hace |
| ----- | -------- |
| Cualquier usuario autenticado | Consulta y actualiza sus datos, cambia correo y contraseña. |
| Socio / Cliente o prospecto | Además, puede dar de baja su cuenta. |
| Administrador | Actualiza sus datos; no se da de baja desde el perfil. |

## 3. Historia de usuario

**HU-023** — Como socio / cliente, deseo actualizar mis datos o dar de baja mi cuenta para mantener mi información al día. HU-055 permanece vinculada como duplicada de HU-023; no se cuentan dos entregas.

## 4. Criterios de aceptación

| ID | Requisito | Dado | Cuando | Entonces |
| -- | --------- | ---- | ------ | -------- |
| CA-01 | HU-023 · RF-03-1 | un usuario autenticado | abre *Mi perfil* | ve sus nombres y apellidos, correo, celular y provincia; el estado de la cuenta vinculada está en *Mi cuenta* |
| CA-02 | HU-023 · RF-03-2 | un nombre sin apellido, un celular que no empieza por 09 o una provincia fuera de la lista | guarda | se rechaza con la causa debajo del campo |
| CA-03 | HU-023 · RF-03-2 · UR-14 | un celular que ya usa otra cuenta | guarda | se rechaza (409) |
| CA-04 | HU-023 · RF-03-2 | un correo nuevo libre y la contraseña actual correcta | pide el cambio | recibe un código de 6 dígitos en el correo nuevo (10 min, 5 intentos); el correo no cambia hasta confirmarlo |
| CA-05 | HU-023 · RF-03-2 | un código válido | lo confirma | inicia sesión con el correo nuevo; el correo anterior recibe un aviso |
| CA-06 | HU-023 · RF-03-2 | la contraseña actual y una nueva válida, repetida igual | la cambia | se guarda con hash y sal (RNF-04) y se cierran sus demás sesiones |
| CA-07 | HU-023 · RF-03-3 | la contraseña actual | da de baja la cuenta | la cuenta queda inactiva (baja lógica), se cierra la sesión y se conservan el 100 % de sus referidos, puntos y bitácora |
| CA-08 | HU-023 | una cuenta de administrador | intenta darse de baja | se rechaza (409); otro administrador la desactiva desde Usuarios |
| CA-14 | RF-42 | cualquier cambio de este módulo | se guarda | queda en la bitácora |

## 5. Reglas de negocio

1. El correo y el celular siguen cifrados (RNF-05) y su unicidad se comprueba por índice HMAC.
2. Cambiar correo, cambiar contraseña y dar de baja exigen la contraseña actual.
3. La baja es lógica (`activo=false`, `bajaEn`, `bajaMotivo`); para volver, la persona contacta a soporte.


## 6. Fuera de alcance

- Pantalla para ver el perfil público de otro socio: se usará desde el ranking y la comunidad (Sprints 4 y 5).
- Reactivar la cuenta por cuenta propia.

## 7. Planificación

HU-055 duplica HU-023, según la vinculación autorizada en Jira. La privacidad del perfil y la gestión de acuerdos se planifican en el Sprint 5; no forman parte de esta entrega.

## 8. Historial

| Fecha | Cambio | Autor |
| ----- | ------ | ----- |
| 2026-11-17 | Historias movidas al Sprint 2; implementación, pruebas y caso de uso CU-03 con sus sub-casos | Equipo |

| 2026-11-19 | Reubicada desde Sprint 2 para seguir HU-023; privacidad y acuerdos separados al Sprint 5 por decisión del usuario. | Equipo |

<!-- TRAZABILIDAD-VIGENTE -->
## Trazabilidad vigente al 22 de noviembre de 2026

| Referencia | Valor |
| --- | --- |
| Sprint planificado | 3 |
| Historias | HU-023 · HU-055 duplicada histórica, sin entrega adicional |
| Épicas de BKL-G1 | EPI-06 |
| Requisitos de usuario | UR-06 Mantener los datos al día |
| Requisitos funcionales | RF-03 (RF-03-1 a RF-03-3) · RF-42 |
| Requisitos no funcionales | RNF-04 · RNF-05 · RNF-12 · RNF-16 |
| Casos de uso | CU-03, CU-03.1, CU-03.3 y CU-03.4 |
| Diagram_ID de comportamiento | 35 Sequence; 36 Activity; 41 Sequence; 42 Activity |
| Modelo UML vigente | [SUMA-Diagramas_Vistas_Textos_Centrados.eapx](../../../../SUMA-Diagramas_Vistas_Textos_Centrados.eapx) |
| Registro general | [Matriz completa de las 61 historias](../../TRAZABILIDAD.md) |

La construcción adelantada no cambia el sprint planificado. Los CA conservan sus identificadores y se interpretan junto con la ruta de esta especificación. Las pruebas y tareas conservan su evidencia; esta actualización documental no acredita verificaciones nuevas.
<!-- /TRAZABILIDAD-VIGENTE -->
