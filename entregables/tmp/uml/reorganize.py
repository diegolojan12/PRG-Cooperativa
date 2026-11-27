import json,uuid,re,textwrap
from pathlib import Path
T=Path('tmp/uml');d=json.loads((T/'revision-snapshot.json').read_text(encoding='utf-8-sig'))
m=json.loads((T/'manifest.json').read_text(encoding='utf-8'))
objects={o['Object_ID']:o for o in d['t_object']};packages={p['Package_ID']:p for p in d['t_package']}
sql=[]
def v(x):
    if x is None:return 'NULL'
    if isinstance(x,(int,float)):return str(x)
    return "'"+str(x).replace("'","''")+"'"
def upd(t,where,**values):sql.append('UPDATE '+t+' SET '+','.join('['+k+']='+v(x) for k,x in values.items())+' WHERE '+where)
def ins(t,**values):sql.append('INSERT INTO '+t+' ('+','.join('['+k+']' for k in values)+') VALUES ('+','.join(v(x) for x in values.values())+')')
pid=max(packages);oid=max(objects)
def package(parent,name):
    global pid,oid
    pid+=1;oid+=1;g='{'+str(uuid.uuid4()).upper()+'}'
    ins('t_package',Package_ID=pid,Name=name,Parent_ID=parent,ea_guid=g)
    ins('t_object',Object_ID=oid,Object_Type='Package',Name=name,Package_ID=parent,PDATA1=str(pid),ea_guid=g,ParentID=0)
    return pid
root=1001
upd('t_package','Package_ID=1001',Name='Diagramas de actividades',Notes='50 diagramas ACT-RF, organizados por módulo y requisito funcional.')
for o in objects.values():
    if o['Object_Type']=='Package' and str(o.get('PDATA1'))=='1001':upd('t_object','Object_ID='+str(o['Object_ID']),Name='Diagramas de actividades')
seqroot=package(15,'Diagramas de secuencia');mods={}
for rf in m:
    if rf['module'] not in mods:mods[rf['module']]=package(seqroot,rf['module'])
    dest=package(mods[rf['module']],rf['code']+' '+rf['name'])
    moved={rf['sequenceElement']}
    while True:
        extra={o['Object_ID'] for o in objects.values() if o['ParentID'] in moved}-moved
        if not extra:break
        moved|=extra
    upd('t_object','Object_ID IN ('+','.join(map(str,moved))+')',Package_ID=dest)
    upd('t_diagram','Diagram_ID='+str(rf['sequence']),Package_ID=dest)
    rf['activityPackage']=rf['package'];rf['sequencePackage']=dest
    rf['activityRoot']=root;rf['sequenceRoot']=seqroot

