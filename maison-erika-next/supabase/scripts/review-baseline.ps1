[CmdletBinding()]
param(
  [Parameter(Mandatory)]
  [ValidateScript({ Test-Path -LiteralPath $_ -PathType Leaf })]
  [string]$BaselinePath
)

$baseline = Get-Content -LiteralPath $BaselinePath -Raw
$checks = @(
  @{ Name = 'Correos electrónicos'; Pattern = '(?i)\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b' },
  @{ Name = 'Claves secretas potenciales'; Pattern = '(?i)\b(sb_secret_[A-Za-z0-9_-]+|service[_-]?role\s*[=:]\s*[''\"][^''\"]+|supabase[_-]?(?:service[_-]?role|secret)[^''\"\r\n]*)' },
  @{ Name = 'Credenciales o contraseñas potenciales'; Pattern = '(?i)\b(password|passwd|api[_-]?key|secret)\s*[=:]\s*[''\"][^''\"]+' },
  @{ Name = 'DML de nivel superior'; Pattern = '(?im)^\s*(insert|update|delete|copy)\s+' }
)

$findings = foreach ($check in $checks) {
  foreach ($match in [regex]::Matches($baseline, $check.Pattern)) {
    $line = ($baseline.Substring(0, $match.Index) -split "`n").Count
    [pscustomobject]@{
      Categoria = $check.Name
      Linea = $line
      Coincidencia = $match.Value
    }
  }
}

if ($findings) {
  $findings | Format-Table -AutoSize
  Write-Error 'El baseline requiere revisión manual. No lo versionas ni lo apliques hasta clasificar cada coincidencia.'
  exit 1
}

Write-Output 'Sin correos, secretos, credenciales ni DML de nivel superior detectados.'
