# BLUEPRINT.MD — paseo-pano (ordu beyni) yapı spec'i

> Sürüm: v1 · 2026-10-13 · Durum: ONAY BEKLER
> Bu dosya TEK OTORİTE: mockup/uygulama yazan ajan önce bunu okur. Kaynaklar: ORDU-PLAN v1.6 (paseo-plugin/plans), DESIGN.md, K-0033 (ikili temsil), köprü: paseo-verimlilik/server/pano.ts. Çelişkide sıra: ANAYASA > bu dosya > DESIGN.md.

## 0. Ajan için okuma kılavuzu

- Mockup istenirse: bu dosyanın TAMAMINI oku → §4 yerleşim + §5 tokenlar + §6 bileşenler + §11 kabul listesi seni ilgilendirir; §7-8 detay için referans.
- Tek HTML dosyası üretirsin (mockup13ekim.html gibi), sıfır bağımlılık, inline CSS+JS. Demo veri AÇIKÇA işaretlenir (sarı "ÖRNEK VERİ" bandı).
- Bitirdi saymadan önce §11 kabul kriterlerinin hepsini ÇALIŞTIR ve kanıtla.

## 1. Amaç

Paseo workspace'inde yeni sekmede açılan, orduya komuta eden hafif kontrol yüzeyi. Kullanıcı composer'a doğal dil emir yazar ("sprint 4-5'i bitir; llm1 coder, llm2 manager; takılırsa bana sor"); manager LLM emri emirler.json'a derler, graf'a düşer, ordu otonom koşar. Pano her şeyin röntgenini çeker + her noktaya manuel müdahale verir.

## 2. Mimari (3 kutu)

```
[pano UI: tek HTML, vanilla]  ←→  [köprü: plugin subprocess, 127.0.0.1:4378]  ←→  [Paseo daemon + repo dosyaları]
   orkestra.html                    GET /api/* · POST /api/emir · SSE            .verimlilik/emirler.json
                                    PANO_TOKEN (fail-closed)                    .verimlilik/spawn-kuyruk.jsonl → sonuc.jsonl
```

- UI köprüden başka hiçbir şeye dokunmaz. Dosya yazma YOK; her yazma POST /api/emir üzerinden.
- Köprü statik dosyaları kendisi servis eder (uiDir), token'ı HTML'e enjekte eder (__PANO_TOKEN__).

## 3. Teknik kısıtlar (kayıtlı karar)

1. Vanilla JS tek dosya; framework/bundler/CDN YOK. React Flow ERTELENDİ (ileri faz; veri modeli değişmez).
2. Modal/dialog YOK — satır içi expand + toast (sağ alt, 4sn).
3. DAG motoru/library YOK — katman görünümü yeterli (K-0033).
4. File manager YOK — Paseo Files var.
5. Sekme değişimi state kaybettirmez; her sekme verisini tembel GET + tek SSE kanalıyla taze tutar.

## 4. Yerleşim (layout) — kesin

```
┌────────────────────────────────────────────────────────────────────┐
│ header 52px: logo · rozetler (daemon/yazma/canlı) · Detay paneli · Tümünü durdur · saat │
├──┬─────────┬──────────────────────────────────────┬───────────────┤
│r │ sol     │ ORTA                                  │ sağ dock      │
│a │ panel   │  ┌──────────────────────────────────┐ │ üst: ikon     │
│i │ (içerik │  │ main: aktif sekme içeriği        │ │ menü: Özet/   │
│l │ dinamik)│  │ (scroll)                         │ │ Chat/Log      │
│6 │         │  ├──────────────────────────────────┤ │               │
│0 │ 264px   │  │ COMPOSER (sabit, 1. kahraman)    │ │ 300px         │
│p │ ±resize │  │                                  │ │ ±resize       │
│x │         │  │                                  │ │               │
└──┴─────────┴──┴──────────────────────────────────┴─┴───────────────┘
```

- Izgara: `grid-template-columns: 60px auto 1fr auto`; gövde yüksekliği `calc(100vh - 52px)`.
- Sol rail (60px): 11 ikon dikey. İkon tıklaması ORTA SAYFAYI DEĞİŞTİRMEZ — yalnız sol panel içeriğini değiştirir. Aktif ikona tekrar tık = paneli kapat/aç.
- Sol panel (264px): başlık + öğe listesi. ÖĞE tıklaması orta sayfayı o bölüme yükler. Sağ kenarında resize tutamacı (7px, col-resize, 180–520px kenetli).
- Orta sütun: flex-column. main scroll'lanır; composer alta SABİT — sekme değişse de, dock'lar kapansa da KALIR.
- Sağ dock (300px): üstte ikon menü (Özet · Chat · Log), içerik altında. Sol kenarında resize tutamacı. Header'daki "Detay paneli" açar/kapatır.

## 5. Tasarım sistemi (token)

```
--bg:#0a0e14 · --kart:#11161f · --kart2:#1a2230 · --sinir:rgba(255,255,255,.06)
--metin:#eceaf4 · --soluk:#9a9aac · --vurgu:#2563eb · --vurgu2:#3b82f6
--yesil:#34d399 · --sari:#fbbf24 · --kirmizi:#f87171 · köşe: 16px (kart) / 8-11px (kontrol)
```

