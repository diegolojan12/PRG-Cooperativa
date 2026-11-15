# Especificaciones de SUMA · Spec-Driven Development (SDD)

En este proyecto **la especificación es la fuente de verdad**. El código, las pruebas y la documentación
salen de ella. Si el código y la spec no coinciden, se corrige uno de los dos y se deja constancia en el
*Historial* de la spec.

## Flujo de trabajo

| # | Fase | Artefacto | Pregunta que responde | Aprueba |
| - | ---- | --------- | --------------------- | ------- |
| 0 | Constitución | [`constitucion.md`](constitucion.md) | ¿Qué reglas no se negocian en ningún sprint? | Equipo |
| 1 | Especificar | `especificacion.md` | **Qué** se construye y **por qué** (HU, criterios, reglas). Sin tecnología. | Product Owner |
| 2 | Planificar | `plan.md` | **Cómo** se construye (datos, API, pantallas, riesgos). | Equipo técnico |
| 3 | Desglosar | `tareas.md` | Pasos pequeños, cada uno ligado a un criterio `CA-##`. | Equipo |
| 4 | Implementar | código + pruebas | Primero la prueba que falla, después el código. | Revisión del PR |
| 5 | Verificar | sección *Verificación* de `tareas.md` | ¿Pasan todas las pruebas? ¿Se cumplen todos los criterios? | Product Owner |

Si un criterio falla o cambia el alcance, se vuelve a la fase 1: primero se corrige la spec y después el código.

## Estructura

```
specs/
├── README.md                ← este archivo
├── constitucion.md          ← principios del proyecto
├── backlog.md               ← HU de sprints futuros (aún sin especificar)
├── _plantillas/             ← copiar al crear una funcionalidad nueva
│   ├── especificacion.md
│   ├── plan.md
│   └── tareas.md
└── sprint-N/
    ├── README.md            ← objetivo, alcance, estado y matriz de trazabilidad
    └── NN-funcionalidad/
        ├── especificacion.md
        ├── plan.md
        └── tareas.md
```

## Convenciones

- **Identificadores.** Se reutilizan los de la documentación de requisitos: `HU-###` y `EPI-##` (hoja `BKL-G1` del backlog),
  `UR-##`, `RF-##-#`, `RNF-##` (matriz de requisitos) y `CU-##` (casos de uso de `SUMA-Diagramas.eapx`).
  Dentro de una spec, los criterios se numeran `CA-01`, `CA-02`… y cada uno cita el RF que cubre.
- **Criterios de aceptación** en formato *Dado / Cuando / Entonces*, verificables.
- **Todo criterio tiene una prueba**, y el nombre de la prueba cita el RF o la HU
  (p. ej. `t.test('RF-04-2: bloqueo de 15 minutos…')` en `backend/test/sprint.test.mjs`).
- **Estados de una spec:** `Borrador` → `Aprobada` → `En construcción` → `Implementada` → `Verificada`.
- **Decisiones abiertas** se anotan en la sección *Preguntas abiertas* de la spec y en el README del sprint.
- **Una funcionalidad puede agrupar varias HU** si comparten el modelo de datos.
- **Migraciones** por sprint en `backend/prisma/sprintN-<tema>.sql`, idempotentes.

## Índice

| Sprint | Estado | Funcionalidades |
| ------ | ------ | --------------- |
| [Sprint 1](sprint-1/README.md) | Implementado y verificado | [Roles y permisos](sprint-1/01-roles-y-permisos/especificacion.md) · [Sesión y acceso](sprint-1/02-sesion-y-acceso/especificacion.md) · [Referidos](sprint-1/03-referidos/especificacion.md) · [Administración](sprint-1/04-administracion/especificacion.md) · [Protección de datos](sprint-1/05-proteccion-datos/especificacion.md) |
| [Sprint 2](sprint-2/README.md) | Implementado y verificado | [Registro y confirmación](sprint-2/01-registro-y-confirmacion/especificacion.md) · [Cuenta de la Cooperativa](sprint-2/02-cuenta-cooperativa/especificacion.md) · [Invitación](sprint-2/03-invitacion/especificacion.md) · [Seguimiento y puntos](sprint-2/04-seguimiento-y-puntos/especificacion.md) |
| Sprints 3–5 | Por especificar | [`backlog.md`](backlog.md) |
