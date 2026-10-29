# BRIEF-BIRLESIM — K8 birleştirme dalgası · ilk adım fişi (2026-10-29 18:30)

**Sınıf:** KAPI K8 (write-model yönetim arayüzü) · **Kaynak:** kullanıcı emri «birleştir» (öncesinde: «önceki panel pano yönetim ekranı ne oldu … öncekini nereye kaybettin» — iki panel ayrımı kanıtla açıklandı: ANA kapsul-tuval 4377 HİÇ kaybolmadı, HTTP 200; deney 4930 K10 ile izole kuruldu).
**Çerçeve:** [kararlar/K-0055.md](../../kararlar/K-0055.md) — PANO_TOKEN + sınırlı write-set + onay yüzü aktör `insan:web` + çifte kayıt (K8 tanımı) + R5 korunur.

## İlk adım (KAPANDI — bu fişin konusu)

Deney paneli ordu GRAF SSOT'ya bağlandı: `pano/deney-server.mjs` `plans/gorev-grafigi-2026-10-26.json`'ı SALT-OKUR okur → `durum.graf` {grafSurumu v14 · gorevSayisi 40 · kapaliSayisi 9 · görev alanları}; `pano/deney-panel.html` `renderSolGraf` SSOT varsa ordu grafiğini çizer (topolojik sıra + bağımlılık okları). Restart YOK (panel diskten okunur). DOM kanıtı: grafDugum 40 · grafOk 39 · GÖREV 40 · KAPALI 9 · etiket ORDU GRAF SSOT v14 (vv14 kozmetiği düzeltildi) · hata rozeti kapalı. Ekran: ekran-panel-birlesim.png (öncesi) + ekran-panel-birlesim-r2.png (151 089 bayt, sonrası). `pano/server.js` DOKUNULMADI.

## Kalan bölümler (sıradaki fişler — K8 devamı)

1. **B1 AI CHAT plan yüzü:** deney chat + manager köprüsünün (müdahale.jsonl + manager-kuyruk.jsonl + Monitor 2 sn + paseo MCP send_agent_prompt + POST manager-yanit + 5 sn çekme) ana tuvale taşınması; kalıcı köprünün servis/websocket'e dönüştürülmesi (K8'de).
2. **B2 rol yönetimi:** ROLLER/ MD+JSON çifte kayıt deseninin ana panel ön yüzünden editlenmesi (deney-g9-repo'da provası yapıldı: manager/coder/tester).
3. **B3 ayarlar:** dizin/istek/ratelimit; anahtar DEĞERLERİ ekrana YAZILMAZ (K-0044).
4. **B4 onay yüzü:** aktör `insan:web` + PANO_TOKEN (K-0055 §1-2).
5. **server.js POST write-model:** K-0055'teki 6 maddelik çerçeve; ilk commit'ten önce fişin kabul ölçütü olur.
6. **B5-B7 mevcut tuval + graf yazma:** graf SSOT `/api/graf/yaz` (D-3) append-only.
7. **API test + atama TASLAK yüzleri:** deneyde kanıtlandılar (sahte sağlayıcı 400 RED; TANIM kaydı) — taşınma aynı desenle.

## Süreçler (commit anındaki durum)

- deney sunucusu 4930 AYAKTA (background b6ii90v3o; kapatma ayrı kullanıcı kararı).
- Monitor kuyruk izleme b89t6x53p (30 dk — süre dolarsa re-arm).
- manager deney-manager-g9 (bfda53a3-8e52-4c47-922c-337dfbdf7cca, glm-5.3, idle) — ajanlar.json'da kayıtlı.
- bayat ajan 074a43f kullanıcıda (dokunulmaz).

**Kanıt zinciri:** log.jsonl 34 satır (emir + revizyon kayıtları 18:30:03) · DOM dumanı · 2 ekran PNG · KAPI K8 satırı · K-0055 · STATE 18:30 damgası.
