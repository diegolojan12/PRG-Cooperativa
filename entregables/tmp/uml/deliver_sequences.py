from pathlib import Path
import json,html
from PIL import Image
R=Path.cwd();T=R/'tmp/uml';out=R/'diagramas/Procesos-RF-2026-11-27'
load=lambda n:json.loads((T/n).read_text(encoding='utf-8-sig'))
spec=load('spec.json');manifest=load('manifest-sequences.json');excel=load('excel.json');rows={r['values'][0]:r['row'] for r in excel};e=html.escape
parts=['''<!doctype html><html lang="es"><meta charset="utf-8"><title>SUMA · Actividades y secuencias</title><style>body{font:16px/1.6 system-ui;margin:0;background:#f2f5f7;color:#172c3a}header,main{max-width:1100px;margin:auto;padding:28px}header{background:#143e4c;color:white}h1{line-height:1.2}h2{font-size:22px}article{background:white;border:1px solid #d5e0e5;border-radius:10px;margin:20px 0;padding:24px}a{color:#126583}input{font:inherit;width:95%;padding:12px;border:1px solid #90a8b3;border-radius:6px}table{border-collapse:collapse;width:100%;font-size:14px}td,th{border-bottom:1px solid #d9e1e5;padding:8px;text-align:left;vertical-align:top}li{margin:10px 0}summary{cursor:pointer;font-weight:600}.tag,small{color:#506672}footer{text-align:center;padding:24px}</style><header><h1>SUMA · Actividades y secuencias</h1><p>50 RF · 179 subrequisitos · 50 actividades · 109 secuencias por escenario</p><p>Enterprise Architect: <b>SUMA → Vista de Procesos → Diagramas de actividades / Diagramas de secuencia → módulo → RF</b>.</p><p>Secuencias: actor participante → UI SUMA → Sistema SUMA → BD SUMA → servicio externo, cuando aplica.</p></header><main><p>Las secuencias siguen el formato de las diapositivas 9–20 de la referencia: operaciones con parámetros, retornos de datos, activaciones, alternativas <b>alt</b>, opciones <b>opt</b>, bucles <b>loop</b>, consultas paralelas <b>par</b> y referencias <b>ref</b>. Cada escenario tiene su propio diagrama y trazabilidad a los casos de uso.</p><p>Los escenarios automáticos se inician mediante un evento o temporizador, sin simular una intervención humana en la interfaz. La UI se mantiene en la segunda posición y participa cuando existe presentación. Las clases de contrato UI SUMA, Sistema SUMA y BD SUMA contienen las operaciones usadas por sus secuencias; representan el diseño de análisis.</p><input id="filter" placeholder="Buscar RF, nombre, módulo o escenario" aria-label="Buscar"><p id="count"></p>''']
for rf,m in zip(spec,manifest):
 code=rf['code'];paths=[out/f'{code}-activity.png']+[out/c['file'] for c in m['sequences']]
 for p in paths:
  with Image.open(p) as im:assert im.width>100 and im.height>100;im.verify()
 search=' '.join([code,rf['name'],rf['module']]+[c['title'] for c in m['sequences']])
 parts.append(f'<article data-search="{e(search)}"><div class="tag">{e(rf["module"])}</div><h2>{e(code+" · "+rf["name"])}</h2><p><a href="{code}-activity.png" target="_blank">Abrir diagrama de actividad</a></p><h3>Diagramas de secuencia</h3><ol>')
 for c in m['sequences']:parts.append(f'<li><a href="{e(c["file"])}" target="_blank">{e(c["name"])}</a><br><small>{e(c["actor"])} · {e(", ".join(c["refs"]))}</small></li>')
 parts.append('</ol><details><summary>Trazabilidad con los casos de uso y el Excel</summary><table><tr><th>Requisito</th><th>ID del caso de uso en EA</th><th>Fila Excel</th></tr>')
 for req in rf['requirements']:parts.append(f'<tr><td>{e(req["name"])}</td><td>{req["id"]}</td><td>{rows[req["code"]]}</td></tr>')
 parts.append('</table></details></article>')
parts.append('''</main><footer>Revisión de secuencias · 27 de noviembre de 2026</footer><script>const input=document.querySelector('#filter'),cards=[...document.querySelectorAll('article')];function run(){let n=0;for(const c of cards){const ok=c.dataset.search.toLocaleLowerCase().includes(input.value.toLocaleLowerCase());c.hidden=!ok;if(ok)n++}document.querySelector('#count').textContent=n+' requisitos mostrados'}input.addEventListener('input',run);run()</script></html>''')
(out/'index.html').write_text(''.join(parts),encoding='utf-8')
(T/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
(R/'LEEME-Actividades-Secuencias.txt').write_text('''SUMA - Actividades y secuencias
Modelo: SUMA-Diagramas_Vistas_Actividad_Secuencia.eapx

SUMA > Vista de Procesos > Diagramas de actividades / Diagramas de secuencia > módulo > RF
50 diagramas ACT-RF-nn y 109 diagramas SEQ-RF-nn-ss - Nombre del escenario.
Cobertura: 50 RF y 179 subrequisitos. Casos de uso y actividades conservados.
Cada secuencia tiene su propia interacción y trazas UML a los requisitos que desarrolla. Se mantienen las 458 trazas previas de los comportamientos RF.

Orden: actor/evento, UI SUMA, Sistema SUMA, BD SUMA, servicio externo cuando corresponde.
Los eventos automáticos entran al sistema sin inventar una intervención del usuario. La interfaz aparece en la segunda posición, aunque no participa si el proceso no presenta datos.
La base de datos consulta y persiste; las reglas se modelan en Sistema SUMA. Los contratos de análisis del paquete de cada RF declaran las operaciones empleadas. No son una certificación de implementación en código.
Se usan alt, opt, loop, par y ref según el escenario. Los argumentos y retornos se muestran, y los ref enlazan otras interacciones.
Referencia de secuencias: Semana 6-7 – Diagramas de interacción y actividades_vfinal.pdf, diapositivas 9 a 20.
Referencia previa de actividades: Evaluacion_AUTOSYS_Bim1_completada.pdf.

Índice visual: diagramas/Procesos-RF-2026-11-27/index.html
Imágenes de secuencia: diagramas/Procesos-RF-2026-11-27/secuencias/
Las carpetas históricas se eliminaron del modelo entregado. Se mantiene el archivo fuente original y respaldos fuera de sus vistas.
''',encoding='utf-8')
print('Índice actualizado; 159 imágenes verificadas.')
