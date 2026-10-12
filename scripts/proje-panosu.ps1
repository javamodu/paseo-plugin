param(
  [string[]]$Kokler = @('D:\Vibecode', 'D:\indir', "$env:USERPROFILE\Local Sites"),
  [int]$Derinlik = 4,
  [string]$CiktiKok = '',
  [switch]$TestModu
)
$ErrorActionPreference = 'Continue'
$SCRIPT_SURUM = '1.0.0'
$utf8 = New-Object System.Text.UTF8Encoding($false)
if (-not $CiktiKok) { $CiktiKok = Join-Path (Split-Path $PSScriptRoot -Parent) 'raporlar\proje-panosu' }

function KovaBul([string]$repo) {
  $l0 = Test-Path -LiteralPath (Join-Path $repo 'AGENTS.md')
  $l1 = Test-Path -LiteralPath (Join-Path $repo 'STATE_BOARD.md')
  $l1alt = $l1 -or (Test-Path -LiteralPath (Join-Path $repo 'plans\STATE_BOARD.md'))
  $l5 = Test-Path -LiteralPath (Join-Path $repo 'DERSLER.md')
  if ($l0 -and $l1alt -and $l5) { return 'TAM' }
  if ($l0 -and $l1alt) { return 'L0+L1' }
  if ($l0) { return 'L0-only' }
  return 'hic'
}

function TelemetriOzet([string]$repo) {
  $dosya = Join-Path $repo '.verimlilik\telemetri.jsonl'
  $o = [ordered]@{ tur = 0; failPct = $null; durtme = 0; sonTs = $null }
  if (-not (Test-Path -LiteralPath $dosya)) { return $o }
  $fail = 0; $cagri = 0
  foreach ($satir in [IO.File]::ReadLines($dosya)) {
    if (-not $satir.Trim()) { continue }
    try {
      $k = $satir | ConvertFrom-Json
      if ($k.tip -eq 'tur') { $o.tur++; $cagri += [int]($k.toolCalls); $fail += [int]($k.failedCalls); if ($k.ts) { $o.sonTs = $k.ts } }
      if ($k.detay -and "$($k.detay)" -match 'durtme') { $o.durtme++ }
    } catch {}
  }
  if ($cagri -gt 0) { $o.failPct = [math]::Round(100.0 * $fail / $cagri, 1) }
  return $o
}

function RepoTara([string]$repo) {
  $ad = Split-Path $repo -Leaf
  $commit14 = 0
  try { $commit14 = [int](git -C $repo log --since='14 days ago' --oneline 2>$null | Measure-Object -Line).Lines } catch {}
  $kirli = @((git -C $repo status --short 2>$null) | Where-Object { $_ -notmatch 'telemetri-haftalik|\.verimlilik' })
  $t = TelemetriOzet $repo
  return [ordered]@{
    ad = $ad; yol = $repo; kova = (KovaBul $repo)
    commit14g = $commit14; kirliDosya = $kirli.Count
    tur = $t.tur; failPct = $t.failPct; durtme = $t.durtme; sonTelemetri = $t.sonTs
  }
}

function EvrenBul([string[]]$kkl, [int]$der) {
  $bulunan = @{}
  $atla = @('node_modules', '.git', 'dist', 'build', '.next', '.vercel', 'coverage')
  foreach ($kok in $kkl) {
    if (-not (Test-Path -LiteralPath $kok)) { continue }
    $kuyuk = New-Object System.Collections.Generic.Queue[object]
    $kuyuk.Enqueue(@($kok, 0))
    while ($kuyuk.Count -gt 0) {
      $par = $kuyuk.Dequeue(); $yol = $par[0]; $seviye = [int]$par[1]
      if ($seviye -gt 0 -and (Test-Path -LiteralPath (Join-Path $yol '.git'))) { $bulunan[$yol] = $true; continue }
      if ($seviye -ge $der) { continue }
      foreach ($alt in (Get-ChildItem -LiteralPath $yol -Directory -Force -ErrorAction SilentlyContinue)) {
        if ($atla -contains $alt.Name) { continue }
        if ($alt.Name -match '^\.|^_') { continue }
        $kuyuk.Enqueue(@($alt.FullName, ($seviye + 1)))
      }
    }
  }
  return $bulunan.Keys | Sort-Object
}

