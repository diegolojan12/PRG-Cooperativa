import json,re,textwrap
from pathlib import Path
T=Path('tmp/uml')
# Reuse only the SQL constructors; no original build or source-copy is executed.
exec((T/'native_build.py').read_text(encoding='utf-8').split('classes=')[0])
snap=json.loads((T/'revision-snapshot.json').read_text(encoding='utf-8-sig'))
manifest=json.loads((T/'manifest.json').read_text(encoding='utf-8-sig'))
old={o['Object_ID']:o for o in snap['t_object']}
ids.update(obj=max(old),con=max(c['Connector_ID'] for c in snap['t_connector']),dia=max(d['Diagram_ID'] for d in snap['t_diagram']),op=100000)
records.update(old)
plans={}
for line in (T/'sequence_plan.txt').read_text(encoding='utf-8').splitlines():
 if line.strip():
  key,entry,query,steps=line.split('|');plans[key]=(entry,query,steps.split('^'))
assert len(plans)==sum(len(r['scenarios']) for r in spec)
parents={m['sequenceElement'] for m in manifest}
children={o['Object_ID'] for o in old.values() if o['ParentID'] in parents}
assert all(i>=10000 for i in children)
for i in children:
 sql.extend([f"DELETE FROM t_xref WHERE Client={val(old[i]['ea_guid'])}",f'DELETE FROM t_diagramobjects WHERE Object_ID={i}',f'DELETE FROM t_object WHERE Object_ID={i}'])
for m in manifest:
 sd=m['sequence']
 sql.extend([f'DELETE FROM t_diagramlinks WHERE DiagramID={sd}',f'DELETE FROM t_connector WHERE DiagramID={sd}'])
catalog=[];targets={};methodkeys=set();methoddefs=[]
for rf,m in zip(spec,manifest):
 m['sequences']=[]
 for si,s in enumerate(rf['scenarios'],1):
  name=f"SEQ-{rf['code']}-{si:02} - {s['name']}"
  refs=list(dict.fromkeys([rf['code']]+[ref for st in s['steps'] for ref in st['refs']]))
  note=rf['notes']+'\nEscenario: '+s['name']+'\nInicio: '+s['request']+'\nCondición: '+s['guard']+'\nAlternativa: '+s['fail']+'\nTrazabilidad: '+', '.join(refs)
  sp=obj(m['sequencePackage'],name,'Interaction',m['sequenceElement'],notes=note)
  if si==1:
   sd=m['sequence'];sql.append(f'UPDATE t_diagram SET ParentID={sp},Name={val(name)},Notes={val(note)} WHERE Diagram_ID={sd}')
  else:sd=dia(m['sequencePackage'],name,'Sequence',sp,note)
  for rr in rf['requirements']:
   if rr['code'] in refs:trace(sp,rr['id'])
  item=dict(code=rf['code'],scenario=si,name=name,title=s['name'],diagram=sd,interaction=sp,refs=refs,file=f"secuencias/{rf['code']}-{si:02}-sequence.png")
  m['sequences'].append(item);catalog.append(item);targets[(rf['code'],si)]=sp

