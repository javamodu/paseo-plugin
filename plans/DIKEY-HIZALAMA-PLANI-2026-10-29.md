# DİKEY HİZALAMA PLANI — kapsül görev grafı + manager ordu disiplini (2026-10-29)

**Kaynak:** kullanıcı emri (bu oturum): «bu iki konuyu SSOT olarak net anayasaya işleyelim ve bundan sonraki tüm uygulamayı bu SSOT anayasa maddesine göre dikey hizalayalım … bir projeyi görev grafı olarak kapsülleyip sıralamak ve manager llm ile görev ajan ordusunu askeri disiplinle yönetmek … replan-izle-denetle-benchmark-performansa dayalı görev ordusu … en kestirme dikey dar alanda kanıtlanmış çıktılarla adım adım … en az kodla en büyük sıçramalar … çevik ve lean … ilk önce arayüzü düzelteceğiz — responsive touch uyumlu clean net kullanıcı arayüzü».

**Hukmi dayanak:** [K-0054](../kararlar/K-0054.md) (ANAYASA önerisi — [insan] onayı bekler) · [vizyon fişi](PANO-PLANGRAF-VIZYON-2026-10-29.md) §1-5 (çerçeve) + §6 (kalp envanteri). Politika otoritesi PLAN.md v2.10.1 §25 değişmez; bu plan onun dikey uygulama rotasıdır.

## 1. İki sacayağı (K-0054)

| # | Sacayağı | Rol | SSOT |
|---|---|---|---|
| I | **Kapsül görev grafı** — projenin faz→sprint→alt görev kapsülleştirilip sıralanması; insan+makine okur tek kaynak | **ÇERÇEVE** (kalbi taşır) | graf SSOT (v14) + pano yüzü |
| II | **Manager döngüsü** — manager LLM'in ajan ordusunu askeri disiplinle yönetmesi: **dağıtım·denetim·izleme·takip·replan·benchmark·performansa-dayalı görev yazdırma** | **KALP** (asıl başarı ölçütü) | core/src manager modülleri + ölçüm defterleri |

Kestirme yol = **dikey dilim**: her adım uçtan uca kanıt üretir (çalışan yüz veya ölçülmüş sayı); yatay «her şeyi biraz ilerlet» yok. Sıçrama noktaları: **DALGA-0** (ürünün görünür yüzü doğar) ve **DALGA-1→2** (kalbin eksik ayağı: ölçüm→atama motoru).

## 2. Teknik borç / hantallık envanteri (göz önünde bulunduruldu)

| Kalem | Durum | Bu planda idaresi |
|---|---|---|
| Tip-borcu | **0'a kilitli** (KİLİT 39f46e4; kapı regresyon-yakalayıcı) | Sürdürülür — yeni kod borç üretmez (ratchet) |
| İnsan-okur ikiz koptu | insanOkurIkiz yolu bayat, arşivde 2 sürüm geride | DALGA-4'te tek-kapsül-format kararıyla kapanır |
| Aktif kural sayısı ~44 (>40 tavan) | T işareti sisteminde uyarı | Yeni plan kural EKLEMEZ; dalga kapanışları DERSLER'e kısa yazar |
| Kirli tracked dosyalar (~12 M) | RBT .3 kapanışında mühürlü sahiplikte | Dokunulmaz — dalga yazıcıları kendi worktree'lerinde kirli-dosya izolasyonu (K-0053) |
| Yasak-liste dosyaları | probe-latest.json · spawn-olcum.jsonl ASLA commit | Yasak-liste korunur; spawn verisi DALGA-1'in girdisi (salt-okur) |
| f3-crash yük-flake sınıfı | Seri-faz alternatifi bekliyor (eşik gevşeme REDDİ) | Kanal politikası yük-dengi; dalga kapanışları TEK kanal koşumu (K-0053 ölçütü) |
| V8-05 paralel 3-yazıcı eşleme | Önkoşul tamam, uygulama ayrı emir | DALGA-2 ile birleşir (eşleme = atama motorunun ilk halkası) |
| H1 bütçe 5.880-9.450 LOC (T) | [insan] onayı bekler | **Bu plan bunun yerine dikey dilim bütçesi önerir: ~1.000-1.700 LOC (T)** — H1 onayı ayrı karar olarak durur |
| rpl-03579e06 · K-0044 · D-1b | [insan] kuyruğu (EK-2) | DALGA-0 kanıtı D-1b elle testle birleşir; replan onayı DALGA-3 önkoşulu |

## 3. Dalgalar (dikey sıra — her dalga: atomik · tek-yazıcı · kanıtlı · kapanışta ölçüm çifti V9-04)

