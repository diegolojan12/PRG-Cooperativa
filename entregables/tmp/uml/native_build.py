import json,uuid,textwrap,hashlib
from pathlib import Path
R=Path.cwd(); T=R/'tmp/uml'
spec=json.loads((T/'spec.json').read_text(encoding='utf-8'))
templates=json.loads((T/'native-templates.json').read_text(encoding='utf-8-sig'))
schema=json.loads((T/'schema.json').read_text(encoding='utf-8-sig'))
sql=[]; records={}; counts={}; manifest=[]
ids={'obj':10000,'con':10000,'pkg':1000,'dia':1000}
def uid():return '{'+str(uuid.uuid4()).upper()+'}'
def nxt(k):ids[k]+=1;return ids[k]
def val(v):
    if v is None or v=='':return 'NULL'
    if isinstance(v,bool):return '-1' if v else '0'
    if isinstance(v,(int,float)):return str(v)
    return "'"+str(v).replace("'","''")+"'"
def insert(table,**d):
    sql.append('INSERT INTO ['+table+'] ('+','.join('['+k+']' for k in d)+') VALUES ('+','.join(val(v) for v in d.values())+')')
    counts[table]=counts.get(table,0)+1
def obj(p,name,typ,parent=0,notes='',ntype=0,**extra):
    i=nxt('obj');g=uid()
    d=dict(Object_ID=i,Object_Type=typ,Name=name,Package_ID=p,ParentID=parent,Note=notes,NType=ntype,ea_guid=g,Version='1.0',Author='Equipo SUMA',Status='Proposed',Scope='Public',GenType='<none>',Complexity=1,Backcolor=16777215,Bordercolor=0,Fontcolor=0,BorderWidth=1,Abstract='0',IsRoot=False,IsLeaf=False,IsSpec=False,IsActive=False)
    d.update(extra);insert('t_object',**d);records[i]=d;return i
def pkg(parent,name,notes=''):
    i=nxt('pkg');g=uid();insert('t_package',Package_ID=i,Name=name,Parent_ID=parent,ea_guid=g,Notes=notes,IsControlled=False,Protected=False,UseDTD=False,LogXML=False,Version='1.0')
    obj(parent,name,'Package',notes=notes,PDATA1=str(i),ea_guid=g)
    return i
def dia(p,name,typ,parent,notes):
    i=nxt('dia');g=uid();insert('t_diagram',Diagram_ID=i,Package_ID=p,ParentID=parent,Diagram_Type=typ,Name=name,ea_guid=g,Author='Equipo SUMA',Version='1.0',Notes=notes,ShowDetails=0,AttPub=True,AttPri=True,AttPro=True,Orientation='L',cx=1169,cy=826,Scale=100,ShowForeign=False,ShowBorder=False,ShowPackageContents=False,Locked=False,PDATA='HideRel=0;ShowTags=0;ShowReqs=0;ShowCons=0;OpParams=0;ShowSN=1;ShowIcons=1;HideAtts=1;HideOps=1;HideStereo=0;',StyleEx='ShowNotes=0;SuppressBrackets=1;SuppConnectorLabels=0;Theme=:0;')
    insert('t_xref',XrefID=uid(),Name='DefaultDiagram',Type='element property',Visibility='Public',Client=records[parent]['ea_guid'],Supplier=g)
    return i
def place(d,e,x,y,w,h,z=0):insert('t_diagramobjects',Diagram_ID=d,Object_ID=e,RectLeft=x,RectRight=x+w,RectTop=-y,RectBottom=-y-h,Sequence=z,ObjectStyle='DUID='+uuid.uuid4().hex[:8].upper()+';BCol=16777215;LCol=0;BFol=0;LWth=1;FType=Arial;FSize=10;')
def con(a,b,typ,name='',notes='',**extra):
    i=nxt('con');d=dict(Connector_ID=i,Start_Object_ID=a,End_Object_ID=b,Connector_Type=typ,Name=name,Notes=notes,Direction='Source -> Destination',ea_guid=uid(),SourceIsNavigable=False,DestIsNavigable=True,SourceIsAggregate=0,DestIsAggregate=0,SourceIsOrdered=0,DestIsOrdered=0,LineColor=0,IsBold=0,RouteStyle=3,DiagramID=0,SeqNo=0,IsRoot=False,IsLeaf=False,IsSpec=False,IsSignal=False,IsStimulus=False)
    d.update(extra);insert('t_connector',**d);return i
