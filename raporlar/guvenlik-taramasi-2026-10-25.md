# Güvenlik taraması (S2) — 2026-10-25, F0 commit dalgaları öncesi

Kapsam: paseo-plugin repocusunda commit'e girecek kirli küme (rg, .gitignore saygılı — .tmp-home/ ve .claude/ hariç).

## Sonuçlar (R)

1. **Canlı token (sk-p1hT…) taraması:** `sk-[A-Za-z0-9]{20,}` ve `p1hT67o4` desenleri → trackable kümede **0 eşleşme**. claude-glm.cmd sanitize edildi (S1); .claude/ + .tmp-home/ .gitignore'a alındı (S3).
2. **Genel anahtar sözcük taraması** (api_key/auth_token/secret/token=): 67 dosya eşleşti — hepsi **belge/bench çıktısında sözcük geçişi** (env_key ADLARI, rapor metni), değer değil. Riskli görünen üçü elle kontrol edildi: `scripts/bench-claude.mjs` (env referansı), `hedefler.json`, `raporlar/bench-*/bench.json` (ölçüm alanları) — düz anahtar yok.
3. **Bilinen düz-metin konumları (env DIŞI, commit kümesi DIŞI):**
   - `~/.paseo/config.json` — 2 kart (glm53u-claude ANTHROPIC_API_KEY + claude-glm ANTHROPIC_AUTH_TOKEN + glm53u-codex OPENAI_API_KEY) → **S4 rotate sonrası kullanıcı güncelleyecek** (restart ayrı onay)
   - `.claude/settings.json`, `.tmp-home/claude-glm53u-settings.json`, `.tmp-home/kilo.patch` → gitignore + arsiv kopyası (S3), history'ye GİRMEZ
4. **Env (S1):** `setx ANTHROPIC_AUTH_TOKEN` — mevcut anahtar kullanıcı env'ine yazıldı (interim; rotate sonrası kullanıcı yenisiyle değiştirir). claude-glm.cmd artık `%ANTHROPIC_AUTH_TOKEN%` env referansı (tanımsızsa uyarı + exit 1).
5. **Git geçmişi kontrolü:** anahtar taşıyan dosyaların tamamı hiç commit'lenmemişti (untracked) → geçmişte de yok.

## Hüküm

F0 commit dalgaları için küme **anahtarsız** (A). Kalan tek düz-metin konum ~/.paseo/config.json — S4 (kullanıcı: rotate + kart güncelleme + restart onayı).

Damga: 2026-10-25 · ajan = ana-ajan (S2 icra) · desenler: `sk-[A-Za-z0-9]{20,}`, `p1hT67o4`, `api[_-]?key|auth_token|secret|token[:=]`
