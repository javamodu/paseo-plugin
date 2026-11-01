# BAKIM — GÜVENLİK + PERFORMANS (kalıcı bakım düzeni; 2026-11-01)

**Kimlik:** BAKIM-GP-1. **Kaynak:** kullanıcı emri 2026-11-01 («güvenlik ve performansı artır ve bu bakımları kalıcı hale getir dökümanlara yaz») + bağımsız GÜVENLİK-DENETCI denetimi ([rapor](../raporlar/gelen-kutu/GUVENLIK-DENETCI-2026-11-01.md) · [json](../raporlar/gelen-kutu/GUVENLIK-DENETCI-2026-11-01.json) — 27 madde; operator 3 spot-check ile koda karşı teyit etti). **Damga:** 2026-11-01 04:31 (ölçüldü).

## A — Düzeltme paketi (tek yazıcı BAKIM-YAZICI; mevcut write-set: 3 pano dosyası + yeni test dosyaları)

| ID | Bulgu (siddet) | Düzeltme | Dosya |
|---|---|---|---|
| GD-001 | 4930 `ACAO: *` + tokensız POST (orta) | ACAO → `http://127.0.0.1:4377` sabit (izole koşum port'u gerekiyorsa ortam değişkeninden al, ör. `DENEY_CORS_ORIGIN`); deney POST uçlarına PANO_TOKEN fail-closed | pano/deney-server.mjs |
| GD-002 | `manager-yanit` kimliksiz (orta) | uca PANO_TOKEN zorlaması + kayda «doğrulanmamış» alan işareti (sahte ai-manager yanıtı ayırt edilir) | pano/deney-server.mjs |
| GD-003 | iskelet.html esc'siz innerHTML (orta) | esc() deseni — kapsul-tuval.html:1012'den aynı imza | pano/iskelet.html |
| GD-004 | token `!==` zaman-sabit değil (düşük) | crypto.timingSafeEqual (uzunluk ön-kontrolü ile) | pano/server.js |
| GD-005 | renameSync yakalanmamış throw (düşük) | try/catch + 500 jsonYaz | pano/server.js |
| GD-006 | gövde `+=` Buffer→string bozulması (düşük) | Buffer.concat deseni (deney-server.mjs:133-151'deki gibi) | pano/server.js |
| GD-008 | durum her çağrıda 4 JSONL baştan okur (orta, perf) | tail/byte-offset okuma veya mtime dondurma + perf_hooks ölçüm noktası (süre + JSONL boyut izi) | pano/deney-server.mjs |
| GD-009 | 30sn döngüde tam-yeniden-çizim (perf) | JSON-imza dirty-check — veri değişmediyse render atla | pano/kapsul-tuval.html (**ORDU-1** — steer edildi) |
| GD-010 | tuvalCiz her düğüme ayrı listener (perf) | svgEl'e tek delege dinleyici | pano/kapsul-tuval.html (**ORDU-1** — steer edildi) |

GD-009/010 ORDU-1'in aktif yazım dosyasıdır → ORDU-1 kapanış kapsamına steer edildi; yapamazsa bu plana geri düşer (sonraki fiş). BAKIM-YAZICI bu 2 maddeye DOKUNMAZ.

**Kanıt ölçütleri (BAKIM-YAZICI):** pano süiti ×2 yeşil + graf-yaz 7/7 + graf-yonetim 32/32 bozulmaz · yeni uç testleri: token'sız POST → 401/403, token'lı → 200; CORS başlık sabit-değer teyidi · izole koşum (yeni port; 4377/4930/4933 DOKUNULMAZ) · perf ölçüm noktaları kayıtlı değer üretir (O2 kaynağı) · kapanışta bağımsız salt-okur denetim. **4377 canlı etkisi: restart [insan] onayı sonrası** (EK-2).

## B — Kalıcı bakım düzeni (dökümana yazıldı — bu bölüm)

- **Denetim cadence'ı:** her dalga kapanışında bağımsız salt-okur güvenlik denetçisi koşumu (write-set · token · E10/E11 · §H pinleri) → `raporlar/gelen-kutu/GUVENLIK-DENETCI-<tarih>.md`+`.json` (append-only; K-0017/schemaSurum:1 şeması değişmez). Bu günki koşum: 2026-11-01 (27 madde — taban).
- **Ölçüm noktaları (O2/K8-3 hattı):** sunucuda perf_hooks (durum çevresi + JSONL boyut izi) · istemcide PerformanceResourceTiming. **Puan yalnız bu kaynaktan türetilir — §H(f).**
- **Taban değerler (ölçülmüş 2026-11-01):** tam core süiti 467/467 · 0 kırmızı · 62,3 sn (exit 0) · saglik.ps1 17 OK · 1 EKSIK (CODEMAP taze) · 2 SARI (bilinen).
- **§H senkronu:** düzeltme paketi kapanınca [K8-2 planı](K8-DALGA2-PLANI-2026-10-31.md) §H satırları kod-durumuna güncellenir (write-set KISMI→VAR vb.).
- **Kayıtlar:** kapanışta log.jsonl kapanış satırı + STATE damgası + CODEMAP taze + (varsa) DERSLER maddesi.

## C — Bekleyen insan kararları (EK-2 — emirsiz dokunulmaz)

| Konu | Durum |
|---|---|
| **Qoder tracker** (`.git/hooks/post-commit` — üçüncü taraf betik her commit'te koşuyordu; operator bağımsız teyit etti) | **KALDIRILDI 2026-11-01** (kullanıcı emri: «qoder kullanmıyoruz iptal edelim» + «paseo altında kullanmıyorum»); D:\Vibecode süpürmesi: üst-düzey repolarda tek iz ordu'daydı (paseo-verimlilik temiz); hook `%TEMP%\ordu-post-commit-qoder-iptal-2026-11-01`'e taşındı (karantina — içerik denetçi JSON'unda kayıtlı); merge-guard `pre-commit` dokunulmadı; npm-cache kopyası (`_npx/c1f04ec6f4cc1353`) artık tetiklenmiyor — istenirse ayrıca silinir |
| 4377 restart (server.js düzeltmelerinin canlıya geçişi) | **[insan] onayı bekler** |
| GD-009/010 ORDU-1 kapanışına sığarsa | otomatik; sığmazsa bu plandan sonraki fişe düşer |

**Yürütme disiplini:** BAKIM-YAZICI paralel yazıcı tavanı (3) ilk slot boşalınca brief'lenir (A/B/ORDU-1'den biri kapanınca); mevcut dosya ≤3 kuralı: deney-server.mjs · iskelet.html · server.js (+ yeni test dosyaları serbest). Ajanlar COMMIT ATMAZ — commit tek elden operator. Bu commit YERELDIR.

## D — KAPANIŞ (2026-11-01 05:22; ölçüldü)

**BAKIM-YAZICI (a61d71de) döndü — kanıt zinciri:** (1) operator bağımsız tekrar `node --test` 6 paket **109/109 yeşil 0 fail** (deney-server 13 + iskelet 4 + server-bakim 6 + graf-yaz 7 + graf-yonetim 32 + kapsul-tuval 47); (2) grep pinleri: aktifCorsOrigin deney:56/237/772 · dogrulanmamis :697 · esc iskelet:34-37 · timingSafeEqual server:15/31-37 · try/catch server:220-229/258-266/286-296 · Buffer.concat server:53 · olcumOku deney:68/799; (3) BAKIM-YAZICI A/B ölçümü: /api/deney/durum okuma 1. çağrı 91 462 B → 2..21. çağrı 0 B/0 okuma; sunucu-içi medyan 1,374 ms; restartsız taze korundu (statSync her istekte). GD-007 (Qoder) + GD-009/010 (ORDU-1) zaten 58fd9f4'te işlendi. **Dürüst notlar:** d1a 6/7 + d1b 11/12 kırmızıları ÖNCE DE VARDI (GRAF SSOT v6→v14 sabit pinleri + ORDU-1'in dizge kaldırması — HEAD koşumuyla kanıtlandı; bu paketten DEĞİL). Write-set DEĞİŞMEDİ. Canlıya geçiş: 4377+4930 restart **[insan] onayı bekler** (EK-2). Denetçi JSON islenme: GD-001..006+008 KAPANDI (7/7).
