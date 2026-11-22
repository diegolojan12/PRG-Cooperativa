# Especificación · Roles, permisos y menú según el rol

| Campo | Valor |
| ----- | ----- |
| Sprint | 1 |
| Historias | HU-001 · HU-002 |
| Requisitos de usuario | UR-04 |
| Requisitos funcionales | RF-08 · RF-08-1 · RF-08-2 · RF-08-3 · RF-08-4 · RF-08-5 |
| Casos de uso (EAPX) | CU-16 Gestionar roles y permisos · CU-17 Gestionar usuarios de la plataforma · CU-02.4 Cargar el menú y los permisos del rol (include de CU-02) |
| No funcionales | RNF-13 · RNF-15 · RNF-18 |
| Estado | Implementada · Verificada |
| Fuente previa | [`docs/SPRINT1-HU-001-002-003.md`](../../../docs/SPRINT1-HU-001-002-003.md) |

## 1. Problema y objetivo

Antes, los roles y sus módulos estaban escritos en el código en seis lugares; sumar un rol obligaba a programar.
El objetivo es que el administrador gestione roles y permisos desde la plataforma y que cada persona vea
**solo** los módulos de su rol, sin que nadie pueda saltarse esa restricción.

## 2. Actores

| Actor | Qué puede hacer |
| ----- | --------------- |
| Administrador | Crear, editar y eliminar roles; asignar y quitar módulos a cada rol; asignar un rol a cada usuario. |
| Gestor de contenidos | Usar solo los módulos que su rol tenga asignados. |
| Socio | Usar solo los módulos que su rol tenga asignados. |

## 3. Historias de usuario

- **HU-001 · Roles y permisos** — Como administrador, quiero asignar y quitar permisos a los roles para controlar
  qué puede hacer cada tipo de usuario sin tocar el código.
- **HU-002 · Acceso a módulos según el rol** — Como administrador, deseo gestionar los accesos a los distintos módulos
  para asegurar que cada rol solo vea lo que le corresponde.

## 4. Criterios de aceptación

| ID | Requisito | Dado | Cuando | Entonces |
| -- | --------- | ---- | ------ | -------- |
| CA-01 | RF-08-1 | una instalación nueva | se inicia la plataforma | existen los 3 roles base (Administrador, Gestor de contenidos y Socio), con sus módulos iniciales, y no se pueden eliminar |
| CA-02 | HU-001 | un administrador con sesión | crea un rol con clave, nombre, descripción, experiencia y módulos | el rol queda disponible y nunca tiene alcance global |
| CA-03 | HU-001 | un rol ya existente | se intenta crear otro con la misma clave | se rechaza por duplicado |
| CA-04 | HU-001 | un rol que no es del sistema | se le intenta asignar un módulo de administración | se rechaza y el rol queda como estaba |
| CA-05 | RF-08 | un rol con usuarios conectados | el administrador cambia sus módulos | el cambio rige en la siguiente acción de esos usuarios, sin volver a entrar |
| CA-06 | HU-001 | un rol con usuarios asignados, o un rol del sistema | el administrador intenta eliminarlo | se rechaza; un rol sin usuarios y que no es del sistema sí se elimina |
| CA-07 | RF-08-2 | un usuario que no es administrador | intenta crear o editar roles | se le niega el acceso |
| CA-08 | HU-002 / RF-08-3 | un usuario que inicia sesión | entra a la plataforma | ve un menú con solo los módulos de su rol, en el orden del catálogo |
| CA-09 | HU-002 | un rol con experiencia *Comunidad* o *Administración* | un usuario de ese rol entra | se abre la interfaz de red social o el panel administrativo, según el rol |
| CA-10 | RF-08-4 | un usuario sin un módulo | escribe a mano la dirección de ese módulo | el servidor lo rechaza y se muestra "Acceso denegado" |
| CA-11 | RF-08 | un administrador con sesión | intenta cambiar su propio rol a otro o desactivarse | se rechaza: nadie se quita su propio acceso de administrador, así siempre queda al menos uno activo |
| CA-12 | RF-08-5 / RNF-13 | cualquier cambio de roles o de rol de un usuario | se guarda | queda en la bitácora con autor, usuario afectado, rol anterior y rol nuevo |
| ~~CA-13~~ | RF-49-4 | — | — | Trasladado a [`sprint-2/03-interfaz`](../../sprint-2/03-interfaz/especificacion.md) (HU-008) |

## 5. Reglas de negocio

1. Los permisos se asignan a **roles** y los roles a **usuarios** (RBAC). Un usuario tiene un solo rol.
2. Los roles del sistema (`ADMIN`, `GESTOR`, `SOCIO`) se crean una sola vez y no se pueden eliminar;
   sus módulos sí se pueden editar, dentro de los módulos disponibles y obligatorios de cada uno.
3. Cada rol tiene módulos **obligatorios** (no se pueden quitar) y **disponibles** (los que se le pueden dar).
4. Solo un rol con alcance global accede a los módulos de administración. Un rol creado por el
   administrador nunca tiene alcance global.
5. La clave de un rol es única, en mayúsculas y sin espacios.
6. Un módulo puede existir en el catálogo con su pantalla "próximamente" hasta el sprint que la construya.
7. El administrador puede exigir segundo factor a un rol.

## 6. Fuera de alcance

- Permisos sueltos por persona que no vengan del rol (ver P-01).
- Mensajería y transmisiones en la interfaz del socio.

## 7. Requisitos no funcionales aplicables

- RNF-13 — Bitácora de todas las acciones administrativas.
- RNF-15 — WCAG 2.2 AA en menú y pantallas de roles.

## 8. Preguntas abiertas

| # | Pregunta | Para | Estado |
| - | -------- | ---- | ------ |
| P-01 | La HU dice "asignar permisos a los usuarios". ¿Se necesitan excepciones por persona o basta RBAC? | PO | Propuesta aplicada en la ERS (RF-08-1): permisos por rol, no por persona. Falta confirmación del PO |
| P-02 | RF-08-1 decía "1 de 3 roles", pero HU-001 pide gestionar roles | PO | Propuesta aplicada en la ERS (RF-08-1): 3 roles base que no se borran y roles adicionales. Falta confirmación del PO |

## 9. Historial

| Fecha | Cambio | Autor |
| ----- | ------ | ----- |
| 2026-11 | Roles pasan de constantes a base de datos (HU-001) | Equipo |
| 2026-11 | Auditoría G02, G14, G19, G20 corregidas | Equipo |
| 2026-11-14 | Documentado como spec SDD a partir del código y las pruebas | Equipo |
| 2026-11-14 | Numeración oficial del backlog `BKL-G1`: se suma HU-008 | Equipo |
| 2026-11-16 | HU-008 y CA-13 pasan a `sprint-2/03-interfaz` (HU-008 es del Sprint 2). RF-08-1 corregido en la ERS; casos de uso CU-16, CU-17 y CU-02.4 | Equipo |
