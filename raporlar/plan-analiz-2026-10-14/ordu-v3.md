# ORDU-V3 DERİN ANALİZ — 2026-10-14 (çerçeve v3.2, 15 alan)

Bağlam ~%35. Hedef: `D:\Vibecode\silinecek-task-graph\ordu-v3` (+ kanıt tabanı `ordu-core`).
Yöntem: tüm plan dosyaları + kararlar okundu, `kabul.csv` makineyle sayıldı, `npm test` bu oturumda
iki kez GERÇEKTEN koşturuldu, iddialar (LAN çelişkisi, heartbeat LLM-poll) koda/dosyaya bakılarak doğrulandı.
Etiketler: (R) resmî ölçüm/kanıt · (T) tahmin · * tek-kaynak.

## Bağımsız doğrulama özeti (bu oturumda koşulan kanıtlar)

- `npm test` (ordu-core): **115/115 PASS, 0 fail** (R) — v3.3 raporundaki "102/102" eskidi;
  `schedule.test.ts` (7 test, M08/M09/M10) 14.10 00:22'de eklenmiş, suit büyümüş.
- `kabul.csv` güncel sayım (R): **65 satır — 31 NOT_RUN**, 23 GECTI_HERMETIC, 6 KISMEN, 3 GECTI,
  1 PASS_PARTIAL, 1 BLOCKED (B02). Eski rapor iddiaları: v1/v2 "62 satır / 41 NOT_RUN" — o dönemde doğruydu,
  artık BAYAT. "47" sayısı hiçbir raporda NOT_RUN olarak bulunamadı; muhtemel karışıklık:
  40-kabul'daki "47/47 hermetik" test-batch sayısı. Güncel gerçek: **31**.
- ADR taraması: ADR-011 + ADR-012 mevcut (`kapsul-final-v2.0.0 notio/governance/` +
  `Kapsul-Autonomous-Army-Master-v3.0.0` docs/MASTER-PLAN/README içinde atıflı) (R).
- LAN §2/§8 çelişkisi iddiası: **DOĞRU (TASARIM-EKSIK)**. `20-uzaktan.md:31` "Ev ağı:
  http://<host-lan-ip>:4378" derken aynı dosya `20-uzaktan.md:100` (§8) "core portu host ağına
  yayınlanmaz (bind 127.0.0.1)" diyor. LAN'a açık dinleme ile 127.0.0.1-only bind aynı anda olamaz.
  40-kabul V3-S2.4 de §8'i tekrarlıyor ("core portu LAN'a yayınlanmıyor (bind kanıtı)") — §2 yetim kaldı.
- Heartbeat gizli LLM-poll iddiası: **DOĞRU (TASARIM-EKSIK)**. `20-uzaktan.md:34-36` (§2) bildirimin
  "asıl yolu" olarak `paseo heartbeat create --cron "*/20 * * * *" "pano özetle: ..."` öneriyor —
  Paseo heartbeat'i tanım gereği her tikte bir LLM turu koşturur; bu, aynı dosyanın §9'undaki
  (`20-uzaktan.md:104`) "**LLM'e bildirim polling'i kurdurulmaz**" kuralıyla birebir çelişir.
  Kod tarafında heartbeat implementasyonu YOK: `rg -i heartbeat ordu-core/src` → 0 sonuç (R).
  Yani hem tasarım iç-çelişkisi var hem kanıt NOT_RUN (kabul.csv:53 V3-S2.3).

## Alan tablosu (0–10; canlı kanıt yoksa tavan 8 kuralı uygulandı)

| Alan | Ağırlık | Skor | Tek satır |
|---|---|---|---|
| Teslim | 14 | 4 | Uçtan uca canlı teslim hiç koşmadı (V3-S1.1/A15/M03 NOT_RUN); hermetik kapılar güçlü ama "teslim" henüz kağıt + hermetik. |
| Yetki/güvenlik | 13 | 7 | A13 sahte-PASS, A35/A36 fence, fail-closed modlar, B02 capability kapısı testli (R); M04 uzaktan güvenlik NOT_RUN + LAN §2/§8 çelişkisi. |
| Halüsinasyon/kanıt | 10 | 8 | Paketin en güçlü yanı: "kanıtsız PASS=bug", GECTI_HERMETIC/NOT_RUN ayrımı dürüst, 115/115 bu oturumda doğrulandı; canlı evaluator NOT_RUN → tavan 8. |
| Long-run/recovery | 10 | 8 | closure.test U1–U7 (SENDING/kör-respawn-yok/reconcile/STALE/orphan/expiry) + durable registry + restart latch hermetik (R); gerçek kill -9 NOT_RUN. |
| İzleme | 8 | 5 | telemetry.ts + 5 KPI metrik testi hermetik; pano UI/S2 yok, canlı ölçüm V3-S4 NOT_RUN. |
| Otonomi | 7 | 4 | Merdiven (ADVISORY→SUPERVISED→BOUNDED_AUTO) iyi tasarım; şerit varsayılan kapalı ve tamamen NOT_RUN. |
| Manager | 6 | 6 | supervisor.ts deterministik manager (PLAN_APPROVED, DAG readiness, bounded repair ≤2, NEEDS_DECISION) testli; gerçek LLM manager NOT_RUN. |
| Handoff | 5 | 6 | handoff.ts kapalı şema + 7 test, dispatchNode'a zorunlu bağlı (R); canlı kullanım yok. |
| Coding | 5 | 5 | git-worktree-launcher gerçek `git worktree add` ile temp repo testinde kanıtlı (R, harcamasız); provider CLI uçtan uca worker RT2 NOT_RUN. |
| Reasoning | 4 | 3 | M18 makbuz kapısı yalnız tasarım (30-ogrenme §6), kod/test yok, NOT_RUN. |
| Paralellik | 4 | 4 | A24 WAIT_CAPACITY yakmasız + A07 rezervasyon-slot hermetik; 2 izole kapsül canlı NOT_RUN. |
| Schedule | 4 | 4 | schedule.ts + 7 test bu gece eklenmiş (M08 dedupe/M10 catch-up-yok hermetik, R) ama csv hâlâ NOT_RUN (entegrasyonsuz saf modül) + heartbeat LLM-poll çelişkisi. |
| Memory | 4 | 2 | L1–L4 kanalları ve M13 zehirli-lesson karantinası tamamen NOT_RUN; ordu-core'da lesson/imza kodu yok (rg 0 sonuç, R). |
| Hız/maliyet | 3 | 3 | Maliyet/kabul metriği "bilinmiyor≠0" disipliniyle testli; gerçek ölçüm yok (ECON NOT_RUN). |
| Taşınabilirlik | 3 | 5 | ADR-012 çift-runtime + local-runtime 51/51 hermetik (R); local canlı uç-uca RT2/RT3 NOT_RUN. |

