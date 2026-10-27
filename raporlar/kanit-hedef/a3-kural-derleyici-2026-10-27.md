# A3 KAPALI — DENEYİM→KURAL DERLEYİCİSİ (kanıt raporu)

Dalga: A3 kod dalgası (graf v9 kritik yol ucu; `bagimli: A2`). Tetikleyici: [insan] "6 subagent ata" kuyruğunun 2. maddesi ("A3 başla — kritik yol ucu (deneyim→kural derleyicisi; açılışta 3 [insan] kararı sorulacak)"). Açılış kararları `kararlar/K-0051.md` (3 karar, ONAYLANDI — dalga açılışında, üretimden önce).

## Kanal (kanıt üçlemesi)

| Alan | Değer (son-kanit.json'dan birebir) |
|---|---|
| d | 2026-10-27T09:43:17.0929164+03:00 |
| h | bbbd393 |
| x | **0** |
| test | a3-kural-derleyici |
| sureSn | 86 |

Koşum: **409 test / 409 geç / 0 kırmızı** (tam süit; B6+B7 testleriyle 407→409). Koşum öncesi DOĞRUDAN yük ölçümü: **%73, vitest süreci 0** (kullanıcının YapaySite dalgası bitmişti; kalan yük baseline kaynaklı — node 16000 dsh-tauri, Paseo ailesi, tarayıcılar; A2 kanalı da %73 yükte geçmişti). sureSn=86: yük %73'e inince süit doğal hızına döndü (önceki koşumlar 176-404 sn — DERSLER A3 dersi (1)'in doğrulanması). Yük-duyarlı izleyici 45 dk boyunca 3×<60 penceresi bulamadan dolunca kanal doğrudan koşuldu (izleyici kaydı: görev bp8wkcz7i, 08:56-09:41). Log: `raporlar/kanit-hedef/test-a3-kural-derleyici.log` (Tee, koşumun kendisi).

## Ne kuruldu

