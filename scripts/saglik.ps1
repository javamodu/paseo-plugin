# saglik.ps1 — verimlilik-doctor v3.3: saglik + olcum + kural-sayaci + kabul-orani kapilari (repo-konvansiyon agnostik).
# Kullanim: powershell -NoProfile -File scripts\saglik.ps1 [-Root <yol>] [-Jsonl <telemetri.jsonl>]
# Katman A: dosya varligi (kök VEYA plans/ alternatifleri), butce sinirlari, CODEMAP tazeligi, handoff zinciri, rehber hijyeni.
# Katman B (JSONL verilirse): tur / cache-hit / durtme / kabul-orani sayaclari hedef esiklerle karsilastirilir.
# SARI = uyaridir, SONUC'u bozmaz; EKSIK = kapi kirar.
param([string]$Root = (Split-Path $PSScriptRoot -Parent), [string]$Jsonl = "")
$ESIK = @{ CacheHitMin = 60; DurmeMaxGunluk = 10; KabulHedef = 60; KabulAlarm = 44; KuralSari = 40; KuralKirmizi = 80 }
$hedefDosya = Join-Path $Root 'hedefler.json'
if (Test-Path $hedefDosya) {
  try {
    $hj = Get-Content $hedefDosya -Encoding UTF8 -Raw | ConvertFrom-Json
    $ah = $hj.aktifHedefler
    if ($ah) {
      if ($ah.cacheHitMinPct) { $ESIK.CacheHitMin = [double]$ah.cacheHitMinPct }
      if ($ah.kabulOraniHedefPct) { $ESIK.KabulHedef = [double]$ah.kabulOraniHedefPct }
      if ($ah.kabulOraniAlarmPct) { $ESIK.KabulAlarm = [double]$ah.kabulOraniAlarmPct }
      if ($ah.kuralSariEsik) { $ESIK.KuralSari = [int]$ah.kuralSariEsik }
      if ($ah.kuralKirmiziEsik) { $ESIK.KuralKirmizi = [int]$ah.kuralKirmiziEsik }
    }
  } catch { }
}
$pass = 0; $fail = 0; $warnN = 0; $rows = @()
function Check($ad, $ok, $detay) {
  $script:rows += [pscustomobject]@{ Kontrol = $ad; Durum = $(if ($ok) { 'OK' } else { 'EKSIK' }); Detay = $detay }
  if ($ok) { $script:pass++ } else { $script:fail++ }
}
function Find-First([string]$root, [string[]]$paths) { foreach ($p in $paths) { $full = Join-Path $root $p; if (Test-Path $full) { return $full } }; return $null }
function Warn($ad, $detay) { $script:rows += [pscustomobject]@{ Kontrol = $ad; Durum = 'SARI'; Detay = $detay }; $script:warnN++ }
function LineCount($p) { if ($p -and (Test-Path $p)) { (Get-Content $p -Encoding UTF8).Count } else { -1 } }

# 1) Katman dosyalari (alternatif yol listeleri: kök veya plans/)
$pAnayasa = Find-First $Root @('ANAYASA.md')
$pL0 = Find-First $Root @('AGENTS.md','CLAUDE.md')
$pL1 = Find-First $Root @('STATE_BOARD.md','plans\STATE_BOARD.md','plans\referans\STATE_BOARD.md')
$pL2 = Find-First $Root @('CODEMAP.md','plans\CODEMAP.md','plans\referans\CODEMAP.md')
$pL5 = Find-First $Root @('DERSLER.md','plans\DERSLER.md','plans\referans\DERSLER.md')
$pL4 = Find-First $Root @('kararlar','plans\kararlar','plans\referans\kararlar')
$pL3 = Find-First $Root @('raporlar','plans\raporlar','plans\referans\raporlar')
$pHd = Find-First $Root @('plans\handoff','handoff','plans\referans\handoff')
Check 'ANAYASA.md (proje ust otoritesi)' ($null -ne $pAnayasa) 'yoksa Ferman 3 ile kur'
Check 'L0 AGENTS.md' ($null -ne $pL0) 'her zaman yuklu kurallar'
Check 'L1 STATE_BOARD.md' ($null -ne $pL1) 'kök veya plans/ altinda'
Check 'L2 CODEMAP.md' ($null -ne $pL2) 'codemap ureticisi ile uret'
Check 'L5 DERSLER.md' ($null -ne $pL5) 'acilis okumasi; negatif bilgi'
Check 'L4 kararlar/ dizini' ($null -ne $pL4) 'ADR: K-XXXX.md'
Check 'L3 raporlar/ dizini' ($null -ne $pL3) 'append-only + OZET.md'
Check 'handoff dizini' ($null -ne $pHd) 'devir toreni ciktilari'

