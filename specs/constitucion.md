# Constitución de SUMA

Son los principios que toda especificación, plan y cambio de código debe respetar. Si una funcionalidad
necesita romper alguno, primero se discute con el equipo y se modifica este documento, y **después** se construye.

Producto: plataforma de referidos y fidelización de la Cooperativa de Ahorro y Crédito Padre Julián Lorente.

## I. La especificación manda

1. Ninguna HU entra a un sprint sin una `especificacion.md` aprobada por el Product Owner.
2. No se escribe código de producción sin `plan.md` y `tareas.md`.
3. Si durante la construcción aparece algo que la spec no contempla, se para, se actualiza la spec y se sigue.

## II. Nada "quemado" en el código

1. Roles, módulos, permisos, puntos, límites y textos configurables viven en la base de datos
   (`Rol`, `Modulo`, `RolPermiso`, `Configuracion`), no en constantes.
2. La autorización pregunta por capacidades (`alcanceGlobal`, "¿el rol tiene este módulo?"),
   nunca por el nombre del rol: `rol === 'ADMIN'` está prohibido.
3. Un módulo nuevo se agrega con una fila en `Modulo` + su pantalla; el administrador lo asigna desde la interfaz.

## III. Seguridad y privacidad por defecto

1. La autorización se valida **en el servidor** en cada petición; el frontend solo oculta lo que el servidor ya niega.
2. Contraseñas con hash y sal (RNF-04). De tokens y códigos solo se guarda la huella, nunca el valor.
3. Datos personales cifrados en reposo con AES-256-GCM, con un índice HMAC para buscar (RNF-05).
4. Sesión en cookie `httpOnly`, `sameSite=lax` y `secure` en producción; vence a los 15 min sin acciones.
5. Segundo factor obligatorio para los roles que lo exigen (RNF-06).
6. En producción nunca se exponen enlaces de recuperación ni códigos en las respuestas.
7. Un rol nuevo nunca obtiene alcance global ni módulos de administración, y siempre queda al menos
   un administrador activo.

## IV. Trazabilidad y auditoría

1. Toda acción administrativa queda en la bitácora `Actividad`: autor, objetivo, IP y datos anterior/nuevo.
2. La bitácora es inmutable: hay triggers que impiden `UPDATE` y `DELETE`.
3. Las bajas son lógicas y conservan el historial (`eliminadoEn`, `motivoBaja`).
4. Cada HU se puede seguir hasta sus RF/RNF, su spec, su código y su prueba (matriz en el README del sprint).

## V. Cada criterio tiene su prueba

1. Cada criterio de aceptación tiene al menos una prueba automatizada que cita su RF o HU en el nombre.
2. Las pruebas de API corren contra PostgreSQL real, con un esquema aislado por ejecución (`test/aislamiento-pg.mjs`).
3. Una funcionalidad está **hecha** cuando pasan `npm run test:sprint` (backend) y `npx ng test --watch=false`,
   `npx ng lint` y `npx ng build` (frontend). Si toca un flujo de usuario, también el smoke e2e (`node e2e/smoke.cjs`).

## VI. Accesibilidad y experiencia

1. WCAG 2.2 AA (RNF-15): contraste de 4.5:1 en texto y 3:1 en elementos gráficos.
2. Funciona de 360 a 1920 px (RNF-18), con menú desplegable por debajo de 768 px (RF-49-4).
3. Todo campo tiene ayuda y mensaje de error (`CampoComponent`). Los avisos de éxito y de error se distinguen
   por color, icono y rol ARIA (`AvisoService`).
4. Las animaciones usan solo `transform`/`opacity` y respetan `prefers-reduced-motion`.

## VII. Arquitectura

1. Stack: Angular (PWA) · Node.js + Express sobre NestJS · PostgreSQL 14+ como único motor. Sin Docker.
2. El frontend se organiza en `core/`, `shared/`, `layout/` y `features/`, con carga diferida (`loadComponent`) y guards.
3. Las reglas de negocio van en `backend/src/dominio/`, sin depender de la infraestructura; `api.mjs` solo orquesta.
4. Los cambios de esquema son migraciones SQL por sprint (`backend/migraciones/sprintN*.sql`), idempotentes,
   aplicadas una sola vez por `Database.init()` o `npm run db:init`.
5. No se agrega ninguna dependencia sin justificarla en el `plan.md`.

## VIII. Repositorio

1. Una rama por sprint o por funcionalidad, que se integra a `main` por Pull Request revisado.
2. `husky` + `lint-staged` ejecutan Prettier y ESLint (`--max-warnings=0`) en cada commit.
3. Todo el texto visible al usuario y toda la documentación están en español.

---

*Versión 1.0 · adoptada al cerrar el Sprint 1 (noviembre de 2026).*

## Referencias vigentes

Actualización documental del 22 de noviembre de 2026. Consultar [la matriz de trazabilidad](TRAZABILIDAD.md) para identificadores, épicas, sprints y modelo UML. HU-055 es duplicada de HU-023/S3; HU-056 y HU-057 se mantienen en S5. Los registros históricos conservan su fecha y las verificaciones pendientes conservan su estado.