for rf,m in zip(spec,manifest):
 p=m['sequencePackage'];code=rf['code'];reqmap={r['code']:r for r in rf['requirements']}
 classifiers={}
 for key,name,stereo in [('U','UI SUMA','boundary'),('C','Sistema SUMA','control'),('D','BD SUMA','database')]:
  classifiers[key]=obj(p,name,'Class',notes=f"Contrato de análisis de {code}. Operaciones usadas por sus secuencias. BD SUMA representa el acceso persistente a {rf['class']}; no ejecuta lógica de interfaz.",Stereotype=stereo)
 for si,s in enumerate(rf['scenarios'],1):
  item=m['sequences'][si-1];sd=item['diagram'];sp=item['interaction'];key=code[-2:]+'.'+str(si)
  entry,query,steps=plans[key];assert len(steps)==len(s['steps']),(key,len(steps),len(s['steps']))
  auto=s['actor']=='Evento del sistema'
  extname={'RF-02':'Servicio de correo','RF-07':'Servicio de correo','RF-10':'Canal externo','RF-50':'Fuente institucional'}.get(code)
  if not any('E ' in t for t in steps):extname=None
  if extname and 'E' not in classifiers:classifiers['E']=obj(p,extname,'Class',notes='Contrato del servicio externo requerido por este RF.')
  life={};coords={}
  life['A']=obj(p,'Evento / temporizador' if auto else s['actor'],'Object' if auto else 'Actor',sp,notes=s['request'])
  coords[life['A']]=40
  for j,k in enumerate(['U','C','D']+(['E'] if extname else []),1):
   life[k]=obj(p,{'U':'ui','C':'sistema','D':'bd','E':'externo'}[k],'Object',sp,Classifier=str(classifiers[k]))
   coords[life[k]]=40+j*440
  width=(2100 if extname else 1660);y=155;seq=0;prevy=100
  item.update(actor=s['actor'],automatic=auto,lifelines=life,classifiers=classifiers.copy(),external=extname)
  def method(k,label,notes=''):
   if k=='A':return
   match=re.fullmatch(r'(\w+)\((.*)\)',label);assert match,label
   name,args=match.groups();ck=(classifiers[k],name,args)
   if ck in methodkeys:return
   methodkeys.add(ck);oid=nxt('op');insert('t_operation',OperationID=oid,Object_ID=classifiers[k],Name=name,Scope='Public',Type='Resultado',IsStatic='0',Concurrency='Sequential',Notes=notes,Abstract='0',Pos=oid-100000,ea_guid=uid())
   for pi,arg in enumerate(a.strip() for a in args.split(',') if a.strip()):
    insert('t_operationparams',OperationID=oid,Name=arg,Type='Dato',Pos=pi,Kind='in',ea_guid=uid())
   methoddefs.append(dict(classifier=classifiers[k],signature=label))
  def msg(a,b,label,reply=False,notes=''):
   global y,seq,prevy
   seq+=1;sy=-(y-prevy-35);prevy=y
   if not reply:method(b,label,notes)
   cc=con(life[a],life[b],'Sequence',label,notes,DiagramID=sd,SeqNo=seq,PtStartX=coords[life[a]]+90,PtEndX=coords[life[b]]+90,PtStartY=-y,PtEndY=-y,SubType='Return' if reply else '',PDATA1='Synchronous',PDATA2='retval=;',PDATA3='Call',PDATA4='1' if reply else '0',PDATA5=f'SX=0;SY={sy};EX=0;EY=0;$LLB=;LLT=;LMT=CX=420:CY=28:OX=0:OY=0:HDN=0:BLD=0:ITA=0:UND=0:CLR=-1:ALN=1:DIR=0:ROT=0;LMB=;LRT=;LRB=;IRHS=;ILHS=;',StateFlags='Activation=0;')
   insert('t_diagramlinks',DiagramID=sd,ConnectorID=cc,Hidden=False,Style='Mode=3;Color=0;LWidth=1;')
   y+=70
  def frag(top,end,guard,ntype=1,parts=None,left=395):
   return fragment(p,sd,sp,guard,left,top,width-left-15,end-top,ntype,parts)
  def reference(target,scenario=1):
   global y
   targetid=targets[(target,scenario)]
   e=obj(p,records[targetid]['Name'],'InteractionOccurrence',sp,Classifier=str(targetid),PDATA1=str(targetid),notes='Invoca la secuencia trazada a '+target)
   place(sd,e,870,y,650,65,180);trace(e,next(r['uc'] for r in spec if r['code']==target));y+=110
  def actions(text,notes=''):
   global y
   for token in text.split(' & '):
    k,op=token.split(' ',1)
    if k=='R':reference(op);continue
    parts=op.split('>');label=parts[0];result=parts[1] if len(parts)>1 else None
    source='U' if k=='E' and code=='RF-10' else 'C'
    msg(source,k,label,notes=notes)
    if result:msg(k,source,result,True)
  if auto:msg('A','C',entry,notes=s['request'])
  else:msg('A','U',entry,notes=s['request']);msg('U','C',entry)
  if query!='-':actions('D '+query)
  if code=='RF-50':actions('E consultarCuentaInstitucional(tipo, numero)>evidencia');steps[0]='C compararTitularYCondicion(solicitud, evidencia)'
  validation='validar'+entry[0].upper()+entry[1:entry.index('(')]+'(datos, contexto)'
  msg('C','C',validation,notes=s['check']+'\n'+s['guard'])
  top=y;y+=65
  for st,plan in zip(s['steps'],steps):
   notes=st['text']+'\n'+'\n'.join(reqmap[r]['notes'] for r in st['refs'])
   sttop=y
   if st.get('when') or st.get('loop') or st.get('parallel'):y+=65
   if st.get('parallel'):
    parts=[]
    for op,result in [('consultarSaldo(idUsuario)','saldo'),('consultarNivelYFaltantes(idUsuario)','nivelYFaltantes'),('contarNoLeidas(idUsuario)','noLeidas')]:
     by=y;actions('D '+op+'>'+result,notes);parts.append(('',y-by+20));y+=20
    frag(sttop,y,'',3,parts,left=855)
   elif st.get('loop'):
    msg('C','U','mostrarPregunta(pregunta)');msg('U','A','pregunta',True)
    rt=y;y+=55
    msg('A','U','responderPregunta(opcion)');msg('U','C','registrarRespuesta(opcion, tiempo)');actions(plan,notes)
    split=y;y+=55;actions('C marcarRespuestaIncorrectaPorTiempo()',notes)
    frag(rt,y,'',0,[('respuesta antes de 30 s',split-rt-20),('else',y-split)],left=15)
    y+=25;frag(sttop,y,st['loop'],4,left=5)
   else:
    actions(plan,notes)
    if st.get('when'):
     if st.get('otherwise'):
      split=y;y+=55
      op='D rechazarCuentaConEvidencia(idSolicitud, causa, evidencia)>estadoRechazado' if code=='RF-50' else 'D guardarEvaluacionNoAprobada(idUsuario, calificacion)'
      actions(op,st['otherwise']);frag(sttop,y,'',0,[(st['when'],split-sttop-20),('else',y-split)],left=850)
     else:frag(sttop,y,st['when'],left=395 if 'U ' in plan else 850)
     y+=25
   # Explicit references and alternatives omitted by the previous generic diagram.
   if code=='RF-01' and st is s['steps'][-1]:
    for guard,target in [('cuenta informada','RF-05'),('código de referido informado','RF-11')]:
     rt=y;y+=55;reference(target);frag(rt,y,guard,left=850);y+=20
   if code=='RF-11' and si==1 and st is s['steps'][-1]:
    rt=y;y+=55;reference('RF-12');frag(rt,y,'referido aprobado y no acreditado',left=850);y+=20
   if code=='RF-12' and si==1 and st is s['steps'][-1]:
    rt=y;y+=55;actions('D acreditarActividadAtomica(evento, puntos)>saldoActualizado');frag(rt,y,'evento distinto de referido aprobado',left=850);y+=20
   if code=='RF-41' and si==2:
    rt=y;y+=55;actions('D crearAvisoRespuestaSoporte(idUsuario, respuesta)>notificacion');frag(rt,y,'estado = Cerrada',left=850);y+=20
   if code=='RF-50' and st is s['steps'][-1]:
    rt=y;y+=55;reference('RF-12');frag(rt,y,'nueva aprobación elegible y no acreditada',left=850);y+=20
  # A return conveys data; a UI presentation is a boundary operation.
  msg('C','A' if auto else 'U','resultado',True)
  if not auto:msg('U','U','mostrarResultado(resultado)');msg('U','A','vista actualizada',True)
  split=y;y+=65
  if code=='RF-50':actions('D mantenerPendienteYProgramarReintento(idSolicitud, causa)>reintento')
  msg('C','A' if auto else 'U','error(causa)',True,notes=s['fail'])
  if not auto:msg('U','U','mostrarError(causa, correccion)');msg('U','A','causa y corrección',True)
  # Include actor only where the diagram includes a question/answer loop.
  frag(top,y,'',0,[(s['guard'],split-top-20),('else',y-split)],left=0 if auto or code=='RF-20' else 390)
  y+=60
  for e,x in coords.items():place(sd,e,x,30,180,y)
  item['height']=y;item['messageCount']=seq

(T/'sequence-revision.sql.json').write_text(json.dumps(sql,ensure_ascii=False),encoding='utf-8')
(T/'manifest-sequences.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
(T/'sequence-catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2),encoding='utf-8')
(T/'sequence-methods.json').write_text(json.dumps(methoddefs,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'{len(catalog)} secuencias por escenario; {len(methoddefs)} operaciones declaradas; {len(sql)} sentencias preparadas.')
