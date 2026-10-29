# DC-S0b-01 — Windows ACL sınırı pozitif kontrolü

**Kimlik:** DC-S0b-01 · ATOM-H1-2026-10-28.2 · **2026-10-30T01:44:08.057+03:00**

## Seçili mekanizma

**Mechanism:** `windows-ntfs-deny-write-v1`  
**Platform:** Windows (`win32`)  
**Sınırlar:** temp kökünde izinli pilot-test alanı ve korunan taklit dosya.

## Pozitif kontrol

Fixture, `icacls` ile korunan dosyada geçerli kullanıcı için yazma reddi oluşturur; izinli dizin açık kalır. Child process:
- İzinli alana yazma başarılı.
- Korunan dosyaya yazma reddedilir.
- Child process minimal ortamla (`SystemRoot`, `TEMP`, `TMP`) ve izinli `cwd` ile koşar.

## Test

- **Komut:** `node --test --test-reporter=spec test/dc-boundary-positive.test.ts`  
- **cwd:** `core`  
- **Sonuç:** `exit 0`, `1 pass / 0 fail`

## Gözlemler

- **P1:** `BOUNDARY_MECHANISM` kimliği fixture'ta kayıtlı; izinli pilot-test alanına yazma başarılı.
- **N1:** Test atlanarak PASS verilmedi; üretim yetkisi, ev dizini, ağ veya sırlar fixture'a miras verilmedi.
- **N2:** `EVIDENCE_RECORDED` kaydı üretildi; mekanizma kurulamadı senaryosu ortaya çıkmadı.

## Kaynak manifesti

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `core/src/local-runtime.ts` | `bdb7aea4fab2ceda162cfa75092ad8a38de756a3f8c6cacd59b79b032b058d54` | 17033 |
| `core/src/probe.mjs` | `6bd46992c534a7df1dbed0f56e480e1f5bdfe01cc2d1264a54e31c3885629bd8` | 12028 |
| `core/test/local-runtime.test.ts` | `b320c29ade0bbe134c41ba50fad97d70401ac14a17befa531cb6d8549c3b542c` | 8964 |

## Üretilen kanıt dosyaları

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `core/test/fixtures/dc-boundary-fixture.mjs` | `7db1d657e70f15485c1fd8c39bfc91c121cfef9b969fd1e85c9598f67bc15b2f` | 1995 |
| `core/test/dc-boundary-positive.test.ts` | `e444140a34170d39cb8d481fd8ffa4cace7cd5a17266ade4351eacea1caec824` | 1271 |

## Sonuç

**Durum:** `EVIDENCE_RECORDED`
