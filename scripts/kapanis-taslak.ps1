# kapanis-taslak.ps1 - dalga-kapanis TASLAK uretici (v8 madde V8-02b / K0053 pilot K0053-PILOT-1, 2026-10-29)
# Kaynak: raporlar/gelen-kutu/v8-paralel-yazar-hizi-2026-10-28.md madde 2b + raporlar/k0053-pilot-v8-02b-2026-10-29/BRIEF.md (EK-3/1)
# Is: dalga girdilerinden kapanis TASLAGI uretir -> -CiktiDir icinde TASLAK.md + TASLAK.json.
# SSOT YASAK: STATE_BOARD / PLAN / graf / kabul / SENARYO / CODEMAP / kanit defterlerine ASLA yazmaz;
#   yazdigi TEK yer CiktiDir icindeki iki sabit dosyadir (TASLAK.md, TASLAK.json) - SSOT cakismasi yapisal olarak imkansiz.
# Fail-closed: zorunlu parametre / kanal JSON alani eksik ya da JSON okunamazsa -> exit 1 ADIYLA sebep (KAPANIS-TASLAK-RED).
# Uydurma deger YOK: olcumsuz hiz iddiasi KAPANAMAZ (V9-04 s7 olcum cifti - CALISTIRMA.md DC-H1-2026-10-28).
# Kanal JSON semasi: test-kanal.ps1 son-kanit.json ciktisi { d, h, x, test, sureSn }; fail alani varsa aynen gecilir, yoksa UYDURULMAZ.
# PS 5.1 notlari: kaynak tamami ASCII (BOM'suz UTF-8 her kod sayfasinda ayni okunur - K-0051 ailesi);
#   here-string KULLANILMAZ; ciktilar UTF8Encoding($false) ile BOM'suz yazilir (test-kanal.ps1 deseni).
param(
  [string]$DalgaId,
  [string]$Commits,
  [string]$KanalJson,
  [string]$TurBas,
  [string]$TurSon,
  [string]$CiktiDir,
  [string]$OnceKanalJson
)

$ErrorActionPreference = 'Stop'

function Red([string]$sebep) {
  Write-Output ('KAPANIS-TASLAK-RED: ' + $sebep)
  exit 1
}

