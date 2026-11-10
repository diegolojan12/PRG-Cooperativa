import { errorDeDominio as error } from './acceso.mjs';

export function reporteCSV(res, nombre, filas, csv) {
  return res
    .attachment(nombre)
    .type('text/csv')
    .send('\uFEFF' + filas.map((f) => f.map(csv).join(',')).join('\r\n'));
}

export async function participacion(db) {
  const retos = await db.query(
    `SELECT r.id,r.titulo,COUNT(p."usuarioId") AS participantes,COUNT(p.completado) AS completaron
      FROM "Reto" r LEFT JOIN "ProgresoReto" p ON p."retoId"=r.id GROUP BY r.id,r.titulo ORDER BY r.titulo,r.id`,
  );
  const [trivia] = await db.query(
    `SELECT COUNT(DISTINCT "usuarioId") AS participantes,
      COUNT(DISTINCT CASE WHEN completada=1 THEN "usuarioId" END) AS completaron FROM "PartidaTrivia"`,
  );
  return [
    ...retos.map((r) => ({ ...r, tipo: 'RETO' })),
    { ...trivia, id: 'trivia', titulo: 'Trivia financiera', tipo: 'JUEGO' },
  ].map(({ id, titulo, tipo, participantes, completaron }) => ({
    id,
    titulo,
    tipo,
    participantes: Number(participantes),
    porcentaje: Number(participantes)
      ? Math.round((Number(completaron) * 1000) / Number(participantes)) / 10
      : 0,
  }));
}

export function rutasReportes({
  db,
  route,
  admin,
  fecha,
  inicioDelDia,
  finDelDia,
  csv,
  indicadores,
}) {
  route('get', '/indicadores/exportar', async (req, res) => {
    await admin(req, 'panel');
    const datos = await indicadores();
    const filas = [
      ['Indicador', 'Valor', 'Unidad'],
      ...datos.indicadores.map((i) => [i.etiqueta, i.valor, i.unidad]),
      ['Costo por captación', datos.costoCaptacion ?? '', 'USD'],
      ['Generado en', datos.generadoEn, ''],
      [],
      ['Tipo', 'Actividad', 'Participantes', 'Porcentaje completado'],
      ...datos.participacion.map((p) => [
        p.tipo,
        p.titulo,
        p.participantes,
        p.porcentaje,
      ]),
    ];
    reporteCSV(res, 'SUMA-indicadores.csv', filas, csv);
  });
  route('get', '/reportes/referidos', async (req, res) => {
    await admin(req, 'referidos');
    const desde = fecha(req.query.desde, 'desde'),
      hasta = fecha(req.query.hasta, 'hasta');
    if (!desde || !hasta || desde > hasta)
      throw error('Selecciona un rango de fechas válido.');
    const a = new Date(desde + 'T00:00:00Z');
    a.setUTCFullYear(a.getUTCFullYear() + 1);
    if (hasta >= a.toISOString().slice(0, 10))
      throw error('El rango máximo es de doce meses.');
    const filas = await db.query(
      `SELECT r.id,r.nombre,r.campania,r.provincia,r.estado,r."creadoEn",u.nombre AS socio
        FROM "Referido" r JOIN "Usuario" u ON u.id=r."socioId"
        WHERE r."eliminadoEn" IS NULL AND r."creadoEn">=$1 AND r."creadoEn"<=$2 ORDER BY r."creadoEn",r.id`,
      [inicioDelDia(desde), finDelDia(hasta)],
    );
    const conversion = filas.length
      ? Math.round(
          (filas.filter((r) => r.estado === 'APROBADO').length * 1000) /
            filas.length,
        ) / 10
      : 0;
    reporteCSV(
      res,
      'SUMA-conversion-referidos.csv',
      [
        [
          'Referido',
          'Socio',
          'Campaña',
          'Provincia',
          'Estado',
          'Fecha',
          'Conversión (%)',
        ],
        ...filas.map((r) => [
          r.nombre,
          r.socio,
          r.campania,
          r.provincia,
          r.estado,
          r.creadoEn,
          conversion,
        ]),
      ],
      csv,
    );
  });
}
