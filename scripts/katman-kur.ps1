param([Parameter(Mandatory=$true)][string]$RepoKok, [switch]$Force)
$ErrorActionPreference = 'Stop'
$RepoKok = (Resolve-Path -LiteralPath $RepoKok).Path
$kokIsaret = @('.git','package.json','ANAYASA.md','AGENTS.md','CLAUDE.md','README.md') | Where-Object { Test-Path (Join-Path $RepoKok $_) }
if (-not $kokIsaret -and -not $Force) {
  Write-Host ('RED: ' + $RepoKok + ' proje-koku isareti icermiyor (.git/package.json/ANAYASA/AGENTS/README yok). Yanlis yolda sifirdan agac kurma riski - bilincli kurulum icin -Force.')
  exit 1
}
$utf8 = New-Object System.Text.UTF8Encoding($false)
$kuruldu = @(); $atlanan = @()
$tarih = Get-Date -Format 'yyyy-MM-dd'
$sablonKok = Split-Path $PSScriptRoot -Parent

function Kur($hedef, $sablonAd) {
  if (Test-Path $hedef) { $script:atlanan += (Split-Path $hedef -Leaf); return }
  $icerik = [IO.File]::ReadAllText((Join-Path $sablonKok $sablonAd), $utf8)
  $icerik = $icerik.Replace('<PROJE>', (Split-Path $RepoKok -Leaf)).Replace('<TARIH>', $tarih)
  [IO.File]::WriteAllText($hedef, $icerik, $utf8)
  $script:kuruldu += (Split-Path $hedef -Leaf)
}

foreach ($d in @('plans\handoff', 'kararlar', 'raporlar')) {
  $tam = Join-Path $RepoKok $d
  if (-not (Test-Path $tam)) { New-Item -ItemType Directory -Force -Path $tam | Out-Null; $script:kuruldu += ($d + '/') }
}

Kur (Join-Path $RepoKok 'STATE_BOARD.md') 'STATE_BOARD-SABLONU.md'
Kur (Join-Path $RepoKok 'DERSLER.md') 'DERSLER-SABLONU.md'
Kur (Join-Path $RepoKok 'plans\handoff\HANDOFF-SABLONU.md') 'HANDOFF-SABLONU.md'

Write-Host ("KURULDU: " + ($kuruldu -join ', '))
Write-Host ("ATLANAN (zaten var): " + ($atlanan -join ', '))
Write-Host ("SONUC: " + $kuruldu.Count + " kuruldu, " + $atlanan.Count + " atlandi")
