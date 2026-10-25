# PLAN — Eksik Kapatma (paseo plugin + sözleşme) — 2026-10-12

Kaynak bulgular: gelen-kutu speakrapid-1 (YÜKSEK) + codex-1/2/3 · sondaj 2026-10-12 Ö1/Ö2 · saglik SARI (kural 77>40) · STATE_BOARD v2.1 backlog.
Kural: her paket ayrı K-kaydı + ayrı kullanıcı onayı + ayrı kilit sürüm. Sözleşme ailesine otomatik yazma yok.

## P0 — collab spawn hook köprüsü (speakrapid-1, YÜKSEK) → K-0021 taslağı
- Hedef: collab `spawn_agent` ajanları ÇEKİRDEK/işaretçi enjeksiyonu + tur telemetrisi kapsamına girsin.
- Adım 1 (doğrulama): `index.server.ts:57` before("agent.create") collab create'te tetikleniyor mu — spawn testi + `.verimlilik/telemetri.jsonl` lint/tur kaydı kontrolü. Turn hook'ları (turn_started/turn_ended) da doğrulanacak (T).
- Adım 2 Yol A (tercih): collab create path'i hook'a bağlanır — Paseo daemon sınırında mümkünse plugin içinden; değilse Paseo tarafına bulgu raporu.
- Adım 2 Yol B (köprü, A çıkmazsa): ÇEKİRDEK EK-3 brief standardına "sözleşme eki" bloğu — spawn eden ajan brief'ine işaretçi eklenir.
- Doğrulama: collab spawn sonrası telemetride tur kaydı (R) + mevcut 196 test yeşil + saglik exit 0.
- Kapsam: paseo-verimlilik ≤3 dosya veya ÇEKİRDEK 1 madde. Sürüm: v0.12.

## P1 — rollup delta + kabul kapsamı (codex-1, codex-2, orta) → K-0022 taslağı
- `server/rollup.ts`: "geçen haftaya göre delta" bölümü (tur, kabul, pitbull, cacheHit) + "kapsam: kabul sinyali üreten repo X/Y" satırı.
- `server/desenler.ts` incelemesi: 12 repo neden kabul olayı üretmiyor — desen seti dar mı, olay mı yok (T doğrulaması, bulgu gelen-kutuya).
- hedefler.json: haftalık kabul-düşüşü eşik adayı.
- Doğrulama: iki haftalık sentetik telemetriyle rollup birim testi; W43 rollup'ında delta satırı gözle doğrulanır.
- Kapsam: rollup.ts + desenler.ts + test. Sürüm: v0.12.1 (P0 ile çakışırsa birleşik v0.12).

## P2 — sondaj Ö1+Ö2 metin düzeltmeleri (düşük) → K-0023 taslağı
- Ö1: ÇEKİRDEK/REHBER §2 %90 maddesine "(durum dosyasına; kod yazımı okumadan-yazma kuralına tabi kalır)" yarım cümlesi.
- Ö2: `server/bekci.ts` takip raporu üretirken STATE_BOARD aktif-iş notuna untracked dizin işaretçisi (C1 kapatma).
- Doğrulama: saglik exit 0 + sondaj koşusu 2/3'te C1 tekrarı yok.

## P3 — kural diyeti 77 → <40 (SARI, öncelik düşük) → K-0024 taslağı
- ÇEKİRDEK maddelerinden "her turda gerekli olmayanlar" EK işaretçisine indirilir; hedef <40 kural + enjeksiyon ≤8KB freni korunur.
- Not: STATE_BOARD kaydı — "plugin öncesi şart değil"; P0/P1 öncelikli.
- Doğrulama: saglik kural sayacı SARI→OK.

## P4 — yayılım/kohort (codex-3, düşük) → yeni kayıt yok, K-0013 kapsamı
- 35 "hiç" reposundan kontrol-tedavi eşleşmesi güçlendirme; sondaj çizelgesi (1g/3g/5g) zaten kurulu, pasif takip.

## Dışarıda bırakılan
- K-0019/K-0020 (pano iskeleti + görev emri): ayrı onay bekliyor; P1 ile veri yolu çakışması yok ama aynı hafta planlanırsa pano Mod Metrikleri'nden beslenebilir.
- v2.1 backlog (failedCalls araç-adı detayı, TDD kırmızı-koşu hariç tutma): P1 ile birleştirilebilir, onayla.

## Önerilen sıra ve onay istemi
P0 → P1 → P2 tek onay paketi olarak; P3/P4 ertelenebilir. Her paket bitişinde: test yeşil + saglik exit 0 + STATE_BOARD damgası + kilit sürüm.