- Font: arayüz system-ui 15px; veri/listeler ui-monospace 12px. Tek satır = tek kayıt.
- Renk = durum: yeşil bitti/sağlıklı · mavi koşuyor · sarı uyarı/drift · kırmızı hata/bloklu · gri bekliyor. Renk TEK BAŞINA anlam taşımaz — yanında metin rozeti zorunlu.
- Karanlık tema tek seçenek; `color-scheme: dark`.
- Boş durum: gri tek satır + nasıl dolacağı ("emirler.json henüz yok — ilk derlemeyi yap").

## 6. Bileşen spec'leri

### 6.1 Header
Rozetler: `daemon bağlı` · `yazma açık` (kapalıysa kırmızı `salt-okur`) · `canlı` (SSE). Sağda: Detay paneli toggle · kırmızı `Tümünü durdur` (long-runner freni, F7) · saat (canlı).

### 6.2 Sol rail + panel
- Rail ikonları (sırayla): orkestra, graf (badge: koşan sayı, mavi), plan, kuyruk, onay (badge: bekleyen, kırmızı), sağlayıcı, izinler, metrik, hedefler, okul, ayarlar.
- Panel içerik eşlemesi: orkestra→ajan listesi · graf→sprint görev listesi · plan→repolar (drift rozeti) · kuyruk→son spawn'lar · onay→bekleyen kararlar · sağlayıcı→provider'lar · izinler→4 eksen özeti · metrik→görünümler · hedefler→hedef listesi · okul→sınavlar · ayarlar→ayar grupları.

### 6.3 COMPOSER — 1. kahraman (en kritik bileşen)
Konum: orta sütun altı, sabit. Görsel öncelik: vurgulu kenar (1px var(--vurgu) + hafif glow), focus'ta 2px vurgu2.
- Üst şerit (kontroller, soldan sağa):
  - `mod` SELECT: fırtına · atölye · ekonomi
  - `model` SELECT: auto · codex/gpt-5.4 · kimi/k3 · zai/glm-4.6 · deepseek
  - `hedef` SELECT: hız · kalite · test · ui
  - `ata` PILL grubu: manager · coder · tester · pitbull (tek seçim)
  - sağ uçta: `otonom` anahtarı (aktif/pasif toggle, default aktif)
- Gövde: çok satırlı metin kutusu (placeholder örnek emir içerir) + sağında 📎 dosya ekle + 🎙 sesli giriş + büyük `Orduya ilet ⏎` butonu. Ctrl+Enter = gönder.
- İpucu satırı (10.5px soluk): `composer → manager llm → emirler.json (checker'dan geçer) → graf'a düşer · pitbull: gözle-yaz-kontrol · plan.md'de insan-okur eşi görünür`.
- Gönderim akışı (gerçekte): POST /api/emir {eylem:"gonder", hedef:"manager"} + chat'e düşer. Mockup'ta: chat sekmesine 2 mesaj append (kullanıcı + manager demo cevabı) — demo olduğu toast'ta yazılır.

### 6.4 Sağ dock — üst ikon menü + 3 sekme
- ÖZET (default): düğüm seçiliyse düğüm detayı (kv: başlık/durum/sahip/detay/bağımlılık); değilse genel özet (aktif ajan, koşan görev, bloklu, bekleyen onay, bugün token, kabul oranı). kv satırları ALT ALTA (display:block — grid çakışması YASAK).
- CHAT: manager ile konuşma şeridi. Balonlar: kullanıcı sağda mavi, manager solda kart2. Alt not: "mesajlar ortadaki composer'dan gönderilir".
- LOG: son köprü olayları (spawn/checker/test satırları), monospace.

## 7. Sekmeler (orta sayfa) — veri kaynağı + satır formatı

