# DALGA-0-2 R2 TASARIM REVİZYONU — YAZAR RAPORU (KAPI K2 bacağı)

- **Dalga/rol**: DALGA-0-2 · R2 TASARIM REVİZYONU · YAZAR (K-0053 hattı: yazar ayrı worktree/branch'te; merge'i OPERATÖR yapar)
- **Fiş (tasarım SSOT)**: `raporlar/dalga0-2-arayuz-2026-10-29/BRIEF-R2-TASARIM.md`
- **Branch**: `dalga0-2-r2-tasarim` (yazar worktree `agent-a8c5a6094608ade50`)
- **Taban**: `b6e1d53` (R2 fiş commit'i; R1 merge `dd51987` tarihte)
- **Yazar teslim commit'i (kod)**: `644c616` (644c61674fb097d47b5fe59dd45c386491470c1c) — bu rapor commit'i ayrıdır (hash bu satırda gerçek değeriyle; damga-saati-olculur dersi: tahminle yazılmaz)
- **Kapsam**: 2 düzenlenen dosya (html + test) + bu rapor (yeni) = 3 dosya. `server.js`/graf SSOT/`core/`/`scripts/` YAZILMADI (salt-okur). Yeni bağımlılık YOK.

## Teslim edilen (R2 emrinin 8 maddesi)

1. **LIGHT tema**: zemin `#f4f6f9` · yüzey `#ffffff` · metin `#1a2332` · teal accent `#0e7490`; DURUMRENK light palet; `meta color-scheme light`; kirmiziYuz light paletle korunur (`rgba(255,255,255,0.97)` hata katmanı + `--tehlike:#dc2626`). Eski koyu tokenların tamamı gitti (test vaka-31 sayar).
2. **ÜÇ SÜTUN · TEK VIEWPORT**: üstte tek satır kompakt GENEL STATE (rozetler; `pill b` 18px büyük sayılar) + ordu şeridi; `main` grid `minmax(240px,300px) / minmax(0,1fr) / minmax(320px,400px)`; `body height:100vh + overflow:hidden` — panel-içi `overflow-y` (sekmeGovde/grafKutu/chatListe/sagPanel); `html, body { height:100%; }`.
3. **SOL akordiyon görev ağacı**: fazlar katlanır (akordiyonBas 44px + aria-expanded/aria-controls + fazKimlik geçerli DOM id); katlama durumu `kapanmisFazlar` Set'te — 30 sn tazelemede korunur; sec(id) senkronu + «(faz yok)» + g.faz + uydurma-faz yasağı aynen.
4. **ORTA VS Code tarzı sekmeler**: `sekmeSerit` role=tablist; SABİT sekmeler (Görev haritası DAG · Kanıt defteri · Runlar-onaylar) + görev sekmeleri dinamik (`sek-g-*`; tıkla=seç · × U+00D7 kapat); **#detay PAYLAŞILAN role=tabpanel** — kapsül kartı + DENETİM KANIYI inline aynen; sekme aktivasyonunda rect=0 ölçüm-düzeltmesi (`enBoyDuzelt()+vbUygula()`); viewBox zoom/pan/pinch + setPointerCapture yasağı korunur; haritaKatla/haritaGovde KALDIRILDI; İZLE/DENETLE/YÖNET üst sekmeleri + drawer nav YİNE YOK.
5. **SAĞ büyük AI CHAT (VARSAYILAN) + ikon menü**: ik-chat/ik-ozet/ik-komut (inline SVG, 44px, aria-pressed); `sagPanelAyarla` dinamik değişim (id-toggling; hash/route YOK); CHAT şablon-komut üretici aynen + «ŞABLON — canlı AI yanıtı D-4» etiketi; ÖZET GERÇEK /api/graf verisinden kompakt durum kartı + «canlı AI seçenek paneli K8'de» dürüst etiketi (sahte seçenek ÜRETİLMEZ); KOMUT şablonlar + komut kutusu sağ panele taşındı (EK-2 dokunulmaz).
6. **Büyük yazılar**: body 16px · bolum-etiket 20px · kartId 22px · pill b 18px · ozetDeger b 20px · chatGiris 15px.
7. **Geçişler**: yalnız transform/opacity ≤600ms (E12; @keyframes YOK; rAF fade; prefers-reduced-motion kapatması).
8. **Dar ekran <1024**: sol overlay (hamburger + perde + Esc + `body.drawer-acik overflow:hidden` + aria senkron) · orta tam genişlik · sağ alta (body height:auto/overflow:auto — tek viewport yalnız geniş ekran).

## Ölçümler (yazar koşumları — kayıtlı değerler)

| Ölçüm | Değer |
|---|---|
| Test (node --test) | **33/33 × 2 bağımsız koşum** — 300,2 ms + 358,7 ms |
| Inline script node --check | SCRIPT_SYNTAX_OK (832 satır) |
| core tip | GECTI — hata 0 · bilinen borç 0 · yeni 0 · tsc 0 · 10 178 ms |
| İzole smoke (PANO_PORT=4921) | /tuval HTTP 200 · 114 824 bayt; /api/graf HTTP 200 · **40 görev/15 kenar/v14**; sunucu taskkill /F — port dinleyen YOK |
| CRLF | html 1687 CRLF / 0 LF-only · test 539 / 0 · BOM yok |
| LOC (b6e1d53'e göre) | html +615/−444 · test +191/−61 · **toplam +806/−505** |
| Satır | html 1516 → 1688 · test 409 → 543 |
| Merge-guard | GECTI (staged 2 dosya · yasak-desen 0) |

## Test: 26 → 33 vaka

- **AYNEN korunur**: 1, 3-9, 11-17, 19, 20, 23-25 (eşik gevşetilmedi).
- **R2 emriyle evrilenler** (sebep: tasarım değişikliği zorunlu kıldı; korunan vaka semantiği korundu): 2 (dar ekran 1023 tek kolon + sağ alta) · 10 (SEKME ÖZGÜRLÜĞÜ: ORTA sekmeler tablist/role=tab TAŞIR; İZLE/DENETLE/YÖNET + drawer nav YOK) · 18 (sabit sekme + rect=0 düzeltmesi sekmeAktiflestir'de) · 21 (akordiyonBas/ikonBtn/sekmeKapat 44px) · 22 (R2 sınıf listesi) · 26 (chat SAĞ büyük panelde VARSAYILAN).
- **YENİ 27-33**: üç-sütun tek-viewport + panel-içi kaydırma · sol akordiyon aria + kapanmisFazlar kalıcılığı · orta sekme mekaniği (sec→sekmeAc; kirmiziYuz sekmeleri kapatır) · sağ ikon menü + hash/route YOK · light tokenlar + eski koyu token yok · büyük yazılar · ÖZET dürüst etiketi.

## DÜRÜST NOTLAR (12)

1. **Görsel kabul ELLE kullanıcıda** — DOM render testi yasak (yeni bağımlılık YOK); light temada kirmiziYuz okunurluğu beyaz zeminde gözle görülmeli.
2. Evrilen 6 test vakası (2/10/18/21/22/26) R2 tasarım emrinin zorunlu sonucu — hiçbir eşik gevşetilmedi, korunur vakaların semantiği aynen korundu.
3. Görev sekmeleri `#detay`'ı PAYLAŞIR (VS Code tek-editör modeli) — sekme kapansa da kart içeriği DOM'da kalır (hidden); bayat veri kalmaz çünkü kirmiziYuz/graf-dışı-durum sekmeyi kapatır.
4. Light temada DAG metin/kenar renkleri elle seçildi (`#51617a` ikincil metin, `rgba(26,35,50,.4)` ok ucu) — kontrast ölçümü bu dalgada YAPILMADI (araç yok; görsel kabul elle).
5. sekmeKapat min-width 40 → 44px düzeltildi (E8 ihlaliydi; global button kuralı min-height'i zaten 44 yapıyordu, eksik olan genişlikti).
6. Komut şablonları + komut kutusu SAĞ panele taşındı — R1'in orta akıştaki konumu değişti, içerik/davranış (Enter → panoyaYaz, GUI koşmaz) aynen.
7. `.chatBolum/.defterBolum/.onayBolum/.kartBolumBas` CSS kuralları eklendi — E9 id/class birebirlik (JS şablonlarıyla CSS eşleşmesi) için gerekti.
8. ÖZET panelindeki DURDUR/RESUME pasif bilgi düğmeleri (data-not) — gerçek kill-switch KULLANICI terminalinde; bu dalgada yazma ucuna bağlanmadı (server.js yasağı).
9. Vaka-13 fetch eşleşmesi yine 2 — POST /api/kart çağrısının ilk `)` karakteri 60+ karakter içeride (R1 deseni aynen; regex bilinçli dar).
10. Smoke sunucusu bash `kill` ile ÖLMEDİ — Windows'ta `taskkill /PID` gerekti; port 4921 netstat ile doğrulandı (dinleyen yok). Ana 4377 örneğine DOKUNULMADI.
11. `core/node_modules` worktree'de yoktu — `npm install` (10 paket, 16 sn) yazar koşumunda yapıldı; `package.json`/lockfile DEĞİŞMEDİ (git status temiz).
12. Bu rapor ayrı commit'te gelir — kod commit hash'i (644c616) gerçek değeriyle yazılsın diye (tek commit'te hash commit anında bilinmez; tahminle yazmak damga-saati-olculur dersine aykırı).

## Operatöre devir

- Branch `dalga0-2-r2-tasarim`: `644c616` (kod) + bu rapor commit'i — merge `--no-ff` OPERATÖRDE (K-0053).
- Merge anında beklenen: tam kanal + tip + hedefli (taban 96 sn / h=dd51987 ölçüm çifti karşılaştırması).
- PUSH YOK — push ayrı emir. Bu rapor ve commit'LER YERELDİR.
