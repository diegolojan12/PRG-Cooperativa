import { Database } from '../src/database.mjs';
if (process.env.NODE_ENV === 'production')
  throw new Error('Las cuentas demo solo se crean en desarrollo.');
const db = new Database();
try {
  await db.init();
  await db.seed();
  console.log(
    'Cuentas de prueba listas (clave Suma2026!): admin@suma.ec, gestor@suma.ec y socio@suma.ec.',
  );
} finally {
  await db.close();
}
