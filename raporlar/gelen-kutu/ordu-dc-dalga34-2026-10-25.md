# Gelen-kutu: ordu-dc — dalga 3+4 birleşik eksik/risk defteri — 2026-10-25 20:01

Kaynak: iki bağımsız 6-subagent dalga (dalga-3: SAG/DEF/SEC/TUR/ZIN/DOK + dalga-4: teknik risk/uyum/kanıt dürüstlüğü/güvenlik/drift/savaş hazırlığı), toplam 12 salt-okur subagent. Sohbet raporu olarak geldi (raporlayan oturumun edit yasağı sürüyor); yazıcı oturum (ordu-a4) her iddiayı diske karşı doğruladı — **doğrulama hükümleri bu dosyada**. Aynı adlı .json makine-okunur yan dosyadır (schemaSurum:1).

## Doğrulama turu sonuçları (yazıcı, R)

1. **Çelişki-1 (sk-or-v1) ÇÖZÜLDÜ — MASKE:** repoda TEK eşleşme `plans\F3-TASLAK-2026-10-25.md:20` = "openrouter (sk-or-v1-…)" — önek + üç nokta, **değer YOK**. Rotate gerekmez; yeşil-zeminin "şartlı" notu kalkar (dalga-3 SEC-06 sınıflandırması doğruydu).
2. **Çelişki-2 (W43 %1950.2 ↔ saglik %97,2) ÇÖZÜLDÜ — KÖK + DÜZELTME:** W43 md'de gerçek değer **%1931.8** (R: okundu) — rollup.ts:80-86 ham `cacheHitPct` topluyordu. **Düzeltildi: `9a4a0b4`** — okuma-anında normalize (100p/(100+p)) + test (gelen: 91.9 ≤ 100). W43 md DOKUNMA — sonraki rollup'ta dürüst değerle yeniden üretilecek.
3. **B-5 (HANDOFF-2005 echo'suz) DOĞRU** → gecikmeli echo bu turda yazıldı (aynı oturum, 1955 deseni). "15:28 zincir-kopuk" notu: zincir-kontrol EXIT=0 — o not bayat/stale gözlemdi.
4. **B-1 (pano-token.txt tracked) DOĞRU** — `git ls-files` core/veri/pano-token.txt tracked (c41c75e'den beri). Rotate + `git rm` = **insan kararı** (E15/karar C/K-0045 hattı). B6b yalnız betik ayağını temizledi — doğru tespit.
5. **B-4 (K-0029/K-0036 yok) DOĞRU** (R: Test-Path false ×2; 41 K kaydı). K-0041/K-0042 kuyruğunda, kullanıcı onayı ister.
6. **B-2/B-3 (BUG-C2/C6) DOĞRU** — live-gates-v4 koşum çıktısında belgeli (TUR-1.5'te canlı görüldü). "src düzeltmesi bu turun kapsamı dışında" notuyla test dosyasında açık yaşıyor.
7. **"296/296 bayat" DOĞRU → canlı kazanır:** core **299/0 EXIT=0** (d9a5962 sonrası), plugin **388 ok EXIT=0** (9a4a0b4 sonrası, +1 normalize testi).
8. **STALE bulgular (dalga koşum anında doğru, şimdi kapalı):** "pano restart doğrulanmamış" → **doğrulandı** (R: `/api/durum` uiDir=`D:\Vibecode\ordu\pano`, uiVar:true) · "CODEMAP 2 commit bayat" → aaa5eb1'de tazelendi · "STATE damgası eski (16/2)" → TUR-1 kapanış damgası 17/4/2 (R, JSONL'li koşum).
9. **Geçerli kalan riskler (kayıt altına alındı):** kill-9/STOP ucu plugin'de yok (savaş altyapısı) · pano yeni ev İÇERİK mockup (F6/F7 UFUK'ta zaten) · çift pano sunucusu (4378 köprü / 8787 core) · kabul.csv okuma plugin/server'da yok · saglik parametresiz çağrı = Katman B atlanır (ölçümsüz yeşil sınıfı — kullanım disiplini) · AGENTS "Yapı" kod evlerine kör · KULLANIM.md/SSOT-INDEX eski ev · plugin/package.json 0.0.0 (V-12) · FERMANLAR v2.0 · M04/M15/M02 NOT_RUN.

## Hüküm (yazıcı, doğrulanmış birleşik)
"Çekirdek hazır; savaş MAKİNESİ değil" hükmü **doğrulandı**. 6 bloktan 4'ü prosedür/kayıt (B-1, B-4, B-5, B-6), 2'si kod bombası (B-2/C2, B-3/C6 — düdük bekler). Dalga sırasının 1-2'ncü adımları bu turda KAPANDI (doğrulama turu + TUR-1 kapanış eksikleri: rollup + erata + echo). Kalan: kod bombaları + prosedür + mekanik DOK + K-0039 → "SAVAŞA HAZIR".

- Damga (R): 2026-10-25 20:01 (Get-Date ile ölçüldü — DERSLER 162), ajan = yazıcı ordu-a4 (doğrulama turu + kayıt), commit = bu kayıt commit'i.

## TUR A islenme guncellemesi (2026-10-25 20:38; islenme alanlari + commit hash)

- **B-2 (BUG-C2) DÜZELTİLDİ** — `79a011c`: `LocalRuntimeAdapter.cancel` kanonik sözleşmeye geçti (attemptId→dispatchKey köprüsü, gerçek kill + OS ölüm teyidi; REQUESTED/UNKNOWN fail-closed). (R): core 299/0 EXIT=0; regresyon testi live-gates-v4 `dk-c2` rig'inde.
- **B-3 (BUG-C6) DÜZELTİLDİ** — `79a011c`: `cancelStaleOwner` devir anında eski sahip SÜRECİNİ öldürür (attempt durumu bozulmaz; yeni olay tipi AÇILMADI — baseline senkron 31 tip). (R): K6 testi dosyanın devirden sonra BÜYÜMEDİĞİNİ kanıtlıyor.
- **C-2 KISMEN KAPANDI** — STOP ucu `0e76448` (pano `durdur`, interrupt) + kabul.csv canlı-satır ucu `5e2fa0e` (`/api/kabul`, saglik 6b ile aynı hesap: 27 yeşil/43 hermetik/115 satır). kill-9 = DAEMON otoritesi (WS `cancel_agent_request` DaemonClient'ta kalıyor — dürüst sınır). Pano mockup içerik = F6/F7 UFUK kalemi.
- **⚠ YENİ DERS (163)**: plugin worker kill → worker YENİ DOĞMUYOR (oturum/tur spawn etmiyor; yalnız daemon restart). Pano köprüsü 4378 daemon restart penceresine dek AŞAĞI — yeni uçlar restart'ta canlanır [insan penceresi: ordu-dc'nin 6 subagent'ı bitince].
