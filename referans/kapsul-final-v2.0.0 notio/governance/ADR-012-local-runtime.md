# ADR-012 — Yerel runtime yolu (Paseo-suz çalışma)

**Tarih:** 2026-10-13 · **Durum:** KABUL (kullanıcı kararı, yetki kökü)
**Karar veren:** kullanıcı; yazan: ordu-v3 operasyon katmanı (ADR-011 devamı)

## Bağlam ve gerekçe
Kullanıcı isteği: "paseo olmadan da çalışabilsin; tüm planlar buna göre güncellensin."
ADR-011 ve CODE-BUDGET'ta "ikinci tam runner" bilinçli **kapsam dışıydı** (bütçe
koruma kararı). Bu ADR o kısmı kullanıcı yetkisiyle revize eder: ikinci runner
eklenir, ANCAK ikinci core/defter (Y1) eklenmez — tek ledger, tek kapı seti.

## Karar
1. `runtime: "paseo" | "local"` seçimi `config/ordu.json`'da dosya-tabanlı, fail-closed
   (varsayılan `paseo`; geçersiz değer → dispatch yok). Dispatch hattı runtime-BAGIMSIZ
   kalır: `WorkerAdapter` arayüzü, outbox/rezervasyon/fence/reconcile kuralları aynen.
2. **local yolu** = core'un YÖNETTİĞİ `git worktree` + provider CLI süreci (claude/codex
   gibi makinede kurulu ajan CLI'ları; adapter'ın çağırdığı komut planda donmuş allowlist).
   Paseo'dan devralınan sorumluluklar: worktree izolasyonu (git), süreç tablosu
   (kalıcı kayıt dispatchKey→pid), iptal (OS sinyali/kill + confirm), kullanım bildirimi
   (CLI çıktısından çıkarılan; yoksa `usage_unknown` — mevcut A-mekanizma zaten bunu destekliyor).
3. **Kabiliyet modeli runtime-spesifik ikiye bölünür:** probe receipt'inde her runtime
   kendi kanıt setiyle değerlendirilir; kanıtlanmamış yetenek o runtime'da spawn'ı
   bloklar (B02 deseni aynen). `local` için anahtar yetenekler:
   `gitWorktreeProven`, `processRegistryDurable`, `cancelConfirmLocal`, `providerCliPresent`.
4. **Bildirim bağımlılığı gevşetilir:** Paseo heartbeat `paseo` runtime'ının kanalıdır;
   `local` runtime'da pano SSE + opsiyonel webhook/e-posta fallback'i kullanır (S2).
   Sessiz-akış ve karar-kartı semantiği KANALDAN BAĞIMSIZ tanımlı kalır (20-uzaktan).
5. Bütçe revizyonu: CODE-BUDGET'a `runtime-local adapter` katmanı **+300–550 LOC**
   eklenir; ürün tavanı 6.500→7.050, toplam tavan 9.300→9.850. Diğer kalemler değişmez.

## Riskler (kabul edilmiş, dürüst)
- **İzolasyon zayıflığı:** git worktree, Paseo sandbox'ının süreç/FS izolasyonunu
  vermez; local runtime worker'ları yalnız `sandboxEstablished` EŞDEĞERİ kanıtlanana
  dek düşük-risk sınıfı görevlerde kullanılır (oto-kabul şeridi local'e kapalı, M17).
- **Süreç hijyeni:** kill -9 sonrası öksüz worker → durable registry + boot reconcile
  (A08 deseni) zorunlu; registry dosyası ledger'ın PARÇASI değildir (Y1: tek defter).
- **Provider CLI sürüm sürünmesi:** CLI'lar arası çıktı formatı farkı → evaluator
  protokolü gibi dar bir parse protokolü; kanıtsız parse "bilinmiyor" sayılır (Y5).

## Reddedilen alternatifler
- Paseo'yu tamamen terk: multi-runtime kanıtı ve worktree/posta altyapısı bedavaya
  kazanılmıştı; terk etmek operasyonel gerileme.
- İki ayrı build (paseo-only + standalone fork): Y1 ihlali, defter çatallaması.
- Plugin-panel yolu: ADR-011 §6 redri geçerli.

## Etkilenen belgeler
`ordu-v3/00-master.md` §4–§5 · `20-uzaktan.md` §2/§9 · `40-kabul.md` (V3-RT satırları) ·
`kabul.csv` · `delivery/CODE-BUDGET.md` (tavan notu) · `ordu-core` (local-runtime adapter).
