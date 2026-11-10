import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  hkdfSync,
  randomBytes,
} from 'node:crypto';

const PREFIJO = 'aes:v1:';

export class ProteccionDatos {
  constructor(secreto = process.env.SUMA_DATA_KEY) {
    if (!secreto) {
      if (process.env.NODE_ENV === 'production')
        throw new Error(
          'Configura SUMA_DATA_KEY antes de iniciar SUMA en producción.',
        );
      return;
    }
    if (!/^[0-9a-f]{64}$/i.test(secreto))
      throw new Error(
        'SUMA_DATA_KEY debe contener 64 caracteres hexadecimales.',
      );
    const material = Buffer.from(secreto, 'hex');
    this.cifrado = hkdfSync('sha256', material, '', 'suma:cifrado:v1', 32);
    this.indice = hkdfSync('sha256', material, '', 'suma:indice:v1', 32);
  }
  huella(valor) {
    return (
      this.indice &&
      createHmac('sha256', this.indice).update(valor).digest('hex')
    );
  }
  correoIndice(correo) {
    return this.huella(correo.trim().toLowerCase()) ?? null;
  }
  cifrar(campo, valor) {
    if (!this.cifrado || valor == null) return valor;
    const iv = randomBytes(12);
    const cifrador = createCipheriv('aes-256-gcm', this.cifrado, iv);
    cifrador.setAAD(Buffer.from(campo));
    const cuerpo = Buffer.concat([
      cifrador.update(valor, 'utf8'),
      cifrador.final(),
    ]);
    return (
      PREFIJO +
      Buffer.concat([iv, cifrador.getAuthTag(), cuerpo]).toString('base64')
    );
  }
  descifrar(campo, valor) {
    if (!valor?.startsWith(PREFIJO)) return valor;
    if (!this.cifrado)
      throw new Error('La base está cifrada y requiere SUMA_DATA_KEY.');
    const datos = Buffer.from(valor.slice(PREFIJO.length), 'base64');
    const descifrador = createDecipheriv(
      'aes-256-gcm',
      this.cifrado,
      datos.subarray(0, 12),
    );
    descifrador.setAAD(Buffer.from(campo));
    descifrador.setAuthTag(datos.subarray(12, 28));
    return Buffer.concat([
      descifrador.update(datos.subarray(28)),
      descifrador.final(),
    ]).toString('utf8');
  }
  abrirFila(fila) {
    delete fila.correoIndice;
    delete fila.cuentaIndice;
    delete fila.celularIndice;
    delete fila.correoPendienteIndice;
    for (const campo of ['correo', 'celular', 'cuenta'])
      if (Object.hasOwn(fila, campo))
        fila[campo] = this.descifrar(campo, fila[campo]);
    return fila;
  }
}
