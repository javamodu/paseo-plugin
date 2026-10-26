# ORDU-CORE KULLANIM

Tek dosyalik kullanici kilavuzu. Kapsam: test kosma, panoyu acma, CLI komutlari, kanit dosyalari.
Butun komutlar repo kokunden kosulur: `D:\Vibecode\ordu\core`

## 1. On kosullar

- Node.js 24.x (package.json `engines`: `>=24.0.0 <25`). Dogrulanan surum: v24.18.0.
- Bagimliliklari kur:

```
npm ci
```

Beklenen: exit 0, `found 0 vulnerabilities`. Baska kurulum gerekmez (framework/dis servis YOK).

## 2. Test kosma

```
npm test
```

- Beklenen: exit 0, tum testler PASS (son dogrulama: 350/350, tam suit EXIT=0, 2026-10-26 K13 turu — kanal-kaynakli, son-kanit.json d=10:29:46 h=081dc56 x=0, etiket k13-gozetimsiz-senaryo, log test-k13-gozetimsiz-senaryo.log; +10 K13 testi (gozetimsiz rozet 7 hermetik kirilim + CANLI 6-kosul paketi gercek cocuk sureclerle + senaryo B/C kompozit) dahil).
- Mutlak test sayisi sart degil (suite buyuyor); sart = exit 0 ve `fail 0`.
- Kapanis-kaniti kanali (K-0046 (e)/(f)): kabul.csv'ye sonek baglayacak koşumlar dogrudan `npm test` yerine kokten `powershell -ExecutionPolicy Bypass -File scripts\test-kanal.ps1 -Etiket <etiket>` ile koşulur — Tee logu `raporlar/kanit-hedef/test-<etiket>.log`'a iner, `son-kanit.json` {d,h,x,test,sureSn} yazar; sonek son-kanit.json'dan BIREBIR kopyalanir (elle yazilmaz).

## 3. Panoyu acma

```
npm run pano
```

Sunucu yalniz `http://127.0.0.1:<port>` dinler (public bind YOK). Ortam degiskenleri:

| Degisken | Varsayilan | Anlam |
|---|---|---|
| `ORDU_DB` | `data/ordu.sqlite` | Kalici defter (SQLite) dosya yolu; klasor yoksa yaratilir |
| `ORDU_PANO_PORT` | `8787` | Dinleme portu |
| `ORDU_PANO_TOKEN` | rastgele UUID | API tokeni; vermezsen her acilista yenisi uretilir ve konsola basilir |

Acilista konsola su satir basilir (token buradan alinir):

```
pano: http://127.0.0.1:8791  (x-pano-token: <uuid>)
```

Tarayicida `http://127.0.0.1:<port>` ac. Sayfa ilk veri cekiminde token ister (prompt); konsoldaki tokeni yapistir. Token tarayicida localStorage'da saklanir.

Not: Yeni/bos bir defterde rozet `DURDURULDU` gorunebilir — defter fail-closed acilir (`dispatch_paused=1`). Bu hata degil, tasarim; resume icin bkz. bolum 5.

## 4. Panoda ne gorulur

- 5 kart: Dogrulanmis Teslim, Bekleyen Karar, UNKNOWN (rezervasyon), Butce (harcanan/tavan token), Kritik Ihlal.
- 3 bolum: **Kapsuller** (run tablosu: id, planId, state, updatedAt), **Kararlar** (PENDING onaylar: runId, kind, createdAt), **Sistem** (insan mudahalesi sayaci, son 10 olay, ACIL DURDUR butonu).
- Ustte durum rozeti: AKTIF / DURDURULDU. Veri 5 saniyede bir otomatik yenilenir; tum degerler defterden turetilir (uydurma veri yok).

## 5. STOP / RESUME akisi

- **Acil durdur:** Panoda `ACIL DURDUR` butonu → onay promptuna `DURDUR` yaz. CLI'den: `node src/cli.ts stop`.
- **Resume (iki yoldan da ayni kapi):** B01 CLEAR_STOP onay metni zorunlu: `I understand the risk` (birebir, tirnaklar haric).
  - Pano: `/api/resume` govdesi `{"confirm":"I understand the risk"}`.
  - CLI: `node src/cli.ts resume --confirm "I understand the risk"`.
  - Yanlis/eksik metin bilincli olarak RED edilir (exit 1 / HTTP 400) — surtunme kapinin parcasi.

## 6. CLI kullanimi (src/cli.ts — gercek komut listesi)

