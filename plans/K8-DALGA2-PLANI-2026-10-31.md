# K8 DALGA 2 — KAPSAM-KATMANİ YÖNETİM (G10/G11 + G3/G7/G8; 2026-10-31)

**Kimlik:** K8-DALGA-2. **Kaynak:** [YÖNETİM ARAYÜZÜ planı](YONETIM-ARAYUZ-PLANI-2026-10-29.md) G10/G11 (kullanıcı tespiti 2026-10-31 12:24: «tasarımda proje sekmesi eksik · genel tüm projelerin olaylar ile proje özel olaylar ve projeye ait görevi olayları karışmış · ayırt edici değildir» — tam paket K8-2 onayı) + G3/G7/G8 (2026-10-29 16:1x kapsam genişletmesi). K8-1 kapanışı: da50e22.

## K8-2a — GÖRÜNÜR KAPSAM KATMANI (G10+G11; önce koşar — kullanıcı tespiti)

| Öğe | İş | Nereye |
|---|---|---|
| **G10a · PROJE SEÇİCİ** | Üst baryada marka yanı: aktif proje rozeti `ORDU ▾` + açılır liste (SİSTEM görünümü + projeler). Seçim kalıcı (localStorage). Seçim; graf/defter/run kapsamını belirler | tuval üst bar |
| **G10b · «PROJELER» sabit sekmesi** | 4. sabit sekme: filo/proje listesi — proje başına durum özeti (graf sürümü · açık kapılar · son damga) + «şu projeye geç» (seçiciyi değiştirir). **Genel olaylar burada**; görev haritası seçilen projenin kalbi olarak kalır | orta bölüm |
| **G11 · OLAY KAPSAM ROZETİ + FİLTRE** | Defter akışı + onay kuyruğu + run kartlarında her satıra kapsam etiketi `[SİSTEM]` · `[PROJE: ordu]` · `[GRAF]`; defter başlığında kapsam filtresi (tümü / yalnız sistem / yalnız bu proje). G7 diff arşivine kapsam alanı yazılır — rozet onun görünen yüzü | defter/onay/run yüzleri |

**Veri dürüstlüğü (E10/E11):** proje manifesti şu an tek gerçek proje (ordu) + SİSTEM görünümü — tuval içi sabit manifest; çoklu proje kaynağı (sunucu ucu / G5-G6 write-model) K8-3'ün konusu, bu dalgada **uydurma proje listesi YASAK**. Rozetler yalnız gerçek kaynağın kapsamını taşır.

## K8-2b — WRITE-MODEM OMURGA (G3+G7+G8; 2a kapanınca brief'i detaylanır)

- **G3 · ORTA EDİT MERKEZİ (B1-ORTA):** her şey düzenlenebilir — taslak/versiyon → onay → kalıcı.
- **G7 · VERSİYON + DIFF ARŞİVİ (B6):** her kalıcı değişiklik versiyon + append-only diff JSONL + MD görünüm; **kapsam alanı zorunlu** (sistem/proje/graf — G11 ile aynı taksonomi).
- **G8 · AI-MANAGER ONAY ZİNCİRİ (B4):** edit → taslak/versiyon → AI-manager onayı (kabul/red gerekçeli) → kalıcı; [insan] kapıları EK-2 aynen `insan:web`.

## Yürütme disiplini

- K8-2a tek yazıcı ORDU-1 (tuval + test vaka 39/40; R3 dili + 44px + light tema aynen; K8-1 desen: izole test, kanıt ölçütleri planda).
- K8-2b işbölümü: ORDU-4 (server.js POST ucları — write-set sınırlı, PANO_TOKEN fail-closed) ∥ ORDU-1 (tuval editör yüzü); ORDU-3 salt-okur denetim her alt dalga kapanışında.
- 4377 çalışan süreç DOKUNULMAZ (restart [insan] ayrı onay); GRAF SSOT'ya onaysız yazma YOK; ajanlar commit ATMAZ.

**Kanıt ölçütleri (K8-2a):** test tam süit yeşil ×2 (+ graf-yaz 7/7 + graf-yonetim 32/32 bozulmaz) · seçici sekme değişimi localStorage + kapsam filtresi davranışı pinli · ORDU-3 denetim: uydurma proje verisi YOK (E10) · kapsam rozetleri gerçek kaynak eşlemesi · R3 tasarım korunumu.

**Ölçek tahmini:** 2a ~250-400 LOC UI + ~30 test iddiası; 2b ~600-900 LOC (2 dosya-yüz + server uçları) — plan 1500-2500 bütçesinin ikinci dilimi.
