import { readFileSync } from 'node:fs';
import { Database } from '../src/database.mjs';
const db = new Database();
try {
  if (!db.sqlite) {
    await db.transaction(async (client) => {
      await db.query(
        'CREATE TABLE IF NOT EXISTS "SumaMigracion" (nombre TEXT PRIMARY KEY)',
        [],
        client,
      );
      const [done] = await db.query(
        'SELECT nombre FROM "SumaMigracion" WHERE nombre=$1',
        ['sprint1'],
        client,
      );
      if (!done) {
        await client.query(
          readFileSync(
            new URL('../prisma/sprint1.sql', import.meta.url),
            'utf8',
          ),
        );
        await db.query(
          'INSERT INTO "SumaMigracion" (nombre) VALUES ($1)',
          ['sprint1'],
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
