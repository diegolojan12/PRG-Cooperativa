import json,re
from pathlib import Path
T=Path('tmp/uml');d=json.loads((T/'sequence-snapshot.json').read_text(encoding='utf-8-sig'))
cat=json.loads((T/'sequence-catalog.json').read_text(encoding='utf-8'));di={c['diagram'] for c in cat};sql=[]
def q(v):return "'"+v.replace("'","''")+"'"
for x in d['t_connector']:
 if x['DiagramID'] not in di or x['Connector_Type']!='Sequence':continue
 name=x['Name'];args=''
 if x['PDATA4']!='1':
  match=re.fullmatch(r'(\w+)\((.*)\)',name);assert match,name
  name,args=match.groups()
 elif name=='error(causa)':name='error: causa'
 sql.append(f"UPDATE t_connector SET Name={q(name)},PDATA2={q('retval=;params='+args+';')} WHERE Connector_ID={x['Connector_ID']}")
for c in cat:
 sql.append(f"UPDATE t_diagram SET StyleEx='ShowNotes=0;SuppressBrackets=1;SuppConnectorLabels=0;Theme=:0;' WHERE Diagram_ID={c['diagram']}")
 for k,e in c['lifelines'].items():
  if k=='A':continue
  x=next(v for v in d['t_diagramobjects'] if v['Diagram_ID']==c['diagram'] and v['Object_ID']==e)
  sql.append(f"UPDATE t_diagramobjects SET RectLeft={x['RectLeft']+40},RectRight={x['RectRight']-40} WHERE Diagram_ID={c['diagram']} AND Object_ID={e}")
(T/'sequence-arguments.sql.json').write_text(json.dumps(sql,ensure_ascii=False),encoding='utf-8')
