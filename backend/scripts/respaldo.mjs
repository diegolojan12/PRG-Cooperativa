import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';

/**
 * RNF-08 · RNF-09 · RNF-13 · RF-47-3: respaldo completo y diario de la base de SUMA.
 *
 * - Genera 1 archivo `suma-AAAA-MM-DD.dump` (formato personalizado de pg_dump) por día.
 * - Conserva los respaldos diarios de los últimos 35 días y, además, el del día 1 de cada mes
 *   durante 5 años, de modo que la bitácora y la evidencia de consentimiento se pueden
 *   recuperar durante el plazo exigido (la tabla "Actividad" es inmutable y nunca se borra).
 * - Restauración (RNF-09, máximo 4 horas):
 *     pg_restore --clean --if-exists --no-owner -d "$DATABASE_URL" respaldos/suma-AAAA-MM-DD.dump
 *
 * Variables: DATABASE_URL (obligatoria), SUMA_RESPALDOS (carpeta, por defecto ../respaldos)
 * y PG_BIN (carpeta de pg_dump si no está en el PATH, por ejemplo C:\Program Files\PostgreSQL\16\bin).
 * Programar en Windows (todos los días a las 02:00):
 *     schtasks /Create /SC DAILY /ST 02:00 /TN "SUMA respaldo" /TR "cmd /c cd /d <ruta>\backend && npm run db:respaldo"
 * En Linux: `0 2 * * * cd /ruta/backend && npm run db:respaldo` en crontab.
 */
const DIAS_DIARIOS = 35;
const ANIOS_MENSUALES = 5;

const url = process.env.DATABASE_URL;
if (!/^postgres(ql)?:\/\//.test(url ?? ''))
  throw new Error('Define DATABASE_URL en backend/.env con la URL de PostgreSQL.');
const carpeta = path.resolve(process.env.SUMA_RESPALDOS || path.join(import.meta.dirname, '..', 'respaldos'));
mkdirSync(carpeta, { recursive: true });

const ejecutable = (nombre) => {
  const exe = process.platform === 'win32' ? nombre + '.exe' : nombre;
  if (process.env.PG_BIN) return path.join(process.env.PG_BIN, exe);
  if (process.platform === 'win32')
    for (const version of ['17', '16', '15']) {
      const ruta = `C:\\Program Files\\PostgreSQL\\${version}\\bin\\${exe}`;
      if (existsSync(ruta)) return ruta;
    }
  return exe;
};

const hoy = new Date().toISOString().slice(0, 10);
const destino = path.join(carpeta, `suma-${hoy}.dump`);
const resultado = spawnSync(ejecutable('pg_dump'), ['--format=custom', '--no-owner', '--file', destino, url], {
  stdio: ['ignore', 'inherit', 'inherit'],
});
if (resultado.error || resultado.status !== 0) {
  console.error('No se pudo generar el respaldo:', resultado.error?.message ?? `pg_dump terminó con código ${resultado.status}`);
  process.exit(1);
}
const bytes = statSync(destino).size;
if (bytes === 0) {
  console.error('El respaldo quedó vacío. Revisa la conexión con la base.');
  process.exit(1);
}
console.log(`Respaldo generado: ${destino} (${(bytes / 1024).toFixed(1)} KB)`);

// Política de conservación.
const ahora = Date.now();
for (const archivo of readdirSync(carpeta)) {
  const fecha = archivo.match(/^suma-(\d{4}-\d{2}-\d{2})\.dump$/)?.[1];
  if (!fecha) continue;
  const dias = (ahora - Date.parse(fecha + 'T00:00:00Z')) / 86_400_000;
  const mensual = fecha.endsWith('-01');
  const conservar = dias <= DIAS_DIARIOS || (mensual && dias <= ANIOS_MENSUALES * 366);
  if (!conservar) {
    rmSync(path.join(carpeta, archivo));
    console.log('Respaldo vencido eliminado:', archivo);
  }
}