### DALGA-0 — ARAYÜZ (İLK; kullanıcı emri: «ilk önce arayüzü düzelteceğiz»)

- **Ne:** pano tuvali responsive + touch + clean: viewport/meta · tek-sütun mobil düzen · dokunma hedefleri ≥44px · temiz tipografi/boşluk · **faz-gruplu sol ağaç** (vizyon FAZ-A çekirdeği: faz→görev satırları, veri graf SSOT'ta hazır) · detay paneli tıklamayla aynı kalır · fail-closed kırmızı yüz ve İNSAN/MAKİNE mod korunur.
- **Nerede:** `pano/kapsul-tuval.html` (tek dosya ağırlıklı; gerekirse `pano/server.js`'e 1-2 ok uç). Mevcut dosya ≤3 kuralına uyar.
- **LOC:** ~250-400 (T) · **Süre sınıfı:** tek yazar dalgası.
- **Kanıt:** desktop+dar-görünüm ekran görüntüleri · D-1b elle test gözlemi (KULLANICI) · kanal değil koşum-dalgası sınıfı (0 test değişikliği hedeflenir; UI iddiası gözle kanıtlanır).
- **Emir:** «DALGA-0 başla»

### DALGA-1 — ÖLÇ (benchmark canlı: kalbin nabzı)

- **Ne:** F6-A eşlenmiş performans deneyi: benchmark.ts iskeletine GERÇEK kol koşumu — aynı görev 2+ provider'da eşlenmiş koşulum (görevHash/evaluatorHash/bütçe eşitliği assert); tam payda (başarısız/timeout dahil); süre·maliyet·ilk-aday·müdahale ölçülür; n<eşik → «yeterli değil» dürüst uyarı; üstünlük metni YASAK.
- **Nerede:** `core/src/benchmark.ts` (executor ucuna canlı adapter) + cli komutu; spawn-olcum verisi girdi.
- **LOC:** ~150-300 (T) + test.
- **Kanıt:** kanıt raporu (ölçüm tablosu) + benchmark JSON defter + tam kanal.
- **Emir:** «DALGA-1 başla»

### DALGA-2 — ATA (performans→dağıtım: ordunun seçme mekanizması)

- **Ne:** performans defteri read-model (telemetri+spawn-olcum+benchmark birleşik salt-okur görünüm) + dispatcher'a atama ince kancası: statik kadro → ölçümlü öneri (ilk aşama [insan] onaylı eşleme; otomatik sonraki kademede). V8-05 paralel 3-yazıcı çakışmasız eşleme burada birleşir.
- **Nerede:** `core/src/dispatcher.ts` (ince kanca) + YENİ read-model dosyası + pano /api ucuna 1 GET.
- **LOC:** ~250-450 (T) + test.
- **Kanıt:** kanıt raporu + atama karar defteri (append-only) + tam kanal.
- **Emir:** «DALGA-2 başla»

### DALGA-3 — REPLAN EYLEME (gözlemden karara)

- **Ne:** rpl-03579e06 [insan] onayı sonrası §18 tazeleme (MD-ezmez) + manager DRIFT sinyalinin dağıtım kuyruğuna inmesi (replan→yeni brief doğumu).
- **Nerede:** `core/src/replan.ts` (ince kanca — tazeleme mevcut; sinyal ucu yeni) + cli.
- **LOC:** ~100-200 (T).
- **Kanıt:** replan kayıt zinciri + §18 taze satır + tam kanal.
- **Emir:** «replan onayı» (kullanıcı terminalinde) sonra «DALGA-3 başla»

### DALGA-4 — KAPSÜL BİRLEŞME (çerçeve cilası — en son)

- **Ne:** tek-kapsül-format kararı (insan ikiz yeniden doğumu veya tuvalin İNSAN OKUR modunun ikizliği ikamesi) + detay paneli zenginleştirme (vizyon FAZ-B) + kapsül-iç çalışma prensibi görünümü (FAZ-C/D-2 sohbet).
- **LOC:** ~200-400 (T).
- **Emir:** «DALGA-4 başla»

### LOC bütçe tablosu (dikey dilim — hepsi T; kanal ölçümleri R'ye döner)

| Dalga | LOC (T) | Sıçrama |
|---|---|---|
| 0 ARAYÜZ | 250-400 | Ürün gözle görülür olur (her cihazda) |
| 1 ÖLÇ | 150-300 | Performans iddiaları sayıyla konuşur |
| 2 ATA | 250-450 | **Asıl sıçrama: performansa-dayalı ordu** |
| 3 REPLAN | 100-200 | Döngü kapanır (ölç→karar→yeniden plan) |
| 4 KAPSÜL | 200-400 | İnsan+makine tek format |
| **TOPLAM** | **~950-1.750** | H1 yatay bütçesinin (~5.880-9.450) kesirinde dikey kanıt zinciri |

## 4. 6 SUBAGENT TOPOLOJİSİ (revize — askeri hiyerarşi)

| Rol | Sayı | Görev | Ev |
|---|---|---|---|
| **MANAGER/KOMUTAN** (glm-5.3) | 1 | Graf SSOT'tan görev seçer · YAZAR-BRIEF-SABLON'la brief üretir · dağıtır · DRIFT/performans izler · replan sinyali üretir | ana oturum |
| **YAZARI/ER** | 3 | Dalga-bazlı worktree/branch yazıcıları (K-0053 hattı; V8-05 çakışmasız eşleme; DALGA-2'den itibaren performans-tabanlı seçilir) | ayrı worktree |
| **DENETÇİ** | 1 | Bağımsız değerlendirme (evaluator/A13) + çapraz eleştiri (turnuva §21); sahte-PASS yok | salt-okur |
| **GÖZLEMCİ/ÖLÇÜM** | 1 | benchmark + spawn-olcum + telemetri defterleri · pano canlı akış (D-2/SSE) · kanıt defteri bakımı | salt-okur |
| **[insan] OPERATÖR** | — | Onay kapıları (EK-2): dalga başlatma · replan onayı · eşleme onayı · K-0044/D-1b | kullanıcı terminali |

Kural: yazıcı tavanı 3 (paralel); commit/push TEK ELDEN (operatör/manager); denetçi+gözlemci asla yazmaz.

## 5. Somut görev emirleri (sıra — kullanıcı cümleleri)

1. «**K-0054 onaylıyorum**» → ANAYASA'ya 3 nokta işlenir (tek düzeltme commit'i; K-0054 hash damgalı).
2. «**DALGA-0 başla**» → arayüz dalgası doğar (fiş + yazar dispatch + merge + kanıt).
3. (DALGA-0 kapanışında) **D-1b ELLE TEST** gözlemi — tarayıcıdan responsive/touch kontrol.
4. «**DALGA-1 başla**» → canlı eşlenmiş benchmark koşumu.
5. «**DALGA-2 başla**» → performans-tabanlı atama çekirdeği (V8-05 birleşir).
6. (DALGA-3 önkoşulu) **rpl-03579e06** onayı KULLANICI terminalinde: `node src/cli.ts replan --onay rpl-03579e06 --confirm "REPLAN ONAYLIYORUM"` (core/ dizininden).
7. «**DALGA-3 başla**» → replan gözlemden eyleme.
8. «**DALGA-4 başla**» → kapsül birleşme (çerçeve cilası).

Her dalga kapanışı: kanıt raporu + ölçüm çifti (V9-04) + STATE damga + DERSLER + CODEMAP taze (Z1) + iş fişindeki ölçütlerle kapanır; kırmızıysa dalga durur, [insan] rapor edilir.

## 6. Lean/çevik yönetim ilkeleri (bu planda bağlayıcı)

- **En az kod, en büyük sıçrama:** her LOC bir sacayağına hizmet etmeli; hizmet etmeyen iş K-0054 H1 gereği varsayılan RED.
- **Kısa dalga:** ≤1 gün; tek-yazıcı; atomik merge (K-0053: merge anında tam kanal).
- **Kanıt > söz:** ölçüm çifti olmadan hız iddiası kapanamaz; sahte yeşil ADIYLA kırmızı (A13/A2).
- **Borç görünür kalır:** ratchet (tip) + yasak-liste + kirli-dosya sahiplik izolasyonu sürer.
- **Karar tek yerde:** dikey hizalama ANAYASA'da (onay sonrası); dalga detayları iş fişlerinde; bu plan rotayı verir, fişler adımı.

**Durum:** PLAN KAYDI — DALGA-0 dahil hiçbir dalga bu fişten doğmaz; her biri ayrı [insan] emri + iş fişi (CALISTIRMA §2). Bekleyen [insan]: K-0054 onayı · D-1b · rpl-03579e06 · K-0044 · (H1 yatay bütçe onayı ayrı durar). Bağlantılar: [K-0054](../kararlar/K-0054.md) · [vizyon fişi](PANO-PLANGRAF-VIZYON-2026-10-29.md) · [graf SSOT](gorev-grafigi-2026-10-26.json) · [PLAN §25](PLAN.md) · [yazar brief şablonu](YAZAR-BRIEF-SABLON-2026-10-28.md) · [karar paketi](KARAR-PAKETI-2026-10-28.md).
