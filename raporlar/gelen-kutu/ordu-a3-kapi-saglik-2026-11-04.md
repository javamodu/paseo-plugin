# ORDU-A3 KAPI/SAGLIK RAPORU — 2026-11-04 22:56

- Ajan: coder (test/sağlık kapısı analisti; KURMAY direktifi — operatör emri «6 ajan ata ve tüm sorunları gider»)
- Kaynak: paseo-system mesajı 45e4f0e7 (devir zinciri doğrulaması + kapı koşusu görevi)
- Repo durumu: HEAD 792217b (YEREL); kirli: pano/ordu-panosu.html M + pano/ordu-panosu.test.mjs M (eşzamanlı KURMAY M2a dalgası) + F1 kök taşınması artığı 113 D / 125 ??
- Ölçüm saati: 2026-11-04 22:56 (Get-Date ile ölçüldü — tahmin değil)

## 1) TAM KAPI (node --test)

Komut: `node --test pano/*.test.mjs pano/d1a-test.mjs pano/d1b-test.mjs scripts/*.test.mjs`
Sonuç: **266 tests / 265 pass / 1 fail / EXIT=1** (EXIT ayrı komutla ölçüldü — pipeline maskesi yok; süre ~36,2 sn).

Tek kırmızı: `pano/ordu-panosu.test.mjs:2609` — test **51v** (PANEL-ANA-1 FAZ-P EK), kaynak pini **(2)** ayni-veri-atlama.

### Kırmızı ayrıştırma ( dürüst işaret — eşzamanlılık )

Bu kırmızı **KURMAY M2a dalgasının (sağ panel metrik kartı) in-flight kaynak değişimidir; ürün hatası DEĞİL**. Kanıt (kaynak okuma, pano/ordu-panosu.html):

| Pin beklediği | Kaynaktaki gerçek | Fark |
|---|---|---|
| `const SON_YANIT = { kadro: null, projeler: null, graf: null };` | satır 933: `... graf: null, metrik: null }; /* (M2a: metrik) */` | tanım dizesi +`metrik` |
| `if (parmak === SON_YANIT.\w+) return;` × **3** | **4** eşleşme (graf 1233 · **metrik 1316** · projeler 1400 · kadro 2621) | +metrik ayağı |
| `JSON.stringify(yeni.projeler ?? null)` | satır 1399 VAR | eşleşir |
| `olcumAniISO` destructuring | satır 2619 VAR | eşleşir |
| `const parmak = JSON.stringify(yeni);` ×1 | ×1 | eşleşir |

Yani kaynak ÖNDE (M2a metrik ayağını yazdı), test pini GERİDE kaldı — pin güncellemesi KURMAY sorumluluğunda (direktifte açık: «test 51 sınıfı pin güncellemeleri KURMAY sorumluluğunda»).

