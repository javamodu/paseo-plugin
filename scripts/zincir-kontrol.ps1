param([string]$RepoKok = (Get-Location).Path)
$ErrorActionPreference = 'Stop'
$dir = Join-Path $RepoKok 'plans\handoff'
if (-not (Test-Path $dir)) { Write-Host 'handoff dizini yok - zincir denetimi atlanir'; exit 0 }
$dosyalar = Get-ChildItem $dir -Filter 'HANDOFF-*.md' | Sort-Object Name
if ($dosyalar.Count -le 1) { Write-Host "ZINCIR OK ($($dosyalar.Count) dosya - zincir gerektirmez)"; exit 0 }
$hata = 0
for ($i = 1; $i -lt $dosyalar.Count; $i++) {
  $onceki = $dosyalar[$i - 1].BaseName
  $icerik = Get-Content $dosyalar[$i].FullName -Raw -Encoding UTF8
  if ($icerik -notmatch [regex]::Escape($onceki)) { Write-Host "KOPUK: $($dosyalar[$i].Name) oncekine ($onceki) atif yok"; $hata++ }
}
if ($hata -eq 0) { Write-Host "ZINCIR OK ($($dosyalar.Count) handoff, kopuk yok)" } else { Write-Host "ZINCIR KOPUK: $hata nokta"; exit 1 }
