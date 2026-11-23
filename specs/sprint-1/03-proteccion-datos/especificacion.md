# Especificación · Protección de datos personales en reposo

| Campo | Valor |
| ----- | ----- |
| Sprint | 1 |
| Historias | Requisito no funcional transversal (sin HU propia); se construyó en el Sprint 1 y lo usan todas las HU que guardan datos personales |
| Requisitos | RNF-05 |
| Estado | Implementada · Verificada |
| Fuente previa | [`docs/CORRECCIONES-AUDITORIA-SPRINT1.md`](../../../docs/CORRECCIONES-AUDITORIA-SPRINT1.md) · auditoría G09 |

## 1. Problema y objetivo

La base guarda correos, celulares y números de cuenta de socios y referidos. Si alguien obtiene una copia de
la base, esos datos no deben poder leerse. A la vez, la plataforma debe seguir permitiendo iniciar sesión,
buscar por correo y evitar duplicados.

## 2. Actores

| Actor | Relación |
| ----- | -------- |
| Socio / referido | Dueño de los datos protegidos. |
| Operador de la plataforma | Configura y custodia la clave de cifrado. |

## 3. Historia

- Como cooperativa, quiero que los datos personales estén cifrados en la base para cumplir la normativa de
  protección de datos y reducir el daño de una filtración.

## 4. Criterios de aceptación

| ID | Requisito | Dado | Cuando | Entonces |
| -- | --------- | ---- | ------ | -------- |
| CA-01 | RNF-05 | una clave de cifrado configurada | se guarda un correo, celular o número de cuenta | en la base queda cifrado y el valor original no aparece |
| CA-02 | RNF-05 | una base con datos guardados antes de configurar la clave | se inicia la plataforma con la clave | los datos existentes se cifran |
| CA-03 | RNF-05 | datos cifrados | el usuario inicia sesión con su correo | entra con normalidad y ve sus datos en claro |
| CA-04 | RNF-05 | datos cifrados | alguien se registra con un correo ya usado | se rechaza por duplicado |
| CA-05 | RNF-05 | cualquier respuesta de la API | se envía | nunca incluye el índice de búsqueda |
| CA-06 | RNF-05 | una base cifrada con una clave | se inicia con otra clave | la plataforma se niega a arrancar |
| CA-07 | RNF-05 | producción | falta la clave de cifrado | la plataforma se niega a arrancar |

## 5. Reglas de negocio

1. Campos protegidos: correo, celular y número de cuenta del `Usuario`; correo y celular del `Referido`.
2. Las búsquedas y la unicidad por correo o cuenta usan un índice determinista, nunca el valor en claro.
3. En desarrollo, sin clave, los datos se guardan en claro para facilitar las pruebas.

## 6. Fuera de alcance

- Rotación de la clave.
- Respaldo diario y retención de 5 años (auditoría G24): resuelto el 2026-11-16 con `npm run db:respaldo` en la spec `sprint-2/02-administracion` (CA-16).

## 7. Preguntas abiertas

| # | Pregunta | Para | Estado |
| - | -------- | ---- | ------ |
| P-01 | ¿Quién custodia `SUMA_DATA_KEY` en producción y dónde se respalda? | Cooperativa / TI | Abierta |

## 8. Historial

| Fecha | Cambio | Autor |
| ----- | ------ | ----- |
| 2026-11 | AES-256-GCM con índice HMAC (G09) | Equipo |
| 2026-11-14 | Documentado como spec SDD a partir del código y las pruebas | Equipo |
| 2026-11-16 | CA-07 con prueba automatizada; carpeta renumerada a `03-proteccion-datos` al reorganizar el Sprint 1 | Equipo |

<!-- TRAZABILIDAD-VIGENTE -->
## Trazabilidad vigente al 22 de noviembre de 2026

| Referencia | Valor |
| --- | --- |
| Sprint planificado | 1 |
| Historias | Sin HU propia; RNF-05 transversal |
| Épicas de BKL-G1 | Transversal, sin épica propia |
| Requisitos de usuario | Transversal; véase requisito aplicable |
| Requisitos funcionales | Sin RF exclusivo; protección transversal |
| Requisitos no funcionales | RNF-05 |
| Casos de uso | Transversal; no requiere CU independiente |
| Diagram_ID de comportamiento | Sin diagrama de comportamiento propio; requisito transversal |
| Modelo UML vigente | [SUMA-Diagramas_Vistas_Textos_Centrados.eapx](../../../entregables/SUMA-Diagramas_Vistas_Textos_Centrados.eapx) |
| Registro general | [Matriz completa de las 61 historias](../../TRAZABILIDAD.md) |

La construcción adelantada no cambia el sprint planificado. Los CA conservan sus identificadores y se interpretan junto con la ruta de esta especificación. Las pruebas y tareas conservan su evidencia; esta actualización documental no acredita verificaciones nuevas.
<!-- /TRAZABILIDAD-VIGENTE -->
