# V7 — Kural Sadeleştirme Analiz Paketi (kural-proxy 80 → hedef <40)

Damga: 2026-10-27 10:34 (R — ölçülmüş, yazma anı) · Rol: K-SADE analiz ajanı (salt-okur; tek çıktı dosya çifti: bu md + aynı adlı .json) · İlgi: STATE_BOARD 09:59 damgası ("krl-b0cb1576 ONAYLANDI … sayaç 77→80 = TAVAN DOLDU; derleyici sadeleştirme turuna kadar askıda") · REHBER §2 (kural-sayısı bütçesi: hedef <40, tavan 80) · K-0039 (sadeleştirme emsali) · K-0051 (derleyici sözleşmesi) · hedefler.json (kuralSariEsik 40 / kuralKirmiziEsik 80).

Bu paket ÖNERİDİR — uygulama ayrı dalgadır ve [insan] EK-2 karar turundan sonra gelir. Bu ajan hiçbir maddeyi onaylamaz (EK-2).

## 1. Ölçüm (R) ve ölçüm yöntemi dürüst notu

| Dosya | Sayılan madde satırı |
|---|---|
| ANAYASA.md | 10 (L8-L11, L27-L29, L33-L35) |
| AGENTS.md | 11 (L7-L10, L14, L15-L20) |
| sozlesme/PASEO-VERIMLILIK-REHBERI-v2.1.md | 59 |
| **TOPLAM** | **80** (tavan 80 = DOLU; hedef <40) |

Sayım mantığı: `scripts/saglik.ps1` §5b + `core/src/kural.ts` `kuralSayaci` ikizi — havuz = ANAYASA + AGENTS(+CLAUDE alternatifi) + REHBER(v2.1→v2.0→v1.4 alternatifleri); desen `^\s*(-|\d+\.)\s` (madde satırı; tablo satırları `|` ile başladığından SAYILMAZ, başlık/paragraf sayılmaz).

Ölçüm bu turda `node src/cli.ts kural` İLE KOŞULMADI — görev metnindeki "ölçüm kayıt doğurmaz" önkabulü kodda yanlıştır: `cli.ts:306` ölçüm yüzünde koşulsuz `taramaKaydet` çağrılır (son tarama 77'de kayıtlı; sayaç 80'e değişti → içerik-hash farklı → YENİ tarama kaydı doğar) ve `cli.ts:320` yeni aday-setinde `taslakKaydet` de düşer. `core/data/kural.jsonl`'a dokunmama sınırına saygı için sayaç, §5b'nin okuma-yalnız ikizi bir node betiğiyle (aynı havuz + aynı desen + BOM soyma) ölçüldü; kural.jsonl 9 kayıtta DEĞİŞMEDİ (doğrulandı). Aynı nedenle DERSLER ayrıştırma/aday yüzü de koşulmadı (taslak doğurma riski). Bu sapma bilinçlidir ve ifşadır.

## 2. Kritik yapısal bulgu: sayaç 3 dosyalı havuzdur

"AGENTS.md kural sayacı" deyimi yanıltıcıdır: AGENTS.md sayılan yüzeyin yalnız 11/80'idir. Sayacın 59'u REHBER'de, 10'u ANAYASA'dadır. Sonuçlar:

1. ANAYASA'nın 10 sayılan satırı dokunulmaz sabittir (A1-A4, Y1-Y3, Z0-Z2; "ajan bu belgeyi değiştirmez" — ANAYASA L4) → **sayaç tabanı 10'dur, buradan indirim YOK**.
2. Hedef <40'a ulaşmak AGENTS.md düzenlemesiyle TEK BAŞINA imkânsızdır (11 → 0 olsa bile toplam 69) → **asıl sadeleştirme bölgesi REHBER'dir (59 → ~25)**.
3. A3 derleyicisi kural inişini AGENTS.md'ye yapar (K-0051) — iniş motoru sadeleştirme inişiyle birlikte tavan kilidinden çıkar; sayaç 39-38'e inince parti-üst 5 rejimi + "yeni kural ancak eski kural emekliliğiyle" (§2 L24) rejimi işler.

## 3. Yorumlama çerçevesi (etiketler ve kırmızı çizgiler)

