# ADR-011 — Baseline kabulü + GPT eleştirisinin kapanış listesi

- Durum: **ÖNERİ — insan incelemesi BEKLİYOR.** APPROVAL.json/LOCK.json bu ADR için
  yenilenmedi (LOCK-AND-RELEASE: sessiz manifest yenileme onay değildir).
- Tarih: 2026-10-13 · Kaynak karar: kullanıcı/team-lead hükmü (Güncel plan
  karşılaştırması; Final 88 / GPT 88 / Qwen 69).

## 1. Hüküm (neyi kabul ediyoruz)
- **Final v2.0.0 = TEK TEKNİK BASELINE.** Uygulama bu paketin docs/contracts/backlog
  hattında yürür. Dördüncü bir platform planı ÜRETİLMEZ.
- **GPT v2.1 = eleştiri + ürün yönü katkısı**; kod/iskelet teslimi değildir.
- **Qwen v1.2 = headless-first teslim disiplini + rol/prompt + P0 test kültürü bağışçısı.**
  İkinci bir store/CORE ALINMAZ (qwen JSONL ledger'ı baseline'a taşınmaz; qwen
  klasörü referans/disiplindir, otorite devri bu ADR ile kayda geçer).
- **UI yüzeyi:** D01 zaten kesin — bağımsız yerel web + Paseo-first runtime. Native
  Paseo paneli aynı core protokolüne bağlı İNCE istemci olarak SONRAYA; ilk sprintte
  ikisi birden üretilmez (D08).

## 2. GPT'nin 5 kapanışı → kabul kapıları (ilk gerçek worker'dan ÖNCE zorunlu)
| # | Kapanış | Mevcut ID | Yeni/Değişiklik |
|---|---|---|---|
| K1 | Kullanılan command/event/result payload'ları AYRIK + KAPALI şema | A03, A05, A06 | TypeBox discriminated-union; generic `object` RED |
| K2 | Rezervasyon token/state UPDATE + run-tavanı değişimi testli kapsam | A07 | **+A35** negatif (aşağıda) |
| K3 | Minimum owner/stale-result reddi S1'e | A23 (S3) | **+A36** (S1 minimum fence); tam lease/fence S3'te kalır |
| K4 | receipt→store→domain güven zinciri; evaluator trust worker boolean'ı DEĞİL | A04, A12 | trust, store/relation'dan TÜRETİLİR + projection testi |
| K5 | Tek UI yüzeyi | D01/D08 | karara bağlandı (bk. §1) |

## 3. Bağımsız yeniden-üretilen SQL sınır gözlemleri (K2'nin kanıtı)
RAM-izole SQLite + referans migration ile üretildi (orijinal dosya/ZIP değişmedi):
- ACTIVE rezervasyon `UPDATE tokens=1000` ile run tavanı (100) ÜZERİNE çıkarılabiliyor.
- `UNKNOWN` rezervasyon, global STOP açıkken `UPDATE` ile `ACTIVE` yapılabiliyor.
Yorum: Ekleme (INSERT) kapıları UPDATE yollarını kapsamıyor. Bu, ÇALIŞAN uygulamada
STOP aşıldığı demek değil (çalışan uygulama teslim edilmedi); referans şemanın
eksik mutasyon sınırı. Production repository bu mutasyonları güvenli işlem kapısından
geçirmeli veya yasaklamalı. → **A35** bu iki yolu negatif testler.

## 4. Etki / diff
- ACCEPTANCE.csv'ye 2 satır EKLENDİ (A35, A36; status NOT_RUN). Mevcut ID'ler değişmedi.
- docs/03'e not: A23 çekirdeği (stale-result reddi) S1'e çekildi; geniş fencing S3'te.
- delivery/BACKLOG.md: B02→A35, B05→A36 önkoşul iliştirildi (S1 çıkış kapısı).
- Qwen klasörü: README "TEK OTORİTE" iddiası bu ADR ile platform mimarisi için
  SÜPERSEDİT edildi (qwen/kararlar/K-0003-yon-degisi). P0 test listesi disiplin
  olarak geçerli kalır.
- Kilit: insan operatör onayı + `python tools/verify.py` PASS olmadan LOCK yenilenmez.

## 5. Sonra (takım-lead sırası — değişmedi)
Bir gerçek kapsül uçtan uca: plan→approve→coder→frozen candidate→protected
evaluator→human acceptance; ardından crash/STOP/dedupe ve iki-kapsül paralel testi.
Plan puanı, çalışan ürün başarısıyla KARŞTIRILMAZ.
