# FERMANLAR — Paseo Verimlilik Sistemi Aktivasyon Emirleri (v2.0, 2026-10-11)

Prensip: daimi emir sohbette tekrarlanmaz — bir kez verilir, dosyaya iner. 1 ve 3 tek kez verilip artefakta dönüşür (sözleşme + ANAYASA); 2 tek seferlik inşa emridir. Plugin kurulduktan sonra 1 numaralı ferman otomatikleşir (agent.create enjeksiyonu).

## Ferman 1 — Geçiş (plugin gelene kadar her yeni ajanın ilk mesajı)

```
Bu projede PASEO-VERIMLILIK-REHBERI-v2.0.md sözleşmesi geçerli.
İlk işin: §9'daki "İlk 15 Dakika" checklist'ini uygula (SSOT oku, git log,
son handoff varsa echo doğrula, CODEMAP kontrolü/yoksa scripts\codemap.ps1,
DERSLER.md, baseline test, ilk damga). Sonra tüm kurallara uy.
Her durum raporunun ilk satırı: bağlam ~%XX.
```

## Ferman 2 — İnşa (paseo-verimlilik plugin'ini yaptırma emri; birleşik planın bekleyen onayı)

```
PASEO-VERIMLILIK-PLANI.md §2 mimarisiyle "paseo-verimlilik"
plugin'ini kur. paseo-plugin skill kalıbını kullan. Kapsam: agent.create
hook'u REHBER v2.0 ÇEKİRDEK + proje L0/L1 işaretçilerini systemPrompt
BAŞINA enjekte etsin (cache dostu sıralama), toplam ≤20KB lint + aktif
kural-sayısı lint'i (<40/>80), mevcut ajanlar için sozlesme.enjekte
RPC'si, Command Center item, tur sayacı + cache-hit + kabul oranı
telemetrisi ilk günden; loop dedektörü (aynı tool+argüman hash'i 3
tekrar → dur) + finish-gate (pass/fail araç exit-code'undan) kapsamda. Doğrulama: typecheck + paseo plugin ls
+ her kancanın canlı denemesi. Canlı sisteme dokunma.
```

## Ferman 3 — ANAYASA (repo başına bir kez)

```
ANAYASA-SABLONU.md'yi köke ANAYASA.md olarak kur; A1-A4, Y, Z
maddelerine mevcut belgelerden TASLAK öner — onayım olmadan doldurma.
```

## Ferman 4 — Bekçi (repo başına bir kez, idempotent)

```
Bu repoda sözleşme bekçisi kuruludur: paseo-verimlilik v0.9+ 15 dakikada bir
saglik.ps1 + zincir-kontrol.ps1 köprüsünü ve repo-agnostik kontrolleri koşturur
(aktif tur varken erteler). Anomali raporlar/takip-sozlesme/<tarih>.md'ye iner
+ ajana tek bildirim düşer (günlük dedupe). Bekçi asla onay vermez, yalnız
raporlar/** yazar. Kaldırmak için: .verimlilik/ayar.json → bekciKapali: true.
```

## Sıra ve bağımlılık

1. Önce Ferman 3 (bu repo dahil her projede bir kez) → ANAYASA.md oluşur.
2. Sonra Ferman 2 (bir kez, plugin reposunda) → plugin kurulur.
3. Plugin yokken Ferman 1 her yeni ajana elle verilir; plugin kurulunca bu adım kendiliğinden kalkar.

v2.0 notu: Ferman 2 kapsamı K-0002 ile genişledi (loop dedektörü + finish-gate + kabul oranı + kural-sayısı lint'i); onay hâlâ kullanıcıda.

