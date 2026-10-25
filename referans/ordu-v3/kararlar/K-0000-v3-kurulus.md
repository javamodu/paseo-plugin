# K-0000 — ORDU-V3 kuruluşu ve soy kaydı

Tarih: 2026-10-13 · İsteyen: kullanıcı ("tüm planları incele, en üstün planı
yap; kolay uygulama, kolay edit, uzaktan izleme, kendi kendine öğrenen güçlü
ordu").

## Karar
1. Kullanıcı hükmü önceki "dördüncü plan üretme" talimatını REVIZE eder:
   `ordu-v3/` = TEK ÇALIŞMA PLANI (işletme katmanı). Mimari fork DEĞİLDİR:
   veri/store/protokol otoritesi Final baseline'da kalır (ADR-011 + A35/A36).
2. Soy haritası — nereden ne alındı:
   | Katman | Kaynak | ordu-v3'teki hali |
   |---|---|---|
   | Store/outbox/lease/fence/acceptance | Final docs/03, ACCEPTANCE.csv | 00 §2/§5 (A-ID atıfları) |
   | Zihin modeli (kapsül/koşu/deneme, 5 soru, roller-yetki tablosu) | GPT PLAN §2/§5/§7 | 00 §2/§3, 20 §1 |
   | Benchmark/öğrenme disiplini (eşlenmiş koşu, tam payda, insan kapısı) | GPT §14–15, qwen 07 | 30 tamamı |
   | Headless-first sıra + kanıtlı-test kültürü + karar kaydı hijyeni | qwen 08/09 | 40, README |
   | Kolay-edit yüzeyi (dosya→validator→onay) | qwen M1 ruhu sadeleştirilmiş | 00 §4, V3-EDIT testleri |
   | Eski blueprint (11 sekme, plugin-ömür sahibi) | pano-blueprint | REDDEDİLDİ (Y1/Y2) |
3. qwen klasörü statüsü K-0003'teki gibi kalır (arşiv-disiplin). GPT klasörü
   karşılaştırma raporlarıyla birlikte referanstır.
4. Kilit süreci değişmedi: Final LOCK-AND-RELEASE (verify PASS + operatör
   imzası). ordu-v3 kendi kendine "kilitli" diyemez; faz geçişi 40'taki kanıt
   tablolarıyla olur.

## Açık riskler (dürüst)
- Operatör kullanılabilirlik testi hiç yapılmadı (üç planda da) → V3-S2.2 ilk gerçek test.
- Native Paseo paneli ertelendi; "Paseo içinde composer" şart çıkarsa ayrı ADR+backlog.
- 30-ogrenme ilk kez ÇALIŞIR hat tarif ediyor — örneklem 3 sprintten önce hüküm vermez.
