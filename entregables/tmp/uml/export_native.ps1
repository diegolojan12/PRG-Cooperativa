param([string]$Codes='RF-01,RF-22,RF-48,RF-50')
$ErrorActionPreference='Stop'
Write-Output 'Iniciando EA'
$app=[Runtime.InteropServices.Marshal]::GetActiveObject('EA.App')
$r=$app.Repository
Write-Output 'Abriendo modelo'
if(-not $r.OpenFile((Join-Path (Get-Location) 'SUMA-Diagramas_Vistas_Actividad_Secuencia.eapx'))){throw 'No se pudo abrir modelo'}
Write-Output 'Modelo abierto'
$project=$r.GetProjectInterface()
$manifest=Get-Content tmp/uml/manifest.json -Raw -Encoding utf8 | ConvertFrom-Json
foreach($m in $manifest){if($Codes -ne '*' -and $m.code -notin ($Codes -split ',')){continue};foreach($k in @('activity','sequence')){
    Write-Output "Exportando $($m.code) $k"
    $d=$r.GetDiagramByID([int]$m.$k)
    $dest=Join-Path (Get-Location) "diagramas/Procesos-RF-2026-11-27/$($m.code)-$k.png"
    [void]$project.PutDiagramImageToFile($d.DiagramGUID,$dest,1)
    Write-Output "Exportado $dest"
}}
$r.OpenDiagram(1001)
Write-Output 'Exportación terminada'
[Environment]::Exit(0)
