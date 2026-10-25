# K-0004 — Tüm-paket denetimi ve gap kapatma (2026-10-13)

> Numara notu: v3 karar serisi `kararlar/` klasöründedir (K-0000 → K-0004);
> qwen arşivindeki K-0001..0003 numaralarıyla karışmaz — onlar arşiv kimliğidir.

Yetki: kullanıcı emri "tüm planları incele ve kendi eksiklerini kapat".
Kapsam: qwen/, gpt/ (PLAN + MISSION-ACCEPTANCE.csv + karşılaştırma),
kapsul-final-v2.0.0 notio/ (docs 01–12 + delivery + ACCEPTANCE.csv), ordu-v3, ordu-core.

## Denetim bulguları

1. **GPT MISSION-ACCEPTANCE.csv (M01–M19) yeniden okundu.** 13'ü baseline A-kapılarıyla
   (A05–A36) veya ordu-v3 mekanizmalarıyla karşılanıyordu. **6 gerçek gap** çıktı —
   bunlar hiçbir pakette kapılı değildi (grep kanıtı: baseline'da `schedule|cron|
   auto.?accept|reasoning` ancak docs/12'deki "Manager sürekli scheduler DEĞİLDİR"
   uyarısında geçiyor):
   - M08/M09/M10 — zamanlanmış görevler (occurrence benzersizliği, DST, misfire).
   - M17 — dar otomatik kalite-kabul şeridi.
   - M18 — reasoning teslimi makbuz kapısı.
   - M16 ikinci yarı — konak kısıtları (disk/uyku) izleme sinyali.
2. **Baseline docs/06–12 + delivery/BACKLOG.md + TASK-TEMPLATE.md** ordu-v3
   haritasında eksikti (00-master yalnız acceptance+PBP referanslıyordu). İşaret
   bağı eklendi; içerik çatallanması YOK (v3 operasyon katmanı, referans otorite).
3. **Acceptance yalnız markdown'du** — makine-okunur tek defter yoktu.
   `ordu-v3/kabul.csv` eklendi: B/A/M/V3 kimlikleri + faz + durum + kanıt yolu;
   durum takibi artık tek satır komutla diff'lenebilir.

## Kararlar

- **K-0004.1 Zamanlı görevler eklendi (20-uzaktan §6).** Gerekçe: kullanıcının
  "kendi kendine test edip teslim" isteği periyodik iş gerektirir; docs/12 uyarısı
  korunarak scheduler çekirdekte, LLM yalnız çağrıda. Kapı: V3-S4.3.
- **K-0004.2 Oto-kabul şeridi EKLENDİ ama beş-kural-birlikte + varsayılan kapalı
  (20 §7, V3-S4.4).** A14 (insan kabulü) ve merge-insan-onayı DEĞİŞMEDİ: şerit
  yalnız "kalite-accept" durumu taşır. Bu, kullanıcı isteği ile baseline kuralının
  arabuluculuğudur; riski kabul eden tek kişi kullanıcıdır ve tek-dokunuş iptali
  mevcuttur. F3/Y6: güvenlik/kurtarma işleri şeride giremez.
- **K-0004.3 Reasoning makbuzu (30-ogrenme §6, V3-S4.5).** Derin-tier çıktısı
  kaynak/rubrik/belirsizlik makbuzu olmadan DELIVERED olamaz; uydurma atıf oto-
  kabul edilemez. Bekçi örneklem denetimi F1'e tabi.
- **K-0004.4 M04/M07/M16-konak kapıları S2/S3'e yazıldı (V3-S2.4/2.5, V3-S3.3).**
  Güvenlik kanıtunu S3'e ertelememe: A17 ile birlikte S2'de.

## Kapanmayanlar (dürüst liste)

- M03 bundle-detayının evaluator-hash bağlanması baseline docs/02'de tanımlı; v3
  yeniden-uyduturmuyor — S1 canlı koşuda A10/A11 ile kanıtlanacak.
- ordu-core config şemaları (ordu.json/profiller.json/izinler.json) hâlâ S2
  işi; V3-EDIT.1/2 kapıları onu S2 sonuna bağlı tutuyor.
- B02 blocked listesi (worktree/sandbox/structured/usage/cancel) değişmedi —
  canlı worker öncesi düşürülmesi gereken yetenekler; dispatch kodu kapıyla bağlı.
