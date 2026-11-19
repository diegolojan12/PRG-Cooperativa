import { test } from 'node:test';
import assert from 'node:assert/strict';
import { opcionesCorreo, crearCorreo } from '../src/infraestructura/correo.mjs';

void test('RNF-14 / CA-01 a CA-03: proveedores, TLS, autenticacion y validacion sin secretos', () => {
  const gmail = opcionesCorreo({ SMTP_SERVICE: 'gmail', SMTP_USER: 'suma@gmail.com', SMTP_PASSWORD: 'secreto' });
  assert.equal(gmail.host, 'smtp.gmail.com');
  assert.equal(gmail.port, 465);
  assert.equal(gmail.secure, true);
  const microsoft = opcionesCorreo({ SMTP_SERVICE: 'microsoft365', SMTP_USER: 'suma@example.com', SMTP_AUTH_TYPE: 'oauth2', SMTP_ACCESS_TOKEN: 'token' });
  assert.equal(microsoft.host, 'smtp.office365.com');
  assert.equal(microsoft.requireTLS, true);
  assert.deepEqual(microsoft.auth, { type: 'OAuth2', user: 'suma@example.com', accessToken: 'token' });
  assert.equal(opcionesCorreo({ SMTP_HOST: 'smtp.example.com', SMTP_PORT: '465' }).secure, true);
  assert.equal(opcionesCorreo({ SMTP_SERVICE: 'yahoo', SMTP_USER: 'suma@yahoo.com', SMTP_PASSWORD: 'x' }).host, 'smtp.mail.yahoo.com');
  assert.equal(opcionesCorreo({ SMTP_HOST: 'localhost', SMTP_PORT: '1025' }).requireTLS, false);
  assert.equal(opcionesCorreo({}), null);
  for (const env of [
    { SMTP_SERVICE: 'desconocido' },
    { SMTP_HOST: 'smtp.example.com', SMTP_PORT: 'no' },
    { SMTP_HOST: 'smtp.example.com', SMTP_PORT: '0' },
    { SMTP_HOST: 'smtp.example.com', SMTP_SECURE: 'quizas' },
    { SMTP_HOST: 'smtp.example.com', SMTP_REQUIRE_TLS: 'false' },
    { SMTP_SERVICE: 'gmail', SMTP_USER: 'suma@gmail.com' },
    { SMTP_SERVICE: 'gmail', SMTP_PASSWORD: 'no-imprimir-esto' },
    { SMTP_SERVICE: 'gmail', SMTP_USER: 'a@b.com', SMTP_AUTH_TYPE: 'oauth2' },
  ]) assert.throws(() => opcionesCorreo(env), error => !error.message.includes('no-imprimir-esto'));
});

void test('RNF-14 / CA-04: tres reintentos cada cinco minutos, sin reenviar tokens vencidos o sustituidos', async () => {
  const agenda = [], errores = [], enviados = [];
  let reloj = 1000, vigente = true;
  const correo = crearCorreo({ SMTP_HOST: 'localhost' }, {
    crearTransporte: () => ({ sendMail: async m => { enviados.push(m); throw new Error('secreto-del-proveedor'); }, verify: async () => true }),
    programar: (fn, ms) => { assert.equal(ms, 300000); agenda.push(fn); },
    ahora: () => reloj,
    error: mensaje => errores.push(mensaje),
  });
  await correo.sendMail({ to: 'destino@outlook.com', subject: 'Prueba', text: 'codigo' }, 0, new Date(2000000).toISOString(), () => vigente);
  while (agenda.length) await agenda.shift()();
  assert.equal(enviados.length, 4);
  assert.equal(errores.length, 1);
  assert.ok(!errores[0].includes('secreto-del-proveedor'));
  await correo.sendMail({ to: 'otro@gmail.com' }, 0, new Date(2000).toISOString(), () => vigente);
  reloj = 3000;
  await agenda.shift()();
  assert.equal(enviados.length, 5);
  reloj = 1000;
  await correo.sendMail({ to: 'otro@gmail.com' }, 0, new Date(2000).toISOString(), () => vigente);
  vigente = false;
  await agenda.shift()();
  assert.equal(enviados.length, 6);
  assert.equal(agenda.length, 0);
});

void test('RNF-14 / CA-06: verificar no envia mensajes y usa el remitente configurado', async () => {
  const enviados = [];
  const correo = crearCorreo({ SMTP_HOST: 'localhost', SMTP_FROM: 'SUMA <remitente@gmail.com>' }, {
    crearTransporte: () => ({ sendMail: async m => enviados.push(m), verify: async () => true }),
  });
  await correo.verificar();
  assert.equal(enviados.length, 0);
  await correo.sendMail({ to: 'admin@outlook.com', text: 'mensaje' });
  assert.equal(enviados[0].from, 'SUMA <remitente@gmail.com>');
  assert.equal(enviados[0].to, 'admin@outlook.com');
  const sinCorreo = crearCorreo({});
  assert.equal(sinCorreo.disponible, false);
  await assert.rejects(sinCorreo.verificar(), /SMTP/);
});