- **BIRLESTIR** — aynı konulu madde satırları tek satırda birleşir; semantik içerik KORUNUR (K-0039 kapanış ölçüsü: "yalnız doğrulayıcı havuzundan onaylı çiftler… semantik içerik korunmuştur").
- **ARSIVLE** — her-zaman-yüklü yüzeyden emeklilik; içerik yeni bir EK dosyasına TAŞINIR (silinmez). REHBER L7'nin kendi mekanizmasıdır ("büyürse ÇEKİRDEK + EKLER diye bölünür") ve §2 L24'ün tanıdığı emeklilik yoludur ("silme veya EK'e taşıma"). EK dosyaları sayaç havuzunda DEĞİLDİR — bu sayaç oyunu değil, REHBER'in kendi "gerektiğinde yüklenen" tanımıdır.
- **KALDIR** — çift-doğru-kaynak (REHBER §4: "koddan türetilebilir bilgi hafızaya girmez"): ANAYASA'da/CODEMAP'te zaten yaşayan kural satırı L0'dan emekli edilir; içerik kaybı YOK (kaynak dosyada durur).
- **KORU** — dokunulmaz (ANAYASA sabitleri, K-0039 KAPALI aileleri: kanıt · kullanıcı-vekaleti · sır hijyeni · append-only · kalite frenleri · meta-kural §2.24) veya dokunulmaya değer bulunmayan satır.
- **Kırmızı çizgi (bu pakette öneri DEĞİL):** madde→tablo/paragraf biçim dönüştürmesi sayacı yanıltma sınıfıdır (proxy körletilir) — yasaktır. İşaretçi paragrafları sayılmaz çünkü navigasyondur, davranış kuralı taşımaz (gerekçe: sayacın ölçtüğü şey davranış-yükleyen madde envanteridir).
- Eşik oynatılmaz: hedefler.json kuralSariEsik 40 / kuralKirmiziEsik 80 aynen kalır (K-0039 madde 2 emsal ret).

## 4. Öneri paketi (34 madde; madde = karar birimi)

Sayaç etkisi: KALDIR −3 · BIRLESTIR −18 · ARSIVLE −20 · KORU 0 → **80 − 41 = 39 (<40 hedefi karşılanır)**.

### AGENTS.md (11 sayılan satır → 4)