def trace(e,r):con(e,r,'Dependency',Stereotype='trace')
def edge(d,a,b,guard='',path=None):
    i=con(a,b,'ControlFlow',PDATA2=guard)
    insert('t_diagramlinks',DiagramID=d,ConnectorID=i,Hidden=False,Style='Mode=3;Color=0;LWidth=1;',Path=path or '')
    return i
def node(p,d,parent,name,typ,x,y,w=310,h=100,ntype=0,notes=''):
    e=obj(p,name,typ,parent,notes,ntype);place(d,e,x,y,w,h);return e
def fragment(p,d,parent,guard,x,y,w,h,ntype=1,parts=None):
    e=obj(p,'','InteractionFragment',parent,ntype=ntype,PDATA1=str(d));place(d,e,x,y,w,h,200)
    parts=parts or [(guard,h-20)]
    desc=''.join('@PAR;Name='+g+';Size='+str(sz)+';GUID='+uid()+';@ENDPAR;' for g,sz in parts)
    insert('t_xref',XrefID=uid(),Name='Partitions',Type='element property',Visibility='Public',Client=records[e]['ea_guid'],Description=desc)
    return e
classes={r['Name']:int(r['Object_ID']) for r in __import__('build_spec').rows('actors-classes.xml') if r['Object_Type']=='Class'}
base=pkg(15,'01 Actividades y secuencias - Casos de uso RF','Reconstrucción desde los 50 RF y 179 subrequisitos del modelo vigente y la matriz Excel. No se reutilizan actividades históricas. ACT y SEQ con el mismo RF; mensajes a nivel de análisis, no declaración de métodos implementados.')
modules={}
for rf in spec:
    code=rf['code'];reqmap={r['code']:r for r in rf['requirements']}
    if rf['module'] not in modules: modules[rf['module']]=pkg(base,rf['module'])
    p=pkg(modules[rf['module']],code+' '+rf['name'])
    ap=obj(p,'ACT-'+code+' - '+rf['name'],'Activity',notes=rf['notes'],ntype=8)
    ad=dia(p,'ACT-'+code+' - '+rf['name'],'Activity',ap,rf['notes'])
    for r in rf['requirements']:trace(ap,r['id'])
    # One branch per alternative operation. Swimlane pairs repeat only when
    # the invocation/role changes; effects remain in SUMA's lane.
    maxheight=max(960+sum(330 if st.get('when') else 600 if st.get('parallel') else 400 if st.get('loop') else 150 for st in s['steps']) for s in rf['scenarios'])
    start=node(p,ad,ap,'','StateNode',466,30,24,24,100)
    choice=node(p,ad,ap,'Operación recibida','Decision',390,100,180,60)
    edge(ad,start,choice)
    for si,s in enumerate(rf['scenarios']):
        x=si*1000
        for title,lx,lw in [(s['actor'],x+10,275),('SUMA',x+285,695)]:
            lane=obj(p,title,'ActivityPartition',ap);place(ad,lane,lx,200,lw,maxheight-200,500)
        request=node(p,ad,ap,s['request'],'Action',x+35,270,230,105)
        edge(ad,choice,request,'operación = '+s['name'])
        check=node(p,ad,ap,s['check'],'Action',x+330,415,330,105,notes='Condición de éxito: '+s['guard'])
        edge(ad,request,check)
        decision=node(p,ad,ap,'','Decision',x+420,565,150,60,notes=s['guard']);edge(ad,check,decision)
        fail=node(p,ad,ap,s['fail'],'Action',x+725,645,230,120);edge(ad,decision,fail,'else')
        failend=node(p,ad,ap,'','StateNode',x+825,815,26,26,101);edge(ad,fail,failend)
        prev=decision;y=700
        for st in s['steps']:
            refs=st['refs'];notes='\n\n'.join(reqmap[r]['notes'] for r in refs)
            firstguard=s['guard'] if prev==decision else ''
            if st.get('when'):
                gate=node(p,ad,ap,'','Decision',x+420,y,150,60,notes=st['when']);edge(ad,prev,gate,firstguard);prev=gate;y+=100;firstguard=st['when']
            if st.get('parallel'):
                y=max(y,1000)
                fork=node(p,ad,ap,'','Synchronization',x+320,y,630,8);edge(ad,prev,fork,firstguard)
                join=node(p,ad,ap,'','Synchronization',x+320,y+195,630,8)
                for j,stext in enumerate(st['parallel']):
                    ne=node(p,ad,ap,stext,'Action',x+310+j*220,y+55,205,100,notes=notes);edge(ad,fork,ne);edge(ad,ne,join)
                    for r in refs:trace(ne,reqmap[r]['id'])
                prev=join;y+=255;continue
            if st.get('loop'):
                loopmerge=node(p,ad,ap,'','Decision',x+475,y,35,35)
                loopmerge_y=y+17
                edge(ad,prev,loopmerge,firstguard);prev=loopmerge;firstguard='';y+=80
            ne=node(p,ad,ap,', '.join(refs)+'\n'+st['text'],'Action',x+320,y,350,110,notes=notes);edge(ad,prev,ne,firstguard)
            for r in refs:trace(ne,reqmap[r]['id'])
            prev=ne;y+=150
            if st.get('loop'):
                repeat=node(p,ad,ap,'','Decision',x+420,y,150,60,notes='¿Quedan preguntas de las 10?')
                edge(ad,ne,repeat)
                edge(ad,repeat,loopmerge,'quedan preguntas',f'{x+700}:{-(y+30)};{x+700}:{-loopmerge_y};')
                done=node(p,ad,ap,'Completar las 10 preguntas','Action',x+335,y+115,320,70)
                edge(ad,repeat,done,'10 preguntas procesadas');prev=done;y+=235
            if st.get('when'):
                merge=node(p,ad,ap,'','Decision',x+475,y+30,35,35);edge(ad,ne,merge)
                if st.get('otherwise'):
                    other=node(p,ad,ap,st['otherwise'],'Action',x+735,y-150,220,110,notes=notes);edge(ad,gate,other,'else');edge(ad,other,merge)
                else:edge(ad,gate,merge,'else',f'{x+700}:{-(y-200)};{x+700}:{-(y+47)};')
                prev=merge;y+=150
        end=node(p,ad,ap,'','StateNode',x+480,y+20,26,26,101);edge(ad,prev,end)
    sp=obj(p,'SEQ-'+code+' - '+rf['name'],'Interaction',notes=rf['notes'])
    sd=dia(p,'SEQ-'+code+' - '+rf['name'],'Sequence',sp,'Interacción de análisis. Operaciones alternativas representadas mediante opt; condiciones complementarias de éxito y error. Las instancias de dominio conservan su clasificador de la vista lógica. Mensajes semánticos, no firmas de implementación.\n'+rf['notes'])
    for r in rf['requirements']:trace(sp,r['id'])
    roles=list(dict.fromkeys(s['actor'] for s in rf['scenarios']))
    life={};coords={};x=80
    for role in roles:
        e=obj(p,'disparador : SUMA' if role=='Evento del sistema' else role,'Object' if role=='Evento del sistema' else 'Actor',sp)
        life[role]=e;coords[e]=x;x+=250
    ui=obj(p,'interfaz : SUMA','Object',sp,notes='Frontera de interacción a nivel de análisis.');coords[ui]=x+80
    control=obj(p,'coordinador : SUMA','Object',sp,notes='Coordinación del RF a nivel de análisis.');coords[control]=x+650
    domain=obj(p,'dominio','Object',sp,Classifier=str(classes[rf['class']]),Classifier_guid='');coords[domain]=x+1500
    ext=None
    if code in ['RF-02','RF-07','RF-10','RF-50']:
        extname={'RF-02':'Servicio de correo','RF-07':'Servicio de correo','RF-10':'Canal de compartir','RF-50':'Fuente institucional autorizada'}[code]
        ext=obj(p,extname,'Actor',sp);coords[ext]=x+2100
    fullw=x+(2380 if ext else 1790)
    seq=0;prevy=100
    def msg(a,b,text,y,reply=False,notes=''):
        global seq,prevy
        seq+=1
        sy=-(y-prevy-35);prevy=y
        # EA derives vertical placement from the inter-message delta in SY.
        pdata5=f'SX=0;SY={sy};EX=0;EY=0;$LLB=;LLT=;LMT=CX=600:CY=28:OX=0:OY=0:HDN=0:BLD=0:ITA=0:UND=0:CLR=-1:ALN=1:DIR=0:ROT=0;LMB=;LRT=;LRB=;IRHS=;ILHS=;'
        c=con(a,b,'Sequence',text,notes,DiagramID=sd,SeqNo=seq,PtStartX=coords[a]+90,PtEndX=coords[b]+90,PtStartY=-y,PtEndY=-y,SubType='Return' if reply else '',PDATA1='Synchronous',PDATA2='retval=;',PDATA3='Reply' if reply else 'Call',PDATA4='0',PDATA5=pdata5,StateFlags='Activation=0;')
        insert('t_diagramlinks',DiagramID=sd,ConnectorID=c,Hidden=False,Style='Mode=3;Color=0;LWidth=1;')
    y=190
    for s in rf['scenarios']:
        top=y;actor=life[s['actor']]
        msg(actor,ui,s['request'],y+75);msg(ui,control,s['check'],y+150)
        y+=240
        if ext and code=='RF-50':
            msg(control,ext,'Consultar titular, tipo, número y condición; origen y vigencia',y);msg(ext,control,'Datos institucionales / fallo técnico / fuente no vigente',y+80,True);y+=180
        okt=y; y+=75
        for st in s['steps']:
            refs=st['refs'];notes='\n'.join(reqmap[r]['notes'] for r in refs)
            if st.get('parallel'):
                pt=y-45;parts=[]
                for branch in st['parallel']:
                    msg(control,domain,branch,y);msg(domain,control,'Datos consultados',y+65,True);parts.append(('',160));y+=160
                fragment(p,sd,sp,'',x+620,pt,1140,y-pt-15,3,parts)
                continue
            sttop=y-45
            target=ext if ext and ((code in ['RF-02','RF-07'] and 'envi' in st['text'].lower()) or code=='RF-10') else domain
            msg(control,target,', '.join(refs)+': '+st['text'],y,notes=notes)
            msg(target,control,'Resultado de la operación',y+85,True)
            y+=180
            if st.get('when'):fragment(p,sd,sp,st['when'],x+620,sttop,(fullw-x-650 if target==ext else 1140),165)
            if st.get('loop'):fragment(p,sd,sp,st['loop'],x+620,sttop,1140,165,4)
            if st.get('otherwise'):
                otop=y-40;msg(control,domain,st['otherwise'],y,notes=notes);msg(domain,control,'Resultado alternativo',y+80,True);y+=175
                fragment(p,sd,sp,'no ('+st['when']+')',x+620,otop,1140,165)
        msg(control,ui,'Operación completada',y+30,True);y+=110
        fragment(p,sd,sp,s['guard'],x+30,okt,fullw-x-60,y-okt)
        badtop=y+30;msg(control,ui,s['fail'],y+110,True);y+=200
        fragment(p,sd,sp,'no ('+s['guard']+')',x+30,badtop,fullw-x-60,140)
        msg(ui,actor,'Presentar resultado o causa',y+50,True);y+=130
        fragment(p,sd,sp,'operación = '+s['name'],20,top,fullw-20,y-top)
        y+=100
    for e,lx in coords.items():place(sd,e,lx,30,190,y+50)
    manifest.append(dict(code=code,name=rf['name'],module=rf['module'],package=p,activity=ad,sequence=sd,activityElement=ap,sequenceElement=sp,requirements=[r['code'] for r in rf['requirements']]))
sql.append("UPDATE t_package SET Name='HISTÓRICO - Secuencias anteriores' WHERE Package_ID=19")
sql.append("UPDATE t_package SET Name='HISTÓRICO - Actividades anteriores' WHERE Package_ID=20")
sql.append("UPDATE t_connector SET PDATA3='Call', PDATA4='1' WHERE Connector_ID>=10000 AND Connector_Type='Sequence' AND SubType='Return'")
sql.append("UPDATE t_connector SET Notes=NULL WHERE Connector_ID>=10000 AND Connector_Type='Sequence'")
(T/'native.sql.json').write_text(json.dumps(sql,ensure_ascii=False),encoding='utf-8')
(T/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
(T/'counts.json').write_text(json.dumps(counts),encoding='utf-8')
print(counts,'sentencias',len(sql))
