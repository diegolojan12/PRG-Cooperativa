import { errorDeDominio as error } from './acceso.mjs';

export function imagenValida(archivo) {
  if (
    !Buffer.isBuffer(archivo) ||
    archivo.length < 12 ||
    archivo.length > 2 * 1024 * 1024
  )
    throw error('Selecciona una imagen JPG o PNG de hasta 2 MB.');
  const png =
    archivo.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')) &&
    archivo.subarray(12, 16).toString('ascii') === 'IHDR';
  const jpg =
    archivo.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex')) &&
    archivo.subarray(-2).equals(Buffer.from('ffd9', 'hex'));
  if (!png && !jpg) throw error('El archivo debe ser una imagen JPG o PNG.');
  return {
    contenido: archivo.toString('base64'),
    mime: png ? 'image/png' : 'image/jpeg',
  };
}

export function responderImagen(res, contenido, mime) {
  res
    .set('X-Content-Type-Options', 'nosniff')
    .type(mime)
    .send(Buffer.from(contenido, 'base64'));
}
