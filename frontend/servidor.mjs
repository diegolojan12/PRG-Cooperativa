/**
 * Servidor del frontend para el laboratorio (sin Docker, sin dependencias extra).
 *
 *  - Sirve la web compilada (dist/frontend/browser) con "fallback" a index.html para las rutas de Angular.
 *  - Reenvía /api/* al backend, que puede estar en OTRA computadora (BACKEND_URL).
 *    Así el navegador solo habla con este servidor: no hay problemas de CORS ni de cookies entre equipos.
 *
 * Variables (todas opcionales):
 *   PORT=4200  HOST=0.0.0.0  BACKEND_URL=http://localhost:3000
 */
import { createServer, request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(fileURLToPath(new URL('.', import.meta.url)), 'dist/frontend/browser');
const PUERTO = Number(process.env.PORT || 4200);
const HOST = process.env.HOST || '0.0.0.0';
const BACKEND = new URL(process.env.BACKEND_URL || 'http://localhost:3000');
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

if (!existsSync(join(RAIZ, 'index.html'))) {
  console.error('No encuentro la web compilada. Ejecuta primero: npm run build');
  process.exit(1);
}

function reenviar(req, res) {
  const transporte = BACKEND.protocol === 'https:' ? httpsRequest : httpRequest;
  const ip = req.socket.remoteAddress ?? '';
  const salida = transporte(
    {
      hostname: BACKEND.hostname,
      port: BACKEND.port || (BACKEND.protocol === 'https:' ? 443 : 80),
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: BACKEND.host, 'x-forwarded-for': ip, 'x-forwarded-proto': 'http' },
    },
    (respuesta) => {
      res.writeHead(respuesta.statusCode ?? 502, respuesta.headers);
      respuesta.pipe(res);
    },
  );
  salida.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ message: 'No se pudo conectar con el servidor de SUMA (backend). Verifica que esté encendido.' }));
  });
  req.pipe(salida);
}

function servirArchivo(req, res) {
  const ruta = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
  let archivo = join(RAIZ, ruta);
  if (!archivo.startsWith(RAIZ)) {
    res.writeHead(403).end();
    return;
  }
  const esActivo = existsSync(archivo) && statSync(archivo).isFile();
  if (!esActivo) archivo = join(RAIZ, 'index.html'); // rutas de Angular
  const tipo = TIPOS[extname(archivo)] ?? 'application/octet-stream';
  // Los archivos con hash en el nombre no cambian nunca; index.html y el service worker sí.
  const inmutable = /-[A-Za-z0-9_]{8}\.(js|css)$/.test(archivo);
  res.writeHead(200, {
    'Content-Type': tipo,
    'Cache-Control': inmutable ? 'public, max-age=31536000, immutable' : 'no-cache',
    'X-Content-Type-Options': 'nosniff',
  });
  if (req.method === 'HEAD') res.end();
  else createReadStream(archivo).pipe(res);
}

createServer((req, res) => {
  if (req.url?.startsWith('/api/') || req.url === '/api') reenviar(req, res);
  else servirArchivo(req, res);
}).listen(PUERTO, HOST, () => {
  console.log(`SUMA (web) en http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PUERTO}  →  backend ${BACKEND.origin}`);
  console.log('Para otras computadoras usa la IP de este equipo, por ejemplo http://192.168.1.10:' + PUERTO);
});
