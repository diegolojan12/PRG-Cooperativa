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
import { ResultadoCapacitacion } from '../src/dominio/capacitaciones.mjs';

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

    await t.test(
      'HU-035, HU-036 y HU-041 a HU-043: taller, cupo concurrente, recordatorio, asistencia y reto',
      async () => {
        const inicio = new Date(Date.now() + 24.5 * 3_600_000).toISOString();
        const taller = ok(
          await gestor.post('/api/talleres').send({
            titulo: 'Taller piloto',
            descripcion: 'Taller de prueba',
            inicio,
            lugar: 'Loja',
            cupos: 1,
          }),
          201,
        );
        const reto = ok(
          await admin.post('/api/retos').send({
            titulo: 'Asiste a un taller',
            descripcion: 'Completa una asistencia',
            inicio: fecha(-1),
            fin: fecha(5),
            actividad: 'TALLER',
            meta: 1,
            premio: 41,
          }),
          201,
        );
        const urls = '/api/talleres/' + taller.id;
        const intentos = await Promise.all(
          [socio, titular.a].map((a) => a.post(urls + '/inscripcion').send({})),
        );
        assert.deepEqual(intentos.map((r) => r.status).sort(), [201, 409]);
        const ganador = intentos[0].status === 201 ? { a: socio, u } : titular;
        ok(
          await ganador.a
            .post('/api/retos/' + reto.id + '/participar')
            .send({}),
        );
        const retoPendiente = ok(
          await admin.post('/api/retos').send({
            titulo: 'Reto con recordatorio',
            descripcion: 'Meta de dos asistencias',
            inicio: fecha(-1),
            fin: fecha(7),
            actividad: 'TALLER',
            meta: 2,
            premio: 55,
          }),
          201,
        );
        ok(
          await ganador.a
            .post('/api/retos/' + retoPendiente.id + '/participar')
            .send({}),
        );
        await api.recordatorios();
        await api.recordatorios();
        const notas = ok(
          await ganador.a.get('/api/notificaciones/bandeja'),
        ).items;
        assert.equal(
          notas.filter(
            (x) =>
              x.titulo === 'Tu taller empieza mañana' &&
              x.mensaje === 'Taller piloto',
          ).length,
          1,
        );
        assert.equal(
          (
            await gestor
              .patch(urls + '/asistencia/' + ganador.u.id)
              .send({ asistencia: 'ASISTIO' })
          ).status,
          409,
        );
        await db.query('UPDATE "Taller" SET inicio=$2 WHERE id=$1', [
          taller.id,
          new Date(Date.now() - 60_000).toISOString(),
        ]);
        ok(
          await gestor
            .patch(urls + '/asistencia/' + ganador.u.id)
            .send({ asistencia: 'ASISTIO' }),
        );
        assert.equal(
          (
            await gestor
              .patch(urls + '/asistencia/' + ganador.u.id)
              .send({ asistencia: 'ASISTIO' })
          ).status,
          409,
        );
        assert.equal(
          ok(await ganador.a.get('/api/retos')).find((r) => r.id === reto.id)
            .porcentaje,
          100,
        );
        assert.ok(
          ok(await ganador.a.get('/api/puntos')).items.some(
            (m) => m.actividad === 'RETO' && m.cantidad === 41,
          ),
        );
        assert.equal(
          ok(await ganador.a.get('/api/retos')).find(
            (r) => r.id === retoPendiente.id,
          ).porcentaje,
          50,
        );
        const ventana =
          Date.parse(fecha(7) + 'T23:59:59.999-05:00') - 72.5 * 3_600_000;
        await api.recordatorios(ventana);
        await api.recordatorios(ventana);
        assert.equal(
          ok(await ganador.a.get('/api/notificaciones/bandeja')).items.filter(
            (n) =>
              n.titulo === 'Tu reto termina pronto' &&
              n.mensaje === 'Reto con recordatorio',
          ).length,
          1,
        );
        const cancelar = ok(
          await gestor.post('/api/talleres').send({
            titulo: 'Taller para cancelar',
            descripcion: 'Comprobar liberación',
            inicio,
            lugar: 'Loja',
            cupos: 1,
          }),
          201,
        );
        ok(
          await ganador.a
            .post('/api/talleres/' + cancelar.id + '/inscripcion')
            .send({}),
          201,
        );
        ok(
          await gestor
            .patch('/api/talleres/' + cancelar.id + '/cancelar')
            .send({}),
        );
        const cancelado = ok(await ganador.a.get('/api/talleres')).find(
          (x) => x.id === cancelar.id,
        );
        assert.equal(cancelado.disponibles, 1);
        assert.equal(cancelado.inscripcion, 'CANCELADA');
      },
    );

    await t.test(
      'HU-037 y HU-038: banco, 10 preguntas, reloj en servidor y calificación',
      async () => {
        const pregunta = {
          enunciado: 'Pregunta de prueba',
          opciones: ['Opción 1', 'Opción 2'],
          correcta: 0,
          tema: 'AHORRO',
          dificultad: 'BASICO',
        };
        assert.equal(
          (await socio.post('/api/trivia/preguntas').send(pregunta)).status,
          403,
        );
        for (let i = 0; i < 10; i++)
          ok(
            await gestor
              .post('/api/trivia/preguntas')
              .send({ ...pregunta, enunciado: pregunta.enunciado + ' ' + i }),
            201,
          );
        let p = ok(await socio.post('/api/trivia/partidas').send({}));
        assert.equal(p.total, 10);
        assert.equal(p.pregunta.correcta, undefined);
        await db.query('UPDATE "PartidaTrivia" SET vence=$2 WHERE id=$1', [
          p.id,
          new Date(Date.now() - 1000).toISOString(),
        ]);
        for (let i = 0; i < 10; i++)
          p = ok(
            await socio
              .post('/api/trivia/partidas/' + p.id + '/respuesta')
              .send({ numero: p.numero, opcion: 0 }),
          );
        assert.equal(p.estado, 'COMPLETADA');
        assert.equal(p.aciertos, 9);
        assert.equal(
          ok(await socio.get('/api/puntos')).items.filter(
            (m) => m.actividad === 'TRIVIA',
          ).length,
          1,
        );
        for (let i = 0; i < 2; i++) {
          const siguiente = ok(
            await socio.post('/api/trivia/partidas').send({}),
          );
          const reanudada = ok(
            await socio.post('/api/trivia/partidas').send({}),
          );
          assert.equal(reanudada.id, siguiente.id);
          await db.query(
            'UPDATE "PartidaTrivia" SET "vencePartida"=$2 WHERE id=$1',
            [siguiente.id, new Date(Date.now() - 1000).toISOString()],
          );
        }
        assert.equal(
          (await socio.post('/api/trivia/partidas').send({})).status,
          429,
        );
      },
    );

    await t.test(
      'HU-039 y HU-040: material, evaluación, certificado PDF y crédito único',
      async () => {
        const preguntas = Array.from({ length: 5 }, (_, i) => ({
          enunciado: 'Evaluación ' + i,
          opciones: ['Sí', 'No'],
          correcta: 0,
        }));
        const c = ok(
          await gestor.post('/api/capacitaciones').send({
            titulo: 'Curso piloto',
            descripcion: 'Formación de prueba',
            preguntas,
          }),
          201,
        );
        const url = '/api/capacitaciones/' + c.id;
        assert.equal(
          (await gestor.patch(url + '/estado').send({ estado: 'ACTIVA' }))
            .status,
          409,
        );
        const archivo = await ResultadoCapacitacion.pdf({
          nombreCertificado: 'Prueba',
          cursoCertificado: 'Material',
          aciertos: 5,
          total: 5,
          fecha: ahora(),
          certificado: 'prueba',
        });
        ok(
          await gestor
            .post(url + '/material')
            .set('Content-Type', 'application/octet-stream')
            .send(archivo),
        );
        ok(await gestor.patch(url + '/estado').send({ estado: 'ACTIVA' }));
        const curso = ok(await socio.get(url));
        assert.equal(curso.preguntas[0].correcta, undefined);
        const r = ok(
          await socio
            .post(url + '/evaluar')
            .send({ version: curso.version, respuestas: [0, 0, 0, 0, 1] }),
        );
        assert.equal(r.aciertos, 4);
        const repetido = ok(
          await socio
            .post(url + '/evaluar')
            .send({ version: curso.version, respuestas: [0, 0, 0, 0, 1] }),
        );
        assert.equal(repetido.certificado, r.certificado);
        assert.equal(
          ok(await socio.get('/api/puntos')).items.filter(
            (m) => m.actividad === 'CAPACITACION',
          ).length,
          1,
        );
        const cert = await socio.get(url + '/certificado');
        assert.equal(cert.status, 200);
        assert.match(cert.headers['content-type'], /^application\/pdf/);
        assert.equal(
          ok(await request(app).get('/api/certificados/' + r.certificado))
            .curso,
          'Curso piloto',
        );
      },
    );

    await t.test(
      'HU-044 a HU-046: foto válida, canje atómico y entrega ordenada',
      async () => {
        const p = ok(
          await admin.post('/api/premios').send({
            nombre: 'Premio piloto',
            descripcion: 'Un artículo de prueba',
            costo: 40,
            stock: 1,
          }),
          201,
        );
        assert.equal(ok(await titular.a.get('/api/premios')).items.length, 0);
        assert.equal(
          (
            await admin
              .post('/api/premios/' + p.id + '/foto')
              .set('Content-Type', 'application/octet-stream')
              .send(Buffer.from('<svg>imagen</svg>'))
          ).status,
          400,
        );
        const png = await QRCode.toBuffer('Premio de prueba');
        ok(
          await admin
            .post('/api/premios/' + p.id + '/foto')
            .set('Content-Type', 'application/octet-stream')
            .send(png),
        );
        assert.equal(ok(await titular.a.get('/api/premios')).items.length, 1);
        const puntosAntes = ok(await titular.a.get('/api/puntos'));
        const datos = { premioId: p.id, solicitud: randomUUID() };
        const r = await Promise.all([
          titular.a.post('/api/canjes').send(datos),
          titular.a.post('/api/canjes').send(datos),
        ]);
        r.forEach((x) => ok(x, 201));
        assert.equal(r[0].body.id, r[1].body.id);
        assert.equal(ok(await titular.a.get('/api/premios')).items.length, 0);
        const saldo = ok(await titular.a.get('/api/puntos'));
        assert.equal(saldo.saldo, puntosAntes.saldo - 40);
        assert.equal(saldo.acumulados, puntosAntes.acumulados);
        assert.equal(saldo.nivel.nombre, puntosAntes.nivel.nombre);
        const url = '/api/canjes/' + r[0].body.id + '/entrega';
        assert.equal(
          (await admin.patch(url).send({ estado: 'ENTREGADO' })).status,
          409,
        );
        ok(await admin.patch(url).send({ estado: 'LISTO' }));
        ok(await admin.patch(url).send({ estado: 'ENTREGADO' }));
        assert.equal(
          ok(await titular.a.get('/api/canjes')).items[0].estado,
          'ENTREGADO',
        );
        assert.equal(ok(await admin.get('/api/canjes')).porPagina, 50);
      },
    );

    await t.test(
      'HU-047 a HU-050: autoría, comentarios, reacciones, contenido oficial y moderación',
      async () => {
        const post = ok(
          await socio
            .post('/api/comunidad')
            .send({ texto: 'Una publicación de prueba' }),
          201,
        );
        const url = '/api/comunidad/' + post.id;
        assert.equal(
          (await titular.a.patch(url).send({ texto: 'Cambio no permitido' }))
            .status,
          403,
        );
        ok(
          await titular.a
            .post(url + '/comentarios')
            .send({ texto: 'Comentario de prueba' }),
          201,
        );
        const [comentario] = ok(await titular.a.get(url + '/comentarios'));
        assert.equal(comentario.autor, 'Nombre');
        ok(
          await titular.a.delete('/api/comunidad/comentarios/' + comentario.id),
        );
        assert.equal(ok(await titular.a.get(url + '/comentarios')).length, 0);
        for (let i = 0; i < 2; i++)
          ok(await titular.a.put(url + '/reaccion').send({ activa: true }));
        assert.equal(
          ok(await socio.get('/api/comunidad')).items.find(
            (x) => x.id === post.id,
          ).reacciones,
          1,
        );
        ok(await titular.a.put(url + '/reaccion').send({ activa: false }));
        const oficial = ok(
          await gestor
            .post('/api/comunidad')
            .send({ texto: 'Aviso oficial de prueba' }),
          201,
        );
        ok(
          await gestor
            .patch('/api/comunidad/' + oficial.id + '/fijar')
            .send({ dias: 2 }),
        );
        assert.equal(
          ok(await titular.a.get('/api/comunidad')).items[0].id,
          oficial.id,
        );
        const datos = { tipo: 'PUBLICACION', id: post.id, motivo: 'SPAM' };
        ok(await titular.a.post('/api/comunidad/reportes').send(datos), 201);
        assert.equal(
          (await titular.a.post('/api/comunidad/reportes').send(datos)).status,
          409,
        );
        ok(await gestor.post('/api/comunidad/reportes').send(datos), 201);
        ok(await admin.post('/api/comunidad/reportes').send(datos), 201);
        assert.ok(
          !ok(await socio.get('/api/comunidad')).items.some(
            (x) => x.id === post.id,
          ),
        );
        const moderar = '/api/comunidad/moderacion/PUBLICACION/' + post.id;
        ok(await admin.patch(moderar).send({ accion: 'restaurar' }));
        assert.ok(
          ok(await socio.get('/api/comunidad')).items.some(
            (x) => x.id === post.id,
          ),
        );
        ok(await admin.patch(moderar).send({ accion: 'ocultar' }));
        ok(await admin.patch(moderar).send({ accion: 'eliminar' }));
      },
    );

    await t.test(
      'HU-051, HU-053 y HU-054: catálogo, soporte y exportaciones con datos reales',
      async () => {
        const salud = ok(
          await gestor.post('/api/salud').send({
            tipo: 'ARTICULO',
            categoria: 'PREVENCION',
            titulo: 'Artículo de prueba',
            descripcion: 'Contenido administrado por el gestor.',
          }),
          201,
        );
        assert.equal(ok(await socio.get('/api/salud')).articulos.length, 0);
        ok(
          await gestor
            .patch('/api/salud/' + salud.id + '/estado')
            .send({ estado: 'PUBLICADO' }),
        );
        assert.equal(
          ok(await socio.get('/api/salud')).articulos[0].id,
          salud.id,
        );
        ok(
          await gestor
            .patch('/api/salud/' + salud.id + '/estado')
            .send({ estado: 'BORRADOR' }),
        );
        assert.equal(ok(await socio.get('/api/salud')).articulos.length, 0);
        const s = ok(
          await socio.post('/api/soporte').send({
            descripcion: 'Necesito consultar el estado de una solicitud.',
          }),
          201,
        );
        assert.match(s.codigo, /^[A-F0-9]{6}$/);
        assert.ok(
          !ok(await titular.a.get('/api/soporte')).items.some(
            (x) => x.codigo === s.codigo,
          ),
        );
        const url = '/api/soporte/' + s.codigo;
        assert.equal(
          (
            await admin
              .patch(url)
              .send({ estado: 'CERRADA', respuesta: 'Respuesta de prueba' })
          ).status,
          409,
        );
        ok(await admin.patch(url).send({ estado: 'EN_ATENCION' }));
        ok(
          await admin
            .patch(url)
            .send({ estado: 'CERRADA', respuesta: 'Respuesta de prueba' }),
        );
        assert.ok(
          ok(await socio.get('/api/notificaciones/bandeja')).items.some((n) =>
            n.titulo.endsWith(s.codigo),
          ),
        );
        const datos = ok(await admin.get('/api/indicadores'));
        assert.equal(
          datos.indicadores.find((x) => x.id === 'canjeados').valor,
          40,
        );
        assert.equal(
          datos.indicadores.find((x) => x.id === 'talleres').valor,
          1,
        );
        assert.ok(
          datos.participacion.some(
            (x) => x.id === 'trivia' && x.porcentaje === 100,
          ),
        );
        const csv = await admin.get('/api/indicadores/exportar');
        assert.equal(csv.status, 200);
        assert.match(csv.text, /Puntos canjeados/);
        const conversion = await admin.get(
          '/api/reportes/referidos?desde=' + fecha(-1) + '&hasta=' + fecha(0),
        );
        assert.equal(conversion.status, 200);
        assert.match(conversion.text, /Campaña Local/);
        const pendientes = await admin.get('/api/referidos/exportar');
        assert.equal(pendientes.status, 200);
        assert.match(pendientes.text, /Socio referidor/);
      },
    );
  } finally {
    await db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
