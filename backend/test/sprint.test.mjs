import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import { AcreditacionPuntos } from '../src/dominio/administracion.mjs';
import { CodigoVerificacion } from '../src/dominio/acceso.mjs';
import { ProteccionDatos } from '../src/dominio/proteccion-datos.mjs';
import { Database } from '../src/database.mjs';
import { createApi, diasHabiles } from '../src/api.mjs';
import { baseAislada } from './aislamiento-pg.mjs';

// Las suites nunca usan credenciales reales de correo heredadas de .env.
for (const clave of ['SMTP_SERVICE', 'SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_ACCESS_TOKEN'])
  delete process.env[clave];

const datosAlta = (datos) => ({
  provincia: 'Loja', ...datos, confirmacionClave: datos.clave, aceptaTerminos: true, versionAviso: '0.1',
});

async function registrarConfirmado(agent, datos) {
  const alta = await agent.post('/api/auth/register').send(datosAlta(datos));
  assert.equal(alta.status, 201, JSON.stringify(alta.body));
  const resultado = await agent.post('/api/auth/confirmar-correo').send({
    token: alta.body.token, codigo: alta.body.devCodigo,
  });
  assert.equal(resultado.status, 200, JSON.stringify(resultado.body));
  return alta;
}

void test('días hábiles: excluye fines de semana y feriados fijos de Ecuador', () => {
  assert.equal(diasHabiles('2026-11-06T10:00:00Z', new Date('2026-11-10T12:00:00Z')), 2);
  // 2 y 3 de noviembre son feriados nacionales.
  assert.equal(diasHabiles('2026-10-30T10:00:00Z', new Date('2026-11-04T12:00:00Z')), 1);
});

