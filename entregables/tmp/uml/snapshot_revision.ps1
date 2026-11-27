$ErrorActionPreference='Stop'
$cn=New-Object -ComObject ADODB.Connection
$cn.Open('Provider=Microsoft.ACE.OLEDB.12.0;Data Source='+(Join-Path (Get-Location) 'SUMA-Diagramas_Vistas_Actividad_Secuencia.eapx'))
$out=@{}
foreach($table in @('t_package','t_object','t_connector','t_diagram','t_diagramobjects','t_diagramlinks')){
 $rs=$cn.Execute("SELECT * FROM $table");$items=New-Object System.Collections.Generic.List[object]
 while(-not $rs.EOF){$row=@{};for($i=0;$i -lt $rs.Fields.Count;$i++){$f=$rs.Fields.Item($i);$row[$f.Name]=if($f.Value -is [DBNull]){$null}else{$f.Value}};$items.Add($row);$rs.MoveNext()}
 $out[$table]=@($items.ToArray());$rs.Close()
}
$cn.Close();$out|ConvertTo-Json -Depth 7|Set-Content -Encoding utf8 tmp/uml/revision-snapshot.json
