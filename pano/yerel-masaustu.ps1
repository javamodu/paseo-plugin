# yerel-masaustu.ps1 - D-1a local desktop launcher (ASCII only; PS 5.1 safe)
# Port-probe (doluysa ADIYLA kirmizi) -> node pano/server.js -> tarayici /tuval -> kapat-kancasi (orphan yok).
$ErrorActionPreference = 'Stop'
$port = 4377
$pano = $PSScriptRoot
$repo = Split-Path -Parent $pano

# 1) PORT PROBE: mevcut surec varsa sessiz cakisma YOK - ADIYLA kirmizi cikis
$dolu = $false
try {
  $tc = New-Object Net.Sockets.TcpClient
  $tc.Connect('127.0.0.1', $port)
  $dolu = $true
  $tc.Close()
} catch { $dolu = $false }
if ($dolu) {
  Write-Host ("KIRMIZI: port {0} dolu - baska bir pano sureci calisiyor (PID bilinmiyor, ADI ile: once onu kapat)." -f $port) -ForegroundColor Red
  exit 1
}

# 2) SUNUCU: node pano/server.js (PANO_PORT varsayilan 4377)
$node = Start-Process -FilePath 'node' -ArgumentList 'server.js' -WorkingDirectory $pano -PassThru -NoNewWindow
Write-Host ("node PID {0} - pano/server.js basladi" -f $node.Id)

# 3) HAZIRLIK KAPISI: /api/repolar 200 donene dek (max 5 sn) bekle; donmezse durust kirmizi + temizlik
$hazir = $false
for ($i = 0; $i -lt 50; $i++) {
  Start-Sleep -Milliseconds 100
  try {
    $r = Invoke-WebRequest -UseBasicParsing -Uri ("http://127.0.0.1:{0}/api/repolar" -f $port) -TimeoutSec 1
    if ($r.StatusCode -eq 200) { $hazir = $true; break }
  } catch { }
}
if (-not $hazir) {
  Write-Host 'KIRMIZI: pano sunucusu 5 sn icinde hazir OLmadi - surec kapatiliyor (orphan yok).' -ForegroundColor Red
  if (-not $node.HasExited) { Stop-Process -Id $node.Id -Force }
  exit 1
}

# 4) TARAYICI: kapsul tuval yuzunu ac
Start-Process ("http://127.0.0.1:{0}/tuval" -f $port)
Write-Host 'Kapsul Tuval acildi: http://127.0.0.1:4377/tuval'
Write-Host 'Kapatmak icin bu pencerede Ctrl+C (node sureci otomatik temizlenir).'

# 5) KAPAT-KANCASI: pencere kapaninca / Ctrl+C'de node cocuk sureci oldurulur
try { Wait-Process -Id $node.Id } finally {
  if (-not $node.HasExited) { Stop-Process -Id $node.Id -Force; Write-Host 'node sureci temizlendi.' }
}
