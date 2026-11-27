import json
from pathlib import Path
T=Path('tmp/uml')
d=json.loads((T/'revision-snapshot.json').read_text(encoding='utf-8-sig'))
m=json.loads((T/'manifest.json').read_text(encoding='utf-8-sig'))
p={x['Package_ID']:x for x in d['t_package']}
o={x['Object_ID']:x for x in d['t_object']}
di={x['Diagram_ID']:x for x in d['t_diagram']}
assert not set(range(19,83))&p.keys()
assert {x['Name'] for x in p.values() if x['Parent_ID']==15}=={'Diagramas de actividades','Diagramas de secuencia'}
for rf in m:
 for kind in ['activity','sequence']:
  pid=di[rf[kind]]['Package_ID']
  assert pid==rf[kind+'Package']
  while p[pid]['Parent_ID']!=15:pid=p[pid]['Parent_ID']
  assert pid==rf[kind+'Root']
for x in o.values():
 if x['Object_ID']<10000 or x['Object_Type']!='Decision':continue
 assert x['Name'].strip()
 flows=[c for c in d['t_connector'] if c['Connector_Type']=='ControlFlow' and c['Start_Object_ID']==x['Object_ID']]
 if len(flows)>1:
  assert x['Name'].startswith('¿')
  assert all(c['PDATA2'] for c in flows)
 else: assert x['Name']=='Unir'
print('Carpetas, eliminación de históricos y todos los rombos: verificados.')
overlaps=[]
for rf in m:
 nodes=[x for x in d['t_diagramobjects'] if x['Diagram_ID']==rf['activity'] and o[x['Object_ID']]['Object_Type']!='ActivityPartition']
 for i,a in enumerate(nodes):
  for b in nodes[i+1:]:
   if min(a['RectRight'],b['RectRight'])>max(a['RectLeft'],b['RectLeft']) and min(-a['RectBottom'],-b['RectBottom'])>max(-a['RectTop'],-b['RectTop']):overlaps.append((rf['code'],a['Object_ID'],b['Object_ID']))
assert not overlaps,overlaps
print('Sin superposiciones entre nodos de actividad.')
s=T/'deliver_index.py'
txt=s.read_text(encoding='utf-8')
txt=txt.replace('01 Actividades y secuencias - Casos de uso RF','Diagramas de actividades / Diagramas de secuencia')
txt=txt.replace('En la copia nueva, las actividades y secuencias previas están identificadas como <b>HISTÓRICO</b>.','En la copia actualizada se eliminaron las actividades y secuencias históricas. Las decisiones tienen preguntas visibles y las uniones están identificadas como «Unir».')
txt=txt.replace('Elegir módulo y RF. Cada carpeta contiene ACT-RF-nn y SEQ-RF-nn.','Elegir la carpeta del tipo de diagrama, luego módulo y RF. Actividades: ACT-RF-nn. Secuencias: SEQ-RF-nn.')
txt=txt.replace('Se conservaron todos los elementos, conectores, diagramas y posiciones originales. El archivo original SUMA-Diagramas_Vistas.eapx no fue reemplazado. En la copia nueva, las carpetas antiguas de actividades y secuencias están identificadas como HISTÓRICO.','Se conservaron los casos de uso, clases y actores originales. El archivo original SUMA-Diagramas_Vistas.eapx no fue reemplazado. En la copia actualizada se eliminaron las carpetas históricas de actividades y secuencias. Se rotularon 164 decisiones, se identificaron 21 uniones y se retiraron 16 rombos redundantes.')
s.write_text(txt,encoding='utf-8')
