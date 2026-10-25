# Kapsül — Final Master Plan v2.0.0
**Teslim türü:** uygulama geliştirme planı + etkileşimli UX demosu + makine sözleşmeleri +
SQL başlangıç şeması + saf domain referans kodu + offline paket testleri.
**Değil:** kurulmuş Paseo eklentisi, tamamlanmış backend, canlı agent benchmark'ı veya production release.
Tasarım: FINAL_DRAFT / HUMAN_APPROVAL_PENDING. Production: NOT_RUN.

## On dakikalık okuma
1. `MASTER-PLAN.md`: tek mimari ve ürün sınırı.
2. `ui/index.html`: tarayıcıda aç; gerçek ajan çalıştırmaz.
3. `docs/01-architecture.md`: modül sınırları ve teknoloji.
4. `docs/03-execution-and-recovery.md`: ilk kodlanacak güvenilir çekirdek.
5. `delivery/BACKLOG.md` ve `AGENTS.md`: kodlayan LLM'in çalışma sırası.

## Paket haritası
- `docs/`: ürün, veri, yürütme, güvenlik, UI, adapter, API, test, benchmark, operasyon.
- `contracts/`: kapalı JSON Schema sözleşmesi, örnekler, olay/durum kayıtları.
- `database/001-initial.sql`: referans migration; gerçek uygulama öncesi review gerekir.
- `reference/`: bağımlılıksız saf domain örnekleri; supervisor/runtime değildir.
- `tests/`: domain ve DB invariant testleri; canlı agent testleri değildir.
- `tools/verify.py`: manifest, örnek sözleşme, domain, SQLite ve paket bütünlüğü.
- `evidence/`: otomatik doğrulama raporu ve kaynak provenance.
- `governance/`: karar listesi, insan onayı ve tasarım/release kilit ayrımı.

## Offline doğrulama
Gereksinim: Python 3.11+ ve Node.js 24 LTS; npm kurulumu veya API anahtarı gerekmez.
`python tools/verify.py`
Çalıştırılan dar sözleşme kontrolü genel JSON Schema validator'ı değildir; production TypeBox/Ajv
kontrolünün ve provider/security testlerinin yerine geçmez.

## Ana fikir
**Hedefi manager'a ver; işi kapsülle kaydet; yetkiyi kod uygulasın; sonucu kanıt kapatsın.**
Günlük kullanım için yalnız Kapsüller ve Kararlar; model deneyi yalnız Laboratuvar.
