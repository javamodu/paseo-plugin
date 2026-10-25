# F3 RESTART ENVANTERİ — 2026-10-25 17:50 (A0)

Tetik: kullanıcı "TAM RESTART YAPALIM ŞİMDİ" = `F3 BAŞLA` · restart yöntemi: **tam** (supervisor dahil) · Kaynak: plans/F3-TASLAK-2026-10-25.md A0-A7.

## Restart-öncesi durum (R, diskten)

- **Daemon/supervisor:** pid `36184` (Paseo.exe, desktopManaged=true) · listen `127.0.0.1:6767` · serverId `srv_zM3KvDbisBso`
- **Config yedeği:** `C:\Users\gatep\.paseo\config.json.bak-2026-10-25-F3` (36.324 B) — geri dönüş için
- **W43 telemetri:** `raporlar/telemetri-haftalik/2026-W43.{json,md}` kirli (oturum kancası yazımı) — restart kancayı keser; dosyalar kirli kalır, drift kapıları bu yolu hariç tutar (DERSLER-48)

## Yapılanlar (restart'tan önce)

| Adım | İşlem | Kanıt |
|---|---|---|
| A1 | `claude-glm.cmd` → `scripts/` | commit `42ae414`; referans taraması: canlı config atfı YOK |
| A2 | config.json plugin path → `D:\Vibecode\ordu\plugin` | 1 eşleşme, ConvertFrom-Json OK |
| A3 | `~/.codex/config.toml` trust + `[projects.'d:\vibecode\ordu']` | eklendi; eski `paseo-plugin` bloğu korundu |
| Schedule | `sozlesme-sondaj` (8fc84e8e) cwd+prompt → `D:\Vibecode\ordu` | updatedAt 2026-10-25T14:48Z; diğer 2 schedule (katman-kit, agent-os-go) etkilenmiyor |

## Bilinçli olarak yapılmayanlar (insan kararı bekliyor)

- **A4 kart anahtarları (B11, §5-C):** env'e taşıma kararı verilmedi — 6 kart/7 alan düz metin config'de kaldı (repo DIŞI, git-history riski yok; hijyen kararı kullanıcıda)
- **Bayat workspace'ler (§5-D):** `wks_0f45…` (paseo-plugin cwd) + `wks_de68…` (silinecek-task-graph cwd) — F4 kararına bırakıldı
- **K-0039:** kural-proxy 84>80, kayıtlı erte — restart'tan bağımsız

## Restart komutu (tam)

`taskkill /PID 36184 /T /F` — supervisor ağacı dahil; kullanıcı Paseo'yu masaüstünden yeniden açar. Sonraki oturumun işi: **A6 doğrulama** (plans/F3-TASLAK-2026-10-25.md §3): plugin yeni evden yüklü mü · watchdog tek ev (eski yola yeni yazım YOK, mtime) · ordu workspace bağlı · saglik 17 OK / 1 EKSIK · `git log` kesintisiz · A7 kapanış (B14/B11 islenme + STATE damgası).

Damga (R): 2026-10-25 17:50, ajan = devralan (Claude glm-5.3, ordu oturumu), commit = bu-turun-commit-i.
