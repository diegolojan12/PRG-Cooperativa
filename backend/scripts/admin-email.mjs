import { pathToFileURL } from 'node:url';
import { Database } from '../src/database.mjs';

export async function actualizarCorreoAdmin(db, actual, nuevo, { aceptarDestinoExistente = false } = {}) {
  actual = (actual || '').trim().toLowerCase();
  nuevo = (nuevo || '').trim().toLowerCase();
  if (![actual, nuevo].every(c => c.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)))
    throw new Error('Define ADMIN_CURRENT_EMAIL y ADMIN_EMAIL con correos validos.');
  return db.transaction(async client => {
    const indice = correo => db.datos.correoIndice(correo) ?? correo;
    const [usuario] = await db.query(
      'SELECT u.id,r."alcanceGlobal" FROM "Usuario" u JOIN "Rol" r ON r.clave=u.rol WHERE COALESCE(u."correoIndice",u.correo)=$1 AND u.activo FOR UPDATE OF u',
      [indice(actual)], client,
    );
    if (!usuario && aceptarDestinoExistente) {
      const [destino] = await db.query(
        'SELECT r."alcanceGlobal" FROM "Usuario" u JOIN "Rol" r ON r.clave=u.rol WHERE COALESCE(u."correoIndice",u.correo)=$1 AND u.activo',
        [indice(nuevo)], client,
      );
      if (destino?.alcanceGlobal) return false;
    }
    if (!usuario?.alcanceGlobal) throw new Error('No se encontro una cuenta administradora activa con el correo actual.');
    if (actual === nuevo) return false;
    const [duplicado] = await db.query('SELECT id FROM "Usuario" WHERE COALESCE("correoIndice",correo)=$1', [indice(nuevo)], client);
    if (duplicado) throw new Error('El correo de destino ya pertenece a otra cuenta; no se cambio ninguna cuenta.');
    await db.query('UPDATE "Usuario" SET correo=$2,"correoIndice"=$3 WHERE id=$1',
      [usuario.id, db.datos.cifrar('correo', nuevo), db.datos.correoIndice(nuevo)], client);
    for (const tabla of ['Sesion', 'DosFactor', 'Recuperacion', 'CambioCorreo'])
      await db.query(`DELETE FROM "${tabla}" WHERE "usuarioId"=$1`, [usuario.id], client);
    await db.query(
      'INSERT INTO "Actividad" ("usuarioId",actor,accion,detalle,"objetivoId",datos,fecha) VALUES ($1,$2,$3,$4,$1,$5,$6)',
      [usuario.id, 'Administracion local', 'Correo actualizado', 'Cambio explicito desde admin:email; sesiones y desafios revocados', JSON.stringify({ correoActualizado: true }), new Date().toISOString()], client,
    );
    return true;
  });
}

async function ejecutar() {
  const laboratorio = process.argv.includes('--laboratorio');
  const destino = laboratorio ? process.env.SUMA_ADMIN_DEMO_EMAIL?.trim() : process.env.ADMIN_EMAIL;
  if (laboratorio && (
    !destino || process.env.NODE_ENV === 'production' || process.env.SEED_DEMO !== 'true'
  )) return;

  const db = new Database();
  try {
    await db.init();
    const actual = laboratorio ? 'admin@suma.ec' : process.env.ADMIN_CURRENT_EMAIL;
    const cambiado = await actualizarCorreoAdmin(db, actual, destino, { aceptarDestinoExistente: laboratorio });
    if (laboratorio) console.log(`Administrador local: ${destino}. Conserva la contrasena de la cuenta.`);
    else console.log(cambiado ? 'Correo del administrador actualizado. Conserva su contrasena y debe iniciar sesion otra vez.' : 'El correo ya era el solicitado.');
  } catch (error) {
    console.error(error.code === '23505' ? 'El correo ya esta registrado; no se cambio la cuenta.' : error.message);
    process.exitCode = 1;
  } finally {
    await db.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await ejecutar();
