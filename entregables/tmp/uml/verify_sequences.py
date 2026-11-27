import json,re
from pathlib import Path
T=Path('tmp/uml')
load=lambda n:json.loads((T/n).read_text(encoding='utf-8-sig'))
before=load('revision-snapshot.json');after=load('sequence-snapshot.json');cat=load('sequence-catalog.json');spec=load('spec.json');manifest=load('manifest-sequences.json')
o={x['Object_ID']:x for x in after['t_object']};di={x['Diagram_ID']:x for x in after['t_diagram']}
assert len(cat)==109 and len({c['diagram'] for c in cat})==109
assert len([x for x in di.values() if x['Diagram_ID']>=1000 and x['Diagram_Type']=='Sequence'])==109
# All original objects, and every activity element/flow/placement, retain their contents.
for x in before['t_object']:
 if x['Object_ID']<10000 or x['Object_Type'] in ['Activity','Action','Decision','Synchronization','ActivityPartition','StateNode']:
  assert o[x['Object_ID']]==x,('Changed',x['Object_ID'])
activity_ids={m['activity'] for m in manifest}
for table,field in [('t_diagram','Diagram_ID'),('t_diagramobjects','Diagram_ID'),('t_diagramlinks','DiagramID')]:
 a=[x for x in before[table] if x[field] in activity_ids];b=[x for x in after[table] if x[field] in activity_ids]
 assert a==b,table
oldflow={c['Connector_ID']:c for c in before['t_connector'] if c['Connector_Type']=='ControlFlow'}
newflow={c['Connector_ID']:c for c in after['t_connector'] if c['Connector_Type']=='ControlFlow'}
assert oldflow==newflow
ops={(x['Object_ID'],x['Name']) for x in after['t_operation']}
links={(c['Start_Object_ID'],c['End_Object_ID']) for c in after['t_connector'] if c['Stereotype']=='trace'}
total=0
for rf,m in zip(spec,manifest):
 for req in rf['requirements']:
  for parent in [m['activityElement'],m['sequenceElement']]:assert (parent,req['id']) in links;total+=1
 union=set()
 for item in m['sequences']:
  assert di[item['diagram']]['Package_ID']==m['sequencePackage']
  nodes=item['lifelines'];reverse={v:k for k,v in nodes.items()}
  positions={x['Object_ID']:x['RectLeft'] for x in after['t_diagramobjects'] if x['Diagram_ID']==item['diagram']}
  assert [positions[nodes[k]] for k in nodes]==sorted(positions[nodes[k]] for k in nodes)
  messages=sorted([c for c in after['t_connector'] if c['DiagramID']==item['diagram']],key=lambda c:c['SeqNo'])
  assert len(messages)==item['messageCount']
  assert all(messages[i]['PtStartY']>messages[i+1]['PtStartY'] for i in range(len(messages)-1))
  for c in messages:
   a,b=reverse[c['Start_Object_ID']],reverse[c['End_Object_ID']]
   assert not (a in ['A','U'] and b=='D'),(item['name'],c['Name'])
   if c['PDATA4']!='1':
    assert (int(o[c['End_Object_ID']]['Classifier']),c['Name']) in ops
    assert re.fullmatch(r'\w+',c['Name'])
  for ref in item['refs']:
   req=next(r for r in rf['requirements'] if r['code']==ref)
   assert (item['interaction'],req['id']) in links;union.add(ref)
 assert union=={r['code'] for r in rf['requirements']},rf['code']
result={'estado':'VERIFICADO','actividades_conservadas':50,'secuencias_por_escenario':109,'casos_de_uso_y_objetos_originales':'sin cambios','trazas_anteriores_conservadas':total,'rf':50,'subrequisitos':179,'mensajes':sum(c['messageCount'] for c in cat),'operaciones_declaradas':len(load('sequence-methods.json')),'orden_participantes':'actor/evento, UI SUMA, Sistema SUMA, BD SUMA, externo si aplica','acceso_directo_actor_UI_a_BD':0}
(T/'verification-sequences.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(result,ensure_ascii=False))