void test('Sprints 1 y 2: criterios de aceptación documentados', async (t) => {
  process.env.SEED_DEMO = 'true';
  process.env.NODE_ENV = 'test';
  process.env.ENABLE_DEV_RESET_LINK = 'true';
  const aislada = await baseAislada();
  const db = new Database(aislada.url, { esquema: aislada.esquema });
  const app = express();
  app.use('/api', (await createApi(db)).router);
  const admin = request.agent(app),
    socio = request.agent(app),
    gestor = request.agent(app),
    other = request.agent(app);
  const login = (agent, correo, clave = 'Suma2026!') =>
    agent.post('/api/auth/login').send({ correo, clave });
  const payload = {
    nombre: 'Ana Prueba',
    correo: 'ana@ejemplo.ec',
    celular: '0991234567',
    consentimiento: true,
  };
  let id;
  try {
    await t.test('RF-04-1 / RNF-06: credenciales, origen y segundo factor del administrador', async () => {
      assert.equal((await request(app).get('/api/usuarios')).status, 401);
      assert.equal((await login(socio, 'socio@suma.ec', 'incorrecta')).status, 401);
      assert.equal(
        (
          await request(app)
            .post('/api/auth/login')
            .set('Origin', 'https://externo.test')
            .send({ correo: 'admin@suma.ec', clave: 'Suma2026!' })
        ).status,
        403,
      );
      const first = await login(admin, 'admin@suma.ec');
      assert.equal(first.status, 200);
      assert.equal(first.body.requiere2fa, true);
      assert.equal(first.headers['set-cookie'], undefined, 'sin sesión antes del 2FA');
      assert.match(first.body.devCodigo, /^\d{6}$/);
      const wrong = first.body.devCodigo === '000000' ? '111111' : '000000';
      assert.equal(
        (await admin.post('/api/auth/2fa').send({ desafioId: first.body.desafioId, codigo: wrong }))
          .status,
        401,
      );
      const ok = await admin
        .post('/api/auth/2fa')
        .send({ desafioId: first.body.desafioId, codigo: first.body.devCodigo });
      assert.equal(ok.status, 200);
      assert.match(ok.headers['set-cookie'][0], /HttpOnly/);
      assert.equal(ok.body.rol, 'ADMIN');
      assert.ok(ok.body.modulos.includes('usuarios'));
      // El código es de un solo uso.
      assert.equal(
        (
          await request(app)
            .post('/api/auth/2fa')
            .send({ desafioId: first.body.desafioId, codigo: first.body.devCodigo })
        ).status,
        401,
      );
      const s = await login(socio, 'socio@suma.ec');
      assert.equal(s.status, 200);
      assert.deepEqual(s.body.modulos, [
        'panel', 'referidos', 'notificaciones', 'ayuda', 'comunidad', 'aprende', 'juegos', 'retos', 'recompensas',
      ]);
      // HU-002: el menú y la experiencia salen del rol guardado en la base.
      assert.equal(s.body.interfaz, 'COMUNIDAD');
      assert.equal(s.body.esAdmin, false);
      assert.deepEqual(s.body.menu.map((m) => m.id), s.body.modulos.slice().sort((a, b) => s.body.menu.findIndex((m) => m.id === a) - s.body.menu.findIndex((m) => m.id === b)));
      assert.equal((await login(gestor, 'gestor@suma.ec')).status, 200);
    });

    await t.test('RF-08-1 / RF-08-4: 3 roles y acceso denegado en servidor', async () => {
      for (const module of ['usuarios', 'roles', 'configuracion', 'actividad'])
        assert.equal((await socio.get('/api/' + module)).status, 403, module);
      assert.equal((await gestor.get('/api/referidos')).status, 403);
      assert.equal((await socio.get('/api/indicadores')).status, 403);
      const roles = (await admin.get('/api/roles')).body;
      assert.deepEqual(
        roles.map((r) => r.rol),
        ['ADMIN', 'GESTOR', 'SOCIO'],
      );
      assert.ok(!roles.find((r) => r.rol === 'GESTOR').disponibles.includes('usuarios'));
      const me = (await admin.get('/api/auth/me')).body;
      assert.equal(
        (await admin.patch('/api/usuarios/' + me.id).send({ rol: 'SOCIO', activo: true })).status,
        400,
      );
    });

    await t.test('HU-001: roles y permisos se crean, editan y eliminan sin tocar el código', async () => {
      const nuevo = { clave: 'ASESOR', nombre: 'Asesor comercial', descripcion: 'Atiende campañas', interfaz: 'COMUNIDAD' };
      assert.equal((await socio.post('/api/roles').send(nuevo)).status, 403);
      assert.equal((await admin.post('/api/roles').send({ ...nuevo, clave: 'mal clave' })).status, 400);
      const creado = await admin.post('/api/roles').send({ ...nuevo, modulos: ['panel', 'ayuda', 'juegos'] });
      assert.equal(creado.status, 201, JSON.stringify(creado.body));
      assert.equal(creado.body.alcanceGlobal, false);
      assert.equal((await admin.post('/api/roles').send(nuevo)).status, 409);
      // Un rol nuevo no puede recibir módulos de administración.
      assert.equal((await admin.put('/api/roles/ASESOR').send({ modulos: ['panel', 'ayuda', 'usuarios'] })).status, 400);
      assert.equal((await admin.put('/api/roles/ASESOR').send({ modulos: ['panel', 'ayuda', 'juegos', 'retos'] })).status, 200);
      const roles = (await admin.get('/api/roles')).body;
      assert.deepEqual(roles.find((r) => r.rol === 'ASESOR').modulos, ['panel', 'ayuda', 'juegos', 'retos']);
      assert.ok((await admin.get('/api/modulos')).body.some((m) => m.id === 'reportes'));
      // Se asigna a una persona y su menú refleja el rol al entrar (HU-002).
      const alta = await admin.post('/api/usuarios').send({ nombre: 'Rosa Asesora', correo: 'rosa@suma.ec', rol: 'ASESOR' });
      assert.equal(alta.status, 201, JSON.stringify(alta.body));
      const reset = await request(app)
        .post('/api/auth/reset')
        .send({ token: new URL(alta.body.devResetUrl).searchParams.get('token'), clave: 'Suma2026!' });
      assert.equal(reset.status, 200);
      const rosa = request.agent(app);
      const entrada = await login(rosa, 'rosa@suma.ec');
      assert.equal(entrada.status, 200);
      assert.deepEqual(entrada.body.menu.map((m) => m.id), ['panel', 'juegos', 'retos', 'ayuda'].filter((id) => entrada.body.modulos.includes(id)));
      assert.equal((await rosa.get('/api/usuarios')).status, 403);
      assert.equal((await rosa.get('/api/referidos')).status, 403);
      // En uso, no se elimina; los roles del sistema tampoco.
      assert.equal((await admin.delete('/api/roles/ASESOR')).status, 409);
      assert.equal((await admin.delete('/api/roles/SOCIO')).status, 409);
      const rosaId = alta.body.id;
      assert.equal((await admin.patch('/api/usuarios/' + rosaId).send({ rol: 'GESTOR', activo: true })).status, 200);
      assert.equal((await admin.delete('/api/roles/ASESOR')).status, 200);
      assert.equal((await admin.patch('/api/usuarios/' + rosaId).send({ rol: 'ASESOR', activo: true })).status, 400);
    });

    await t.test('RF-08-2: solo el administrador crea cuentas de Gestor o Administrador', async () => {
      const body = { nombre: 'Nueva Gestora', correo: 'gestora@suma.ec', rol: 'GESTOR' };
      assert.equal((await socio.post('/api/usuarios').send(body)).status, 403);
      const created = await admin.post('/api/usuarios').send(body);
      assert.equal(created.status, 201);
      assert.equal(created.body.rol, 'GESTOR');
      assert.match(created.body.devResetUrl, /\/recuperar-contrasena\?token=/);
      assert.equal((await admin.post('/api/usuarios').send({ ...body, rol: 'JEFE' })).status, 400);
    });

    await t.test('RF-11 / RNF-12: valida, rechaza código y pagina de 10 para socio o 20 para administración', async () => {
      assert.equal(
        (await socio.post('/api/referidos').send({ ...payload, celular: '123' })).body.campos
          .celular !== undefined,
        true,
      );
      assert.equal(
        (await socio.post('/api/referidos').send({ ...payload, consentimiento: false })).status,
        400,
      );
      assert.equal(
        (await socio.post('/api/referidos').send({ ...payload, notas: '<script>x</script>' })).status,
        400,
      );
      const created = await socio.post('/api/referidos').send(payload);
      assert.equal(created.status, 201);
      id = created.body.id;
      assert.equal((await socio.post('/api/referidos').send(payload)).status, 409);
      const list = (await socio.get('/api/referidos')).body;
      assert.equal(list.porPagina, 10);
      assert.deepEqual(Object.keys(list.items.find((x) => x.id === id)).sort(), ['creadoEn', 'estado', 'id', 'nombre']);
      assert.equal(list.items.find((x) => x.id === id).nombre, 'Ana');
      assert.equal((await admin.get('/api/referidos?porPagina=-1')).body.porPagina, 20);
      assert.ok(list.items.some((x) => x.id === id));
      assert.equal(typeof list.porEstado.PENDIENTE, 'number');
      const old = (await admin.get('/api/referidos?buscar=carlos')).body.items[0];
      assert.ok(old.diasHabilesPendiente > 2, 'resalta pendientes con más de 2 días hábiles');
      assert.equal(
        (await admin.get('/api/referidos?estado=APROBADO')).body.items.every(
          (x) => x.estado === 'APROBADO',
        ),
        true,
      );
      assert.equal((await admin.get('/api/referidos?estado=VALIDADO')).status, 400);
    });

    await t.test('RF-11-4: dictamen reservado a administración y con cuenta vinculada aprobada', async () => {
      assert.equal(
        (
          await registrarConfirmado(other, {
            nombre: 'Otro Socio',
            correo: 'otro@ejemplo.ec',
            celular: '0995555555',
            clave: 'Nueva2026!',
          })
        ).status,
        201,
      );
      assert.equal(
        (
          await request(app).post('/api/auth/register').send(datosAlta({
            nombre: 'Cuenta Corta',
            correo: 'corta@ejemplo.ec',
            celular: '0995555556',
            clave: 'Nueva2026!',
            cuenta: '12345678',
            tipoCuenta: 'ahorros',
          }))
        ).status,
        400,
        'la cuenta vinculada exige 10 dígitos',
      );
      await login(other, 'otro@ejemplo.ec', 'Nueva2026!');
      assert.equal((await other.get('/api/referidos')).body.total, 0);
      assert.equal((await other.post('/api/referidos').send(payload)).status, 403);
      assert.equal((await other.patch('/api/referidos/' + id).send(payload)).status, 404);
      assert.equal(
        (await socio.patch(`/api/referidos/${id}/dictamen`).send({ estado: 'APROBADO' })).status,
        403,
      );
      assert.equal(
        (await admin.patch(`/api/referidos/${id}/dictamen`).send({ estado: 'APROBADO' })).status,
        409,
      );
      await db.query(
        'INSERT INTO "Usuario" (nombre,correo,rol,"cuentaEstado") VALUES ($1,$2,$3,$4)',
        ['Ana Prueba', payload.correo, 'SOCIO', 'APROBADA'],
      );
      assert.equal(
        (await admin.patch(`/api/referidos/${id}/dictamen`).send({ estado: 'APROBADO' })).status,
        200,
      );
      assert.equal(
        (await admin.patch(`/api/referidos/${id}/dictamen`).send({ estado: 'RECHAZADO' })).status,
        409,
        'solo se dictaminan pendientes',
      );
      assert.equal((await socio.patch('/api/referidos/' + id).send(payload)).status, 403);
      assert.ok(
        (await socio.get('/api/notificaciones')).body.some(
          (x) => x.titulo === 'Tu referido tiene novedades',
        ),
      );
      assert.equal((await socio.patch('/api/notificaciones/leer').send({})).status, 200);
    });

    await t.test('RF-11-6: baja lógica que conserva el historial', async () => {
      const created = await socio
        .post('/api/referidos')
        .send({ ...payload, correo: 'baja@ejemplo.ec' });
      assert.equal(
        (await socio.patch(`/api/referidos/${created.body.id}/baja`).send({ motivo: '' })).status,
        400,
      );
      assert.equal(
        (
          await socio
            .patch(`/api/referidos/${created.body.id}/baja`)
            .send({ motivo: 'Datos duplicados' })
        ).status,
        200,
      );
      assert.ok(!(await socio.get('/api/referidos')).body.items.some((x) => x.id === created.body.id));
      const [row] = await db.query('SELECT * FROM "Referido" WHERE id=$1', [created.body.id]);
      assert.ok(row.eliminadoEn);
      assert.equal(row.motivoBaja, 'Datos duplicados');
      assert.equal(
        (await socio.post('/api/referidos').send({ ...payload, correo: 'baja@ejemplo.ec' })).status,
        201,
        'el correo vuelve a estar disponible',
      );
      assert.equal(
        (await socio.patch(`/api/referidos/${id}/baja`).send({ motivo: 'Ya aprobado' })).status,
        403,
      );
    });

    await t.test('RF-11-5: asociación manual dentro de 30 días', async () => {
      const options = (await admin.get('/api/referidos/asociables')).body;
      const target = options.usuarios.find((u) => u.correo === 'otro@ejemplo.ec');
      const sponsor = options.socios.find((u) => u.correo === 'socio@suma.ec');
      assert.ok(target && sponsor);
      assert.equal(
        (await admin.post('/api/referidos/asociar').send({ usuarioId: target.id, socioId: target.id }))
          .status,
        400,
      );
      assert.equal(
        (await admin.post('/api/referidos/asociar').send({ usuarioId: target.id, socioId: sponsor.id }))
          .status,
        201,
      );
    });

    await t.test('RF-08: permisos por rol se aplican de inmediato', async () => {
      assert.equal(
        (await admin.put('/api/roles/SOCIO').send({ modulos: ['panel', 'ayuda', 'notificaciones'] }))
          .status,
        200,
      );
      assert.equal((await socio.get('/api/referidos')).status, 403);
      assert.equal(
        (await admin.put('/api/roles/SOCIO').send({ modulos: ['panel', 'ayuda', 'usuarios'] })).status,
        400,
      );
      await admin
        .put('/api/roles/SOCIO')
        .send({ modulos: ['panel', 'ayuda', 'referidos', 'notificaciones'] });
    });

    await t.test('RF-14 / RF-14-2 / RF-42: configuración y bitácora completa', async () => {
      const config = (await admin.get('/api/configuracion')).body;
      const decimal = await admin
        .put('/api/configuracion')
        .send({ ...config, puntosReferido: '10.5' });
      assert.equal(decimal.status, 400);
      assert.ok(decimal.body.campos.puntosReferido);
      assert.equal(
        (await admin.put('/api/configuracion').send({ ...config, mensajeBienvenida: 'x'.repeat(501) }))
          .status,
        400,
      );
      assert.equal(
        (
          await admin
            .put('/api/configuracion')
            .send({ ...config, puntosReferido: '150', registroAbierto: 'false' })
        ).status,
        200,
      );
      assert.equal((await socio.get('/api/overview')).body.puntos, 100);
      assert.equal((await request(app).post('/api/auth/register').send({})).status, 403);
      const log = (await admin.get('/api/actividad?accion=Parámetro actualizado')).body;
      assert.equal(log.porPagina, 50);
      const change = log.items.find((x) => x.detalle === 'puntosReferido');
      assert.deepEqual(change.datos, { parametro: 'puntosReferido', anterior: '100', nuevo: '150' });
      assert.ok(change.ip, 'RF-42-1 guarda la IP');
      const roleLog = (await admin.get('/api/actividad?accion=Cuenta creada')).body.items[0];
      assert.equal(roleLog.datos.rolNuevo, 'GESTOR');
      assert.ok(roleLog.objetivoId);
      const today = new Date(Date.now() - 5 * 3_600_000).toISOString().slice(0, 10);
      assert.ok((await admin.get(`/api/actividad?desde=${today}&hasta=${today}`)).body.total > 0);
      assert.equal((await admin.get('/api/actividad?desde=ayer')).status, 400);
      await assert.rejects(() => db.query('DELETE FROM "Actividad"'), /inmutable/);
      await assert.rejects(() => db.query('UPDATE "Actividad" SET accion=$1', ['x']), /inmutable/);
      await admin.put('/api/configuracion').send(config);
    });

    await t.test('RF-45-1: tablero con 6 indicadores', async () => {
      const data = (await admin.get('/api/indicadores')).body;
      const [usuarios] = await db.query('SELECT COUNT(*) AS total FROM "Usuario"');
      assert.equal(data.usuariosRegistrados, Number(usuarios.total));
      assert.equal(data.indicadores.length, 6);
      assert.ok(data.indicadores.find((x) => x.id === 'activos').valor >= 2);
      assert.equal(data.indicadores.find((x) => x.id === 'canjeados').valor, 0);
    });

    await t.test('RF-11: vinculación, código, registro asociado y exportación privada', async () => {
      const titular = {
        nombre: 'Socio Verificado', correo: 'verificado@ejemplo.ec', celular: '0990000033',
        clave: 'Valida2026!', cuenta: '2100123456', tipoCuenta: 'ahorros',
      };
      await registrarConfirmado(request(app), titular);
      assert.equal((await request(app).post('/api/auth/register').send(datosAlta({
        ...titular, correo: 'otra-cuenta@ejemplo.ec', celular: '0990000077',
      }))).status, 409);
      const nuevoSocio = request.agent(app);
      await login(nuevoSocio, titular.correo, titular.clave);
      assert.equal((await nuevoSocio.post('/api/referidos/mi-codigo').send({})).status, 403);
      const pendientes = await admin.get('/api/usuarios/cuentas-pendientes');
      const vinculacion = pendientes.body.items.find((x) => x.nombre === titular.nombre);
      assert.equal(vinculacion.numero, '******3456');
      assert.equal((await admin.patch('/api/usuarios/' + vinculacion.id + '/cuenta').send({ estado: 'APROBADO' })).status, 200);
      const [asignado] = await db.query('SELECT "codigoReferido" FROM "Usuario" WHERE id=$1', [vinculacion.id]);
      assert.match(asignado.codigoReferido, /^[A-Z0-9]{8}$/);
      const invitacion = await nuevoSocio.post('/api/referidos/mi-codigo').send({});
      assert.equal(invitacion.body.codigo, asignado.codigoReferido);
      assert.equal((await nuevoSocio.get('/api/auth/cuenta')).body.numero, '******3456');
      assert.equal((await nuevoSocio.get('/api/auth/cuenta?mostrar=1')).body.numero, titular.cuenta);
      assert.equal(invitacion.status, 200);
      const repetida = await nuevoSocio.post('/api/referidos/mi-codigo').send({});
      assert.equal(repetida.body.codigo, invitacion.body.codigo);
      assert.match(invitacion.body.codigo, /^[A-Z0-9]{8}$/);
      assert.equal(new URL(invitacion.body.enlace).searchParams.get('ref'), invitacion.body.codigo);
      assert.match(invitacion.body.qr, /^data:image\/png;base64,/);
      const registro = { nombre: 'Invitada Nueva', correo: 'invitada@ejemplo.ec', celular: '0990000034', clave: 'Valida2026!' };
      assert.equal((await request(app).post('/api/auth/register').send(datosAlta({ ...registro, codigoReferido: 'INVALIDO' }))).status, 400);
      await registrarConfirmado(request(app), { ...registro, codigoReferido: invitacion.body.codigo });
      const consulta = await nuevoSocio.get('/api/referidos');
      assert.equal(consulta.body.items[0].nombre, 'Invitada');
      assert.equal(consulta.body.items[0].estado, 'PENDIENTE');
      assert.equal((await nuevoSocio.get('/api/referidos/exportar')).status, 403);
      const descarga = await admin.get('/api/referidos/exportar');
      assert.match(descarga.headers['content-type'], /^text\/csv/);
      assert.match(descarga.text, /invitada@ejemplo.ec/);
      assert.doesNotMatch(descarga.text, /luis@ejemplo.ec/);
      assert.equal((await admin.get('/api/referidos?desde=2026-02-30')).status, 400);
      assert.equal((await nuevoSocio.post('/api/auth/cuenta').send({ cuenta: '2111122222', tipoCuenta: 'ahorros' })).status, 409);
      const invitada = request.agent(app);
      await login(invitada, registro.correo, registro.clave);
      assert.equal((await invitada.post('/api/auth/cuenta').send({ cuenta: '2111122222', tipoCuenta: 'corriente' })).status, 201);
      const revision = (await admin.get('/api/usuarios/cuentas-pendientes')).body.items
        .find((x) => x.nombre === registro.nombre);
      assert.equal((await admin.patch('/api/usuarios/' + revision.id + '/cuenta').send({ estado: 'APROBADO' })).status, 200);
      const dictamen = () => admin.patch('/api/referidos/' + consulta.body.items[0].id + '/dictamen').send({ estado: 'APROBADO' });
      const decisiones = await Promise.all([dictamen(), dictamen()]);
      assert.deepEqual(decisiones.map((x) => x.status).sort(), [200, 409]);
      const movimientos = await db.query('SELECT cantidad,"usuarioId" FROM "MovimientoPuntos" WHERE "referidoId"=$1', [consulta.body.items[0].id]);
      assert.deepEqual(movimientos.map((m) => m.cantidad), [100, 100]);
      assert.equal(new Set(movimientos.map((m) => m.usuarioId)).size, 2);
      assert.equal((await invitada.get('/api/overview')).body.puntos, 100);
      const avisos = (await invitada.get('/api/notificaciones/bandeja')).body.items;
      assert.ok(avisos.some((x) => x.mensaje === 'Ganaste 100 puntos.'));
      const config = (await admin.get('/api/configuracion')).body;
      assert.equal((await admin.put('/api/configuracion').send({ ...config, puntosReferido: '500', valorPunto: '0.25' })).status, 200);
      assert.equal((await nuevoSocio.get('/api/overview')).body.puntos, 100);
      await admin.put('/api/configuracion').send(config);
    });

    await t.test('HU-013 / HU-014: consentimiento, unicidad, confirmación, vencimiento y reenvíos', async () => {
      const datos = { nombre: 'Eva Prueba', correo: 'eva-s2@ejemplo.ec', celular: '0990000098', clave: 'Validar2026!' };
      const usuario = request.agent(app);
      const alta = (payload) => usuario.post('/api/auth/register').send(payload);
      assert.equal((await alta({ ...datosAlta(datos), aceptaTerminos: false })).status, 400);
      assert.equal((await alta({ ...datosAlta(datos), confirmacionClave: 'distinta' })).status, 400);
      const inicio = await alta(datosAlta(datos));
      assert.equal(inicio.status, 201, JSON.stringify(inicio.body));
      assert.match(inicio.body.devCodigo, /^\d{6}$/);
      const duplicado = await alta(datosAlta({ ...datos, correo: 'otro-s2@ejemplo.ec' }));
      assert.equal(duplicado.status, 409);
      assert.ok(duplicado.body.campos.celular);
      const [aceptacion] = await db.query('SELECT a.version,a.fecha FROM "AceptacionTerminos" a JOIN "Usuario" u ON u.id=a."usuarioId" WHERE u.correo=$1', [datos.correo]);
      assert.equal(aceptacion.version, '0.1');
      assert.ok(aceptacion.fecha);
      const pendiente = await login(usuario, datos.correo, datos.clave);
      assert.equal(pendiente.body.requiereConfirmacion, true);
      assert.equal(pendiente.headers['set-cookie'], undefined);
      assert.equal((await usuario.get('/api/auth/me')).status, 401);
      const token = pendiente.body.token;
      await db.query('UPDATE "ConfirmacionCorreo" SET vence=$2 WHERE token=$1', [
        CodigoVerificacion.huella(token), new Date(Date.now() - 1000).toISOString(),
      ]);
      const confirmar = (codigo) => usuario.post('/api/auth/confirmar-correo').send({ token, codigo });
      assert.equal((await confirmar(inicio.body.devCodigo)).status, 400);
      let codigo;
      for (let i = 0; i < 3; i++) {
        const reenvio = await usuario.post('/api/auth/reenviar-confirmacion').send({ token });
        assert.equal(reenvio.status, 200);
        codigo = reenvio.body.devCodigo;
      }
      assert.equal((await usuario.post('/api/auth/reenviar-confirmacion').send({ token })).status, 429);
      const consumos = await Promise.all([confirmar(codigo), confirmar(codigo)]);
      assert.deepEqual(consumos.map((x) => x.status).sort(), [200, 400]);
      assert.ok((await login(usuario, datos.correo, datos.clave)).headers['set-cookie']);
    });

    await t.test('HU-022: acreditar una actividad interna es idempotente y usa su parámetro', async () => {
      const [usuario] = await db.query('SELECT id FROM "Usuario" WHERE correo=$1', ['eva-s2@ejemplo.ec']);
      await db.query('UPDATE "Configuracion" SET valor=$2 WHERE clave=$1', ['puntosTrivia', '27']);
      const avisos = [];
      const servicio = new AcreditacionPuntos(db, (...args) => avisos.push(args));
      const fecha = new Date().toISOString();
      const acreditar = () => db.transaction((client) => servicio.registrar('TRIVIA', 1, [usuario.id], fecha, client));
      await Promise.all([acreditar(), acreditar()]);
      const filas = await db.query('SELECT actividad,cantidad,"referidoId" FROM "MovimientoPuntos" WHERE "usuarioId"=$1', [usuario.id]);
      assert.equal(filas.length, 1);
      assert.equal(filas[0].cantidad, 27);
      assert.equal(filas[0].actividad, 'TRIVIA');
      assert.equal(filas[0].referidoId, null);
      assert.equal(avisos.length, 1);
      assert.equal(avisos[0][2], 'Ganaste 27 puntos.');
    });

    await t.test('RF-39: las notificaciones se leen por destinatario sin renovar la sesión al consultar', async () => {
      const bandeja = await socio.get('/api/notificaciones/bandeja');
      assert.equal(bandeja.body.porPagina, 20);
      assert.ok(bandeja.body.sinLeer > 0);
      const id = bandeja.body.items.find((x) => !x.leida).id;
      assert.equal((await gestor.patch('/api/notificaciones/' + id + '/leer').send({})).status, 404);
      assert.equal((await socio.patch('/api/notificaciones/' + id + '/leer').send({})).status, 200);
      const [usuario] = await db.query('SELECT id FROM "Usuario" WHERE correo=$1', ['socio@suma.ec']);
      const [antes] = await db.query('SELECT expira FROM "Sesion" WHERE "usuarioId"=$1', [usuario.id]);
      const actual = await socio.get('/api/notificaciones/bandeja');
      assert.equal(actual.body.sinLeer, bandeja.body.sinLeer - 1);
      const [despues] = await db.query('SELECT expira FROM "Sesion" WHERE "usuarioId"=$1', [usuario.id]);
      assert.equal(despues.expira, antes.expira);
    });

    await t.test('HU-015 / HU-016 / RF-06: vinculación, cola de revisión, rechazo y nuevo intento', async () => {
      const prospecto = {
        nombre: 'Pedro Prospecto', correo: 'prospecto@ejemplo.ec', celular: '0990000055', clave: 'Valida2026!',
      };
      await registrarConfirmado(request(app), prospecto);
      const agente = request.agent(app);
      assert.equal((await login(agente, prospecto.correo, prospecto.clave)).status, 200);
      // RF-06-1: sin cuenta vinculada Aprobada no puede referir.
      const intento = await agente
        .post('/api/referidos')
        .send({ ...payload, correo: 'amiga-prospecto@ejemplo.ec', celular: '0990000056' });
      assert.equal(intento.status, 403);
      // RF-05-1: 1 de 2 tipos y exactamente 10 dígitos.
      assert.equal((await agente.post('/api/auth/cuenta').send({ cuenta: '12345', tipoCuenta: 'ahorros' })).status, 400);
      assert.equal((await agente.post('/api/auth/cuenta').send({ cuenta: '2200000055', tipoCuenta: 'plazo' })).status, 400);
      assert.equal((await agente.post('/api/auth/cuenta').send({ cuenta: '2200000055', tipoCuenta: 'corriente' })).status, 201);
      // Mientras está Pendiente no se presenta otra solicitud.
      assert.equal((await agente.post('/api/auth/cuenta').send({ cuenta: '2200000066', tipoCuenta: 'ahorros' })).status, 409);
      // Un rol sin experiencia Comunidad (Gestor) no vincula cuentas.
      assert.equal((await gestor.post('/api/auth/cuenta').send({ cuenta: '2200000077', tipoCuenta: 'ahorros' })).status, 403);
      // RF-05-3: 20 por página, de la más antigua a la más reciente, con días hábiles para resaltar.
      const cola = (await admin.get('/api/usuarios/cuentas-pendientes')).body;
      assert.equal(cola.porPagina, 20);
      const fechas = cola.items.map((x) => Date.parse(x.fecha));
      assert.deepEqual(fechas, [...fechas].sort((a, b) => a - b));
      const mia = cola.items.find((x) => x.nombre === prospecto.nombre);
      assert.equal(mia.numero, '******0055');
      assert.equal(typeof mia.diasHabiles, 'number');
      assert.equal((await socio.get('/api/usuarios/cuentas-pendientes')).status, 403);
      // RF-05-4 / RF-39: solo Aprobado o Rechazado, y el titular recibe el aviso.
      assert.equal((await admin.patch('/api/usuarios/' + mia.id + '/cuenta').send({ estado: 'VALIDADO' })).status, 400);
      assert.equal(
        (await admin.patch('/api/usuarios/' + mia.id + '/cuenta').send({ estado: 'RECHAZADO', motivo: 'El número no coincide con el titular' })).status,
        200,
      );
      assert.ok((await agente.get('/api/notificaciones')).body.some((x) => x.titulo === 'Revisión de tu cuenta vinculada'));
      // RF-05-6: tras un rechazo puede ingresar otra cuenta.
      assert.equal((await agente.post('/api/auth/cuenta').send({ cuenta: '2200000088', tipoCuenta: 'ahorros' })).status, 201);
    });

    await t.test('RF-07: recuperación de un solo uso que revoca sesiones', async () => {
      const expired = 'a'.repeat(64);
      const { createHash } = await import('node:crypto');
      const [user] = await db.query('SELECT id FROM "Usuario" WHERE correo=$1', ['otro@ejemplo.ec']);
      await db.query('INSERT INTO "Recuperacion" (token,"usuarioId",expira) VALUES ($1,$2,$3)', [
        createHash('sha256').update(expired).digest('hex'),
        user.id,
        '2000-01-01T00:00:00.000Z',
      ]);
      assert.equal(
        (await other.post('/api/auth/reset').send({ token: expired, clave: 'Otra2026!' })).status,
        400,
      );
      const forgot = await other.post('/api/auth/forgot').send({ correo: 'otro@ejemplo.ec' });
      assert.match(forgot.body.devResetUrl, /\/recuperar-contrasena\?token=/);
      const resetToken = new URL(forgot.body.devResetUrl).searchParams.get('token');
      assert.equal(
        (await other.post('/api/auth/reset').send({ token: resetToken, clave: 'Otra2026!' })).status,
        200,
      );
      assert.equal((await other.get('/api/auth/me')).status, 401);
      assert.equal(
        (await other.post('/api/auth/reset').send({ token: resetToken, clave: 'Otra2026!' })).status,
        400,
      );
      assert.equal((await login(other, 'otro@ejemplo.ec', 'Otra2026!')).status, 200);
    });

    await t.test('RF-04-3: la sesión se renueva con cada acción y vence tras 15 min sin acciones', async () => {
      const [before] = await db.query(
        'SELECT s.expira FROM "Sesion" s JOIN "Usuario" u ON u.id=s."usuarioId" WHERE u.correo=$1',
        ['otro@ejemplo.ec'],
      );
      assert.ok(new Date(before.expira) - Date.now() <= 15 * 60_000 + 1000);
      assert.equal((await other.get('/api/auth/me')).status, 200);
      const [user] = await db.query('SELECT id FROM "Usuario" WHERE correo=$1', ['otro@ejemplo.ec']);
      await db.query('UPDATE "Sesion" SET expira=$2 WHERE "usuarioId"=$1', [
        user.id,
        new Date(Date.now() - 1000).toISOString(),
      ]);
      assert.equal((await other.get('/api/auth/me')).status, 401);
    });

    await t.test('RF-04-2: bloqueo de 15 minutos tras 5 intentos fallidos consecutivos', async () => {
      for (let i = 1; i <= 4; i++)
        assert.equal((await login(other, 'otro@ejemplo.ec', 'Mala2026!')).status, 401, `intento ${i}`);
      const blocked = await login(other, 'otro@ejemplo.ec', 'Mala2026!');
      assert.equal(blocked.status, 423);
      assert.ok(blocked.body.bloqueadoHasta);
      assert.equal((await login(other, 'otro@ejemplo.ec', 'Otra2026!')).status, 423);
      await db.query('UPDATE "Usuario" SET "bloqueadoHasta"=NULL WHERE correo=$1', ['otro@ejemplo.ec']);
      assert.equal((await login(other, 'otro@ejemplo.ec', 'Otra2026!')).status, 200);
    });

    await t.test('RF-04-4: desactivar cuenta y cerrar sesión', async () => {
      const [user] = await db.query('SELECT id FROM "Usuario" WHERE correo=$1', ['otro@ejemplo.ec']);
      assert.equal(
        (await admin.patch('/api/usuarios/' + user.id).send({ rol: 'SOCIO', activo: false })).status,
        200,
      );
      assert.equal((await other.get('/api/auth/me')).status, 401);
      assert.equal((await socio.post('/api/auth/logout').send({})).status, 200);
      assert.equal((await socio.get('/api/auth/me')).status, 401);
    });

    await t.test('producción nunca expone enlaces ni códigos', async () => {
      process.env.NODE_ENV = 'production';
      const response = await request(app).post('/api/auth/forgot').send({ correo: 'admin@suma.ec' });
      assert.equal(response.status, 200);
      assert.equal(response.body.devResetUrl, undefined);
      const code = await request(app)
        .post('/api/auth/login')
        .send({ correo: 'admin@suma.ec', clave: 'Suma2026!' });
      assert.equal(code.body.devCodigo, undefined);
      process.env.NODE_ENV = 'test';
    });
  } finally {
    await db.close();
    await aislada.limpiar();
  }
});

