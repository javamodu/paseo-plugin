# TUR-1 B6b (2026-10-25): yeni eve tasindi - eski ev (silinecek-task-graph) F4'te silinecek.
# Gomulu PANO_TOKEN degeri KALDIRILDI (B6b/F19 hatti): token env'den (ORDU_PANO_TOKEN) okunur;
# env yoksa pano-token.txt (repo'da zaten kayitli - E15 insana devri bekler) kullanilir.
# Kaynak script: core/src/pano-server.ts:187-196 (env: ORDU_DB, ORDU_PANO_PORT, ORDU_PANO_TOKEN).
if (-not $env:ORDU_PANO_TOKEN) {
  $tokenDosya = Join-Path $PSScriptRoot 'pano-token.txt'
  if (Test-Path $tokenDosya) { $env:ORDU_PANO_TOKEN = (Get-Content $tokenDosya -Raw).Trim() }
}
$env:ORDU_DB = 'D:\Vibecode\ordu\core\veri\ordu.sqlite'
$env:ORDU_PANO_PORT = '8787'
Set-Location 'D:\Vibecode\ordu\core'
node src/pano-server.ts
