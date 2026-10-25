# ORDU-V3 — Tek Çalışma Planı (kuruluş: 2026-10-13)

> **Bu klasör günlük kullanılan TEK plandır.** Mimari çatışma üretmez: teknik
> baseline **`Kapsul-Autonomous-Army-Master-v3.0.0/`** (ADR-011 + ADR-012; docs 01–15 —
> önceki `kapsul-final-v2.0.0 notio/` onun alt kümesidir), ürün/zihin modeli `gpt/PLAN.md`,
> teslim/disiplin kültürü `qwen/`den devralınmıştır — hepsi arşiv-referanstır; yürürlük
> buradadır (kararlar/K-0000, K-0006). **DİKKAT:** v3.0.0 bir TASARIM ekidir
> ("çalışır production DEĞİL"; canlı adapter/sandbox/remote/scheduler/learning NOT_RUN) —
> çalışan kanıt bu değil, `ordu-core/`dır (51/51 hermetik). ordu-v3 = işletme katmanı.

## Kullanıcı amacı (değişmez referans cümle)
> "Programlayıp görevleri veririm; **uzaktan yalnız izlerim**. Ordu kendi
> kendine test eder, teslim eder, öğrenir ve iyileştirir."

Bu cümleye hizmet etmeyen her özellik faz listesine giremez.

## Dosya haritası ve okuma sırası
1. `00-master.md` — döngü, roller, fazlar, teknoloji, yapılmayacaklar
2. `10-roller.md` — beş rolün prompt iskeletleri + reasoning kademeleri
3. `20-uzaktan.md` — tek pano, mobil izleme, bildirim, Inbox, acil durdur
4. `30-ogrenme.md` — SINIRLI kendi-kendine-iyileştirme döngüsü (ONAY kapılı)
5. `40-kabul.md` — kanıtlı test listesi (GEÇTİ+kanıt ya da BAŞARISIZ)
6. `kararlar/K-0000-v3-kurulus.md` — kuruluş ve soy kaydı
7. `kabul.csv` — MAKİNE defteri: tüm B/A/M/V3 kapılarının tek durum tablosu
   (faz kapanış ölçütü budur; 40-kabul.md onun insan-okur yüzüdür)
8. `kararlar/K-0004-tum-paket-denetimi.md` — denetim: 6 gap kapatıldı (zamanlı
   görevler, oto-kabul şeridi, reasoning makbuzu, remote güvenlik, bildirim
   dayanıklılığı, konak kısıtları)
9. `kararlar/K-0005-paseosuz-runtime.md` — **ADR-012 çift-runtime**: ordu Paseo
   olmadan da koşar (`runtime:"local"`: git worktree + provider CLI + süreç
   registry'si); tek defter/tek kapı seti değişmez

## 5 dakikada günlük kullanım (sistem kurulduktan sonra)
```
1. Aç:        paseo script start core  ·  http://127.0.0.1:4378 (telefon: VPN/SSH port yönlendirme)
2. Görev ver: composer'a hedefi yaz → plan önizleme → [Başlat] (tek onay)
3. Kapan:     telefondan rozetler: ▶koşan ✉sen-dosya ✓bitti — başka bir şey YAPMA
4. Gerekirse: Inbox kartına tek dokunuş (devam/atla/iptal) · header'da ACİL DURDUR
5. Haftalık:  "Retro" düğmesi → öğrenme önerilerini onayla/reddet (30-ogrenme)
```

## Çelişki çözümü (kesin sıra)
`00-master.md` > `30/20/10/40` kendi konularında > Final `docs/`+`ACCEPTANCE.csv`
(mimari/veri otoritesi) > GPT/qwen arşivleri (referans) > konuşma geçmişi.
Mimari değişiklik gerekirse: önce Final tarafında ADR, burada yalnız faz güncellemesi.
