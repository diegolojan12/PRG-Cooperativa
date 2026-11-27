$ErrorActionPreference='Stop'
$target=Join-Path (Get-Location) 'SUMA-Diagramas_Vistas_Actividad_Secuencia.eapx'
$app=[Runtime.InteropServices.Marshal]::GetActiveObject('EA.App');$r=$app.Repository
$r.SaveAllDiagrams();$r.CloseFile()
$backup=Join-Path (Get-Location) 'originales/SUMA-antes-separar-actividades-secuencias.eapx'
if(-not (Test-Path -LiteralPath $backup)){Copy-Item -LiteralPath $target -Destination $backup}
if(-not $r.OpenFile($target)){throw 'No se pudo abrir la entrega'}
$parent=$r.GetPackageByID(15)
for($i=$parent.Packages.Count-1;$i -ge 0;$i--){$p=$parent.Packages.GetAt($i);if($p.PackageID -in @(19,20)){Write-Output ('Eliminando '+$p.Name);$parent.Packages.DeleteAt($i,$false)}}
$parent.Packages.Refresh();$r.CloseFile()
Write-Output 'Históricos retirados; modelo cerrado para reorganización'
[Environment]::Exit(0)
