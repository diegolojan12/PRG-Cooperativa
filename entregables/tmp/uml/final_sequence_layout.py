import json
from pathlib import Path
T=Path('tmp/uml');d=json.loads((T/'sequence-snapshot.json').read_text(encoding='utf-8-sig'));cat=json.loads((T/'sequence-catalog.json').read_text(encoding='utf-8'));sql=[]
for c in cat:
 for k,e in c['lifelines'].items():
  if k!='A':sql.append(f"UPDATE t_diagramobjects SET RectTop=-50 WHERE Diagram_ID={c['diagram']} AND Object_ID={e}")
objects={x['Object_ID']:x for x in d['t_object']}
for x in d['t_diagramobjects']:
 o=objects[x['Object_ID']]
 if o['Object_Type']=='InteractionFragment' and o['NType'] in [3,4] and x['Diagram_ID'] in {c['diagram'] for c in cat}:
  sql.append(f"UPDATE t_diagramobjects SET RectBottom={x['RectBottom']+25} WHERE Instance_ID={x['Instance_ID']}")
(T/'sequence-layout.sql.json').write_text(json.dumps(sql),encoding='utf-8')
