$ErrorActionPreference='Stop'
$cn=New-Object -ComObject ADODB.Connection
$cn.Open('Provider=Microsoft.ACE.OLEDB.12.0;Data Source='+(Join-Path (Get-Location) 'SUMA-Diagramas_Vistas_Actividad_Secuencia.eapx'))
[void]$cn.BeginTrans()
try{foreach($q in (Get-Content tmp/uml/sequence-layout.sql.json -Raw -Encoding utf8|ConvertFrom-Json)){[void]$cn.Execute($q)};$cn.CommitTrans();'Reorganización guardada'}catch{$cn.RollbackTrans();throw}finally{$cn.Close()}

