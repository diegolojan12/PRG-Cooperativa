# Backlog · HU todavía sin especificar

Cuando se planifica un sprint, cada HU de su bloque pasa a `specs/sprint-N/NN-funcionalidad/` con su
`especificacion.md` en estado *Borrador*. Una HU no entra al sprint hasta que su spec esté *Aprobada*.

## Reparto por sprint (columna *Sprint* de `BKL-G1`, corregida la tabla el 2026-11-16)

| Sprint | Historias | Dónde están especificadas |
| ------ | --------- | ------------------------- |
| 1 | HU-001 a HU-003 | [`sprint-1/`](sprint-1/README.md) |
| 2 | HU-004 a HU-016 y HU-055 a HU-057 | [`sprint-2/`](sprint-2/README.md) |
| 3 | HU-017 a HU-029 | HU-017 a HU-022 en [`sprint-3/`](sprint-3/README.md) (implementadas por adelantado); HU-023 a HU-029 abajo |
| 4 | HU-030 a HU-043 | Abajo |
| 5 | HU-044 a HU-054 | Abajo |

## Sprint 3 · Perfil, campañas y puntos (lo que falta especificar)

| HU | Título | Agrupación sugerida |
| -- | ------ | ------------------- |
| HU-023 | Perfil y baja | Duplicada de HU-055 (hecha en el Sprint 2): proponer cerrarla |
| HU-024 | Lista comercial | 04-lista-comercial · **endpoint CSV ya implementado** |
| HU-025 | Crear campañas | 05-campanias |
| HU-026 | Estado de campaña | 05-campanias |
| HU-027 | Campañas vigentes | 05-campanias |
| HU-028 | Saldo e historial | 06-puntos |
| HU-029 | Reglas de puntos | 06-puntos · **parámetros y valor del punto ya implementados** |

## Sprint 4 · Niveles, insignias, participación y aprendizaje

| HU | Título | Agrupación sugerida |
| -- | ------ | ------------------- |
| HU-030 | Niveles | 01-niveles |
| HU-031 | Nivel y ranking | 01-niveles |
| HU-032 | Inicio del socio | 02-inicio-socio |
| HU-033 | Obtener insignias | 03-insignias |
| HU-034 | Gestionar insignias | 03-insignias |
| HU-035 | Crear y finalizar retos | 04-retos |
| HU-036 | Participación y avance | 04-retos |
| HU-037 | Banco de preguntas | 05-trivia |
| HU-038 | Partida de trivia | 05-trivia |
| HU-039 | Publicar capacitaciones | 06-capacitaciones |
| HU-040 | Evaluación y certificado | 06-capacitaciones |
| HU-041 | Gestionar talleres | 07-talleres |
| HU-042 | Inscripción | 07-talleres |
| HU-043 | Asistencia | 07-talleres |

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
| HU-052 | Privacidad del perfil | Duplicada de HU-056 (hecha en el Sprint 2): proponer cerrarla |
| HU-053 | Soporte | 05-soporte |
| HU-054 | Indicadores y reportes | 06-reportes |

## HU nuevas por planificar (revisión de trazabilidad 2026-11-16)

Estos requisitos de usuario no tenían historia. Sus casos de uso ya están en el modelo EA.

| HU | Título | UR · RF · CU |
| -- | ------ | ------------ |
| HU-058 | Favoritos y meta de canje | UR-42 · RF-34, RF-35 · CU-34 |
| HU-059 | Búsqueda global | UR-43 · RF-36 · CU-35 |
| HU-060 | Ajuste manual de puntos | UR-47 · RF-15 · CU-37 |
| HU-061 | Encuestas de satisfacción | UR-50 · RF-44 · CU-38 |

## Pendientes heredados

| Origen | Pendiente | Destino propuesto |
| ------ | --------- | ----------------- |
| Auditoría G24 | ~~Respaldo diario y retención de 5 años~~ `npm run db:respaldo`; falta programarlo en el servidor | Hecho 2026-11-16 |
| Sesión · P-02 | ~~`AvisoPrivacidad` / `AceptacionTerminos` en el registro~~ | Hecho en `sprint-2/05-registro-y-confirmacion` (HU-013) |
| `sprint-1/01` · P-01 | Permisos por persona (`UsuarioPermiso`) | Solo si el PO lo pide (RF-08-1 propone permisos por rol) |
| `sprint-2/02` | Indicador de premios canjeados | Sprint 5 · 01-recompensas |
| `sprint-2/05` | ~~RF-47-4: publicar nueva versión del aviso desde el panel~~ | Hecho 2026-11-16 |
| `sprint-3/02` | Puntos del referido distintos de los del socio (campañas, RF-13-3) | Sprint 3 · 05-campanias |
| `sprint-3/01` | Pruebas de QR en dispositivo (RNF-19) y de compartir en 15 s (RNF-21) | Antes del despliegue (Sprint 5) |