void test('RNF-05: migra datos personales y conserva acceso y unicidad por correo', async () => {
  const aislada = await baseAislada();
  const url = aislada.url;
  const abrir = () => new Database(url, { esquema: aislada.esquema });
  const claveOriginal = process.env.SUMA_DATA_KEY;
  const semillaOriginal = process.env.SEED_DEMO;
  let db;
  try {
    delete process.env.SUMA_DATA_KEY;
    process.env.SEED_DEMO = 'false';
    db = abrir();
    await db.init();
    const appLegacy = express();
    appLegacy.use('/api', (await createApi(db)).router);
    const usuario = { nombre: 'Cuenta Antigua', correo: 'antigua@ejemplo.ec', celular: '0990000444',
      clave: 'Valida2026!', tipoCuenta: 'corriente', cuenta: '2255667788' };
    await registrarConfirmado(request(appLegacy), usuario);
    await db.close();

    process.env.SUMA_DATA_KEY = '2a'.repeat(32);
    db = abrir();
    const app = express();
    app.use('/api', (await createApi(db)).router);
    const [guardado] = await db.queryRaw('SELECT correo,celular,cuenta,"correoIndice" FROM "Usuario"');
    for (const campo of ['correo', 'celular', 'cuenta']) {
      assert.match(guardado[campo], /^aes:v1:/);
      assert.ok(!guardado[campo].includes(usuario[campo]));
    }
    assert.match(guardado.correoIndice, /^[0-9a-f]{64}$/);
    const login = await request(app).post('/api/auth/login').send({ correo: usuario.correo, clave: usuario.clave });
    assert.equal(login.status, 200);
    assert.equal(login.body.correo, usuario.correo);
    assert.equal(login.body.correoIndice, undefined);
    assert.equal((await request(app).post('/api/auth/register').send(datosAlta({ ...usuario, cuenta: undefined }))).status, 409);
    await db.close();

    process.env.SUMA_DATA_KEY = '7b'.repeat(32);
    db = abrir();
    await assert.rejects(db.init(), /no coincide/);
  } finally {
    await db?.close();
    if (claveOriginal === undefined) delete process.env.SUMA_DATA_KEY;
    else process.env.SUMA_DATA_KEY = claveOriginal;
    if (semillaOriginal === undefined) delete process.env.SEED_DEMO;
    else process.env.SEED_DEMO = semillaOriginal;
    await aislada.limpiar();
  }
});

