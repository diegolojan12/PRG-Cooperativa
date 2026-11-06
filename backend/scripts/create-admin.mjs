import { Database, hashPassword } from '../src/database.mjs';
const correo = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const nombre = (process.env.ADMIN_NAME || '').trim();
const clave = process.env.ADMIN_PASSWORD || '';
if (
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) ||
  nombre.length < 5 ||
  clave.length < 12 ||
  clave.length > 128 ||
  !/[A-Z]/.test(clave) ||
  !/[0-9]/.test(clave)
)
  throw new Error(
    'Define ADMIN_EMAIL, ADMIN_NAME y ADMIN_PASSWORD (12 a 128 caracteres, mayúscula y número).',
  );
const db = new Database();
try {
  await db.init();
  const [existing] = await db.query(
    'SELECT id FROM "Usuario" WHERE correo=$1',
    [correo],
  );
  if (existing)
    throw new Error('Ese correo ya existe. No se modificó su cuenta.');
  await db.query(
    'INSERT INTO "Usuario" (nombre,correo,rol,"passwordHash") VALUES ($1,$2,$3,$4)',
    [nombre, correo, 'ADMIN', hashPassword(clave)],
  );
  console.log('Cuenta de administrador creada.');
} finally {
  await db.close();
}
