# ARAYÜZ İDEAL MOCKUP — GEREKSİNİM MATRİSİ (6-subagent çalışması SSOT'u)

**Tarih:** 2026-10-29 · **Tür:** MOCKUP ÇALIŞMASI — ürün kodu DEĞİL, emir sınıfı değil (kullanıcı: «bunları emir sayma, sadece bir çalışma, sen kendi derin analizini yap») · **Operatör/Komutan:** ana oturum · **Ekip:** 3 varyant yazarı (paralel) + 1 denetçi + 1 gözlemci + 1 cilacı = 6.

## 1. Kaynak beyanlar (kullanıcı, kronolojik)

1. «görev graf ve çalışan ordunun izleme denetleme arayüzü lazım» (2026-10-29)
2. «ilk önce arayüzü düzelteceğiz — responsive touch uyumlu clean net kullanıcı arayüzü» (2026-10-29)
3. «arayüz istediğim gibi değil halen eski arayüz» (DALGA-0 cerrahi sonucuna, 2026-10-29)
4. **EN GÜNCEL — Temel 1:** «arayüz İKİ TEMEL üstüne inşa edilemli: 1) planın satırlar ile atomize görev grafı olarak kapsüllenmesi SOLDA ve tıklayınca detayların SAĞDA gözükmesi; görev grafını izle denetle yönet… aktif olanlar, mevcut durum, onay bekleyenler, GENEL STATE ayrıca belirtilmeli» (2026-10-29)
5. Temel 2 beyanı henüz gelmedi — **VARSAYIM:** çalışan ordu / manager döngüsü izleme yüzü (sacayağı II). Yanlışsa komutan matrisi düzeltir.
6. Onay kutusu seçimleri: görsel kimlik yenile · ordu izleme paneli (D-2) · graf okunur · DALGA-1 ölçüm görünümü.

## 2. Sacayağı eşlemesi (ANAYASA §6, K-0054)

| Yüz | Sacayak | Mockupta karşılığı |
|---|---|---|
| Temel 1 — görev grafı | I (ÇERÇEVE) | SOL sütun: atomize görev satırları (faz gruplu) → tıkla → SAĞ detay |
| Temel 2 (varsayım) — ordu/manager | II (KALP) | Ordu şeridi + run kartları + onay kuyruğu + kanıt defteri + komut kutusu |
| Genel state | ikisinin üstü | Üst özet şerit: toplam görev · aktif · durum dağılımı · onay sayısı · x=0 · HEAD |

## 3. ZORUNLU yapı (her varyantta olmalı — matrisin çekirdeği)

1. **SOL GRAF SÜTUNU:** plan satırlarından atomize görev listesi; faz grupları (DC, F0..F4, «(faz yok)» — gerçek graf SSOT adlarıyla); her satır: durum noktası + görev ID + kısa ad; satır tıklanınca sağ detay açılır ve seçim görünür kalır; satır ≥44px.
2. **SAĞ DETAY PANELİ:** seçilen görevin kapsül kartı — ad, faz, durum, bağımlılıklar, atanan ajan (örnek), son kanıt (hash + tarih), varsa [insan] onay gereksinimi + kopyala butonu.
3. **DURUM BOYUTLARI (kullanıcının 4 boyutu — dördü de görünür):** aktif olanlar (canlı vurgu) · mevcut durum (her satırda renk + nokta) · onay bekleyenler (ayrı görünür bölüm) · **genel state** (üst özet şerit).
4. **KALP YÜZÜ (Temel 2):** ordu şeridi (KOMUTAN + 3 YAZARI + DENETÇİ + GÖZLEMCİ — rol adı + durum) · en az 2 run kartı (iş, durum, ilerleme, ölçüm satırı) · kanıt defteri akışı (örnek satırlar) · komut kutusu (öneri + kopyala).
5. **İZLE / DENETLE / YÖNET edimleri TEK görünümde bağlamsal (R1 revizyonu, kullanıcı 2026-10-29: «izle denetle yönet diye ayrı ayrı buton yapmak nedir? daha user dostu»):** ayrı sekme/mod BUTONU YASAK. İzleme yüzü her zaman görünür (GENEL STATE şeridi + ordu şeridi + run kartları + akan defter); denetim kanıtı bağlamda inline (seçili görev kapsül kartının içinde kanıt/ölçüm satırları, kanal x=0); yönetim eylemi bağlamda (görev kartında fiş/komut üret butonları, onay kartında kopyala, alt komut kutusu). Mod değiştirme YOK — gezinme yalnız scroll + drawer.

## 4. Kalite kuralları (ölçülebilir — gözlemci kaynakta sayar)

- Tek HTML dosyası; **0 dış istek** (http script/link YASAK); 0 framework; sistem font stack; `file://` açılır.
- Dokunma hedefleri ≥44px (CSS'te `--min-dokunma:44px` + fiilen kullanım).
- Kırılımlar: <640px tek kolon; ≥640 / ≥1024 çoklu kolon.
- Animasyon yalnız transform/opacity; `prefers-reduced-motion` kapatması.
- `focus-visible`; aria (log/status rolleri); `tabular-nums` sayılar.
- **Emoji YOK** (● ▸ ⧉ gibi tipografik semboller serbest).

## 5. Dürüstlük kuralları

- Üstte kalın **ÖRNEK-VERİ şeridi** (sarı) — canlıya bağlanmaz.
- **Ölü buton YOK:** her buton tıklanınca ne yapacağını söyleyen bilgi gösterir.
- **Kopyala GERÇEK çalışır** (navigator.clipboard + execCommand yedeği) — ama onay cümlesi GUI'de üretilmez/çalıştırılmaz, yalnız kopyalanır (EK-2 dokunulmaz).
- Görev ID'leri **GERÇEK** (plans/gorev-grafigi-2026-10-26.json salt-okur okuma; 8-14 görev yeter); durumlar/ölçümler ÖRNEK ve etiketli.

## 6. Varyantlar (yazar vurguları)

- **variant-1-komuta** — mevcut mockup tasarım dili (camgöbeği/menevşe, cam barlar, 48px grid; kaynak: raporlar/pano-mockup-dalga1-2026-10-29/mockup.html, 703 satır) + **Temel 1 eksikliği TAMAMLANIR**: sol graf / sağ detay ana grid; kalp öğeleri üst-alt şeritte.
- **variant-2-harita** — graf-merkezli: solda kompakt ağaç, ortada BÜYÜK okunur DAG tuvali (SVG; zoom/pan etkileşimi), sağda detay; blueprint koyu-mavi estetik.
- **variant-3-sahne** — akış-merkezli: üst ordu şeridi, sol mini graf, merkezde detay + defter birleşik akış; terminal estetiği (amber/yeşil, koyu zemin).

## 7. Değerlendirme eksenleri (denetçi puanlar)

temel-1 uygunluk (sol graf / sağ detay / 4 durum boyutu) · kalp bütünlüğü · okunabilirlik (tipografi, yoğunluk) · mobil davranış · dürüstlük (şerit / ölü buton / kopyala) · görsel his.

## 8. Süreç notu (çalışma disiplini)

Bu ÇALIŞMADIR: ürün koduna dokunulmaz — pano/kapsul-tuval.html, pano/server.js, core/, scripts/ YAZMA YASAĞI. Git commit yok (operatör tek elden, sonda tek commit). Kanıt protokolü/kanal YOK; mockup ölçümü = kaynak-düzeyi sayımlar (gözlemci). Yazarlar yalnız kendi variant dosyasını yazar.
