# S4 BİLDİRİM — GERÇEK SENDER UCU KANITI — 2026-10-26 (Sprint 4)

**Etiket: `bildirim-sender`** · Kanal: `h=80fdb4a x=0` (tam süit 361/361, sureSn=21, log `test-bildirim-sender.log`) · son-kanit: `d=2026-10-26T11:22:16.8793693+03:00`

Plan kalemi "Bildirim — gerçek sender ucu (outbox zaten sağlam) ~80 LOC" bu turda
KAPANDI. Boşluk tespiti: `notify.ts` outbox'u sağlamdı ama **üretim kodu hiç
açmıyordu** (yalnız testler), gerçek sender YOKtu, CLI'da bildirim komutu YOKtu;
pano `/api/status` `dirname(dbPath)/notify.jsonl` okuduğu hâlde o dosyaya yazan
üretim ucu YOKtu.

## 1. Yeni kod — `core/src/sender.ts` (~100 satır) + CLI `notify` komutu

1. **`makeWebhookSender(url, opts)`** — SENKRON `NotifySender` sözleşmesiyle GERÇEK
   HTTP POST (curl + execFileSync; RT3 canlı testinin kanıtlanmış kalıbı — DERSLER:
   senkron gönderen alıcıdan AYRI süreçte yaşar). URL http/https kapısı;
   `ORDU_NOTIFY_TIMEOUT_MS` → curl `--max-time`. **HATA MASKELEME:** webhook URL'si
   sorgu parçasında anahtar taşıyabilir; curl hatasının mesajı URL'yi içerir ve
   retry/dead `reason` alanı **diske (notify.jsonl) düşer** — sender hatayı
   yeniden fırlatmadan önce URL'yi `***` ile maskeler (notify.ts'in redakte
   sözleşmesinin dış-başarısızlık ikizi).
2. **`openProductionNotify(dbPath, env)`** — üretim outbox fabrikası. Yol
   pano-server ile AYNI kökte: `dirname(dbPath)/notify.jsonl` (pano-server.ts:143
   `buildStatus`'ın okuduğu yol birebir — iki ucun yol sözleşmesi tek yerde).
   ENV: `ORDU_NOTIFY_URL` (YOK → sender enjekte EDİLMEZ → flush fail-closed
   'sender-yok' RED; boş string → config RED — sessiz no-op YOK) ·
   `ORDU_NOTIFY_TIMEOUT_MS` · `ORDU_NOTIFY_QUIET` "HH:MM-HH:MM" ·
   `ORDU_NOTIFY_TZ` (varsayılan Europe/Istanbul). Geçersiz env → RED.
3. **CLI `notify`** — `node src/cli.ts notify [--enqueue --severity S --title T
   --body B --dedupe-key K]`. URL yoksa DÜRÜST RED (kuyruk dosyası doğmaz);
   enqueue + aynı çağrıda flush; çıktı makine-okunur JSON (path/sent/deferred/
   retried/dead/bekleyen).

## 2. Hermetik koşumlar — `core/test/bildirim-sender.test.ts` (6/6, kanal koşumunda)

1. URL kapısı: http/https dışı + bozuk + boş URL RED; timeout pozitif tam sayı RED.
2. Curl çağrı biçimi: POST + `--data` gövdesi {id,severity,title,body} (kayıt
   DURUMU gönderilmez — alıcı bayat durum görmez) + `--max-time` 5000ms→5sn + URL son argüman.
3. **Hata maskeleme**: enjekte edilen exec `Command failed: curl … <URL>?token=…`
   fırlatınca → yeniden fırlatılan hata ORİJİNAL URL içermiyor, `***` + curl çıkış
   kodu içeriyor.
4. Üretim fabrikası: yol pano köküyle aynı; URL yokken `urlSet=false`, enqueue çalışır,
   flush 'sender-yok' RED; boş-string URL RED.
5. ENV URL + geçiş exec: sent=1; `ORDU_NOTIFY_QUIET=23:00-07:00` INFO deferred +
   CRITICAL geçer (notify.ts sözleşmesi üretim girisiminden); bozuk quiet RED.
6. CLI: URL yok → code 1 + neden söylenir, kuyruk dosyası DOĞMAZ; enjeksiyonlu exec
   ile enqueue+flush uçtan uca (sent=1, `--data` telde, jsonl'de `sent` olayı);
   geçersiz severity enqueue RED.

## 3. CANLI koşum — `core/test/bildirim-canli.test.ts` (üretim CLI yolu)

| Bacak | Kanıt |
|---|---|
| Gerçek teslim | alıcı AYRI node süreci (loopback HTTP) → `cliMain(['notify','--enqueue',...])` env `ORDU_NOTIFY_URL=http://127.0.0.1:<port>/hook` → GERÇEK curl POST → **204 → sent=1**; alıcı kaydı: `/hook` + gövde id'si CLI'nın kuyrukladığı id ile BİREBİR |
| Pano görünürlüğü | `createPanoServer` (aynı dbPath) → GERÇEK `fetch /api/status` (token) → `notifications.bekleyen=0` + `sonBildirimler`'de `sent` kayıt görünür — **bildirim üretim yoluna indi ve pano onu gerçek HTTP üzerinden okudu** |
| Üretim hata yolu | alıcı SIGKILL → CLI notify → GERÇEK bağlantı reddi → `retried=1`, kayıt `pending` kalır (bir sonraki flush adil yeniden dener), retry olayının nedeni GERÇEK curl hatası (`Command failed: curl`) |

## 4. Kabul çevirisi

- **M07 (NOTIFY, durable redakte outbox): GECTI_HERMETIC → PASS** — outbox'un
  üretim bacığı doğdu: sender + üretim yolu + CLI + pano görünürlüğü; hermetik
  12/12 (2026-10-14) referansı korunur. Sonek kanal kaynaklı birebir:
  `·d:2026-10-26T11:22:16.8793693+03:00 ·h:80fdb4a ·x:0`.
- Süit 354 → **361** (+6 hermetik +1 canlı; package.json listesine eklendi).
- kabul %58 → **%59 (68/115)**.

## 5. Ölçüm ortamı

Windows 11 · node v24.18.0 · loopback alıcı AYRI süreçte (RT3 deseni) · gerçek
curl (bu makinede kanıtlanmış) · temp dizinler repo dışı.

Damga (R): 2026-10-26T11:22:54+03:00 (Get-Date ile ölçüldü)
