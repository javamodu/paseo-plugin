# HEDEF — Ordu yetkinlik haritasi (v1.3 · 2026-10-14 · TASLAK, K-0034'e bagli)

> Tek bakis belgesi: istenen yetenek → bizde durumu → rakip repolarda var mi.
> Isaretler: VAR = kod + hermetik test kanitli (canli dogrulama hucre icinde not edilir; VAR != canli kanit) · KISMEN = bir parcasi var · PLAN(F#) = planli, faz bagli · YOK = yazilmadi
> Kanit seviyeleri: tasarim / uygulama / hermetik test / canli dogrulama - VAR(hermetik) canli kanit DEGILDIR.
> Rakip sutunlar: EVET / KISMEN / — (kaynak: rakip karsilastirma analizi 2026-10-14, * tek-kaynak; canli dogrulanmadi)
> Bizim sutun gercek: 252/252 test exit 0 + canli kimi-K3 teslimi (R).

> Uygulama otoritesi: plans/PLAN.md v2.9 · Kanit defteri: kabul.csv · Bu belge yalniz NE istendigini soyler.

## 1. Komuta ve yurutme

| Yetenek | Bizim (ordu-core) | Paperclip | Claude Squad | PocketFlow | smolagents | PydanticAI |
|---|---|---|---|---|---|---|
| Tek komuta zinciri (insan→manager→worker) | VAR (capsule→approve→dispatch→evaluate→decide, canli kanitli) | EVET | KISMEN | — | KISMEN | KISMEN |
| Graph/node/gate + bagimlilik | VAR (nodes + dependencies_json + kapali durum makinesi) | KISMEN | — | EVET | — | EVET |
| Coklu task + panel izleme | VAR (hermetik + tek-run canli; F5-C canli 2-paralel kaniti NOT_RUN) | EVET | EVET | — | — | — |
| Rol basina model secimi | PLAN(F6.5: nodes.provider migration) | EVET | EVET | EVET | EVET | EVET |
| Durdur/deadline/yetki iptali gercek etki | KISMEN (STOP kalici testli; canli SLO V3-S1.6 NOT_RUN) | EVET | KISMEN | — | — | KISMEN |

## 2. Kalite ve kabul

| Yetenek | Bizim | Paperclip | Claude Squad | PocketFlow | smolagents | PydanticAI |
|---|---|---|---|---|---|---|
| Bagimsiz evaluator (coder kendi kabul edemez) | VAR (A13 + settle + decideApproval; canli evaluate PASS) | KISMEN | — | — | — | KISMEN (Evals var, otorite bizde) |
| Kalici rubric + surumleme | PLAN(R2: kayit semasi tanimli, kod yok) | KISMEN | — | — | — | EVET (Evals) |
| Gorev-turune gore kabul (arastirma/kod/UI payload) | PLAN(R9: zarf+payload tanimli) | — | — | — | — | KISMEN |
| Sahte-PASS reddi | VAR (A13: exit0 + test_count>0 + donmus aday) | — | — | — | — | — |

## 3. Cok-LLM arastirma konseyi

| Yetenek | Bizim | Paperclip | Claude Squad | PocketFlow | smolagents | PydanticAI |
|---|---|---|---|---|---|---|
| 5 LLM bagimsiz uretim → capraz review → revizyon turu | PLAN(F8 turnuva yoneticisi, 7 adim R1) | — | — | KISMEN (ornek debate akisi) | KISMEN | KISMEN |
| Surumlu cevap + review kaydi (rubricVersion bagli) | PLAN(R1/R2) | — | — | — | — | KISMEN |
| Uydurma kaynak on-kontrolu | PLAN(F8 on-kontrol adimi) | — | — | — | — | — |
| Kor review (model kimligi gizleme — uygulanabilirligi ayrica degerlendirilir; mutlak tarafsizlik iddiasi YOK) | PLAN(F8) | — | — | — | — | — |

## 4. Izolasyon ve izin

| Yetenek | Bizim | Paperclip | Claude Squad | PocketFlow | smolagents | PydanticAI |
|---|---|---|---|---|---|---|
| Uc cikti modu (yalniz cevap / izinli dizin / worktree) | KISMEN (worktree testli; izinli-dizin ve yalniz-cevap R7) | KISMEN | EVET (worktree) | — | KISMEN | — |
| Dosya-bazi izin + symlink/traversal kontrolu | KISMEN (allow-list; M26/M31 canli negatif NOT_RUN) | EVET | — | — | KISMEN | — |
| Gorunmeyen alt ajan reddi (5 sart) | PLAN(R8) | KISMEN | — | — | — | KISMEN |
| Vekalet grant (5 karar tipi, vekil kendi yetkisini buyutemez) | PLAN(R3: approvals.action genislemesi) | EVET (approvals var, vekil ayrimi *belirsiz) | — | — | — | — |
| Eski ajanin yazma yetkisi devirde kapanir (receipt reddi yetmez) | KISMEN (A36 fence receipt tarafi; yazma kapanisi R8'e eklendi) | — | — | — | — | — |

## 5. Dayaniklilik ve otonomi

| Yetenek | Bizim | Paperclip | Claude Squad | PocketFlow | smolagents | PydanticAI |
|---|---|---|---|---|---|---|
| Crash recovery + reconcile (UNKNOWN, kor retry yok) | KISMEN (reconcile canli gozlendi: 'still-unknown' dogru fail-closed; basarili toparlanma canli kaniti NOT_RUN) | KISMEN | — | — | — | KISMEN (dis durable runtime ister) |
| Handoff (minimal kayip, fence korumali) | VAR (hermetik: 4-asamali DTO + A36 - yazma kapanisi kaniti ayri: K12-08; canli ajan→ajan kaniti NOT_RUN) | KISMEN | — | — | — | — |
| Watchdog + sure-sinirli tur (07:00 vardiyasi) | VAR (paseo schedule+heartbeat gece kanitli; core tarafi +150-300) | KISMEN | — | — | — | — |
| Ogrenme (karantina→promote, geri-alim) | VAR (lessons.ts testli) | — | — | — | — | — |
| Telemetri/KPI (teslim, mudahale, ihlal) | VAR (telemetry.ts, pano canli) | EVET | — | — | KISMEN | EVET (OTel) |
| Dis sistem idempotency + desteklemeyende uzlastirma/insan karari | KISMEN (A06 dedupe var; dis-sistem ayrimi brief 10'dan) | — | — | — | — | — |
| Butce asim riski gorunurlugu (gecikmeli/in-flight kullanim) | PLAN (pano rozeti; brief 10) | KISMEN | — | — | — | — |
| Paseo'suz bagimsiz core | KISMEN (core ayri surec; F7-B tam dongu NOT_RUN) | EVET | EVET | EVET | EVET | EVET |
| UI-tester adaptor (canli UI testi; ayri test hesabi + browser profili + tek sahip mouse/keyboard; screenshot tek basina PASS degil) | PLAN(F9) | — | — | — | — | — |

## 6. Farkimiz (dürüst)

Incelenen kaynaklarda birlikte DOGRULANMAYAN ve bizde kanitli olan kombinasyon (mutlak 'hicbirinde yok' iddiasi DEGILDIR - rakip sutunlari tek-kaynak analize dayanir):
**kapali kapi zinciri (A13 sahte-PASS reddi + A36 fence + onaysiz dispatch yok) + 3.5k src cekirdek + Paseo-native canli spawn.**
Rakiplerde olup bizde olmayan en degerli uc sey: Paperclip'in olgun gorev paneli, PydanticAI'in Evals altyapisi (rubric surumleme icin fikir), Claude Squad'in cok-CLI terminal yonetimi.

## 6.5 Rakip karar notlari (ozellik degil, baglayici risk)

| Not | Kaynak | Etki |
|---|---|---|
| Claude Squad AGPL-3.0 + Windows''ta WSL2 sarti | rakip analizi * | fork/entegrasyon lisans riski; temel YAPILMAZ, olsa olsa CLI worker |
| Pydantic Graph V2 tek basina state snapshot vermez | rakip analizi * | durable runtime ek yuku — bizim SQLite defter bu yuku tanimaz |
| Sidecar ikinci otoriter gorev DB''si KURAMAZ | brief 4 (baglayici) | her entegrasyon adayinin ilk kapisi |
## 7. Bagliliklar

- Bu belge hedef haritasidir; kabul otoritesi DEGILDIR. Kapanis kaydi: kabul.csv (K12-01..14 dahil 22+14 NOT_RUN).
- Rakip sutunlari * tek-kaynak analize dayanir; bir yetenek "EVET" ise bile bizim kapilarimizdan gecmeden urune giremez.
- Guncelleme kurali: bir yetenegin durumu ancak kabul.csv satiri PASS olunca VAR'a doner.
## 8. Gelistirici brief'i eklentileri (Agent-Ordu-Teknik-Brief-ve-Prompt.md, 2026-10-14)

| Yetenek | Bizim | Not |
|---|---|---|
| Yeteneksiz CLI worker'da gozetimsiz mod RED veya sinirli mode + UI gostergesi | PLAN (capabilities.ts blocked kurali genisler) | brief 3: 'bunu UI'da acik goster' |
| Tam konusma arsivi erisilebilir; ozet tek otorite DEGIL | KISMEN (handoff paketi var; arsiv erisimi tanimlanacak) | brief 3 |
| Graph revision/rollback gorunur; UI scope degisikligi calisan grant'e gizlice TASINMAZ | PLAN (§2 manifest surumleme kuraliyla birlesik) | brief 3 |