short={
'Ahorros o Corriente y cuenta no vinculada a otro usuario':'¿Tipo y unicidad válidos?',
'registro público o creador administrador autorizado':'¿Creación de cuenta autorizada?',
'entero o texto ≤500; puntos 0–10000; valor monetario con 2 decimales':'¿Valor válido para el parámetro?',
'fin > inicio; título ≤100; puntos 1–10000; 1–8 provincias; sin solapamiento':'¿Campaña válida sin superposición?',
'existencia, titularidad y condición habilitada confirmadas':'¿Cuenta institucional habilitada?',
'texto ≤500; imagen JPG/PNG ≤2 MB; edición por autor':'¿Contenido y autoría válidos?',
'inactivar existente o crear con tipo válido y meta ≥1':'¿Operación de insignia válida?',
'finalizar existente o crear con fin > inicio y meta 1–1000':'¿Operación de reto válida?',
'Abierta a En atención o En atención a Cerrada con respuesta ≤1000 y sin respuesta previa':'¿Transición y respuesta válidas?',
'Pendiente a Listo para retiro o Listo para retiro a Entregado':'¿Siguiente estado permitido?',
'Nutrición, Actividad física, Salud mental o Prevención':'¿Categoría de salud permitida?',
'alta sin reacción previa o retirada con reacción existente':'¿Cambio de reacción permitido?',
'informativa con 30 días; no alerta protegida por RF-38':'¿Notificación informativa vencida?',
'material ≤50 MB; al menos 1 material y 5 preguntas':'¿Material y cuestionario válidos?',
'enlace válido y contraseña ≥8 con mayúscula y número':'¿Enlace y contraseña válidos?',
'administrador autorizado y datos actualizados a ≤24 h':'¿Acceso válido y datos vigentes?',
'administrador autorizado y roles base preservados':'¿Cambio autorizado y roles protegidos?',
'2–10 niveles, umbrales enteros únicos y crecientes':'¿Niveles y umbrales válidos?',
'avance >0 %; faltan 72–73 horas; aviso no emitido':'¿Reto elegible para recordatorio?',
}
flows=[c for c in d['t_connector'] if c['Connector_Type']=='ControlFlow']
incoming={};outgoing={}
for c in flows:incoming.setdefault(c['End_Object_ID'],[]).append(c);outgoing.setdefault(c['Start_Object_ID'],[]).append(c)
stats={'decisiones_rotuladas':0,'uniones_identificadas':0,'rombos_redundantes_retirados':0}
changes=[]
for o in objects.values():
    id=o['Object_ID']
    if id<10000 or o['Object_Type']!='Decision':continue
    inc=incoming.get(id,[]);outs=outgoing.get(id,[])
    positions=[x for x in d['t_diagramobjects'] if x['Object_ID']==id]
    if len(inc)==1 and len(outs)==1:
        # A single available operation is not a decision: connect the initial
        # node straight to the requesting action.
        upd('t_connector','Connector_ID='+str(inc[0]['Connector_ID']),End_Object_ID=outs[0]['End_Object_ID'])
        for table,col in [('t_diagramlinks','ConnectorID'),('t_connector','Connector_ID')]:sql.append(f'DELETE FROM {table} WHERE {col}={outs[0]["Connector_ID"]}')
        sql.append(f'DELETE FROM t_diagramobjects WHERE Object_ID={id}')
        sql.append(f'DELETE FROM t_object WHERE Object_ID={id}')
        stats['rombos_redundantes_retirados']+=1;continue
    if len(outs)==1 and len(inc)>=2:
        label='Unir';stats['uniones_identificadas']+=1
        upd('t_object',f'Object_ID={id}',Name=label,Note='Nodo de fusión (merge). Reúne caminos alternativos; no evalúa otra condición ni sincroniza flujos concurrentes.')
        for p in positions:
            style=re.sub(r'LBL=[^;]*;','',p['ObjectStyle'] or '')+'LBL=CX=30:CY=14:OX=2:OY=10:HDN=0:BLD=0:ITA=0:UND=0:CLR=-1:ALN=1:ALT=0:ROT=0;'
            upd('t_diagramobjects',f'Instance_ID={p["Instance_ID"]}',ObjectStyle=style)
    else:
        if len(outs)<2:raise ValueError(('Decision sin alternativas',id))
        condition=(o.get('Note') or '').strip()
        label='¿Qué operación se solicita?' if not condition else short.get(condition,condition if condition.startswith('¿') else '¿'+condition[0].upper()+condition[1:]+'?')
        if len(label)>65:raise ValueError(('Pregunta demasiado larga',label))
        label='\n'.join(textwrap.wrap(label,22))
        upd('t_object',f'Object_ID={id}',Name=label)
        stats['decisiones_rotuladas']+=1
        for p in positions:
            cx=(p['RectLeft']+p['RectRight'])//2;cy=(-p['RectTop']-p['RectBottom'])//2
            h=14*len(label.splitlines());style=re.sub(r'LBL=[^;]*;','',p['ObjectStyle'] or '')+f'LBL=CX=140:CY={h}:OX=55:OY={(100-h)//2}:HDN=0:BLD=0:ITA=0:UND=0:CLR=-1:ALN=1:ALT=0:ROT=0;'
            upd('t_diagramobjects',f'Instance_ID={p["Instance_ID"]}',RectLeft=cx-125,RectRight=cx+125,RectTop=-(cy-50),RectBottom=-(cy+50),ObjectStyle=style)
        # Retain exact guards so the concise question does not replace rules.
        assert all(c.get('PDATA2') for c in outs),(id,'Rama sin condición')
    changes.append({'id':id,'name':label,'outputs':len(outs)})
(T/'reorganize.sql.json').write_text(json.dumps(sql,ensure_ascii=False),encoding='utf-8')
(T/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2),encoding='utf-8')
(T/'decision-review.json').write_text(json.dumps({'stats':stats,'nodes':changes},ensure_ascii=False,indent=2),encoding='utf-8')
print(stats,'Sentencias',len(sql))
