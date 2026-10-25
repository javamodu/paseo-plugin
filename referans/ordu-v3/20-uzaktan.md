# 20 — UZAKTAN İZLEME ve TEK YÜZEY (kullanıcının gerçek arayüz şartı)

> Yüzey kararı (ADR-011/K5 + GPT §9 okuması): **tek yüzey = bağımsız yerel web
> pano**, Paseo yalnız yürütme host'u. Native Paseo paneli SONRA, aynı core
> API'sine bağlı ince istemci olarak değerlendirilir — ilk sprintte ikisi YOK.

## 1. Ekran (üç bölge, tek bakış)

```
┌──────────────────────────────────────────────────────────┐
│ •core •daemon •canlı | ▶3 ✉1 ✓12 | ₺64k/200k | [ACİL DURDUR] │
├──────────────────────────────────────────────────────────┤
│ PANO: kapsül kartları (başlık · durum+sebep · doğrulanan  │
│  iş sayısı · bakiye). Katman sırası; renk+METİN.          │
│  Tık → Özet|İşler|Kanıt|Geçmiş sekmeleri (kart içi açılır)│
├──────────────────────────────────────────────────────────┤
│ COMPOSER: [bağlam: yeni kapsül/seçili] [profil] metin …   │
│  [Planı hazırla] → önizleme → [Başlat] (tek onay)         │
└──────────────────────────────────────────────────────────┘
```

- Beş sorunun cevabı her kartta: ne / neden bekliyor / ne doğrulandı /
  ne kaldı / hangi karar sende (GPT §5).
- Composer'da SABİT kontrol üç: bağlam, çalışma profili, metin. Model/düşünme/
  kademe/limit "Gelişmiş"te — günlük karar yükü DEĞİL (GPT §4.2 özeleştirisi).
- İyimser render YASAK: yazma SSE teyitsiz satırı değiştirmez. Kopuklukta
  rozet sarı "donmuş — son görülen: 12:04"; boş veri başarı gibi gösterilmez.

## 2. Uzaktan erişim (telefon/uzak)

- Ev ağı: `http://<host-lan-ip>:4378` + kısa ömürlü oturum token'ı (A17:
  auth + Origin/Host denetimi). İnternete açık port YOK.
- Dışarıdaysan: Tailscale/SSH-tunnel ile 127.0.0.1:4378 yönlendirmesi (tek satır talimat README'de).
- Bildirim (izlemek zorunda kalmamak için asıl yol): Paseo **heartbeat** —
  `paseo heartbeat create --cron "*/20 * * * *" "pano özetle: ✉ açık karar varsa
  tek satır + bağlantı yolla; yoksa SESSİZ"`. Sessizlik normaldir; yalnız
  karar/uyarı/teslim bildirir (spam eşiği: günde ≤3 özet).
- **Kanalbağımsızlık (ADR-012):** heartbeat `paseo` runtime'ının kanalıdır;
  `local` runtime'da aynı sessiz-akış sözleşmesi pano SSE'si + opsiyonel tek
  webhook/e-posta fallback'i ile uygulanır. Semantik (karar yoksa sessiz, karar
  varsa ≤1 dokunuş) KANALDAN BAĞIMSIZ tanımdır — kanal değişir, kural değişmez.
- Kritik olaylar (STOP uygulandı, kapsül kabul edildi, fence ihlali denemesi)
  gecikmeden tek bildirim.

## 3. Karar Inbox'ı (insan döngüsünün TEK adresi)

Kart türleri (kapalı küme, qwen 06 §5 mirası + Final tipleri): `3-kirmizi ·
plateau · butce-asimi · kapsam-disi · yetim · onarim · acik-bagimlilik ·
izin-sorisi · ogrenme-onerisi(30-ogrenme)`. Tek dokunuş + gerekçe linki.
Aday değiştiyse kart `geçersiz` grileşir (staleness; cevap POST reddedilir).

## 4. Mobil (390px)

Liste → detay ardışık tek sütun; kart özeti 4 satırı geçmez; ACİL DURDUR her
ekranda üstte; klavye odağı ve form etiketleri (A21 operatör testiyle kanıtlanır,
maketle değil).

## 5. Yetki katmanları

Görüntüleme: oturum token'ı. Yazma (başlat/karar/müdahale/ayar): aynı token +
`x-ordu-yazma` ikinci başlık — UI'da salt-okur mod gerçek kapıdır (fail-closed).
Anahtarlar asla HTML'e gömülmez (S2).

## 6. Zamanlanmış görevler (denetim bulgusu: M08–M10 hiçbir pakette kapılı değildi)
Ordunun "kendi kendine test edip teslim etmesi" periyodik iş gerektirir — ama
**yönetici LLM asla sürekli scheduler değildir** (Final docs/12). Model:
- Çekirdek SQLite `schedules`: cron ifadesi + hedef kapsül şablonu + bütçe tavanı.
  Tetikleme çekirdekte; her koşu için **benzersiz occurrenceId** — restart/duplicate
  tetiklemede aynı an iki kez koşmaz (A05 deseni; M08).
- Zamanlı koşu = normal kapsül; Başlat onayının **önceden verilebilir hâli (grant)**:
  "her gece 02:00 regresyon, bütçe X, durdur eşiği Y" tek sefer onaylanır; sonraki
  occurrence'lar grant kapsamında kendi kendine başlar. Grant dışına taşan anında RED (M11).
