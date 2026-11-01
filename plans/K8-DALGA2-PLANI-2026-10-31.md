# K8 DALGA 2 — KAPSAM-KATMANİ YÖNETİM (G10/G11 + O1-O3 + G3/G7/G8; 2026-10-31)

**Kimlik:** K8-DALGA-2. **Kaynak:** [YÖNETİM ARAYÜZÜ planı](YONETIM-ARAYUZ-PLANI-2026-10-29.md) G10/G11 (kullanıcı tespiti 2026-10-31 12:24: «tasarımda proje sekmesi eksik · genel tüm projelerin olaylar ile proje özel olaylar ve projeye ait görevi olayları karışmış · ayırt edici değildir» — tam paket K8-2 onayı) + G3/G7/G8 (2026-10-29 16:1x kapsam genişletmesi) + **omurga emri** (2026-10-31 15:14) + **hard kapı ilkesi** (2026-10-31 17:21 — §0/§H). K8-1 kapanışı: da50e22.

## 0. KULLANICI VİZYONU — OMURGA (emir 2026-10-31 15:14: «bu omurgayı ön plana çıkartıp kahraman yap … temelde göreceğim budur en yalın işin temel omurgası»)

Tuvalin kahramanı üç halkalı tek omurgadır; yan yüzeyler (lejant, jargon) geri plana iner:
1. **PROJE → GÖREV TABLOSU:** hangi görevler var · durumu · fazı · yürütücüsü — PROJELER sekmesinin kalbi GÖREV TABLOSU'dur (yalnız proje listesi değil).
2. **AJAN — NE YAPIYOR, NASIL YAPMALI:** (a) şu an NE yapıyor (son gerçek olay), (b) NASIL yapmalı — talimat + KISITLAR (rol · dizin · limitler · yasaklar), (c) kanıt bağı.
3. **PERFORMANS DÖNGÜSÜ:** ajan döngüsü ölçülür · denetlenir · puana ve iyileşme yoluna dönüşür — VERİ KALICI (yalnız kayıtlı gerçek ölçümlerden; E10 uydurma puan/trend YASAK, veri yoksa «ölçüm yok»).

**KONTROL İLKESİ (emir 2026-10-31 17:21: «llm deterministik değil rastgele çalışıyor — os level gibi hard coded zorlama kapıları olmalı, yoksa dökümanla her şey kontrol edilemiyor»):** kritik kısıtlar DOKÜMANDA değil **KODDA** zorlanır — LLM'ye güvenilen hiçbir kural tek başına kapı değildir. Hard kapı envanteri §H'de.

## K8-2a — GÖRÜNÜR KAPSAM + OMURGA YÜZÜ (G10+G11+O1-O3; önce koşar — kullanıcı tespiti + omurga emri)

| Öğe | İş | Nereye |
|---|---|---|
| **G10a · PROJE SEÇİCİ** | Üst baryada marka yanı: aktif proje rozeti `ORDU ▾` + açılır liste (SİSTEM görünümü + projeler). Seçim kalıcı (localStorage). Seçim; graf/defter/run kapsamını belirler | tuval üst bar |
| **G10b · «PROJELER» sekmesi — GÖREV TABLOSU kahraman** | 4. sabit sekme: üstte filo/proje listesi — proje başına durum özeti (graf sürümü · açık kapılar · son damga) + «şu projeye geç» (seçiciyi değiştirir); **kalbi GÖREV TABLOSU: satır = görev (ad · faz · durum · yürütücü ajan · son olay [G11 rozetli])** — omurga halkası 1. **Genel olaylar burada**; görev haritası seçilen projenin kalbi olarak kalır | orta bölüm |
| **O1 · GÖREV DETAY KARTI** | Görev satırı tıklanınca: (a) **NE YAPIYOR** — atanmış ajan(lar) + son gerçek olay (defter/log kayıtlarından, insan-dili); (b) **NASIL YAPMALI** — görev talimatı + **KISITLAR** (rol · dizin · limitler · yasaklar — GRAF düğüm verisi + ordu fişinden; K8-1 düğüm kartının büyütülmüş yüzü); (c) **KANIT** — defter/olay satırlarına geçiş. Omurga halkası 2 | görev tablosundan |
| **O2 · AJAN PERFORMANS YÜZÜ** | Ajan başına KAYITLI gerçek ölçümler (run kartları: oturum · süre · test sonucu · usage) → yalın özet + trend (veri varsa) + İYİLEŞME YOLU satırı (ölçümden türetilen gözlem; veri yoksa yalnız eksik listesi). **Puanı ajan YAZAMAZ — yalnız ölçüm kaynağından türetilir (hard kapı §H).** Veri yoksa «ölçüm yok» (E10). Omurga halkası 3 | O3/O1 kartından |
| **O3 · AJAN KARTI** | Ajan kim · rol · kısıtlar (dizin · limit · yetki) · aktif görevleri · performans özeti (O2) — G4'ün okur-yüzü (write-yüzü K8-2b) | tuval |
| **G11 · OLAY KAPSAM ROZETİ + FİLTRE** | Defter akışı + onay kuyruğu + run kartlarında her satıra kapsam etiketi `[SİSTEM]` · `[PROJE: ordu]` · `[GRAF]`; defter başlığında kapsam filtresi (tümü / yalnız sistem / yalnız bu proje). G7 diff arşivine kapsam alanı yazılır — rozet onun görünen yüzü | defter/onay/run yüzleri |

