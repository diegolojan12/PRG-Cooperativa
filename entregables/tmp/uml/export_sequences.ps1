param([string]$Codes='RF-03,RF-10,RF-20,RF-50')
$ErrorActionPreference='Stop'
$app=[Runtime.InteropServices.Marshal]::GetActiveObject('EA.App');$r=$app.Repository
if(-not $r.OpenFile((Join-Path (Get-Location) 'SUMA-Diagramas_Vistas_Actividad_Secuencia.eapx'))){throw 'No se pudo abrir modelo'}
$project=$r.GetProjectInterface()
$catalog=Get-Content tmp/uml/sequence-catalog.json -Raw -Encoding utf8|ConvertFrom-Json
$out=Join-Path (Get-Location) 'diagramas/Procesos-RF-2026-11-27'
[void](New-Item -ItemType Directory -Path (Join-Path $out 'secuencias') -Force)
foreach($m in $catalog){if($Codes -ne '*' -and $m.code -notin ($Codes -split ',')){continue}
 $d=$r.GetDiagramByID([int]$m.diagram)
 [void]$project.PutDiagramImageToFile($d.DiagramGUID,(Join-Path $out $m.file),1)
 Write-Output "Exportado $($m.name)"
}
$r.OpenDiagram(1006)
Write-Output 'Exportación de secuencias terminada'
[Environment]::Exit(0)
