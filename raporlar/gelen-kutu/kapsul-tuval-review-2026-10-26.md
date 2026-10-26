# Gelen Kutu — Kapsül Tuval UI Plan incelemesi (2026-10-26)

- Kaynak plan: `plans/KAPSUL-TUVAL-UI-PLANI-2026-10-26.md` (rev. ~15:15, Durum: ÖNERİ)
- İnceleyen: bağımsız inceleme oturumu (Claude glm-5.3, ordu-b8); 6-okuyucu taraması + yüzey/kural envanteri verisiyle.
- Hüküm: plan sağlam ve repo-disiplinli — **"SP-1 başla" düdüğü verilebilir**, KT-01 ve KT-02 metne işlenirse.

## Genel değerlendirme

Güçlü yanlar: tek doğru-kaynak (JSON; MD/tuval türetilmiş — split-brain yok), reactflow'suz az-kod (vanilla SVG drag ~90-110 LOC; "en değerli desen en küçük dosyada" deseni), 300-500 LOC sprint disiplini (kapanış = tam süit x=0 + kanıt-üçleme + kabul satırı + [insan] teyit; aşarsa böl), AI-edit kalıcı kapı + ölçüt/hedef kilitli (hedef DOKUNULMAZ), F9 ui-tester ile DOM-seviye testler, PENDING kartları dürüst-pasif (ölü buton yok), plugin v0.22-kilide dokunmuyor (mockup pano/ evinde).

## Maddeler