## Ağırlıklı toplam

(14·4 + 13·7 + 10·8 + 10·8 + 8·5 + 7·4 + 6·6 + 5·6 + 5·5 + 4·3 + 4·4 + 4·4 + 4·2 + 3·3 + 3·5) / 10
= (56 + 91 + 80 + 80 + 40 + 28 + 36 + 30 + 25 + 12 + 16 + 16 + 8 + 9 + 15) / 10 = **54.2 / 100**

## İlk 3 açık (kod yeri + kabul testi + durum)

1. **Canlı uçtan uca kapsül hiç koşmadı** — kod: `ordu-core/src/cli.ts` + `supervisor.ts` + `dispatcher.ts`;
   kabul testi: `40-kabul.md` S1/V3-S1.1 (hedef→plan→onay→coder→frozen→evaluator→insan kabulü, CLI'dan);
   durum: **KANIT-EKSIK** (kabul.csv:42 NOT_RUN). Bu tek kapı kapanmadan Teslim/İzleme/Otonomi alanları 8'i geçemez.
2. **Uzaktan güvenlik tasarım çelişkisi + kanıtsızlık** — kod: (henüz yok; S2 işi) plan: `20-uzaktan.md:31` (§2 LAN'a aç)
   vs `20-uzaktan.md:100` (§8 bind 127.0.0.1); kabul testi: V3-S2.4 (`40-kabul.md`, token iptali akışı keser + bind kanıtı + anonim RED);
   durum: **TASARIM-EKSIK + KANIT-EKSIK** (M04 NOT_RUN). Çözüm: §2'yi "LAN'a yayın YOK; Tailscale/SSH-tunnel tek yol" ile hizala.
3. **Heartbeat = gizli LLM-poll çelişkisi** — plan: `20-uzaktan.md:34-36` (§2, */20 cron LLM turu) vs `20-uzaktan.md:104`
   (§9 "LLM'e bildirim polling'i kurdurulmaz"); kod: yok (rg 0 sonuç); kabul testi: V3-S2.3 + V3-S2.5 (sessiz-akış + durable outbox M07);
   durum: **TASARIM-EKSIK + KANIT-EKSIK** (ikisi de NOT_RUN). Çözüm: bildirimi event-driven core outbox'a taşı, LLM yalnız özet metnini yazsın.

## Hüküm

ordu-v3, bu workspace'teki planlar arasında kanıt disiplini en yüksek paket: "kanıtsız PASS = bug" kuralı yalnız
söylem değil — kabul.csv'deki GECTI_HERMETIC/NOT_RUN ayrımı, bu oturumda 115/115 yeşil koşan test suiti ve
gerçek git-worktree provasıyla destekleniyor; NOT_RUN'lar başarısızlık değil, dürüstçe işaretlenmiş sıradaki iş.
Buna karşılık paket hâlâ bir "işletme katmanı" iddiasında: tek bir canlı kapsül bile uçtan uca koşmadığından
(V3-S1.1) Teslim 4'te, İzleme/Otonomi ortada kalıyor; 20-uzaktan'daki iki iç çelişki (LAN §2/§8, heartbeat
§2/§9) kullanıcıya en çok dokunan yüzeyin — uzaktan izlemenin — henüz düşünülmediğini gösteriyor; Memory ve
Reasoning makbuzu tamamen tasarım aşamasında. 54.2/100 adil: tasarım A-, kanıt tabanı B+, canlı ürün F.
Tek hamlelik en yüksek getiri: V3-S1.1'i koşturmak — o kapı düşerse 6 alan birden puan kazanır.

## İyileştirme turu sayısı

Kanıt dalgası olarak **8 tur** (R, 40-kabul damgaları + git izleri): 18/18 → 30/30 → 36/36 → 47/47 → 51/51
(çift-runtime) → 59/59 (modlar) → 102/102 (closure+handoff+metrics) → 115/115 (schedule, bu gece).
Üstüne 3 karar turu: K-0004 (6 gap denetimi), K-0005 (ADR-012), K-0006 (SSOT devralma).