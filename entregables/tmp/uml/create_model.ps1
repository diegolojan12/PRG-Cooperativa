param([int]$Limit=50,[switch]$Fresh)
$ErrorActionPreference='Stop'
$root=(Get-Location).Path
$target=Join-Path $root 'SUMA-Diagramas_Vistas_Actividad_Secuencia.eapx'
if($Fresh){Copy-Item -LiteralPath (Join-Path $root 'SUMA-Diagramas_Vistas.eapx') -Destination $target -Force}
$spec=Get-Content -LiteralPath tmp/uml/spec.json -Raw -Encoding utf8 | ConvertFrom-Json
$repo=New-Object -ComObject EA.Repository
if(-not $repo.OpenFile($target)){throw 'No se pudo abrir copia de trabajo'}
$repo.EnableUIUpdates=$false
$repo.BatchAppend=$true
$script:manifest=@()
function Pack($parent,$name){$p=$parent.Packages.AddNew($name,'');[void]$p.Update();return $p}
function Elem($p,$name,$type,$notes='',$parent=0){$e=$p.Elements.AddNew($name,$type);$e.Notes=$notes;if($parent){$e.ParentID=$parent};[void]$e.Update();return $e}
function Place($d,$e,$x,$y,$w,$h,$z=0){$o=$d.DiagramObjects.AddNew("l=$x;r=$($x+$w);t=$(-$y);b=$(-$y-$h);",'');$o.ElementID=$e.ElementID;$o.Sequence=$z;$o.Style='font=Arial;fontsz=100;';[void]$o.Update();return $o}
function Trace($e,$id){$c=$e.Connectors.AddNew('','Dependency');$c.SupplierID=[long]$id;$c.Stereotype='trace';$c.Direction='Source -> Destination';[void]$c.Update()}
function Link($d,$a,$b,$guard=''){$c=$a.Connectors.AddNew('','ControlFlow');$c.SupplierID=[long]$b.ElementID;$c.Direction='Source -> Destination';if($guard){$c.TransitionGuard=$guard};[void]$c.Update();$l=$d.DiagramLinks.AddNew('','');$l.ConnectorID=$c.ConnectorID;$l.LineStyle=3;[void]$l.Update();return $c}
function Node($p,$d,$name,$type,$x,$y,$w=270,$h=80,$sub=0,$notes=''){$e=Elem $p $name $type $notes $script:behavior;if($sub){$e.Subtype=$sub;[void]$e.Update()};$null=Place $d $e $x $y $w $h;return $e}
function Msg($d,$a,$b,$text,$y,$reply=$false,$notes=''){$c=$a.Connectors.AddNew($text,'Sequence');$c.SupplierID=[long]$b.ElementID;$c.Direction='Source -> Destination';$c.DiagramID=$d.DiagramID;$c.SequenceNo=$script:seq;$script:seq++;$c.Notes=$notes;$c.StartPointY=-$y;$c.EndPointY=-$y;if($reply){$c.Subtype='Return';};[void]$c.Update();$script:positions+=@{id=$c.ConnectorID;y=-$y};$l=$d.DiagramLinks.AddNew('','');$l.ConnectorID=$c.ConnectorID;[void]$l.Update();return $c}
function Frag($p,$d,$name,$kind,$x,$y,$w,$h){$e=Elem $p ('['+$name+']') 'InteractionFragment' '' $script:behavior;$e.Subtype=if($kind -eq 'par'){3}else{1};[void]$e.Update();$null=Place $d $e $x $y $w $h 100;return $e}
try {
  $process=$repo.GetPackageByID(15)
  $old=$repo.GetPackageByID(19);$old.Name='HISTÓRICO - Secuencias anteriores';[void]$old.Update()
  $old=$repo.GetPackageByID(20);$old.Name='HISTÓRICO - Actividades anteriores';[void]$old.Update()
  $base=Pack $process '01 Procesos trazados a casos de uso RF - 2026-11-27'
  $base.Notes='Diagramas reconstruidos desde los casos de uso vigentes (paquete 83) y matriz de requisitos. Actividad y secuencia por RF. Las operaciones son alternativas, no una secuencia CRUD obligatoria. Mensajes a nivel de análisis; no afirman implementación de métodos. Referencia visual: AUTOSYS, pág. 9.';[void]$base.Update()
  $modules=@{}
  [xml]$cx=Get-Content tmp/uml/actors-classes.xml
  $classes=@{};foreach($c in $cx.EADATA.Dataset_0.Data.Row){if($c.Object_Type -eq 'Class'){$classes[$c.Name]=[int]$c.Object_ID}}
  New-Item -ItemType Directory -Force -Path 'diagramas/Procesos-RF-2026-11-27' | Out-Null
  foreach($rf in ($spec | Select-Object -First $Limit)){
    if(-not $modules.ContainsKey($rf.module)){$modules[$rf.module]=Pack $base $rf.module}
    $p=Pack $modules[$rf.module] "$($rf.code) $($rf.name)"
    $reqmap=@{};foreach($r in $rf.requirements){$reqmap[$r.code]=$r}
    $ap=Elem $p "ACT-$($rf.code) - $($rf.name)" 'Activity' $rf.notes
    $script:behavior=$ap.ElementID
    foreach($r in $rf.requirements){Trace $ap $r.id}
    $ad=$p.Diagrams.AddNew("ACT-$($rf.code) - $($rf.name)",'Activity');$ad.ParentID=$ap.ElementID;$ad.Notes=$rf.notes;[void]$ad.Update()
    $count=$rf.scenarios.Count;$width=$count*940
    $maxSteps=($rf.scenarios | ForEach-Object {$_.steps.Count} | Measure-Object -Maximum).Maximum
    $height=900+$maxSteps*360
    $start=Node $p $ad '' 'StateNode' 465 30 24 24 100
    $choice=Node $p $ad 'Operación / evento recibido' 'Decision' 375 85 200 65
    $null=Link $ad $start $choice
    $i=0
    foreach($s in $rf.scenarios){
      $x=$i*940
      $lane=Elem $p $s.actor 'ActivityPartition' '' $ap.ElementID;$null=Place $ad $lane ($x+10) 180 275 ($height-180) 200
      $lane=Elem $p 'SUMA' 'ActivityPartition' '' $ap.ElementID;$null=Place $ad $lane ($x+285) 180 635 ($height-180) 200
      $request=Node $p $ad $s.request 'Action' ($x+30) 245 230 100
      $null=Link $ad $choice $request ("operación = "+$s.name)
      $check=Node $p $ad $s.check 'Action' ($x+345) 370 270 95
      $null=Link $ad $request $check
      $dec=Node $p $ad '' 'Decision' ($x+385) 500 190 65 0 $s.guard
      $null=Link $ad $check $dec
      $fail=Node $p $ad $s.fail 'Action' ($x+675) 600 220 100
      $null=Link $ad $dec $fail 'else'
      $endFail=Node $p $ad '' 'StateNode' ($x+770) 750 26 26 101
      $null=Link $ad $fail $endFail
      $previous=$dec;$y=625
      foreach($step in $s.steps){
        $label=($step.refs -join ', ') + "`n" + $step.text
        $notes=($step.refs | ForEach-Object {$reqmap[$_].notes}) -join "`r`n`r`n"
        if($step.when){
          $gate=Node $p $ad '¿Aplicar efecto?' 'Decision' ($x+400) $y 160 60 0 $step.when
          if($previous.ElementID -eq $dec.ElementID){$null=Link $ad $previous $gate ('sí: '+$s.guard)}else{$null=Link $ad $previous $gate}
          $previous=$gate;$y+=110
        }
        if($step.parallel){
          $fork=Node $p $ad '' 'Synchronization' ($x+320) $y 550 8
          $null=Link $ad $previous $fork
          $join=Node $p $ad '' 'Synchronization' ($x+320) ($y+180) 550 8
          $pi=0;foreach($pt in $step.parallel){$pn=Node $p $ad $pt 'Action' ($x+310+$pi*195) ($y+50) 180 95;$null=Link $ad $fork $pn;$null=Link $ad $pn $join;Trace $pn $reqmap[$step.refs[0]].id;$pi++}
          $previous=$join;$y+=240;continue
        }
        $node=Node $p $ad $label 'Action' ($x+320) $y 320 105 0 $notes
        if($previous.ElementID -eq $dec.ElementID){$null=Link $ad $previous $node ('sí: '+$s.guard)}elseif($step.when){$null=Link $ad $previous $node $step.when}else{$null=Link $ad $previous $node}
        foreach($ref in $step.refs){Trace $node $reqmap[$ref].id}
        $previous=$node;$y+=135
        if($step.when){
          $merge=Node $p $ad '' 'Decision' ($x+460) ($y+35) 35 35
          $null=Link $ad $node $merge
          if($step.otherwise){$other=Node $p $ad $step.otherwise 'Action' ($x+680) ($y-135) 210 105;$null=Link $ad $gate $other ('no: '+$step.when);$null=Link $ad $other $merge}else{$null=Link $ad $gate $merge ('no: '+$step.when)}
          $previous=$merge;$y+=120
        }
      }
      $end=Node $p $ad '' 'StateNode' ($x+465) ($y+5) 26 26 101
      $null=Link $ad $previous $end
      $i++
    }
    [void]$ad.Update();$repo.SaveDiagram($ad.DiagramID)
    $sp=Elem $p "SEQ-$($rf.code) - $($rf.name)" 'Interaction' $rf.notes
    $script:behavior=$sp.ElementID
    foreach($r in $rf.requirements){Trace $sp $r.id}
    $sd=$p.Diagrams.AddNew("SEQ-$($rf.code) - $($rf.name)",'Sequence');$sd.ParentID=$sp.ElementID;$sd.Notes='Interacción de análisis. Cada fragmento opt representa una operación alternativa del mismo RF. Las condiciones y efectos coinciden con ACT. Los mensajes expresan responsabilidades propuestas, no firmas implementadas.';[void]$sd.Update()
    $actors=@($rf.scenarios | ForEach-Object {$_.actor} | Select-Object -Unique)
    $lifes=@{};$ax=70
    foreach($act in $actors){$type=if($act -eq 'Evento del sistema'){'Object'}else{'Actor'};$name=if($act -eq 'Evento del sistema'){'disparador : SUMA'}else{$act};$lifes[$act]=Elem $p $name $type '' $sp.ElementID;$ax+=210}
    $ui=Elem $p 'interfaz : SUMA' 'Object' 'Frontera de interacción; no representa una clase implementada.' $sp.ElementID
    $control=Elem $p 'coordinador : SUMA' 'Object' 'Coordinación del caso de uso a nivel de análisis.' $sp.ElementID
    $domain=Elem $p 'dominio' 'Object' 'Instancia del clasificador existente en la vista lógica.' $sp.ElementID
    if($classes.ContainsKey($rf.class)){$domain.ClassifierID=$classes[$rf.class];[void]$domain.Update()}
    $y=160;$script:seq=1;$script:positions=@()
    foreach($s in $rf.scenarios){
      $h=510+$s.steps.Count*180
      $f=Frag $p $sd ('operación = '+$s.name) 'opt' 20 $y ($ax+850) $h
      $actor=$lifes[$s.actor]
      $null=Msg $sd $actor $ui $s.request ($y+55)
      $null=Msg $sd $ui $control $s.check ($y+105)
      $ok=Frag $p $sd $s.guard 'opt' ($ax-20) ($y+145) 850 (80+$s.steps.Count*180)
      $sy=$y+195
      foreach($step in $s.steps){
        $notes=($step.refs | ForEach-Object {$reqmap[$_].notes}) -join "`r`n"
        if($step.when){$nested=Frag $p $sd $step.when 'opt' ($ax+320) ($sy-20) 530 130}
        if($step.parallel){$nested=Frag $p $sd 'lecturas independientes; sincronizar resultados' 'par' ($ax+320) ($sy-20) 530 130}
        $null=Msg $sd $control $domain (($step.refs -join ', ')+': '+$step.text) $sy $false $notes
        $null=Msg $sd $domain $control 'resultado de la operación' ($sy+80) $true
        if($step.otherwise){$null=Msg $sd $control $domain ('[no ('+$step.when+')] '+$step.otherwise) ($sy+140)}
        $sy+=180
      }
      $null=Msg $sd $control $ui ('['+$s.guard+'] resultado confirmado') ($sy+40) $true
      $bad=Frag $p $sd ('no ('+$s.guard+')') 'opt' ($ax-20) ($sy+65) 850 100
      $null=Msg $sd $control $ui $s.fail ($sy+120) $true
      $null=Msg $sd $ui $actor 'Presentar resultado o causa' ($sy+185) $true
      $y+=$h+100
    }
    $ax2=70;foreach($act in $actors){$null=Place $sd $lifes[$act] $ax2 30 170 ($y+30);$ax2+=210}
    $null=Place $sd $ui ($ax+40) 30 180 ($y+30)
    $null=Place $sd $control ($ax+340) 30 180 ($y+30)
    $null=Place $sd $domain ($ax+650) 30 180 ($y+30)
    [void]$sd.Update();$repo.SaveDiagram($sd.DiagramID)
    foreach($pos in $script:positions){$repo.Execute("UPDATE t_connector SET PtStartY=$($pos.y), PtEndY=$($pos.y) WHERE Connector_ID=$($pos.id)")}
    $script:manifest+=@{code=$rf.code;name=$rf.name;package=$p.PackageID;activity=$ad.DiagramID;sequence=$sd.DiagramID;requirements=@($rf.requirements.code);activityElement=$ap.ElementID;sequenceElement=$sp.ElementID}
    $script:manifest | ConvertTo-Json -Depth 8 | Set-Content -Encoding utf8 tmp/uml/manifest.json
    Write-Output "CREADO $($rf.code) ACT=$($ad.DiagramID) SEQ=$($sd.DiagramID)"
  }
  $repo.BatchAppend=$false;$repo.EnableUIUpdates=$true
  $project=$repo.GetProjectInterface()
  foreach($m in $script:manifest){
    foreach($kind in @('activity','sequence')){
      $d=$repo.GetDiagramByID([int]$m[$kind]);$file=Join-Path $root "diagramas/Procesos-RF-2026-11-27/$($m.code)-$kind.png"
      $project.PutDiagramImageToFile($d.DiagramGUID,$file,1) | Out-Null
    }
  }
  $repo.SQLQuery('SELECT Object_ID, Object_Type, Name, ParentID, PDATA1 FROM t_object WHERE Package_ID > 86') | Set-Content -Encoding utf8 tmp/uml/generated-objects.xml
} finally {$repo.CloseFile();$repo.Exit()}