**Ek teşhis — KURMAY'ın pin (2)'yi düzeltince sıradaki turda patlayacak diğer pinler (kaynaktan okundu):**
- pin (5): `await Promise.all([...kuyrukYukle()])` 5-ayak dizesi — kaynak satır 2653 artık **6 ayak** (`..., metrikYukle()`) → güncellenmeli.
- pin (6): `await cek(UC.\w+)` ×4 — kaynakta artık **×5** (graf 1229 · metrik 1308 · projeler 1394 · kuyruk 1695 · kadro 2615) → güncellenmeli.
- VM `fazpekKos` ctx'inde `metrikYukle` stub YOK — 51v VM gerçek `hepsiniYukle`'i koşar; 6. ayak çözümsüz kalırsa ReferenceError uçuş kilidini sıfırlar (51v'nin kendi dersi — transcriptTazele/kuyrukYukle stub deseni izlenmeli).

Not: node test runner ilk başarısız `ok()`'ta testi keser — pin (3)-(6) ve VM senaryoları bu koşuda hiç işletilmedi; yukarıdaki ek teşhis kaynak okumasıyla (koşumla değil) çıkarıldı, dürüst kayıt.

**ORDU-M2-A1 kaynaklı kırmızı YOK**: `pano/rename-ucu.test.mjs` diskte yok (A1 henüz yazmamış), `pano/server.js` kirli değil (M2a yalnız ordu-panosu.html + test'e dokunmuş). Test sayısı 266 = eski baseline — eşzamanlı ajanlar yeni test dosyası eklemedi.

**scripts/*.test.mjs: kırmızı YOK** (tek fail ordu-panosu.test.mjs'te).

## 2) ps51-kapisi.ps1 (SK-1/S1 mekanik freni)

- Staged mod (parametresiz): `PS51-KAPISI-GECTI: 0 dosya tarandi, desen eslesmesi 0` — EXIT=0 (staged .ps1 yok).
- Açık tarama (`-Yollar` scripts/*.ps1, 12 dosya): **RED 0 · UYARI 4 · EXIT=2** (uyarı sınıfı asla RED olmez — engelleme YOK):
  - scripts/kiyasla.ps1:31, 38 — boruda Format-Table
  - scripts/proje-panosu.ps1:58 — Measure-Object -Line (AGENTS.md'de bilinçli aktif kullanım kayıtlı)
  - scripts/saglik.ps1:157 — boruda Format-Table

## 3) CODEMAP tazelik

İddia: 884 dosya (983615f kapanışında üretildi, üstbilgi `HEAD b8ff5d6`). Doğrulama: codemap.ps1 ile AYNI kurallarla (uzantılar + dışlama regex'i) diskten yeniden sayım = **884 — BİREBİR**. `raporlar/gelen-kutu/`'da son regen'den (21:29) sonra YENİ dosya yok (en yeni gelen-kutu maddesi FAZ-U 14:35 — regen öncesi). Regen sonrası disk değişimi yalnız 2 MODİFİKASYON (ordu-panosu.html, ordu-panosu.test.mjs) — sayı değiştirmez.

**ÖNERİ (regen bu ajan tarafından İŞLETİLMEZ — direktif):** ŞİMDİLİK regen GEREKMEZ. Bu raporun .md'si (yazım anıyla) sayıyı 885 yapar + KURMAY M2a kapanışı kendi dosyalarını ekler — KURMAY'ın Z1 kapanış regen'i (raporlardan SONRA koşar) ikisini de kapsar. Tek geçerli tetik: KURMAY kapanış regen'i.

## 4) SINIR uyumu

- Test koşusu izole: canlı 4937 sunucusuna bağlanan çağrı YOK (testler izole env kullanıyor; kanıt: süit 36 sn'de bitti, ağ çıkışı yok).
- Repo yazımı: YALNIZ bu 2 rapor dosyası (md + json). Pano kod dosyalarına, CODEMAP'a, STATE_BOARD'a dokunulmadı.
- Emoji yok · ölçülen saatler (22:56) · EXIT'ler ayrı komutla ölçüldü.

## Kanıt komutları (tekrarlanabilir)

```
node --test pano/*.test.mjs pano/d1a-test.mjs pano/d1b-test.mjs scripts/*.test.mjs   # 266/265/1, EXIT=1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\ps51-kapisi.ps1           # GECTI, EXIT=0 (staged mod)
powershell ... -File scripts\ps51-kapisi.ps1 -Yollar <12 scripts ps1>                 # 4 UYARI, EXIT=2
grep -n "const SON_YANIT\|parmak === SON_YANIT\|metrikYukle\|await Promise.all" pano/ordu-panosu.html
```


## İşlenme

- 2026-11-04 23:1x — KURMAY: kırmızı 51v DÜZELTİLDİ (teşhis doğruydu: metrik fonksiyon bildirimi fazpekKos diliminde ctx stub'ını ezmiş; çözüm = koşudan sonra stub geri atama — kuyrukYukle deseni). Nihai tam kapı 271/271 EXIT=0. ps51 (RED 0 · 4 UYARI) + CODEMAP 884 birebir bulguları kayda geçti; kapanış regen'i bu dalgada koşuldu.
