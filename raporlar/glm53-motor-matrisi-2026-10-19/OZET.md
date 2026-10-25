# GLM 5.3 Motor Matrisi — 2026-10-19

Amaç: GLM 5.3’ün KiloCode/Kilo, OpenCode, Codex ve Claude Code motorlarındaki gerçek durumunu tek tabloda toplamak.

## Top30 Kaydı

| Sıra | Model | Puan | Etiket | Kanıt |
|---:|---|---:|---|---|
| 1 | GLM 5.3 | 86 | A · (R) | raporlar/saf-performans-top30-2026-10-18.md |

## Motor Durumu

| Motor | Sonuç | Ölçüm/Kanıt | Not |
|---|---|---|---|
| Claude Code | **ÇALIŞIYOR** | (R) raporlar/bench-glm-claude-2026-10-18/bench.json: IQ 6/6, terminal 5/5, kod PASS, uyum PASS, 22.6 t/s motor-dahil | 2026-10-19 sandbox koşumu ECONNREFUSED nedeniyle geçersiz; motor kararı 10-18 ölçümünden gelir. Tel yanıtı glm-5.2 bildirme şüphesi sürüyor. |
| KiloCode / Kilo | **ÇALIŞIYOR** | (R) E2E-OK-GLM53-KILO; model yolu glmcodefast/glm-5.3 | 2026-10-19 help denemesi sandbox yazma izni (EPERM) ile engellendi; bu ürün hatası kanıtı değil. |
| OpenCode | **YOL VAR, E2E KANIT YOK** | (R-cat) katalogda glmcodefast/glm-5.3; 2026-10-17 erişim 401 | 2026-10-19 opencode models denemesi EEXIST ile çöktü; model çalışıyor diyilemez. |
| Codex | **ÇALIŞMIYOR** | (R) codefast-glm /responses 404, /chat 200; kart bilinçli kapalı | Codex doğrudan Responses bekler; bu uç chat-only olduğu için ACP motoru gerekir. |

## Gerçek Ölçüm Değerleri

| Hat | Ölçüm |
|---|---|
| Ham chat | medyan **82.1 t/s** · terminal 5/5 · kod PASS · uyum PASS · IQ 6/6 (yeniden prob) |
| Anthropic tel | medyan **101.1 t/s** (3+3 koşum) |
| Claude Code motoru | **22.6 t/s** (motor-dahil) · IQ 6/6 · terminal 5/5 · kod PASS · uyum PASS |

## 2026-10-19 Denemesi

`node scripts/bench-claude.mjs --out=raporlar/bench-glm-claude-2026-10-19` koşuldu. Beş görev de `API Error: Connection refused (ECONNREFUSED)` döndü; `olculen: 0`. Bu koşum **performans ölçümü sayılmaz**; sandbox/ağ ortamı sonucudur. Kayıt: `raporlar/bench-glm-claude-2026-10-19/bench.json`.

## Hüküm

- Top30 sıralamasında GLM 5.3, **gerçek ölçümle #1 / 86 puan** durumundadır.
- Fiilen kullanılabilir motorlar: **Claude Code** ve **Kilo/KiloCode**.
- **OpenCode** için kurulum/yol var ama bu makinede E2E başarı kanıtı yok.
- **Codex** bu GLM ucuyla doğrudan çalışmaz; `/responses` 404 nedeniyle kart kapalı tutulmalı.
