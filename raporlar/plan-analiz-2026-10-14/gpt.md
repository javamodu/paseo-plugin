# gpt paketi — derin analiz ve puanlama (2026-10-14)

> Çerçeve: v3.2 sabit — 15 alan, ağırlıklar: Teslim 14 · Yetki/güvenlik 13 · Halüsinasyon/kanıt 10 · Long-run/recovery 10 · İzleme 8 · Otonomi 7 · Manager 6 · Handoff 5 · Coding 5 · Reasoning 4 · Paralellik 4 · Schedule 4 · Memory 4 · Hız/maliyet 3 · Taşınabilirlik 3. Her alan 0-10; canlı kanıt yoksa tavan 8. NOT_RUN başarısızlık değildir.
> Hedef: `D:\Vibecode\silinecek-task-graph\gpt` (plan + şablon + offline doğrulayıcı paketi; uygulama kodu kardeş `ordu-core`, kabul kaydı `ordu-v3`).
> Yöntem: salt okunur + test koşuları; hiçbir dosya değiştirilmedi. `node gpt/verify-plan.mjs`, `node gpt/verify.mjs`, `ordu-core: npm test` bu oturumda gerçekten çalıştırıldı.

## Doğrulama bulguları (plan iddiası → güncel dosya)

- `verify-plan.mjs` → **40/40 PASS, exit 0** (bu oturumda). README'nin offline doğrulayıcı iddiası DOĞRU.
- `ordu-core npm test` → **102/102 PASS** (bu oturumda). PLAN-v3.md ve TUM-PLANLAR-PUANLAMA-v3.3 iddiası DOĞRU.
- `ordu-v3/kabul.csv` → 65 satır: 23 GECTI_HERMETIC, 3 GECTI, 6 KISMEN, 1 PASS_PARTIAL, 1 BLOCKED, 31 NOT_RUN — v3.3 sayımıyla uyumlu.
- `MISSION-ACCEPTANCE.csv` → **32 satır, 32×NOT_RUN**. README "19 yeni ürün kabul kapısı" yazıyor → **bayat iddia** (32 olmalı).
- `verify.mjs` (eski UX prototip kontrolü) → **ŞU AN KIRMIZI**: `verify.mjs:145` `.top-status` içinde "Bağlantı yok" arıyor; `index.html:208` artık "local · Paseo opsiyonel · tasarım prototipi" yazıyor. README'nin dayandığı `verify-report.json` (32/32) bayat → **uygulama eksik / kayıt hijyeni açığı**.
- Schedule modülü: `ordu-core/src` altında schedule/occurrence kodu YOK (rg doğruladı; yalnız dispatcher'da kelime geçiyor) → D2 "uygulama eksik" doğrulandı.
- Memory/learning: yalnız `event-payloads.ts:87` `quarantined` sayacı; öğrenme modülü YOK → doğrulandı.
- Repo git deposu değil, CHANGELOG yok → tur sayısı sürümlü belgelerden çıkarıldı.

## Alan tablosu (skor 0-10)

| Alan (ağırlık) | Skor | Gerekçe (1 satır) |
|---|---|---|
| Teslim (14) | 4 | 32/32 ürün kapısı NOT_RUN; doğrulanmış ürün teslimi sıfır; paket yalnız plan+şablon+çalışan offline doğrulayıcı teslim ediyor |
| Yetki/güvenlik (13) | 7 | Deny-default, immutable payload (A05-b testi yeşil), freeze kapıları, negatif fixture'lı schema doğrulaması 40/40; canlı auth/sandbox yok → tavan altı |
| Halüsinasyon/kanıt (10) | 7 | Durum taksonomisi (TASARIM≠UYGULAMA≠KANIT≠BAŞARISIZ) ve NOT_RUN dürüstlüğü örnek düzeyde; eksi: README 19-vs-32 ve bayat verify-report 32/32 |
| Long-run/recovery (10) | 6 | Lease/fence/restart-latch tasarımı + kanıt ordu-core'da hermetik (102/102, S1-restart dahil); kill -9 canlı NOT_RUN, kanıt başka pakette |
| İzleme (8) | 5 | STOP latch/telemetri tasarımı net, ordu-core'da hermetik KPI türetme var; canlı akış/UI kanıtı yok, prototip sayfası kurmaca |
| Otonomi (7) | 5 | Gözlem/Kontrollü/Şablonla-otonom profil kapıları iyi tanımlı (M11/M17); müdahalesiz canlı akış hiç koşulmadı |
| Manager (6) | 5 | Rol ayrımı (manager/coder/evaluator/supervisor) + deterministik supervisor ordu-core'da hermetik; gerçek LLM manager NOT_RUN |
| Handoff (5) | 5 | Zorunlu handoff paketi §5 + ordu-core kapalı DTO (handoff.test yeşil); gerçek canlı devir yok |
| Coding (5) | 5 | verify-plan.mjs temiz 40/40; fakat verify.mjs güncel index.html'e karşı kırmızı — paketin kendi kodu kısmen bayat |
| Reasoning (4) | 3 | M18 makbuz tasarımı var; D3 açık, tek kod yolu yok, rubric prompt'u şablon düzeyinde |
| Paralellik (4) | 4 | Kapasite/rezervasyon modeli ordu-core'da hermetik (A24 WAIT_CAPACITY); iki paralel kapsül canlı NOT_RUN |
| Schedule (4) | 3 | M08/M09/M10 tasarımı + schema negatif fixture'ları yeşil; schedule kodu hiç yok (D2) — tasarım+fixture tek başına 3'ü geçirmez |
| Memory (4) | 2 | Karantina/provenance tasarımı var; kod yalnız bir `quarantined` sayacı; öğrenme motoru yok |
| Hız/maliyet (3) | 3 | Bütçe/maliyet muhasebesi tasarımı + telemetry hermetik; gerçek p50/p95 ölçümü yok (V3-S4 NOT_RUN) |
| Taşınabilirlik (3) | 5 | Dual-runtime (paseo/local) tasarımı + RT.1 gerçek git worktree testi ordu-core'da yeşil; ikinci runner canlı değil |

## Ağırlıklı toplam

56+91+70+60+40+35+30+25+25+12+16+12+8+9+15 = 504 → **50.4 / 100**

(Karşılaştırma: paketin kendi v3.2 öz-puanı 58.9 idi; bağımsız doğrulamada Schedule 7→3, Reasoning 5→3, Memory 4→2, Teslim 5→4 indi; Halüsinasyon 5→7 çıktı.)

## İlk 3 açık

1. **Canlı ürün teslimi yok** — Kod yeri: `gpt/MISSION-ACCEPTANCE.csv` (M01-M32 tamamı NOT_RUN), giriş `ordu-core/src/cli.ts:23`. Kabul testi: E1 tek kapsül uçtan uca canlı koşu + E2 kill -9. Durum: KANIT-EKSIK (kod kısmen var; kullanıcı onayı/harcama bekliyor; NOT_RUN ≠ başarısız).
2. **Schedule / reasoning / memory kodu hiç yok** — Kod yeri: `ordu-core/src` altında schedule modülü yok (rg doğruladı); D2/D3 `gpt/KAPANIS-LISTESI.md` B bölümü. Kabul testi: M08/M09/M10 hermetik (occurrence benzersizliği, TZ/DST, misfire) + M18 makbuzsuz rapor reddi. Durum: TASARIM var, UYGULAMA-EKSIK.
3. **Paketin kendi kanıtı bayat** — Kod yeri: `gpt/verify.mjs:145` (kaldırılmış "Bağlantı yok" metnini arıyor, `index.html:208`), `gpt/README.md` ("19 kapı", gerçek 32). Kabul testi: `node gpt/verify.mjs` exit 0 ve README sayımı CSV ile eşit. Durum: UYGULAMA-EKSIK (kayıt hijyeni; düzeltme küçük).

## Hüküm

gpt paketi bir ürün değil, disiplinli bir plan/doğrulama paketi: öncelik sırası, otorite ayrımı ve durum taksonomisi olgun; offline doğrulayıcı gerçekten çalışıyor (40/40, bu oturumda) ve yönlendirdiği ordu-core hattı 102/102 hermetik yeşil. Buna karşılık 32 ürün kapısının tamamı NOT_RUN, schedule/memory/reasoning hiç kodlanmamış ve paketin kendi doküman kanıtında iki bayat iddia var (README 19-vs-32; verify.mjs/verify-report 32/32 artık kırmızı) — kanıt dürüstlüğüyle övünen bir paket için bu ikisi önce kapatılmalı. 50.4/100: tasarım üst orta, teslim kanıtı alt düzey.

## İyileştirme turu

git/CHANGELOG yok; sürümlü belgelerden çıkarım: puanlama v1 (GPT 83) → v2 (76) → v3-metrikler (58.6) → v3.2 (58.9) → v3.3 (ordu-core odaklı) = **5 ölçüm turu**; PLAN v2.2 → v3 → v3.1 = 3 plan revizyonu; ordu-core test 51 → 59 → 102 = **≥3 uygulama turu**. Toplam **~5 belgelenmiş iyileştirme turu** (kanıt: sürümlü dosya adları + sayım tarihçesi; kesin sayı git olmadığı için çıkarımdır, (T)).

> Not: paseo-plugin tarafında `scripts\codemap.ps1` çalıştırılmadı — CODEMAP.md başka bir aktif işte kirli; rapor eklentisi append-only dizine tek dosyadır.
