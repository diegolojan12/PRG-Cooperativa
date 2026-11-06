import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import express from 'express';
import request from 'supertest';
import { Database } from '../src/database.mjs';
import { createApi } from '../src/api.mjs';

test('Sprint 1: autenticación, permisos, persistencia y referidos', async (t) => {
  process.env.SEED_DEMO = 'true';
  process.env.NODE_ENV = 'test';
  process.env.ENABLE_DEV_RESET_LINK = 'true';
  const directory = mkdtempSync(join(tmpdir(), 'suma-test-'));
  const db = new Database('file:' + join(directory, 'test.db'));
  const app = express();
  app.use('/api', (await createApi(db)).router);
  const admin = request.agent(app),
    socio = request.agent(app),
    other = request.agent(app);
  const login = (agent, correo, clave = 'Suma2026!') =>
    agent.post('/api/auth/login').send({ correo, clave });
  const payload = {
    nombre: 'Ana Prueba',
    correo: 'ana@ejemplo.ec',
    celular: '0991234567',
    consentimiento: true,
  };
  let id, resetToken;
  try {
    await t.test(
      'bloquea sesiones ausentes, credenciales incorrectas y orígenes externos',
      async () => {
        assert.equal((await request(app).get('/api/usuarios')).status, 401);
        assert.equal(
          (await login(socio, 'socio@suma.ec', 'incorrecta')).status,
          401,
        );
        assert.equal(
          (
            await request(app)
              .post('/api/auth/login')
              .set('Origin', 'https://externo.test')
              .send({ correo: 'admin@suma.ec', clave: 'Suma2026!' })
          ).status,
          403,
        );
        const response = await login(admin, 'admin@suma.ec');
        assert.equal(response.status, 200);
        assert.match(response.headers['set-cookie'][0], /HttpOnly/);
        assert.equal((await login(socio, 'socio@suma.ec')).status, 200);
      },
    );
    await t.test('separa roles y protege los módulos en servidor', async () => {
      for (const module of ['usuarios', 'roles', 'configuracion', 'actividad'])
        assert.equal((await socio.get('/api/' + module)).status, 403, module);
      assert.equal((await admin.get('/api/usuarios')).status, 200);
      const me = (await admin.get('/api/auth/me')).body;
      assert.equal(
        (
          await admin
            .patch('/api/usuarios/' + me.id)
            .send({ rol: 'SOCIO', activo: true })
        ).status,
        400,
      );
    });
    await t.test('valida y persiste referidos; evita duplicados', async () => {
      assert.equal(
        (
          await socio
            .post('/api/referidos')
            .send({ ...payload, celular: '123' })
        ).status,
        400,
      );
      assert.equal(
        (
          await socio
            .post('/api/referidos')
            .send({ ...payload, consentimiento: false })
        ).status,
        400,
      );
      const created = await socio.post('/api/referidos').send(payload);
      assert.equal(created.status, 201);
      id = created.body.id;
      assert.equal(
        (await socio.post('/api/referidos').send(payload)).status,
        409,
      );
      assert.ok(
        (await socio.get('/api/referidos')).body.some((x) => x.id === id),
      );
      const reader = new Database('file:' + join(directory, 'test.db'));
      assert.equal(
        (await reader.query('SELECT * FROM "Referido" WHERE id=$1', [id]))[0]
          .nombre,
        payload.nombre,
      );
      await reader.close();
    });
    await t.test(
      'aísla los datos entre socios y reserva el estado a administración',
      async () => {
        assert.equal(
          (
            await other
              .post('/api/auth/register')
              .send({
                nombre: 'Otro Socio',
                correo: 'otro@ejemplo.ec',
                celular: '0995555555',
                clave: 'Nueva2026!',
              })
          ).status,
          201,
        );
        await login(other, 'otro@ejemplo.ec', 'Nueva2026!');
        assert.equal((await other.get('/api/referidos')).body.length, 0);
        assert.equal(
          (
            await other
              .patch('/api/referidos/' + id)
              .send({ ...payload, estado: 'VALIDADO' })
          ).status,
          404,
        );
        assert.equal((await other.delete('/api/referidos/' + id)).status, 404);
        assert.equal(
          (
            await socio
              .patch('/api/referidos/' + id)
              .send({ ...payload, estado: 'VALIDADO' })
          ).status,
          403,
        );
        assert.equal(
          (
            await admin
              .patch('/api/referidos/' + id)
              .send({ ...payload, estado: 'VALIDADO' })
          ).status,
          200,
        );
        assert.equal((await socio.delete('/api/referidos/' + id)).status, 403);
        assert.ok(
          (await socio.get('/api/notificaciones')).body.some(
            (x) => x.titulo === 'Tu referido tiene novedades',
          ),
        );
        assert.equal(
          (await socio.patch('/api/notificaciones/leer').send({})).status,
          200,
        );
        assert.ok(
          (await socio.get('/api/notificaciones')).body.every((x) => x.leida),
        );
      },
    );
    await t.test(
      'guarda permisos y bloquea inmediatamente el módulo deshabilitado',
      async () => {
        assert.equal(
          (
            await admin
              .put('/api/roles/SOCIO')
              .send({ modulos: ['panel', 'ayuda', 'notificaciones'] })
          ).status,
          200,
        );
        assert.equal((await socio.get('/api/referidos')).status, 403);
        assert.equal(
          (
            await admin
              .put('/api/roles/SOCIO')
              .send({ modulos: ['panel', 'ayuda', 'usuarios'] })
          ).status,
          400,
        );
        await admin
          .put('/api/roles/SOCIO')
          .send({ modulos: ['panel', 'ayuda', 'referidos', 'notificaciones'] });
      },
    );
    await t.test(
      'configuración persistente y registro de actividad',
      async () => {
        const config = (await admin.get('/api/configuracion')).body;
        assert.equal(
          (
            await admin
              .put('/api/configuracion')
              .send({
                ...config,
                puntosReferido: '150',
                registroAbierto: 'false',
              })
          ).status,
          200,
        );
        assert.equal((await socio.get('/api/overview')).body.puntos, 300);
        assert.equal(
          (await request(app).post('/api/auth/register').send({})).status,
          403,
        );
        assert.ok(
          (await admin.get('/api/actividad')).body.some(
            (x) => x.accion === 'Configuración actualizada',
          ),
        );
        await admin.put('/api/configuracion').send(config);
      },
    );
    await t.test(
      'recuperación: vence, es de un solo uso y revoca sesiones',
      async () => {
        const expired = 'a'.repeat(64);
        const { createHash } = await import('node:crypto');
        const [user] = await db.query(
          'SELECT id FROM "Usuario" WHERE correo=$1',
          ['otro@ejemplo.ec'],
        );
        await db.query(
          'INSERT INTO "Recuperacion" (token,"usuarioId",expira) VALUES ($1,$2,$3)',
          [
            createHash('sha256').update(expired).digest('hex'),
            user.id,
            '2000-01-01T00:00:00.000Z',
          ],
        );
        assert.equal(
          (
            await other
              .post('/api/auth/reset')
              .send({ token: expired, clave: 'Otra2026!' })
          ).status,
          400,
        );
        const forgot = await other
          .post('/api/auth/forgot')
          .send({ correo: 'otro@ejemplo.ec' });
        resetToken = new URL(forgot.body.devResetUrl).searchParams.get('token');
        assert.equal(
          (
            await other
              .post('/api/auth/reset')
              .send({ token: resetToken, clave: 'Otra2026!' })
          ).status,
          200,
        );
        assert.equal((await other.get('/api/auth/me')).status, 401);
        assert.equal(
          (
            await other
              .post('/api/auth/reset')
              .send({ token: resetToken, clave: 'Otra2026!' })
          ).status,
          400,
        );
        assert.equal(
          (await login(other, 'otro@ejemplo.ec', 'Nueva2026!')).status,
          401,
        );
        assert.equal(
          (await login(other, 'otro@ejemplo.ec', 'Otra2026!')).status,
          200,
        );
      },
    );
    await t.test(
      'elimina referido, desactiva cuenta y cierra sesión',
      async () => {
        assert.equal((await admin.delete('/api/referidos/' + id)).status, 200);
        const [user] = await db.query(
          'SELECT id FROM "Usuario" WHERE correo=$1',
          ['otro@ejemplo.ec'],
        );
        assert.equal(
          (
            await admin
              .patch('/api/usuarios/' + user.id)
              .send({ rol: 'SOCIO', activo: false })
          ).status,
          200,
        );
        assert.equal((await other.get('/api/auth/me')).status, 401);
        assert.equal(
          (await login(other, 'otro@ejemplo.ec', 'Otra2026!')).status,
          401,
        );
        assert.equal(
          (await socio.post('/api/auth/logout').send({})).status,
          200,
        );
        assert.equal((await socio.get('/api/auth/me')).status, 401);
      },
    );
    await t.test(
      'producción nunca expone enlaces de recuperación',
      async () => {
        process.env.NODE_ENV = 'production';
        const response = await request(app)
          .post('/api/auth/forgot')
          .send({ correo: 'admin@suma.ec' });
        assert.equal(response.status, 200);
        assert.equal(response.body.devResetUrl, undefined);
        process.env.NODE_ENV = 'test';
      },
    );
  } finally {
    await db.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
