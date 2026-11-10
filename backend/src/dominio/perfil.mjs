import { provinciasCobertura } from './campanias.mjs';

export function rutasPerfil({
  db,
  route,
  current,
  fail,
  person,
  password,
  verifyPassword,
  hashPassword,
  confirmacionCorreo,
  enviarConfirmacion,
  exigirCorreoDisponible,
  devExpose,
  mask,
  gamificacion,
  log,
}) {
  const lock = db.sqlite ? '' : ' FOR NO KEY UPDATE';

  route('get', '/perfil', async (req, res) => {
    const u = await current(req);
    res.json({
      nombre: u.nombre,
      correo: u.correo,
      celular: u.celular,
      cuentaEstado: u.cuentaEstado,
      provincia: u.provincia,
      visibilidad: u.visibilidad,
      provincias: provinciasCobertura(),
      insignias: await gamificacion.obtenidas(u.id),
    });
  });
  route('patch', '/perfil', async (req, res) => {
    const usuario = await current(req);
    const datos = person(req.body);
    const provincia = req.body.provincia || null;
    if (provincia && !provinciasCobertura().includes(provincia))
      fail('Selecciona una provincia de la lista.');
    const claveActual = req.body.claveActual;
    if (typeof claveActual !== 'string' || claveActual.length > 128)
      fail('Escribe tu contraseña actual.', 400);
    const claveNueva = req.body.claveNueva
      ? password(req.body.claveNueva)
      : null;
    const prueba = await db.transaction(async (client) => {
      const [u] = await db.query(
        'SELECT * FROM "Usuario" WHERE id=$1' + lock,
        [usuario.id],
        client,
      );
      if (!u?.activo || !verifyPassword(claveActual, u.passwordHash))
        fail('La contraseña actual es incorrecta.', 400);
      const indiceCelular = db.datos.huella('celular:' + datos.celular) ?? null;
      if (datos.celular !== u.celular) {
        if (!db.sqlite)
          await db.query(
            'SELECT pg_advisory_xact_lock(15274004, hashtext($1))',
            [indiceCelular ?? datos.celular],
            client,
          );
        const [otro] = await db.query(
          'SELECT id FROM "Usuario" WHERE id<>$1 AND COALESCE("celularIndice",celular)=$2',
          [u.id, indiceCelular ?? datos.celular],
          client,
        );
        if (otro)
          fail('Ese celular pertenece a otra cuenta.', 409, {
            celular: 'Ingresa otro celular.',
          });
      }
      const cambiaCorreo = datos.correo !== u.correo;
      if (cambiaCorreo) {
        exigirCorreoDisponible();
        const [otro] = await db.query(
          'SELECT id FROM "Usuario" WHERE id<>$1 AND COALESCE("correoIndice",correo)=$2',
          [u.id, db.datos.correoIndice(datos.correo) ?? datos.correo],
          client,
        );
        if (otro)
          fail('Ese correo pertenece a otra cuenta.', 409, {
            correo: 'Ingresa otro correo.',
          });
      }
      await db.query(
        'UPDATE "Usuario" SET nombre=$2,celular=$3,"celularIndice"=$4,provincia=$5,"passwordHash"=$6 WHERE id=$1',
        [
          u.id,
          datos.nombre,
          db.datos.cifrar('celular', datos.celular),
          indiceCelular,
          provincia,
          claveNueva ? hashPassword(claveNueva) : u.passwordHash,
        ],
        client,
      );
      if (claveNueva) {
        for (const tabla of [
          'Sesion',
          'Recuperacion',
          'DosFactor',
          'ConfirmacionCorreo',
        ])
          await db.query(
            'DELETE FROM "' + tabla + '" WHERE "usuarioId"=$1',
            [u.id],
            client,
          );
      }
      await log(
        req,
        u,
        'Perfil actualizado',
        'Actualización por el titular',
        client,
        {
          objetivoId: u.id,
          datos: { cambiaCorreo, cambiaClave: Boolean(claveNueva) },
        },
      );
      return cambiaCorreo
        ? confirmacionCorreo.iniciarCambio(u.id, datos.correo, client)
        : null;
    });
    if (prueba) enviarConfirmacion(datos.correo, prueba);
    if (claveNueva) res.clearCookie('suma_session', { path: '/' });
    res.json({
      ok: true,
      requiereIngreso: Boolean(claveNueva),
      ...(prueba
        ? {
            confirmacion: {
              requiereConfirmacion: true,
              token: prueba.token,
              destino: mask(datos.correo),
              ...(devExpose() ? { devCodigo: prueba.codigo } : {}),
            },
          }
        : {}),
    });
  });
  route('patch', '/perfil/privacidad', async (req, res) => {
    const usuario = await current(req);
    const { visibilidad } = req.body;
    if (usuario.rol !== 'SOCIO')
      fail('Solo se publica un perfil de socio.', 403);
    if (!['PRIVADO', 'PUBLICO'].includes(visibilidad))
      fail('Selecciona Público o Privado.');
    await db.transaction(async (client) => {
      await db.query(
        'UPDATE "Usuario" SET visibilidad=$2 WHERE id=$1',
        [usuario.id, visibilidad],
        client,
      );
      await log(req, usuario, 'Privacidad actualizada', visibilidad, client, {
        objetivoId: usuario.id,
      });
    });
    res.json({ ok: true });
  });
  route('delete', '/perfil', async (req, res) => {
    const usuario = await current(req);
    if (usuario.rol !== 'SOCIO')
      fail('Solicita la baja de esta cuenta a administración.', 403);
    const clave = req.body.claveActual;
    if (typeof clave !== 'string' || clave.length > 128)
      fail('Escribe tu contraseña actual.');
    await db.transaction(async (client) => {
      const [actual] = await db.query(
        'SELECT "passwordHash",activo,rol FROM "Usuario" WHERE id=$1' + lock,
        [usuario.id],
        client,
      );
      if (
        !actual?.activo ||
        actual.rol !== 'SOCIO' ||
        !verifyPassword(clave, actual.passwordHash)
      )
        fail('No se pudo verificar tu cuenta con esa contraseña.', 400);
      await db.query(
        'UPDATE "Usuario" SET activo=$2 WHERE id=$1',
        [usuario.id, false],
        client,
      );
      for (const tabla of [
        'Sesion',
        'Recuperacion',
        'DosFactor',
        'ConfirmacionCorreo',
      ])
        await db.query(
          'DELETE FROM "' + tabla + '" WHERE "usuarioId"=$1',
          [usuario.id],
          client,
        );
      await log(
        req,
        usuario,
        'Cuenta dada de baja',
        'Baja lógica solicitada por el titular',
        client,
        { objetivoId: usuario.id },
      );
    });
    res.clearCookie('suma_session', { path: '/' }).json({ ok: true });
  });
}
