param(
  [Parameter(Mandatory=$true)][string]$Etiket,
  [string]$Not = "",
  [string]$EkOzet = "",
  [string]$RepoKok = (Get-Location).Path
)
$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)
$bt = [char]96
$nl = [Environment]::NewLine
Push-Location $RepoKok
try {
  $commit = (git rev-parse --short HEAD).Trim()
  $tagAd = "$Etiket-kilit"
  if (git tag -l $tagAd) { throw "Tag zaten var: $tagAd (kilitler append-only)" }
  $kirli = git status --short
  if ($kirli) { throw "Calisma agaci kirli - once commit'le." }
  $doctor = $null
  $saglik = Join-Path $RepoKok 'scripts\saglik.ps1'
  if (Test-Path $saglik) {
    $cikti = & powershell -ExecutionPolicy Bypass -File $saglik 2>&1 | Out-String
    if ($cikti -match 'SONUC:\s*(\d+) OK,\s*(\d+) EKSIK,\s*(\d+) SARI') {
      $doctor = [ordered]@{ ok = [int]$Matches[1]; eksik = [int]$Matches[2]; sari = [int]$Matches[3] }
    }
  }
  $hedefler = $null; $puanlar = $null
  $hf = Join-Path $RepoKok 'hedefler.json'
  if (Test-Path $hf) {
    $hj = Get-Content $hf -Raw -Encoding UTF8 | ConvertFrom-Json
    $hedefler = $hj.aktifHedefler
    $puanlar = $hj.eksenPuanlari
  }
  git tag -a $tagAd -m "Kilitli surum: $Etiket"
  $tarih = Get-Date -Format 'yyyy-MM-dd'
  $dir = Join-Path $RepoKok "surumler\$Etiket"
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  $kilit = [ordered]@{ etiket = $tagAd; tarih = $tarih; commit = $commit; doctor = $doctor; hedefler = $hedefler; eksenPuanlari = $puanlar; ekOzet = $EkOzet; not = $Not }
  [IO.File]::WriteAllText((Join-Path $dir 'kilit.json'), ($kilit | ConvertTo-Json -Depth 6) + $nl, $utf8)
  $doctorSatir = if ($doctor) { "$($doctor.ok) OK / $($doctor.eksik) EKSIK / $($doctor.sari) SARI" } else { '(doctor yok)' }
  $mdLines = @(
    "# Kilitli Surum - $tagAd",
    "",
    "- Tarih: $tarih - Commit: $bt$commit$bt - Tag: $bt$tagAd$bt",
    "- Doctor: $doctorSatir",
    "- Ek ozet: $EkOzet",
    "- Hedefler + eksen puanlari: $bt" + "kilit.json$bt (makine-okunur)",
    "- Not: $Not",
    "",
    "## Rollback",
    "",
    "$bt" + "git reset --hard $tagAd$bt -> $bt" + "scripts\codemap.ps1$bt (tazelik damgasi) -> $bt" + "scripts\saglik.ps1$bt yesil.",
    "Plugin reposunda: tag'e don + $bt" + "paseo plugin reload paseo-verimlilik$bt."
  )
  [IO.File]::WriteAllText((Join-Path $dir 'KILIT.md'), ($mdLines -join $nl) + $nl, $utf8)
  Write-Host "KILIT OK: $tagAd @ $commit - surumler/$Etiket/ yazildi."
  Write-Host "Simdi: git add + commit + push (tag dahil: git push origin $tagAd)"
} finally { Pop-Location }
