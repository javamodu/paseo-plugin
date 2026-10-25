# paseo-pano — Pano Prototipi (izole)

K-0019'un bagimsiz prototipi: plugin'e gomulu degil, ayri proje. Amac: Doktor sekmesini gercek telemetriyle dogrulamak, sonra plugin entegrasyonuna karar vermek.

## Calistir
```
node server.js            # http://127.0.0.1:4377
PANO_TOKEN=gizli node server.js   # POST /api/emir icin token (yoksa fail-closed)
```

## Prensipler (K-0019)
- Bagimlilik sifir (node:http + vanilla HTML/JS, build yok)
- Yalniz 127.0.0.1 bind
- /api/veri TTL onbellek 60sn (tam tarama pahali)
- POST /api/emir dar-liste + token yoksa fail-closed
- /api/canli SSE (15sn heartbeat)
- Veri kaynagi: repolardaki .verimlilik/telemetri.jsonl + STATE_BOARD.md (salt-okur)

## Orkestra (plugin köprüsü, K-0020)
`orkestra.html` — paseo-verimlilik plugin'inin subprocess köprüsü üzerinden servis edilen orkestrasyon beyni.
- Plugin köprüsü: http://127.0.0.1:4378 (plugin yüklüyse otomatik; `PANO_PORT`/`PANO_UI_DIR` env ile değişir)
- Paseo içinde: workspace paneli "Pano" → "Panoyu sekmede aç" (workspace browser tab'ı)
- API: GET /api/durum · /api/ajanlar · /api/izinler · /api/canli (SSE) · POST /api/emir (gonder/yarat/izin/arsivle)
- Yazma fail-closed: daemon'a `PANO_TOKEN` env verilmedikçe POST 403. Token tanımlıysa HTML'e enjekte edilir (yalnız 127.0.0.1).
- Standalone telemetri prototipi (server.js, port 4377) bağımsız çalışmaya devam eder.