void test('Correcciones del Sprint 2: provincia, aviso RF-47-4, plazos y bitácora', async (t) => {
  process.env.SEED_DEMO = 'true';
  process.env.NODE_ENV = 'test';
  process.env.ENABLE_DEV_RESET_LINK = 'true';
  const aislada = await baseAislada();
  const db = new Database(aislada.url, { esquema: aislada.esquema });
  const app = express();
  app.use('/api', (await createApi(db)).router);
  const admin = request.agent(app),
    socio = request.agent(app);
  const primero = await admin.post('/api/auth/login').send({ correo: 'admin@suma.ec', clave: 'Suma2026!' });
  assert.equal((await admin.post('/api/auth/2fa').send({ desafioId: primero.body.desafioId, codigo: primero.body.devCodigo })).status, 200);
  assert.equal((await socio.post('/api/auth/login').send({ correo: 'socio@suma.ec', clave: 'Suma2026!' })).status, 200);
  try {
    await t.test('T-01: la provincia es obligatoria en el registro y la hereda el referido', async () => {
      const base = { nombre: 'Persona Provincia', correo: 'provincia@ejemplo.ec', celular: '0990000901', clave: 'Valida2026!' };
      const sinProvincia = await request(app).post('/api/auth/register').send({ ...datosAlta(base), provincia: undefined });
      assert.equal(sinProvincia.status, 400);
      assert.ok(sinProvincia.body.campos.provincia);
      assert.equal((await request(app).post('/api/auth/register').send(datosAlta({ ...base, provincia: 'Atlántida' }))).status, 400);
      assert.equal((await request(app).get('/api/auth/provincias')).body.length, 24);
      await registrarConfirmado(request(app), { ...base, provincia: 'Zamora Chinchipe' });
      const [fila] = await db.query('SELECT provincia FROM "Usuario" WHERE nombre=$1', [base.nombre]);
      assert.equal(fila.provincia, 'Zamora Chinchipe');
      const { codigo } = (await socio.post('/api/referidos/mi-codigo').send({})).body;
      await registrarConfirmado(request(app), {
        nombre: 'Invitado Oro', correo: 'oro@ejemplo.ec', celular: '0990000902', clave: 'Valida2026!',
        provincia: 'El Oro', codigoReferido: codigo,
      });
      const filtrados = (await admin.get('/api/referidos?provincia=' + encodeURIComponent('El Oro'))).body;
      assert.ok(filtrados.items.some((r) => r.nombre === 'Invitado Oro'));
      assert.ok(filtrados.filtros.provincias.includes('El Oro'));
    });

    await t.test('HU-019 / CA-13: el registro con código enlaza el referido cargado a mano, sin duplicarlo', async () => {
      const persona = { nombre: 'Cargada Mano', correo: 'cargada@ejemplo.ec', celular: '0990000906' };
      assert.equal((await socio.post('/api/referidos').send({ ...persona, consentimiento: true })).status, 201);
      const { codigo } = (await socio.post('/api/referidos/mi-codigo').send({})).body;
      await registrarConfirmado(request(app), { ...persona, clave: 'Valida2026!', codigoReferido: codigo });
      const filas = await db.query('SELECT "usuarioId" FROM "Referido" WHERE nombre=$1 AND "eliminadoEn" IS NULL', [persona.nombre]);
      assert.equal(filas.length, 1);
      assert.ok(filas[0].usuarioId);
    });

    await t.test('RF-42: el dictamen deja en la bitácora el estado anterior y el nuevo', async () => {
      const [ref] = await db.query('SELECT id FROM "Referido" WHERE nombre=$1', ['Invitado Oro']);
      assert.equal((await admin.patch('/api/referidos/' + ref.id + '/dictamen').send({ estado: 'RECHAZADO' })).status, 200);
      const [fila] = await db.query('SELECT datos FROM "Actividad" WHERE accion=$1 AND "objetivoId"=$2', ['Dictamen de referido', ref.id]);
      assert.deepEqual(JSON.parse(fila.datos), { anterior: 'PENDIENTE', nuevo: 'RECHAZADO' });
    });

    await t.test('RF-11-5: no se asocia a quien se registró hace más de 30 días', async () => {
      await registrarConfirmado(request(app), { nombre: 'Registro Antiguo', correo: 'antiguo@ejemplo.ec', celular: '0990000903', clave: 'Valida2026!' });
      const [usuario] = await db.query('SELECT id FROM "Usuario" WHERE nombre=$1', ['Registro Antiguo']);
      await db.query('UPDATE "Usuario" SET "creadoEn"=$2 WHERE id=$1', [usuario.id, new Date(Date.now() - 31 * 86_400_000)]);
      const opciones = (await admin.get('/api/referidos/asociables')).body;
      assert.ok(!opciones.usuarios.some((u) => u.id === usuario.id));
      const patrocinador = opciones.socios.find((s) => s.correo === 'socio@suma.ec');
      const intento = await admin.post('/api/referidos/asociar').send({ usuarioId: usuario.id, socioId: patrocinador.id });
      assert.equal(intento.status, 409);
    });

    await t.test('RF-47-4: el administrador publica una nueva versión y el registro exige aceptarla', async () => {
      const inicial = (await admin.get('/api/configuracion/aviso')).body;
      assert.equal(inicial.vigente.version, '0.1');
      assert.equal((await socio.post('/api/configuracion/aviso').send({ version: '1.0' })).status, 403);
      const textos = {
        terminos: 'Términos oficiales de uso de SUMA, versión 1.0.',
        privacidad: 'Aviso de privacidad oficial de SUMA, versión 1.0.',
      };
      assert.equal((await admin.post('/api/configuracion/aviso').send({ ...textos, version: '0.1' })).status, 409);
      assert.equal((await admin.post('/api/configuracion/aviso').send({ ...textos, version: 'uno' })).status, 400);
      assert.equal((await admin.post('/api/configuracion/aviso').send({ ...textos, version: '1.0' })).status, 201);
      const vigente = (await request(app).get('/api/auth/aviso-privacidad')).body;
      assert.equal(vigente.version, '1.0');
      assert.equal(vigente.terminos, textos.terminos);
      const persona = { nombre: 'Acepta Nueva', correo: 'acepta@ejemplo.ec', celular: '0990000904', clave: 'Valida2026!' };
      assert.equal((await request(app).post('/api/auth/register').send(datosAlta(persona))).status, 400, 'la versión 0.1 ya no es la vigente');
      assert.equal((await request(app).post('/api/auth/register').send({ ...datosAlta(persona), versionAviso: '1.0' })).status, 201);
      const vigentes = await db.query('SELECT version FROM "AvisoPrivacidad" WHERE vigente');
      assert.deepEqual(vigentes.map((v) => v.version), ['1.0']);
      const [registro] = await db.query('SELECT datos FROM "Actividad" WHERE accion=$1', ['Aviso de privacidad publicado']);
      assert.deepEqual(JSON.parse(registro.datos), { anterior: '0.1', nuevo: '1.0' });
    });

    await t.test('HU-014 / CA-15: sin servicio de correo no se crea la cuenta', async () => {
      process.env.ENABLE_DEV_RESET_LINK = 'false';
      try {
        const persona = { nombre: 'Sin Correo', correo: 'sincorreo@ejemplo.ec', celular: '0990000905', clave: 'Valida2026!' };
        const respuesta = await request(app).post('/api/auth/register').send({ ...datosAlta(persona), versionAviso: '1.0' });
        assert.equal(respuesta.status, 503);
        assert.equal((await db.query('SELECT id FROM "Usuario" WHERE nombre=$1', [persona.nombre])).length, 0);
      } finally {
        process.env.ENABLE_DEV_RESET_LINK = 'true';
      }
    });

    await t.test('HU-055 / HU-056 / RF-03 / RF-46: configuración del perfil', async () => {
      const yo = request.agent(app), otro = request.agent(app);
      const login = (agente, correo, clave) => agente.post('/api/auth/login').send({ correo, clave });
      const alta = async (agente, persona) => {
        const r = await agente.post('/api/auth/register').send({ ...datosAlta(persona), versionAviso: '1.0' });
        assert.equal(r.status, 201, JSON.stringify(r.body));
        assert.equal((await agente.post('/api/auth/confirmar-correo').send({ token: r.body.token, codigo: r.body.devCodigo })).status, 200);
        assert.equal((await login(agente, persona.correo, persona.clave)).status, 200);
      };
      await alta(yo, { nombre: 'Perfil Prueba', correo: 'perfil@ejemplo.ec', celular: '0990000910', clave: 'Valida2026!' });
      await alta(otro, { nombre: 'Otro Perfil', correo: 'otro.perfil@ejemplo.ec', celular: '0990000911', clave: 'Valida2026!' });

      // Datos personales: valida igual que el registro y no repite celulares.
      assert.equal((await yo.patch('/api/auth/perfil').send({ nombre: 'Solo' })).status, 400);
      assert.equal((await yo.patch('/api/auth/perfil').send({ provincia: 'Atlántida' })).status, 400);
      assert.equal((await yo.patch('/api/auth/perfil').send({ celular: '0990000911' })).status, 409);
      const editado = await yo.patch('/api/auth/perfil').send({ nombre: 'Perfil Editado', celular: '0990000912', provincia: 'Azuay' });
      assert.equal(editado.status, 200, JSON.stringify(editado.body));
      assert.equal(editado.body.nombre, 'Perfil Editado');
      assert.equal(editado.body.celular, '0990000912');
      assert.equal(editado.body.provincia, 'Azuay');

      // HU-056 / RF-46: Privado por defecto; el perfil Público nunca muestra correo, celular ni cuenta.
      assert.equal(editado.body.perfilPublico, false);
      const miId = editado.body.id;
      assert.equal((await otro.get('/api/perfiles/' + miId)).status, 404, 'privado por defecto');
      assert.equal((await yo.patch('/api/auth/perfil/privacidad').send({ perfilPublico: 'si' })).status, 400);
      assert.equal((await yo.patch('/api/auth/perfil/privacidad').send({ perfilPublico: true })).body.perfilPublico, true);
      const visto = await otro.get('/api/perfiles/' + miId);
      assert.equal(visto.status, 200);
      assert.deepEqual(Object.keys(visto.body).sort(), ['id', 'insignias', 'nivel', 'nombre']);
      assert.equal(visto.body.nombre, 'Perfil');
      assert.doesNotMatch(JSON.stringify(visto.body), /0990000912|perfil@ejemplo/);

      // RF-03-2: cambio de contraseña con la actual; cierra las demás sesiones.
      const segunda = request.agent(app);
      assert.equal((await login(segunda, 'perfil@ejemplo.ec', 'Valida2026!')).status, 200);
      assert.equal((await yo.post('/api/auth/perfil/clave').send({ actual: 'Incorrecta1', nueva: 'Nueva2026!', confirmacion: 'Nueva2026!' })).status, 400);
      assert.equal((await yo.post('/api/auth/perfil/clave').send({ actual: 'Valida2026!', nueva: 'Nueva2026!', confirmacion: 'Otra2026!' })).status, 400);
      assert.equal((await yo.post('/api/auth/perfil/clave').send({ actual: 'Valida2026!', nueva: 'Nueva2026!', confirmacion: 'Nueva2026!' })).status, 200);
      assert.equal((await segunda.get('/api/auth/me')).status, 401, 'las demás sesiones se cierran');
      assert.equal((await yo.get('/api/auth/me')).status, 200, 'la sesión actual sigue abierta');

      // Cambio de correo: exige la contraseña, un correo libre y el código enviado al correo nuevo.
      assert.equal((await yo.post('/api/auth/perfil/correo').send({ correo: 'nuevo@ejemplo.ec', clave: 'Incorrecta1' })).status, 400);
      assert.equal((await yo.post('/api/auth/perfil/correo').send({ correo: 'otro.perfil@ejemplo.ec', clave: 'Nueva2026!' })).status, 409);
      const cambio = await yo.post('/api/auth/perfil/correo').send({ correo: 'nuevo@ejemplo.ec', clave: 'Nueva2026!' });
      assert.equal(cambio.status, 200);
      const errado = cambio.body.devCodigo === '000000' ? '111111' : '000000';
      assert.equal((await yo.post('/api/auth/perfil/correo/confirmar').send({ codigo: errado })).status, 400);
      assert.equal((await yo.get('/api/auth/me')).body.correo, 'perfil@ejemplo.ec', 'el correo no cambia antes de confirmar');
      const confirmado = await yo.post('/api/auth/perfil/correo/confirmar').send({ codigo: cambio.body.devCodigo });
      assert.equal(confirmado.status, 200, JSON.stringify(confirmado.body));
      assert.equal(confirmado.body.correo, 'nuevo@ejemplo.ec');
      assert.equal((await login(request.agent(app), 'nuevo@ejemplo.ec', 'Nueva2026!')).status, 200);

      // Baja lógica: exige la contraseña, cierra la sesión y conserva el historial.
      assert.equal((await yo.post('/api/auth/perfil/baja').send({ clave: 'Incorrecta1' })).status, 400);
      assert.equal((await yo.post('/api/auth/perfil/baja').send({ clave: 'Nueva2026!', motivo: 'Ya no lo uso' })).status, 200);
      assert.equal((await yo.get('/api/auth/me')).status, 401);
      assert.equal((await login(request.agent(app), 'nuevo@ejemplo.ec', 'Nueva2026!')).status === 200, false);
      assert.equal((await otro.get('/api/perfiles/' + miId)).status, 404, 'una cuenta dada de baja no muestra perfil');
      const [baja] = await db.query('SELECT activo,"bajaEn","bajaMotivo" FROM "Usuario" WHERE nombre=$1', ['Perfil Editado']);
      assert.equal(baja.activo, false);
      assert.ok(baja.bajaEn);
      assert.equal(baja.bajaMotivo, 'Ya no lo uso');
      assert.ok((await db.query('SELECT id FROM "Actividad" WHERE accion=$1', ['Baja de cuenta'])).length);
      // El administrador no se da de baja a sí mismo desde el perfil.
      assert.equal((await admin.post('/api/auth/perfil/baja').send({ clave: 'Suma2026!' })).status, 409);
    });

    await t.test('RNF-05: producción no arranca sin SUMA_DATA_KEY', () => {
      const entorno = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        assert.throws(() => new ProteccionDatos(''), /SUMA_DATA_KEY/);
      } finally {
        process.env.NODE_ENV = entorno;
      }
    });
  } finally {
    await db.close();
    await aislada.limpiar();
  }
});
