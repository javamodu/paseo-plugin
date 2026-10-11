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
$exclude = '\\(node_modules|\.git|dist|build|bin|obj|\.next|coverage|vendor|target)\\'
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
foreach ($f in $files) {
  $rel = $f.FullName.Substring($Root.Length + 1)
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
