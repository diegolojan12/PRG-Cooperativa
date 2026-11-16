import { createRequire } from 'node:module';

const require = createRequire(new URL('../backend/package.json', import.meta.url));
const pg = require('pg');
const nueva = process.env.SUMA_POSTGRES_NUEVA_CLAVE;
const puerto = Number(process.env.SUMA_POSTGRES_PUERTO || 5432);
if (!nueva || !Number.isInteger(puerto) || puerto < 1 || puerto > 65535) {
  console.error('Falta la nueva clave o el puerto PostgreSQL no es valido.');
  process.exit(1);
}
const verificar = process.argv.includes('--verificar');
const cliente = new pg.Client({
  host: '127.0.0.1', port: puerto, database: 'postgres', user: 'postgres',
  password: verificar ? nueva : '', connectionTimeoutMillis: 5000,
});
try {
  await cliente.connect();
  if (verificar) await cliente.query('SELECT 1');
  else await cliente.query('ALTER ROLE postgres PASSWORD ' + cliente.escapeLiteral(nueva));
  console.log(verificar ? 'Nueva clave verificada.' : 'Clave de postgres actualizada.');
} catch (error) {
  console.error('PostgreSQL: ' + (error.code || 'CONEXION') + ' - ' + error.message);
  process.exitCode = 1;
} finally {
  await cliente.end();
}
