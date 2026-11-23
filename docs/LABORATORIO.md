# Guía de ejecución y laboratorio (sin Docker)

SUMA necesita solo **Node.js 24+** y **PostgreSQL 14+**. No usa Docker, Redis ni SQLite.

## 1. Una sola computadora (desarrollo)

```bash
# 1) Crear el usuario y la base (una sola vez). Usa la cuenta administradora de TU PostgreSQL:
cd backend
npm ci
set PGADMIN_URL=postgresql://postgres:TU_CLAVE@localhost:5432/postgres
npm run db:crear

# 2) Migraciones + compilar + iniciar
npm run db:init
npm run build
npm run start:local          # http://localhost:3000

# 3) En otra terminal: la web
cd ../frontend
npm ci
npm start                    # desarrollo con recarga: http://localhost:4200
```

`backend/.env` (copia de `.env.example`) trae `DATABASE_URL=postgresql://suma:suma_dev@localhost:5432/suma`.
En PowerShell usa `$env:PGADMIN_URL="..."` en lugar de `set`.

Atajo: `INICIAR-SUMA.cmd` prepara PostgreSQL, verifica el correo real y abre el navegador. Si falta SMTP,
pide una cuenta remitente de Gmail y su contraseña de aplicación en un campo oculto. Las credenciales
quedan en el `backend/.env` local. Luego pide el correo que recibe el código del administrador de prueba
si todavía no está configurado. El remitente y el destinatario pueden ser cuentas distintas.

Para usar otro correo con el administrador de prueba, añade `SUMA_ADMIN_DEMO_EMAIL=correo-admin@ejemplo.ec`
a tu `backend/.env`, deja `SEED_DEMO=true` y ejecuta el atajo. SUMA prepara el PostgreSQL indicado por
`DATABASE_URL` y actualiza el correo de `admin@suma.ec`, conservando su contraseña. Si ya está configurado,
el siguiente arranque continúa sin volver a modificarlo. La opción solo se aplica en laboratorio.

Al iniciar con `INICIAR-SUMA.cmd`, el backend oculta los códigos de prueba. Para demostrar la entrega,
inicia sesión con el administrador y comprueba que el código de SUMA aparece en su bandeja. La verificación
SMTP del arranque solo comprueba conexión y autenticación. Si varias instalaciones usan el mismo correo de
administrador, todos los códigos se dirigen a esa bandeja. Ver [Correo transaccional](CORREO-TRANSACCIONAL.md).

## 2. Laboratorio con 3 computadoras

| PC | Qué corre | Puerto |
| --- | --- | --- |
| **A · Backend** | API + PostgreSQL | 3000 (API), 5432 (solo local) |
| **B · Frontend** | Servidor web de SUMA (sirve la web y reenvía `/api` a la PC A) | 4200 |
| **C · Usuario** | Solo un navegador | — |

Es posible porque el navegador de la PC C habla **únicamente** con la PC B; la PC B reenvía `/api` a la PC A.
Así no hay problemas de CORS ni de cookies entre equipos.

**PC A (backend)** — anota su IP (`ipconfig`), por ejemplo `192.168.1.20`:

```bash
cd backend
# backend/.env:
#   FRONTEND_URL=http://192.168.1.21:4200     <- dirección EXACTA con la que la PC C abrirá la web (IP de la PC B)
#   TRUST_PROXY=1                              <- el backend está detrás de un único proxy (la PC B)
#   SEED_DEMO=true  ENABLE_DEV_RESET_LINK=true <- sin correo configurado, los códigos salen en pantalla
npm ci && npm run db:crear && npm run db:init && npm run build
npm run start:local
```

Abre el puerto 3000 en el Firewall de Windows **solo para la IP de la PC B**
(`New-NetFirewallRule -DisplayName "SUMA API" -Direction Inbound -Protocol TCP -LocalPort 3000 -RemoteAddress 192.168.1.21 -Action Allow`).
No abras el puerto 5432: PostgreSQL solo lo usa el backend en la misma PC.

**PC B (frontend)**:

```bash
cd frontend
npm ci && npm run build
set BACKEND_URL=http://192.168.1.20:3000
npm run serve:lab            # http://0.0.0.0:4200
```

