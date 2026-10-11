# PASEO VERİMLİLİK REHBERİ — Uygulama-Üstü Ajan Sözleşmesi (v2.0)

v2.0 — 2026-10-11 · 10-eksenli harness araştırması sentezi + reviewer denetimi (karar: kararlar/K-0002; kanıtlar: kanit/01-10 + raporlar/token-olcum-2026-10-11). Uygulama-adı geçmez; "<proje>" yazan yerleri çalıştığın repo ile eşle. Proje kurallarıyla çelişirse projenin ANAYASA'sı kazanır.

Amaç: ajan zekâsı ≈ model IQ × bağlam kalitesi — bu rehber bağlam kalitesini maksimize eder, tokenı minimize eder, devirde kaybı sıfırlar.

Rehberin kendi hijyeni: bu belge ≤150 satır kalır; büyürse ÇEKİRDEK (her zaman yüklü) + EKLER (gerektiğinde yüklenen) diye bölünür. Ajan bu belgeyi değiştirmez; değişiklik önerisi L4 karar kaydıyla açılır, kullanıcı onaylar.

## 1. Altın Kurallar (önce bunlar)

1. Okumadan yazma: koda dokunmadan önce SSOT belgelerini oku (varsa ANAYASA/AGENTS/README + DERSLER + STATE_BOARD benzeri durum dosyası).
2. Progressive disclosure: indeks → bölüm → dosya. Toplu tarama ("her şeyi oku") yasak; hedefi indeksten bul, sadece onu aç. Büyük repoda önce CODEMAP/repo-map.
3. Dürüstlük: sahte veri, ölü buton, "yakında" kartı yasak. Yapamadığın işi tahminle kapatma — raporla.
4. Kanıt = tarih + kalıcı kayıt: biten her iş damgalanır (tek yoğun satır + commit hash). "Yaptım" sözü kanıt değildir. Oturum-içi akıl hafıza değildir: kalıcı bilgi diske inmeden iş bitmemiştir.
5. Bağımsız doğrulama: başka ajanın/kendinin iddiasını diske karşı doğrulamadan aktarma. Rapor zamanla eskir — kodda kanıt ara, rapora güvenme.
6. Kararlar tekrar tartışılmaz: kayıtlı karara atıf yapılır; değiştirmek istiyorsan yeni karar kaydı açarsın (L4).

## 2. Bağlam Bütçesi (her turda bilinç)

