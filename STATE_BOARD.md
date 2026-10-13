# STATE_BOARD â€” paseo-plugin

## Aktif iÅŸ
Yok (v0.11 kilitli: K-0018 Provider-Modlar uygulandÄ±). â€” K-0013/K-0014 gÃ¼n-iÃ§i uygulamasÄ± tamam (v0.9 kilit: bekÃ§i; iskelet 4 tedavi reposunda; pano v1; sondaj schedule + baseline koÅŸuyor).

## Son damgalar
- 2026-10-14 · kapsul v3+v4 derin analiz: raporlar/plan-analiz-2026-10-14/kapsul-v3.md (63,2/100) + kapsul-v4.md (70,2/100) · v4 testler canli: test:legacy-reference exit 0 (32+62 PASS), check:package exit 0 · ACCEPTANCE 52/52 NOT_RUN, CLOSURES 20/20 NOT_RUN, 148KB sema dogrulandi, karantina tasarimi dogrulandi · hedef paketlere dokunulmadi (commit yok, analiz raporu)

- 2026-10-14 - ordu-v3 derin analiz: raporlar/plan-analiz-2026-10-14/ordu-v3.md - 54.2/100, kabul.csv guncel 31/65 NOT_RUN (R), npm test 115/115 yesil (R), LAN par2/par8 + heartbeat LLM-poll celiskileri dogrulandi, 8 kanit turu - codemap 122 dosya, saglik 17 OK/1 SARI
- 2026-10-11 kurulus: repo+GitHub push · Plan v1.4+REHBER senkron (K-0002) · saglik.ps1 v3 · Ferman 2: paseo-verimlilik kuruldu · v0.2 pitbull (K-0004) · v0.2.1+v0.3 (K-0005) · v0.4 echo kapisi+onboarding CANLI (K-0006)
- 2026-10-12 sabah: v0.5 hedefler.json SSOT+surumler (K-0007) · v0.5 UI dogrulandi · v0.5.1 anlasilmazlik sayaci · v0.5.2/3 pitbull sinifi+zincir-kontrol (K-0008) · v0.5.4 karsi-review+Unicode fix (K-0009) · v0.6 ayar.json+isaretci (K-0010) · v0.7 woo-block B1-B5 (K-0011) · v0.8 ucuncu review 8+2 (K-0012)
- 2026-10-12 ogle-sonrasi: K-0013+K-0014 ONAY+UYGULAMA (bekci koprusu v0.9, iskelet 4 repo, sondaj schedule, Ferman 3+4) · K-0015+K-0016 rol sistemi v0.10 (3bbc625, 160 test) · K-0017 gelen-kutu kanali (v0.10.1) · K-0018 Provider-Modlar ONAY · v0.10.3 mod telemetri · v0.11 KILIT (277df7c, 196 test)
- 2026-10-12 aksam: HANDOFF-1336 + HANDOFF-2040 · K-0019+K-0020 taslaklari (pano iskelet + ordu semasi)
- 2026-10-13 gece: mockup v11.1-11.3 mobil fix · denetim tur-2: 28 bulgu (6Y/8O/14D) · HANDOFF-1200 echo dogrulandi
- 2026-10-13 sabah: PANO BEYNI canli (e4ae439: pano.ts kopru 127.0.0.1:4378) · ORDU-PLAN v1 -> v1.1 kapasite -> v1.2 bench 3 eksen -> v1.3 Hakimiyet Okulu
- 2026-10-13 ogle: K-0033 ikili temsil TASLAK->ONAY + F1 TAMAM (planmd 19 test) · ORDU-PLAN v1.5 long-runner · F2 TAMAM (/ordu+spawn kuyrugu, 12 test) · DESIGN.md 11 sekme · mockup 89dd267 + v2 b82dd3f
- 2026-10-13 denetim+kilit dalgasi: D2-07/08/09/10/13/14/15 + BK-01 + R3-05/07/08/09 (plugin 33d7e8d..38868a9, suit+tsc exit 0) · K-0031 pano izole prototip (4fc58ee) · v0.12-v0.18 KILIT serisi · K-0020 revizyonu (onay acik) · 6-subagent denetim 58 bulgu · v11 damga telafisi
- 2026-10-13 aksam: HANDOFF-1515 · v0.20 locDelta (b5acdef) · v0.21 metrik paketi (8f2ba0d) · HANDOFF-2014 acil devir

