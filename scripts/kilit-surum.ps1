param(
  [Parameter(Mandatory=$true)][ValidatePattern('^[A-Za-z0-9._-]+$')][string]$Etiket,
  [string]$Not = "",
  [string]$EkOzet = "",
  [string]$RepoKok = (Get-Location).Path
)
$ErrorActionPreference = 'Stop'
# K-0026 (A5-2): native git cagrilari exit-code denetimli; sessiz basarisizlik kilit dusurmez.
function GitZorunlu([string[]]$GitArgs) {
  $onceki = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  $g = & git @GitArgs 2>&1 | Out-String
  $code = $LASTEXITCODE
  $ErrorActionPreference = $onceki
  if ($code -ne 0) { throw ('git ' + ($GitArgs -join ' ') + ' exit ' + $code + ': ' + $g.Trim()) }
  return $g.Trim()
}
$utf8 = New-Object System.Text.UTF8Encoding($false)
$bt = [char]96
$nl = [Environment]::NewLine
Push-Location $RepoKok
try {
  $commit = GitZorunlu @('rev-parse','--short','HEAD')
  $tagAd = "$Etiket-kilit"
  if (GitZorunlu @('tag','-l',$tagAd)) { throw "Tag zaten var: $tagAd (kilitler append-only)" }
  $kirli = GitZorunlu @('status','--short')
  if ($kirli) { throw "Calisma agaci kirli - once commit'le." }
  $doctor = $null
  $saglik = Join-Path $RepoKok 'scripts\saglik.ps1'
  if (Test-Path $saglik) {
    $cikti = & powershell -ExecutionPolicy Bypass -File $saglik 2>&1 | Out-String
    if ($cikti -match 'SONUC:\s*(\d+) OK,\s*(\d+) EKSIK,\s*(\d+) SARI') {
      $doctor = [ordered]@{ ok = [int]$Matches[1]; eksik = [int]$Matches[2]; sari = [int]$Matches[3] }
      if ($doctor.eksik -gt 0) { throw ("Saglik kapisinda EKSIK var (" + $doctor.eksik + ") - kilit engellendi. Once eksikleri kapat.") }
    } else {
      throw ("K-0026 (A5-3) fail-closed: saglik ciktisinda SONUC satiri yok - kilit engellendi. Cikti basi: " + $cikti.Substring(0, [Math]::Min(300, $cikti.Length)))
    }
  } else {
    throw ('D2-10 fail-closed: saglik.ps1 bulunamadi (' + $saglik + ') - kilit engellendi.')
  }
  $hedefler = $null; $puanlar = $null
  $hf = Join-Path $RepoKok 'hedefler.json'
  if (Test-Path $hf) {
    $hj = Get-Content $hf -Raw -Encoding UTF8 | ConvertFrom-Json
    $hedefler = $hj.aktifHedefler
    $puanlar = $hj.eksenPuanlari
  }
  $surumTs = Join-Path $RepoKok 'server\surum.ts'
  if (Test-Path $surumTs) {
    $icerik = [IO.File]::ReadAllText($surumTs, $utf8)
    $yeni = $icerik -replace 'PLUGIN_SURUM = "[^"]*"', ('PLUGIN_SURUM = "' + $Etiket + '"')
    if ($yeni -ne $icerik) {
      [IO.File]::WriteAllText($surumTs, $yeni, $utf8)
      GitZorunlu @('add','server/surum.ts') | Out-Null
      GitZorunlu @('commit','-m',"surum damgasi: $Etiket") | Out-Null
      $commit = GitZorunlu @('rev-parse','--short','HEAD')
      Write-Host "surum.ts damgalandi: $Etiket (commit: $commit)"
    }
  }
  GitZorunlu @('tag','-a',$tagAd,'-m',"Kilitli surum: $Etiket") | Out-Null
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
