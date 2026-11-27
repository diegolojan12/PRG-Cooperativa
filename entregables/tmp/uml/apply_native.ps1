$ErrorActionPreference='Stop'
$root=(Get-Location).Path
$source=Join-Path $root 'SUMA-Diagramas_Vistas.eapx'
$target=Join-Path $root 'SUMA-Diagramas_Vistas_Actividad_Secuencia.eapx'
Copy-Item -LiteralPath $source -Destination $target -Force
(Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash | Set-Content tmp/uml/source.sha256
$cn=New-Object -ComObject ADODB.Connection
$cn.Open('Provider=Microsoft.ACE.OLEDB.12.0;Data Source='+$target)
$queries=Get-Content tmp/uml/native.sql.json -Raw -Encoding utf8 | ConvertFrom-Json
[void]$cn.BeginTrans()
try {$i=0;foreach($q in $queries){[void]$cn.Execute($q);$i++;if($i%1000 -eq 0){Write-Output "Insertados $i / $($queries.Count)"}};$cn.CommitTrans();Write-Output 'Modelo guardado'} catch {$cn.RollbackTrans();throw} finally {$cn.Close()}
