# S2 SCRIPT HİJYEN DALGASI — KANIT RAPORU (2026-10-26)

İlgi: plans/UYGULAMA-PLANI-SPRINT-2026-10-26.md **SPRINT 2 — Script hijyen dalgası** (yeni tur; ~52 LOC hedefi) · bulgu kaynakları: raporlar/tam-analiz-6-dogrulayici-2026-10-26.md + raporlar/gelen-kutu/denetim-2026-10-13.md (A5-10..13) + denetim2-2026-10-13.md (D2-21/D2-26).

Etiket: `s2-script-hijyen` · Kanal: `powershell -ExecutionPolicy Bypass -File scripts/test-kanal.ps1 -Etiket s2-script-hijyen` · Log: `raporlar/kanit-hedef/test-s2-script-hijyen.log`
Son-kanit.json (birebir): `d=2026-10-26T15:26:41.7784157+03:00 · h=fbd5607 · x=0 · test=s2-script-hijyen · sureSn=36`
Suit: **378/378 pass / fail 0** (sayı değişmedi — script/doc dalgası; yeni: `pretest` kancası probe'u kanal içine aldı, log başında receipt `4e1dd6c5…`, blocked liste BOŞ, exit 0). Koşum öncesi CPU %54 (F4 dersinin yük-okuma kalıbı uygulandı — ilk denemede x=0).

## Kapanan kalemler

| Madde | İş | Kanıt (bu turda koşuldu) |
|---|---|---|
| A5-10 | codemap.ps1 `$Root` TrimEnd('\\','/') + kök-dizin RED | `-Root 'D:\Vibecode\ordu\'` (sondaki `\`) ile koşum: 579 dosya / 94 satır — sonda-slash'sız koşumla AYNI; dosya-düzeyi satırlar doğru (`scripts/codemap.ps1` satırı mevcut; eski davranışta ilk karakter yenerdi) |
| A5-11 | CODEMAP.md BOM'suz yazım (WriteAllText UTF8Encoding $false) | Yeniden üretim sonrası ilk-3-bayt `35 32 67` ("# C" — 239/BOM YOK; eski EF BB BF kalktı) — kilit-surum/proje-panosu yazım kalibiyla hizalı |
| A5-12 | yonetici-ozeti.ps1 LOC sayacı uzantı filtresi (metin uzantıları; binary dışlanır) | Tam koşum exit 0: `.md 376 · .ts 131 · .ps1 10 · .tsx 5 … TOPLAM 870 dosya` — binary (png/sqlite/zip) artık okunmuyor |
| A5-13 | global SilentlyContinue kaldırıldı + kırılgan noktalarda try/catch (LOC okuma, session meta, son-satir timestamp, telemetri jsonl satırı) | Tam koşum exit 0 (3 varyant: -SadeceToken 1 gün / 0 gün / tam); bozuk timestamp'ta süre katkısı dürüst 0 (kaynak: yıl-1 uçurumu YOK) |
| A5-9 (script tarafı) | **tek kirli-ağaç tanımı** — `scripts/kirli-liste.json` (surum 1, desenler: telemetri-haftalik, .verimlilik) tek kaynak; kilit-surum.ps1 + proje-panosu.ps1 ayni listeyi okur (fail-closed: JSON okunamazsa kilit RED) | kilit-surum.ps1 `-Etiket s2-hijyen-deneme` deneme koşumu: **"Calisma agaci kirli (41 dosya, benign liste disi)"** throw — tag YARATILMADI (`git tag -l 's2-hijyen*'` boş); birebir sayım: toplam kirli 45 − benign 4 (telemetri-haftalik×2 + W44×2) = **41** ✓; proje-panosu.ps1 `-TestModu`: TEST OK exit 0 |
| D2-21 | zincir-kontrol.ps1 `-Kati` bayrağı — dizin yokta SESSİZ yeşil değil KATI kırmızı (varsayılan davranış değişmedi) | `-Kati -RepoKok <yok-dizin>` → 'KATI KIRMIZI' exit 1 · `-Kati` gerçek repo → ZINCIR OK exit 0 · bayraksız → eski davranış (atlanir, exit 0) |
| 8787 port | core pano varsayılan **8787 → 8790** (deepseek-harness yabancı süreci 8787'yi işgal ediyordu — EADDRINUSE) | pano-server.ts:193-195 + core/veri/pano-start.ps1 + KULLANIM §3; testler port:0 kullanır (süitten etkilenmez — kanal x=0 bunu kanıtlar) |
| probe.mjs kapsam | `pretest` kancası: her `npm test` öncesi probe koşar (package.json BOM/parse bozulması latent kalmaz; receipt her koşumda tazelenir) | Kanal logunun BAŞINDA probe koşumu görünür (receipt 4e1dd6c5, blocked [], exit 0); evidence/probe-latest.json gitignored (ağaç kirli değil) |
| D2-26 | DERSLER tarih öneki normalizasyonu — 51 tarihsiz erken-dönem girdisi `- (tarihsiz) ` önekiyle işaretlendi (uydurma tarih YOK) | Sayım: işaretlenen=51 · kalan sapma=0 · U+FFFD=0; `^- \d{4}-…` VEYA `^- \(tarihsiz\)` dışı satır kalmadı |
| K-0048 (i), KULLANIM §6, mockup13ekim | (S2 listesindeydi — ÖNCEKİ turlarda kapandı) | CODEMAP 94 satır (06:20) · §6 komut listesi dolu (F9-öncesi tur) · mockup arsiv'de git-mv (F4, commit fbd5607) |

## Dürüst kapsam

- **bekci.ts tarafı S3'te kalır** (A5-9'uncu bacağı plugin v0.22-kilit — [insan] "kilit aç" düdüğü; bekci.ts:109'un bu JSON'ı okuması v0.23 dalgası kalemi).
- **D2-26 "pozitif kayıtların kanıt'a taşınması" bilinçli kapsam dışı** (bulgu "taşınabilir" diyordu — içerik taşıma kararı, format normalizasyonu bu turun ölçüsü).
- yonetici-ozeti -SadeceToken koşumunu `Select-Object -First` ile kestiğimde exit 255 görüldü — PS pipeline-kesme artefaktı (benim çağrım), script hatası DEĞİL; kesmeden koşum exit 0.
- kabul.csv satır çevirisi YOK (S2 bulgu sınıfı denetim kalemleri — kabul defterinin 115 maddesinde karşılığı yok); kapanış ölçüsü bu rapor + kanal + commit.
- kilit-surum.ps1'in GERÇEK kilit koşumu bu turda yapılmadı (tag yaratmak sürüm-kararıdır — deneme koşumu tag YARATMADAN kırmızı throw ile yetinildi).

## Dersler (DERSLER.md'e işlendi)

- npm script değerine satır-içi açıklama gömülmez — npm kabuğu argümana çevirir (`node src/probe.mjs // açıklama` bozulur); açıklama docs'ta durur.
- Global SilentlyContinue hata KİMLİĞİNİ yutar: süre matematiği sapmaz demek hata noktasının görünmez olması demek — noktasal try/catch + dürüst 0-katkı kalıbı.
- Üç kapının kirli-ağaç tanımı tek JSON'da taşınır; kilit kapısı liste-dışı kirliyi SAYI+AD ile listeler (45−4=41 birebir doğrulandı).

## Sağlık

saglik.ps1: 18 OK / 0 EKSIK / 2 SARI (kabul %63=72/115 — değişmedi; CODEMAP 94 satır / 579 dosya).