| id | etiket | siddet | konum | öneri özü | etki |
|---|---|---|---|---|---|
| V7-01 | KALDIR | düşük | L8 | "Değişiklik sonrası codemap+saglik" — ANAYASA Z1 (L34) birebir ikizi; hiyerarşide ANAYASA kazanır, L0 kopyası emekli | −1 |
| V7-02 | KALDIR | düşük | L9 | R/T/* etiket kuralı — ANAYASA A2 (L9) ikizi (A2 daha geniş: "ölçümsüz yüzde YAZILMAZ" dahil) | −1 |
| V7-03 | KALDIR | düşük | L14 | Kök dizin envanteri — CODEMAP.md SSOT ikizi (ANAYASA SSOT tablosu: "Repo haritası: CODEMAP.md — elle düzenlemek YASAK, otomasyon üretir"; her değişimde taze). Yerine sayılmayan işaretçi paragrafı: "Yapı: CODEMAP.md (SSOT — scripts\codemap.ps1 üretir)." | −1 |
| V7-04 | BIRLESTIR | düşük | L7+L10 | Dil + yön tek satır: "Doküman dili Türkçe (kod identifier'ları karışık kabul); kullanıcı sistem-kullanım sorarsa admin-onboarding.md'ye yönlendir (rol/LLM/çok-ajan kılavuzu)." | −1 |
| V7-05 | BIRLESTIR | orta | L15+L16+L17 | PS 5.1 tuzak ailesi 3→1 (here-string kapanışı · Remove-Item→Move-Item · çift tırnak $ genişletmesi). ŞART: üç "kaynak DERSLER satır 3/4/5" provenans ibaresi birleşik satırda AYNEN kalır — `provenansKayitlari()` matchAll çoklu çapayı bulur; satır-no eşleşmesi DERSLER append-only olduğu için güvenli (kural.ts B6 notu). Uygulama dalgası B6 testine birleşik-satır vakası ekler | −2 |
| V7-06 | BIRLESTIR | orta | L19+L20 | Git/gh araç ailesi 2→1 (post-commit hook testi · stderr 2>&1NativeCommandError). ŞART: ham'li çapalar (satır 7: 40cb63205e9a7415 · satır 8: 16761cd6f60a3cfe) birleşik satırda birebir korunur (B6 iki-sinyalli dedup) | −1 |
| V7-07 | KORU | düşük | L18 | 130-satır≈4-5k token ölçüm bilgisi — konu eşi yok. (Değiştir: V7-06 ile üçlü birleşim → ek −1) | 0 |

### ANAYASA.md (10 sayılan satır — taban)

| id | etiket | siddet | konum | öneri özü | etki |
|---|---|---|---|---|---|
| V7-08 | KORU | düşük | L8-L11, L27-L29, L33-L35 | 10 sayılan satırın TAMAMI dokunulmaz sabit (A1-A4, Y1-Y3, Z0-Z2); ajan değiştirmez | 0 |

### REHBER §1-§8 (çekirdekte kalan yüzey)

| id | etiket | siddet | konum | öneri özü | etki |
|---|---|---|---|---|---|
| V7-09 | BIRLESTIR | orta | §1 L13+L14 | Kanıt disiplini çifti (tarih+kalıcı kayıt / bağımsız doğrulama — kodda kanıt ara). K-0039 KAPALI listesinde "kanıt" ailesi vardı; birleşim semantiği korur, emsal sınırını karar turu belirler | −1 |
| V7-10 | BIRLESTIR | düşük | §2 L19+L20 | Doluluk eşikleri tek satır (%70 böl / %80 devir / %90 acil damga; istisna cümlesi korunur — K-0039 %80+%90 birleşiminin tamamlanışı) | −1 |
| V7-11 | BIRLESTIR | orta | §2 L21+L22+L23 | Bağlam durum pratiği üçlüsü tek satır (`bağlam ~%XX` ibaresi · compact-ancak-STATE-sonrası + üst-üne-compact alarmı · cache dostu sıralama; Paseo #5728 cümlesi korunur). Değiştir: L21+L22 ikili (−1) + L23 KORU | −2 |
| V7-12 | KORU | düşük | §2 L24 | Kural-sayısı bütçesi meta-kuralı — K-0039 KAPALI ("meta-kural §2.24") | 0 |
| V7-13 | BIRLESTIR | düşük | §3 L30+L31 | Handoff içerik şartı + işaretçi prensibi tek satır | −1 |
| V7-14 | BIRLESTIR | düşük | §3 L32+L33 | Zincir + echo doğrulaması tek satır ("kopuk zincir = alarm" + "echo yoksa devir tamamlanmamıştır") | −1 |
| V7-15 | KORU | düşük | §3 L34 | Append-only — K-0039 KAPALI aile. (Değiştir: V7-14'e katılım → ek −1; kapalı aile ihlali riski ADİ yazılır) | 0 |
| V7-16 | BIRLESTIR | düşük | §5 L62+L64 | Sıkıştırma teknikleri (sözlük kodlaması + JSON yan-arabirim/damga sıkıştırması) tek satır | −1 |
| V7-17 | BIRLESTIR | düşük | §5 L65+L66 | Damga hijyeni + tekrar-yok tek satır | −1 |
| V7-18 | KORU | düşük | §5 L63 | Delta okuma/tembel yükleme — K-0039 birleşim ürünü, tek başına. (Değiştir: V7-17 üçlüsüne katılım → ek −1) | 0 |
| V7-19 | BIRLESTIR | düşük | §6 L72+L75 | Yazma hijyeni: commit disiplini + satır-sonu/temizlik tek satır | −1 |
| V7-20 | BIRLESTIR | düşük | §6 L73+L74 | Koşum disiplini: test (testsiz merge olmaz + UI dispatchEvent + flake izolasyonu) + canlı sunucu (izole port, restart onaylı) tek satır | −1 |
| V7-21 | BIRLESTIR | düşük | §6 L77+L78 | Sınırlar: araç yetkisi (salt-okuma varsayılan, yazma görev penceresiyle) + kapsam (yeni özellik yeni dosya, mevcut dosya ≤3, reçete istisnası) tek satır | −1 |
| V7-22 | KORU | düşük | §6 L70, L76, L79 | Yansıma-dış-sinyal · sır hijyeni (KAPALI aile) · UI zinciri — dokunulmaz | 0 |
| V7-24 | BIRLESTIR | düşük | §8 L94+L95 | Delegasyon standardı (brief 4+2) + paralellik sınırı (yazıcı tavanı 3, kümeler çakışmaz) tek satır | −1 |
| V7-25 | BIRLESTIR | düşük | §8 L97+L98 | Alt-ajan/spawn başarısızlık sınıfları (402/bakiye düşüşü + harness-seviye spawn telemetri yokluğu, K-0021) tek satır | −1 |
| V7-26 | BIRLESTIR | düşük | §8 L100+L101 | Koşum/araç pratikleri (test izolasyonu: izole port+outputDir + araç huyları DERSLER'e işleme) tek satır | −1 |
| V7-27 | KORU | düşük | §8 L96, L99 | Model ayrımı · heartbeat≠schedule — aktif subagent-dalga operasyon modu: çekirdekte kalsın | 0 |

### REHBER şartlı bölümler (EK'e taşıma — REHBER L7 mekanizması)

| id | etiket | siddet | konum | öneri özü | etki |
|---|---|---|---|---|---|
| V7-23 | ARSIVLE | yüksek | §7 L86-L90 → sozlesme/REHBER-EK-OTONOM.md | Otonom mod "dürtme geldiğinde" şartlıdır → EK dosyası; L85 (kullanıcı vekaleti yok — KAPALI aile) ÇEKİRDEKTE kalır; §7 başına sayılmayan işaretçi paragrafı. RİSK: EK yüklenmezse dürtme-döngüsü (L89) ve şartlı-çerçeve (L86) koruması eksik kalır — EK işaretçisi watchdog/heartbeat spawn brief'lerinin "araç/kaynak" alanına taşınmalı (§8 delegasyon standardı). Değiştir: §7 tümü çekirdekte L86+L90 / L87+L88 birleşimleriyle 6→4 (−2; o zaman hedef için −3 başka yerden gerekir) | −5 |
| V7-28 | ARSIVLE | orta | §9 L107-L111 → sozlesme/REHBER-EK-YENI-PROJE.md | "İlk 15 dakika" checklist'i yalnız yeni-proje anında gerekir — "EKLER: gerektiğinde yüklenen" tanımına birebir uyar. §9 girişi (L105) tek-cümle işaretçi paragrafına iner (plugin agent-onboarding tetiği notu korunur) | −5 |
| V7-29 | ARSIVLE | orta | §10 L115-L119 → sozlesme/REHBER-EK-OZ-DEGERLENDIRME.md | Öz-değerlendirme + sürüm disiplini haftalık/periyodik değerlendirici yüzüdür. L117 onay şartının KOD karşılığı kural.ts/replan.ts [insan] kapılarındadır (EK-2 RED'leri) — metin EK'te muhafaza, kod yine korur | −5 |
| V7-30 | ARSIVLE | orta | §11 L125-L129 → sozlesme/REHBER-EK-SURE-EKONOMISI.md | EK-5 fırtına ekonomisi K3-koşulludur (K-0032 askı hattı; "ikinci emir veya k3Bitis" çıkışı EK'te). Yan kazanım: L128 "testsiz merge yok" §6 L73 ile ÇİFT-doğru-kaynaktı — giderilir; etkinLoc formülü EK'te yaşar; kalite-frenleri ailesi (K-0039 KAPALI) taşınır-muhafaza edilir, always-loaded yüzeyden çıkar | −5 |

### Mekanizma / protokol maddeleri (sayaç etkisi 0)

| id | etiket | siddet | dosyaRef | öneri özü | etki |
|---|---|---|---|---|---|
| V7-31 | KORU | düşük | scripts/saglik.ps1 §5b + core/src/kural.ts | Sayaç makinesi DEĞİŞMEZ: havuz aynı 3 dosya, desen aynı; EK dosyaları havuz dışıdır ("gerektiğinde-yüklenen" aktif-envanter tanımı — sayaç oyunu değil); eşikler hedefler.json'da kalır | 0 |
| V7-32 | KORU | düşük | (kırmızı çizgi) | Madde→tablo/paragraf biçim dönüşümü sayacı yanıltma sınıfıdır — pakette ÖNERİLMEDİ, uygulama dalgasında da YASAK sayılır. İşaretçi paragrafları yalnız navigasyondur (davranış kuralı taşımaz) | 0 |
| V7-33 | KORU | yüksek | scripts/saglik.ps1:75 + core/src/kural.ts (KURAL_SAYAC_DOSYALARI) | Sürüm/dosya-adı kararı: ana rehber adı v2.1 KALIRSA kod dokunmaz (K-0039 "dosya adı aynen" emsali — içerik düzenlemesi sürüm artışı istemez). v2.2'ye artırılırsa (A4/Z2 — PASEO-VERIMLILIK-PLANI.md ile birlikte): saglik.ps1:75 alternatif listesine VE kural.ts havuzuna sozlesme/...-v2.2.md EKLENMELİDİR — eklenmezse ölçüm "sayac-dosya-yok" RED + saglik "REHBER (v*) mevcut" EKSIK (denetçi B3 drift deseni) | 0 |
| V7-34 | KORU | düşük | (protokol) | Uygulama ayrı dalga: K-XXXX karar kaydı + [insan] EK-2 onayı + madde madde uygulama + B6 testine birleşik-satır provenans vakası + codemap taze + saglik yeşil (Z1). Derleyici askısı inişle kalkar; sonraki partiler parti-üst 5 + emeklilik-takası (§2 L24) rejimine döner | 0 |

## 5. Projeksiyonlar ve kademeler

| Senaryo | ANAYASA | AGENTS | REHBER | TOPLAM | Kapı durumu |
|---|---|---|---|---|---|
| Bugün (R) | 10 | 11 | 59 | **80** | EKSIK (tavan) |
| Çekirdek paket (V7-01..V7-30 kabul) | 10 | 4 | 25 | **39** | OK — hedef <40 karşılanır, pay 0 |
| + OP-A (V7-06 üçlü: L18+L19+L20) | 10 | 3 | 25 | **38** | ÖNERİLEN — 1 satır headroom |
| + OP-A + OP-B (V7-17 üçlü: L63+L65+L66) | 10 | 3 | 24 | **37** | 2 satır headroom |
| Değiştir varyantı: §7 çekirdekte birleşmiş + §8 EK'te | 10 | 4 | 23 | **37** | [insan] seçimi — subagent dalgaları aktifken önerilmez |
| OP-D: §8 de tamamen EK'te | 10 | 4 | 20 | **34** | En geniş pay — operasyon riski en yüksek |

Önerilen iniş: **çekirdek + OP-A = 38** (A3 derleyicisi bir sonraki partisi için 1-2 satır emeklilik payı bırakır; her yeni iniş yine emeklilik takası ister — §2 L24).

## 6. Satır-satır envanter (80/80 — ölçüm (R) satır numaralarıyla)

### ANAYASA.md — hepsi KORU (V7-08)

| Satır | Sabit | 
|---|---|
| L8 / L9 / L10 / L11 | A1 / A2 / A3 / A4 |
| L27 / L28 / L29 | Y1 / Y2 / Y3 |
| L33 / L34 / L35 | Z0 / Z1 / Z2 |

### AGENTS.md

| Satır | Kısa içerik | Madde | Etiket |
|---|---|---|---|
| L7 | Doküman dili Türkçe | V7-04 | BIRLESTIR |
| L8 | Değişiklik sonrası codemap+saglik | V7-01 | KALDIR |
| L9 | Kanıt etiketleri R/T/* | V7-02 | KALDIR |
| L10 | admin-onboarding yönlendirme | V7-04 | BIRLESTIR |
| L14 | Kök dizin envanteri | V7-03 | KALDIR |
| L15 | PS here-string kapanışı | V7-05 | BIRLESTIR |
| L16 | Remove-Item→Move-Item | V7-05 | BIRLESTIR |
| L17 | Çift tırnak $ genişletmesi | V7-05 | BIRLESTIR |
| L18 | 130 satır ≈ 4-5k token | V7-07 | KORU |
| L19 | Git post-commit hook testi | V7-06 | BIRLESTIR |
| L20 | gh/git stderr 2>&1 tuzağı | V7-06 | BIRLESTIR |

### REHBER (sozlesme/PASEO-VERIMLILIK-REHBERI-v2.1.md)

| Satır | Kısa içerik | Madde | Etiket |
|---|---|---|---|
| L11 | Okumadan yazma + progressive disclosure | — | KORU (öneri yok) |
| L12 | Dürüstlük | — | KORU (öneri yok) |
| L13 | Kanıt = tarih + kalıcı kayıt | V7-09 | BIRLESTIR |
| L14 | Bağımsız doğrulama | V7-09 | BIRLESTIR |
| L15 | Kararlar tekrar tartışılmaz | — | KORU (öneri yok) |
| L19 | %70 doluluk | V7-10 | BIRLESTIR |
| L20 | %80 devir + %90 acil damga | V7-10 | BIRLESTIR |
| L21 | Durum raporu ilk satır bağlam ~%XX | V7-11 | BIRLESTIR |
| L22 | Compact disiplini | V7-11 | BIRLESTIR |
| L23 | Cache dostu sıralama | V7-11 | BIRLESTIR |
| L24 | Kural-sayısı bütçesi (meta) | V7-12 | KORU |
| L30 | Handoff üretim şartı | V7-13 | BIRLESTIR |
| L31 | İşaretçi prensibi | V7-13 | BIRLESTIR |
| L32 | Zincir kopuk = alarm | V7-14 | BIRLESTIR |
| L33 | Echo doğrulaması | V7-14 | BIRLESTIR |
| L34 | Handoff append-only | V7-15 | KORU |
| L62 | Sözlük kodlaması | V7-16 | BIRLESTIR |
| L63 | Delta okuma + tembel yükleme | V7-18 | KORU |
| L64 | JSON yan-arabirim + damga | V7-16 | BIRLESTIR |
| L65 | Damga hijyeni | V7-17 | BIRLESTIR |
| L66 | Tekrar yok | V7-17 | BIRLESTIR |
| L70 | Yansıma dış sinyalle | — | KORU (öneri yok) |
| L72 | Commit disiplini | V7-19 | BIRLESTIR |
| L73 | Test kuralları | V7-20 | BIRLESTIR |
| L74 | Canlı sunucu izole port | V7-20 | BIRLESTIR |
| L75 | Satır sonu + temizlik | V7-19 | BIRLESTIR |
| L76 | Sır hijyeni | V7-22 | KORU |
| L77 | Araç yetkisi | V7-21 | BIRLESTIR |
| L78 | Kapsam ≤3 dosya | V7-21 | BIRLESTIR |
| L79 | UI zinciri | V7-22 | KORU |
| L85 | Kullanıcı vekaleti yok | V7-23 kapsamı DIŞI | KORU (çekirdekte kalır) |
| L86 | Şartlı çerçeve | V7-23 | ARSIVLE (EK-OTONOM) |
| L87 | Durum akışı 2 satır rapor | V7-23 | ARSIVLE (EK-OTONOM) |
| L88 | Biten subagent topla | V7-23 | ARSIVLE (EK-OTONOM) |
| L89 | Dürtme döngüsü koruması | V7-23 | ARSIVLE (EK-OTONOM) |
| L90 | Otonomluk bütçelemesi | V7-23 | ARSIVLE (EK-OTONOM) |
| L94 | Delegasyon standardı | V7-24 | BIRLESTIR |
| L95 | Paralellik sınırı | V7-24 | BIRLESTIR |
| L96 | Model ayrımı | V7-27 | KORU |
| L97 | 402/bakiye düşüşü | V7-25 | BIRLESTIR |
| L98 | Harness spawn telemetri (K-0021) | V7-25 | BIRLESTIR |
| L99 | Heartbeat ≠ schedule | V7-27 | KORU |
| L100 | Test izolasyonu | V7-26 | BIRLESTIR |
| L101 | Araç huyları DERSLER'e | V7-26 | BIRLESTIR |
| L107-L111 | §9 checklist 5 madde | V7-28 | ARSIVLE (EK-YENI-PROJE) |
| L115-L119 | §10 öz-değerlendirme 5 madde | V7-29 | ARSIVLE (EK-OZ-DEGERLENDIRME) |
| L125-L129 | §11 EK-5 fırtına 5 madde | V7-30 | ARSIVLE (EK-SURE-EKONOMISI) |

Sayılan-dışı yüzey (bilgi): §3.1 (L38 paragraf), §4 tablosu (L46-L51), §5 askı notu (L59-L60), REHBER L3/L7 hijyen satırları — bu paket bunlara dokunmaz (K-0039 deseni: §3.1/§4 tablosu dokunulmadı).

## 7. [insan] karar turu (EK-2 — kolon 2026-10-28 karar turunda dolduruldu; kararlar: kapsam "Çekirdek + OP-A → 38" + çakışma "dahil et + ifşa")

Tur tahmini 15-30 dk (STATE_BOARD A0 damgası). Her madde için: **Evet** (uygula) / **Hayır** (dokunma) / **Değiştir** (belirtilen varyantla uygula).

| id | kısa öneri | Sayaç etkisi | Karar (Evet/Hayır/Değiştir) |
|---|---|---|---|
| V7-01 | AGENTS L8 KALDIR (ANAYASA Z1 ikizi) | −1 | **Evet** (işlendi — 275bb44) |
| V7-02 | AGENTS L9 KALDIR (ANAYASA A2 ikizi) | −1 | **Evet** (işlendi — 275bb44) |
| V7-03 | AGENTS L14 KALDIR (CODEMAP SSOT ikizi + işaretçi paragrafı) | −1 | **Evet** (işlendi — 275bb44) |
| V7-04 | AGENTS L7+L10 birleştir | −1 | **Evet** (işlendi — 275bb44) |
| V7-05 | AGENTS L15-17 PS ailesi birleştir (provenans ×3 korunur) | −2 | **Evet** (işlendi — 275bb44) |
| V7-06 | AGENTS L19+L20 git ailesi birleştir (provenans ×2 korunur) | −1 | **Değiştir — OP-A üçlü (L18+L19+L20)** (işlendi — 275bb44) |
| V7-07 | AGENTS L18 KORU (OP-A: üçlü → ek −1) | 0 | **Değiştir — OP-A üçlüsüne katıldı** (işlendi — 275bb44) |
| V7-08 | ANAYASA 10 satır KORU | 0 | **Hayır** — dokunulmadı |
| V7-09 | REHBER §1 L13+L14 birleştir (kanıt ailesi — emsal sınırı) | −1 | **Evet** (işlendi — 275bb44) |
| V7-10 | REHBER §2 L19+L20 birleştir | −1 | **Evet** (işlendi — 275bb44) |
| V7-11 | REHBER §2 L21+L22+L23 üçlü (Değiştir: ikili −1) | −2 | **Evet** (işlendi — 275bb44) |
| V7-12 | REHBER §2 L24 meta-kural KORU | 0 | **Hayır** — dokunulmadı |
| V7-13 | REHBER §3 L30+L31 birleştir | −1 | **Evet** (işlendi — 275bb44) |
| V7-14 | REHBER §3 L32+L33 birleştir | −1 | **Evet** (işlendi — 275bb44) |
| V7-15 | REHBER §3 L34 append-only KORU | 0 | **Hayır** — dokunulmadı |
| V7-16 | REHBER §5 L62+L64 birleştir | −1 | **Evet** (işlendi — 275bb44) |
| V7-17 | REHBER §5 L65+L66 birleştir | −1 | **Evet** (işlendi — 275bb44) |
| V7-18 | REHBER §5 L63 KORU (OP-B: üçlü → ek −1) | 0 | **Hayır** — OP-B seçilmedi, dokunulmadı |
| V7-19 | REHBER §6 L72+L75 birleştir | −1 | **Evet** (işlendi — 275bb44) |
| V7-20 | REHBER §6 L73+L74 birleştir | −1 | **Evet** (işlendi — 275bb44) |
| V7-21 | REHBER §6 L77+L78 birleştir | −1 | **Evet** (işlendi — 275bb44) |
| V7-22 | REHBER §6 L70/L76/L79 KORU | 0 | **Hayır** — dokunulmadı |
| V7-23 | REHBER §7 böl: L85 çekirdek + L86-L90 EK-OTONOM (Değiştir: tümü çekirdekte 6→4, −2) | −5 | **Evet** (işlendi — 275bb44; §7.1 vekalet çekirdekte korundu) |
| V7-24 | REHBER §8 L94+L95 birleştir | −1 | **Evet** (işlendi — 275bb44) |
| V7-25 | REHBER §8 L97+L98 birleştir | −1 | **Evet** (işlendi — 275bb44) |
| V7-26 | REHBER §8 L100+L101 birleştir | −1 | **Evet** (işlendi — 275bb44) |
| V7-27 | REHBER §8 L96/L99 KORU (Değiştir: §8 EK'e → ek −5) | 0 | **Hayır** — Değiştir seçilmedi, dokunulmadı |
| V7-28 | REHBER §9 → EK-YENI-PROJE | −5 | **Evet** (işlendi — 275bb44) |
| V7-29 | REHBER §10 → EK-OZ-DEGERLENDIRME | −5 | **Evet** (işlendi — 275bb44) |
| V7-30 | REHBER §11 → EK-SURE-EKONOMISI | −5 | **Evet** (işlendi — 275bb44) |
| V7-31 | Sayaç makinesi değişmez (havuz/eşik sabit) | 0 | **Hayır** — makine değişmedi (doğrulandı: sayaç 38 = 10+3+25) |
| V7-32 | Format-oyunu yasağı (biçim dönüşümü YASAK) | 0 | **Hayır** — yasak yürürlükte, ihlal yok |
| V7-33 | Sürüm kararı: v2.1 kalır (öneri) YA DA v2.2 + saglik/kural.ts senkron | 0 | **Evet** — öneri kabul: **v2.1 adı KALDI** (K-0052 notu sürüm satırında) |
| V7-34 | Uygulama protokolü (K kaydı + ayrı dalga + Z1) | 0 | **Evet** — protokol izlendi (K-0052 → dalga → B6 testi → codemap+saglik → islenme) |

## 8. Uygulama bağımlılıkları (öneri kabul edilirse)

1. **K-XXXX karar kaydı** (K-0039 deseni: bağlam · karar · reddedilen alternatifler · kabul ölçüsü) + [insan] onayı — bu paketin kendisi öneridir, onayı yoktur (EK-2).
2. **B6 testi genişletmesi:** `core/test/a3-kural.test.ts`'ye birleşik-satırlı çoklu-provenans vakası eklenmelidir (V7-05/V7-06 çapaları; `provenansKayitlari()` matchAll doğrulaması) — eklenmeden birleşik iniş çift-iniş/tavan riskini geri getirir.
3. **Yeni EK dosyaları** (sozlesme/REHBER-EK-{OTONOM,YENI-PROJE,OZ-DEGERLENDIRME,SURE-EKONOMISI}.md): REHBER gövdesinden MADDE-MADDE taşınır (içerik kaybı yok); REHBER'e sayılmayan işaretçi paragrafı iner; REHBER ~95 satıra düşer (≤150 hijyen rahatlar).
4. **Z1:** uygulama sonrası codemap taze (yeni dosyalar CODEMAP sayısını büyütür) + saglik yeşil; kural-proxy kapısı 80 EKSIK → 38-39 OK.
5. **Sürüm:** öneri v2.1 adı korunur (K-0039 emsali); v2.2 tercih edilirse saglik.ps1:75 + kural.ts havuz senkronu ŞART (V7-33).
6. **A3 derleyicisi:** askı kalkar; sayaç 38-39'tan parti-üst 5 inişleri tavan 80'e uzak, SARI 40 sınırına 1-2 satır mesafe — her yeni iniş emeklilik takası ister (§2 L24).

## 9. Dürüst notlar

- (a) Ölçüm `node src/cli.ts kural` ile koşulmadı — görev metnindeki "ölçüm kayıt doğurmaz" önkabulü kodda yanlış (cli.ts:306 taramaKaydet koşulsuz; :320 taslakKaydet aday-setinde; son tarama 77'de, sayaç 80 → hash farklı → kayıt doğardı). Sayaç §5b okuma-yalnız ikiziyle ölçüldü; kural.jsonl 9 kayıt — DEĞİŞMEDİ. Aynı gerekçle `--sentez`/`--onay` da koşulmadı (bu ajan zaten onaylayamaz — EK-2).
- (b) v7 dosya çifti diskte YOKTU (ls ile doğrulandı) — sıfırdan yazıldı ("mevcut dosyalar varsayılmaz" talimatı).
- (c) Görev metnindeki "6 A3 kuralı satır 3-8" ifadesi hatalıdır — AGENTS.md'de kural satırları L15-L20'dedir (satır 3-8 DERSLER'deki KAYNAK satırlarıdır); envanter gerçek satır numaralarıyla kuruldu.
- (d) Salt-okur sınırına uyuldu: AGENTS.md, ANAYASA.md, REHBER, kural.jsonl, replan.jsonl'a YAZILMADI; paralel yazıcının kirli dosyalarına dokunulmadı; COMMIT YOK.
- (e) KALDIR maddeleri içerik kaybı değildir — kuralın yaşadığı tek doğru kaynak (ANAYASA / CODEMAP) kalır; çift-doğru-kaynak riski (REHBER §4) giderilir.
- (f) Projeksiyonlar sayaç makinesiyle birebir uyumludur (aynı desen + aynı havuz + BOM soyma; V7-31); tek belirsizlik [insan] karar varyantlarıdır — §5 tablosu her varyantı verir.
- (g) Bu rapor (T) içermez: tüm sayılar (R) ölçümdür (80 = 10+11+59; kural.jsonl 9 kayıt; damga 10:34). Madde gerekçelerindeki risk değerlendirmeleri niteliksel analizdir (etiket: analiz).

KAYNAKLAR (okunan): AGENTS.md · ANAYASA.md · scripts/saglik.ps1 (§5b) · kararlar/K-0051.md · kararlar/K-0039.md · sozlesme/PASEO-VERIMLILIK-REHBERI-v2.1.md · DERSLER.md (A3 girdisi; satır 3-8 + 187) · core/src/kural.ts · core/src/cli.ts (kural bölümü) · hedefler.json · STATE_BOARD.md · raporlar/gelen-kutu/v6-* (şema örneği).

---

## 10. İşlenme kaydı (K-0017 — 2026-10-28, K-0052 kapanışı)

[insan] karar turu 2026-10-28 (bu oturum, EK-2: kararlar kullanıcıdan — AskUserQuestion ile iki soru): **kapsam = "Çekirdek + OP-A → 38"** · **çakışan kirli dosyalar = "dahil et + ifşa"**. Tablo dağılımı: 24 Evet · 8 Hayır (dokunma) · 2 Değiştir (V7-06 OP-A üçlü; V7-07 OP-A'ya katılım).

Uygulama dalga commit'i **275bb44** + kapanış commit'i (bu işlenme kaydı + K-0052 kapanış eki + STATE_BOARD damgası). Ölçüm (R): sayaç **80 → 38** (saglik.ps1 §5b: ANAYASA 10 + AGENTS 3 + REHBER 25; AGENTS 23→15 satır, REHBER 129→96 satır); a3-kural.test.ts **21/21** (20+1 yeni B6 birleşik-satır vakası); tam süit **450/450** (449+1, sureSn 81.8, fail 0); saglik **19 OK / 0 EKSIK / 1 SARI** (kural-proxy 38 OK — derleyici askısı kalktı; kalan SARI: kabul 31 GECTI_HERMETIC, bu dalganın dışı). 4 EK dosyası sozlesme/'de (OTONOM/YENI-PROJE/OZ-DEGERLENDIRME/SURE-EKONOMISI).

Dürüst notlar: (a) Bu raporun §2-§3 envanterindeki AGENTS satır numaraları rapor yazımındaki dosyaya göreydi; RBT-2026-10-28.2'nin nav paragrafı nedeniyle satırlar +2 kaymıştı — uygulama düzenlemeleri içerik-çapalı (satır numarasına güvenilmedi). (b) §7 karar kolonu dolduruldu (bilinçli boştu — karar turu cevabı 2026-10-28). (c) KORU etiketli maddeler (V7-08/12/15/18/22/27/31/32) Hayır kararıyla dokunulmadan bırakıldı — karara bağlanmak da işlemedir (K-0017). (d) `node src/cli.ts kural` ölçümü kasıtlı koşulmadı (§9-a notu aynen geçerli — taramaKayDet üretim defterine kayıt düşer; sayaç kanalı saglik §5b salt-okuma).