**Ek kapsam (kullanıcı emri 2026-11-01: «tüm çalışma performans güvenlik checkini yap en ileri düzeye taşı admin dashboarda da ekle çalıştığından emin ol»):** **D · DENETİM MERKEZİ** — performans + güvenlik durumu yüzü (kayıtlı değerlerle: son test koşumları · saglik.ps1 sonucu · §H hard-kapı envanteri durum rozetleri, kaynak referanslı) — ORDU-1 K8-2a'ya ekler (steer mesajı); canlı koşum uçları (POST /api/denetim/* — PANO_TOKEN'lı) K8-2b'de. Bağımsız güvenlik+performans denetimi: raporlar/gelen-kutu/GUVENLIK-DENETCI-2026-11-01.md (+json, salt-okur denetçi). Düzeltme paketi + kalıcı bakım düzeni: [BAKIM-GP planı](BAKIM-GUVENLIK-PERFORMANS-PLANI-2026-11-01.md) (kullanıcı emri 2026-11-01; GD-001..010 + cadence).

**Veri dürüstlüğü (E10/E11):** proje manifesti şu an tek gerçek proje (ordu) + SİSTEM görünümü — tuval içi sabit manifest; çoklu proje kaynağı (sunucu ucu / G5-G6 write-model) K8-3'ün konusu, bu dalgada **uydurma proje listesi YASAK**. Rozetler yalnız gerçek kaynağın kapsamını taşır.

**Veri kaynakları (E10 — yalnız GERÇEK):** görev tablosu → GRAF SSOT; «NE YAPIYOR» → `raporlar/deney-canli-panel-2026-10-29/` (log.jsonl · manager-kuyruk.jsonl · atamalar.jsonl — son olay kayıtları); «NASIL YAPMALI + kısıtlar» → GRAF düğüm alanları + ordu fişleri (K8-1 atanabilir-liste deseni); performans → run kartlarının kayıtlı ölçümleri. Sürekli ölçüm toplama hattı K8-3'ün konusu — K8-2a eldeki kayıtları gösterir, yoksa «ölçüm yok» der.

## K8-2b — WRITE-MODEL OMURGA (G3+G7+G8; 2a kapanınca brief'i detaylanır)

- **G3 · ORTA EDİT MERKEZİ (B1-ORTA):** her şey düzenlenebilir — taslak/versiyon → onay → kalıcı.
- **G7 · VERSİYON + DIFF ARŞİVİ (B6):** her kalıcı değişiklik versiyon + append-only diff JSONL + MD görünüm; **kapsam alanı zorunlu** (sistem/proje/graf — G11 ile aynı taksonomi).
- **G8 · AI-MANAGER ONAY ZİNCİRİ (B4):** edit → taslak/versiyon → AI-manager onayı (kabul/red gerekçeli) → kalıcı; [insan] kapıları EK-2 aynen `insan:web`.

## Yürütme disiplini

- K8-2a tek yazıcı ORDU-1 (tuval + test; R3 dili + 44px + light tema aynen; K8-1 deseni: izole test, kanıt ölçütleri planda).
- K8-2b işbölümü: ORDU-4 (server.js POST uçları — write-set sınırlı, PANO_TOKEN fail-closed) ∥ ORDU-1 (tuval editör yüzü); ORDU-3 salt-okur denetim her alt dalga kapanışında.
- 4377 çalışan süreç DOKUNULMAZ (restart [insan] ayrı onay); GRAF SSOT'ya onaysız yazma YOK; ajanlar commit ATMAZ.

**Kanıt ölçütleri (K8-2a):** test tam süit yeşil ×2 (+ graf-yaz 7/7 + graf-yonetim 32/32 bozulmaz) · seçici sekme değişimi localStorage + kapsam filtresi davranışı pinli · **O1 pin: kısıt alanları gerçek fiş/graf verisinden · O2 pin: puan ajan ürünü değil ölçüm alanından + «ölçüm yok» metni** · ORDU-3 denetim: uydurma proje verisi/puan YOK (E10) · kapsam rozetleri gerçek kaynak eşlemesi · R3 tasarım korunumu. **Dil (kullanıcı feedback'i): yeni yüzler sade bütün-cümle Türkçe — jargon duvarı YASAK.**

**Ölçek tahmini:** 2a ~350-550 LOC UI + ~35 test iddiası; 2b ~600-900 LOC (2 dosya-yüz + server uçları) — plan 1500-2500 bütçesinin ikinci dilimi.

## H — HARD KAPILAR envanteri (kontrol ilkesi: kısıt kodda zorlanır)

| Kısıt | Zorlayıcı kapı (hedef) | Durum |
|---|---|---|
| Pano yazma erişimi | server.js PANO_TOKEN fail-closed 403/401 + deney-server POST kapısı token fail-closed (BAKIM-GP GD-001) + zaman-sabit karşılaştırma (GD-004) | VAR (kod — canlıya geçişi 4377+4930 restart [insan]) |
| Onay aktörü (EK-2) | aktör sunucu-sabit `insan:web`; istemciden aktor alanı YOK | VAR (kod) |
| Yazma alanı | server write-set whitelist + yol normalize (kök dışı YASAK) | KISMI — K8-2b'de sertleşir |
| GRAF SSOT | yazma yalnız `/api/graf/yaz` (D-3) + append-only | KISMI |
| «Ajanlar commit ATMAZ» (bugün yalnız doküman kuralı) | git pre-commit hook: kapsam whitelist denetimi | **EKSİK → K8-2b fişi** |
| Performans verisi | puanı AJAN YAZAMAZ — yalnız ölçüm kaynağından (server/test/usage) türetilir; sunucu ölçüm kaynağı: deney-server perf alanı + olcumOku() (BAKIM-GP GD-008) | **YENİ (O2 mimarisi)** |
| Token ajanın eline geçmez | izole koşumda token ajan log'una/ortamına yazılmaz; ORDU-3 denetim pini | VAR |

**Yürütme emri:** «K8-2 başla» (revize kapsam: omurga yüzü + kapsam katmanı; hard kapı fişleri 2b'de).