Abre el puerto 4200 en el Firewall de la PC B.

**PC C (usuario)**: navegador en `http://192.168.1.21:4200`. Puede registrarse, entrar, explorar y cerrar sesión.

Problemas típicos:

| Síntoma | Causa |
| --- | --- |
| "Origen no permitido" al iniciar sesión | `FRONTEND_URL` del backend no coincide con la dirección que escribe la PC C (incluye protocolo y puerto). |
| "No se pudo conectar con el servidor de SUMA" | La PC A está apagada, `BACKEND_URL` es incorrecto o el firewall bloquea el 3000. |
| El administrador no recibe el código de 2 pasos | No hay SMTP configurado. Con `ENABLE_DEV_RESET_LINK=true` el código aparece en pantalla (solo laboratorio). Para correo real, configura `SMTP_*`. |
| Los registros nuevos no persisten tras reiniciar | Se usó otra `DATABASE_URL`; verifica que sea la base `suma`. |

## 3. Para quien continúa el proyecto (otra PC, Sprint 2 en adelante)

**¿Qué pasa con la base de datos?** Cada persona tiene la suya, en su propio PostgreSQL. La base **no viaja en git**:
viaja el *esquema* (las migraciones `backend/prisma/*.sql`) y los datos de prueba se generan solos. Es decir:
quien clona el repositorio solo necesita crear una base vacía; el resto lo hace el proyecto.

```bash
git clone https://github.com/diegolojan12/PRG-Cooperativa.git
cd PRG-Cooperativa
git checkout sprint-1            # o la rama que corresponda

cd backend
npm ci
copy .env.example .env           # (cp en Git Bash). Revisa DATABASE_URL
set PGADMIN_URL=postgresql://postgres:LA_CLAVE_DE_SU_POSTGRES@localhost:5432/postgres
npm run db:crear                 # crea el usuario "suma" y la base "suma" (si ya existen, no hace nada)
npm run db:init                  # aplica las migraciones y siembra roles, módulos y las 3 cuentas de prueba
npm run build
npm run start:local              # API en http://localhost:3000

# otra terminal
cd frontend
npm ci
npm start                        # web en http://localhost:4200
```

Si su PostgreSQL usa otro puerto o contraseña, solo cambia `DATABASE_URL` en `backend/.env` (archivo local, no se sube a git).
Cuentas de prueba: ver la sección 4.

**Cómo agregar tablas o columnas en el Sprint 2** (para que las migraciones lleguen a todos):

1. Crear un archivo nuevo en `backend/prisma/`, por ejemplo `sprint2-campanias.sql`, con sentencias idempotentes
   (`CREATE TABLE IF NOT EXISTS ...`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...`).
2. Agregar su nombre (sin `.sql`) al final de la lista `MIGRACIONES` en `backend/src/database.mjs`.
3. Al iniciar el backend (o con `npm run db:init`) se aplica una sola vez en cada PC. **No editar migraciones ya publicadas.**
4. Si el módulo nuevo debe aparecer en el menú, agregar su fila en `backend/src/dominio/catalogo-inicial.mjs`
   (el administrador lo asigna a los roles desde Roles y permisos).

Si alguien quiere compartir datos reales entre PCs: `pg_dump -U suma -d suma -F c -f suma.dump` y en la otra PC
`pg_restore -U suma -d suma --clean suma.dump`. No subir ese archivo al repositorio.

## 4. Cuentas de prueba

Clave de las tres: `Suma2026!`

| Rol | Correo |
| --- | --- |
| Administrador | `admin@suma.ec` (pide código de 2 pasos) |
| Gestor de contenidos | `gestor@suma.ec` |
| Socio | `socio@suma.ec` |

Para producción: `SEED_DEMO=false`, define `SUMA_DATA_KEY` y crea el primer administrador con
`ADMIN_EMAIL=... ADMIN_NAME=... ADMIN_PASSWORD=... npm run admin:create`.

## 5. Pruebas

```bash
cd backend && npm run test:sprint     # usa DATABASE_URL; cada prueba corre en un esquema aislado y lo elimina
cd frontend && npx ng test --watch=false && npx ng lint
```
