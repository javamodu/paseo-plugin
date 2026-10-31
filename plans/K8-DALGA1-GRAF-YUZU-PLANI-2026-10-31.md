# K8 DALGA 1 — GRAF-YÜZÜ YÖNETİMİ (B7/G9 omurga + G1; 2026-10-31)

**Kimlik:** K8-DALGA-1. **Kaynak:** [YÖNETİM ARAYÜZÜ planı](YONETIM-ARAYUZ-PLANI-2026-10-29.md) — KAPI K8 **ONAYLANDI** 2026-10-31 07:20 (kullanıcı seçimi: «graf-yüzü önce»; G9 «kalbin merkezi»). Bu dalga planın G9+G3 omurgasının İLK yarısını kapsar: oku/seç/ata yüzeyi. G3 edit-merkezi + G7 diff arşivi + G8 AI-manager zinciri DALGA 2'de.

## Kapsam — 2 alt adım, TEK yazıcı (ORDU-1)

| Adım | İş | Dosya |
|---|---|---|
| **K8-1a · graf-yüzü OKU/SEÇ** | DAG düğümü tıklanır → **düğüm kartı** (durum · faz · limitler · atama geçmişi — GRAF SSOT'tan, E10 uydurma YASAK) + **atanabilir ajanlar listesi** (rol/yetki/faz uygunluk filtreli — ordu fişlerinden) + **G1: sol panel faz bazlı tamamlanma yüzdesi** (kapalı/toplam düğüm sayısından; SVG ölçek yüzdesi değil) | `pano/kapsul-tuval.html` + `kapsul-tuval.test.mjs` (vaka 37) |
| **K8-1b · atama ZİNCİRİ bağlama** | Düğüm kartından: ajan seç → **TASLAK** (POST /api/atama/taslak — VAR a3bcc27) → onay yüzü (POST /api/atama/onay — VAR) → durum yenile (GET /api/atama/durum — VAR). Graf düzenleme (düğüm/bağ/faz ekle) YALNIZ taslak görünümlü — GRAF SSOT'a yazma bu dalgada YOK (D-3 /api/graf/yaz onay kapısı ayrı) | aynı dosya + test (vaka 38) |

**Sunucu tarafı YENİ YOK** — 3 uç a3bcc27'de üretimde (4377'ye restart [insan] sonrası geçer; 4930 deney-server'da şimdi kanıtlanır). Bu dalga TUVAYL-yüz + test. server.js'e dokunulmaz; 4377 çalışan süreç DOKUNULMAZ (restart [insan] ayrı onay — EK-2).

## Kanıt ölçütleri

1. Test vaka 37 + 38 (kaynak-metin pinleri: düğüm kartı · ajan listesi filtresi · faz yüzdesi GRAF SSOT sayımından · taslak→onay çağrıları · SVG-only % YOK); tam süit 38/38 ×2 bağımsız koşum; graf-yaz 7/7 + graf-yonetim 32/32 bozulmaz.
2. İzole 4930 koşumunda uçtan uca: tuvalden taslak → onay → `plans/atamalar/` çift-kayıt (jsonl+md) satır artışı.
3. Canlı DOM 4377 (html per-request — restart GEREKMEZ): düğüm kartı render · ajan listesi · faz yüzdesi hesap + `#yuzdek` artık faz-yüzdesi.
4. ORDU-3 salt-okur denetim: write-set (yalnız 2 pano dosyası) · insan kapısı · E10/E11 (uydurma % yok) · taslak-onay zinciri spoof'suz.
5. Operator bağımsız doğrulama + tek-elden commit; ajanlar commit ATMAZ.

## Sınırlar

- Tasarım SSOT aynen (R3 kurumsal dil: #0f4c81 · 3 radius token · emoji YASAK · ≥44px · light tema) — K2 görsel kabul kullanıcıda kalır.
- PANO_TOKEN ekrana/log'a YAZILMAZ; 403/401 fail-closed test edilir.
- Emir zinciri: bu plan commit'i → brief ORDU-1 → ORDU-3 denetim → operator doğrulama → kapanış commit'i → [insan] 4930 canlı deneme + K2 görsel kabul + 4377 restart onayı.

**Ölçek tahmini:** ~300–500 LOC (tuval-yüz) + ~40 test iddiası; planın 1500–2500 toplam bütçesinin ilk dilimi.