- 2026-10-13 03:21 · mockup v11.1-11.3: psat/fview mobil taşma fix + bottom-sheet paneller (nav/chat) + composer sabit + galeri.html (7 gerçek PNG, CDP hattı) + cek.mjs + tab-toggle sticky · rozet "10 çalışıyor" kaldırıldı · DERSLER +3 · HANDOFF-2026-10-13-0321.md

- 2026-10-13 · 6-subagent denetim tur-2: 28 bulgu (6 yüksek/8 orta/14 düşük) → gelen-kutu/denetim2-2026-10-13 (md+json) · yüksekler: roller.ts zincir auto-allow üçlüsü (D2-01/02/03) + permission.ts $() ikamesi (D2-04) + K-0020 durdurur/archive çelişkisi ve emirler.json otoritesi (D2-05/06) · v0.13 fix'leri bağımsız doğrulandı (A2-1/2/3, A5-1 diskten) · A3-1/2 kapandı (22/22 modül testte) · A1-1/2/3/4 hâlâ işlenmemiş

- 2026-10-13 12:35 · HANDOFF-2026-10-13-1200 yeniden yazildi + diskten dogrulandi (3 echo sorusu; gelen-kutu acik: denetim-1 37, denetim-2 23) · zincir 8/8 OK, saglik 17 OK / 0 EKSIK / 1 SARI · CODEMAP tazelendi (97 dosya)