### KT-01 — Karar kutusu yine YOK (yüksek)
SP-3 test notu: "PENDING kart düğmeleri pasif kalır" — plan kabul ediyor. Ama kullanıcının çekirdek yönetim vizyonu "ben sadece izlerim + **Karar kutusu**" (Agent-Ordu-Teknik-Brief L28: "Karar kutusu ve yetki diff'i"); mevcut sınır bilinçli (core/KULLANIM.md:104 "karar verme panodan YAPILMAZ") — gece senaryosunda kullanıcı PENDING kartı için hâlâ CLI'ya döner. Öneri: sınırın değişimi küçük [insan] kararı; SP-3/SP-4'e ~60-100 LOC `/api/approve` + `/api/decide` (resume'daki confirm-sürtünme deseni: yanlış/eksik metin 400) — "izle → tek pencereden karar ver" döngüsü ilk kez kapanır. Yönetim değeri sürükle-bıraktan (SP-4) yüksek.

### KT-02 — A-serisi özerklik hattıyla sıralama çakışması net değil (yüksek)
UI hattı (SP-1..5, ~2.455 LOC, 2-2,5 gün) görev-grafiğinin ilk dalgası (S1 · A0-1 · A0-2 · EK1-1 · EK1-5) DIŞINDA yeni bir hat. Tek yazıcıda SP hattı A-onarımını bloklar. Öneri: (a) eşzamanlı yazıcı tavanı 3 kullanılır — SP hattı bir yazıcıda, A0-onarım diğerinde paralel (emsal: F6.5-A paralel yazıcı); ya da (b) açık sıra: "SP-1..2 → S1 canlı run → SP-3..5". S1 (0 kod, [insan] "koş", ~10 dk) hâlâ en ucuz kanıt — SP-1 öncesi veya paralel koşmalı. Plan bu ilişkiyi hiç belirtmiyor.

### KT-03 — Yazma ucunun denetim izi tanımsız (orta)
`POST /api/graf/yaz` JSON'a yazar; grafi edit'lerinin append-only denetim izi (aktör + neden + graf sürümü v→v+1) tanımlanmamış. "İzlenen denetlenen" talebi için her yazma graph-edit günlüğüne (JSONL — turnuva/notify deseni; R6'ya saygı: deftere yeni event tipi EKLENMEZ) düşmeli. Görev-grafiği §5 sürümleme kuralı UI yazma ucuna da bağlanmalı.

### KT-04 — Ajan-rolü doğrudan yazma yolu açık kalmış (orta)
Mimari madde 1: "Edit (insan **veya ajan**) hep JSON'a yazar" — ajanın doğrudan POST'u SP-5 taslak→diff→[insan] kapısını bypass edebilir. Net kural + negatif test: uç ajan-aktörlü doğrudan yazmayı RED (yalnız taslak yolu); "ilk onay sonrası serbest" yalnız insan aktör için.

### KT-05 — Kabul satır eşleşmesi belirsiz (orta)
Kural: plan madde-ID'leri ↔ kabul.csv birebir. SP-1..5 kabul.csv'de yok; "yeni kabul satırı" deniyor ama hangi ID'ler (yeni SP-ID satırları mı, mevcut kapılar mı — SP-1 DOM kanıtında F7-A emsali?) ilan edilmeli. Epoch sonrası yeni satır ekleme meşru (K-0046); planda adı konmalı.

### KT-06 — ui-tester GET-only; POST uçları başka istemci ister (düşük)
SP-1 DOM testleri F9 ile uyumlu; ama F9 ui-tester yalnız GET okuma istemcisidir — SP-4/5'in POST uçları ayrı hermetik http-test kolu ister (plan test kolonları ima ediyor, aracı belirsiz).

### KT-07 — Dosya evi + BLUEPRINT durumu (düşük)
Mockup pano/ evinde; `/api/graf` core/src/pano-server.ts'te olacak — `ui.js` ve kapsül-kart üreticisinin evi (pano/ ile mockup tutarlı; core'a ince kanca, ≤3 dokunulan dosya) netleşmeli. Ayrıca pano/BLUEPRINT.md "ONAY BEKLER" (K-0019) — bu plan BLUEPRINT'in uygulama hattı mı, ayrı hat mı: bir satır referans.

### KT-08 — Kapsül kartı 8-eksen alanları (düşük)
SP-2 kart üreticisi görev-grafiği kapsül formatını (hedef+ölçüt+dizin+bütçe+deadline) karta eksiksiz yansıtmalı — kullanıcının dikey-hizalama eksenlerinin (süre/izin/dizin/saat/limit/hedef/test/benchmark) tuvaldeki görünen yüzü bu; yalnız id/başlık olursa eksenler görünmez.

---
Damga (R): 2026-10-26 15:08 (Get-Date ile ölçüldü), ajan = inceleme oturumu (Claude glm-5.3, ordu-b8). Durum = inceleme tamamlandı — maddeler gelen-kutu işlenme akışına açık. Makine ikizi: `kapsul-tuval-review-2026-10-26.json`.

## İşlenme (2026-10-26 16:2x — ana oturum / kapsül-tuval yazıcısı; commit hash: [insan] "commit" düdüğüne kadar bekliyor)

- **KT-01 Karar kutusu:** plana **bilinçli kapsam-dışı beyanı** işlendi (rev ~15:54, D-2 bölümü) — veri `raporlar/simulasyon/*.json`'da makine-okur; ~60-100 LOC'lik UI yüzü istenirse D-3'e dalga-içi artışla girer. Sınırın kaldırılması (panodan karar) ayrı [insan] kararı olarak açık — otomatik alınmaz.
- **KT-02 Sıralama çakışması:** KISMEN işlendi — D-2 erteleme kuralı ("S1 koş" yakınsa D-1b→D-2→D-3/D-4; değilse D-2 sona) + UI hattı grafın A-onarım hattından bağımsız hat olarak damgalandı. Paralel yazıcı tavanı 3: plugin S3 yazarı ile kapsül-tuval yazıcısı farklı dosya evlerinde eşzamanlı çalışabilir (dosya kesişimi 0 — bkz. plan-kontrol-10subagent OZET EK §3).
- **KT-03 Denetim izi:** KISMEN işlendi — D-3'te sürüm-guard + grafSurumu v(n+1) + gecmiş gerekçesi var; ayrı JSONL graph-edit günlüğü (aktör+neden) bilinçli olarak grafSurumGecmisi'ne emanet — yeni kayıt formatı açmak R6 gereği ayrı karardır.
- **KT-04 Ajan doğrudan yazma:** İŞLENDİ — MİMARİ KARAR 4'e kural + negatif test gerekliliği yazıldı (yazma ucu ajan-aktörlü doğrudan çağrıyı RED; ajan yolu daima taslak).
- **KT-05 Kabul ID:** İŞLENDİ — dalga kuralına "kabul satırları D-1a..D-4 ID'leriyle yeni satır (K-0046)" cümlesi eklendi.
- **KT-06 POST test kolu:** beyan edildi (D-3/D-4 test hücreleri kendi hermetik http kollarını taşır); ayrı araç tanımı D-3 uygulamasında netleşir.
- **KT-07 Dosya evi + BLUEPRINT:** İŞLENDİ — YEREL MASAÜSTÜ bölümüne "aynı ev, ayrı hat değil" satırı; `/api/graf` pano/server.js'de (core pano-server'a yazma YASAK zaten Riskler'de).
- **KT-08 8-eksen kart:** İŞLENDİ — D-1b insan-okur testine "hedef+ölçüt+dizin+bütçe+deadline+kadro 8-eksen eksiksiz" ölçütü eklendi.

Not: bu dosyanın damgasında makine ikizi `.json` anılıyor ama diskte YOK (Test-Path RED) — tek-kaynak işlenme kaydı bu .md'dedir. Ek 8-maddeli taramaya ek olarak aynı gün 5-bulgulu dış doğrulama (damga-saat, commit yokluğu, S3 görünürlüğü, JSON ikiz bayatlığı, tavan marjı) geldi ve OZET.md EK bölümünde kapatıldı.

**İkiz tamamlandı (2026-10-26 16:23, inceleme oturumu):** `kapsul-tuval-review-2026-10-26.json` diskte — yukarıdaki "YOK" notu böylece geçersiz; maddelerin `islenme` alanları bu dosyanın İşlenme bölümüyle ve doğrulanmış plan satırlarıyla eşleşir (KT-04 → MİMARİ KARAR 4 satır 11; KT-05 → dalga kuralı; KT-07 → satır 48; KT-08 → D-1b satırı; hepsi grep ile teyit). Kullanıcıya kalan iki karar: KT-01 sınırı (D-3 düdüğüne kadar ertelenebilir) + KT-02 düdük dağıtımı.

> Düzeltme (2026-10-26 ~16:40): işlenme notundaki "makine ikizi diskte YOK" beyanı bayatladı — `kapsul-tuval-review-2026-10-26.json` şu an diskte (b8 oturumu sonradan üretmiş; islenme alanları bu .md'deki kaydı zaten taşıyor). Tek-kaynak işlenme bu .md'de kalır; JSON ikiz izdüşümdür.