| Sekme | Kaynak | Satır/kart | Kontroller |
|---|---|---|---|
| Orkestra | GET /api/ajanlar + SSE | ajan kartı: başlık, durum rozeti, provider/model, cwd, meta | gönder · dürt · arşivle; yeni ajan formu; izin istekleri |
| Graf | emirler.json (SSE) | katman bantları + düğüm kartları; kenarlar SVG | yeniden koş · yeniden ata · dürt · bağla → · iptal; blokluysa "Manager'a sor" |
| Plan | GET /api/plan?repo= | md editörü + görev satırları | Kaydet · Derle · Uygula + drift banner |
| Kuyruk | spawn-kuyruk/sonuc.jsonl | iki kolon: istek ↔ sonuç | — (salt okur liste) |
| Onay | onay kuyruğu (SSE) | soru kartı: bağlam + seçenek butonları + serbest cevap | tür bazlı butonlar (devam/atla/iptal...) |
| Sağlayıcılar | saglayicilar.json | provider kartı: modeller, kapasite, maskeli anahtar, bench | bağlantıyı sına · düzenle · ekle |
| İzinler | izinler.json | 4 eksen kutusu: saat/dizin/kapasite/kural | düz metin editör + checker |
| Metrik | bench + canlı telemetri | tablo: model×iş → hız/kalite/uyum (kaynak sütunu) | — |
| Hedefler | hedefler.json | hedef kartı: ilerleme barı, deney sparkline, durum | dur · iptal (plateau sarı + Onay'a bağlı) |
| Okul | okul/<provider>.json | 5 eksen çubuk (kural/araç/dürüstlük/repo/disiplin) + rozet | sınava sok |
| Ayarlar | ordu.json · kullanici.md | form alanları | kaydet (checker'dan geçer) |

Graf düğüm satırı formatı: `[durum] S4-01 · başlık · →coder-2 · 84k/200k tok · deneme 1/3 · once: S3-07`.

## 8. Veri sözleşmeleri (değişmez — ikili temsil K-0033)

### 8.1 emirler.json (makine çekirdeği, append-kilit)
Konum: `<repo>/.verimlilik/emirler.json`. Tek yazar: plugin server. Görev kaydı:
```json
{ "id":"S4-01", "baslik":"login akışı refactor", "durum":"bekliyor|atanan|kosuyor|testte|bloklu|bitti|iptal",
  "sahip":"agentId|null", "dizin":"src/auth", "kabul":"npm test auth yeşil",
  "bagimlilik":["S3-07"], "deneme":0, "maxDeneme":3,
  "tokenButce":200000, "tokenHarcanan":0, "baslama":null, "bitis":null, "not":"" }
```
### 8.2 plan.md (insan yüzeyi)
`- [ ] S4-02 token yenileme testleri → coder · kabul: 12 test yeşil · once: S4-01` — işaretler: [ ] bekliyor · [~] koşuyor · [x] bitti · [!] bloklu · [-] iptal.
### 8.3 spawn kuyruğu (F2)
Manager `.verimlilik/spawn-kuyruk.jsonl`'e TEK SATIR JSON append eder: `{"tip":"spawn","id":"sp-107","rol":"coder","provider":"kimi/k3","gorevId":"S4-04",...}`. Plugin 5sn poller ile işler → `spawn-sonuc.jsonl`'e `{ok|red, sebep}`. Frenler: max 3 coder / 2 tester / 6 toplam.
### 8.4 Köprü API (127.0.0.1:4378)
| Yöntem | Yol | Açıklama |
|---|---|---|
| GET | /api/durum | köprü sağlığı + rozet verisi |
| GET | /api/ajanlar | ajan kartları (daemon'dan) |
| GET | /api/izinler | bekleyen izin istekleri |
| GET | /api/repolar | PANO_KOKLER altında .verimlilik'li repolar |
| GET | /api/plan?repo= | plan.md + emirler.json + drift bayrağı |
| GET | /api/canli | SSE: ajan/kuyruk/onay itmeleri, 15sn nabız |
| POST | /api/emir | TÜM yazmalar; header `x-pano-token`; eylemler: gonder · yarat · izin · arsivle · plan-kaydet · plan-derle · plan-uygula |

## 9. Davranış kuralları

1. Tek SSE kanalı; sekme filtresi client'ta. Sekme GET'i tembel (ilk açılışta).
2. Salt-okur fail-closed: PANO_TOKEN yoksa yazma kontrolleri disabled + kırmızı rozet; 403'te tek toast, spam yok.
3. Dürüstlük: ölü buton/sahte kart YOK; demo veri sarı bantla işaretli.
4. Yazma sonrası iyimserlik YOK — SSE onayı gelmeden satır güncellenmez.
5. Anahtar/token hiçbir yerde tam görünmez (••••3f2a).

## 10. Kabul kriterleri (ajan bunları ÇALIŞTIRIP kanıtlar)

1. Render: 11 rail ikonu + 11 ekran fonksiyonu hatasız; konsol 0 hata.
2. Rail tıkla → orta sayfa DEĞİŞMEZ, panel değişir; panel öğesi tıkla → orta o bölüme geçer.
3. Composer kalıcılığı: her sekmede + iki dock kapalıyken görünür ve çalışır.
4. Composer kontrolleri: 3 select + 4 pill + otonom toggle + 📎/🎙 mevcut ve state değiştirir.
5. Gönderim: chat sekmesine kullanıcı+manager mesajı düşer; toast 4sn.
6. Resize: iki tutamaç da 180–520px arası sürüklenir; kapat/aç kayıpsız.
7. Graf: katman başlıkları (N görev · M bitti), düğüm tıkla → sağ dock Özet'te kv detay (alt alta).
8. Boş durum ve demo bandı metinleri mevcut.
9. PNG kanıtı: 1600×1000 ekran görüntüsü üretilip sohbete yapıştırılır.

## 11. İleri faz notları (şimdi YAPMA)

- React Flow render katmanı (pan/zoom) — veri modeli aynı kalır.
- Sesli giriş: Web Speech API; dosya ekleme: köprüye upload endpoint'i.
- Graf'ta kenar çizimleri SVG ok + koşan kenarda akış animasyonu.
- Otonom anahtarı gerçekte izinler.json otonom politikasına bağlanır.