```
node src/cli.ts status
node src/cli.ts stop [--actor A] [--reason R]
node src/cli.ts resume --confirm "I understand the risk" [--actor A] [--reason R]
node src/cli.ts tick
node src/cli.ts serve [--interval-ms N] [--max N]
node src/cli.ts capsule --goal "..." --repo R --commit <64hex> [--allow KOMUT]... [--provider P [--model M]]
node src/cli.ts approve --run <runId> --plan-hash <hash>
node src/cli.ts dispatch --run <runId>
node src/cli.ts evaluate --run <runId> --attempt <attemptId> --artifact <yol> [--expect metin]
node src/cli.ts decide --run <runId> (--approve|--reject)
```

- `status` → JSON: globalStop, pendingOutbox, reserved, unknown, son 5 olay. Exit 0.
- `stop` → global stop latch kurar; `{stopped:true}`. Exit 0.
- `resume` → onay metni olmadan exit 1; dogru metinle `{resumed:true, commandId}`. Exit 0.
- `tick` → tek dispatch gecisi: probe dogrular, B02 yetenek kapisi, outbox + reconcile + **sentPoll** (SENT oturumlarinin durum yoklamasi — S4 Scheduler; olum disarida olsa defterde gorunur). (R) 2026-10-26 SAVAS START canli kosum: `ORDU_LIVE=1 tick` → GERCEK Paseo spawn + SESSION_BOUND (run-ce03ca55; kanit raporlar/kanit-hedef/m02-savas-spawn-2026-10-26.md) — adaptor wire EDILDI (onceki 'wire edilmedi' notu bayatti).
- `serve` → tick DONGUSU — daemon surucusu (S4 Scheduler 2/2): her tur ayri `tick` cocuk surecinde (crash izolasyonu; probe/DURUM kapilari CLI'nin kendi exit kodlariyla yasar). Cadence `schedule.ts` disipliniyle (misfire/overlap SKIP — catch-up firtinasi yok; M08/M09/M10). STOP mandali her uyanista defterden okunur: mandal kapaliyken cocuk HIC spawn edilmez, acilinca ayni occurrence adil yeniden denenir. 3 ust uste kirmizi cocuk → fail-closed olum (exit, son cocugun kodu). SIGINT/SIGTERM temiz durus. Varsayilan aralik 30 sn (`--interval-ms`, 1000 alti RED). Sonsuz calisir; `--max N` tavanla sinirlandirilabilir. (R) 2026-10-26 canli koşum: uretim savas defterinde `serve --interval-ms 1000 --max 2` → 2/2 ok, sentPoll alive-running, overlap skip + cocuk bitince ayni occurrence adil retry dogal gozlendi (kanit raporlar/kanit-hedef/s4-scheduler-daemon-2026-10-26.md).
- Kapsul dongusu: `capsule` (plan+run kurar; --provider codex/glm-5.3 canli olculmus — kimi-K3 API'de RED, K-0050) → `approve` (insan:cli aktoru, plan-hash birebir) → `dispatch` (outbox doldurur) → `tick` (ORDU_LIVE=1 ile gercek spawn) → `evaluate` (bagimsiz dosya degerlendirici) → `decide` (teslim karari).
- CLI de `ORDU_DB` (varsayilan `data/ordu.sqlite`), `ORDU_PROBE` (varsayilan `evidence/probe-latest.json`), `ORDU_LIVE=1` (canli spawn beyani — YOKSA FATAL) ve `ORDU_PROVIDER` (dispatch aninda provider cozumu) okur.
- Bilinmeyen komut → kullanim satiri + exit 1.

## 7. Kanit dosyalari

- `raporlar/S1.1-KANIT-2026-10-14.md` — S1.1 uctan uca canli akis + F2-A/F2-B kaniti (event zinciri + hash'ler).
- `KANIT-baseline-2026-10-14.md` — baseline olcum + kabul.csv baglantisi.
- `test-out.txt`, `test-out-s11.txt`, `test-out-m16m03.txt` — tam suite ciktilari.
- `evidence/probe-latest.json` — runtime/SDK probe kaniti (tick bunu dogrular).
- Kapi matrisi `kabul.csv`: `../plans/kabul.csv` (115 madde; F0-A..F7-B kapilari; pano `/api/kabul` ucu ayni dosyayi servis eder).

## 8. Bilinen sinirlar

- Ucretli/dis API kapali: tum testler hermetik; gercek LLM/Paseo cagrisi YOK.
- Merge/deploy yok: core yalniz defter + dispatch + kabul kapilari; git merge ve yayinlama kapsam disi.
- Paseo adaptoru WIRE EDILDI (R 2026-10-26 SAVAS START: run-ce03ca55 gercek spawn + ajan urunu + evaluate PASS + ACCEPTED — kanit raporlar/kanit-hedef/m02-savas-spawn-2026-10-26.md; onceki 'wire edilmedi' siniri kapatildi). Probe receipt TAZE (R 2026-10-25: `npm run probe` EXIT=0, blocked listesi BOS, receipt a8580ad0). Not: package.json UTF-8 BOM bugu duzeltildi — probe.mjs JSON.parse BOM'da coker; suit probe.mjs'i kosturmadigi icin latent kaliyordu (kanit logu: raporlar/kanit-hedef/core-probe-faz3-2026-10-25.log).
- SENT oturumlarin durum yoklamasi tick'in sentPoll baciyla yapilir (S4 Scheduler, 2026-10-26); olum disarida olsa defterde RUNNING kalmaz. Periyodik otomatik koşum için `serve` (daemon sürücüsü) — tık'ler elle koşmak zorunda değilsin.
- Pano read-only + stop/resume'dur; plan onayi/karar verme panodan YAPILMAZ.

## 9. Dogrulandi (2026-10-14, Windows, Node v24.18.0)

Asagidaki komutlar bu dokumani yazan oturumda gercekten kosuldu:

| Komut | Sonuc | Exit |
|---|---|---|
| `npm ci` | `found 0 vulnerabilities` | 0 |
| `npm test` | `tests 186 / pass 186 / fail 0` (~36 sn) | 0 |
| `node src/cli.ts status` (temp ORDU_DB) | `{globalStop:true, pendingOutbox:0, reserved:0, unknown:0, lastEvents:[]}` | 0 |
| `node src/cli.ts stop --actor demo --reason dogrulama` | `{stopped:true, actor:"demo"}` | 0 |
| `node src/cli.ts resume --confirm "yanlis metin"` | `resume reddedildi: --confirm "I understand the risk" gerekli` | 1 (beklenen RED) |
| `node src/cli.ts resume --confirm "I understand the risk" --actor demo` | `{resumed:true, commandId:"62041f16-..."}` | 0 |
| `node src/cli.ts tick` | `{dispatch:"BLOCKED", reason:"capability-blocked: worktreeIsolationProven,..."}` | 2 (beklenen kapi) |

2026-10-25 yeniden dogrulama (TUR C): `npm test` 299/299 EXIT=0 — **iki ust uste tam suit kosumu** (K6 flake duzeltmesi sonrasi); `node src/cli.ts tick` (temp ORDU_DB) probe-BAYAT RED exit 1 — §6/§8 guncellendi. Ayrinti: raporlar/capraz-sorgu-devir2038-2026-10-25/.

Pano kalici-DB dogrulamasi (temp klasor `%TEMP%\ordu-demo-db`, port 8791, token env'siz birakildi):

1. `Start-Process node src/pano-server.ts` (arka plan, ORDU_DB/ORDU_PANO_PORT set) → konsol ciktisina token basildi: `pano: http://127.0.0.1:8791  (x-pano-token: 1b1a0b7e-3d20-4067-97df-f297e706602d)` — token basilmasi dogrulandi.
2. `Invoke-WebRequest http://127.0.0.1:8791/healthz` → 200, govde `ok`.
3. `Invoke-WebRequest http://127.0.0.1:8791/` → 200, `content-type: text/html`, 6215 byte HTML.
4. `/api/status` tokensiz → 403; dogru tokenle → 200 JSON (globalStop:true, bos run listesi).
5. Kalici dosya yaratildi: `ordu-demo-db\ordu.sqlite` (+shm/wal) — kalici DB dogrulandi.
6. Dogrulama sonrasi surec `Stop-Process` ile olduruldu, temp klasor temizlendi; acik sunucu birakilmadi.

2026-10-25 FAZ-3 canli battery (temp ORDU_DB, makine EXIT; log: raporlar/kanit-hedef/core-cli-faz3-2026-10-25.log):

| Komut | Sonuc | Exit |
|---|---|---|
| `npm run probe` | 4 yetenek canli kanit + blocked listesi BOS; receipt a8580ad0 | 0 |
| `node src/cli.ts status` | globalStop:false, bos defter | 0 |
| `node src/cli.ts stop` | `{stopped:true}` | 0 |
| `node src/cli.ts resume --confirm "yanlis"` | resume reddedildi | 1 (beklenen RED) |
| `node src/cli.ts resume --confirm "I understand the risk"` | `{resumed:true, commandId:6b4131bd-...}` | 0 |
| `node src/cli.ts tick` | dispatch IDLE: outbox 0, reconcile 0 | 0 |

Ilk kez: probe BOS-blocked + tick exit 0 (oncesi: probe-BAYAT exit 1 / capability-blocked exit 2). Paseo adaptoru hala wire degil — tick IDLE kaliyor. Ayrica 2026-10-25 BOM duzeltmesi: core/package.json UTF-8 BOM tasiyordu, probe.mjs JSON.parse cokuyordu (suit probe.mjs kosturmaz — latent; kanit: raporlar/kanit-hedef/core-probe-faz3-2026-10-25.log).