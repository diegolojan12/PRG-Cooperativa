import { createRequire } from 'node:module';

const require = createRequire(new URL('../backend/package.json', import.meta.url));
let destino;
try {
  destino = new URL(process.env.DATABASE_URL);
  if (!['postgresql:', 'postgres:'].includes(destino.protocol)) throw new Error();
} catch {
  console.log(JSON.stringify({ ok: false, codigo: 'CONFIG', mensaje: 'Revisa DATABASE_URL en backend/.env.' }));
  process.exit(1);
}

if (process.argv.includes('--destino')) {
  console.log(JSON.stringify({ host: destino.hostname, puerto: destino.port || '5432', base: decodeURIComponent(destino.pathname.slice(1)), usuario: decodeURIComponent(destino.username) }));
} else {
  const pg = require('pg');
  const cliente = new pg.Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
  try {
    await cliente.connect();
    await cliente.query('SELECT 1');
    console.log(JSON.stringify({ ok: true }));
  } catch (error) {
    const codigo = error.code || error.errors?.[0]?.code || 'CONEXION';
    console.log(JSON.stringify({ ok: false, codigo, mensaje: error.message || 'No se pudo conectar con PostgreSQL.' }));
    process.exitCode = 1;
  } finally {
    await cliente.end();
  }
}
