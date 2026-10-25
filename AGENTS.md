# AGENTS.md — ordu (L0; eski adı paseo-plugin, F1'de köke taşındı)

Bu repo evrensel ajan verimlilik sözleşmesi paketidir. Çalışma kuralları: `sozlesme/PASEO-VERIMLILIK-REHBERI-v2.1.md` (bu repo için bağlayıcı sözleşme; v2.0 arsiv/ altında) + `ANAYASA.md` (üst otorite).

## Hızlı yön

- Doküman dili Türkçe; kod/script dili İngilizce-Türkçe karışık identifier kabul edilir.
- Değişiklik sonrası: `scripts\codemap.ps1` çalıştır (CODEMAP tazelenir), `scripts\saglik.ps1` yeşil kalmalı.
- Kanıt iddiaları etiketli yazılır: (R) resmî ölçüm, (T) tahmin, * tek-kaynak.
- Kullanıcı "sistemi nasıl kullanırım" diye sorarsa → `admin-onboarding.md`'ye yönlendir (rol/LLM/çok-ajan kılavuzu orada).

## Yapı

- Kök: sözleşme/plan/şablon/fermanlar · `kanit/` 10 dosyalık araştırma · `scripts/` otomasyon · `kararlar/` ADR · `raporlar/` append-only · `plans/handoff/` devir törenleri.
