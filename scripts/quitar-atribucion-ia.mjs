#!/usr/bin/env node
/**
 * Detecta y elimina atribuciones de herramientas de IA en mensajes de commit,
 * textos de Pull Request y comentarios (coautores, "generado con...", etc.).
 *
 * Uso:
 *   node scripts/quitar-atribucion-ia.mjs mensaje <archivo>   limpia el archivo de mensaje (hook commit-msg)
 *   node scripts/quitar-atribucion-ia.mjs revisar [rango]     lista commits con atribución; sale con 1 si hay (hook pre-push)
 *   node scripts/quitar-atribucion-ia.mjs corregir [rango]    reescribe SOLO commits aún no publicados
 *   node scripts/quitar-atribucion-ia.mjs texto               lee stdin y escribe el texto limpio (para cuerpos de PR)
 *   node scripts/quitar-atribucion-ia.mjs pr <numero>         limpia título y cuerpo de un PR existente (usa gh)
 *   node scripts/quitar-atribucion-ia.mjs instalar            instala los hooks en este clon
 *   node scripts/quitar-atribucion-ia.mjs instalar-global     instala los hooks para TODOS tus repositorios
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ESTE_ARCHIVO = fileURLToPath(import.meta.url);

/* Nombres de herramientas de IA que se reconocen. Agrega aquí las que falten. */
const HERRAMIENTAS =
  'claude|anthropic|copilot|chatgpt|openai|gpt-?\\d|gemini|codex|cursor|devin|aider|windsurf|codeium|tabnine|llama|mistral|deepseek|grok|perplexity';

/* Cada patrón se evalúa línea por línea; la línea que coincide se elimina. */
const PATRONES = [
  // Trailers de coautoría: "Co-Authored-By: Claude <noreply@anthropic.com>"
  new RegExp(`^\\s*co-authored-by:.*(${HERRAMIENTAS}).*$`, 'i'),
  new RegExp('^\\s*co-authored-by:.*@(anthropic|openai)\\.com.*$', 'i'),
  // "Generated with ...", "Generado con ...", "Asistido por ..." junto a una herramienta o a "IA".
  new RegExp(
    `^.*\\b(generated|created|written|assisted|authored|made|co-authored|generado|creado|escrito|asistido|hecho|redactado|desarrollado)\\b.*\\b(with|by|using|con|por|usando|mediante)\\b.*(${HERRAMIENTAS}|\\bIA\\b|\\bAI\\b|inteligencia artificial|artificial intelligence).*$`,
    'i',
  ),
  // Enlaces típicos de pie de PR/commit.
  /^.*(claude\.com\/claude-code|claude\.ai\/code|anthropic\.com).*$/i,
  // Líneas que empiezan con el emoji de robot.
  /^\s*🤖.*$/u,
];

/** Devuelve true si la línea es una atribución de IA. */
export const esAtribucion = (linea) => PATRONES.some((p) => p.test(linea));

/**
 * Limpia un texto. La primera línea (asunto) nunca se borra y las líneas de comentario
 * de git (#) se respetan. Deja el texto sin espacios sobrantes al final.
 */
export function limpiar(texto) {
  const lineas = texto.replace(/\r\n/g, '\n').split('\n');
  let primera = true;
  const conservadas = lineas.filter((linea) => {
    const esAsunto = primera && linea.trim() !== '' && !linea.startsWith('#');
    if (esAsunto) primera = false;
    if (esAsunto || linea.startsWith('#')) return true;
    return !esAtribucion(linea);
  });
  // Colapsa los saltos en blanco que quedan tras borrar un bloque de atribución.
  return conservadas.join('\n').replace(/\n{3,}/g, '\n\n').replace(/\s+$/, '') + '\n';
}

