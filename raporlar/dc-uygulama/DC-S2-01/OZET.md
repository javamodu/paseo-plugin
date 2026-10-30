# DC-S2-01 — Yazma kapanışı sonrası aday mühürleme

**Kimlik:** DC-S2-01 · ATOM-H1-2026-10-28.2 · **2026-10-30T07:38:41.491+03:00**

## Teslim

- `core/src/dc-candidate-seal.ts`: kullanım kapanışı, alt süreç durumu ve Git temizliği sağlandıktan sonra adayı Git commit/tree üzerinden mühürler.
- `core/test/dc-candidate-seal.test.ts`: temp Git deposu üzerinde pozitif ve negatif senaryoları sınar; mühür dosyası salt-okur kurulur.
- Yaşayan alt süreç, kapanmamış yazma yetkisi, SETTLED olmayan kullanım, aday değişimi ve izlenmeyen dosya yollarında mühür RED döner.

## Test

- **Komut:** `node --test --test-reporter=spec test/dc-candidate-seal.test.ts test/supervisor.test.ts`
- **cwd:** `core`
- **Sonuç:** `exit 0`, `12 pass / 0 fail`

## Gözlemler

- **P1:** Bitmiş attempt, sahiplik ve tam sözleşme bağlantısıyla aday mühürlenir.
- **N1:** Yaşayan alt süreç, yazma yetkisi veya aday değişimi varsa mühür RED döner.
- **N2:** İzlenmeyen dosyalar sessizce atlanmaz.

## Kaynak manifesti

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `core/src/local-runtime.ts` | `bdb7aea4fab2ceda162cfa75092ad8a38de756a3f8c6cacd59b79b032b058d54` | 17033 |
| `core/src/store.ts` | `e46ed62f7cfade8bc5197b9d20681ebc5bbfe75c74540c83ede9afbb62da9f05` | 13415 |

## Üretilen kod dosyaları

| Dosya | SHA-256 | Byte |
|---|---|---:|
| `core/src/dc-candidate-seal.ts` | `b797cffaa510391bfaf0c9bbc01badc51160157fc7bc88f0d3c9366842f9e17d` | 4142 |
| `core/test/dc-candidate-seal.test.ts` | `72ab3b8ba9bb85ef59cf81a1c9d05ae383fd427d956c300273f1437b4487a8e1` | 4606 |

## Sonuç

**Durum:** `EVIDENCE_RECORDED`
