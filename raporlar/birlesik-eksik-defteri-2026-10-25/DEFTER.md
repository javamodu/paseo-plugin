# NİHAİ BİRLEŞİK EKSİK DEFTERİ — v3 FİNAL (27 açık · 1 kapalı)
Kaynaklar: yazıcı-oturum şeridi (`43d2c6d`, `846cd2c`) · 6-subagent ×2 tur · devir-taraması 6-subagent (`raporlar/devir-tarama-6subagent-2026-10-25/`, + uygulama planı `plans/SAVASA-HAZIR-PLAN-2026-10-25.md`) · gözlemci bağımsız denetimi — dedupe'li, tek numaralandırma. SSOT-defter: BU DOSYA (önceki iki rapor `raporlar/denetim-6subagent-2026-10-25/` ve `raporlar/son-durum-6subagent-2026-10-25/` tarihsel kayıt olarak kalır).

## Yeşil zemin (kaynaklar aynı ölçüde, R)
core **296/296 EXIT=0** (gözlemci ölçümü) · plugin **4/4 EXIT=0, 387 ok** (yazıcı koşumu) · zincir **20/20 tam-ad** (`zincir-kontrol` EXIT=0) · SSOT tek · sanitize 0 canlı-anahtar-değeri (ordu içinde) · git 216 commit kesintisiz · **B14 KAPALI** (bekçi yeni evden yazıyor — canlı kanıt) · saglik güncel **17 OK / 1 EKSIK** (maskesiz koşum).