# 2) Butce sinirlari
$l0 = LineCount $pL0; if ($l0 -ge 0) { Check 'L0 butce <=200 satir' ($l0 -le 200) "$l0 satir" }
$l1 = LineCount $pL1; if ($l1 -ge 0) { Check 'L1 butce <=100 satir' ($l1 -le 100) "$l1 satir" }
$cm = LineCount $pL2; if ($cm -ge 0) { Check 'L2 CODEMAP butce <=130 satir' ($cm -le 130) "$cm satir (dokuman haritasi ~4-5k token; kod sembol haritasi ~1k)" }

# 3) CODEMAP tazeligi
if ($pL2) {
  $mapTime = (Get-Item $pL2).LastWriteTime
  $newest = Get-ChildItem $Root -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notmatch '\\(node_modules|\.git|dist|build)\\' -and $_.FullName -ne $pL2 -and $_.FullName -notmatch '\\raporlar\\' -and $_.FullName -notmatch '\\plans\\handoff\\' -and $_.Name -ne 'STATE_BOARD.md' -and ($_.Extension -in @('.md','.ts','.tsx','.js','.py','.cs','.go','.rs','.ps1')) } |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if ($newest) { Check 'CODEMAP taze' ($mapTime -ge $newest.LastWriteTime) ("en yeni kaynak: " + $newest.Name) }
}

# 4) Handoff zinciri
if ($pHd) {
  $hs = Get-ChildItem $pHd -Filter 'HANDOFF-*.md' -ErrorAction SilentlyContinue | Sort-Object Name
  if ($hs.Count -ge 2) {
    $son = Get-Content $hs[-1].FullName -Raw -Encoding UTF8
    Check 'Handoff zinciri kopuksuz' ($son -match [regex]::Escape($hs[-2].BaseName)) ("onceki: " + $hs[-2].BaseName)
  } elseif ($hs.Count -eq 1) { Check 'Handoff zinciri' $true 'tek handoff var' }
}

# 5) Rehber hijyeni (kendi kuralini denetler) + paket kontrolleri (yalniz arastirma paketi olan repolarda)
$pRehber = Find-First $Root @('PASEO-VERIMLILIK-REHBERI-v2.0.md','PASEO-VERIMLILIK-REHBERI-v1.4.md','arastirma\PASEO-VERIMLILIK-REHBERI-v2.0.md','arastirma\PASEO-VERIMLILIK-REHBERI-v1.4.md')
if ($pRehber) {
  $rh = LineCount $pRehber
  Check 'REHBER <=150 satir (kendi hijyen kurali)' ($rh -le 150) "$rh satir"
}
if ((Test-Path "$Root\arastirma") -or (Test-Path "$Root\kanit")) {
  Check 'REHBER (v*) mevcut' ($null -ne $pRehber) 'evrensel sozlesme'
  Check 'codemap ureticisi kurulu' ((Test-Path "$Root\scripts\codemap.ps1") -or ($null -ne (Get-ChildItem "$Root\scripts" -Filter 'codemap*' -ErrorAction SilentlyContinue))) 'scripts/codemap.*'
}

# 5b) Aktif kural sayaci (REHBER §2 butcesi: hedef <40, tavan 80)
$kuralDosyalari = @($pAnayasa, $pL0, $pRehber) | Where-Object { $_ }
if ($kuralDosyalari.Count -gt 0) {
  $kural = 0
  foreach ($kd in $kuralDosyalari) { $kural += @(Get-Content $kd -Encoding UTF8 | Where-Object { $_ -match '^\s*(-|\d+\.)\s' }).Count }
  if ($kural -gt $ESIK.KuralKirmizi) { Check ("Kural-proxy (liste-satiri) <= {0} (tavan)" -f $ESIK.KuralKirmizi) $false "$kural satir - stacking-collapse riski (REHBER §2)" }
  elseif ($kural -gt $ESIK.KuralSari) { Warn ("Kural-proxy (liste-satiri) < {0} (hedef)" -f $ESIK.KuralSari) "$kural satir - sadelestirmeyi degerlendir" }
  else { Check ("Kural-proxy (liste-satiri) < {0} (hedef)" -f $ESIK.KuralSari) $true "$kural satir" }
}

