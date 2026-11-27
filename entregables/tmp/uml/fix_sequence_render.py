import json,re
from pathlib import Path
T=Path('tmp/uml');d=json.loads((T/'sequence-snapshot.json').read_text(encoding='utf-8-sig'))
cat=json.loads((T/'sequence-catalog.json').read_text(encoding='utf-8'))
di={c['diagram'] for c in cat};sql=[]
def q(v):return "'"+v.replace("'","''")+"'"
for x in d['t_diagram']:
 if x['Diagram_ID'] in di:
  pdata=x['PDATA'].replace('ShowSN=1','ShowSN=0').replace('OpParams=0','OpParams=3')
  style=x['StyleEx'].replace('SuppressBrackets=1','SuppressBrackets=0')
  sql.append(f"UPDATE t_diagram SET PDATA={q(pdata)},StyleEx={q(style)} WHERE Diagram_ID={x['Diagram_ID']}")
obj={o['ea_guid']:o for o in d['t_object']}
for x in d['t_xref']:
 if x['Name']=='Partitions' and x['Client'] in obj and obj[x['Client']]['PDATA1'] in [str(v) for v in di]:
  parts=re.findall(r'@PAR;.*?@ENDPAR;',x['Description'],re.S)
  if len(parts)>1:
   # Native EA serializes operands from bottom to top.
   parts[0]=re.sub(r'Size=(\d+)',lambda m:'Size='+str(int(m[1])+20),parts[0])
   desc=''.join(reversed(parts))
   sql.append(f"UPDATE t_xref SET Description={q(desc)} WHERE XrefID={q(x['XrefID'])}")
(T/'sequence-render.sql.json').write_text(json.dumps(sql,ensure_ascii=False),encoding='utf-8')
print(len(sql),'ajustes de presentación')