1. **core/src/kural.ts (338 satır)** — DERSLER ayrıştırıcı (madde/alt-ders ayrımı; MADDE_ONEKI soyma), aday üretimi (kaynak-satır çapasıyla; hariç tutma `DERSLER_DEGISMEZ` havuzu), kural havuzu + sayaç paritesi (saglik §5b ikizi `KURAL_SAYAC_DOSYALARI`), taslak (KURAL_PARTI_UST=5; `parti-ust` RED), sentez kaydı (aktör `ajan:llm` — onay DEĞİL, replay'de son-kazanır), **[insan] onay kapısı** (`KURALLARI ONAYLIYORUM` onay metni; aktör `insan:cli`; EK-2: ajan/proxy ADIYLA RED), AGENTS.md inişi (tmp+fsync+rename; MD satır sonu korunur; B4 hibrit gövde-tarihi), tavan 80 kilidi, kural.jsonl defter kayıtları. **B6 provenans çapası** (üretim bulgusu): inen satır `(A3 K-0051; kaynak DERSLER satır N; ham <16hex>)` eki taşır; dedup İKİ sinyalli — anahtar-hash birebir VEYA ham-öneki `startsWith`; satır-numarası yalnız capsız legacy satırlar için yedek. **B7 eş-taslak idempotansı** (üretim bulgusu): aynı aday-anahtar kümesine onaysız taslak VARSA yenisi doğmaz (`mevcut: true`).
2. **core/src/defter.ts (43 satır)** — jsonlYukle (son-satır onarımı) + jsonlEkle (fsync) yardımcıları; kural.jsonl'in tek yazım yolu.
3. **core/src/cli.ts kural bölümü (95 satır)** — `kural` komutu: ölçüm (tarama+taslak+onayKomutu önerisi) / `--sentez <taslakId> --aday <on-ek> --metin` / `--onay <taslakId> --confirm "KURALLARI ONAYLIYORUM"`; kullanım satırına eklendi. `--hedef` flag'i YOK (K-0051 karar 1 + denetçi B2: havuz-dışı hedef tavanı körletirdi).
4. **core/test/a3-kural.test.ts (392 satır / 20 hermetik test)** — temp fixture; gerçek repo DERSLER/AGENTS.md DOKUNULMAZ (ayrıca doğrulanır). Kapsam: ayrıştırma, hariç tutma, sayaç paritesi, tavan RED, parti üst RED, onay metni/aktör RED'leri, iniş idempotansı, sentez replay, **B6 provenans** (iniş-sonrası aday 0 + elle ikinci taslak bayat-taslak RED), **B7 eş-taslak** (kayıt doğmaz, `mevcut: true`; kısmi küme eşleşmez; onaylı taslak eşleşmez).
5. **kararlar/K-0051.md** — 3 karar (hedef AGENTS.md / parti ≤5 / sentez CLI+ajan turu) + sonuç: ilk uygulama krl-d75544aa.
6. **core/data/kural.jsonl (8 kayıt, üretim defteri)** — tarama(sayaç 74, 05:06:52Z) → taslak krl-d75544aa → sentez×3 (05:08Z, ajan:llm) → onay (05:43:06Z, insan:cli, uygulanan 3, yeniSayac 77, sentezsiz 0) → tarama(sayaç 77, 06:31:32Z; B6-sonrası doğrulama; aday 3'ü çakışan düştü) → taslak krl-b0cb1576 (pending, [insan] onayı bekler).
7. **AGENTS.md** — 3 kural inişi (PowerShell 5.1 tuzakları: here-string kapanışı / Remove-Item→Move-Item / çift tırnak $ genişletmesi), her satır `(A3 K-0051; kaynak DERSLER satır 3/4/5; ham <16hex>)` provenans çapasıyla.

## Ölçüt karşılaması (graf A3 düğümü)

- "ders→aday→kural havuzu" — ✓: DERSLER 177 madde/210 alt-ders tarama (t) → 3 aday (ilk parti) → taslak → sentez → [insan] onay → AGENTS.md inişi → sayaç 74→77.
- "tavan 80 kilidi" — ✓: onay-anı tavan denetimi (77+3=80 ≤ 80; aşarsa RED); sayaç havuzu saglik ikiziyle aynı kaynak.
- "+90 test (T)" — plan değeri; **gerçek (R): 392 satır / 20 test** — denetçi B1-B5 bulguları + üretimde yakalanan B6/B7 kusurları her biri kendi testini doğurdu; plan-üstü hacim dürüst kayda geçer.

## Sayaç paritesi (üretim, (R))

| An | Sayaç | Kayıt |
|---|---|---|
| İlk tarama 05:06:52.378Z | 74 | kural.jsonl #1 (icerikHash 723e8f47…) |
| Onay 05:43:06.148Z | 74→**77** | kural.jsonl #6 (insan:cli; uygulanan 3; sentezsiz 0) |
| B6/B7-sonrası tarama 06:31:32.520Z | **77** | kural.jsonl #7 (aday 3 → 3'ü çakışan DÜŞTÜ — B6 çalışıyor) |

Onay metni: `KURALLARI ONAYLIYORUM` (B01 sürtünme deseni). Onay [insan] terminalinden: kullanıcı dalga içinde "Onayla — 3 kural iner" yanıtıyla toplu onayı verdi; aktör `insan:cli` (EK-2 uyumlu — ajan/proxy adına onay YOK).

## Denetçi dalgası (DÜZELT-İLE-DEVAM hükmü)

Bağımsız denetçi (paralel ajan) kod-dalga incelemesinde 5 bulgu (B1-B5): B1 çift-uygulama kilidi (onay-anı dedup deliği), B2 `--hedef` flag kaldırılması (havuz-dışı hedef tavan körleşmesi), B3 REHBER 5 alternatif-ifade kaçırmaları, B4 hibrit gövde-tarihi (tarihsiz ders girdisi inişte tarihle damgalanmıyordu), B5 ölü import. Hüküm: **DÜZELT-İLE-DEVAM** — 5 düzeltme düştü, hermetik süit 20/20 yeşil (bağımsız koşum).

## Üretim bulguları — B6/B7 (kanal öncesi, (R), bu dalga içinde bulundu ve kapatıldı)

- **B6 (iniş-dedup deliği):** anahtar HAM DERSLER metninden hashlenir ama onayla inen satır SENTEZ metnidir → anahtar-hash asla eşleşemez; onay-sonrası ölçüm aday=3, dusen=0 döndü (çift iniş riski; tavan 80>80 false ile ZAPT EDİLMİYORDU). İlk yama (provenans ekini soyma kümesine almak) YETERSİZDİ — kök daha derindeydi. Kök kapatma: inen satır `; ham <16hex>` çapası taşır (yukarıda). Üretim doğrulaması: onay-sonrası ölçüm 3 adayı `çakışan` sebepbilgisiyle düşürdü; elle ikinci taslak `bayat-taslak` RED.
- **B7 (ölçüm-yüzü spam):** her ölçüm koşumu aynı adaylar için YENİ taslak kaydı doğuruyordu (doğrulama koşularım 2 çöp kayıt bıraktı). Kök kapatma: eş-taslak imzası. Üretim doğrulaması: ikinci aynı ölçüm `mevcut: true` döndü, kayıt sayısı değişmedi.

## Dürüst notlar

- **(a) kural.jsonl 9→6 temizlik:** B6/B7 üretim doğrulamalarım (onay-ÖNCESİ koşular) deftere 2 çöp taslak (krl-689ef505, krl-f8345187) + 1 tarama düşürmüştü; bunlar ÜRETİM eylemi değil benim hata-ayırt etme koşularımın kalıntısıydı — commit öncesi silindi (temizlik kanıtı bu rapor; append-only ilkesi üretim kayıtlarına dokunulmadığını kaydeder). B7 düzeltmesinden SONRA koşulan 2 kayıt (#7 tarama + #8 krl-b0cb1576) üretim-dürüsttür ve kalır.
- **(b) kanal 4-koşum geçmişi (koşum ortamı flake sınıfı, A3-İLİŞKİSİZ):** run1 08:01 x=1 (denetçi ajanının eşzamanlı süitiyle çakışma — 4 kırmızı); run2 08:19 x=1 (benchmark-canli 2000ms çocuk bütçesi, baseline yük); run3 08:47 x=1 (5 kırmızı: f3-crash×2/lessons-canli/m16-canli — CPU %96-100, kullanıcının YapaySite vitest ×10 tinypool dalgası); run4 bu raporun kanal satırı. Hiçbir kırmızı A3 kodundan değil (A3 testleri her koşumda yeşil). Koşum öncesi makine yükü DOĞRUDAN ölçüldü (Win32_Processor.LoadPercentage + Win32_Process komut satırı) — yük-kaynağı yanılsaması dersi DERSLER A3 girdisi (1).
- **(c) pending taslak krl-b0cb1576:** sonraki 3 aday (sayaç 77 → 80 ≤ tavan 80). **[insan] onayı bekler — EK-2: bu oturum/ajan onaylamaz.** Onay komutu: `node src/cli.ts kural --onay krl-b0cb1576 --confirm "KURALLARI ONAYLIYORUM"` (core/ dizininden).
- **(d) LOC dürüstlüğü:** plan (T) loc 275 / testLoc 90; **gerçek (R) 476 kod (kural 338 + defter 43 + cli bölümü 95) / 392 test satırı (20 test)** — denetçi + üretim bulguları hacmi büyüttü.
- **(e) A3 dersi DERSLER'e işlendi:** "Üç ders birden" girdisi (kanal flake/yük-ölçüm + B6 provenans-çapası + B7 eş-taslak idempotansı).
- **(f) kapsam:** yeni dosya + ince kanca kuralına uyumlu — 2 yeni dosya (kural.ts, defter.ts) + 1 test dosyası; cli.ts/AGENTS.md mevcut dosyaya ≤3 dokunuş sınırı içinde.

## Ölçüm

Kod: **476 satır** (kural.ts 338 + defter.ts 43 + cli.ts kural bölümü 95) · Test: **392 satır / 20 test** (a3-kural.test.ts, hermetik).

## Sıradaki

- **A4** (bağımlılık A3 + A0-3 — graf v10'da sonraki kritik yol).
- pending krl-b0cb1576 [insan] onayı (yukarıdaki komut).
- A2 [insan] eşik onayı (gözlemsel) · D-1b ELLE TEST [insan] · K-0044 penceresi.
