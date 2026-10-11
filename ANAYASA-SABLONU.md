# ANAYASA — <proje adı>

> Bu belge <proje> için tüm dokümanların üstündedir. Çelişkide BU BELGE kazanır; evrensel sözleşme (PASEO-VERIMLILIK-REHBERI) bu belgeye tabidir.
> Ajan bu belgeyi değiştiremez; değişiklik önerisi `kararlar/K-XXXX.md` ile açılır, yalnız kullanıcı onaylar.
> Bütçe: ≤60 satır. Manifesto yazılır, DETAY YASAK — detay L0/AGENTS.md'ye gider.

## 1. Hizalama Anahtarları (öncelik sırasıyla — çakışmada üstteki kazanır)

- A1. <örn: Kullanıcı onayı her şeyden önce gelir>
- A2. <örn: Hız > mükemmellik: çalışan yarım çözüm, kusursuz taslaktan üstün>
- A3. <örn: Türkçe arayüz, İngilizce kod>
- A4. <projenin 4. anahtarı>

## 2. SSOT Maddeleri (her konunun TEK doğru kaynağı — başka yerde kopya = hata)

| Konu | Tek doğru kaynak |
|---|---|
| Görev/durum | STATE_BOARD.md |
| Kararlar | kararlar/K-XXXX.md |
| Dersler/araç huyları | DERSLER.md |
| Mimari harita + navigasyon | CODEMAP.md (otomasyon üretir: scripts/codemap — elle düzenlemek YASAK) |
| <projeye özel: örn. fiyatlandırma> | <örn: src/config/pricing.ts> |
| <projeye özel: örn. metinler/copy> | <örn: content/> |

## 3. ASLA (mutlak yasaklar)

- Y1. <örn: Kullanıcının canlı portuna dokunma>
- Y2. <örn: Ücretli API'yi onaysız çağırma>
- Y3. <örn: node_modules/dist içine elle yazma>
- Y4. <projenin yasağı>

## 4. HER ZAMAN (mutlak zorunluluklar)

- Z0. Koda/dokümana dokunmadan önce hedef CODEMAP.md'den seçilir; toplu tarama ('her şeyi oku') YASAK. CODEMAP güncel değilse önce scripts/codemap ile tazelenir.

- Z1. <örn: Her kapanışta tam test süiti yeşil>
- Z2. <örn: Yeni özellik yeni dosyada, mevcut dosya teması ≤3>
- Z3. <örn: Cevaplar Türkçe>
- Z4. <projenin zorunluluğu>

## 5. Çelişki Çözümü

Sıra: ANAYASA > evrensel sözleşme > L0 (AGENTS.md) > diğer dokümanlar > konuşma. Ajan uyuşmazlık görürse DURUR, tek satırla raporlar, tahminle devam etmez.

