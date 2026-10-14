# Gelen-Kutu Triage — 2026-10-14 (isçi: 7a8d41f8, 43/43 madde)

Siniflar: SD = simdi-duzelt, B = backlog, R = reddet. Toplam: 14 SD / 28 B / 1 R.

## denetim-2026-10-13.json (28)
SD: A1-2 (REHBER v1.4 damgasi bayat) · A1-3 (CEKIRDEK devir listesi 5-6-5 dizgi) · A1-6 (README 9 vs 10 bolum) · A1-7 (README 12+ vs 16 kapi) · A2-9 (RET_DESENI kabul sayaci cift sisiyor) · A2-10 (panoIsaretciYaz atomik degil) · A4-6 (paseo-verimlilik telemetri.jsonl 0 bayt) · A5-14 (katman-kur on-kontrolsuz) · A5-15 (saglik hedefler.json sessiz yutma)
B: A1-8, A2-11, A2-12, A2-13, A3-9, A3-10, A3-11, A3-12, A4-2, A4-3, A4-4, A4-5, A5-9, A5-10, A5-11, A5-12, A5-13, A6-3, A6-4

## denetim2-2026-10-13.json (14)
SD: D2-19 (MODLAR prototip zinciri, hasOwn) · D2-22 (kilit-surum damga sessiz atlaniyor) · D2-25 (STATE_BOARD 3 kilit geride) · D2-29 (brief lint regex kendi durtmesiyle celisiyor)
B: D2-11, D2-12, D2-18, D2-20, D2-21, D2-24, D2-26, D2-27, D2-28
R: D2-23 (A5-15 ile ayni kok, birlesti)

## codex-2026-10-14.json (1)
SD: BK-02 (reload yeniden-teslim telemetri kirliligi) — isci b0a4af2d uzerinde

## Oncelik (isci onerisi)
1. BK-02 + A4-6: telemetri hem kirli hem kor — kanit tabani once onarilir
2. A2-10 + D2-22: kanit zincirini sessizce koparan yazim/damga hatalari
3. D2-19 + A2-9: tek satirlik guvenlik-adjacent + sayac paketi