- Misfire/overlap politikası kayıtlı ve kapalı: kaçırılan iş **asla catch-up burst
  olarak yakalanmaz**; STOP effective ise occurrence "atlandı" kanıtıyla geçilir (M10).
  TZ/DST kaymalarında determinizm: occurrence kaydı UTC, görünüm yerel; önizleme
  gözlemle birebir (M09).
- Zamanlı işler heartbeat kuralına tabi; sessizlik aynen geçerli.

## 7. Otomatik kalite-kabul şeridi (M17 — isteğe bağlı, dar, geri döndürülebilir)
"Uzaktan sadece izleme" isteğinin meşru yarısı. **Otonomi merdiveni (v3.0.0 §5):**
`ADVISORY` (yalnız plan öner, çalıştırma) → `SUPERVISED` (plan+kabul insan kapısı —
S1–S3 varsayılanı) → `BOUNDED_AUTO` (önceden-onaylı mission grant'i içinde
admit→üret→doğrula→onar→teslim otomatik; bu §7 şeridi). Her mod görev/profil başına
donmuş grant + sürüm ister; politika değişirse AKTİF run genişlemez, yeni manifest
gerekir (M11). Beş kural BİRLİKTE, biri eksikse şerit kapalı:
1. Kullanıcının **kapsamı donmuş grant**'i: şablon + evaluator hash + risk sınıfı
  "düşük" + TTL. Grant'tan geniş davranış → reddedilir, kart olur (M11).
2. Yalnız kanıtla-tam koşular: A13 kapıları + test eşiği + paired-smoke farkı yok;
  eksik/belirsiz kanıt = insan-kartı (iyimserlik yok).
3. **Asla bu şeritte olamaz:** güvenlik/kurtarma kapılı işler (Y6/F3), profile/prompt/
  izin değişiklikleri (30 §3) — ve **MERGE her zaman insan onaylı kalır**; otomatik
  olan yalnız "kalite-accept" durumudur, teslim/merge onayı A14'den muaf DEĞİLDİR.
4. Tek dokunuş iptal: grant anında kapanır; şerit kaynaklı son kararlar insan-kartına
  çevrilebilir; her oto-kabul kaydı karar geçmişinde işaretli ve sayılabilir.
5. V3-S4.4 kapısından geçmemiş şerit **varsayılan KAPALI** doğar.

## 8. Uzaktan-erişim güvenliği (M04 — S2'de kanıtlanır, S3'e bekletilmez)
LAN'da bile: yazma uçları komut-imzası + oturum-eti; SSE/artefact okuma yetkisi ayrı;
token iptali **uygulanabilir** (iptal sonrası canlı akış kesilir); core portu host
ağına yayınlanmaz (bind 127.0.0.1 + Tailscale/terminasyon dışarıda); anonim erişim
fail-closed RED.

## 9. Bildirim dayanıklılığı (M07)
Heartbeat çıktıları çekirdeğin **kalıcı notification-outbox**'ına yazılır: restart'ta
duplike/eksik bildirim yok; provider (Paseo) hatası panoda görünür; redakte içerik
(secret/ham diff yok); LLM'e bildirim polling'i kurdurulmaz; sessiz saat **kritik
kartları yutmaz** (gelebilir, ama kaybolmaz).

## 10. Konak kısıtları (M16 ikinci yarı)
Ölçülen sinyal, sürpriz değil: disk baskısı (evidence yazılamaz → dispatch durur +
CRITICAL kartı), uyku/güç politikası (worker varken sleep engeli/uyarısı), yedek
boyutu + retention sınırı.

## 11. Paseo kapalıyken — bileşen tablosu (ADR-012'nin operatör yüzü, K-0006)
"Ordun uyur ama ölmez" sözünün somut hâli. `runtime:"local"` seçiliyse:

| Bileşen | Paseo yokken | Not |
|---|---|---|
| Defter + checker + store (A01–A07, A35/A36) | **çalışır** | SQLite yerel; kapı seti runtime-bağımsız |
| Kuyruk + bekçi frenleri | **çalışır** | spawn `runtime-kapalı` bekler; slot/retry YAKMAZ (A24 deseni) |
| Pano (SSE) | **salt-okur canlı**; yazma fail-closed | kopuklukta rozet sarı, boş veri başarı gibi görünmez |
| Manager plan/özet (ham-LLM completion) | **üretir** | toolsuz; dispatch etmez, önizleme kurar |
| Coder/Tester worker | **local runtime'da koşar**; paseo'da DURUR | tek gerçek dış-bağımlılık yürütmedir; dönüşte reconcile (A08) |
| Heartbeat bildirimi | SSE + opsiyonel webhook'a düşer | sessiz-akış semantiği aynı (§2 kanalbağımsızlık) |

SABİT: hangi runtime koşarsa koşsun A13 sahte-PASS, A36 stale-fence ve insan-onayı
kapıları gevşemez (Y6). "Paseo'suz" = "internetsiz/anahtarsız" değildir; local worker
provider CLI auth ister. Kanıtsız yetenek = o runtime'da spawn YOK (B02 runtime-kapsamı).
