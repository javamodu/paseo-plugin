# K-0005 — Paseo-suz çalışma yolu (2026-10-13)

Yetki: kullanıcı emri "paseo olmadan da çalışabilsin; tüm planlar bu şekilde güncellensin".
Mimari karşılık: Final tarafında **ADR-012** (önce ADR, sonra faz güncellemesi —
README çelişki sırası işledi).

## Ne değişti (öz)
- `runtime: "paseo" | "local"` — config dosyasından, fail-closed, varsayılan paseo.
- local = core'un yönettiği git worktree + provider CLI süreci + durable süreç registry.
- Kabiliyet kapıları RUNTIME-SPECFİK: her runtime kendi kanıt seti olmadan spawn edemez
  (B02 deseni korunur; local anahtarları: gitWorktreeProven, processRegistryDurable,
  cancelConfirmLocal, providerCliPresent).
- Bildirim: heartbeat = paseo kanalının işi; local'de SSE + opsiyonel webhook fallback.
  Sessiz-akış/karar-kartı semantiği kanaldan bağımsız tanım olarak kaldı.
- Bütçe: +300–550 LOC (ADR-012 §5); ürün tavanı 7.050, toplam 9.850.

## Ne DEĞİŞMEDİ (sabırlar)
- TEK defter/tek kapı seti (Y1): local yol ikinci runner'dır, ikinci core değil.
- A05–A16/A35/A36 semantiği, evaluator allowlist'i, A13 "exit-0 yetmez", oto-kabul
  şeridinin merge-yasağı — hepsi runtime'dan bağımsız.
- Güvenlik farkı dürüstçe taşınır: local worker düşük-risk görevle sınırlı, sandbox
  eşdeğeri kanıtlanana dek oto-kabul şeridi local'e KAPALI.

## Uygulama sırası
1. ✅ ADR-012 (Final) + bu kayıt + plan satırları (00-master/20/40/kabul.csv/CODE-BUDGET).
2. ✅ ordu-core: `src/local-runtime.ts` + hermetik testler (fake launcher).
3. S1 canlı: local capability probe (gerçek git worktree provası — harcamasız) →
   V3-RT.1; provider CLI spawn provası → V3-RT.2 (kısa, tek görevlik).
4. S2: webhook fallback bildirimi → V3-RT.3.
