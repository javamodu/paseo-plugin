# ORDU PLANI v1 — composer'dan ajan ordusuna (K-0020 uygulama plani)

Tarih: 2026-10-13 · Durum: TASLAK (kullanici onayi bekler) · Ilgili: K-0019, K-0020, K-0031, pano koprusu (e4ae439)

## 0. Amac ve sinir

Composer'a tek emir: "sprint 4-5'i tam bitir; llm1 coder, llm2 manager; takilirsa bana sor."
Sistem: emri plan satirlarina boler, 6 ajana dagitir, dashboard'a satir satir isler, metrikleri yaninda gosterir, izin matrisi disina cikani durdurur, testleri kendisi kosar, yesil gorene kadar durtur.

Sinir (durustluk): ordu kendini "gelistirmez" — kod yazar, test eder, DERSLER'e ders isler; ogrenme = kayit disiplini + retro, sihir yok.

## 1. Komuta zinciri

```
sen (composer, dogal dil)
  └─ MANAGER (1 ajan, CERRAH mod, sabit: uzun yasayan)
       ├─ emirler.json  ← tek otorite (append-kilitli, K-0020 D2-06)
       ├─ CODER xN (is yazar, worktree'de)
       └─ TESTER xM (test kosar, raporlar; kod YAZAMAZ)
```

- Manager tek kapi: sen sadece manager'a konusursun; worker'lara dogrudan emir yok (kural ihlali sayilir).
- Manager'a ulasim: pano orkestra.html'den "gonder" veya composer'dan. Composer emri nasil manager'a duser: plugin before("agent.create") hook'u emirleri etiketler; ya da /ordu slash komutu (client) → manager'a send. v1: /ordu slash komutu (belirleyici, magic yok).
- Worker spawn: manager pano koprusu POST /api/emir {eylem:"yarat"} ile acamaz (kopru kullaniciya ait). Manager spawn'i SDK uzerinden degil, plugin hook'u uzerinden: manager'in ozel formatli mesaji ("SPAWN: {...json}") plugin server'da yakalanir → paseo.agents.create. Boylece spawn tek noktadan sayilir, max-paralel freni burada.

## 2. emirler.json — plan listesi semasi (dashboard'un satirlari)

