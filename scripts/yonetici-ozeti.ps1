# yonetici-ozeti.ps1 — kus bakisi yonetici ozeti: LOC, milestone, disiplin, saglik, TOKEN/HIZ/VERIM.
# Kullanim: powershell -NoProfile -File scripts\yonetici-ozeti.ps1 [-Root <yol>] [-TokenDays <n>]
#   -TokenDays 1 : sadece bugun (varsayilan) · 7 : son 7 gun · 0 : tum kayitlar
#   -SadeceToken : repo bolumlerini atlar — Paseo-geneli tum-projeler raporu
#   -TokenRepo X : token tablosunu cwd'si X iceren projelerle sinirlar (proje-ozel)
# Olcum notu: token verisi ~/.codex/sessions rollout kayitlarindan okunur (R = gercek olcum).
# Cache tasarrufu %90 indirim varsayimiyla hesaplanir (OpenAI fiyat tablosu, plan §4, R).
# Plugin gelince bu metrikler workspace paneline .verimlilik\telemetri.jsonl uzerinden akar (Plan §2 gozlem modulu).
param(
  [string]$Root = (Split-Path $PSScriptRoot -Parent),
  [int]$TokenDays = 1,
  [string]$TokenRepo = '',     # cwd filtresi (ornek: -TokenRepo chinese-hsk); bos = tum projeler
  [switch]$SadeceToken         # repo bolumlerini atla: hizli Paseo-geneli veya proje-ozel token raporu
)
$ErrorActionPreference = 'SilentlyContinue'
Write-Host "=================== YONETICI OZETI ==================="
Write-Host ("Repo: " + $Root + "  ·  " + (Get-Date -Format 'yyyy-MM-dd HH:mm'))

if (-not $SadeceToken) {

# 1) LOC
$ext = @{}
$totalFiles = 0; $totalLoc = 0
Get-ChildItem $Root -Recurse -File | Where-Object { $_.FullName -notmatch '\\(\.git|node_modules|dist|build)\\' } | ForEach-Object {
  $totalFiles++
  $e = if ($_.Extension) { $_.Extension } else { '(yok)' }
  $n = (Get-Content $_.FullName -Encoding UTF8).Count
  $ext[$e] = @{ f = ($ext[$e].f + 1); loc = ($ext[$e].loc + $n) }
  $totalLoc += $n
}
Write-Host "`n--- LOC ---"
$ext.GetEnumerator() | Sort-Object { $_.Value.loc } -Descending | ForEach-Object { Write-Host ("{0,-8} {1,4} dosya {2,8} satir" -f $_.Key, $_.Value.f, $_.Value.loc) }
Write-Host ("TOPLAM    {0,4} dosya {1,8} satir" -f $totalFiles, $totalLoc)

# 2) Milestones (git)
if (Test-Path "$Root\.git") {
  Write-Host "`n--- MILESTONE ZAMAN CIZELGESI ---"
  git -C $Root log --reverse --format="%ad | %h | %s" --date=short | ForEach-Object { Write-Host $_ }
}

# 3) Disiplin istatistikleri
Write-Host "`n--- DISIPLIN ---"
$h = @(Get-ChildItem "$Root\plans\handoff" -Filter 'HANDOFF-*.md').Count
$k = @(Get-ChildItem "$Root\kararlar" -Filter 'K-*.md').Count
$d = @(Select-String -Path "$Root\DERSLER.md" -Pattern '^- ').Count
$s = @(Select-String -Path "$Root\STATE_BOARD.md" -Pattern '^- \d{4}').Count
Write-Host ("Handoff: {0} · Karar(ADR): {1} · Ders: {2} · Damga: {3}" -f $h, $k, $d, $s)

# 4) Saglik skoru (doctor)
Write-Host "`n--- SAGLIK (saglik.ps1) ---"
$out = powershell -NoProfile -ExecutionPolicy Bypass -File "$Root\scripts\saglik.ps1" -Root $Root | Select-Object -Last 1
Write-Host $out

}  # SadeceToken sonu

