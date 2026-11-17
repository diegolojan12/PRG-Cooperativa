# Backlog · HU todavía sin especificar

Cuando se planifica un sprint, cada HU de su bloque pasa a `specs/sprint-N/NN-funcionalidad/` con su
`especificacion.md` en estado *Borrador*. Una HU no entra al sprint hasta que su spec esté *Aprobada*.

## Reparto por sprint (columna *Sprint* de `BKL-G1`, corregida la tabla el 2026-11-16)

| Sprint | Historias | Dónde están especificadas |
| ------ | --------- | ------------------------- |
| 1 | HU-001 a HU-003 | [`sprint-1/`](sprint-1/README.md) |
| 2 | HU-004 a HU-016 | HU-004 a HU-012 en [`sprint-1/`](sprint-1/README.md); HU-013 a HU-016 en [`sprint-2/`](sprint-2/README.md) |
| 3 | HU-017 a HU-029 | HU-017 a HU-022 ya programadas en [`sprint-2/`](sprint-2/README.md); HU-023 a HU-029 abajo |
| 4 | HU-030 a HU-043 | Abajo |
| 5 | HU-044 a HU-054 | Abajo |

## Sprint 2 · Especificado e implementado

HU-013 a HU-022 → [`sprint-2/`](sprint-2/README.md) (HU-017 a HU-022 son del Sprint 3 según el backlog).

## Sprint 3 · Perfil, campañas y fidelización

| HU | Título | Agrupación sugerida |
| -- | ------ | ------------------- |
| HU-023 | Perfil y baja | 01-perfil |
| HU-024 | Lista comercial | 02-lista-comercial · **endpoint CSV ya implementado en el Sprint 2** |
| HU-025 | Crear campañas | 03-campanias |
| HU-026 | Estado de campaña | 03-campanias |
| HU-027 | Campañas vigentes | 03-campanias |
| HU-028 | Saldo e historial | 04-puntos |
| HU-029 | Reglas de puntos | 04-puntos · **parámetros y valor del punto ya implementados en el Sprint 2** |
| HU-030 | Niveles | 05-niveles |
| HU-031 | Nivel y ranking | 05-niveles |
| HU-032 | Inicio del socio | 06-inicio-socio |
| HU-033 | Obtener insignias | 07-insignias |
| HU-034 | Gestionar insignias | 07-insignias |

## Sprint 4 · Participación y aprendizaje

| HU | Título | Agrupación sugerida |
| -- | ------ | ------------------- |
| HU-035 | Crear y finalizar retos | 01-retos |
| HU-036 | Participación y avance | 01-retos |
| HU-037 | Banco de preguntas | 02-trivia |
| HU-038 | Partida de trivia | 02-trivia |
| HU-039 | Publicar capacitaciones | 03-capacitaciones |
| HU-040 | Evaluación y certificado | 03-capacitaciones |
| HU-041 | Gestionar talleres | 04-talleres |
| HU-042 | Inscripción | 04-talleres |
| HU-043 | Asistencia | 04-talleres |

## Sprint 5 · Recompensas, comunidad y reportes

| HU | Título | Agrupación sugerida |
| -- | ------ | ------------------- |
| HU-044 | Catálogo de premios | 01-recompensas |
| HU-045 | Canjear | 01-recompensas |
| HU-046 | Entrega | 01-recompensas |
| HU-047 | Muro | 02-comunidad |
| HU-048 | Comentarios y reacciones | 02-comunidad |
| HU-049 | Contenido oficial | 02-comunidad |
| HU-050 | Moderación | 02-comunidad |
| HU-051 | Salud y bienestar | 03-bienestar |
| HU-052 | Privacidad del perfil | 04-privacidad |
| HU-053 | Soporte | 05-soporte |
| HU-054 | Indicadores y reportes | 06-reportes |

## HU nuevas por planificar (revisión de trazabilidad 2026-11-16)

Estos requisitos de usuario no tenían historia. Sus casos de uso ya están en el modelo EA.

| HU | Título | UR · RF · CU |
| -- | ------ | ------------ |
| HU-055 | Favoritos y meta de canje | UR-42 · RF-34, RF-35 · CU-34 |
| HU-056 | Búsqueda global | UR-43 · RF-36 · CU-35 |
| HU-057 | Ajuste manual de puntos | UR-47 · RF-15 · CU-37 |
| HU-058 | Encuestas de satisfacción | UR-50 · RF-44 · CU-38 |

## Pendientes heredados

| Origen | Pendiente | Destino propuesto |
| ------ | --------- | ----------------- |
| Auditoría G24 | ~~Respaldo diario y retención de 5 años~~ `npm run db:respaldo`; falta programarlo en el servidor | Hecho 2026-11-16 |
| Spec 02 · P-02 | ~~`AvisoPrivacidad` / `AceptacionTerminos` en el registro~~ | Hecho en Sprint 2 · 01-registro-y-confirmacion (HU-013) |
| Spec 01 · P-01 | Permisos por persona (`UsuarioPermiso`) | Solo si el PO lo pide |
| Spec 04 | Indicador de premios canjeados | Sprint 5 · 01-recompensas |
| Sprint 2 · 01 | ~~RF-47-4: publicar nueva versión del aviso desde el panel~~ | Hecho 2026-11-16 |
| Sprint 2 · 04 | Puntos del referido distintos de los del socio (campañas, RF-13-3) | Sprint 3 · 03-campanias |
| Sprint 2 · 03 | Pruebas de QR en dispositivo (RNF-19) y de compartir en 15 s (RNF-21) | Antes del despliegue (Sprint 5) |
