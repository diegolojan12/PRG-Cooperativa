import { readFileSync } from 'node:fs';
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
      ]) {
        const [done] = await db.query(
          'SELECT nombre FROM "SumaMigracion" WHERE nombre=$1',
          [nombre],
          client,
        );
        if (done) continue;
        await client.query(
          readFileSync(
            new URL(`../prisma/${nombre}.sql`, import.meta.url),
            'utf8',
          ),
        );
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