/** True si el texto trae alguna línea de atribución (sin contar el asunto ni los comentarios de git). */
export function tieneAtribucion(texto) {
  const [, ...resto] = texto.replace(/\r\n/g, '\n').split('\n');
  return resto.some((l) => !l.startsWith('#') && esAtribucion(l));
}

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const gitSeguro = (...args) => {
  const r = spawnSync('git', args, { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : null;
};

/** Rango de commits aún no publicados: contra la rama remota o, si no existe, contra main. */
function rangoPorDefecto() {
  if (gitSeguro('rev-parse', '--abbrev-ref', '@{u}')) return '@{u}..HEAD';
  for (const base of ['origin/main', 'origin/master', 'main', 'master'])
    if (gitSeguro('rev-parse', '--verify', base)) return `${base}..HEAD`;
  return 'HEAD';
}

/** Commits del rango cuyo mensaje contiene atribuciones. */
function commitsConAtribucion(rango) {
  const hashes = git('rev-list', rango).split('\n').filter(Boolean);
  return hashes.filter((h) => tieneAtribucion(git('log', '-1', '--format=%B', h)));
}

function comandoMensaje(archivo) {
  const original = readFileSync(archivo, 'utf8');
  if (tieneAtribucion(original)) {
    writeFileSync(archivo, limpiar(original));
    console.error('[atribución-ia] Se quitó una atribución del mensaje del commit.');
  }
}

function comandoRevisar(rango = rangoPorDefecto()) {
  const sucios = commitsConAtribucion(rango);
  if (!sucios.length) return 0;
  console.error(`\n[atribución-ia] Hay ${sucios.length} commit(s) con atribución de IA en ${rango}:`);
  for (const h of sucios) console.error(`  ${h.slice(0, 7)}  ${git('log', '-1', '--format=%s', h)}`);
  console.error('\nCorrígelos con:  node scripts/quitar-atribucion-ia.mjs corregir\nLuego vuelve a hacer push.\n');
  return 1;
}

function comandoCorregir(rango = rangoPorDefecto()) {
  if (gitSeguro('status', '--porcelain')) throw new Error('Tienes cambios sin guardar. Haz commit o stash antes de corregir.');
  const sucios = commitsConAtribucion(rango);
  if (!sucios.length) return console.log('No hay atribuciones que corregir en ' + rango);
  // Solo commits no publicados: reescribir historial ya compartido obliga a forzar el push y rompe a los demás.
  const publicados = gitSeguro('branch', '-r', '--contains', sucios[sucios.length - 1]);
  if (publicados) throw new Error(`El commit ${sucios[sucios.length - 1].slice(0, 7)} ya está publicado (${publicados.split('\n')[0].trim()}). No se reescribe.`);
  const filtro = `node "${ESTE_ARCHIVO.replace(/\\/g, '/')}" texto`;
  const r = spawnSync('git', ['filter-branch', '-f', '--msg-filter', filtro, rango], {
    stdio: 'inherit',
    env: { ...process.env, FILTER_BRANCH_SQUELCH_WARNING: '1' },
  });
  if (r.status !== 0) throw new Error('git filter-branch falló.');
  console.log(`Corregidos ${sucios.length} commit(s).`);
}

const leerStdin = () => readFileSync(0, 'utf8');

function comandoPr(numero) {
  const datos = JSON.parse(execFileSync('gh', ['pr', 'view', numero, '--json', 'title,body'], { encoding: 'utf8' }));
  const cuerpoOriginal = datos.body ?? '';
  // El título es una sola línea: se revisa como cuerpo para poder detectar la atribución.
  if (!tieneAtribucion('.\n' + cuerpoOriginal) && !esAtribucion(datos.title)) return console.log('El PR ya está limpio.');
  const titulo = esAtribucion(datos.title) ? datos.title.replace(/\s*[-—–]?\s*$/, '') : datos.title;
  const cuerpo = limpiar('.\n' + cuerpoOriginal).replace(/^\.\n/, '');
  const tmp = join(process.env.TEMP || '/tmp', `pr-${numero}-limpio.md`);
  writeFileSync(tmp, cuerpo);
  execFileSync('gh', ['pr', 'edit', numero, '--title', titulo, '--body-file', tmp], { stdio: 'inherit' });
  console.log('PR actualizado sin atribuciones.');
}

/* ---------- Instalación de hooks ---------- */
const script = (cuerpo) => `#!/bin/sh\n${cuerpo}\n`;
function escribirHook(carpeta, nombre, contenido) {
  mkdirSync(carpeta, { recursive: true });
  const ruta = join(carpeta, nombre);
  writeFileSync(ruta, contenido);
  try {
    chmodSync(ruta, 0o755);
  } catch {
    /* En Windows el bit de ejecución no aplica. */
  }
  return ruta;
}

function instalar(carpeta, rutaScript) {
  const ruta = rutaScript.replace(/\\/g, '/');
  escribirHook(carpeta, 'commit-msg', script(`node "${ruta}" mensaje "$1"`));
  escribirHook(carpeta, 'pre-push', script(`node "${ruta}" revisar || exit 1`));
  console.log(`Hooks commit-msg y pre-push instalados en ${carpeta}`);
}

function comandoInstalar() {
  const carpeta = resolve(git('rev-parse', '--git-path', 'hooks'));
  const configurado = gitSeguro('config', 'core.hooksPath');
  if (configurado) console.log(`Aviso: core.hooksPath = ${configurado}. Los hooks se instalan ahí.`);
  instalar(carpeta, ESTE_ARCHIVO);
}

function comandoInstalarGlobal() {
  const destino = join(homedir(), '.config', 'git', 'hooks-sin-ia');
  const copia = join(destino, 'quitar-atribucion-ia.mjs');
  mkdirSync(destino, { recursive: true });
  writeFileSync(copia, readFileSync(ESTE_ARCHIVO));
  instalar(destino, copia);
  execFileSync('git', ['config', '--global', 'core.hooksPath', destino.replace(/\\/g, '/')]);
  console.log('core.hooksPath global configurado. Para deshacerlo: git config --global --unset core.hooksPath');
  console.log('Nota: los repositorios con su propio core.hooksPath (por ejemplo los que usan husky) conservan el suyo.');
}

/* ---------- Entrada ---------- */
if (process.argv[1] && resolve(process.argv[1]) === ESTE_ARCHIVO) {
  const [orden, argumento] = process.argv.slice(2);
  try {
    if (orden === 'mensaje') comandoMensaje(argumento);
    else if (orden === 'revisar') process.exitCode = comandoRevisar(argumento);
    else if (orden === 'corregir') comandoCorregir(argumento);
    else if (orden === 'texto') process.stdout.write(limpiar(leerStdin()));
    else if (orden === 'pr') comandoPr(argumento);
    else if (orden === 'instalar') comandoInstalar();
    else if (orden === 'instalar-global') comandoInstalarGlobal();
    else {
      console.error('Órdenes: mensaje <archivo> | revisar [rango] | corregir [rango] | texto | pr <n> | instalar | instalar-global');
      process.exitCode = 2;
    }
  } catch (error) {
    console.error(`[atribución-ia] ${error.message}`);
    process.exitCode = 1;
  }
}
