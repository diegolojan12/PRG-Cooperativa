import { createHmac, randomBytes } from 'node:crypto';
import { CodigoVerificacion, errorDeDominio } from './acceso.mjs';

const MINUTO = 60_000;
const HORA = 60 * MINUTO;
const CLAVE_LOCAL = randomBytes(32);

export class ConfirmacionCorreo {
  constructor(db) {
    this.db = db;
  }

  firmar(usuarioId, vence, codigo) {
    const valor = 'confirmacion:' + usuarioId + ':' + vence + ':' + codigo;
    return (
      this.db.datos.huella(valor) ??
      createHmac('sha256', CLAVE_LOCAL).update(valor).digest('hex')
    );
  }

  emitir(usuarioId, ahora) {
    const codigo = CodigoVerificacion.segundoFactor();
    const vence = new Date(ahora + 10 * MINUTO).toISOString();
    return { codigo, vence, huella: this.firmar(usuarioId, vence, codigo) };
  }

  async iniciar(usuarioId, client) {
    const ahora = Date.now();
    const token = CodigoVerificacion.token();
    const codigo = this.emitir(usuarioId, ahora);
    await this.db.query(
      'INSERT INTO "ConfirmacionCorreo" ("usuarioId",token,"tokenExpira",huella,vence) VALUES ($1,$2,$3,$4,$5)',
      [
        usuarioId,
        CodigoVerificacion.huella(token),
        new Date(ahora + 24 * HORA).toISOString(),
        codigo.huella,
        codigo.vence,
      ],
      client,
    );
    return { token, ...codigo };
  }

  async reanudar(usuarioId) {
    const token = CodigoVerificacion.token();
    const [actual] = await this.db.query(
      'UPDATE "ConfirmacionCorreo" SET token=$2,"tokenExpira"=$3 WHERE "usuarioId"=$1 RETURNING "usuarioId"',
      [
        usuarioId,
        CodigoVerificacion.huella(token),
        new Date(Date.now() + 24 * HORA).toISOString(),
      ],
    );
    return actual ? token : null;
  }

  async leerVigente(token, ahora, client) {
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token))
      throw errorDeDominio(
        'La solicitud venció. Inicia sesión para retomarla.',
        400,
      );
    const llave = CodigoVerificacion.huella(token);
    if (!this.db.sqlite)
      await this.db.query(
        'SELECT u.id FROM "Usuario" u JOIN "ConfirmacionCorreo" c ON c."usuarioId"=u.id WHERE c.token=$1 FOR NO KEY UPDATE OF u',
        [llave],
        client,
      );
    const [fila] = await this.db.query(
      'SELECT c.*,u.correo,u.activo,u."correoVerificado" FROM "ConfirmacionCorreo" c JOIN "Usuario" u ON u.id=c."usuarioId" WHERE c.token=$1 AND c."tokenExpira">$2' +
        (this.db.sqlite ? '' : ' FOR UPDATE OF c'),
      [llave, new Date(ahora).toISOString()],
      client,
    );
    if (!fila?.activo || fila.correoVerificado)
      throw errorDeDominio(
        'La solicitud venció o ya se utilizó. Inicia sesión para continuar.',
        400,
      );
    return fila;
  }

  async confirmar(token, codigo) {
    const ahora = Date.now();
    if (typeof codigo !== 'string' || !/^\d{6}$/.test(codigo))
      throw errorDeDominio('Escribe los seis dígitos del correo.', 400, {
        codigo: 'Escribe un código de seis dígitos.',
      });
    return this.db.transaction(async (client) => {
      const fila = await this.leerVigente(token, ahora, client);
      const valido =
        fila.intentos < 5 &&
        new CodigoVerificacion(fila.huella, fila.vence).esValido(
          codigo,
          new Date(),
          (valor) => this.firmar(fila.usuarioId, fila.vence, valor),
        );
      if (!valido) {
        await this.db.query(
          'UPDATE "ConfirmacionCorreo" SET intentos=intentos+1 WHERE "usuarioId"=$1 AND intentos<5',
          [fila.usuarioId],
          client,
        );
        return false;
      }
      await this.db.query(
        'UPDATE "Usuario" SET "correoVerificado"=$2 WHERE id=$1',
        [fila.usuarioId, true],
        client,
      );
      await this.db.query(
        'DELETE FROM "ConfirmacionCorreo" WHERE "usuarioId"=$1',
        [fila.usuarioId],
        client,
      );
      return true;
    });
  }

  async pendiente(huella) {
    const [fila] = await this.db.query(
      'SELECT 1 AS vigente FROM "ConfirmacionCorreo" WHERE huella=$1 AND vence>$2 AND intentos<5',
      [huella, new Date().toISOString()],
    );
    return !!fila;
  }

  async reenviar(token) {
    const ahora = Date.now();
    return this.db.transaction(async (client) => {
      const fila = await this.leerVigente(token, ahora, client);
      const reenvios = JSON.parse(fila.reenvios).filter(
        (fecha) => ahora - fecha < HORA,
      );
      if (reenvios.length >= 3)
        throw errorDeDominio(
          'Ya solicitaste tres reenvíos en la última hora. Intenta más tarde.',
          429,
        );
      reenvios.push(ahora);
      const codigo = this.emitir(fila.usuarioId, ahora);
      await this.db.query(
        'UPDATE "ConfirmacionCorreo" SET huella=$2,vence=$3,intentos=0,reenvios=$4 WHERE "usuarioId"=$1',
        [fila.usuarioId, codigo.huella, codigo.vence, JSON.stringify(reenvios)],
        client,
      );
      return {
        correo: fila.correo,
        ...codigo,
      };
    });
  }
}
