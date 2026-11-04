# TRANSCRIPT-CANLI DALGASI KAPANIŞI — kurmay yanıtları panele otomatik akar

Tarih: 2026-11-04 18:42 · dalga: TRANSCRIPT-CANLI (UI-only, restart'sız) · kapanış: tam kapı 260/260

## Teşhis (ölçümle — operatör 5 emri)

Operatör: «senin verdiğim bu yanıtları panoda göremiyorum» / «ordu sekmesinde bu senin yanıtların bana gelmiyor» / «sadece benim yanıtlarım sana düşüyor» / «neden yanıtların ordu paneline gelmiyor» / «ordu panelinden sadece kurmaya emir verebiliyorum kurmayın yanıtları gelmiyor panele».

1. **API çalışıyor (ölçüldü):** GET `/api/ordu/konusma?ajan=8cc610a4…` = 18 balon, son 8'i güncel KURMAY yanıtları — uçtan-uca sağlam.
2. **Sorun UI'deydi:** transcript yalnız konuşma tıklamasında/açılışta yükleniyordu; 30 sn yenileme döngüsü (hepsiniYukle) kadro/projeler/graf'ı tazeliyor, transcript'i tazelemiyordu → yanıtlar ancak konuşmayı yeniden tıklayınca görünüyordu.

## Çözüm — sessiz tazeleme (pano/ordu-panosu.html)

**Yeni `transcriptTazele` (async):** seçili konuşmanın transcriptini 30 sn döngüsüyle tazeler.

- **Sessiz:** 'yükleniyor' satırı YOK (liste titremez); ağ hatasında **ESKİ balonlar KALIR** — kendi catch'i yutar, yoklama turu KIRILMAZ (51v'nin uçuş kilidi/aynı-veri-atlama ayakları aynen korunur).
- **Guard:** seçim yoksa / transcript hiç yüklenmemişse dokunmaz (return — açılış kilidi + tıklama yolu değişmez).
- **TAM balon dürüstlüğü:** devamı düğmesiyle TAM açılmış balon tazelende tavana döner (veri taze — dürüst; devamı yine tıklanır).

**Kanca:** `hepsiniYukle` Promise.all dizisi 3 → 4 uç: `await Promise.all([kadroYukle(), projelerYukle(), grafYukle(), transcriptTazele()])` — gizli sekme atlaması, uçuş kilidi, anında dönüş (visibilitychange) TRANSCRIPT-CANLI'yı da kapsar.

**Yeni state YOK** (salt-okur GET; POST /api/mesaj deftere yazma davranışı değişmedi).

## Kanıt

- **Tam kapı: `node --test pano/*.test.mjs pano/d1a-test.mjs pano/d1b-test.mjs scripts/*.test.mjs` = 260 tests / 260 pass / 0 fail / EXIT=0** (test sayısı 260 sabit — yeni pinler 51r/51v içine gömüldü: kaynak pini [async transcriptTazele + 4'lü Promise.all + return guard + sessiz catch] + VM 3 senaryo [taze yanıt render + SESSİZ; ağ hatası eski balonlar KALIR referans eşitliğiyle; seçim yok → fetch YOK] + cek-sayısı 3 pini [ilk yükleme + devamı açma + canlı tazeleme] + 51v VM'ye sayaçlı stub [transcriptTazele fetch YOK]).
- **Servis:** GET 127.0.0.1:4937/ordu **HTTP 200 · 150.388** — `async function transcriptTazele(` + 4'lü Promise.all **serviste** (server.js DEĞİŞMEDİ → **restart YOK, sayfa reload yeterli**).
- Durust eksik: canlı DOM/PNG YAPILAMADI (browser automation host bağlı değil — VM + izole uç testleriyle ölçüldü; host dönerse eklenebilir).
- **LOC: 11.432 → 11.477 (+45; doluluk %63,6 — tavan 18.000'e bol nefes).**

## Operatöre kullanım

Kurmay yanıtları artık **30 sn içinde otomatik** panele akar — konuşmayı yeniden tıklamak gerekmez. Sayfayı bir kez yenile (F5) yeterli; sunucu dokunulmadı.

## Bekleyen (operatör onaylı sıra)

- SIRADA: **COMPOSER** (hedef seçici KALDIR — yalnız KURMAY ve MANAGER iki mod + izolasyon SSOT: «her proje izoledir ve her proje altındaki her oturum birbirinden izoledir … kurmay farklıdır») → K-0065 Dalga B (yeni oturum) → M2/rename.
- K7 push (birikim 69 → bu committe 70).