Konum: hedef repo kokunde `.verimlilik/emirler.json`. Tek yazar: plugin server (manager bile dosyaya dogrudan yazamaz; "EMIR: {...}" mesaji plugin'de islenir → append-kilitli).

Her satir (gorev):
```json
{
  "id": "S4-01",
  "baslik": "login akisi refactor",
  "durum": "bekliyor|atanan|kosuyor|testte|bloklu|bitti|iptal",
  "sahip": "agentId|null",
  "dizin": "src/auth",
  "kabul": "npm test auth yesil + lint temiz",
  "bagimlilik": ["S3-07"],
  "deneme": 0, "maxDeneme": 3,
  "tokenButce": 200000, "tokenHarcanan": 0,
  "baslama": null, "bitis": null,
  "not": "manager notu"
}
```

Dashboard (orkestra.html'e "Plan" sekmesi): her gorev = kod-satiri gibi tek satir:
`S4-01  [kosuyor]  login akisi refactor  → coder-2  ·  12:04  ·  84k/200k tok  ·  deneme 1/3`
Renk: durum bazli. Yaninda metrik: gecen sure, token, kalan butce cubugu. SSE ile canli (mevcut kopru altyapisi hazir).

## 3. Manager brief'i — neye gore cevap verir, neyi yapamaz

`manager.md` (pano dizininde, enjekte edilir). Dort bolum:

(a) MUDAHALE ET (kullaniciya sormadan):
- worker 10 dk sessiz → durtur (bir kez); 20 dk → yeniden atama
- test 2. kez ayni hatada kirildi → coder'a hata ozetiyle geri gonder
- gorev tokenButce %80 → kullaniciya bildir, %100 → durdur
- izin istegi izin-matrisi icindeyse → zaten plugin otomatik cevaplar (permissionKontrol), manager'a dusmez

(b) KULLANICIYA SOR (asla kendi karar verme):
- izin-matrisi disi dizin/komut istegi
- maxDeneme asildi (3. kez kirmizi) → "devam / atla / iptal?"
- emirler.json'da olmayan yeni kapsam (scope kaymasi)
- butce tavani asilacak

(c) ASLA YAPAMAZ:
- izinler.json disi dizine yazma, force-push, canli sunucuya test, kendi brief'ini degistirme
- max paralel asimi (fren plugin'de, manager istese de olmaz — fail-closed)
- emirler.json'a dogrudan yazma (append-kilit, D2-06)

(d) RAPOR FORMATI: her sprint sonu: biten/kalan satirlar + token + kirmizi test ozeti + DERSLER adayi (negatif bilgi). Tek blok, sahte yok.

## 4. izinler.json — izin matrisi (dort eksen)

Konum: `.verimlilik/izinler.json`. Plugin permissionKontrol'e beslenir (mevcut rolIzinKontrol'un genellemesi).

```json
{
  "saat": { "aktif": true, "pencere": "09:00-23:00", "disinda": "sor" },
  "dizin": { "izinli": ["src/", "test/", "docs/"], "yasakli": [".git", "node_modules", "prod-config/"] },
  "token": { "saatlikTavan": 500000, "gunlukTavan": 3000000, "asim": "durdur+sor" },
  "kural": { "izinliDesenler": ["npm test*", "npm run lint", "git add*", "git commit*"],
             "yasakliDesenler": ["git push --force*", "rm -rf*", "curl*prod*"] }
}
```

Karar sirasi: yasakli her zaman kazanir → dizin → kural → saat → token. Hicbiri eslesmezse: kullaniciya sor (fail-closed, sert fren — D2-05).

## 5. Otonom dongu (coder ↔ tester) ve kendini gelistirme

```
coder gorevi yazar → "BITTI: S4-01" der
  → plugin yakalar → tester'a "TEST: S4-01" spawn
  → tester npm test kosar (izinli desen, otomatik)
  → YESIL: satir "bitti", damga, manager'a rapor
  → KIRMIZI: deneme++, cikti ozeti coder'a geri (max 3)
  → 3. kirmizi: durum "bloklu" → manager kullaniciya sorar
```

Kendini gelistirme = retro dongusu: sprint sonunda manager gorevi: kirmizi test kokenlerini DERSLER.md'ye "denendi-patladi-sebebi" formatinda isle + emirler.json kabul kriterlerinde hep patlayan kalibi one cikar. Ogrenme diske iner; sonraki sprint brief'ine DERSLER zaten enjekte olur (mevcut mekanizma).

## 6. 6-ajan duzeni onerisi

| Rol | Adet | Mod | Not |
|---|---|---|---|
| manager | 1 | CERRAH | uzun omurlu, tek kapi, brief'li |
| coder | 3 | ATOLYE | her biri ayri worktree (K-0020 yaratici-worktree) |
| tester | 2 | SERBEST | kod yazamaz (izinler.json kural: yalniz test desenleri) |

max paralel: coder 3 + tester 2 tavani plugin config'de; manager sayilmaz. Dizin cakisma freni: ayni worktree'ye iki coder atanamaz (emirler.json sahip alani tek).

## 7. Dashboard genislemesi (orkestra.html)

- "Plan" sekmesi: emirler.json satirlari (kod-satiri gorunumu) + SSE canli
- "Metrik" sekmesi: mevcut telemetri (tur, kabul orani, token, maliyet) + sprint bazli gruplama
- "Izin" sekmesi: izinler.json gorunumu + bekleyen sorular (manager'in sorduklari, sen cevaplarsin)
- Salt-okur varsayilan; yazma PANO_TOKEN ile (mevcut fail-closed)

## 8. Fazlar ve kabul kriterleri

- F1 (temel): emirler.json semasi + plugin append-kilitli yazici + orkestra.html Plan sekmesi (salt-okur) + manager.md brief sablonu. Kabul: 2 gorevlilik senaryo dashboard'da satir satir canli.
- F2 (komuta): /ordu slash komutu → manager spawn/yonlendirme + SPAWN/EMIR mesaj yakalayicilari + max-paralel freni. Kabul: composer'dan tek emirle 3 coder calisir, 4. istek reddedilir.
- F3 (frenler): izinler.json dort eksen + permissionKontrol entegrasyonu + token sayac (telemetri.jsonl'den). Kabul: yasak desen aninda red + log, butce %100'de dur.
- F4 (otonom): tester dongusu + retro gorevi + DERSLER isleme. Kabul: kirmizi→coder→yesil dongusu insan eli degmeden 1 tur doner.

Her faz ayri commit + damga; F2 oncesi K-0020 karar kaydini revize et (manager LLM modu: CERRAH karari burada kesinlesir).

## 9. Acik sorular (kullaniciya)

1. izinler.json saat penceresi ve token tavanlari: yukaridaki degerler taslak — senin sinirlarin ne?
2. Manager hangi provider/model? (maliyet vs kalite: manager uzun yasayacak, ucuz+hizli mi, guclu mu?)
3. emirler.json tek repo mu, cok repo mu? (cok repo: her repo kendi dosyasi + pano toplar)
4. Worktree birlestirme: coder worktree'si bitince ana dala kim birlestirir — otomatik mi (test yesilse), elle mi? (K-0020'de oneri: elle)

---

# v1.1 GENISLEME (2026-10-13) — cok-saglayicili otonom ordu

Girdi: kimi-k3 gibi tokensuz/sureli abonelikler · dis LLM'ler (GLM, DeepSeek, Qwen) · cok-modlu pitbull'lar · "kullanici gibi dusunen" vekil · kendi kendini denetleyen/ogrenen sistem.

## 10. Kapasite modeli — token her zaman yok

> Uyum notu (2026-10-13, v0.19 firtina sonrasi): kapasite "sure" tipi = K-0032/EK-5 sure ekonomisiyle ayni eksen · pitbull sessizlik esigi plandaki 10dk degil, plugin'de 8dk (K-0032) — plan 8dk'yi baz alir · LOC telemetrisi (locDelta/reworkOrani) kalite eksenine girdi olur · R3-01 dersi: provider-bazli kurallar model null gelebilir, provider-seviye fallback sart.

izinler.json'un "token" ekseni genel "kapasite" eksenine donusur, provider basina:

```json
{
  "kapasite": {
    "codex/gpt-5.4":   { "tip": "token",    "saatlikTavan": 500000, "asim": "durdur+sor" },
    "kimi/k3-codefast":{ "tip": "sure",     "pencere": "abonelik-bitisine-kadar", "hizSiniri": "dakikada-6-tur", "asim": "kuyruga-al" },
    "zai/glm-4.6":     { "tip": "limitsiz", "hizSiniri": "dakikada-4-tur" }
  }
}
```

- token: mevcut sayac (telemetri.jsonl).
- sure: abonelik donemi icinde token sayilmaz; fren = hiz siniri (rate limit) + saat penceresi.
- limitsiz: yalniz hiz siniri ve kural ekseni calisir.
- Dashboard satirinda metrik, tipe gore degisir: "84k/200k tok" veya "bugun 47 tur · hiz 4/dk".

## 11. Dis LLM'ler orduya katilir — subagent mi dis ajan mi: EVET, ikisi de

- GLM (Z.AI, Anthropic-uyumlu), DeepSeek (OpenAI-uyumlu), Qwen (Alibaba) → `~/.paseo/config.json` `agents.providers` altina custom provider olarak eklenir (resmi destek; `paseo reload` yeter, daemon restart yok).
- Eklendikten sonra hepsi TEK TIP ajan: manager `agents.create({ config: { provider: "zai/glm-4.6" }, parent: managerId })` der → subagent. Parent vermezse bagimsiz dis ajan. Manager icin fark yok; koprude/dashboard'da "parent" rozeti gorunur.
- Atama karari manager'da ama frem plugin'de: max paralel + kapasite + izinler her saglayiciya aynen uygulanir. Dis LLM "ucuz" diye kontrolsuz kosamaz.
- SPAWN mesaj semasi provider alani tasir: `SPAWN: {"provider":"deepseek/deepseek-chat","rol":"coder","gorev":"S4-02"}`.

## 12. Pitbull modlari (mevcut pitbull.ts genisler)

Her worker'a 1+ pitbull profili baglanir; profil config'de tanimli, hepsi manager'a raporlar:

| Profil | Davranis | Benzetme |
|---|---|---|
| gozcu | izler, sessizlik/odak kaybi raporlar; mudahale yok | kamera |
| takipci | bitis kriteri yesil olana kadar durtur, birakmaz | pitbull |
| vekil | kullanici.md standardina gore ciktiyi okur; "ben olsam reddederdim" → geri gonderir | sen |

- vekil icin `.verimlilik/kullanici.md`: SENIN standartlarin — red sebeplerin, kalite barin, "ben olsam ne sorardim" listesi. Sen yazarsin/guncellersin; sistem her denetimde enjekte eder. Dosya yoksa vekil pasif (sahte denetim yok — durustluk).
- pitbull kararlari kayda duser: hangi profil, kimi, neden geri gonderdi → telemetri (kim iyi durtuyor olculur).

## 13. Kendi kendini denetleyen/ogrenen dongu

Olç → kaydet → enjekte → yonlendir:

1. OLC: her tur telemetri.jsonl'e iner (var) + pitbull kararlari eklenir.
2. KAYDET: sprint retrosu (manager gorevi) — model × is-tipi kabul orani tablosu `.verimlilik/yonlendirici.json`'a islenir; kirmizi kokler DERSLER'e.
3. ENJEKTE: DERSLER + kullanici.md + yonlendirici ozeti her yeni ajan brief'ine otomatik girer (mevcut enjeksiyon mekanizmasi).
4. YONLENDIR: manager bir sonraki atamada tabloya bakar — "refactor'da glm %70 kabul, codex %90 → refactor codex'e".

Ogrenme iddiasi = bu dongunun kaniti. Tablo yoksa "ogreniyor" demeyiz.

## 14. Faz guncellemesi

- F3'e ek: kapasite ekseni (token/sure/limitsiz) + hiz siniri.
- F4'e ek: vekil pitbull + kullanici.md + yonlendirici.json.
- F0 (onkosul, sende): dis provider'lari config.json'a ekleme (GLM/DeepSeek/Qwen anahtarlari) — ben sablonu hazirlarim, anahtarlari sen girersin.

## Acik sorulara ek (v1.1)

5. kimi-k3 "codefast" aboneliginin hiz sinirini biliyor musun (dk/tur)? bilmiyorsan muhafazakar 4/dk ile baslariz, telemetri olcer.
6. kullanici.md'yi ilk kez kim yazsin: ben taslak cikarayim (son damgalardan), sen mi duzenlersin?
7. vekil hangi modelde kossun? (denetim icin guclu model sart mi, yoksa ucuz model + siki kural yeter mi)

---

# v1.2 GENISLEME (2026-10-13) — benchmark + API yonetimi

## 15. Benchmark — yonlendiricinin tohum verisi (3 eksen, ayri olculur)

Telemetriyle ogrenme sifirdan yavas baslar; bench tohum verir. Her provider x is-tipi icin skor TEK sayi degil, 3-boyutlu vektor: { hiz, kalite, uyum }.

- Bench paketi: `.verimlilik/bench/` altinda sabit 6 gorev: bug-fix, refactor, test-yaz, docs, desen-uygula, kucuk-ozellik. Her biri: ayni prompt + olculebilir kabul kriteri (test komutu) + zorluk etiketi. Uyum olcumu icin paket HEDEF PROJENIN stack'inden alinmis gercek mini-gorevler icerir (sentetik + proje-gercegi karisimi).
- Kosu: yeni provider eklenince (veya istenince) manager "BENCH: provider" gorevi cikarir; her gorev izole gecici worktree'de, TEK tur hakki (adil kiyas), izinler.json ve max-paralel aynen gecerli (bench de fail-closed).

### Eksen 1 — HIZ (olcum: zaman)
- ilk-yanit suresi, tur suresi, cikti hizi (token/sn). Kaynak: telemetri zaman damgalari.
- Rapor: ms/token ve tur-basi saniye; kapasite tipi "sure/limitsiz" olanlarda hiz ana kiyas ekseni olur.

### Eksen 2 — KALITE (olcum: kabul)
- test yesil mi (0/1), kac denemede yesil, vekil puani (0-5, kullanici.md standardi).
- Rapor: kabul orani % + ortalama deneme + vekil ortalamasi.

### Eksen 3 — PROJEYE UYUM (olcum: kural + baglam)
- kural ihlali sayisi (izinler.json/kapsam/permission redleri — dusuk iyi), sozlesme disiplini (damga atildi mi, commit kurallarina uyuldu mu), proje stack'indeki bench gorevlerinde basari.
- Rapor: ihlal/100 tur + disiplin orani % + proje-gorev kabulu %.
- Bu eksen "genel iyi model ama bizim kurallara uymuyor" vakasini yakalar — ucuz model secip duzeltme maliyeti yememek icin asil fren.

### Skorlama ve yonlendirme
- `yonlendirici.json`: her (provider, is-tipi) icin { hiz, kalite, uyum, kaynak: "bench"|"canli", orneklem }.
- Manager atamada gorev tipine gore agirlik: docs → hiz agirlikli; kritik kod → kalite+uyum agirlikli; deneysel → hiz+kalite. Agirliklar config'de, sen degistirirsin.
- Agirlik kurali (bench→canli): bench skoru ilk 20 gercek turda %50 agirlik; sonrasinda canli telemetri tohumu ezer. Bench "bench" etiketiyle anilir, gercek veriyle karistirilmaz.
- Dashboard: Saglayicilar sekmesinde model x is-tipi 3 eksen matrisi (uc sutun ayri renk, bench tohumu ve canli oran ayri satir).

## 16. API yonetimi — saglayicilar pano altinda

Orkestra.html'e "Saglayicilar" sekmesi; config.json elle duzenleme biter:

- Liste: kayitli provider'lar — id, extends, model listesi, kapasite tipi, durum (anahtar VAR/YOK, son hata, son bench skoru). Anahtar asla geri donmez; UI yalniz maske gorur (`••••3f2a`).
- Ekle/duzenle: `POST /api/provider { id, extends, baseUrl, modeller, anahtar }` → plugin server `~/.paseo/config.json`'a read-modify-write yazar (once yedek: config.json.bak) + `paseo reload` esdegerini tetikler (provider degisimi restart gerektirmez — gelecek lansmanlara uygulanir).
- Anahtar guvenligi: anahtar UI'dan yalniz POST ile server'a gider, GET endpoint'lerinde hic yer almaz, log'a dusmez. PANO_TOKEN fail-closed aynen (yazma kapaliyken provider ekleme de kapali).
- "Baglantiyi sina" butonu: tek turluk mini gorev (sabit kisa prompt) → auth + latency + model adi dogrulamasi; sonuc durum satirina islenir.
- Risk: config.json paylasimli dosya — yazma sirasinda daemon yazarsa cakisma. Onlem: yedek + yazma sonrasi parse dogrulamasi; bozuksa yedekten geri yukle + kullaniciya rapor (sessiz duzeltme yok).

## Faz guncellemesi (v1.2)

- F0 → "Saglayicilar" sekmesi + provider ekle/sina (API yonetimi) olarak genisler.
- F1'e ek: bench paketi (6 gorev) + kabul komutlari.
- Yeni F5: bench kosucu + skor matrisi + agirlik kurali (bench→canli gecis).

## Acik sorulara ek (v1.2)

8. Bench paketi hangi dil/stack'te olsun? (repolarin cogunlugu TS/JS — bench de oyle mi, yoksa cok-dilli mi?)
9. Provider anahtarlari pano uzerinden mi girilecek, yoksa config.json'da elle mi kalir? (pano: rahat ama anahtar HTTP'den gecer — yalniz 127.0.0.1; elle: daha kapali)

---

# v1.3 GENISLEME (2026-10-13) — Hakimiyet Okulu (kirilamayan sinav + egitim)

Kararlar: anahtarlar panodan girilir (soru 9 kapandi). Proje uyumu iki kaynaktan beslenir: genel raporlar (var) + Hakimiyet Okulu olcumu (yeni).

## 17. Hakimiyet Indeksi — taze oturumda, kirilamayan sinav

- Olcum her zaman YENI OTURUMDA: sifir baglam, brief yok, hazirlik yok — ajanin gercek baslangic hakimiyeti olculur. Hazirlikli oturum "okul sonrasi" olcumdur, ikisi ayri raporlanir.
- Sinav `.verimlilik/okul/` altinda; her kosuda sablon + rastgele tohumdan URETILIR (sabit soru yok — ezber kirilsin diye).
- Indeks eksenleri (ayri ayri 0-100):
  1. kural bilgisi: sozlesme/ANAYASA'dan senaryo ("su durumda ne yaparsin") — cevap davranista olculur, sozde degil.
  2. arac hakimiyeti: bilinen tuzaklara dusmeme (rg-glob, apply_patch, BOM...) — DERSLER'deki her tuzak bir sinav senaryosuna donusur.
  3. durustluk: TUZAK gorevler — yapilmasi imkansiz/kapsam-disi istek; dogru cevap "yapamam, raporluyorum"dur. "Yaptim" diyen sifir alir (sahte veri = en agir ihmal).
  4. repo hakimiyeti: CODEMAP/STATE/DERSLER'i gercekten okuyup kullanma (gorev ciktisinda iz aranir).
  5. disiplin: damga, commit kurallari, satir sonu, kapsam siniri — is sirasinda checker dogrular.

## 18. Kirilamayanligin 4 kilidi (ajan kandiramaz)

1. Gizli kabul kriteri: kriter prompt'ta verilmez; dis checker (script) diskten/arac ciktisindan olcer. Ajanin kendi beyani hicbir eksende kanit sayilmaz (altin kural 5'in sinav hali).
2. Rastgele uretim: soru parametreleri her kosuda degisir; onceki sinav ciktilarini gormek fayda etmez.
3. Tuzak gorevler: "yaptim" demenin cezasi, "yapamam" demenin odulu oldugu senaryolar — kandirma motivasyonu tersine cevrilir.
4. Capraz dogrulama: ajanin iddiasi (or. "damga attim") bagimsiz sorguyla dogrulanir (git log); uyumsuzluk durustluk ekseninden duser.

## 19. Egitim dongusu — iteratif ve adaptif, %100 hedefi

```
sinav → eksik eksen raporu → o eksene ozel mini-ders uret (retro + DERSLER + ornek cozum)
  → ders yeni oturum brief'ine enjekte → tekrar sinav (yeni tohum)
  → indeks artana kadar dondur; %100 = MEZUN
```

- Adaptif: gorev secimi zayif eksene agirlik verir (arac hakimiyeti 40 ise bir sonraki set arac-tuzak agirlikli).
- Plateau kurali: 3 ust uste sinavda ayni eksen kipirdamazsa insan mudahalesi — ders materyali yanlis/eksik demektir, manager sana raporlar (kural degisikligi karari sende).
- Mezuniyet: 5 eksenin tamami %100 → mezun rozeti (yonlendirici.json'a "mezun: tarih" islenir, atamada oncelik). Sözlesme/kural seti degisirse mezuniyet duser → yeniden sinav (regresyon).
- Sinav + egitim de fail-closed: ayni izinler.json, ayni max paralel; okul gorevleri izole gecici dizinde kosar.

## 20. Yonlendiriciye etkisi

- uyum ekseni artik iki bilesen: genel rapor ozeti (canli) + okul indeksi (son sinav). Atama kararinda mezuniyet ve indeks agirlikli; mezun olmayan ajan kritik gorev alamaz (yalniz okul/golge gorev).

## Faz guncellemesi (v1.3)

- Yeni F6: okul — sinav uretici + dis checker seti + egitim dongusu + mezuniyet kaydi. F5 (bench) sonrasi; bench "genel yetenek", okul "bizim kurallara hakimiyet" olcer.

---

# v1.4 GENISLEME (2026-10-13) — Ikili temsil: sistemin kalbi (K-0033)

Karar: insan yuzeyi kisitli Markdown (`plan.md`), makine cekirdegi `emirler.json`; derleyici manager LLM, dogrulayici deterministik round-trip checker. DAG/task-graph yok — satir-liste yeterli.

## 21. Insan yuzeyi — plan.md satir formati

Her gorev TEK satir; serbest metin ama bilesenler taninabilir:

```md
## Sprint 4
- [ ] S4-01 login akisini refactor et → coder · kabul: npm test auth yesil · once: S3-07
- [ ] S4-02 auth dokumani guncelle → tester-degil docs-coder · kabul: docs/auth.md var ve linkler calisiyor
- [x] S3-07 token yenileme (bitti 12:40)
```

Kurallar: checkbox = durum · id = tek anahtar · "→" = hedef rol · "kabul:" = olculebilir kriter (checker "olculemez" diye reddedebilir) · "once:" = bagimlilik. Baslik/serbest metin Turkce kalabilir — manager anlar, checker anlamak zorunda degil (yapilandirilmis alanlar ASCII anahtarli).

## 22. Derleme hatti (kod gibi yerlesik)

```
plan.md (sen duzenlersin)
  → manager LLM: md → json TASLAGI (dosyaya yazamaz)
  → plugin checker: schema + tek-id + dongusuz-bagimlilik + olculebilir-kabul + izinli-dizin
  → round-trip: json → kanonik md uret → alan-alan eslestir
  → hepsi YESIL: emirler.json'a append-kilitli islenir + commit + damga
  → TEK KIRMIZI: red + sebep listesi sana doner (sessiz duzeltme yok)
```

- Drift kilidi: md↔json ayriliginda yuzey kirmizi "ESLESMEDI" banner; cakismada INSAN surumu kazanir, json yeniden derlenir.
- emirler.json git'te; her derleme commit + checker ozeti damgasi. Denetim = git diff.

## 23. Ordu yonetimi de ayni hat

Manager'a verdigin ordu kurallari (max paralel, rol atamalari, pitbull baglama) da ayni ikili temsille: `ordu.md` (insan) ↔ `ordu.json` (cekirdek). Tek derleyici, tek checker, iki belge cifti.

## Faz guncellemesi (v1.4)

- F1'in kalbi budur: satir formati + derleyici protokolu + checker. F1 kabul kriteri genisler: sen md'de 3 gorevi elle duzenlersin → checker'dan gecip dashboard'a satir satir duser → bir alani md'den degistirince drift banneri yanar, yeniden derleyince soner.
