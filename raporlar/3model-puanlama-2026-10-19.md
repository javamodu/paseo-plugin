# 3 MODEL PUANLAMASI — Paseo altında uygulama geliştirme · 2026-10-19

Kapsam: **Kimi K3 · DeepSeek V4.1 Flash-1017 · GLM 5.3** — yalnız **saf performans + ajanik yetenek** (MALİYET DIŞLANDI, kullanıcı talimatı). 6 paralel alt-ajan (explore, salt-okur) 6 eksende kanıt topladı; puanlar 0-100, tümü repodaki (R)/(B)/(T) kanıtlara dayalı.

## Skor tablosu

| Eksen | GLM 5.3 | Kimi K3 | DS 1017 |
|---|---|---|---|
| Kod kalitesi (yerel+bench) | **88** | 86 | 78 (T aktarım) |
| Akıl + terminal (IQ/terminal) | **90** | 75 | 80 (T) |
| Hız (tel-düzey t/s) | 60 | 30 | 65* (düşük güven) |
| Ajanik yetenek (tool/ajan döngüsü) | **92** | 55 | 45 |
| Bağlam + uzun ufuk | 88 | **90** | 60 |
| İstikrar (ölçüm güveni) | **70** | 40 | 25 |
| **Basit ortalama** | **81.3** | 62.7 | 58.8 |

*1017 hızı hiç ölçülemedi; puan aileden (91–133 t/s) devralınma.

## Eksen bazlı hükümler (alt-ajan bulguları özeti)

1. **Kod kalitesi:** GLM 88 — tek modelde hem en yüksek SWE-bench (95.4, B) hem çift-hat yerel full (PASS+5/5+IQ 6/6, R). Kimi 86 (SWE 93.4 ama tek kaynak; iki koşumda yerel full). 1017 78 — kod lane 60.7 üçlü lideri AMA tüm kanıt kardeş `:free` aktarımı (kendi koşumu 402 $0).
2. **Akıl+terminal:** GLM 90 (IQ 6/6 iki bağımsız hattan; terminal 5/5 iki hat). Kimi 75 (IQ 100×2 ama terminal 5/5↔0/5 gün farkı, kökü belgelenemedi). 1017 80 (IQ 100 üç koşum, terminal 5/5 bir kez — kardeşten).
3. **Hız:** GLM tel medyan 82.1 (chat) / 101.1 (/v1/messages), 3+3 tekrarlı. Kimi 35–47 t/s (3 gün, tek-koşum) — üçlünün en yavaşı. 1017 hiç ölçülemedi (aile 91–133 varsayımı).
4. **Ajanik yetenek:** GLM 92 — **tek tam kanıt zinciri**: iki protokolde native tool-call + gerçek motor döngüsü (num_turns=2, doğrulanabilir çıktı) + iki çalışan Paseo kartı (claude-glm açık, kilo rotası). Kimi 55 — yetenek var (TB 80.9 set zirvesi) ama Paseo altında üretim veren kartı yok (403), motor döngüsü kanıtı hiç yok. 1017 45 — tüm kartlar bloklu (402/429/kredi).
5. **Bağlam+uzun ufuk:** Kimi 90 — 1.05M ctx + üç uzun-ufuk bench zirvesi (Marathon 48.1, FrontierSWE 81.2, DeepSWE 67.5). GLM 88 (1M/128k + TB3.0 lideri 28.3). 1017 60 (1M+384K maks çıkış ama uzun-ufuk bench kanıtı sıfır).
6. **İstikrar:** GLM 70 — tek tekrarlı-medyAN metodolojili ve tek taze/tazelenebilir kanıtlı; gölge: 6/6 tel yanıtı `model: glm-5.2` bildiriyor (sürüm sadakati doğrulanmadı). Kimi 40 (5 gün eski, kapı 403, koşum-koşum düşüş). 1017 25 (kendi koşumu 0, kardeşi bile aynı gün 5/5↔0/5).

## Nihai hüküm — "Paseo altında uygulama geliştirmek"

1. **GLM 5.3 (81.3) — bugün tek fiilen kullanılabilir zirve:** ajanik yetenek + kod + tazelik lideri; günlük kart `claude-glm` (E2E) veya kilo rotası. Tek izleme maddesi: glm-5.2 takma-ad şüphesi (sağlayıcıya sorulmalı).
2. **Kimi K3 (62.7) — yetenek şampiyonu, erişim rezaleti:** uzun-ufuk/ctx en geniş; ama kapısı 403 ve motor-ajan kanıtı yok — paket yenilenirse ilk iş ajan döngüsü ölçümü olmalı.
3. **DS 1017 (58.8) — kanıtsız vaat:** bağlam donanımı en güçlü (1M+384K) ama kendi tek koşumu yok; bakiye yüklenip ölçülmeden ana yazar yapılmamalı (mevcut profil: yedek, kardeş anaYazar).

Damga (R): 2026-10-19 · 6 alt-ajan (explore, salt-okur) · kanıt tabanı: bench-*/bench.json (14 koşum seti), uygunluk-top30-2026-10-18, saf-performans-top30-2026-10-18 (D1-D16), bench-glm-claude karsilama.md, config.json, DERSLER 120-139 · maliyet ekseni kullanıcı talimatıyla puanlama dışı.
