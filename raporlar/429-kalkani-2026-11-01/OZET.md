# ÇOKLU-PROJE 429-KALKANI (PK-1) — PK-a + PK-b + PK-c KAPANIŞ RAPORU

**Kimlik:** PK-1, yazıcı dalgası PK-a/PK-b/PK-c. **Plan:** `plans/COKLU-PROJE-429-KALKANI-PLANI-2026-11-01.md` (PK-d [insan] ve PK-e ayrı emir — bu dalgada YOK). **Damga:** 2026-11-01 16:02 (yerel, ölçüldü — `date`). **Sürüm disiplini:** v0.24 mührü KORUNDU — `plugin/server/surum.ts`, `plugin/package.json` `version`, `surumler/`, git tag'e DOKUNULMADI; drift bekçisi (dedektor.test.ts) tam süit içinde yeşil.

## Teslim dosyalar

| Dosya | İçerik |
|---|---|
| `plugin/server/kalkan429.ts` | YENİ modül — PK-a defter + PK-b kapı + PK-c dirilme (tek 429-evinde) |
| `plugin/index.server.ts` | İnce bağlantı: `before("agent.create")` kapı kaydı (enjeksiyon hook'undan ÖNCE, RED gelirse enjeksiyon da atlanır) + `agent.turn_ended` başında best-effort kalkan bloğu + `dirilmeKapat` remover |
| `plugin/test/kalkan429.test.ts` | YENİ hermetik test — 59 vaka (defter şeması, sayı sayacı, pencere kararı, env kapatma, dirilme tavanı, RED defteri) |
| `plugin/package.json` | YALNIZCA `test` satırına `tsx test/kalkan429.test.ts` eklendi (version alanı değişmedi: 0.24.0) |
| `plugin/.gitignore` | `data/` satırı (runtime defter evi git dışı) |
| `raporlar/429-kalkani-2026-11-01/OZET.md` + `OZET.json` | Bu rapor + makine-okunur yan dosya |

## Ne yapıldı (plan → kod)

- **PK-a telemetri:** `agent.turn_ended` → `outcome.kind==='failed'` + error metninde `429` / `rate[\s_-]?limit` / `RPM|requests per minute` deseni → sınıf etiketi (`http-429` / `rate-limit` / `rpm`) çıkarılır → **append-only defter** `plugin/data/429-defter.jsonl` (satır: `{damgaISO, agentId, workspaceId, provider, hataSinifi, tip}`; `openSync("a")` + `writeSync` + **`fsyncSync`** + `closeSync`). Error metni/token ASLA deftere girmez (yalnız sınıf etiketi). `sonNdk(n)` sayacı defterden okur.
- **PK-b pencere kapısı:** `server.before("agent.create")` → son pencerede (varsayılan 10 dk) ≥2 adet 429 → yeni ajan oluşturma **RED** (`throw new Error(mesaj)` = oluşturma iptali, kanit/02 §2). Dürüst mesaj: «429 penceresi açık — son X dakikada N adet 429 (eşik 2); ~Y dk sonra tekrar dene. Defter: <yol>». `ORDU_429_KAPI=0` kapatır (varsayılan AÇIK); `ORDU_429_PENCERE_MS` pencere uzunluğu. Daemon `internal` ajanları kapıdan muaf (mevcut desen).
- **PK-c zamanlanmış dirilme:** 429 failed turu → aynı handler `setTimeout` kurar (varsayılan 12 dk, `ORDU_429_DIRILME_MS`), tetikte `paseo.agents.ref(id).send("429 penceresi geçti — kaldığın işten kalıcı kayıtlardan devam et")`. Ajan başına sayaç: **en fazla 2 otomatik deneme**, sonra insan kapısı (log). Bekleyen dirilme varken çift plan yok; `completed` tur = fırtına bitti kanıtı → bekleyen iptal + sayaç sıfır; `agent.closed` → temizlik defteri (temizlik.ts) temizler; plugin unload → `dirilmeKapat` hepsini iptal. Zamanlayıcı `unref` (daemon kapanışını 12 dk bekletmez). Handler 30 sn içinde bitirilir (bekleme YOK — sadece plan kurulur).

## Test sonuçları (ölçüldü, tahmin yok)

- Yeni dosya: **59 vaka, 0 FAIL** (`tsx test/kalkan429.test.ts` EXIT=0).
- Tam süit `npm test`: **11 dosya EXIT=0, 505 "ok:" assert (446 mevcut + 59 yeni), 0 FAIL** — mevcut 446 assert sayısı KD-a kapanış değeriyle birebir.
- `npx tsc --noEmit`: **EXIT=0** (kod değişikliğinden sonra yeniden koşuldu).
- Test kapsamı: defter şeması (6 alan, ISO damga, gizli-değer sızmaz) · sonNdk sayacı (kapi-red + bozuk satır + ileri damga sayılmaz) · pencere kararı RED/izin + eşik + `ORDU_429_PENCERE_MS` (geçersiz değer varsayılana düşer) · `ORDU_429_KAPI=0` (RED yok + deftere yazılmaz; env silinince fail-closed geri gelir) · RED deftere işlenir + sayaca karışmaz (kendini besleyen pencere yok) · dirilme dedupe/tavan-2/completed-sıfırlama/agent.closed/unload · defter okuma-yazma hatası yutulur (izin yönünde bozulmaz) · varsayılan defter yolu.

## Dürüst sapmalar + sınırlar

1. **Defter satırına `tip` alanı eklendi** (spec 5 alan + tip): «RED deftere işlenir» gereksinimi için ayrıştırıcı. Sayaç yalnız `tip='429'` okur — kapı retleri sayaca girmez, yoksa her RED pencereyi sonsuz kızılı tutardı.
2. **Defter evi `plugin/data/429-defter.jsonl`** («plugin'in veri dizini» somutlaştırması). `ORDU_429_DEFTER` tam yol olarak geçersiz kılar. Paseo plugin'i eval bağlamında yükler (`import.meta.url` tanımsız — BUG-2026-10-25); o bağlamda varsayılan sabit `D:\Vibecode\ordu\plugin\data\...` (pano.ts B20 deseninin kardeşi).
3. **Okuma hatası → sayaç 0 → izin** (fail-open okuma): defter okunamıyorsa kanıt yoktur; kapı veri kaynağı bozukken spawn bloke etmek dürüst değil. Yazma hatası yutulur + loglanır (event best-effort — akış asla bloke olmaz). Bu davranış S8'de kanıtlandı.
4. **Dirilme sayacı `completed` turda sıfırlanır** (plan yalnız «en fazla 2 otomatik deneme» der): dirilmenin işlediğinin kanıtı olan başarılı tur, yeni bir fırtına için taze butçe verir. Sonsuz döngü koruması tavan-2 ile yerinde.
5. **fsync kod-yolu garantisi:** `openSync("a")`+`writeSync`+`fsyncSync` kullanıldı; fsync'in diskteki etkisi runtime'da ayrıca ölçülmedi ( dürüst sınır).
6. **Rotasyon:** 5 MB üstünde son 2 MB korunur (telemetri.jsonl D2-08 deseni) — 429 hacmi düşük olsa da sınırsız büyüme kapanmadı.
7. **Pencere toleransı +60 sn:** ileri damgalı satırlar (daemon restart/saat kayması) cezalandırılmaz; daha ilerisi sayılmaz.
8. **Canlı 429 uçuşu test EDİLMEDİ** (görev sınırı: canlı ajan spawn yok). Hermetik fixture ile sınırlar ölçüldü; canlı gözlem operatöre kalır. Eventler best-effort → defter ALT SINIR gösterir.
9. **package.json test satırı güncellendi** (yeni testin süite girmesi zorunluydu); `version` alanı ve diğer sürüm artefaktları DOKUNULMADI. `plugin/node_modules` dokunulmadı. COMMIT ATILMADI, PUSH YOK (tek elden operatör).

## Canlıya alınma (operatör için)

1. `paseo plugin reload paseo-verimlilik` (daemon restart YOK).
2. Env'ler (hepsi opsiyonel, varsayılanlarıyla çalışır): `ORDU_429_KAPI=0` kapıyı kapatır · `ORDU_429_PENCERE_MS` (ms; varsayılan 600000) · `ORDU_429_DIRILME_MS` (ms; varsayılan 720000) · `ORDU_429_DEFTER` (defter tam yolu).
3. Dürüst not: reload anında bekleyen dirilme planları kaybolur (best-effort — kodda ve bu raporda yazılı); defter kaydı kalıcıdır.
4. İlk 24 sa baseline: defteri `plugin/data/429-defter.jsonl` satır sayısıyla okuyun (pano ucu PK-e, ayrı emir).
