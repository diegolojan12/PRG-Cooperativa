import { Database } from '../src/database.mjs';
if (process.env.NODE_ENV === 'production')
  throw new Error('Las cuentas demo solo se crean en desarrollo.');
const db = new Database();
try {
  await db.init();
  await db.seed();
  console.log(
    'Cuentas de prueba listas: admin@suma.ec y socio@suma.ec / Suma2026!',
  );
} finally {
  await db.close();
}
