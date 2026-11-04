# PANEL DALGA SIRASI — öncelik kararı (kullanıcı emri 2026-11-04)

Kullanıcı emirleri (2026-11-04, verbatim): «önerini uygula öncem sırası yapalım .. asıl çekirdek iş kurmayın yada proje içi manager ajanın ne kadar yönetim denetim izleme olduğu bunları ekrana yansıtmak ayrı iş» + «ilk önce çekirdek fonlisyonları doğrulayalım sonra makyaj cila ..» → koordinatör önerisi (arşiv + yüzey bölme) KABUL; **çekirdek önce**: panelin yönetim-denetim-izleme GERÇEKLERİNİ doğru gösterdiği uçtan uca doğrulanır; kozmetik (renk/cila) dalgaları en sona.

## Sıra

| # | Dalga | İçerik | Kim | Durum |
|---|---|---|---|---|
| 0 | **FAZ-U** | Şerit: renk aileleri + aynı-proje yan yana + rozetler (sayı/uyarı/nokta) + layout (şerit orta+sağ üstünde, sol tepeye) — TUR ORTASINDA, yarıda kesmek israf + kirli ağaç; kapanır ama yeni makyaj dalgası AÇILMAZ | Yazıcı 3f3584c0 | KOŞUYOR |
| 1 | **ÇEKİRDEK DOĞRULAMA TURU (uçtan uca)** — KULLANICI ÖNCELİĞİ | (a) API zinciri: 401 (token yok) → token → kadro/projeler/graf; (b) fail-closed yüzeyler (403 · sunucu yok · boş veri — ölü buton/boş kart YOK); (c) **veri-disk tutarlılığı**: panelin sayıları diske karşı (75 proje · çalışan sayısı · lastStatus) + **yönetim hiyerarşisi doğruluğu**: parent-agent-id ağacı kayıtlara karşı (kim kimi yönetiyor — kurmay/proje-manager gerçeği); (d) oturum/transcript yükleme; (e) restart sonrası state + tercihler; (f) 390/1024/1280; (g) canlı gönderim SADECE kullanıcı onayıyla | **Koordinatör bizzat** (tarayıcı fetch + disk ölçümü; FAZ-U kapanışı sonrası STABİL kodda) | SIRADA |
| 2 | **ARŞİV** (K-0062 daraltma) | pano/ prototip yüzeleri → arsiv/pano-prototipler/ (kapsul-tuval 2870 · deney-panel 1134 · deney-server 810 · orkestra 307 · mockup 330 + testleri) ≈ **−6.500 satır**; tam kapı komutu glob'u güncellenir; CODEMAP | **Koordinatör bizzat** (mekanik taşıma; çekirdek turundan sonra — tam kapı test sayısı dalgaların kabul ölçütü, eşzamanlı koşmaz) | SIRADA |
| 3 | **FAZ-V — ÇEKİRDEĞİN EKRANA YANSIMASI: denetim yüzeyi** | Sağ panelde KURMAY/MANAGER görünümü: kim kime bağlı (`labels["paseo.parent-agent-id"]` — diskte VAR, ölçüldü) · her yöneticinin yükü (yönettiği ajan sayısı / çalışan / hata) · denetim kanıtı (doğrulanan dalga, işlenme) · izinler (lastModeId) · süre (createdAt/lastActivityAt) · dizin · id/unvan. Benchmark satırı dürüst «hedef yok». YENİ dosyada (yüzey bölme) | Yazıcı 3f3584c0 | SIRADA |
| 4 | **FAZ-W** | Satır sayacı + task grafı: YENİ modül pano/satir-sayaci.mjs (transcript tool_use parse: Edit old/new satırları, Write eklenen; mtime önbellek) + ağaç çipleri + sağ panel zaman-serisi. Dürüst sınırlar: Write silme bilmez · codex-motor oturumları dışarıda kalır | Yazıcı 3f3584c0 | SIRADA |
| 5 | **MAKYAJ/CILA** (en son) | Renk/cila rötuşları, görsel kalanlar, ağaç filtresi kararı (75 vs 42 aktif) — ÇEKİRDEK doğrulanmadan AÇILMAZ (kullanıcı ilkesi) | — | BEKLEMEDE |

## Neden bu sıra

1. **Çekirdek doğrulama EN ÖNCE** — kullanıcı ilkesi «ilk önce çekirdek fonksiyonları doğrulayalım sonra makyaj cila»: panelin iddia ettiği yönetim-denetim-izleme gerçeği (parent ağacı, çalışan sayıları, durumlar) diske karşı KANITLANMADAN üzerine yeni yüzey binmez. FAZ-U tur ortasında — yarıda kesmek israf; kapanır, ardından çekirdek turu.
2. **Arşiv** — K-0062: pano/ toplam 17.239/18.000 (%95,8); planın tamamı (~+700-900 satır) mevcut payla (761) taşar. Arşiv dalgası ~−6.500 → toplam ~16.700 (%93) → FAZ-V/W rahat sığar. Çekirdek turundan SONRA (tam kapı test sayısı dalgaların kabul ölçütü — eşzamanlı koşmaz).
3. **Yüzey bölme (karar)**: FAZ-V kart/graf JS'i yeni dosyada doğar (pano/ordu-pano-kart.js benzeri) — html dosya tavanı (182 pay) korunur; yeni dosya yalnız dizin toplamına girer. Sözleşme «yeni özellik = yeni dosya» aynen.
4. Arşiv FAZ-U ile EŞZAMANLI KOŞMAZ: tam kapı test sayısı (311) dalgaların kabul ölçütü — taşıma test setini değiştirir, yazıcının ölçüsünü bozar.

## Tavan matematiği (özet — K-0062 atfı)

html 2058/2240 (182 pay) · test 2748/3000 (252 pay) · pano toplam 17.239/18.000 (761 pay). Arşiv sonrası: toplam ~16.700; FAZ-V+W yeni dosyalarla toplamda ~+700 → ~17.400 (%96,7) tavan içi. Tavan revizyonu YALNIZ kullanıcı emriyle (K-0062 m.5) — önerilmez, disiplin aynen.

İlgili: [K-0062] tavanlar/daraltma adayları · [AJAN-YONETIM-MATRISI] (plans/) yönetim sınırları · alan denetimi ölçümü (parent-agent-id geçerli — 3f3584c0 kaydında kanıt).
