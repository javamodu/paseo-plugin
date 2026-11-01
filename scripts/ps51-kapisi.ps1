# ps51-kapisi.ps1 - PS 5.1 bilinen-kotu-desen tarayicisi (SK-1 / S1 mekanik freni, 2026-11-01)
# Kaynak: plans/SORUN-KAPATMA-3AJAN-PLANI-2026-11-01.md ORDU-1 bolumu.
# Desen kanitlari:
#   RED-1   girintili here-string kapanisi ('@ ve "@ ayni parser hatasi) - DERSLER satir 3 + ORDU-3 F1
#   RED-2   git push ile 2>&1 ayni satirda    - DERSLER satir 8 (NativeCommandError; push basariliyken kirmizi)
#   RED-3   git commit -m cift tirnakli mesaj - DERSLER satir 190 (arguman bolunur; -F deseni zorunlu)
#   UYARI-1 Measure-Object -Line sayim        - DERSLER'de ders kaydi YOK (kaynak: SK-1 plani; bos satirlar sayilmaz)
#   UYARI-2 boruda Format-Table               - DERSLER satir 97 + 198 (format nesnesi akisi abort riski)
# Is: .ps1 dosyalarini satir satir tarar. Cikis: 0 temiz / 1 RED / 2 yalniz-uyari (uyari asla RED'e donusmez).
# Kapsam: -Yollar (virgulle ayrilmis liste) verilirse o dosyalar; verilmezse staged *.ps1 (git diff --cached).
# Fail-closed: -Yollar yok VE staged listesi okunamiyorsa -> exit 1 (KAPI-INFAZ-EDILEMEDI).
# Cagiran: scripts/merge-guard.ps1 v10 kancasi (staged .ps1 varken, ayri surectte). Tek basina da kosulur.
# PS 5.1 notlari: kaynak tamami ASCII (BOM'suz UTF-8 her kod sayfasinda ayni okunur - K-0051 ailesi);
#   here-string YOK; yorum satirlari (# baslanti) atlanir (bilgi-amacli ornek desenler RED uretmez);
#   desen sabitleri asagida PARCALI kurulur ($olcutKelime / $borsaKelime) - bu dosyanin kendi kaynagi
#   kendini uyarmasin (oz-tarama testi bunu mekanikler).
param(
  [string]$Yollar
)

$ErrorActionPreference = 'Stop'

# --- 1) hedef liste: parametre ya da staged *.ps1 ---
$hedefler = @()
if (-not [string]::IsNullOrWhiteSpace($Yollar)) {
  $hedefler = @((($Yollar -split ',')) | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' })
} else {
  $staged = @(git diff --cached --name-only)
  if ($LASTEXITCODE -ne 0) {
    Write-Output 'KAPI-INFAZ-EDILEMEDI: git staged listesi okunamiyor (fail-closed; SK-1)'
    exit 1
  }
  $hedefler = @($staged | Where-Object { $_ -like '*.ps1' })
}

# --- 2) desen sabitleri (parcali kurulum: bu dosyanin KENDI metni sabitleri butun icermesin) ---
$olcutKelime = 'Measure-' + 'Object'
$borsaKelime = 'Format-' + 'Table'
$boruDeseni = ('\|\s*' + $borsaKelime)
$pushKelime = 'git ' + 'push'
$yoneltme = '2>' + '&1'

# --- 3) tarama (RED oncelikli; uyarilar RED yokken yasar) ---
$redler = @()
$uyarilar = @()
foreach ($dosya in $hedefler) {
  if ([string]::IsNullOrWhiteSpace($dosya)) { continue }
  if (-not (Test-Path -LiteralPath $dosya -PathType Leaf)) {
    Write-Output ('PS51-KAPISI-ATLANDI: dosya yok (silinen staged ya da yanlis yol): ' + $dosya)
    continue
  }
  $satirlar = @([IO.File]::ReadAllLines($dosya))
  for ($i = 0; $i -lt $satirlar.Count; $i++) {
    $satir = $satirlar[$i]
    $no = $i + 1
    if ($satir.TrimStart().StartsWith('#')) { continue }
    # RED-1: girintili here-string kapanisi (iki tirnak tipi ayni parser hatasi) - DERSLER satir 3 + ORDU-3 F1
    if ([regex]::IsMatch($satir, '^[ \t]+[''"]@')) {
      $redler += ($dosya + ':' + $no + ' girintili here-string kapanisi - ''@ ve "@ daima satir basinda (kolon 0) olmali (DERSLER satir 3 + ORDU-3 F1 canli kanit)')
      continue
    }
    # RED-2: push komutunda 2>&1 - DERSLER satir 8
    if ($satir.Contains($pushKelime) -and $satir.Contains($yoneltme)) {
      $redler += ($dosya + ':' + $no + ' ' + $pushKelime + ' komutunda ' + $yoneltme + ' - NativeCommandError: push basariliyken kirmizi gorunur; dogrulamayi ayri komutla yap (DERSLER satir 8)')
      continue
    }
    # RED-3: cift tirnakli commit mesaji - DERSLER satir 190
    if ($satir.Contains('git commit') -and [regex]::IsMatch($satir, '-m\s*"')) {
      $redler += ($dosya + ':' + $no + ' git commit -m cift tirnakli mesaj - PS 5.1 argumani boler; %TEMP% dosya + git commit -F kullan (DERSLER satir 190)')
      continue
    }
    # UYARI-1: Measure-Object -Line sayim - bos satirlar sayilmaz (kaynak: SK-1; DERSLER'de kayit yok)
    if ($satir.Contains($olcutKelime) -and $satir.Contains('-Line')) {
      $uyarilar += ($dosya + ':' + $no + ' ' + $olcutKelime + ' -Line sayim - bos satirlar sayilmaz; @(Get-Content ...).Count kullan (UYARI - kaynak SK-1 plani)')
    }
    # UYARI-2: boruda Format-Table - DERSLER satir 97 + 198
    if ([regex]::IsMatch($satir, $boruDeseni)) {
      $uyarilar += ($dosya + ':' + $no + ' boruda ' + $borsaKelime + ' - format nesnesi akisi abort riski; Out-String ile metne cevir ya da ayri komut (UYARI - DERSLER satir 97/198)')
    }
  }
}

# --- 4) karar: RED > yalniz-uyari > temiz (RED varken uyarilar da raporlanir - kaybolmaz) ---
if ($redler.Count -gt 0) {
  foreach ($r in $redler) { Write-Output ('PS51-RED: ' + $r) }
  foreach ($u in $uyarilar) { Write-Output ('PS51-UYARI: ' + $u) }
  Write-Output ('PS51-KAPISI-RED: ' + $redler.Count + ' kirmizi desen + ' + $uyarilar.Count + ' uyari - commit RED (SK-1 / S1 mekanik freni)')
  exit 1
}
if ($uyarilar.Count -gt 0) {
  foreach ($u in $uyarilar) { Write-Output ('PS51-UYARI: ' + $u) }
  Write-Output ('PS51-KAPISI-UYARI: ' + $uyarilar.Count + ' uyari - engelleme YOK (uyari sinifi asla RED olmez)')
  exit 2
}
Write-Output ('PS51-KAPISI-GECTI: ' + $hedefler.Count + ' dosya tarandi, desen eslesmesi 0')
exit 0