# --- 1) zorunlu parametreler: ADIYLA sebep (PS Mandatory istemi yerine bizim mesajimiz) ---
if ([string]::IsNullOrWhiteSpace($DalgaId)) { Red '-DalgaId yok - dalga kimligi olmadan kapanis satiri uretilemez' }
# Dikkat: -match KULLANILMAZ - PS 5.1 -match IgnoreCase + gecerli kulturle kosar; tr-TR yerelinde
# noktali/noktasiz I kurali [A-Za-z] sinifini 'I' harfinde kirar (kanit: K0053-PILOT-1 -match ^[A-Za-z0-9._-]+$ -> False).
# [regex]::IsMatch kulturden bagimsiz (buyuk/kucuk harf duyalli) dogru sonuc verir.
if (-not [regex]::IsMatch($DalgaId, '^[A-Za-z0-9._-]+$')) { Red ('-DalgaId gecersiz: ' + $DalgaId + ' (izinli: harf, rakam, nokta, alt cizgi, tire)') }
if ([string]::IsNullOrWhiteSpace($Commits)) { Red '-Commits yok - commit listesi olmadan graf/kabul/SENARYO satiri uretilemez' }
$commitListesi = @((($Commits -split ',')) | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' })
if ($commitListesi.Count -eq 0) { Red '-Commits bos - commit listesi olmadan graf/kabul/SENARYO satiri uretilemez' }
if ([string]::IsNullOrWhiteSpace($KanalJson)) { Red '-KanalJson yok - olcumsuz hiz iddiasi kapanamaz (V9-04 s7)' }
if ([string]::IsNullOrWhiteSpace($TurBas)) { Red '-TurBas yok - duvar suresi olculemez (V9-04 s7 olcum cifti)' }
if ([string]::IsNullOrWhiteSpace($TurSon)) { Red '-TurSon yok - duvar suresi olculemez (V9-04 s7 olcum cifti)' }
if ([string]::IsNullOrWhiteSpace($CiktiDir)) { Red '-CiktiDir yok - TASLAK yazilacak dizin belli degil' }

# --- 2) kanal JSON yukleme + sema denetimi (fail-closed; sema: test-kanal.ps1 son-kanit) ---
function Kanal-Yukle([string]$yol, [string]$etiket) {
  if (-not (Test-Path -LiteralPath $yol -PathType Leaf)) {
    Red ($etiket + ' dosyasi bulunamadi: ' + $yol + ' - olcumsuz hiz iddiasi kapanamaz (V9-04 s7)')
  }
  try { $k = Get-Content -LiteralPath $yol -Raw -Encoding UTF8 | ConvertFrom-Json }
  catch { Red ($etiket + ' okunamiyor / bozuk JSON: ' + $_.Exception.Message) }
  $zorunlu = @('d', 'h', 'x', 'test', 'sureSn')
  $eksik = @($zorunlu | Where-Object { $null -eq ($k.PSObject.Properties[$_]) })
  if ($eksik.Count -gt 0) {
    Red ($etiket + ' zorunlu alani eksik: ' + ($eksik -join ', ') + ' (sema: test-kanal.ps1 son-kanit { d, h, x, test, sureSn })')
  }
  foreach ($a in @('d', 'h', 'test')) {
    if ([string]::IsNullOrWhiteSpace([string]($k.$a))) { Red ($etiket + ' alani bos/null: ' + $a) }
  }
  foreach ($a in @('x', 'sureSn')) {
    $v = $k.$a
    if (-not ($v -is [int] -or $v -is [long] -or $v -is [double])) { Red ($etiket + ' alani sayi degil: ' + $a + ' = ' + [string]$v) }
  }
  if ([double]$k.sureSn -lt 0) { Red ($etiket + ' sureSn negatif olamaz: ' + [string]$k.sureSn) }
  return $k
}

$kanal = Kanal-Yukle -yol $KanalJson -etiket 'KanalJson'
$tabanVar = -not [string]::IsNullOrWhiteSpace($OnceKanalJson)
$once = $null
if ($tabanVar) { $once = Kanal-Yukle -yol $OnceKanalJson -etiket 'OnceKanalJson (taban)' }

# --- 3) tur zamanlari: olculmus duvar suresi (tahmin YOK; negatives RED) ---
# Dikkat: TryParseExact'in FORMAT DIZISI yuklemi PS 5.1'de [ref] ile yanlislikla False dondurur
# (kanit: '2026-10-29 08:55:12' dizi yuklemi -> False, tek format 'yyyy-MM-dd HH:mm:ss' -> True).
# Bu yuzden tek-format yuklemi bicimler uzerinde donguye alinir.
function Zaman-Cozumle([string]$deger, [string]$adi) {
  foreach ($bicim in @('yyyy-MM-ddTHH:mm:ss', 'yyyy-MM-dd HH:mm:ss', 'yyyy-MM-ddTHH:mm:sszzz', 'yyyy-MM-ddTHH:mm:ss.fffffffzzz')) {
    $z = New-Object datetime
    if ([datetime]::TryParseExact($deger, $bicim, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::None, [ref]$z)) { return $z }
  }
  Red ('-' + $adi + ' cozumlenemiyor: ' + $deger + ' (kabul edilen: yyyy-MM-ddTHH:mm:ss, yyyy-MM-dd HH:mm:ss veya ISO kaymali)')
}
$turBasZ = Zaman-Cozumle -deger $TurBas -adi 'TurBas'
$turSonZ = Zaman-Cozumle -deger $TurSon -adi 'TurSon'
if ($turSonZ -lt $turBasZ) {
  Red ('-TurSon TurBas degerinden once olamaz (negatif duvar suresi uydurma olur): bas=' + $TurBas + ' son=' + $TurSon)
}
$duvarSn = [int](($turSonZ - $turBasZ).TotalSeconds)

# --- 4) cikti dizini: betigin yazdigi TEK yer (SSOT dokunmama yapisal garanti) ---
if ((Test-Path -LiteralPath $CiktiDir) -and -not (Test-Path -LiteralPath $CiktiDir -PathType Container)) {
  Red ('-CiktiDir bir dosya (dizin degil): ' + $CiktiDir)
}
if (-not (Test-Path -LiteralPath $CiktiDir)) { New-Item -ItemType Directory -Path $CiktiDir | Out-Null }
$taslakMdYolu = Join-Path $CiktiDir 'TASLAK.md'
$taslakJsonYolu = Join-Path $CiktiDir 'TASLAK.json'

# --- 5) kanal etiketi + olcum cifti hucreleri ---
$kanalEtiket = ('d=' + $kanal.d + ' h=' + $kanal.h + ' x=' + $kanal.x + ' test=' + $kanal.test + ' sureSn=' + $kanal.sureSn)
$failVar = $null -ne ($kanal.PSObject.Properties['fail'])
if ($failVar) { $kanalEtiket = $kanalEtiket + (' fail=' + $kanal.fail) }
$kanalEtiketOnce = '(taban yok)'
if ($tabanVar) {
  $kanalEtiketOnce = ('d=' + $once.d + ' h=' + $once.h + ' x=' + $once.x + ' test=' + $once.test + ' sureSn=' + $once.sureSn)
}

$tabanHucreKanal = 'TABAN YOK'
$tabanHucreDuvar = 'TABAN YOK (kanal JSON semasinda duvar alani yok - uydurma YASAK)'
$tabanHucreX = 'TABAN YOK'
$tabanHucreTur = 'TABAN YOK'
if ($tabanVar) {
  $tabanHucreKanal = [string]$once.sureSn
  $tabanHucreX = [string]$once.x
  $tabanHucreTur = 'kosum=1 (taban kanal kaydindan) - tur sayisi TABAN YOK (kayitta tur alani yok)'
}
$olcumDurumu = 'RED: TABAN YOK - olcum cifti eksik. Olcumsuz hiz iddiasi KAPANAMAZ (V9-04 s7); madde BEKLEYEN kalir. Once taban kosumu yapilir (V9-03 olc-sonra-karar).'
$olcumDurumKisa = 'EKSIK (RED - TABAN YOK)'
if ($tabanVar) {
  $olcumDurumu = 'TABAN KISMI: kanal sn + x ONCE hucreleri taban kanalindan dolu (' + $kanalEtiketOnce + '); duvar sn + tur sayisi ONCE hucreleri TABAN YOK (kanal JSON semasinda alan yok - ASLA uydurulmaz; operator olculmus tabani taslakta elle tamamlar).'
  $olcumDurumKisa = 'KISMI (kanal sn + x dolu; duvar sn + tur sayisi TABAN YOK)'
}
$onceSatiri = '(verilmedi - ONCE sutunu TABAN YOK / RED)'
if ($tabanVar) { $onceSatiri = $OnceKanalJson }

# --- 6) TASLAK.md (satir dizisi ile birlestirilir; here-string YOK) ---
$nl = [Environment]::NewLine
$commitSatiri = ($commitListesi -join ' + ')
$md = @()
$md += ('# KAPANIS TASLAGI - ' + $DalgaId)
$md += ''
$md += ('> Uretici: scripts/kapanis-taslak.ps1 (v8 madde V8-02b / K0053 pilot dalga). Bu cikti SSOT DEGILDIR:')
$md += ('> STATE_BOARD / graf / kabul / SENARYO / CODEMAP / kanit defterlerine otomatik YAZILMAZ -')
$md += ('> operator inceler, olcumsuz hucreleri doldurur, elle isler. Uydurma deger YOK (V9-04 s7).')
$md += ''
$md += '## 1. STATE damga satiri taslagi'
$md += ''
$md += '```'
$md += ('- ' + $turSonZ.ToString('yyyy-MM-dd HH:mm') + ' - ' + $DalgaId + ' DALGA KAPANIS TASLAGI - commits ' + $commitSatiri + ' - kanal ' + $kanalEtiket + ' - olcum cifti: ' + $olcumDurumKisa + ' (TASLAK: STATE_BOARD otomasyonu YOK)')
$md += '```'
$md += ''
$md += '## 2. Graf / kabul / SENARYO satir taslaklari (dalga kimligi + commit listesi + kanal sonucu etiketli)'
$md += ''
$md += ('- graf: ' + $DalgaId + ' - commits ' + $commitSatiri + ' - kanal ' + $kanalEtiket + ' (TASLAK - graf defterine otomatik yazilmaz)')
$md += ('- kabul: ' + $DalgaId + ' - commits ' + $commitSatiri + ' - kanal ' + $kanalEtiket + ' (TASLAK - kabul defterine otomatik yazilmaz)')
$md += ('- SENARYO: ' + $DalgaId + ' - commits ' + $commitSatiri + ' - kanal ' + $kanalEtiket + ' (TASLAK - SENARYO dosyasina otomatik yazilmaz)')
$md += ''
$md += '## 3. ONCE/SONRA olcum cifti tablosu (CALISTIRMA.md s7 - V9-04)'
$md += ''
$md += '| olcut | ONCE (taban) | SONRA |'
$md += '|---|---|---|'
$md += ('| kanal suresi (sn) | ' + $tabanHucreKanal + ' | ' + [string]$kanal.sureSn + ' |')
$md += ('| duvar suresi (sn, tur baslangic -> kapanis, olculmus) | ' + $tabanHucreDuvar + ' | ' + $duvarSn + ' |')
$md += ('| x (basarisiz kosum sayisi) | ' + $tabanHucreX + ' | ' + [string]$kanal.x + ' |')
$md += ('| tur/kosum sayisi | ' + $tabanHucreTur + ' | 1 tur / 1 kosum (bu taslagin girdileri: tek tur penceresi + tek kanal JSON) |')
$md += ''
$md += ('Durum: ' + $olcumDurumu)
$md += ''
$md += '## 4. Girdiler (iz surulebilirlik - degerler oldugu gibi, tahmin YOK)'
$md += ''
$md += ('- DalgaId: ' + $DalgaId)
$md += ('- Commits: ' + $commitSatiri)
$md += ('- KanalJson: ' + $KanalJson)
$md += ('- OnceKanalJson: ' + $onceSatiri)
$md += ('- TurBas: ' + $TurBas)
$md += ('- TurSon: ' + $TurSon)
$md += ('- TurSon - TurBas (olculmus duvar suresi): ' + $duvarSn + ' sn')

# --- 7) TASLAK.json (deterministik: ayni girdi ayni bayt; Get-Date YOK) ---
$kanalObj = [ordered]@{ d = $kanal.d; h = $kanal.h; x = $kanal.x; test = $kanal.test; sureSn = $kanal.sureSn }
if ($failVar) { $kanalObj['fail'] = $kanal.fail }
$olcumObj = [ordered]@{
  tabanVar = $tabanVar
  red = (-not $tabanVar)
  kanalSn = [ordered]@{ once = $null; sonra = $kanal.sureSn }
  duvarSn = [ordered]@{ once = $null; sonra = $duvarSn }
  x = [ordered]@{ once = $null; sonra = $kanal.x }
  turKosum = [ordered]@{ once = $null; sonra = [ordered]@{ tur = 1; kosum = 1; kaynak = 'girdi sayimi (tek tur penceresi + tek kanal JSON)' } }
}
if ($tabanVar) {
  $olcumObj['kanalSn']['once'] = $once.sureSn
  $olcumObj['x']['once'] = $once.x
  $olcumObj['turKosum']['once'] = [ordered]@{ kosum = 1; kaynak = 'taban kanal kaydi sayimi' }
}
$ciktiObj = [ordered]@{
  uretici = 'scripts/kapanis-taslak.ps1'
  kayitTuru = 'TASLAK'
  ssotYazar = $false
  dalgaId = $DalgaId
  commits = $commitListesi
  kanal = $kanalObj
  girdi = [ordered]@{ turBas = $TurBas; turSon = $TurSon }
  duvarSn = $duvarSn
  olcumCifti = $olcumObj
}

$utf8 = New-Object System.Text.UTF8Encoding($false)
[IO.File]::WriteAllText($taslakMdYolu, (($md -join $nl) + $nl), $utf8)
[IO.File]::WriteAllText($taslakJsonYolu, (($ciktiObj | ConvertTo-Json -Depth 6) + $nl), $utf8)

$tabanSozcuk = 'YOK (RED - olcum cifti eksik)'
if ($tabanVar) { $tabanSozcuk = 'VAR' }
Write-Output ('KAPANIS-TASLAK-OK: ' + $DalgaId + ' | commits ' + $commitSatiri + ' | kanal ' + $kanalEtiket + ' | duvarSn=' + $duvarSn + ' | taban ' + $tabanSozcuk + ' | ' + $taslakMdYolu + ' + ' + $taslakJsonYolu)
exit 0
