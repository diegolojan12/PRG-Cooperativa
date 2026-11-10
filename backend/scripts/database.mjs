import { readFileSync } from 'node:fs';
import { SPRINT4_DDL } from '../src/dominio/esquema-sprint4.mjs';
import { SPRINT3_DDL } from '../src/dominio/esquema-sprint3.mjs';
import { Database } from '../src/database.mjs';
const db = new Database();
try {
  if (!db.sqlite) {
    await db.transaction(async (client) => {
      await client.query('SELECT pg_advisory_xact_lock(15274000)');
      await db.query(
        'CREATE TABLE IF NOT EXISTS "SumaMigracion" (nombre TEXT PRIMARY KEY)',
        [],
        client,
      );
      for (const nombre of [
        'sprint1',
        'sprint1-auditoria',
        'sprint1-dominio',
        'sprint2',
        'sprint3',
        'sprint4',
      ]) {
        const [done] = await db.query(
          'SELECT nombre FROM "SumaMigracion" WHERE nombre=$1',
          [nombre],
          client,
        );
        if (done) continue;
        if (nombre !== 'sprint4')
          await client.query(
            readFileSync(
              new URL(`../prisma/${nombre}.sql`, import.meta.url),
              'utf8',
            ),
          );
        if (nombre === 'sprint3') await client.query(SPRINT3_DDL);
        if (nombre === 'sprint4') await client.query(SPRINT4_DDL);
        await db.query(
          'INSERT INTO "SumaMigracion" (nombre) VALUES ($1)',
          [nombre],
          client,
        );
      }
    });
  }
  await db.init();
  console.log('Base de datos SUMA lista.');
} finally {
  await db.close();
}
