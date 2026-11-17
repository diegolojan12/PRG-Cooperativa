# Especificación · Configuración del perfil

| Campo | Valor |
| ----- | ----- |
| Sprint | 2 (historias movidas desde la lista sin sprint de Jira el 2026-11-17) |
| Historias | HU-055 Administrar mi perfil · HU-056 Elegir qué datos son públicos · HU-057 Gestionar los acuerdos de privacidad |
| Épicas | EPI-20 Cuidar mis datos y pedir ayuda (etiqueta en Jira) |
| Requisitos de usuario | UR-06 Mantener los datos al día · UR-51 Proteger la privacidad · UR-52 Autorizar el tratamiento de datos |
| Requisitos funcionales | RF-03 (RF-03-1 a RF-03-3) · RF-46 (RF-46-1 a RF-46-3) · RF-47-4 · RF-42 |
| No funcionales | RNF-04 · RNF-05 · RNF-12 · RNF-16 |
| Casos de uso (EAPX) | CU-03 Consultar mi perfil · CU-03.1 Actualizar datos del perfil (extend) · CU-03.2 Cambiar la privacidad del perfil (extend) · CU-03.3 Dar de baja la cuenta (extend) · CU-03.4 Confirmar el correo nuevo (include de CU-03.1, nuevo) · CU-19.2 Publicar una nueva versión de los términos (HU-057) |
| Clases | EAPX: `Usuario` (`perfilPublico`, `bajaEn`, `bajaMotivo`) · `ConfirmacionCorreo.iniciarCambio()`. Código: `ConfirmacionCorreo.confirmarCambio()` y `PerfilPublico` (`dominio/perfil.mjs`) |
| Estado | Implementada · Verificada |

## 1. Problema y objetivo

El usuario no podía corregir sus datos ni irse de la plataforma, y no había forma de decidir si otros socios ven su
perfil. UR-06 pide actualizar nombre, correo y celular en menos de 2 minutos; UR-51, decidir la visibilidad sin exponer
nunca correo, celular ni número de cuenta.

## 2. Actores

| Actor | Qué hace |
| ----- | -------- |
| Cualquier usuario autenticado | Consulta y actualiza sus datos, cambia correo y contraseña, elige la visibilidad de su perfil. |
| Socio / Cliente o prospecto | Además, puede dar de baja su cuenta. |
| Administrador | Publica versiones de los términos y del aviso (HU-057). No se da de baja desde el perfil. |

## 3. Historias de usuario (Jira, proyecto G2)

- **HU-055** — Como socio, deseo crear, modificar o inactivar mi perfil de usuario para mantener mi información personal actualizada.
- **HU-056** — Como usuario, deseo elegir qué información personal es pública o privada para proteger mis datos frente a otros usuarios.
- **HU-057** — Como administrador, deseo gestionar los acuerdos de privacidad para asegurar que el sistema cumpla las reglas de protección de datos.

> **HU-056 y la ERS.** El criterio de Jira dice «ocultar el correo y teléfono en el perfil público». La ERS (UR-51,
> RF-46-2) exige que correo, celular y cuenta **nunca** se muestren, sin opción. Se implementó la ERS: el usuario elige
> Público o Privado (RF-46-1) y el perfil público muestra solo nombre de pila, nivel e insignias (RF-46-3).

## 4. Criterios de aceptación

| ID | Requisito | Dado | Cuando | Entonces |
| -- | --------- | ---- | ------ | -------- |
| CA-01 | HU-055 · RF-03-1 | un usuario autenticado | abre *Mi perfil* | ve sus nombres y apellidos, correo, celular y provincia; el estado de la cuenta vinculada está en *Mi cuenta* |
| CA-02 | HU-055 · RF-03-2 | un nombre sin apellido, un celular que no empieza por 09 o una provincia fuera de la lista | guarda | se rechaza con la causa debajo del campo |
| CA-03 | HU-055 · RF-03-2 · UR-14 | un celular que ya usa otra cuenta | guarda | se rechaza (409) |
| CA-04 | HU-055 · RF-03-2 | un correo nuevo libre y la contraseña actual correcta | pide el cambio | recibe un código de 6 dígitos en el correo nuevo (10 min, 5 intentos); el correo no cambia hasta confirmarlo |
| CA-05 | HU-055 · RF-03-2 | un código válido | lo confirma | inicia sesión con el correo nuevo; el correo anterior recibe un aviso |
| CA-06 | HU-055 · RF-03-2 | la contraseña actual y una nueva válida, repetida igual | la cambia | se guarda con hash y sal (RNF-04) y se cierran sus demás sesiones |
| CA-07 | HU-055 · RF-03-3 | la contraseña actual | da de baja la cuenta | la cuenta queda inactiva (baja lógica), se cierra la sesión y se conservan el 100 % de sus referidos, puntos y bitácora |
| CA-08 | HU-055 | una cuenta de administrador | intenta darse de baja | se rechaza (409); otro administrador la desactiva desde Usuarios |
| CA-09 | HU-056 · RF-46-1 | un usuario nuevo | se registra | su perfil es **Privado** |
| CA-10 | HU-056 · RF-46-1 | un usuario | elige Público o Privado | se guarda en máximo 3 s; solo se aceptan esos 2 valores |
| CA-11 | HU-056 · RF-46-2 · RF-46-3 | otro usuario | abre un perfil Público | ve solo nombre de pila, nivel e insignias; nunca correo, celular ni cuenta |
| CA-12 | HU-056 · RF-46-1 | otro usuario | abre un perfil Privado o dado de baja | no lo ve (404) |
| CA-13 | HU-057 · RF-47-4 | un administrador | publica una versión numerada del aviso | queda exactamente 1 vigente y los registros nuevos deben aceptarla (implementado en `02-administracion` y `05-registro-y-confirmacion`) |
| CA-14 | RF-42 | cualquier cambio de este módulo | se guarda | queda en la bitácora |

## 5. Reglas de negocio

1. El correo y el celular siguen cifrados (RNF-05) y su unicidad se comprueba por índice HMAC.
2. Cambiar correo, cambiar contraseña y dar de baja exigen la contraseña actual.
3. La baja es lógica (`activo=false`, `bajaEn`, `bajaMotivo`); para volver, la persona contacta a soporte.
4. Nivel e insignias del perfil público llegan vacíos hasta el Sprint 4 (HU-031, HU-033).

## 6. Fuera de alcance

- Pantalla para ver el perfil público de otro socio: se usará desde el ranking y la comunidad (Sprints 4 y 5).
- Reactivar la cuenta por cuenta propia.

## 7. Duplicados en el backlog

| Historia de Jira | Se cruza con | Propuesta |
| ---------------- | ------------ | --------- |
| HU-055 Administrar mi perfil | HU-023 (Sprint 3) «actualizar mis datos o dar de baja mi cuenta» | Con HU-055 hecha, cerrar HU-023 como duplicada |
| HU-056 Elegir qué datos son públicos | HU-052 (Sprint 5) «elegir si mi perfil es público o privado» | Con HU-056 hecha, cerrar HU-052 como duplicada |
| HU-057 Gestionar los acuerdos de privacidad | RF-47-4, ya hecho con HU-006 y HU-013 | Se traza a HU-057; no requiere código nuevo |

## 8. Historial

| Fecha | Cambio | Autor |
| ----- | ------ | ----- |
| 2026-11-17 | Historias movidas al Sprint 2; implementación, pruebas y caso de uso CU-03 con sus sub-casos | Equipo |