## A — Kayıt/Kanıt/Versiyon (F4'ü bloklar) 🔴
| # | Madde | Kanıt | Kapanış yeri |
|---|---|---|---|
| A1 | **K-0029 + K-0036 YOK** (3'er yerden atıflı; K-0036 = ücretli-yok politikası) | glob: K-0028→30, K-0035→37 atlanmış | kayıt turu (F4 öncesi) |
| A2 | **Ham kanıt arşivsiz**: 24 bench koşusu (702K) + `.bench-*` 4 dizin + `ordu-core.zip` (2.1MB ≠ bundle 294K) + `.paseo-bench\` b2-results (gözlemci eki) eski evde | Test-Path + sayım; arsiv'de karşılık 0 | F4 penceresi — silmeden ÖNCE taşıma |
| A3 | silinecek-task-graph **versiyonsuz** (`.git` yok; ordu-core\.git içeride) | Test-Path | F4'te bundle şart |

## B — Fake-green/Anlatı (savaş yolunu bloklar) 🔴
| # | Madde | Durum |
|---|---|---|
| B4 | cache-hit kapısı bozuk metrik + **eşik kaynağı çelişkisi** (`hedefler.json:8`=40, kapı 60 okuyor) | açık — metrik + eşik-kaynağı bağla |
| B5 | kabul-oranı **öz-bildirimli** (telemetri %98.6) vs defter **38/115 NOT_RUN**, canlı %23 | açık — defter-kaynak + azaltma planı |
| B6 | `*> $null` maske deseni + STATE 2 bayat satır — **KISMİ'ye indi**: güncel disk 17 OK/1 EKSIK (`480911b` sonrası; "2-3 EKSIK" onarım-öncesi doğruydu) | maske kaldır + STATE tazele |
| B6b | **`core\veri\pano-start.ps1` eski eve sabit** (ORDU_DB + Set-Location) + **gömülü PANO_TOKEN** | 🔴 BAŞLA turu — savaşın pano ayağı eski çekirdeği koşar |

## C — Kimlik/Referans 🟡
| # | Madde |
|---|---|
| C7 | ✅ **KAPALI** — zincir onarımı `480911b` (çift kanıtlı: yazıcı + bağımsız doğrulayıcı) |
| C8 | `core\KULLANIM.md:4` eski eve koşturuyor (yeni ajan yanlış kökte koşar) |
| C9 | 6+ doküman bayat kimlik (README:1, pano README:3/BLUEPRINT:4, ANAYASA:1+11 A4 "v2.0" — onay ister, admin-onboarding:85+96, SSOT-INDEX:23) + **AGENTS.md "Yapı" bölümüne bileşen evleri (core/plugin/pano/referans) eksik** (gözlemci eki) |
| C10 | CODEMAP dizin-sayı uyumsuzluğu (codemap.ps1 üretim düzeltmesi; HEAD damgası 1-commit gecikme = bootstrap, doğal) |

## D — Atık/Test kapsamı 🟡
| # | Madde |
|---|---|
| D11 | `ajanTemizle` **9 modülde** duplike (birleştirme 19 dosyaya dokunur — riskli) |
| D12 | `plugin\client\web.ts` ölü modül (0 import — güvenli silme adayı) |
| D13 | **`live-gates-v4.test.ts` suite'te değil (36/37)** — baseline'ın parçası OLALI (canlı koşum içerir: koşuya/harcamaya dikkat) |
| D14 | Bilinçli/kanıtlı kalanlar: `bench-claude.mjs` (belgelenmiş kopya — karşılaştırılabilirlik), `model-katalog.mjs` (top30 repro zinciri — **SİLİNMEZ**, tur-1 maddesi düzeltildi), 2 kapı betiği, `.pano-serve.js` — dokümantasyon notu yeter |

## E — Yapı (ADR sapması) 🟡
| # | Madde |
|---|---|
| E15 | core/ içinde **21 tracked veri/runtime** — **tek tasarımsal KARAR: defter-deseni mi S7 mi** — İNSAN |
| E16 | plans/arsiv (7 plan) + plans/mockup → kök arsiv/ altında |
| E17 | Kökte hedef-ağaç-dışı öğeler (SSOT-INDEX'te kısmen kasıtlı sayılı — not düş, dokunma kararı) |
| E18 | referans dizin adı ADR "kapsul-final" ile birebir değil |

## F — Güvenlik 🔴
| # | Madde | Zaman |
|---|---|---|
| F19 | **sk-p1h (51 karakter gövde) 9 konumda düz metin** (`.claude\settings.json` + `.tmp-home\`×4 + arsiv×4) — **repo'ya sızmış DEĞİL** (gitignored, `git log --all` 0 commit; yalnız diskte) → **karar C: env'e** — B20 ile TEK restart penceresi | F4'ten önce, BAŞLA turunda |
| F20 | B16/B18/B19 kaynak anahtarlar donmuş evde → env + **Groq rotate önerisi** (yüksek; thk/nvapi env yeter) | F4 penceresi |
| F21 | B17 pano-token K kaydı işlenmemiş | mekanik tur |

## G — Hijyen 🟡
| # | Madde |
|---|---|
| G22 | denetim.json `maddeSayisi:20` vs dizi 18 — **bu turda düzeltildi** |
| G23 | islenme=null birikimi (B8/B9/B10/B17/B20…) — kanal işleme turu |
| G24 | `.gitignore`'a `.tmp-kilo\` eklenmeli; kökte boş `veri\` silinmeli (gözlemci eki) |

## H — Dışarıdakiler/sınıflandırma (gözlemci şeridi) 🟡
| # | Dizin | Öneri |
|---|---|---|
| H25 | `AGENTS.md\` bilgi kütüphanesi (100x/claude/gpt/karpathy + 6 çizik txt) | referans/ altına ADAY + çizik gözden geçirme |
| H26 | `tmp-paseo-server\` (pin'li SDK 0.11.2) | **DOKUNMA** — B00 kabul kaydının kaynağı |
| H27 | kök `.verimlilik\` (telemetri düzlemi) | S7'ye uygun — kalır |

## Ek doğrulanmış notlar
- **SA-02 (yazıcı tur-2 bulgusu, sıraya GİRMELİ):** ADR sonuç-ölçüm kapı 1 = **"0 EKSIK"** → **K-0039 (kural-proxy 84→<80) "SAVAŞA HAZIR"ın önkoşuludur** — gözlemci sırasında UFUK'ta duruyordu, TUR 3'e taşındı.
- **SA-03:** "EK-4" rehberde yok — onboarding checklist = **rehber §9 (L109-119)**; tur adı §9'dur.

---

# BİRLEŞİK İCRA SIRASI (tek düdük)

**TUR 1 · "fake-green/pano BAŞLA"** (onay: kullanıcı — tek komut):
B4 (metrik + eşik kaynağı 40) · B5 (defter-kaynak + NOT_RUN azaltma planı) · B6 (maske kaldır + STATE tazele) · **B6b** (pano-start yeni ev + token env) · B20 (PANO_UI_DIR → ordu\pano) · **F19** (karar C: sk-p1h env'e — B20 ile TEK restart) · D13 (v4 suite'e — canlı koşum bilinciyle) · G22/G23 (kanal turu)

**TUR 2 · C+E+G mekanik** (onaysız, dosya-bazlı commit): C8/C9 (+AGENTS Yapı) · C10 (codemap.ps1) · D11/D12 · E16 · F21 · G24 — **sırasında 1 insan kararı: E15**

**TUR 3 · Rehber §9 baseline** (SA-03 ad düzeltmesi) + **K-0039** (SA-02: 0 EKSIK önkoşulu) → **"SAVAŞA HAZIR" raporu** (ADR §Sonuç ölçümleri 6 madde)

**DÜDÜK · SAVAŞ START** (komut kullanıcıda — %100 yeni evden: gözetimli E2E + STOP/kill-9 + pano görsel → kabul.csv canlı satır)

**F4 PENCERESİ** (savaş sonrası, sıra şart): A1 (K-0029/0036 aç) → A2 (ham bench + b2 + zip → arsiv) → A3 (bundle) → F20 (env + Groq rotate) → kartlar (karar C kalıntısı) → H sınıflandırmaları → **eski evler sil**

**UFUK:** K13-01 giriş kapısı → gece vardiyası (K13-03) · 5-LLM turnuvası (K13-02) · pano gerçek UI (F6/F7) · K5 (txt-to-cad paralel)

---

**Yeni oturuma tek mesaj (tam paket):**
"fake-green/pano BAŞLA — paket: B4 eşik kaynağı hedefler.json (40) · B5 defter-kaynaklı kabul-oranı + NOT_RUN azaltma · B6 maske kaldır + STATE tazele · B6b pano-start.ps1 yeni ev + token env · B20 → ordu\pano · F19 karar C: sk-p1h env'e, B20 ile TEK restart · D13 live-gates-v4 suite'e · G22/23 kanal turu. Sonra mekanik tur (C/D/E/F21/G24; E15 kararını bana sor) → §9 baseline + K-0039 → 'SAVAŞA HAZIR'. START'ı ayrıca veririm."

**Özet: 27 açık — savaş yolunu bloklayan yalnız B-şeridi (5) + F19; hepsi tek BAŞLA turunda. F4 engelleri (A) planlı bekler; mekanikler onaysız; insan kararları: E15 (+ANAYASA A4 onayı C9 içinde). Düdük: "fake-green/pano BAŞLA".**

Damga (R): 2026-10-25 21:50, ajan = yazıcı (Claude glm-5.3, ordu; birleştirme 3 kaynak), commit = `bf4e8ec` (bu bağlama satırı ayrı commit'tedir — DERSLER 157 kalıbı).
