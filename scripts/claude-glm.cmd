@echo off
rem S1 sanitize (2026-10-25, ADR-toparlanma S1): anahtar ASLA bu dosyada durmaz.
rem ANTHROPIC_AUTH_TOKEN env'den gelir: setx ile kurulur (S4 rotate sonrasi kullanici gunceller).
if not defined ANTHROPIC_AUTH_TOKEN (
  echo UYARI: ANTHROPIC_AUTH_TOKEN env eksik - once "setx ANTHROPIC_AUTH_TOKEN <anahtar>" calistir.
  exit /b 1
)
set "ANTHROPIC_BASE_URL=https://api.codefast.app/glm-53-unlimited-api"
set "ANTHROPIC_MODEL=glm-5.3"
set "ANTHROPIC_SMALL_FAST_MODEL=glm-5.3"
set "ANTHROPIC_DEFAULT_OPUS_MODEL=glm-5.3"
set "ANTHROPIC_DEFAULT_SONNET_MODEL=glm-5.3"
set "ANTHROPIC_DEFAULT_HAIKU_MODEL=glm-5.3"
"C:\Users\gatep\.local\bin\claude.exe" %*
