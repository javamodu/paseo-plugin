# AGENTS.md — ordu (L0; eski adı paseo-plugin, F1'de köke taşındı)

Bu repo evrensel ajan verimlilik sözleşmesi paketidir. Çalışma kuralları: `sozlesme/PASEO-VERIMLILIK-REHBERI-v2.1.md` (bu repo için bağlayıcı sözleşme; v2.0 arsiv/ altında) + `ANAYASA.md` (üst otorite).

## Hızlı yön

- Doküman dili Türkçe; kod/script dili İngilizce-Türkçe karışık identifier kabul edilir.
- Değişiklik sonrası: `scripts\codemap.ps1` çalıştır (CODEMAP tazelenir), `scripts\saglik.ps1` yeşil kalmalı.
- Kanıt iddiaları etiketli yazılır: (R) resmî ölçüm, (T) tahmin, * tek-kaynak.
- Kullanıcı "sistemi nasıl kullanırım" diye sorarsa → `admin-onboarding.md`'ye yönlendir (rol/LLM/çok-ajan kılavuzu orada).

## Yapı

- Kök: sözleşme/plan/şablon/fermanlar · `kanit/` 10 dosyalık araştırma · `scripts/` otomasyon · `kararlar/` ADR+K kararları · `raporlar/` append-only · `plans/handoff/` devir törenleri · `arsiv/` tarih damgalı eski SSOT + history bundle'ları · bileşen evleri (F1/F2 birleşimi): `core/` ordu-core (defter+dispatch+kabul) · `plugin/` paseo-verimlilik (v0.22-kilit) · `pano/` pano iskelet/mockup · `referans/` salt-okur (kapsul-final, ordu-v3) · `surumler/` kök kilit sürümleri · `sorular/`, `veri/` yardımcı.
- PowerShell here-string kapanisi '@ daima satir basinda (kolon 0) olmalidir; girintili kapanis parser hatasi verir. (A3 K-0051; kaynak DERSLER satır 3)
- Remove-Item ortam politika engeline takilabilir; silme gerektiren yerlerde Move-Item tercih edilir. (A3 K-0051; kaynak DERSLER satır 4)
- PowerShell cift tirnagi $ degiskenini genisletir; $ iceren eslestirme metinleri tek tirnakla tanimlanir. (A3 K-0051; kaynak DERSLER satır 5)
- (tarihsiz) 130 satır markdown ≈ 4-5k token (Aider'in 1k token bütçesi yoğun kod sembolleri içindir; doküman haritası daha hacimli). (A3 K-0051; kaynak DERSLER satır 6; ham ad8efe9a56567e3e)
- (tarihsiz) Git post-commit hook testi temp repoda 5 dakikada kanıtlanır (HEAD damgalı CODEMAP üretildi). (A3 K-0051; kaynak DERSLER satır 7; ham 40cb63205e9a7415)
- (tarihsiz) gh/git gibi araçlar stderr'e BİLGİ de yazar; PS'te `2>&1` ile birleştirirsen NativeCommandError → exit 1 (push başarılıyken kırmızı görünür). Kural: push'a `2>&1` EKLEME; doğrulamayı ayrı komutla yap (`git log origin/main --oneline -1` / `ls-remote`). Kanıt: v0.10 turunda 3 'başarısız' çağrının tamamı buydu. (A3 K-0051; kaynak DERSLER satır 8; ham 16761cd6f60a3cfe)
