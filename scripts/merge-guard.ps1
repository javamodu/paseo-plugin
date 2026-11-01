# merge-guard.ps1 - staged alanda ASLA-desen kontrolu (v10: SK-1 ps51-kapisi kancasi; 2026-11-01)
# Kaynak: raporlar/gelen-kutu/v9-kalite-koruyucu-hiz-2026-10-28.md madde V9-02 (v9) + plans/SORUN-KAPATMA-3AJAN-PLANI-2026-11-01.md ORDU-1 (v10 kanca).
# Desenler: scripts/yasak-liste.json (kirli-liste.json'in ASLA-tarafi aynasi).
# Cagiran: .git/hooks/pre-commit shim. Tek basina da kosulur (dry-run).
# Fail-closed: liste yok/okunamadi/bos -> exit 1 (KAPI-INFAZ-EDILEMEDI).
$ErrorActionPreference = 'Stop'

$kok = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$listeYolu = Join-Path $kok 'scripts\yasak-liste.json'
if (-not (Test-Path -LiteralPath $listeYolu)) {
  Write-Output 'KAPI-INFAZ-EDILEMEDI: scripts/yasak-liste.json bulunamadi (fail-closed)'
  exit 1
}
try {
  $desenler = @((Get-Content -LiteralPath $listeYolu -Raw -Encoding UTF8 | ConvertFrom-Json).desenler)
} catch {
  Write-Output "KAPI-INFAZ-EDILEMEDI: yasak-liste.json okunamiyor: $($_.Exception.Message)"
  exit 1
}
if ($desenler.Count -eq 0) {
  Write-Output 'KAPI-INFAZ-EDILEMEDI: yasak-liste.json desen listesi bos (fail-closed)'
  exit 1
}

$staged = @(git diff --cached --name-only)
$ihlal = @()
foreach ($dosya in $staged) {
  if ([string]::IsNullOrWhiteSpace($dosya)) { continue }
  foreach ($desen in $desenler) {
    if ($dosya.Contains($desen)) { $ihlal += "$dosya (desen: $desen)"; break }
  }
}
if ($ihlal.Count -gt 0) {
  Write-Output ('YASAK-DOSYA-STAGED: ' + ($ihlal -join '; '))
  Write-Output 'Kural: probe-latest.json / ordu.sqlite-shm,wal / gece.jsonl / tmp-* ASLA commite girmez. Commit iptal edildi (merge-guard v9 V9-02).'
  exit 1
}
# --- v10 ince kanca (SK-1 / S1): staged .ps1 varsa ps51-kapisi mekanik freni AYRI surecte kosar ---
# (ayri surec: kapi exit 1 merge-guard'i oldurmez, $LASTEXITCODE ayri okunur; uyari sinifi [exit 2] engellemez)
$ps51Kapisi = Join-Path $kok 'scripts\ps51-kapisi.ps1'
$stagedPs1 = @($staged | Where-Object { $_ -like '*.ps1' })
if ($stagedPs1.Count -gt 0) {
  $ps51Cikti = @(powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File $ps51Kapisi); $ps51Exit = $LASTEXITCODE
  foreach ($s in $ps51Cikti) { Write-Output $s }
  if ($ps51Exit -eq 1) { Write-Output 'PS51-KAPISI-RED: commit iptal edildi (merge-guard v10 SK-1 kancasi)'; exit 1 }
}
Write-Output ('merge-guard GECTI: staged ' + $staged.Count + ' dosya, yasak-desen eslesmesi 0 (v10: ps51-kapisi ' + $stagedPs1.Count + ' ps1 taradi)')
exit 0
