# Hermetik kanal testi — kilit-surum.ps1 Tee + son-kanit.json bacağı (K-0046 erata kanıtı, 2026-10-25 21:53)

Tek-kullanımlık klon (git clone ordu → %TEMP%), saglik.ps1 kaldırıldı + kök package.json (npm kapısı) — kilit-surum'un npm dalı uçtan uca koşuldu.

## Yeşil dal (kanal-test)
- kilit-surum EXIT=0, "KILIT OK: kanal-test-kilit @ c88bfc0", tag YARATILDI
- son-kanit.json: { d: 2026-10-25T21:53:24.91+03:00, h: c88bfc0, x: 0, test: kanal-test, sureSn: 1 } — üçlü-kanıt (ölçülmüş damga + commit hash + makine exit) üretildi
- test-kanal-test.log Tee ile diske indi

## Kırmızı dal (kanal-kirmizi — test script exit 1)
- kilit-surum EXIT=1, "npm test kirmizi (exit 1) - kilit engellendi. Kanit: .../test-kanal-kirmizi.log"
- son-kanit.json dürüst: { d: 2026-10-25T21:53:53.89+03:00, h: d210916, x: 1, test: kanal-kirmizi, sureSn: 1 }
- Tag kanal-kirmizi-kilit YARATILMADI (kilit engellendi — fail-closed doğrulandı)
- Ara bulgu: ilk koşumdan kalan kanıt çıktıları klonu kirletti → kilit-surum "Calisma agaci kirli" ile REDDİ (kendi fail-closed'u — doğru davranış, ilave sınama)

Sonuç: kanalın taşıyıcı bacağı (sağlayıcı-bağımsız üçlü-kanıt) yeşil+kırmızı iki yönlü (R) ile sınandı. tip:'test' telemetri bacağı daemon timeline akışına bağımlı (2026-10-19'dan beri kuru — erata).
