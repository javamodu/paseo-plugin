# K-0056 BORU HATTI — İLK TAM HALKA PERFORMANS DENETİMİ (S4 · ATOM-H1)

**Kimlik:** boru-hatti-performans-2026-10-30 · **2026-10-30T14:20+03:00** (ölçümlü) · denetleyici: operatör (kullanıcı emri: «olay tetikli boru hattı ilk kez kullanılıyor, tam bir performans denetimi yap, eksikleri iş bitince raporla, ordu başarımı dürüst yanıt»)

## 1. Ölçülen performans (tahmin yok — saatler mtime/log damgalı)

| Ölçüm | Değer | Kaynak |
|---|---|---|
| S4 halkası toplam | **97 dk** (12:27 S4_START → 14:04 commit b8f3435) | koordinatör kaydı + git log |
| Fiş başına ort. (429 + 3 revizyon DAHİL) | ~24 dk | |
| Saf yazım süresi (devirsiz) | S4-02 ~4 dk · S4-03 ~8 dk · S4-04 ~8 dk (tek turda revizyonla) | kanıt mtime'ları |
| Doğrulama bacağı (fiş başına, 3 rol paralel) | ~5-10 dk | rapor zamanları |
| 429 gecikmesi | ORDU-1: ~33 dk (12:42 kırılma → 13:15 kanıt) · ORDU-2: kanal kapanışına | bildirimler |
| Revizyon maliyeti | 3 bulgu → ~25 dk toplam | revizyon turları |
| Kanal | 1. koşum x=1 180 sn (f3-crash bilinen çevresel) → 2. koşum [bu rapora ekleniyor] | son-kanit.json |

**Paralellik getirisi:** yazıcı sonraki fişe geçerken doğrulayıcılar öncekini denetledi (fiş başına duvar süresi = yazım + en-uzun-bacak, üçlü seri değil). S4-02/S4-03/S4-04 üç fişin kanıtı 13:37'ye kadar üst üste bindi — seri modelde (~3× yazım+doğrulama+commit) tahmini >150 dk yerine fiş başına ortalama 24 dk.

## 2. Eksikler / zayıflıklar (dürüst)

1. **Askıda tur tespiti insana bağlı:** ORDU-1 12:56'dan beri statü «running» ama donuktu; operatör nöbet taraması (13:14) yakaladı. Otomatik tespit YOK — heartbeat operatöre düşüyor (K-0057 tasarımı), insan yoksa 429-sonrası askı süreyle fark edilmeyebilir.
2. **Aynı tuzak 2. kez:** hash düşürme S2-02'de 63 hane, S4-02'de 62 hane — DERSLER «aynı tuzağa iki kez düşmek hatadır». Öneri (T): dogrula.mjs'e hash-uzunluk otomatik doğrulaması; yazıcı görevlerinde 64 hane uyarısı zaten vardı, yine düşürüldü.
3. **Denetçi/tester derinlik farkı:** S4-04 N2 tautolojiyi ORDU-3 «assertion mevcut» diye geçti; ORDU-2 derinlemesine inince yakalandı. Şema denetimi satır sayıyor, semantiği tester taşıyor — tek başına denetçi bacağı zayıf.
4. **ORDU-1 bağlam %94:** tek turda revizyon+fiş yüklemesi kırılgandı; devir promptu hazır bekledi (kullanılmadı). Fiş tavanı bağlam bütçesiyle birlikte izlenmeli.
5. **İzin kapısı sürtünmesi:** her rapor iletiminde CodexMcpElicitation operatör onayı istedi (6+ kez, her biri ~30-60 sn bekleme). Tekrar eden sınıf — izin kuralı tanımıyla azaltılabilir.
6. **ORDU-2 429→closed:** kanal koşumunda oturum kapandı; yeniden yaratma gerekecek. ORDU-4 devri mekanik sınıfta yürüdü (tasarım çalıştı) ama tester rolü zincir sonunda boşta kaldı.
7. **Operatör tekeli:** commit/izin/görevlendirme darboğazı (bilinçli K-0056 tasarımı — fiş hükmü için); duvar saati operatörün elinde durdu.
8. **Token harcaması ölçülmedi:** ajan başına gerçek harcama bu zincire özel ölçülmedi (kaba aralık dışında dürüst rapor edilemiyor).

## 3. Ordu başarımı (ölçülen, abartısız)

- **26/26 fiş EVIDENCE_RECORDED** — 0 sahte kanıt, 0 ölü buton, 0 kapsam kaçması (tüm write-set denetimleri temiz).
- **3 bulgu yakalandı ve düzelt-ile-devrakla kapatıldı** — yazıcı ilk seferde hatasız değildi; sistem (tester≠denetçi hükmü) hatayı yakaladı. Bu zincirin asıl çıktısı budur.
- **İnsan kapıları dokunulmadı:** H1 kabul paketi TASLAK kaldı, ADR TASLAK, LIVE_SPEND/ROLLBACK_DEMO koşulmadı, push yapılmadı (K7).
- **429 sürekliliği:** 2 kırılma da zinciri durdurmadı — K-0057 süpervizör + disk teyidi + devirler saha uygulamasıyla çalıştı.
- Hedefli koşumlar: 3/3 · 7/7 · 10/10 · 22/22 + operatör bağımsız tekrarları (aynı sonuçlar).

**Net dürüst yargı:** model işledi — hata yakalama ve süreklilik kanıtlandı; hız 429 ve insan nöbet bağımlılığı tarafından sınırlı kaldı. «Kusursuz ilk koşum» değil: 2 kez aynı kayıt hatası, 1 derinlik-sıçraması gereken bulgu, 1 kanal çevresel x=1. Zincirin kalite frenleri (yazıcı≠tester≠denetçi + insan kapıları) hiç aşılmadı.

## 4. CORE_FULL sonucu (halka kapanışı)

**Etiket** `dc-h1-atomik-core-s4-20261030` · HEAD `b8f3435` — **2. koşum x=0, 467 pass / 0 fail, sureSn=117** (d=14:38:28+03:00 ölçülmüş; operatör disk teyidi: `son-kanit.json` + log — pass 467 / fail 0 bağımsız okundu).

- **Koşum çifti dürüst kayıt:** 1. koşum [ORDU-2, 14:10:55] x=1 — `f3-crash.test.ts:136 managerBekle` BİLİNEN çevresel flake (A0-3/F9/F4 emsali; koşum anında CPU %100 yabancı süreçler) · 2. koşum [ORDU-4 mekanik devri, K-0057 §3b] x=0 — f3-crash bu kez YEŞİL → flake yük-duyarlılığı teyit edildi, gizlenmedi.
- **Kayıtlar:** `raporlar/kanit-hedef/{son-kanit.json, dc-h1-atomik-core-s4-20261030.md, test-...-run1.log, test-....log}`.
- **Kanal süresi:** 1. koşum 180 sn (yük altında) vs 2. koşum 117 sn (süit 71,5 sn + probe) — ortam yükünün kanal süresine etkisi ölçülebilir biçimde görüldü.
- **S4 halkası toplam:** 12:27 S4_START → 14:38 kanal x=0 = **~131 dk** (§1'deki 97 dk fiş zinciriydi; kanal koşum çifti + 429 devirleri dahil uçtan uca budur).

**ATOM-H1 26/26 FİŞ + KANAL = ZİNCİR TAM KAPALI.** İnsan kapıları (H1 nihai kabul · ADR · K2-K6 · LIVE_SPEND/ROLLBACK_DEMO · push K7) bekliyor.
