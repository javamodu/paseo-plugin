# AGENTS.md — ordu (L0; eski adı paseo-plugin, F1'de köke taşındı)

Bu repo evrensel ajan verimlilik sözleşmesi paketidir. Çalışma kuralları: `sozlesme/PASEO-VERIMLILIK-REHBERI-v2.1.md` (bu repo için bağlayıcı sözleşme; v2.0 arsiv/ altında) + `ANAYASA.md` (üst otorite).

Ürün işi için yön: [kısa başlangıç](plans/AJAN-BASLANGIC.md) → [SSOT indeksi](plans/SSOT-INDEX.md) → [tek ana plan](plans/PLAN.md) → [ajan fişleri](plans/uygulama-paketleri/DC-H1-2026-10-28/OZET.md). Bu paragraf yeni kural/izin değil, mevcut kaynaklara navigasyondur. Güncel durum [STATE_BOARD](STATE_BOARD.md), runtime kökleri [veri yerleşimi](plans/VERI-YERLESIMI.md) üzerinden okunur.

## Hızlı yön

- Doküman dili Türkçe; kod/script dili İngilizce-Türkçe karışık identifier kabul edilir. Kullanıcı "sistemi nasıl kullanırım" diye sorarsa → `admin-onboarding.md`'ye yönlendir (rol/LLM/çok-ajan kılavuzu orada).

## Yapı

Yapı: [CODEMAP.md](CODEMAP.md) SSOT'dur (`scripts\codemap.ps1` üretir, elle düzenlenmez). Bileşen evleri: `core/` ordu-core · `plugin/` paseo-verimlilik (kayıtlı v0.23-kilit; belge kilidi ayrıdır) · `pano/` · `referans/` salt-okur · `surumler/` kök kilit sürümleri.
- PowerShell 5.1 tuzak ailesi: here-string kapanisi '@ daima satir basinda (kolon 0) olmalidir (girintili kapanis parser hatasi verir); Remove-Item ortam politika engeline takilabilir — silme gerektiren yerlerde Move-Item tercih edilir; cift tirnagi $ degiskenini genisletir — $ iceren eslestirme metinleri tek tirnakla tanimlanir. (A3 K-0051; kaynak DERSLER satır 3) (A3 K-0051; kaynak DERSLER satır 4) (A3 K-0051; kaynak DERSLER satır 5)
- (tarihsiz) Git/gh aile bilgileri: 130 satır markdown ≈ 4-5k token (Aider'in 1k token bütçesi yoğun kod sembolleri içindir; doküman haritası daha hacimli); git post-commit hook testi temp repoda 5 dakikada kanıtlanır (HEAD damgalı CODEMAP üretildi); gh/git stderr'e BİLGİ de yazar — PS'te `2>&1` ile birleştirirsen NativeCommandError → exit 1 (push başarılıyken kırmızı görünür), kural: push'a `2>&1` EKLEME, doğrulamayı ayrı komutla yap (`git log origin/main --oneline -1` / `ls-remote`; kanıt: v0.10 turunda 3 'başarısız' çağrının tamamı buydu). (A3 K-0051; kaynak DERSLER satır 6; ham ad8efe9a56567e3e) (A3 K-0051; kaynak DERSLER satır 7; ham 40cb63205e9a7415) (A3 K-0051; kaynak DERSLER satır 8; ham 16761cd6f60a3cfe)