# 6) Plugin telemetrisi (JSONL verilirse)
if ($Jsonl -and (Test-Path $Jsonl)) {
  $ev = @(Get-Content $Jsonl -Encoding UTF8 | ForEach-Object { try { $_ | ConvertFrom-Json } catch { Write-Host "JSONL bozuk satir atlandi (Katman B devam)" } })
  $turKayit = @($ev | Where-Object { $_.tip -eq 'tur' })
  $tur = $turKayit.Count
  # Cache: plugin tur kaydinin detay alaninda tutar (cacheHitPct=NN.N) - token-agirlikli ortalama
  $cacheAgirlikli = 0.0; $cacheAgirlik = 0.0
  foreach ($k in $turKayit) {
    if ($k.detay -match 'cacheHitPct=([\d.]+)') {
      $pct = [double]$Matches[1]
      $agirlik = 1.0
      if ($k.detay -match 'in=(\d+)') { $agirlik = [double]$Matches[1] }
      $cacheAgirlikli += $pct * $agirlik; $cacheAgirlik += $agirlik
    }
  }
  if ($cacheAgirlik -gt 0) {
    $ortCache = $cacheAgirlikli / $cacheAgirlik
    Check ("Cache-hit >= %{0} (token-agirlikli)" -f $ESIK.CacheHitMin) ($ortCache -ge $ESIK.CacheHitMin) ("{0:N1}% ({1} tur)" -f $ortCache, $tur)
  } elseif ($tur -gt 0) {
    Warn 'Cache-hit verisi' "$tur tur var ama cacheHitPct yok - olcum formati uyusmazligi olabilir"
  }
  # Durtme: tur kayitlarindaki bayraklar + lint/pitbull-durtme kayitlari
  $dur = @($turKayit | Where-Object { $_.loopDurtme -eq $true -or $_.finishGateDurtme -eq $true }).Count
  $dur += @($ev | Where-Object { $_.tip -eq 'lint' -and $_.detay -like 'pitbull-durtme*' }).Count
  Check ("Durtme <= {0}/oturum" -f $ESIK.DurmeMaxGunluk) ($dur -le $ESIK.DurmeMaxGunluk) "$dur durtme, $tur tur"
  $ka = @($ev | Where-Object { $_.tip -eq 'kabul' -and $_.kabul -eq $true }).Count
  $kt = @($ev | Where-Object { $_.tip -eq 'kabul' }).Count
  if ($kt -gt 0) {
    $oran = $ka * 100.0 / $kt
    if ($oran -lt $ESIK.KabulAlarm) { Check ("Kabul orani >= %{0} (METR alarmi)" -f $ESIK.KabulAlarm) $false ("%{0:N0} ({1}/{2})" -f $oran, $ka, $kt) }
    elseif ($oran -lt $ESIK.KabulHedef) { Warn ("Kabul orani >= %{0} (hedef)" -f $ESIK.KabulHedef) ("%{0:N0} ({1}/{2})" -f $oran, $ka, $kt) }
    else { Check ("Kabul orani >= %{0} (hedef)" -f $ESIK.KabulHedef) $true ("%{0:N0} ({1}/{2})" -f $oran, $ka, $kt) }
  }
}

# 5c) Gelen-kutu sema kapisi (K-0017)
$gkDir = Join-Path $Root 'raporlar\gelen-kutu'
if (Test-Path -LiteralPath $gkDir) {
  $gkHata = 0
  foreach ($f in (Get-ChildItem -LiteralPath $gkDir -Filter '*.json' -ErrorAction SilentlyContinue)) {
    try {
      $j = Get-Content $f.FullName -Raw -Encoding UTF8 | ConvertFrom-Json
      if ($j.schemaSurum -ne 1) { $gkHata++ }
    } catch { $gkHata++ }
  }
  Check 'Gelen-kutu sema (schemaSurum=1)' ($gkHata -eq 0) ("bozuk/eski sidecar: " + $gkHata)
}

$rows | Format-Table -AutoSize
Write-Host ("SONUC: {0} OK, {1} EKSIK, {2} SARI" -f $pass, $fail, $warnN)
if ($fail -gt 0) { exit 1 } else { exit 0 }


