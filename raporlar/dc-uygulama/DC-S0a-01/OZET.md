# DC-S0a-01 — Kaynak ve araç tabanı (salt-okur)

**Kimlik:** DC-S0a-01 · ATOM-H1-2026-10-28.2 · **2026-10-30T01:05:36.949+03:00**

## Ölçümler

- **HEAD:** `9f6aa9e1916aa165a8b689055edd1ba21f85a4fe`
- **Kirli kayıt sayısı:** 128 (`git status --short`)
- **Platform/mimari/Node:** `{"platform":"win32","arch":"x64","node":"v24.18.0"}`
- **READ_GIT:** `git status --short && git rev-parse HEAD` · cwd `.` · exit `0`; 128 kayıt + yukarıdaki HEAD. Git, kullanıcı evindeki global ignore dosyası için iki adet salt-okur erişim uyarısı verdi; repo durumu etkilenmedi.
- **READ_ENV:** `node -p "JSON.stringify({platform:process.platform,arch:process.arch,node:process.version})"` · cwd `.` · exit `0`; yalnız platform/mimari/Node sürümü okundu, env/sır dökümü yapılmadı.

## Kirli dosya sahipliği

Kirli 128 kayıt bu fişten önce var. Kayıtlar; plan/handoff/rapor/telemetri/deney defterleri ve eski untracked üretim dosyaları ağırlıklı. Bu fişin write-set'i boş; bu kayıtlara yazılmadı. Sahiplik kaydı yoksa bu fiş sahiplenmez ve sonraki işler başlatma anında kendi snapshot'ını almalıdır.

## Kaynak manifesti

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `CODEMAP.md` | `1a3ede5b3710987eb84fc7cb96ab9f92f931f2ee6314d94c14266cf752ab95fa` | 14966 |
| `AGENTS.md` | `a5d85b21cf9bee55b0bd9f591e80c44d319d6b435467ec0453ec300e47fa2aa5` | 2459 |
| `ANAYASA.md` | `9987de5f98c126623c9a05aed3cea9222cd8471cd84fa97aa7bd2166f717e199` | 3179 |
| `plans/PLAN.md` | `271a76f35ef65d4e62d7c6ea5dfa065774aa4bd662f710660a8c3b1adc013b84` | 95704 |
| `plans/SSOT-INDEX.md` | `9f029e009fbfa64912a06603a5bb8e9da99f94d96be5196b802b3db6da89e6a4` | 3673 |
| `core/package.json` | `34b70bce539b993ad0714d4118a4cbf58ca7bda29376f92e2aca3964094e4831` | 2444 |
| `plugin/package.json` | `fe4c6fddb2e1ce6281ed9ebd0a835cb250baa45deb77a1ae5ba85f63e104a7fd` | 957 |
| `scripts/test-kanal.ps1` | `c13079ace145125c91e8ea194f8514d18a9ea4e880b4886afb313b6392c5286f` | 2205 |

## Gözlemler

- **P1:** Bu özet, yukarıdaki 8 okunan kaynağın SHA-256/byte kimliği, HEAD ve ölçülmüş saati aynı sonuçta içerir.
- **P2:** Platform/mimari/Node sürümü yalnız READ_ENV komut çıktısıyla bağlanır.
- **N1:** Salt-okur kimlik ölçümü yapıldı; inceleme sırasında kaynak değişikliği tespit edilmedi. Doğrulayıcı yeniden hashleyip karşılaştırmalıdır.
- **N2:** 128 kirli/untracked kayda yazılmadı. Önkoşul eksikliği yok; probe/pretest/DB/CLI/sağlayıcı çağrısı yapılmadı.

## Sonuç

**Durum:** `EVIDENCE_RECORDED` — yalnız kanıt kaydıdır; ürün PASS, sprint kabulü veya insan kapısı değildir.