- 2026-10-13 · PANO BEYNI canli: paseo-verimlilik e4ae439 (push'lu) — server/pano.ts koprusu 127.0.0.1:4378 (node:http, fail-closed PANO_TOKEN) + Pano workspace paneli (openBrowser ile sekme) + pano.durum RPC · paseo-pano 407df89 (yerel) — orkestra.html beyin yuzeyi (ajan izgarasi SSE, gonder/yarat/izin/arsivle POST) · canli dogrulandi: /api/durum+ajanlar 200 gercek ajan verisi, POST 403 fail-closed, SSE ajanlar akisi · typecheck temiz, plugin running

- 2026-10-13 · plans/ORDU-PLAN-v1.md: K-0020 ordu plani taslaği — komuta zinciri (tek manager kapisi, /ordu slash), emirler.json append-kilit sema + plan-list dashboard satirlari, manager brief 4 bolum (mudahale/sor/asla/rapor), izinler.json 4 eksen (saat/dizin/token/kural, fail-closed), coder↔tester otonom dongu + retro, 6-ajan duzeni (1 manager CERRAH + 3 coder + 2 tester), 4 faz (F1 temel → F4 otonom) · 4 acik soru kullaniciya birakildi · CODEMAP 98 dosya

- 2026-10-13 · ORDU-PLAN v1.1: kapasite ekseni (token/sure/limitsiz, kimi-k3 codefast icin hiz siniri) · dis LLM'ler custom provider ile tek-tip ajan (GLM/DeepSeek/Qwen, parent=subagent farki yok) · pitbull profilleri (gozcu/takipci/vekil) + kullanici.md vekil standardi · ogrenen yonlendirici dongusu (olc-kaydet-enjekte-yonlendir, yonlendirici.json) · F0 onkosul: provider config sablonu · acik sorulara 5-7 eklendi

- 2026-10-13 · ORDU-PLAN v1.2: benchmark 3 eksen (HIZ: tur/ilk-yanit/token-sn · KALITE: kabul%/deneme/vekil · UYUM: kural-ihlali+sozlesme disiplini+proje-stack basarisi) + yonlendirici.json skor vektoru (gorev-tipine gore agirlik) + bench→canli agirlik kurali · API yonetimi pano altinda (Saglayicilar sekmesi, anahtar maskeli/POST-only, config.json yedekli yazim, baglanti-sina) · F0 genisledi, F5 bench kosucu · acik sorulara 8-9 eklendi

- 2026-10-13 · ORDU-PLAN v1.3: HAKIMIYET OKULU — taze oturumda indeks (5 eksen: kural/arac/durustluk/repo/disiplin) · kirilamayanligin 4 kilidi (gizli kriter + rastgele tohum + tuzak gorev + capraz dogrulama; ajan beyani kanit degil) · iteratif+adaptif egitim dongusu %100 hedef, plateau'da insan · mezuniyet rozeti + kural degisince regresyon sinavi · yonlendiricide uyum = genel rapor + okul indeksi; mezun olmayan kritik gorev alamaz · karar: anahtarlar panodan (soru 9 kapandi) · F6 okul

- 2026-10-13 · K-0033 TASLAK + ORDU-PLAN v1.4: IKILI TEMSIL sistemin kalbi — insan yuzeyi plan.md (kisitli md, satir-basi) ↔ makine cekirdegi emirler.json (tek otorite, append-kilit) · derleyici manager LLM (yazamaz, taslak uretir) · dogrulayici deterministik checker (schema+tek-id+dongusuz-bagimlilik+olculebilir-kabul+izinli-dizin) + round-trip md geri-uretimi · drift kilidi: cakismada insan kazanir, json yeniden derlenir · ordu kurallari da ayni hat (ordu.md ↔ ordu.json) · DAG reddedildi, satir-liste yeterli · F1 kalbi bu oldu

- 2026-10-13 13:20 · v0.19 FIRTINA (K-0032, 6 subagent): plugin `3ae1826` v0.19-kilit push`lu (mod+eslesme, EK-5, LOC telemetri locDelta/etkinLoc, pitbull 8dk, briefTaslakUret, k3Bitis) · REHBER v2.1 + K-0032 · RIBAK A6: 9 bulgu (1 yuksek R3-01 dahil 4 islendi, 5 dusuk backlog) · tsc+test exit 0 · K-0033 baska ajandan (commit sahibinde)

- 2026-10-13 · K-0033 ONAYLANDI + F1 TAMAM: planmd.ts (parser+checker: tek-id/dongusuz/olculebilir-kabul/izinli-dizin + round-trip + append-kilit birlestir) · pano koprusu +/api/plan +/api/repolar +plan-kaydet/plan-derle/plan-uygula eylemleri · orkestra.html Plan sekmesi (md editor, drift banner, kod-satiri liste) · test/planmd.test.ts 19 assertion yesil, tam suit+tsc 0 · canli: 15 repo, plan GET 200, POST fail-closed 403 · k3Bitis: tarih belli degil (kullanici), geri sayim pasif

- 2026-10-13 · ORDU-PLAN v1.5: HEDEF-KOKLU LONG-RUNNER — topoloji = satir-listesi+once (ayri DAG motoru yok, checker dongusuzlugu zorunlu, dashboard topolojik katman) · hedefler.md↔hedefler.json (tip: hiz/kalite/ui/test, metrik DETERMINISTIK script olcer — ajan kendi metrigini olcemez) · dongu: olc→dene(worktree)→yesil kapi→kilitle/geri-al → DERSLER'e iki yonde ders · self-healing: regresyon ana dala giremez · plateau: 5 deney <%2 → insan · frenler: butce/izin/geri-alinabilirlik/dur-dugmesi/metrik degisikligi yalniz insan · F7 eklendi (7 faz tamam)

- 2026-10-13 · F2 TAMAM: /ordu slash → orduEmir RPC (manager yoksa yaratir, MANAGER_BRIEF ile, label ordu=manager) · spawn hatti: manager spawn-kuyruk.jsonl'e append eder (append-only), plugin 5sn poller isler, sonuc spawn-sonuc.jsonl'e (append-only) · max-paralel fren (maxCoder 3/maxTester 2/maxToplam 6, ordu.json override) · test/ordu.test.ts 12 assertion yesil, tam suit+tsc 0 · CANLI: hatali kayit → red "zorunlu alan eksik" sonuc dosyasinda dogrulandi · not: reload sonrasi paseoRef ilk agent event'ine kadar null, poller bekler (kendini iyilestirir)

- 2026-10-13 · paseo-pano DESIGN.md v1: 11 sekme tasarimi — Graf sekmesi tam rontgen (katman bantlari, dugum kartlari, 5 manuel mudahale: yeniden-kos/yeniden-ata/durt/durdur/kabul-duzenle) · Onay kutusu insan-dongude kalp · layout: header+sabit sol menu, badge'ler · kod-satiri estetigi, renk=durum+metin · tek SSE kanali, tembel GET · fail-closed gostergeleri · yapilmayacaklar: file-manager/DAG-motoru/modal

- 2026-10-13 · mockup13ekim.html (paseo-pano 89dd267): 11 sekme tam UI mockup vanilla — canli dogrulandi (gecici http + paseo browser: 11 sekme render, graf 5 dugum katmanli, 0 konsol hatasi) · bulunan hata: cok-satirli JS string (textarea demo verisi) — tek satira indirildi · DESIGN.md'e React Flow ertelendi kaydi (ileri faz, render katmani degisimi yeterli)

- 2026-10-13 · mockup13ekim v2 (paseo-pano b82dd3f): v11 tasarim dili uygulandi — ikon-rail (60px, inline SVG, emoji yok) + sol flyout dock (VS Code modeli: ayni ikon 2. tik kapatir) + sag inspector dock (dugum tikla → detay; header'dan kapanir) · canli dogrulandi: 11 ikon/11 sekme 0 hata, flyout toggle, dugum→dock detay "S4-04", dock toggle · gecici dosyalar silindi

- 2026-10-13 15:15 · restart-oncesi devir: HANDOFF-2026-10-13-1515 (k3Bitis 25 kokte yazili + plugin reload OK + BK-01 kayitli fd2041e) · kullanici "devam et" deyince: firtina aktivasyon dogrula -> toplu onay paketi -> triage dalgasi

- 2026-10-13 15:55 · v0.20 (b5acdef, push+tag): commit-aware locDelta (BK-02, yuksek, mini-olcumde yakalandi) + saatlikLoc ayni-alt-kume (R3-06) · 3 test yeni · tsc+test exit 0 · review3 acik: R3-05/07/08/09 (dusuk)

- 2026-10-13 16:40 · v0.21 metrik paketi (8f2ba0d, push+tag): decodeTps + test-kirmizi orani + halusinasyon-ref sayaci + ort stall · 10 yeni assertion, tsc+test exit 0 · not: v0.21 blogu ilk yamada ajanTemizle capasina oturdu (iki aktifTur azaltmasi vardi) — capa seciminde tekrar-eden-satir kontrolu sart

- 2026-10-13 20:14 · baglam %90 acil devir: HANDOFF-2026-10-13-2014 · v0.21 push+tag (8f2ba0d) · reload 16:03 UTC OK · W42 rollup 5 repo · zincir duzeltmesi commit bekliyor (1707+2014)

## Bekleyen onaylar
- K-0019/K-0020 plugin-entegrasyonu: KOPRU CANLI (e4ae439 + 407df89, 2026-10-13) · kullanici gozden gecirmesi: Pano paneli → sekmede ac · K-0020 acik sorular surer: emirler.json otoritesi, yaratici-worktree kapisi · yazma icin daemon'a PANO_TOKEN env gerekli

## v2.1 backlog
- v0.8 adayÄ±: telemetri failedCalls'a araÃ§-adÄ±/hata detayÄ± alanÄ± (kalite dÃ¼rtmesi "hangi 59 Ã§aÄŸrÄ±" sorusunu cevaplayamÄ±yor) + TDD kÄ±rmÄ±zÄ±-koÅŸu desenlerini (npm test, vitest) sayaÃ§tan hariÃ§ tutma seÃ§eneÄŸi.
- Ã‡EKÄ°RDEK kural diyeti: aktif kural sayÄ±sÄ± 68 â†’ <40 hedefi iÃ§in EK'lere taÅŸÄ±ma (doctor SARI'sÄ±; enjeksiyon â‰¤8KB freni yeterli, plugin Ã¶ncesi ÅŸart deÄŸil).
- 2026-10-14 · ORDU-CORE-BAGIMSIZLIK-PLAN.md v0 TASLAK (onay bekler): core plugin'den ayrik OS servisine · Paseo=adaptor #1, ham-LLM=#2, tool-runner=#3(v2) · dosya SSOT korunur (K-0020 sorusu kapanir), SQLite ileri faz · fazlar C0-C5: ayrima -> native pano -> onay kutusu+STOP -> routing -> self-learn -> uzaktan · codemap+saglik exit 0 (17 OK, 1 SARI)

- 2026-10-14 · BAGIMSIZLIK-PLAN v0.1: otonomi derin analizi sonrasi 3 ithal islendi — qwen (8 kart + stale + mod profilleri + butce frenleri) · ordu-v3 §30 (4 ogrenme kanali + F1-F6 + 3-sprint tanimi) · gpt v3 (scheduler + notification outbox + quiet-hours) · soy haritasi §7 · fazlar C0-C5 guncellendi · codemap+saglik exit 0 (17 OK, 1 SARI)

- 2026-10-14 · plans/MASTER-SSOT-PLAN.md v1.0 TASLAK (onay bekler; KULLANICI KURALI: onaysiz uygulama kodu yazilmaz): 15 bolum eksiksiz master — cekirdek dongu/5 ilke/rol modeli/durum makinesi/adaptor sozlesmesi/bagimsizlik matrisi/veri sozlesmeleri/otonomi katmani/pano/fazlar C0-C5/LOC butcesi/yapilmayacaklar/soy haritasi · STATE_BOARD rolling-window sikistirma 102->65 satir

- 2026-10-14 · MASTER-SSOT-PLAN v2.0 TASLAK (v1.0 SUPERSEDED — 3 review 65/64/60 ONAYLANMADI; 6 subagent derin analiz birlesimi): yonetisim=dorduncu platform DEGIL, ordu-v3/ordu-core ust otorite + K-0034 alt-plan rolu · otorite=3 katman (md niyet / manifest sozlesme / SQLite defter) · kalin adaptor (findByCorrelation/fence/iptal-teyit) · guven zinciri 14-alan receipt + A13 sahte-PASS · faz sirasi guvenlik-once F0-F6 (UI F3'e, 11 ekran F6'ya) · pano 3 bolum + bagimsiz web · 9 kart (8+ogrenme-onerisi) · ogrenme: karantina+canary=regresyon kontrolu · LOC durust 8-13k · kapilar kabul.csv NOT_RUN · codemap+saglik exit 0 (17 OK, 1 SARI bilinen)

- 2026-10-14 · MASTER-SSOT-PLAN v2.1: kullanici metrik direktifi islendi — §16 metrik katmani (oncelik: guvenli teslim>recovery>otonomi>hiz>ogrenme; 5 ana gosterge; 15 alan; kimlik zinciri parent->attempt->evidence; handoff 7-oge paketi; olcum hatasi kurallari) · §8 dashboard=5 gosterge kurali · codemap+saglik exit 0 (17 OK, 1 SARI)

- 2026-10-14 · MASTER-SSOT-PLAN v2.2: puanlama v3.2 hizalamasi (§17) — 41.3 puani kanitsizliga bagli; 7 ortak acik -> kapi eslemesi (F1 canli PASS, F4 schedule M08-M10, F2 handoff.schema.json + kimlik zinciri, F5 eslenmis deney + benchmark) · 3 kritik acik -> F2 guvenlik/recovery canli kapilari (M26/M31, kill -9, STOP restart; F3'e gecis sarti) · §17.3 canli test onay paketi kullaniciya sunuldu · codemap+saglik exit 0 (17 OK, 1 SARI)
- 2026-10-14 · MASTER-SSOT-PLAN v2.3: kullanici duzeltmeleri islendi — 4-katmanli eksik ayrimi (tasarim/uygulama/kanit/basarisiz; NOT_RUN!=basarisiz) · v3.2 puanlari tasarim puanlariyla karsilastirilamaz notu · eski bulgu=guncel kodda dogrulanmadan 'hala var' denemez kurali · §5 teslim ekseni (uretildi/dogrulandi/teslim/kabul/merge) · §18 tek kapanis listesi (P0-1..P2-8: kod yeri+kabul testi+kanit+durum) + baglayici sira · ORDU-CORE CANLI DOGRULAMA: npm test 83/83 pass exit 0 (R, node v24.18.0) — onceki 51/51 ve 59/59 iddialari guncel degil · codemap+saglik exit 0
- 2026-10-14 · MASTER-SSOT-PLAN v2.4: §19 donmus cekirdek + halka modeli (4 halka: adaptor/projeksiyon/politika/yuzey; 4 koruma kurali: cekirdek semasina dokunma yok, event append-only, her halka kendi testi + 83/83 yesil sarti, cekirdek degisikligi=ADR+kirmizi test; faz eslemesi) · kullanici onayiyla islendi · codemap+saglik exit 0

- 2026-10-14 · 6-SUBAGENT DERIN ANALIZ TAMAM (raporlar/plan-analiz-2026-10-14/): siralama MASTER-SSOT v2.4 73.5 · ordu-core 73.3 (102/102 exit 0, eski 4 bulgu KAPALI, 3 yeni acik) · kapsul-v4 70.2 · final 67.3 (verify.py FAIL, manifest bayat dogrulandi) · blueprint 65.7 · kapsul-v3 63.2 · qwen 61.2 · ordu-v3 54.2 (NOT_RUN 31/65, LAN+heartbeat iddialari DOGRU) · gpt 50.4 (oz-puan 58.9 bayat, verify.mjs KIRMIZI) · MASTER-SSOT v2.5: ic-celiski duzeltmeleri (102/102 tekillesti, §19/§10 F0) · codemap+saglik exit 0