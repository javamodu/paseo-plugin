param(
  [Parameter(Mandatory=$true)][string]$A,
  [Parameter(Mandatory=$true)][string]$B,
  [string]$RepoKok = (Get-Location).Path
)
$ErrorActionPreference = 'Stop'
function Oku([string]$e) {
  $p = Join-Path $RepoKok "surumler\$e\kilit.json"
  if (-not (Test-Path $p)) { throw "kilit.json yok: $p" }
  Get-Content $p -Raw -Encoding UTF8 | ConvertFrom-Json
}
$ka = Oku $A
$kb = Oku $B
Write-Host "KIYAS: $($ka.etiket) ($($ka.tarih)) -> $($kb.etiket) ($($kb.tarih))"
Write-Host ("Commit: {0} -> {1}" -f $ka.commit, $kb.commit)
if ($ka.doctor -and $kb.doctor) {
  Write-Host ("Doctor: {0} OK/{1} EKSIK/{2} SARI  ->  {3} OK/{4} EKSIK/{5} SARI" -f $ka.doctor.ok, $ka.doctor.eksik, $ka.doctor.sari, $kb.doctor.ok, $kb.doctor.eksik, $kb.doctor.sari)
}
$eksenAdlari = @{}
foreach ($k in @($ka, $kb)) {
  if ($k.eksenPuanlari) { foreach ($prop in $k.eksenPuanlari.PSObject.Properties) { $eksenAdlari[$prop.Name] = $true } }
}
$satirlar = foreach ($ad in ($eksenAdlari.Keys | Sort-Object)) {
  $pa = $null; $pb = $null
  if ($ka.eksenPuanlari -and $ka.eksenPuanlari.PSObject.Properties[$ad]) { $pa = $ka.eksenPuanlari.$ad.puan }
  if ($kb.eksenPuanlari -and $kb.eksenPuanlari.PSObject.Properties[$ad]) { $pb = $kb.eksenPuanlari.$ad.puan }
  $delta = '-'
  if ($null -ne $pa -and $null -ne $pb) { $delta = ('{0:+#.0;-#.0;0}' -f ($pb - $pa)) }
  [pscustomobject]@{ Eksen = $ad; A = $(if ($null -ne $pa) { $pa } else { '-' }); B = $(if ($null -ne $pb) { $pb } else { '-' }); Delta = $delta }
}
$satirlar | Format-Table -AutoSize
if ($ka.hedefler -and $kb.hedefler) {
  $degisen = foreach ($prop in $kb.hedefler.PSObject.Properties) {
    $eskiProp = $ka.hedefler.PSObject.Properties[$prop.Name]
    $eski = if ($eskiProp) { $eskiProp.Value } else { $null }
    if ("$eski" -ne "$($prop.Value)") { [pscustomobject]@{ Hedef = $prop.Name; A = $eski; B = $prop.Value } }
  }
  if ($degisen) { Write-Host 'Hedef degisimleri:'; $degisen | Format-Table -AutoSize } else { Write-Host 'Hedeflerde degisim yok.' }
}
