# Especificación · Administración: usuarios, configuración, bitácora y tablero

| Campo | Valor |
| ----- | ----- |
| Sprint | 1 |
| Historias | HU-005 (tablero) · HU-006 (configuración) · HU-007 (bitácora) · revisión de cuentas (ampliada por HU-016 en el Sprint 2) |
| Requisitos | RF-08-2 · RF-14 · RF-14-1 · RF-14-2 · RF-42 · RF-42-1 · RF-42-2 · RF-45-1 |
| No funcionales | RNF-13 · RNF-15 |
| Estado | Implementada · Verificada |
| Fuente previa | [`docs/CORRECCIONES-AUDITORIA-SPRINT1.md`](../../../docs/CORRECCIONES-AUDITORIA-SPRINT1.md) · auditoría G07, G10, G11, G13, G15 |

## 1. Problema y objetivo

La cooperativa necesita operar la plataforma sin depender de los programadores: crear cuentas internas,
revisar las cuentas vinculadas de los socios, ajustar parámetros, ver de un vistazo cómo va el programa
y poder auditar quién hizo qué.

## 2. Actores

| Actor | Qué puede hacer |
| ----- | --------------- |
| Administrador | Todo lo de esta spec. |
| Gestor / Socio | Nada de esta spec; ven su propio resumen, no el tablero. |

## 3. Historias de usuario

- Como administrador, quiero crear cuentas de Gestor o Administrador para sumar personal sin compartir contraseñas.
- Como administrador, quiero revisar las cuentas de la cooperativa que vinculan los socios para habilitar sus dictámenes.
- **HU-006 · Configuración general** — Como administrador, deseo configurar las opciones generales de la plataforma para ajustar
  el funcionamiento básico; criterio: se pueden cambiar textos, límites y variables globales.
- **HU-007 · Bitácora** — Como administrador, deseo consultar el registro de actividades para revisar qué acciones han realizado
  los usuarios; criterio: toda acción operativa importante queda guardada en bitácora.
- **HU-005 · Panel central** — Como administrador, deseo usar un panel de administración central para navegar y controlar
  todas las opciones; criterio: existe un dashboard exclusivo para la administración.

## 4. Criterios de aceptación

### Usuarios

| ID | Requisito | Dado | Cuando | Entonces |
| -- | --------- | ---- | ------ | -------- |
| CA-01 | RF-08-2 | un administrador | crea una cuenta con nombre, correo y rol | la cuenta se crea y la persona recibe un enlace para definir su contraseña, válido por 24 h |
| CA-02 | RF-08-2 | alguien que no es administrador | intenta crear una cuenta | se le niega |
| CA-03 | RF-08-2 | un rol que no existe | se usa al crear una cuenta | se rechaza |
| CA-04 | RF-08 | un administrador | cambia el rol o desactiva a un usuario | el cambio rige al instante (ver specs 01 y 02) |
| CA-05 | G11 | una cuenta de la cooperativa *Pendiente* | el administrador la aprueba o la rechaza | cambia de estado y queda en la bitácora; un número ya aprobado en otra cuenta no se puede aprobar otra vez |

### Configuración

| ID | Requisito | Dado | Cuando | Entonces |
| -- | --------- | ---- | ------ | -------- |
| CA-06 | RF-14 | la pantalla de configuración | el administrador guarda puntos por referido con decimales | se rechaza indicando el campo |
| CA-07 | RF-14-1 | el mensaje de bienvenida | supera 500 caracteres | se rechaza |
| CA-08 | RF-14 | valores válidos | se guardan | rigen de inmediato (p. ej. cerrar el registro bloquea nuevas altas) |
| CA-09 | RF-14-2 | varios parámetros cambiados a la vez | se guardan | la bitácora tiene una fila por parámetro con valor anterior y nuevo |

### Bitácora

| ID | Requisito | Dado | Cuando | Entonces |
| -- | --------- | ---- | ------ | -------- |
| CA-10 | RF-42-1 | cualquier acción registrada | se guarda | incluye autor, acción, detalle, fecha, IP, objetivo y datos |
| CA-11 | RF-42-2 | la bitácora | se consulta | muestra 50 por página y filtra por rango de fechas, usuario y acción; una fecha mal escrita se rechaza |
| CA-12 | RF-42 | un registro de la bitácora | alguien intenta modificarlo o borrarlo, incluso desde la base | se impide |

### Tablero (HU-005)

| ID | Requisito | Dado | Cuando | Entonces |
| -- | --------- | ---- | ------ | -------- |
| CA-13 | RF-45-1 | un administrador | entra a su inicio | ve un tablero con 6 indicadores |
| CA-14 | RF-45-1 | un indicador cuyo módulo aún no existe | se muestra | indica desde qué sprint estará disponible |
| CA-15 | RF-45-1 | un socio | pide los indicadores | se le niega; ve su propio resumen |

## 5. Reglas de negocio

1. Parámetros configurables en el Sprint 1: `contacto` (correo), `registroAbierto` (sí/no), `mensajeBienvenida`
   (1 a 500 caracteres), `puntosReferido` (entero de 0 a 10000; valor inicial 100).
2. Un parámetro sin cambios no genera fila en la bitácora.
3. La bitácora es de solo lectura para todos, incluido el administrador.
4. Las cuentas creadas por el administrador no tienen contraseña hasta que la persona usa su enlace.

## 6. Fuera de alcance

- Reportes descargables (HU-054 · Sprint 5).
- Respaldo diario y retención de 5 años (auditoría G24 · pendiente de operación).

## 7. Requisitos no funcionales aplicables

- RNF-13 — Bitácora de acciones administrativas.
- RNF-15 — Accesibilidad de las pantallas de administración.

## 8. Preguntas abiertas

| # | Pregunta | Para | Estado |
| - | -------- | ---- | ------ |
| P-01 | ¿Qué números de HU corresponden a usuarios, configuración y bitácora? | PO | Resuelta: HU-006 configuración, HU-007 bitácora; usuarios internos = RF-08-2 sin HU propia |
| P-02 | ¿Se mantiene "SUMA" como nombre del producto? | PO | Abierta |

## 9. Historial

| Fecha | Cambio | Autor |
| ----- | ------ | ----- |
| 2026-11 | Bitácora con IP, inmutable y filtros (G07); tablero de 6 indicadores (G10); revisión de cuentas (G11); una fila por parámetro (G13); alta de Gestor/Admin (G15) | Equipo |
| 2026-11-14 | Documentado como spec SDD a partir del código y las pruebas | Equipo |
| 2026-11-14 | HU-006 y HU-007 identificadas. Sprint 2: la revisión de cuentas se documenta en `sprint-2/02-cuenta-cooperativa` (HU-016) | Equipo |
