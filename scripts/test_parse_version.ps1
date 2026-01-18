# Quick test to parse version from pyproject.toml
$text = Get-Content -Raw -Encoding UTF8 pyproject.toml
$pattern = @'
version\s*=\s*["'](?<v>[^"']+)["']
'@
$m = [regex]::Match($text, $pattern)
if ($m.Success) { Write-Host $m.Groups['v'].Value; exit 0 } else { Write-Error 'no match'; exit 2 }