# 5) TOKEN / HIZ / VERIM (codex rollout kayitlari; oturum-gunu bazli, tur-bazinda gercek harcama)
$kapsam = if ($TokenRepo) { "filtre: $TokenRepo" } else { "tum projeler" }
Write-Host "`n--- TOKEN / HIZ / VERIM (TokenDays=$TokenDays · $kapsam) ---"
$cutoff = [datetime]::MinValue
if ($TokenDays -gt 0) { $cutoff = (Get-Date).Date.AddDays(-($TokenDays - 1)) }
$sf = Get-ChildItem "$env:USERPROFILE\.codex\sessions" -Recurse -Filter *.jsonl | Where-Object {
  $dm = [regex]::Match($_.FullName, '\\(\d{4})\\(\d{2})\\(\d{2})\\')
  $dm.Success -and ([datetime]($dm.Groups[1].Value + '-' + $dm.Groups[2].Value + '-' + $dm.Groups[3].Value)) -ge $cutoff
}
$grp = @{}; $sumIn = [long]0; $sumCch = [long]0; $sumOut = [long]0; $sumTur = 0; $sumDk = 0.0; $dosya = 0
$minT = [datetime]::MaxValue; $maxT = [datetime]::MinValue
foreach ($f in $sf) {
  $lines = Get-Content $f.FullName
  if (-not $lines) { continue }
  try { $meta = ($lines[0] | ConvertFrom-Json) } catch { continue }
  if ($meta.type -ne 'session_meta') { continue }
  if ($TokenRepo -and ($meta.payload.cwd -notmatch [regex]::Escape($TokenRepo))) { continue }
  $tok = $lines | Where-Object { $_ -match '"type":"token_usage_record"' }
  if (-not $tok) { continue }
  # token_usage_record tur icinde birikimli yayinlanir (her adimda artan); gercek harcama = turn_id basina MAX
  $perTurn = @{}
  foreach ($tl in $tok) {
    $mm = [regex]::Match($tl, '"turn_id":"([^"]+)"')
    $um = [regex]::Match($tl, '"turn_token_usage":\{[^}]+\}')
    if (-not $mm.Success -or -not $um.Success) { continue }
    $u = (('{' + $um.Value + '}') | ConvertFrom-Json).turn_token_usage
    $kturn = $mm.Groups[1].Value
    if (-not $perTurn.ContainsKey($kturn) -or $perTurn[$kturn].tot -lt [long]$u.total_tokens) {
      $perTurn[$kturn] = @{ inp = [long]$u.input_tokens; cch = [long]$u.cached_input_tokens; outp = [long]$u.output_tokens; tot = [long]$u.total_tokens }
    }
  }
  $fi = [long]0; $fc = [long]0; $fo = [long]0
  foreach ($pt in $perTurn.Values) { $fi += $pt.inp; $fc += $pt.cch; $fo += $pt.outp }
  $t0 = [datetime]$meta.timestamp
  $t1 = [datetime](($lines[-1] | ConvertFrom-Json).timestamp)
  $kc = $meta.payload.cwd
  if (-not $grp.ContainsKey($kc)) { $grp[$kc] = @{ n = 0; tur = 0; dk = 0.0; inp = [long]0; cch = [long]0; outp = [long]0 } }
  $g = $grp[$kc]
  $g.n++; $g.tur += $perTurn.Count; $g.dk += ($t1 - $t0).TotalMinutes; $g.inp += $fi; $g.cch += $fc; $g.outp += $fo
  $sumIn += $fi; $sumCch += $fc; $sumOut += $fo; $sumTur += $perTurn.Count; $sumDk += ($t1 - $t0).TotalMinutes; $dosya++
  if ($t0 -lt $minT) { $minT = $t0 }
  if ($t1 -gt $maxT) { $maxT = $t1 }
}
if ($dosya -eq 0) {
  Write-Host "Bu donem icin rollout kaydi yok."
} else {
  foreach ($kc in ($grp.Keys | Sort-Object { $grp[$_].inp } -Descending)) {
    $g = $grp[$kc]
    $hit = [math]::Round(100.0 * $g.cch / [math]::Max(1.0, [double]$g.inp), 1)
    $mark = ''
    if ($kc -ieq $Root) { $mark = '  <== BU REPO' }
    Write-Host ("{0,-44} otrm:{1,3} tur:{2,4} in:{3,11} out:{4,9} hit:%{5}{6}" -f $kc, $g.n, $g.tur, $g.inp, $g.outp, $hit, $mark)
  }
  $sumTot = $sumIn + $sumOut
  $hitAll = [math]::Round(100.0 * $sumCch / [math]::Max(1.0, [double]$sumIn), 1)
  $etkin = ($sumIn - $sumCch) + [long][math]::Round($sumCch * 0.1) + $sumOut
  $tasarruf = [math]::Round(100.0 * (1.0 - ($etkin / [math]::Max(1.0, [double]$sumTot))), 1)
  $spanDk = [math]::Round(($maxT - $minT).TotalMinutes, 1)
  $paralel = 0.0
  if ($spanDk -gt 0) { $paralel = [math]::Round($sumDk / $spanDk, 1) }
  Write-Host ("TOPLAM: {0} oturum · {1} tur · in:{2} cached:{3} out:{4} · toplam:{5}" -f $dosya, $sumTur, $sumIn, $sumCch, $sumOut, $sumTot)
  Write-Host ("VERIM: cache-hit %{0} · efektif maliyet ~{1} token (cached %90 indirimli) => %{2} tasarruf" -f $hitAll, $etkin, $tasarruf)
  Write-Host ("HIZ: {0} ajan-dakikasi / {1} dk takvim => ~{2}x paralellik" -f [math]::Round($sumDk, 1), $spanDk, $paralel)
}
# 6) Telemetri (plugin JSONL'i varsa)
$j = "$Root\.verimlilik\telemetri.jsonl"
if (Test-Path $j) {
  $ev = Get-Content $j -Encoding UTF8 | ForEach-Object { $_ | ConvertFrom-Json }
  $tur = @($ev | Where-Object tip -eq 'tur').Count
  $ch = @($ev | Where-Object { $_.tip -eq 'cache' -and $_.hit }).Count
  $ct = @($ev | Where-Object tip -eq 'cache').Count
  $dur = @($ev | Where-Object tip -eq 'durtme').Count
  Write-Host "`n--- AJAN TELEMETRISI ---"
  if ($ct -gt 0) { Write-Host ("Tur: {0} · Cache-hit: %{1:N0} · Durtme: {2}" -f $tur, ($ch * 100.0 / $ct), $dur) }
  $ka = @($ev | Where-Object { $_.tip -eq 'kabul' -and $_.kabul -eq $true }).Count
  $kt = @($ev | Where-Object { $_.tip -eq 'kabul' }).Count
  if ($kt -gt 0) { Write-Host ("Kabul orani: %{0:N0} ({1}/{2}) — hedef >%60, alarm <%44 (METR)" -f ($ka * 100.0 / $kt), $ka, $kt) }
}
Write-Host "======================================================"






