import pg from 'pg';

/**
 * Crea el usuario y la base de datos de SUMA en un PostgreSQL ya instalado.
 * Lee el destino de DATABASE_URL (backend/.env) y se conecta con una cuenta
 * administradora que se indica en PGADMIN_URL, por ejemplo:
 *   PGADMIN_URL=postgresql://postgres:TU_CLAVE@localhost:5432/postgres
 * Es seguro repetirlo: si el usuario o la base ya existen, no los toca.
 */
const destino = process.env.DATABASE_URL;
const admin = process.env.PGADMIN_URL;
if (!/^postgres(ql)?:\/\//.test(destino ?? ''))
  throw new Error('Define DATABASE_URL en backend/.env (postgresql://usuario:clave@host:5432/base).');
if (!/^postgres(ql)?:\/\//.test(admin ?? ''))
  throw new Error(
    'Define PGADMIN_URL con la cuenta administradora de PostgreSQL, por ejemplo postgresql://postgres:TU_CLAVE@localhost:5432/postgres',
  );
const url = new URL(destino);
const usuario = decodeURIComponent(url.username);
const clave = decodeURIComponent(url.password);
const base = decodeURIComponent(url.pathname.slice(1));
const identificador = /^[a-z_][a-z0-9_]{0,62}$/;
if (!identificador.test(usuario) || !identificador.test(base) || !clave)
  throw new Error('Usuario y base deben ir en minúsculas (letras, números y _) y la URL debe incluir una contraseña.');

const cliente = new pg.Client({ connectionString: admin });
await cliente.connect();
try {
  const rol = await cliente.query('SELECT 1 FROM pg_roles WHERE rolname=$1', [usuario]);
  if (rol.rowCount) console.log(`El usuario "${usuario}" ya existe.`);
  else {
    await cliente.query(`CREATE ROLE "${usuario}" LOGIN PASSWORD ${cliente.escapeLiteral(clave)}`);
    console.log(`Usuario "${usuario}" creado.`);
  }
  const existe = await cliente.query('SELECT 1 FROM pg_database WHERE datname=$1', [base]);
  if (existe.rowCount) console.log(`La base "${base}" ya existe.`);
  else {
    await cliente.query(`CREATE DATABASE "${base}" OWNER "${usuario}" ENCODING 'UTF8'`);
    console.log(`Base "${base}" creada.`);
  }
  console.log('Listo. Ahora ejecuta: npm run db:init');
} finally {
  await cliente.end();
}
