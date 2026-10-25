# KANIT Baseline - ordu-core - 2026-10-14 (F0)

Baglam ~%40. Plan: paseo-plugin/plans/MASTER-SSOT-PLAN.md v2.7.2 §10/§17 - F0 baseline sabitleme.

## Kaynak
- Dizin: D:\Vibecode\silinecek-task-graph\ordu-core
- Git hash: YOK - `git rev-parse HEAD` => "fatal: not a git repository" (R). Hash yerine bu damga + test ciktisi kanittir; git init/remote YAPILMADI (gorev siniri: commit yok).
- Kirli dosya kontrolu: git olmadigi icin uygulanamaz.

## Ortam
- OS: Microsoft Windows NT 10.0.26300.0 (Windows 11)
- Node: v24.18.0
- PowerShell: 5.1.26100.9549
- Tarih: 2026-10-14 (Europe/Istanbul)

## Test komutu
- Komut: `npm test` (cwd: D:\Vibecode\silinecek-task-graph\ordu-core)
- Exit kodu: 0 (R)
- Sonuc: tests 122 / pass 122 / fail 0 / skipped 0 / duration_ms 15574.712
- Not: MASTER-SSOT v2.7.2 §10 "102/102" baseline'indan bahseder; olcum 122/122'dir (R) - suite buyumus, plan metni guncel degil. kabul.csv B01 satiri da 122/122'yi dogruluyor.
- Ornek kapanan kapilar (son 20 satirdan): K1 write-path RED, A36 stale fence, A05-b conflict, V3-S1 restart latch, A01-A04, A10, A12, A24, Command/Event baseline esitligi.

## kabul.csv baglantisi
- ordu-v3/kabul.csv'ye 23 yeni kapi satiri NOT_RUN olarak eklendi (F0-A, F1-A..G, F2-A/B, S1.1, F3-A/B, F4-A/B, F5-A/B/C, F6-A/B/C, F7-A/B). On/son satir sayisi: 67 -> 90.