if ($TestModu) {
  $tmp = Join-Path $env:TEMP ('pano-test-' + [guid]::NewGuid().ToString('N').Substring(0,8))
  New-Item -ItemType Directory -Force -Path "$tmp\tam\.git", "$tmp\l0l1\.git", "$tmp\l0\.git", "$tmp\hic\.git" | Out-Null
  [IO.File]::WriteAllText("$tmp\tam\AGENTS.md", 'x', $utf8); [IO.File]::WriteAllText("$tmp\tam\STATE_BOARD.md", 'x', $utf8); [IO.File]::WriteAllText("$tmp\tam\DERSLER.md", 'x', $utf8)
  [IO.File]::WriteAllText("$tmp\l0l1\AGENTS.md", 'x', $utf8); [IO.File]::WriteAllText("$tmp\l0l1\STATE_BOARD.md", 'x', $utf8)
  [IO.File]::WriteAllText("$tmp\l0\AGENTS.md", 'x', $utf8)
  $evren = EvrenBul @($tmp) 2
  $kovaler = $evren | ForEach-Object { KovaBul $_ }
  $hataSay = 0
  if (($kovaler | Where-Object { $_ -eq 'TAM' }).Count -ne 1) { Write-Host 'TEST FAIL: TAM sayisi'; $hataSay++ }
  if (($kovaler | Where-Object { $_ -eq 'L0+L1' }).Count -ne 1) { Write-Host 'TEST FAIL: L0+L1 sayisi'; $hataSay++ }
  if (($kovaler | Where-Object { $_ -eq 'L0-only' }).Count -ne 1) { Write-Host 'TEST FAIL: L0-only sayisi'; $hataSay++ }
  if (($kovaler | Where-Object { $_ -eq 'hic' }).Count -ne 1) { Write-Host 'TEST FAIL: hic sayisi'; $hataSay++ }
  if ($evren.Count -ne 4) { Write-Host "TEST FAIL: evren 4 olmali, $($evren.Count)"; $hataSay++ }
  Remove-Item -Recurse -Force $tmp
  if ($hataSay -eq 0) { Write-Host 'TEST OK: proje-panosu kendi kendini dogruladi'; exit 0 } else { Write-Host "TEST FAIL: $hataSay hata"; exit 1 }
}

$evren = EvrenBul $Kokler $Derinlik
$kartlar = @($evren | ForEach-Object { RepoTara $_ })
$tarih = Get-Date -Format 'yyyy-MM-dd'
New-Item -ItemType Directory -Force -Path $CiktiKok | Out-Null

$ozet = [ordered]@{
  surum = $SCRIPT_SURUM; tarih = $tarih; evren = $kartlar.Count
  kovalar = [ordered]@{
    TAM = @($kartlar | Where-Object { $_.kova -eq 'TAM' }).Count
    'L0+L1' = @($kartlar | Where-Object { $_.kova -eq 'L0+L1' }).Count
    'L0-only' = @($kartlar | Where-Object { $_.kova -eq 'L0-only' }).Count
    hic = @($kartlar | Where-Object { $_.kova -eq 'hic' }).Count
  }
  repos = $kartlar
}
[IO.File]::WriteAllText((Join-Path $CiktiKok "$tarih.json"), ($ozet | ConvertTo-Json -Depth 5) + [Environment]::NewLine, $utf8)

$md = @("# Proje Panosu - $tarih (v$SCRIPT_SURUM)", "", "Evren: $($ozet.evren) repo - TAM: $($ozet.kovalar.TAM) - L0+L1: $($ozet.kovalar.'L0+L1') - L0-only: $($ozet.kovalar.'L0-only') - hic: $($ozet.kovalar.hic)", "", "| Repo | Kova | Commit/14g | Kirli | Tur | Fail% | Durtme |", "|---|---|---|---|---|---|---|")
foreach ($k in ($kartlar | Sort-Object { -$_.commit14g })) {
  $md += "| $($k.ad) | $($k.kova) | $($k.commit14g) | $($k.kirliDosya) | $($k.tur) | $(if ($null -ne $k.failPct) { $k.failPct } else { '-' }) | $($k.durtme) |"
}
[IO.File]::WriteAllText((Join-Path $CiktiKok "$tarih.md"), ($md -join [Environment]::NewLine) + [Environment]::NewLine, $utf8)
Write-Host "PANO OK: $($ozet.evren) repo tarandi -> $CiktiKok\$tarih.(md|json)"
