# DESIGN.md — paseo-pano UI tasarımı (v1, 2026-10-13)

Amaç: ordu beyni için "hafif ama tam" kontrol yüzeyi. Her şeyin röntgeni çekilir, gereken her yere manuel müdahale edilir. Kaynak: ORDU-PLAN v1.6 menü haritası + K-0033 ikili temsil.

## 0. Tasarım prensipleri

1. Dürüstlük: sahte kart, "yakında" butonu, ölü sekme YOK. Veri yoksa boş durum metni + nasıl dolacağı yazılır.
2. Tek ekran mantığı: sekme değiştirmek state kaybettirmez; her sekme kendi verisini SSE/poll ile taze tutar.
3. Salt-okur varsayılan: PANO_TOKEN yoksa tüm yazma kontrolleri görünür ama disabled + "yazma kapalı (fail-closed)" rozeti.
4. Kod-satırı estetiği: listeler monospace, tek satır = tek kayıt; detay tıklayınca açılır (satır içi expand, modal yok).
5. Renk = durum: yeşil (sağlıklı/bitti) · mavi (koşuyor) · sarı (uyarı/drift) · kırmızı (hata/red) · gri (bekliyor/pasif). Renk asla tek başına anlam taşımaz; yanında metin rozeti olur.
6. 127.0.0.1 tek kullanıcı: auth yok ama yazma token'lı; token HTML'e enjekte (köprü yapar).

## 1. Yerleşim (layout)

```
┌──────────────────────────────────────────────────────┐
│ header: logo · durum rozetleri · dur düğmesi · saat  │
├──────────┬───────────────────────────────────────────┤
│ sol menü │  aktif sekme içeriği                       │
│ (dikey)  │                                           │
└──────────┴───────────────────────────────────────────┘
```

- Header (sabit): köprü/daemon/yazma/SSE rozetleri + genel DUR düğmesi (tüm hedefleri iptal — F7) + son güncelleme saati.
- Sol menü (dikey, dar, icon+metin): Orkestra · Graf · Plan · Kuyruk · Onay · Sağlayıcılar · İzinler · Metrik · Hedefler · Okul · Ayarlar. Aktif sekme vurgulu. Badge: Onay'da bekleyen sayı, Graf'ta koşan sayı.
- Mobil/compact: sol menü üst çubuğa düşer (yatay scroll).

## 2. Sekmeler

### 2.1 Orkestra (VAR)
Ajan ızgarası: kart = ajan (başlık, durum, provider/model, cwd, id, dikkat rozeti). Kartta: prompt input + Gönder · Tazele · Arşivle. Altında "yeni ajan programla" formu + bekleyen izinler (izin ver/reddet).

### 2.2 Graf (EKSIK — en önemli sekme)
Görev topolojisinin tam röntgeni + manuel müdahale merkezi.

- **Katman katman**: topolojik seviyeler yatay bantlar halinde; katman-0 (bağımsız) üstte, bağımlılar altında. Aynı katmandakiler yan yana (paralel koşabilir).
- **Düğüm (satır kartı)**: `[durum] S4-01 · başlık · →coder-2 · 84k/200k tok · deneme 1/3 · 12:04'den beri · worktree: wt-3`
- **Kenar**: bağımlılık çizgileri (once: ilişkisi) — CSS/SVG ok; üzerine gelince bağımlılık vurgulanır.
- **Manuel müdahale** (her düğümde, yazma açıksa):
  - Yeniden koş (durum sıfırlanır, sahip serbest)
  - Yeniden ata (rol/provider değiştir → yeni spawn kuyruğa)
  - Dürt (sahibine "devam et" mesajı)
  - Durdur/iptal (satır iptal, çalışan ajana stop)
  - Kabulü düzenle (kriter metni — plan.md'ye geri yazılır, checker'dan geçer)
- **Katman başlığı**: kaç görev, kaçı bitti, katman toplam token/süre.
- Bloklu görev kırmızı çerçeve + sebep satırı; üstünde "manager'a sor" düğmesi (Onay kutusuna düşer).

### 2.3 Plan (VAR — F1)
md editörü + Kaydet/Derle/Uygula + drift banner + görev satırları. Graf sekmesi gelince burası "editör", Graf "görünüm" olur; ikisi aynı verinin iki yüzü.

### 2.4 Kuyruk (EKSIK)
İki kolon: spawn-kuyruk (istekler) ↔ spawn-sonuc (sonuçlar). Satır: kim istedi (parent), ne istedi (rol/provider/görev), sonuç (ok → agentId / red → sebep). Canlı (SSE). Red sebepleri öğretici: max-paralel, eksik alan, provider yok.

