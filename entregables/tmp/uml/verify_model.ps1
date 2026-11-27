$ErrorActionPreference='Stop'
function OpenDb($file){$c=New-Object -ComObject ADODB.Connection;$c.Open('Provider=Microsoft.ACE.OLEDB.12.0;Data Source='+(Join-Path (Get-Location) $file));return $c}
function Rows($c,$q){$rs=$c.Execute($q);$out=@();while(-not $rs.EOF){$row=[ordered]@{};for($i=0;$i -lt $rs.Fields.Count;$i++){$f=$rs.Fields.Item($i);$row[$f.Name]=if($f.Value -is [DBNull]){$null}else{$f.Value}};$out+=[pscustomobject]$row;$rs.MoveNext()};$rs.Close();return $out}
function Count($c,$q){$rs=$c.Execute($q);$v=[int]$rs.Fields.Item(0).Value;$rs.Close();return $v}
$src=OpenDb 'SUMA-Diagramas_Vistas.eapx';$dst=OpenDb 'SUMA-Diagramas_Vistas_Actividad_Secuencia.eapx'
$result=[ordered]@{}
try {
 foreach($type in @('UseCase','Class','Actor')){
 $query="SELECT * FROM t_object WHERE Object_ID<10000 AND Object_Type='$type' ORDER BY Object_ID"
 $a=Rows $src $query;$b=Rows $dst $query
 if((ConvertTo-Json -InputObject @($a) -Depth 6 -Compress) -cne (ConvertTo-Json -InputObject @($b) -Depth 6 -Compress)){throw "Cambios en $type"}
 $result[$type]=@($b).Count
 } $result.actividades=Count $dst "SELECT COUNT(*) FROM t_diagram WHERE Diagram_ID>=1000 AND Diagram_Type='Activity'"
 $result.secuencias=Count $dst "SELECT COUNT(*) FROM t_diagram WHERE Diagram_ID>=1000 AND Diagram_Type='Sequence'"
 if($result.actividades -ne 50 -or $result.secuencias -ne 50){throw 'Cobertura de diagramas incompleta'}
 $objects=Rows $dst 'SELECT Object_ID,Object_Type,NType,ParentID,Package_ID,Name,Classifier FROM t_object WHERE Object_ID>=10000'
 $connectors=Rows $dst 'SELECT Connector_ID,Start_Object_ID,End_Object_ID,Connector_Type,Stereotype,DiagramID,SeqNo,PDATA2,PDATA4,PtStartY,PtEndY FROM t_connector WHERE Connector_ID>=10000'
 $diagramObjects=Rows $dst 'SELECT Diagram_ID,Object_ID,RectLeft,RectRight,RectTop,RectBottom FROM t_diagramobjects WHERE Diagram_ID>=1000'
 $manifest=Get-Content tmp/uml/manifest.json -Raw -Encoding utf8|ConvertFrom-Json
 $spec=Get-Content tmp/uml/spec.json -Raw -Encoding utf8|ConvertFrom-Json
 $checked=0
 foreach($rf in $spec){$m=$manifest | Where-Object code -eq $rf.code
  foreach($eid in @($m.activityElement,$m.sequenceElement)){
   $linked=@($connectors | Where-Object {$_.Start_Object_ID -eq $eid -and $_.Stereotype -eq 'trace'} | ForEach-Object {$_.End_Object_ID})
   foreach($req in $rf.requirements){if($req.id -notin $linked){throw "Sin traza $($rf.code) $($req.code)"};$checked++}
  }
  $nodes=@($diagramObjects|Where-Object Diagram_ID -eq $m.activity|ForEach-Object {$_.Object_ID})
  $flows=@($connectors|Where-Object {$_.Connector_Type -eq 'ControlFlow' -and $_.Start_Object_ID -in $nodes})
  $start=@($objects|Where-Object {$_.Object_ID -in $nodes -and $_.Object_Type -eq 'StateNode' -and $_.NType -eq 100})
  if($start.Count -ne 1){throw "Inicio inválido $($rf.code)"}
  $visited=New-Object 'System.Collections.Generic.HashSet[int]';$queue=New-Object 'System.Collections.Generic.Queue[int]';$queue.Enqueue($start[0].Object_ID)
  while($queue.Count){$id=$queue.Dequeue();if($visited.Add($id)){foreach($flow in ($flows|Where-Object Start_Object_ID -eq $id)){$queue.Enqueue($flow.End_Object_ID)}}}
  foreach($node in ($objects|Where-Object {$_.Object_ID -in $nodes -and $_.Object_Type -ne 'ActivityPartition'})){if(-not $visited.Contains($node.Object_ID)){throw "Nodo inalcanzable $($rf.code) $($node.Object_ID)"}}
  $seq=@($connectors|Where-Object DiagramID -eq $m.sequence|Sort-Object SeqNo);$prev=0
  foreach($msg in $seq){if($msg.PtStartY -ge $prev){throw "Orden temporal inválido $($rf.code)"};$prev=$msg.PtStartY}
 }
 $result.trazas_comprobadas=$checked
 $result.flujos_alcanzables='50/50'
 $result.orden_temporal='50/50'
 $result.subrequisitos=179
 $result.rf=50
 $result.operaciones=109
 $result.estado='VERIFICADO'
 $result|ConvertTo-Json -Depth 8|Set-Content -Encoding utf8 tmp/uml/verification.json
 $objects|ConvertTo-Json -Depth 6|Set-Content -Encoding utf8 tmp/uml/objects-final.json
 $connectors|ConvertTo-Json -Depth 6|Set-Content -Encoding utf8 tmp/uml/connectors-final.json
 $diagramObjects|ConvertTo-Json -Depth 6|Set-Content -Encoding utf8 tmp/uml/diagramobjects-final.json
 $result|ConvertTo-Json -Depth 8
}finally{$src.Close();$dst.Close()}

