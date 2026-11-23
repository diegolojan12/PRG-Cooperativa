import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { setTimeout as esperar } from 'node:timers/promises';
import express from 'express';
import request from 'supertest';
import { randomBytes } from 'node:crypto';
import { Database } from '../src/database.mjs';
import { createApi } from '../src/api.mjs';
import { actualizarCorreoAdmin } from '../scripts/admin-email.mjs';
import { baseAislada } from './aislamiento-pg.mjs';

// Receptor SMTP en loopback: comprueba el protocolo real de Nodemailer sin enviar a Internet.
async function buzonLocal() {
  const mensajes = [], sockets = new Set();
  const server = createServer(socket => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
    socket.on('error', () => {});
    socket.setEncoding('utf8');
    socket.write('220 localhost SUMA test\r\n');
    let buffer = '', datos = false, cuerpo = [], destinos = [];
    socket.on('data', chunk => {
      buffer += chunk;
      let fin;
      while ((fin = buffer.indexOf('\r\n')) >= 0) {
        const linea = buffer.slice(0, fin);
        buffer = buffer.slice(fin + 2);
        if (datos) {
          if (linea === '.') {
            mensajes.push({ destinos: [...destinos], cuerpo: cuerpo.join('\r\n') });
            datos = false;
            socket.write('250 queued\r\n');
          } else cuerpo.push(linea.replace(/^\.\./, '.'));
        } else if (/^EHLO|^HELO/.test(linea)) socket.write('250-localhost\r\n250 8BITMIME\r\n');
        else if (linea.startsWith('MAIL FROM:')) { destinos = []; socket.write('250 ok\r\n'); }
        else if (linea.startsWith('RCPT TO:')) { destinos.push(linea.match(/<([^>]+)>/)[1]); socket.write('250 ok\r\n'); }
        else if (linea === 'DATA') { cuerpo = []; datos = true; socket.write('354 data\r\n'); }
        else if (linea === 'QUIT') socket.end('221 bye\r\n');
        else socket.write('250 ok\r\n');
      }
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { port: server.address().port, mensajes,
    async recibir(numero) {
      for (let i = 0; i < 100; i++) {
        if (mensajes.length > numero) return mensajes[numero];
        await esperar(20);
      }
      assert.fail('No llego el mensaje al SMTP local.');
    },
    async cerrar() {
      for (const socket of sockets) socket.destroy();
      await new Promise(resolve => server.close(resolve));
    },
  };
}

void test('HU-003 / HU-004 / HU-014 / CA-05 a CA-08: SMTP real local y administrador cifrado', async () => {
  const anterior = { ...process.env };
  const buzon = await buzonLocal();
  let aislada, db;
  try {
    for (const clave of Object.keys(process.env).filter(c => c.startsWith('SMTP_'))) delete process.env[clave];
    Object.assign(process.env, { SMTP_HOST: '127.0.0.1', SMTP_PORT: String(buzon.port), SMTP_FROM: 'SUMA <remitente@example.test>',
      NODE_ENV: 'test', SEED_DEMO: 'true', ENABLE_DEV_RESET_LINK: 'false', SUMA_DATA_KEY: randomBytes(32).toString('hex') });
    aislada = await baseAislada();
    db = new Database(aislada.url, { esquema: aislada.esquema });
    await db.init();
    await assert.rejects(actualizarCorreoAdmin(db, 'socio@suma.ec', 'incorrecto@gmail.com'), /administradora/);
    await assert.rejects(actualizarCorreoAdmin(db, 'admin@suma.ec', 'gestor@suma.ec'), /otra cuenta/);
    await actualizarCorreoAdmin(db, 'admin@suma.ec', 'administrador@gmail.com');
    assert.equal(await actualizarCorreoAdmin(db, 'admin@suma.ec', 'administrador@gmail.com', { aceptarDestinoExistente: true }), false);
    const [guardado] = await db.queryRaw('SELECT correo FROM "Usuario" WHERE "correoIndice"=$1', [db.datos.correoIndice('administrador@gmail.com')]);
    assert.match(guardado.correo, /^aes:v1:/);
    const app = express();
    app.use('/api', (await createApi(db)).router);
    const agent = request.agent(app);
    const acceso = await agent.post('/api/auth/login').send({ correo: 'administrador@gmail.com', clave: 'Suma2026!' });
    assert.equal(acceso.status, 200);
    assert.equal(acceso.body.requiere2fa, true);
    assert.equal(acceso.body.devCodigo, undefined);
    assert.equal(acceso.headers['set-cookie'], undefined);
    const mail2fa = await buzon.recibir(0);
    assert.deepEqual(mail2fa.destinos, ['administrador@gmail.com']);
    const codigo = mail2fa.cuerpo.match(/\b\d{6}\b/)[0];
    assert.equal((await agent.post('/api/auth/2fa').send({ desafioId: acceso.body.desafioId, codigo })).status, 200);
    const recuperacion = await agent.post('/api/auth/forgot').send({ correo: 'administrador@gmail.com' });
    assert.equal(recuperacion.body.devResetUrl, undefined);
    const mailReset = await buzon.recibir(1);
    assert.deepEqual(mailReset.destinos, ['administrador@gmail.com']);
    // MIME quoted-printable puede partir lineas o codificar '='.
    const textoReset = mailReset.cuerpo.replace(/=\r\n/g, '').replace(/=([0-9A-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    const token = textoReset.match(/token=([a-f0-9]+)/)[1];
    assert.equal((await agent.post('/api/auth/reset').send({ token, clave: 'NuevaClave2026!' })).status, 200);
    assert.equal((await agent.get('/api/auth/me')).status, 401);
    const alta = await request(app).post('/api/auth/register').send({ nombre: 'Maria Correo', correo: 'socia@outlook.com', celular: '0997777777', provincia: 'Loja', clave: 'Suma2026!', confirmacionClave: 'Suma2026!', aceptaTerminos: true, versionAviso: '0.1' });
    assert.equal(alta.status, 201, JSON.stringify(alta.body));
    assert.equal(alta.body.devCodigo, undefined);
    const mailRegistro = await buzon.recibir(2);
    assert.deepEqual(mailRegistro.destinos, ['socia@outlook.com']);
    assert.equal((await request(app).post('/api/auth/confirmar-correo').send({ token: alta.body.token, codigo: mailRegistro.cuerpo.match(/\b\d{6}\b/)[0] })).status, 200);
    delete process.env.SMTP_HOST;
    process.env.NODE_ENV = 'production';
    const sinSMTP = express();
    sinSMTP.use('/api', (await createApi(db)).router);
    const denegado = await request(sinSMTP).post('/api/auth/login').send({ correo: 'administrador@gmail.com', clave: 'NuevaClave2026!' });
    assert.equal(denegado.status, 503);
    const existente = await request(sinSMTP).post('/api/auth/forgot').send({ correo: 'administrador@gmail.com' });
    const inexistente = await request(sinSMTP).post('/api/auth/forgot').send({ correo: 'nadie@outlook.com' });
    assert.deepEqual(existente.body, inexistente.body);
    assert.equal((await db.query('SELECT * FROM "Recuperacion"')).length, 0);
  } finally {
    await buzon.cerrar();
    if (db) await db.close();
    if (aislada) await aislada.limpiar();
    for (const clave of Object.keys(process.env)) if (!Object.hasOwn(anterior, clave)) delete process.env[clave];
    Object.assign(process.env, anterior);
  }
});
