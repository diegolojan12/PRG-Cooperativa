import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import express from 'express';
import request from 'supertest';
import { Database } from '../src/database.mjs';
import { createApi, diasHabiles } from '../src/api.mjs';

async function registrar(agent, datos) {
  const alta = await agent.post('/api/auth/register').send(datos);
  assert.equal(alta.status, 201, JSON.stringify(alta.body));
  return alta;
}

test('días hábiles: excluye fines de semana y feriados fijos de Ecuador', () => {
  assert.equal(diasHabiles('2026-11-06T10:00:00Z', new Date('2026-11-10T12:00:00Z')), 2);
  // 2 y 3 de noviembre son feriados nacionales.
  assert.equal(diasHabiles('2026-10-30T10:00:00Z', new Date('2026-11-04T12:00:00Z')), 1);
});

test('Sprint 1: criterios de aceptación documentados', async (t) => {
  process.env.SEED_DEMO = 'true';
  process.env.NODE_ENV = 'test';
  process.env.ENABLE_DEV_RESET_LINK = 'true';
  const directory = mkdtempSync(join(tmpdir(), 'suma-test-'));
  const db = new Database('file:' + join(directory, 'test.db'));
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
      assert.deepEqual(s.body.modulos, ['panel', 'referidos', 'notificaciones', 'ayuda']);
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

    await t.test('RF-08-2: solo el administrador crea cuentas de Gestor o Administrador', async () => {
      const body = { nombre: 'Nueva Gestora', correo: 'gestora@suma.ec', rol: 'GESTOR' };
      assert.equal((await socio.post('/api/usuarios').send(body)).status, 403);
      const created = await admin.post('/api/usuarios').send(body);
      assert.equal(created.status, 201);
      assert.equal(created.body.rol, 'GESTOR');
      assert.match(created.body.devResetUrl, /\/recuperar-contrasena\?token=/);
      assert.equal((await admin.post('/api/usuarios').send({ ...body, rol: 'JEFE' })).status, 400);
    });

    await t.test('RF-11 / RNF-12: valida, rechaza código, evita duplicados y pagina de 20', async () => {
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
      assert.equal(list.porPagina, 20);
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
          await registrar(other, {
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
          await request(app).post('/api/auth/register').send(({
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
      assert.equal(data.indicadores.length, 6);
      assert.ok(data.indicadores.find((x) => x.id === 'activos').valor >= 2);
      assert.equal(data.indicadores.find((x) => x.id === 'canjeados').disponibleDesde, 'Sprint 5');
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
    rmSync(directory, { recursive: true, force: true });
  }
});

test('RNF-05: migra datos personales y conserva acceso y unicidad por correo', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'suma-cifrado-'));
  const url = 'file:' + join(directory, 'test.db');
  const claveOriginal = process.env.SUMA_DATA_KEY;
  const semillaOriginal = process.env.SEED_DEMO;
  let db;
  try {
    delete process.env.SUMA_DATA_KEY;
    process.env.SEED_DEMO = 'false';
    db = new Database(url);
    await db.init();
    const appLegacy = express();
    appLegacy.use('/api', (await createApi(db)).router);
    const usuario = { nombre: 'Cuenta Antigua', correo: 'antigua@ejemplo.ec', celular: '0990000444',
      clave: 'Valida2026!', tipoCuenta: 'corriente', cuenta: '2255667788' };
    await registrar(request(appLegacy), usuario);
    await db.close();

    process.env.SUMA_DATA_KEY = '2a'.repeat(32);
    db = new Database(url);
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
    assert.equal((await request(app).post('/api/auth/register').send(({ ...usuario, cuenta: undefined }))).status, 409);
    await db.close();

    process.env.SUMA_DATA_KEY = '7b'.repeat(32);
    db = new Database(url);
    await assert.rejects(db.init(), /no coincide/);
  } finally {
    await db?.close();
    if (claveOriginal === undefined) delete process.env.SUMA_DATA_KEY;
    else process.env.SUMA_DATA_KEY = claveOriginal;
    if (semillaOriginal === undefined) delete process.env.SEED_DEMO;
    else process.env.SEED_DEMO = semillaOriginal;
    rmSync(directory, { recursive: true, force: true });
  }
});
