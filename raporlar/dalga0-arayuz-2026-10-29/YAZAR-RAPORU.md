# DALGA-0 ARAYÜZ — YAZAR RAPORU (DALGA0-ARAYUZ-1)

**Yazar dalı:** `worktree-agent-aff18cbcaf9d6a7fb` (ayrı worktree/branch — K-0053 dalga hattı; merge/tam-kanal/kapanış OPERATÖRE)
**Tarih:** 2026-10-29 · **Hedef:** `pano/kapsul-tuval.html` → responsive + touch + clean + faz-gruplu sol ağaç

## 1. Değişiklik listesi (gerçek LOC sayımı — `git diff --cached --numstat`)

| Dosya | Durum | Eklendi | Silinen |
|---|---|---|---|
| `pano/kapsul-tuval.html` | düzenlendi | 77 | 36 |
| `pano/kapsul-tuval.test.mjs` | YENİ | 98 | 0 |
| `raporlar/dalga0-arayuz-2026-10-29/YAZAR-RAPORU.md` | YENİ | (bu dosya) | — |

**LOC dürüst notu:** hedef ~250-400'tü; gerçek sayım 77+36 (kod) + 98 (test) = 211. Altında — sebep: KORUNAN çekirdek sözleşmesi (kirmiziYuz, modUygula, sec, kart üretim ucu, yerlesim, 30 sn tazelik) değişikliği cerrahi tutmayı zorunlu kıldı; dolgu LOC yazılmadı. Tahmin değil, ölçüm.

### pano/kapsul-tuval.html

