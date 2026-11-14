import { randomBytes } from 'node:crypto';
import pg from 'pg';

/**
 * Crea un esquema PostgreSQL propio para cada prueba: así la suite puede correr contra la
 * misma base de desarrollo sin tocar sus datos. Usa TEST_DATABASE_URL o, si no existe, DATABASE_URL.
 */
export async function baseAislada() {
  const url = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  if (!/^postgres(ql)?:\/\//.test(url ?? ''))
    throw new Error('Define TEST_DATABASE_URL (o DATABASE_URL) con la URL de PostgreSQL para ejecutar las pruebas.');
  const esquema = 't_' + randomBytes(6).toString('hex');
  const admin = new pg.Pool({ connectionString: url, max: 1 });
  await admin.query(`CREATE SCHEMA ${esquema}`);
  return {
    url,
    esquema,
    async limpiar() {
      await admin.query(`DROP SCHEMA ${esquema} CASCADE`);
      await admin.end();
    },
  };
}
