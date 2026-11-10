import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import QRCode from 'qrcode';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import express from 'express';
import request from 'supertest';
import { Database } from '../src/database.mjs';
import { createApi } from '../src/api.mjs';
import { hoyEcuador } from '../src/dominio/campanias.mjs';

const dia = 86_400_000;
const ahora = () => new Date().toISOString();
const fecha = (delta) =>
  new Date(Date.parse(hoyEcuador() + 'T12:00:00Z') + delta * dia)
    .toISOString()
    .slice(0, 10);

test('Flujos integrados del backlog posterior al Sprint 2', async (t) => {
  process.env.NODE_ENV = 'test';
  process.env.SEED_DEMO = 'true';
  process.env.ENABLE_DEV_RESET_LINK = 'true';
  const dir = mkdtempSync(join(tmpdir(), 'suma-producto-'));
  const pg = process.env.SUMA_TEST_PRODUCTO_PG;
  if (pg) {
    const url = new URL(pg);
    assert.ok(
      ['127.0.0.1', 'localhost'].includes(url.hostname) &&
        url.pathname === '/suma_sprints_test',
      'Usa únicamente una base temporal local llamada suma_sprints_test.',
    );
  }
  const db = new Database(pg || 'file:' + join(dir, 'prueba.db'));
  const api = await createApi(db);
  const app = express();
  app.use('/api', api.router);
  const admin = request.agent(app),
    socio = request.agent(app),
    gestor = request.agent(app);
  const login = (a, correo, clave = 'Suma2026!') =>
    a.post('/api/auth/login').send({ correo, clave });
  const ok = (r, estado = 200) => {
    assert.equal(r.status, estado, JSON.stringify(r.body));
    return r.body;
  };
  const alta = async (n, codigoReferido) => {
    const a = request.agent(app);
    const correo = 'usuario' + n + '@ejemplo.ec';
    const clave = 'Prueba2026!';
    const r = ok(
      await a.post('/api/auth/register').send({
        nombre: 'Nombre Prueba',
        correo,
        celular: '099000011' + n,
        clave,
        confirmacionClave: clave,
        aceptaTerminos: true,
        versionAviso: '0.1',
        cuenta: '221222333' + n,
        tipoCuenta: 'ahorros',
        codigoReferido,
      }),
      201,
    );
    ok(
      await a
        .post('/api/auth/confirmar-correo')
        .send({ token: r.token, codigo: r.devCodigo }),
    );
    const u = ok(await login(a, correo, clave));
    return { a, u };
  };
  let titular;
  try {
    const a = ok(await login(admin, 'admin@suma.ec'));
    ok(
      await admin
        .post('/api/auth/2fa')
        .send({ desafioId: a.desafioId, codigo: a.devCodigo }),
    );
    const u = ok(await login(socio, 'socio@suma.ec'));
    ok(await login(gestor, 'gestor@suma.ec'));

    await t.test(
      'HU-023 y HU-052: perfil, correo confirmado, privacidad y baja lógica',
      async () => {
        const otro = await alta(1);
        const perfil = ok(await otro.a.get('/api/perfil'));
        assert.equal(perfil.visibilidad, 'PRIVADO');
        assert.equal(
          (await socio.get('/api/perfiles/' + otro.u.id)).status,
          404,
        );
        ok(
          await otro.a
            .patch('/api/perfil/privacidad')
            .send({ visibilidad: 'PUBLICO' }),
        );
        assert.deepEqual(
          Object.keys(ok(await socio.get('/api/perfiles/' + otro.u.id))).sort(),
          ['insignias', 'nivel', 'nombre'],
        );
        const datos = {
          nombre: 'Nuevo Nombre',
          correo: 'actualizado@ejemplo.ec',
          celular: perfil.celular,
          provincia: 'Loja',
          claveActual: 'Prueba2026!',
        };
        const r = ok(await otro.a.patch('/api/perfil').send(datos));
        assert.equal(ok(await otro.a.get('/api/perfil')).correo, perfil.correo);
        ok(
          await otro.a.post('/api/auth/confirmar-correo').send({
            token: r.confirmacion.token,
            codigo: r.confirmacion.devCodigo,
          }),
        );
        assert.equal((await otro.a.get('/api/perfil')).status, 401);
        ok(await login(otro.a, datos.correo, datos.claveActual));
        ok(
          await otro.a
            .delete('/api/perfil')
            .send({ claveActual: datos.claveActual }),
        );
        assert.equal(
          (await socio.get('/api/perfiles/' + otro.u.id)).status,
          404,
        );
        assert.equal(
          Number(
            (
              await db.query('SELECT activo FROM "Usuario" WHERE id=$1', [
                otro.u.id,
              ])
            )[0].activo,
          ),
          0,
        );
      },
    );

    await t.test(
      'HU-025 a HU-034: campañas, doble premio, saldo, nivel, ranking e insignias',
      async () => {
        const perfil = ok(await socio.get('/api/perfil'));
        ok(
          await socio
            .patch('/api/perfil')
            .send({ ...perfil, provincia: 'Loja', claveActual: 'Suma2026!' }),
        );
        const crearCamp = (titulo) =>
          admin.post('/api/campanias').send({
            titulo,
            inicio: fecha(-1),
            fin: fecha(3),
            puntosSocio: 130,
            puntosReferido: 60,
            provincias: ['Loja'],
          });
        ok(await crearCamp('Campaña Local'), 201);
        ok(await crearCamp('Campaña Solapada'), 201);
        const { items } = ok(await admin.get('/api/campanias'));
        const c = items.find((x) => x.titulo === 'Campaña Local');
        const conflicto = items.find((x) => x.titulo === 'Campaña Solapada');
        const estado = (id, nuevo) =>
          admin
            .patch('/api/campanias/' + id + '/estado')
            .send({ estado: nuevo });
        ok(await estado(c.id, 'ACTIVA'));
        assert.equal((await estado(conflicto.id, 'ACTIVA')).status, 409);
        assert.equal(ok(await socio.get('/api/campanias')).items[0].id, c.id);
        assert.ok(
          ok(await socio.get('/api/notificaciones/bandeja')).items.some(
            (n) => n.titulo === 'Campaña de referidos activada',
          ),
        );
        ok(
          await admin.put('/api/gamificacion/niveles').send({
            niveles: [
              { nombre: 'Base', umbral: 0 },
              { nombre: 'Impulso', umbral: 120 },
            ],
          }),
        );
        const insignia = ok(
          await admin.post('/api/gamificacion/insignias').send({
            nombre: 'Embajador de prueba',
            imagen: '/favicon.ico',
            actividad: 'REFERIDO',
            meta: 1,
          }),
          201,
        );
        const codigo = ok(
          await socio.post('/api/referidos/mi-codigo').send({}),
        ).codigo;
        titular = await alta(2, codigo);
        ok(
          await admin
            .patch('/api/usuarios/' + titular.u.id + '/cuenta')
            .send({ estado: 'APROBADO' }),
        );
        const ref = ok(
          await admin.get('/api/referidos?buscar=usuario2%40ejemplo.ec'),
        ).items[0];
        assert.equal(ref.campaniaId, c.id);
        ok(
          await admin
            .patch('/api/referidos/' + ref.id + '/dictamen')
            .send({ estado: 'APROBADO' }),
        );
        const puntos = ok(await socio.get('/api/puntos'));
        assert.ok(puntos.items.some((m) => m.cantidad === 130));
        assert.equal(puntos.nivel.nombre, 'Impulso');
        assert.equal(ok(await titular.a.get('/api/puntos')).saldo, 60);
        ok(
          await admin
            .patch('/api/gamificacion/insignias/' + insignia.id + '/inactivar')
            .send({}),
        );
        assert.ok(
          ok(await socio.get('/api/perfil')).insignias.some(
            (i) => i.id === insignia.id,
          ),
        );
        assert.ok(
          !ok(await socio.get('/api/puntos/ranking')).some(
            (r) => r.id === u.id,
          ),
        );
        ok(
          await socio
            .patch('/api/perfil/privacidad')
            .send({ visibilidad: 'PUBLICO' }),
        );
        assert.ok(
          ok(await socio.get('/api/puntos/ranking')).some((r) => r.id === u.id),
        );
        const pausa = await alta(3, codigo);
        ok(
          await admin
            .patch('/api/usuarios/' + pausa.u.id + '/cuenta')
            .send({ estado: 'APROBADO' }),
        );
        ok(await estado(c.id, 'PAUSADA'));
        const ref2 = ok(
          await admin.get('/api/referidos?buscar=usuario3%40ejemplo.ec'),
        ).items[0];
        ok(
          await admin
            .patch('/api/referidos/' + ref2.id + '/dictamen')
            .send({ estado: 'APROBADO' }),
        );
        assert.equal(ok(await pausa.a.get('/api/puntos')).saldo, 0);
        ok(await estado(c.id, 'FINALIZADA'));
        assert.equal((await estado(c.id, 'ACTIVA')).status, 409);
      },
    );

  } finally {
    await db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
