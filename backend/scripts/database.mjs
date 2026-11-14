import { Database } from '../src/database.mjs';

// Aplica las migraciones pendientes y deja el catálogo de roles y módulos listo.
const db = new Database();
try {
  await db.init();
  console.log('Base de datos SUMA lista (PostgreSQL).');
} finally {
  await db.close();
}
