param(
  [Parameter(Mandatory=$true)][ValidatePattern('^[A-Za-z0-9._-]+$')][string]$Etiket,
  [string]$TestDizin = 'core',
  [string]$RepoKok = (Get-Location).Path
)
# K-0046 (e)/(f) kanal bacagi: kapanis-testi kosumu Tee + son-kanit.json uzerinden akar.
# Desen kilit-surum.ps1:53-57'den BIREBIR (Tee + son-kanit {d,h,x,test,sureSn} + log tutma 50/8hf).
# Kilit/tag YOK: bu yalniz kanal — kilit-surum'un kilit semantigi (temiz agac, 0 EKSIK, append-only tag) burada gecerli degil;
# sonek (f) uyarunca son-kanit.json'dan birebir kopyalanir, elle yazilmaz.
$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)
$nl = [Environment]::NewLine
$kok = [IO.Path]::GetFullPath($RepoKok)
$testDizini = Join-Path $kok $TestDizin
if (-not (Test-Path (Join-Path $testDizini 'package.json'))) { throw ('package.json yok: ' + $testDizini) }
$git = & git -C $kok rev-parse --short HEAD 2>&1
if ($LASTEXITCODE -ne 0) { throw ('git rev-parse exit ' + $LASTEXITCODE) }
$commit = ($git | Out-String).Trim()
$kanitDir = Join-Path $kok 'raporlar\kanit-hedef'
New-Item -ItemType Directory -Force -Path $kanitDir | Out-Null
$testLog = Join-Path $kanitDir ("test-$Etiket.log")
Push-Location $testDizini
$onceki = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
try {
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  & npm test 2>&1 | Tee-Object -FilePath $testLog
  $testExit = $LASTEXITCODE
  $sw.Stop()
} finally {
  $ErrorActionPreference = $onceki
  Pop-Location
}
$sonKanit = [ordered]@{ d = (Get-Date -Format o); h = $commit; x = $testExit; test = $Etiket; sureSn = [int]$sw.Elapsed.TotalSeconds }
[IO.File]::WriteAllText((Join-Path $kanitDir 'son-kanit.json'), ($sonKanit | ConvertTo-Json) + $nl, $utf8)
# K-0046 (g): kanit loglari sinirsiz buyumez — son 50 / 8 hafta (ikisi de asan silinir).
Get-ChildItem $kanitDir -Filter '*.log' | Sort-Object LastWriteTime -Descending |
  Select-Object -Skip 50 | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-56) } |
  ForEach-Object { Remove-Item $_.FullName -Force }
Write-Host ("KANAL: son-kanit.json yazildi (d=" + $sonKanit.d + " h=" + $commit + " x=" + $testExit + " sureSn=" + $sonKanit.sureSn + ")")
exit $testExit