### 2.5 Onay (EKSIK — insan-döngüde kalp)
Manager'ın sana sordukları tek kutuda:
- Kart: soru · bağlam (hangi görev/ajan) · seçenekler (butonlar) · serbest cevap alanı.
- Türler: plateau kararı (devam/değiştir/iptal) · kapsam dışı istek (onayla/reddet) · bütçe aşımı (artır/durdur) · 3. kırmızı test (devam/atla/iptal).
- Cevap → manager'a mesaj olarak gider + karar kaydı gelen-kutu'ya işlenir.
- Badge: bekleyen sayısı sol menüde kırmızı baloncuk.

### 2.6 Sağlayıcılar (F0)
Provider kartları: id, extends, modeller, kapasite tipi, anahtar durumu (maskeli ••••3f2a), son hata, bench skoru. "Ekle" formu (id/extends/baseUrl/modeller/anahtar — anahtar POST-only, asla geri dönmez). "Bağlantıyı sına" butonu.

### 2.7 İzinler (F3)
izinler.json 4 eksen editörü: saat penceresi · dizin allowlist/yasak · kapasite (provider başına tip+tavan) · komut desenleri (izinli/yasaklı). md benzeri düz metin editör + checker (K-0033 hattı burada da).

### 2.8 Metrik (F5)
Doktor prototipinin taşınmışı + yönlendirici matrisi: provider × iş-tipi 3 eksen (hız/kalite/uyum), bench tohumu ve canlı oran ayrı satır. LOC telemetrisi (locDelta/reworkOrani) dahil.

### 2.9 Hedefler (F7)
hedefler listesi: her hedef kart = metrik adı, mevcut→hedef ilerleme çubuğu, son deneyler (mini sparkline), durum (aktif/plateau/ulasildi), dur/iptal düğmesi. Plateau kartı sarı + "karar bekliyor" → Onay'a bağlanır.

### 2.10 Okul (F6)
Provider başına hakimiyet indeksi: 5 eksen çubukları (kural/araç/dürüstlük/repo/disiplin), mezuniyet rozeti, son sınav tarihi + tohum. "Sınava sok" butonu (yeni oturumda).

### 2.11 Ayarlar (EKSIK)
ordu.json (max paralel, managerProvider) · kullanici.md editörü (vekil standardı) · PANO_TOKEN durumu · uiDir. Hepsi checker'dan geçer.

## 3. Veri akışı

```
orkestra.html (vanilla)
  ← SSE /api/canli        : ajanlar + (F2+) kuyruk/onay itmeleri
  ← GET /api/*            : sekme açılışında ilk yükleme
  → POST /api/emir        : tüm yazmalar (fail-closed token)
```

- Sekme başına poll yok; tek SSE kanalı, sekme filtresi client'ta.
- Her sekmenin GET'i tembel: sekme ilk açılışta yüklenir, sonra SSE tazeler.

## 4. Görsel sistem

- Tema: mevcut koyu tema korunur (bg #111418, kart #171b21, kenarlık #262c36, metin #d8dee6, soluk #8b95a3).
- Font: arayüz system-ui; veri/listeler ui-monospace.
- Graf kenarları: SVG, 1.5px, durum rengi; koşan kenar animasyonlu (dashoffset akışı).
- Toast: sağ alt, 4sn, yeşil/kırmızı kenar.
- Boş durum: tek satır gri metin + nasıl dolacağı ("emirler.json henüz yok — ilk derlemeyi yap").

## 5. Güvenlik durum göstergeleri

- Yazma kapalıyken: tüm butonlar disabled + header'da kırmızı "salt-okur" rozeti.
- Her POST yanıtı 403 ise: bir kez toast "PANO_TOKEN tanımlı değil", sonra sessiz (spam yok).
- Hiçbir sekmede anahtar/token tam görünmez (maske).

## 5.5 Render katmanı kararı (2026-10-13)

- Graf sekmesi v1: VANILLA (sıfır bağımlılık, ~350 satır; katman bantları + SVG kenar + tıkla-bağla).
- React Flow: ERTELENDI (ileri faz). Pan/zoom/drag-drop cilası istenirse yalniz render katmani degisir; veri modeli (emirler.json) aynen kalir — ikili temsil sayesinde migration bedeli sifir.

## 6. Yapılmayacaklar (kayıtlı karar)

- File manager YOK — Paseo Files sekmesi var (duplikasyon yok).
- DAG motoru/library YOK — katman görünümü yeterli (K-0033).
- Modal/dialog YOK — satır içi expand + toast.
