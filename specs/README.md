# Especificaciones de SUMA · Spec-Driven Development (SDD)

**Revisión 2026-11-19:** implementación funcional verificada no equivale a cierre integral al 100 %.
Gmail está configurado y se confirmó una recepción real de 2FA. Quedan mediciones, operación y pruebas con usuarios diferidas; el Sprint 3 sigue parcial. Privacidad y acuerdos se planifican en el Sprint 5.
Ver [auditoría G2 de los sprints 1 a 3](../docs/AUDITORIA-G2-SPRINTS-1-3-2026-11-19.md) y la
[ampliación de correo transaccional](sprint-2/08-correo-transaccional/especificacion.md).

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
  `UR-##`, `RF-##-#`, `RNF-##` (matriz de requisitos) y `CU-##` (casos de uso de `SUMA-Diagramas_Vistas_Textos_Centrados.eapx`, CU-01 a CU-38).
  Dentro de una spec, los criterios se numeran `CA-01`, `CA-02`… y cada uno cita el RF que cubre.
- **Criterios de aceptación** en formato *Dado / Cuando / Entonces*, verificables.
- **Todo criterio tiene una prueba**, y el nombre de la prueba cita el RF o la HU
  (p. ej. `t.test('RF-04-2: bloqueo de 15 minutos…')` en `backend/test/sprint.test.mjs`).
- **Estados de una spec:** `Borrador` → `Aprobada` → `En construcción` → `Implementada` → `Verificada`.
- **Decisiones abiertas** se anotan en la sección *Preguntas abiertas* de la spec y en el README del sprint.
- **Una funcionalidad puede agrupar varias HU** si comparten el modelo de datos.
- **Migraciones** por sprint en `backend/migraciones/sprintN-<tema>.sql`, idempotentes.

## Índice

| Sprint | Estado | Funcionalidades |
| ------ | ------ | --------------- |
| [Sprint 1](sprint-1/README.md) · HU-001 a HU-003 | Implementado y verificado | [Roles y permisos](sprint-1/01-roles-y-permisos/especificacion.md) · [Sesión y acceso](sprint-1/02-sesion-y-acceso/especificacion.md) · [Protección de datos](sprint-1/03-proteccion-datos/especificacion.md) |
| [Sprint 2](sprint-2/README.md) · HU-004 a HU-016 | Base implementada; integraciones HU-006/HU-011 pendientes | [Recuperación de acceso](sprint-2/01-recuperacion-de-acceso/especificacion.md) · [Administración](sprint-2/02-administracion/especificacion.md) · [Interfaz](sprint-2/03-interfaz/especificacion.md) · [Referidos](sprint-2/04-referidos/especificacion.md) · [Registro y confirmación](sprint-2/05-registro-y-confirmacion/especificacion.md) · [Cuenta de la Cooperativa](sprint-2/06-cuenta-cooperativa/especificacion.md) |
| [Sprint 3](sprint-3/README.md) · HU-017 a HU-029 | En parte (HU-017 a HU-022 adelantadas) | [Invitación](sprint-3/01-invitacion/especificacion.md) · [Seguimiento y puntos](sprint-3/02-seguimiento-y-puntos/especificacion.md) · [Perfil y baja](sprint-3/03-configuracion-perfil/especificacion.md) · resto en [`backlog.md`](backlog.md) |
| [Sprint 4](sprint-4/README.md) | Planificado; por especificar | [`backlog.md`](backlog.md) |
| [Sprint 5](sprint-5/README.md) · HU-044 a HU-054, HU-056 y HU-057 | Planificado; aceptación de privacidad y acuerdos pendiente | [Privacidad y acuerdos](sprint-5/04-privacidad-y-acuerdos/especificacion.md) · [`backlog.md`](backlog.md) |

El reparto sigue la columna *Sprint* de la hoja `BKL-G1` (reorganizado el 2026-11-16). Los criterios `CA-##` que se
trasladaron de una spec a otra conservan su número original y el destino queda anotado en la spec de origen.

## Referencias vigentes

Actualización documental del 22 de noviembre de 2026. Consultar [la matriz de trazabilidad](TRAZABILIDAD.md) para identificadores, épicas, sprints y modelo UML. HU-055 es duplicada de HU-023/S3; HU-056 y HU-057 se mantienen en S5. Los registros históricos conservan su fecha y las verificaciones pendientes conservan su estado.

## Copias de entrega

Las carpetas `entregables/especificaciones/` y `entregables/codigo/specs/` son copias completas de esta colección. Se generan en el mismo corte; únicamente se ajustan los enlaces externos según la ubicación. Los ZIP de especificaciones y perfil se regeneran desde estas fuentes.