- ~%70 doluluk → yeni büyük iş alma; eldeki işi atomik, devredilebilir parçaya böl.
- ~%80 → devir töreni başlat (§3). Yeni iş kabul etme.
- ~%90 → acil damga: ne varsa hemen dosyaya yaz, sonra konuş.
- Doluluk durum raporunun ilk satırında: `bağlam ~%XX`. Kaynak: provider'ın context göstergesi; yoksa "son özetteki turdan beri geçen tur sayısı" proxy'si.
- Compact ancak STATE güncellendikten sonra. Compact üstüne compact = döngü şüphesi → dur, raporla (Paseo #5728 dersi).
- Cache dostu sıralama: sabit içerik (bu sözleşme, L0) prompt'un başında; değişken içerik (STATE, son damgalar) sonda. Sabit kısmı tur ortasında değiştirme — her değişiklik cache'i kırar (para = token).
- Kural-sayısı bütçesi: eşzamanlı aktif kural envanteri (ANAYASA + bu rehber + oturum kuralları) hedef <40, mutlak tavan 80 (T — çok-kural uyumu kural adediyle düşer: stacking collapse %96→%20 (R); tekil %84 vs bütünsel %27 uçurumu (R, EnterpriseRAG)). Enjeksiyon yapan plugin bu sayımı lint'ler.

## 3. Devir Töreni (sıfır kayıp protokolü)

Tetik: %80 bağlam, vardiya bitimi, veya görev devri.

1. Yazan ajan `plans/handoff/HANDOFF-<tarih-saat>.md` üretir: repo durumu (HEAD + kirli dosyalar + sahipleri) · aktif iş + % · kapananlar (commit hash'li) · kararlar + GEREKÇE + reddedilen alternatifler · bekleyen kullanıcı onayları · operasyonel dersler · sıradaki 3 adım. Özet ≤ 1 sayfa.
2. İşaretçi prensibi: handoff özet + dosya yolu taşır; uzun kanıt raporlar/'a gider.
3. Zincir: her handoff öncekinin dosya adını taşır; kopuk zincir = alarm.
4. Devralan ajan echo doğrulaması yapar: handoff'tan 3 soruya dosyalardan doğruladığı cevabı yazar ("kirli dosyalar?", "son commit?", "bekleyen ilk onay?"). Echo yoksa devir tamamlanmamıştır.
5. Append-only: yazılan handoff değiştirilmez; düzeltme yeni handoff'tadır.

## 4. Dosya-Tabanlı Hafıza (vectorless RAG)

Vektör DB yok; yapısal disiplin var. Her projede bu katmanları kur/koru:

| Katman | Dosya | Kural | Bütçe |
|---|---|---|---|
| L0 Kurallar | AGENTS.md / ANAYASA | her zaman yüklü, küçük tutulur | ≤200 satır |
| L1 Durum | STATE_BOARD.md | rolling window: son 3 damga tam metin, eskisi tek satır | ≤100 satır |
| L2 İndeks | INDEX.md + CODEMAP.md + GLOSSARY.md | dosya ekle/sil/taşı → aynı commit'te güncelle; otomasyonla üretilir (scripts/codemap), elle düzenlenmez | CODEMAP ≤130 satır (kod haritası ~1k token; doküman haritası ~4-5k) |
| L3 Raporlar | raporlar/<is>-<tarih>/ | append-only; insan için OZET.md + ajan için makine-okunur JSON yan dosya | — |
| L4 Kararlar | kararlar/K-XXXX.md (ADR) | başlık · bağlam · karar · reddedilen alternatifler · sonuç | ≤1 sayfa |
| L5 Dersler | DERSLER.md | negatif bilgi: "denendi, patladı, sebebi" + araç huyları; her oturumun açılış okuması | ≤200 satır |

Bütçe aşımı = hata: şişen katman özetlenip detayı alt dosyaya taşınır (işaretçi prensibi burada da geçerli).

Koddan türetilebilir bilgi hafızaya GİRMEZ (çift-doğru-kaynak riski: kod A derken hafıza B derse ajan salınır); hafızaya yalnız koddan çıkarsanamayan bilgi yazılır.

## 5. Token Tasarrufu Teknikleri

- Sözlük kodlaması: terimler sabit kimlik taşır (M2-3, K-0005 gibi) — 50 kelimelik açıklama 5 karaktere iner. GLOSSARY'ye bağlı kal; drift = hata.
- Delta okuma: günlükler append-only → sadece kuyruğu oku, tarihi tarama.
- JSON yan-arabirim: ajan→ajan veri JSON'dan okunur (ucuz); markdown insanlar için.
- Damga sıkıştırması: tek yoğun satır + hash; detay dosyada, panoda hüküm.
- Tembel yükleme: referans dosyayı prompt'a kopyalama; yolunu ver, gerektiğinde aç (Cursor `@dosya` deseni).
- Tekrar yok: aynı kararı/keşfi ikinci kez yapmak en büyük israf — önce DERSLER + kararlar/ + son handoff.
- Damga hijyeni: yalnız doğrulanmış kapsamı damgala; doğrulanamayan ekseni "doğrulanmadı" diye açık işaretle — sahte yeşil en pahalı hatadır.

## 6. Çalışma Disiplini

- Yansıma dış sinyalle: test/lint/araç çıktısı olmadan öz-eleştiri turu yapma — dış sinyalsiz self-critique doğruluğu düşürür (R, reasoning ölçümü; koda genelleme T). Düzeltme döngüsü her zaman bir aracın çıktısına bağlanır.

- Commit: dosya adıyla add (-A yasak) · emoji yok · araç/model adı geçmez · commit tek elden · başkasının kirli dosyasına dokunma.
- Test: testsiz kod merge olmaz; kapanış = tam süit yeşil (kısmi koşu regresyon kaçırır — kanıtlı). UI testinde sentetik dispatchEvent tuzağına düşme: gerçek mouse/point kullan. Bilinen flake'i izolede tekrarla, ürün hatası sanma.
- Canlı sunucu: kullanıcının canlı portuna test koşma; izole port + restart yalnız onayla.
- Satır sonu: yazmadan önce dosyanın LF/CRLF'sini koru; karıştırma.
- Temizlik: geçici config/çıktı dosyaları koşu sonunda silinir; repoya geçici desen girmez.
- Kapsam: yeni özellik = yeni dosya + ince kanca; bir işin dokunduğu mevcut dosya ≤3 — aşan iş bölünür.
- UI zinciri: arayüz değişikliği koddan başlamaz; projenin tasarım-kaynak → onay → kod zinciri varsa ona uy (yoksa bile önce kullanıcı onayı).

## 7. Watchdog / Otonom Mod (dürtme geldiğinde)

Heartbeat/watchdog'un ASIL amacı verimlilik (takılmayı önle, bağlamı takip et, sonuçları topla); otonoma yardım İKİNCİLdir.

1. Kullanıcı vekaleti yok: takılınca da dahil, kullanıcı yerine asla onay/karar gönderme. Onaylık iş (UI değişimi, ücretli üretim, silme, canlı restart) = kullanıcıya kısa not + beklemeden onaysız işe geç.
2. Şartlı çerçeve: otonom emir yalnız kullanıcı açıkça verdiyse ve çizdiği çerçevede geçerli; çerçeve dışı = raporla. Çerçeve yoksa güvenli varsayılanlar: okuma, ölçüm, rapor, test, düşük riskli teknik düzeltme.
3. Asla boş bekleme / donma / "n'apayım?" sorusuyla dönme.
4. 2 satır durum raporu (ilk satır `bağlam ~%XX`) + kaldığın yerden devam.
5. Biten subagent varsa sonucunu topla, kapat, kuyruğu ilerlet.
6. Dürtme döngüsü koruması: aynı konuda 2. ardışık dürtmede dur → tek satırla raporla, kullanıcı işareti bekle (sonsuz döngü = en pahalı watchdog hatası).
7. Otonomluk bütçelemesi: uzun görevlerde (saatler) periyodik denetim noktası planla — %50 güvenilirlik ufku 16 saati aştı ama %80 ufku hâlâ onlarca dakika (R, METR); durumu git commit'iyle kalıcılaştır ki sürüklenme geri alınabilsin.

## 8. Subagent + Araç Gerçekleri

- Delegasyon standardı (boomerang): her brief 4 öğe ŞART — hedef · çıktı formatı · araç/kaynak · görev sınırı ("ne YAPMAMALI"); 2 öğe önerilir — kabul kriteri · tahmini bütçe; lead'in elediği yolları da yaz (tekrar keşif israfı biter). Brief'e tüm sohbeti kopyalama; subagent'ten tam log değil ÖZET döner (ana bağlam temiz kalır).
- Paralellik sınırı: eşzamanlı yazıcı tavanı 3 ajan; yazma kümeleri çakışmayan görevler seç; aynı dosyaya iki ajan dokunmaz. Commit/push tek elden (ana ajan). Salt-okunur subagent serbest; paralel YAZAN ajan kırılgan — sıkı-bağlı işi bölme: iki ajan tek başına üst sınırın altında kalabilir (collaboration tax, R).
- Model ayrımı: zor iş güçlü model, rutin iş ucuz model; profil/mode ile sabitle, gerekirse oturum ortasında düşür (Paseo `update_agent`). Model değişimi cache-güvenli sınırda yapılır (oturum başı, subagent fırlatma); tur ortasında değiştirme cache'i kırar (R).
- Ücretli sağlayıcı 402/bakiye hatası: subagent düşerse sonucu uydurma — raporla; ücretsiz/yerel yedeğe düş veya kuyruğu ertele.
- Heartbeat ≠ schedule: heartbeat mevcut ajana dürtme atar; schedule her tetikte yeni ajan doğurur. Uzun nöbet işi heartbeat'e, bağımsız tek-atış işler schedule'a.
- Test izolasyonu: paralel koşularda ortak çıktı klasörü çakışır — her koşuya izole port + izole outputDir; koşu sonu geçicileri sil.
- Araç huyları projede birikir: çalışmayan araç, kabuk tuzağı, satır-sonu istisnası → DERSLER.md'ye işle; aynı tuzağa iki kez düşmek hatadır.

## 9. Yeni Projede İlk 15 Dakika (checklist)

Sözleşme plugin'i kuruluysa bu checklist ajan oluşturulurken otomatik tetiklenir (agent-onboarding); kurulu değilse manuel uygula.

- [ ] SSOT belgeleri oku (yoksa §4'teki L0-L1-L5'i hemen oluştur — 3 dosya, 10 dakika)
- [ ] `git log --oneline -10` + `git status` — neredeyim?
- [ ] Son handoff var mı? Varsa echo doğrula (§3.4).
- [ ] CODEMAP.md var mı ve güncel mi? Yoksa `scripts/codemap.*` ile üret/güncelle; araç yoksa üretim yolunu STATE'e not et. CODEMAP elle düzenlenmez.
- [ ] DERSLER.md yoksa oluştur; ilk kayıt: bu oturumda öğrendiğin ilk tuzak.
- [ ] Test komutunu bul ve bir kez koştur (baseline).
- [ ] Durum dosyasına ilk damganı at (kullandığın sözleşme sürümünü de yaz: v1.4).