1. **Responsive** — `<meta name="viewport" content="width=device-width, initial-scale=1">` eklendi; `@media (max-width:768px)`: düzen tek sütuna iner, sıra `#sol`(order:1, liste üstte) → `#detay`(order:2, listeyi takip eder) → `#tuvalSarma`(order:3, SVG altta, min 55vh) → `#sag`(order:4); `#orta { display:contents }` içteki panelleri main'in flex ögeleri yapar; geniş görünümde bugünkü yan-yana yerleşim aynen korunur; mobilde gövde 14px, jsonview 12px.
2. **Touch** — `.satir`, `.modlar button`, `#yenile`, `#kartBtn`, `#token` için `min-height:44px`; butonlara `min-width:44px`; `.satir` width:100% (tam genişlik dokunma alanı); tüm eylemler click temelli kalır (hover'a bağımlı davranış yok — test 7 kanıt).
3. **Clean** — tek boşluk ölçeği `--s1..--s6` (4px katları; eski 5/10/14px karışımı kalktı); gri tonları `--cizgi/--metin2/--metin3` tokenlarına indi (#d8dee3/#e3e8ec/#cfd8dc tek çizgi tonunda birleşti); başlık hiyerarşisi netleşti (header b + `#detay h2` 15px, `#sol h3` 11px büyük-harf); koyu tema (header/jsonview) KORUNDU; `#token` inline stili CSS'e taşındı.
4. **Faz-gruplu sol ağaç** — `solYaz` artık görev-başı `faz` alanından grupluyor (DC/F0..F4; verideki ilk görülme sırası); `faz` alanı olmayan görev «(faz yok)» grubunda (en sonda) — uydurma faz ÜRETİLMEDİ; durum bilgisi kaymıyor (satır id rengi DURUMRENK + `title` = tam durum etiketi); `esc()` ile faz başlığı/satır metni HTML kaçışından geçiyor.
5. **Korunan (regresyon testlerle kanıtlı)** — `fetch("/api/graf")` aynen; `kirmiziYuz` fail-closed yüzü; `modUygula` iki-yüz (aynı fetch); `sec(id)` detay tablosu + kartIcerik butonu; 30 sn auto-refresh; `yerlesim` SVG DAG + döngüde-çizilmez; kapsül kartı üretim ucu (`POST /api/kart`) tek karakter değişmedi.

### pano/kapsul-tuval.test.mjs (YENİ)

`node --test`, 8 vaka, tamamı kaynak-düzeyi iddia (HTML dosyasını okur); her vaka ADIYLA kırmızıya düşer (fail-closed). DOM render testi YOK, yeni npm bağımlılığı YOK. Vakalar: viewport meta · media 768 tek sütun + order dizilimi · 44px dokunma kuralları · faz gruplama + «(faz yok)» + eski durum-sırası kaldırıldı + durum rengi kalsın · korunan etiketler (kirmiziYuz/İNSAN OKUR/MAKİNE OKUR/sec/kartBtn) · API sözleşmesi (/api/graf, POST /api/kart, 30 sn, döngü kuralı) · click temelli etkileşim · DOM iskelet id'leri.

## 2. Test koşum çıktısı (kopya — worktree kökünden `node --test pano/kapsul-tuval.test.mjs`)

```
✔ 1- viewport meta mevcut (mobil genislik sabiti) (5.3393ms)
✔ 2- dar ekran (max-width:768px) tek suton: liste ustte, detay listeyi takip eder, tuval altta (0.9935ms)
✔ 3- dokunma hedefleri >= 44x44px (min-height/min-width CSS kurali) (0.721ms)
✔ 4- faz-gruplu sol agac: g.faz okunur + (faz yok) dali; durum rengi satirda kaldi (0.5155ms)
✔ 5- korunan cekirdek etiketleri: kirmiziYuz + iki yuz + sec + kartBtn (0.4214ms)
✔ 6- sozlesme: /api/graf fetch'i + POST /api/kart + 30 sn tazelik + dongude-cizilmez (0.3598ms)
✔ 7- click temelli etkilesim: hover'a bagli eylem YOK (0.4522ms)
✔ 8- DOM iskelet id'leri korunur (sol/orta/tuval/detay/sag/modlar/token) (0.541ms)
ℹ tests 8
ℹ suites 0
ℹ pass 8
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 482.773
```

**Ek doğrulamalar:** inline script bloğu çıkarılıp `node --check` → SCRIPT SYNTAX OK. İzole smoke (kendi örneğim, `PANO_PORT=4879`): `/tuval` 200 (viewport meta + media 768 + «(faz yok)» dali kaynakta), `/api/graf` 200 (40 görev, 16 fazlı — dosyayla uyumlu); süreç durduruldu — ana ağaçtaki 4377 örneğine HİÇ dokunulmadı.

## 3. Dürüst notlar

- **LOC hedefin altında** (üstte sayımlı) — koruma sözleşmesi cerrahi değişiklik zorunlu kıldı; doldurmak için gereksiz satır yazmadım.
- **«(faz yok)» 40 görevden 24'ü** — graf SSOT'da faz alanı yalnız DC görevlerinde var (DC/F0=2, F1=5, F2=3, F3=3, F4=3). Veri salt-okur; uydurma faz üretilmedi. Listede en büyük grup dürüstçe «(faz yok)» olarak görünecek.
- **Görsel/tarayıcı doğrulama yazarın elinde değil:** DOM render testi yasak (yeni bağımlılık) olduğundan iddialar kaynak-düzeyinde; gerçek görsel kabul (dar/touch davranışı) operatörün tarayıcısında yapılmalı.
- **`#kartBtn` 44px'i CSS kuralından gelir:** `sec()` içindeki inline stile (padding 5px 12px) kart üretim ucuna dokunmama kararım gereği girilmedi — 5px, 4px ölçeğinin dışında kalan tek eski değer (dokunma hedefi yine 44px'e tamamlanıyor).
- **`#orta { display:contents }` tekniği** içteki `#detay`'ı `order` ile «listeyi takip eder» konumuna sokmak için gerekliydi; modern tarayıcı gerektirir (2019 öncesi sürümlerde erişilebilirlik hatası biliniyordu — hedef ortam güncel tarayıcılar).
- **Mevcut kilit göstergesi (kilidi andıran karakter) bilgi kaybı olmasın diye korundu** — mevcut davranışın parçası; yeni kod/rapor/testlere emoji eklenmedi.
- **SVG kenar çizgisi tonu (#b0bec5)** eski tonunda kaldı: SVG sunum nitelikleri CSS değişkeni alamaz ve `yerlesim`/`tuvalCiz` koruma altında; riske girilmedi.
- **`.satir` flex-wrap'li:** dar panelde id + metin kendiliğinden alt satıra sarıyor (eski inline davranışın okunur hali).

## 4. Operatöre bırakılanlar

- **Merge:** `worktree-agent-aff18cbcaf9d6a7fb` → main (`--no-ff`; K-0053 §25.5 — merge ANINDA tam kanal + tip kapısı; kırmızıysa `git reset --keep ORIG_HEAD`).
- **CODEMAP üretimi:** worktree kirliliği nedeniyle yazar çalıştırmadı — operatör merge sonrası üretir.
- **Push:** tek elden operatörde (yazar hiç push yapmadı).
- **Kapanış TASLAK'ı** (`scripts/kapanis-taslak.ps1` girdileriyle) + STATE_BOARD damga satırı + işlenme kayıtları (K-0017) — operatör dalganın kapanışında.
- **Görsel kabul:** dar görünüm (≤768px) + dokunma davranışının tarayıcıda elle onayı.
