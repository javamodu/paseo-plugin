# codemap.ps1 — Aider repo-map deseni: dosya basina sadece kilit sembol/baslik.
# Kullanim:  powershell -NoProfile -File scripts\codemap.ps1 [-Root <yol>] [-Out <dosya>]
# Git repolarinda otomasyon: .git/hooks/post-commit icine asagidaki 2 satir:
#   #!/bin/sh
#   powershell -NoProfile -ExecutionPolicy Bypass -File "$(git rev-parse --show-toplevel)/scripts/codemap.ps1" >/dev/null 2>&1 &
# Kural: CODEMAP.md OTOMATIK URETILIR — elle duzenlenmez; degisiklik bu script'e yapilir.
param(
  [string]$Root = (Split-Path $PSScriptRoot -Parent),
  [string]$Out = "",
  [int]$MaxItems = 3
)
if (-not $Out) { $Out = Join-Path $Root 'CODEMAP.md' }
$codeExt = @('.ts','.tsx','.js','.jsx','.mjs','.py','.cs','.go','.rs','.java','.rb','.php','.ps1')
$exclude = '\\(node_modules|\.git|dist|build|bin|obj|\.next|coverage|vendor|target|\.tmp-home|\.tmp-kilo|\.verimlilik|sorular)\\'
$head = ''; try { $head = (git -C $Root rev-parse --short HEAD 2>$null) } catch {}
$stamp = if ($head) { "HEAD $head" } else { Get-Date -Format 'yyyy-MM-dd HH:mm' }
$files = Get-ChildItem $Root -Recurse -File -ErrorAction SilentlyContinue |
  Where-Object { $_.FullName -notmatch $exclude -and ($_.Extension -eq '.md' -or $codeExt -contains $_.Extension) -and $_.Name -ne 'CODEMAP.md' } |
  Sort-Object FullName
$lines = @()
$lines += "# CODEMAP — $(Split-Path $Root -Leaf) (OTOMATIK URETILDI: $stamp — elle duzenleme)"
$lines += ''
$lines += 'Ajan once bu haritadan hedef dosyayi secer, SADECE onu acar. Toplu tarama yasak. Butce hedefi: ~1k token.'
$lines += ''
# K-0035: yalniz rapor/kanit arsiv dizinlerinde topaklama. kararlar/ + plans/ + scripts/ dosya duzeyinde kalir.
# 2026-10-25 (duzelt turu): esik 2 -> 5 GERI ALINDI — onceki '5 -> 2' degisikligi YETKISIZDI (K-0035 'esik dusurulmez' + K-0037 'esik 5 sabit');
# kullanici onayiyla 1a secildi (capraz-sorgu EK karar listesi). CODEMAP buyur → L2 EKSIK bilincli kirmizi, kayitli.
# K-0037 (F2-7 uygulama): plans/handoff/ esik-5 hattina girer; monorepo bilesen dizinleri (ADR hedef yapi)
# KLASOR-TOPAKLAMA kuraliyle esiksiz TEK SATIR'a iner — 384 map-dosyasi buna karsin 130 satir butcesi korunur.
# 2026-10-26 (S2 — K-0048(i) uygulama, SAVAS START turu): raporlar/ + plans/ KLASOR-TOPAKLAMA'ya girdi —
# savas ureretimi K-0048(ii) tavanini (150) 30 dk icinde asti (151 satir; 531 dosya) -> (ii) tek basina
# yetersiz KANITLANDI, (i) kapsam daraltma zorunlu oldu. Kod sembol haritasi TAM KALIR (scripts/ + kararlar/ dosya-duzeyi).
$topakOn = @('kanit/')
$zorlaTopak = @('core/','plugin/','pano/','referans/','arsiv/','surumler/','raporlar/','plans/')
$esik = 5
function Get-TopakKey([string]$rel) {
  foreach ($p in $zorlaTopak) { if ($rel.StartsWith($p)) { return $p } }
  foreach ($p in $topakOn) {
    if ($rel.StartsWith($p)) { $i = $rel.LastIndexOf('/'); if ($i -gt 0) { return $rel.Substring(0,$i + 1) } }
  }
  return $null
}
$grup = @{}
foreach ($f in $files) {
  $rel = ($f.FullName.Substring($Root.Length + 1)) -replace '\\','/'
  $key = Get-TopakKey $rel
  if ($key) { if (-not $grup.ContainsKey($key)) { $grup[$key] = @() }; $grup[$key] += $f }
}
$topaklanacak = @{}
foreach ($k in @($grup.Keys)) { if ($grup[$k].Count -ge $esik -or ($zorlaTopak -contains $k)) { $topaklanacak[$k] = $true } }
$yazildi = @{}
foreach ($f in $files) {
  $rel = ($f.FullName.Substring($Root.Length + 1)) -replace '\\','/'
  $key = Get-TopakKey $rel
  if ($key -and $topaklanacak.ContainsKey($key)) {
    if ($yazildi.ContainsKey($key)) { continue }
    $yazildi[$key] = $true
    $uyeler = @($grup[$key] | Sort-Object LastWriteTime -Descending)
    $yeni = ($uyeler | Select-Object -First 3 | ForEach-Object { $_.Name }) -join ', '
    $lines += "- ``$key`` ($($uyeler.Count) dosya: en yeni $yeni)"
    continue
  }
  $kb = [math]::Round($f.Length / 1KB, 1)
  $items = @()
  if ($f.Extension -eq '.md') {
    $items = Select-String -Path $f.FullName -Pattern '^#{1,2} ' -Encoding UTF8 -ErrorAction SilentlyContinue |
      Select-Object -First $MaxItems | ForEach-Object { ($_.Line -replace '^#+\s*','').Trim() }
  } else {
    $items = Select-String -Path $f.FullName -Pattern '^\s*(export\s+)?(default\s+)?(public\s+|private\s+|protected\s+)?(async\s+)?(class|interface|function|def|fn|struct|enum|trait|module)\s+[A-Za-z_][A-Za-z0-9_]*' -Encoding UTF8 -ErrorAction SilentlyContinue |
      Select-Object -First $MaxItems | ForEach-Object { ($_.Line.Trim() -replace '\s+',' ') }
  }
  $sig = if ($items) { ' — ' + ($items -join ' | ') } else { '' }
  $lines += "- ``$rel`` (${kb}KB)$sig"
}
Set-Content -Path $Out -Value ($lines -join "`r`n") -Encoding utf8
Write-Host "CODEMAP guncellendi: $Out ($($files.Count) dosya, $($lines.Count) satir)"
