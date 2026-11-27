from pathlib import Path
import json,html
from PIL import Image
R=Path.cwd();T=R/'tmp/uml';out=R/'diagramas/Procesos-RF-2026-11-27'
spec=json.loads((T/'spec.json').read_text(encoding='utf-8'))
manifest=json.loads((T/'manifest.json').read_text(encoding='utf-8'))
excel=json.loads((T/'excel.json').read_text(encoding='utf-8'))
rows={r['values'][0]:r['row'] for r in excel}
e=html.escape
parts=['''<!doctype html><html lang="es"><meta charset="utf-8"><title>SUMA · Actividades, secuencias y trazabilidad</title>
<style>body{font:16px/1.55 system-ui,sans-serif;margin:0;background:#f2f5f7;color:#172c3a}header,main{max-width:1100px;margin:auto;padding:28px}header{background:#143e4c;color:white}h1{font-size:30px;line-height:1.2}h2{font-size:21px}h3{font-size:17px}a{color:#126583}header a{color:white}article{background:white;border:1px solid #d5e0e5;border-radius:10px;margin:20px 0;padding:22px}input{font:inherit;width:95%;padding:12px;border:1px solid #90a8b3;border-radius:6px}table{border-collapse:collapse;width:100%;font-size:14px}td,th{text-align:left;vertical-align:top;border-bottom:1px solid #d9e1e5;padding:8px}.links{display:flex;gap:14px;flex-wrap:wrap}.links a{padding:8px 15px;background:#e9f2f5;border-radius:5px;text-decoration:none}.tag{font-size:13px;color:#45616e}details{margin-top:14px}summary{cursor:pointer;font-weight:600}li{margin:5px 0}footer{padding:25px;text-align:center}small{color:#506672}</style>
<header><h1>SUMA · Actividades y secuencias</h1><p>50 requisitos funcionales · 179 subrequisitos · 100 diagramas UML editables</p><p>Ruta en Enterprise Architect: <b>SUMA → Vista de Procesos → Diagramas de actividades / Diagramas de secuencia → módulo → RF</b>.</p><p>Nombres: <b>ACT-RF-nn - Nombre del caso de uso</b> y <b>SEQ-RF-nn - Nombre del caso de uso</b>.</p></header><main><p>Los diagramas se reconstruyeron desde los casos de uso vigentes y la hoja <b>Req. Funcionales</b> del archivo de requisitos. Las operaciones dentro de cada RF son alternativas. Las secuencias describen responsabilidades de análisis y sus instancias de dominio remiten a clasificadores existentes.</p><p>El modelo original se conserva. En la copia actualizada se eliminaron las actividades y secuencias históricas. Las decisiones tienen preguntas visibles y las uniones están identificadas como «Unir».</p><input id="filter" placeholder="Buscar por RF, nombre o módulo" aria-label="Buscar diagramas"><p id="count"></p>''']
for rf,m in zip(spec,manifest):
    code=rf['code']
    for kind in ['activity','sequence']:
        p=out/f'{code}-{kind}.png'
        with Image.open(p) as im:
            assert im.width>100 and im.height>100,(p,im.size)
            im.verify()
    parts.append(f'<article data-search="{e(code+" "+rf["name"]+" "+rf["module"])}"><div class="tag">{e(rf["module"])}</div><h2>{e(code+" · "+rf["name"])}</h2><div class="links"><a href="{code}-activity.png" target="_blank">Abrir actividad</a><a href="{code}-sequence.png" target="_blank">Abrir secuencia</a></div><p><small>Diagramas nativos: ACT {m["activity"]} · SEQ {m["sequence"]}. Abrir las imágenes a tamaño completo para recorrer diagramas extensos.</small></p>')
    parts.append('<details><summary>Trazabilidad a los casos de uso y al Excel</summary><table><tr><th>Identificador y nombre</th><th>Caso de uso · ID en EA</th><th>Fila Excel</th></tr>')
    for req in rf['requirements']:
        parts.append(f'<tr><td>{e(req["name"])}</td><td>{req["id"]}</td><td>Req. Funcionales · {rows[req["code"]]}</td></tr>')
    parts.append('</table></details><details><summary>Flujos, condiciones y resultados</summary>')
    for s in rf['scenarios']:
        parts.append(f'<h3>{e(s["name"])} · {e(s["actor"])}</h3><p><b>Entrada:</b> {e(s["request"])}<br><b>Comprobación:</b> {e(s["check"])}<br><b>Condición:</b> {e(s["guard"])}<br><b>Alternativa:</b> {e(s["fail"])}</p><ol>')
        for st in s['steps']:
            conditional='Si '+st['when']+': ' if st.get('when') else ''
            otherwise='; en caso contrario: '+st['otherwise'] if st.get('otherwise') else ''
            parts.append(f'<li><b>{e(", ".join(st["refs"]))}</b> — {e(conditional+st["text"]+otherwise)}</li>')
        parts.append('</ol>')
    parts.append('</details></article>')
parts.append('''</main><footer>Revisión del 27 de noviembre de 2026 · 458 relaciones de trazabilidad entre los comportamientos y los casos de uso.</footer><script>const input=document.querySelector('#filter');const cards=[...document.querySelectorAll('article')];function run(){let n=0;const q=input.value.toLocaleLowerCase();for(const card of cards){const show=card.dataset.search.toLocaleLowerCase().includes(q);card.hidden=!show;if(show)n++}document.querySelector('#count').textContent=n+' requisitos mostrados'}input.addEventListener('input',run);run();</script></html>''')
(out/'index.html').write_text(''.join(parts),encoding='utf-8')
(R/'LEEME-Actividades-Secuencias.txt').write_text('''SUMA - Actividades y secuencias
Entrega: SUMA-Diagramas_Vistas_Actividad_Secuencia.eapx

Abrir en Enterprise Architect:
SUMA > Vista de Procesos > Diagramas de actividades / Diagramas de secuencia
Elegir la carpeta del tipo de diagrama, luego módulo y RF. Actividades: ACT-RF-nn. Secuencias: SEQ-RF-nn.

Cobertura: 50 RF, 179 subrequisitos, 50 actividades, 50 secuencias y 109 operaciones alternativas.
Trazabilidad: 458 dependencias UML «trace» desde Activity/Interaction a los casos de uso; las acciones tienen trazas adicionales a sus subrequisitos. Las notas de los elementos conservan los requisitos. Los nombres y descripciones se contrastaron con el Excel.
Referencia de formato: Evaluacion_AUTOSYS_Bim1_completada.pdf, actividad de la página 9. Las instrucciones del ejercicio se trataron como referencia, no como una ampliación del encargo.

Consulta visual y correspondencia con filas Excel:
diagramas/Procesos-RF-2026-11-27/index.html

Se conservaron los casos de uso, clases y actores originales. El archivo original SUMA-Diagramas_Vistas.eapx no fue reemplazado. En la copia actualizada se eliminaron las carpetas históricas de actividades y secuencias. Se rotularon 164 decisiones, se identificaron 21 uniones y se retiraron 16 rombos redundantes.
Las secuencias son modelos de análisis: sus mensajes expresan responsabilidades, no certifican que esas operaciones estén implementadas en el código.
''',encoding='utf-8')
print('Índice y guía creados. Las 100 imágenes PNG se abren sin errores.')
