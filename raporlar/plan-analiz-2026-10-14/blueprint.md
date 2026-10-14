# Plan Analizi — BLUEPRINT (pano-blueprint-2026-10-13)

Tarih: 2026-10-14 · Çerçeve: v3.2 (15 alan, sabit ağırlıklar) · Yöntem: diskten doğrulama + çapraz-repo kanıt (paseo-plugin STATE_BOARD) · Analiz edilen: D:\Vibecode\silinecek-task-graph\pano-blueprint-2026-10-13

## Zorunlu sorular — sonuçlar

1. **pano.ts / ordu.ts gerçek kod mu: EVET.** pano.ts (297 satır): bağımlılıksız node:http köprü, 127.0.0.1:4378, GET /api/durum|ajanlar|izinler|repolar|plan|canli(SSE) + POST /api/emir fail-closed PANO_TOKEN; statik serviste path-traverse koruması (normalize + startsWith kontrolü). ordu.ts: spawn-kuyruk.jsonl → spawn-sonuc.jsonl append-only komuta hattı, spawnDogrula ile max-paralel freni (3 coder/2 tester/6 toplam), aktifWorkerSay label bazlı sayım, MANAGER_BRIEF enjeksiyonu. İkisi de çalışır mantık; canlı kanıt çapraz-repo'da (paseo-plugin STATE_BOARD 2026-10-13: /api/durum 200 gerçek ajan verisi, POST 403 fail-closed, SSE akışı — * tek-kaynak ama güçlü).
2. **Test altyapısı: PAKETTE YOK.** Blueprint snapshot'ında ne test dosyası ne package.json ne tsconfig var. Dahası pano.ts `from "./planmd"` import ediyor ama planmd.ts pakete dahil edilmemiş → paket standalone derlenemez. F1 (planmd 19 test) ve F2 (spawn kuyruğu 12 test) kaynak repoda mevcut (STATE_BOARD iddiası, *); blueprint'e taşınmamış. KANIT-EKSIK.
3. **K-0033 ikili temsil: iyi tasarım, kısmen uygulanmış.** İnsan yüzeyi plan.md (kısıtlı satır formatı: `- [ ] S1-01 ... · kabul: ... · once: ...`) ↔ makine çekirdeği emirler.json (tek otorite, append-kilit). Derleyici = manager LLM (dosyaya yazamaz, plugin işler); doğrulayıcı = deterministik checker: schema + tek-id + döngüsüz bağımlılık + ölçülebilir kabul + izinli dizin + round-trip md geri-üretimi; drift'te insan kazanır, json yeniden derlenir. veri/plan.md canlı örnek taşıyor (S0-01 [x] işaretli). Kapasite modeli (ORDU-PLAN v1.1): izinler.json "token" ekseni provider-başına "kapasite" eksenine genişler — {tip: token|sure|limitsiz, hizSiniri}; kimi-k3 codefast "sure" tipinde hız sınırı + kuyruğa-al; fren manager'da değil plugin'de (fail-closed), kod karşılığı ordu.ts VARSAYILAN_AYAR + spawnDogrula. Bench 3 eksen (hız/kalite/uyum) yonlendirici.json skor vektörüyle beslenir; bench→canlı ağırlık kuralı (ilk 20 tur %50) kayıtlı.

## Alan tablosu (v3.2)

| Alan | Ağırlık | Puan (0-10) | Katkı | Kanıt / not |
|---|---:|---:|---:|---|
| Teslim | 14 | 6 | 84 | Çalışan köprü+komuta kodu var (canlı doğrulanmış*); ama paket eksik snapshot: planmd.ts yok, derlenemez, manifest/LOCK yok |
| Yetki/güvenlik | 13 | 7 | 91 | Fail-closed token, loopback, traverse koruması, append-kilit, izinler 4 eksen; zayıflık: token HTML'e enjekte (__PANO_TOKEN__ tam görünür — kendi BLUEPRINT §9 kuralıyla çelişir), GET'ler auth'suz |
| Halüsinasyon/kanıt | 10 | 7 | 70 | K-0033 round-trip checker deterministik güvenlik supabı; demo veri sarı bant kuralı; ama kanıt çapraz-repo'da, pakette evidence/ yok |
| Long-run/recovery | 10 | 6 | 60 | v1.5 hedef döngüsü (ölç-dene-kilitle/geri-al, plateau, self-healing) tasarımı güçlü, F7'de; köprü restart/recovery mekanizması yok |
| İzleme | 8 | 7 | 56 | SSE canlı ızgara (doğrulanmış*), telemetri.jsonl, Metrik/Kuyruk sekmeleri (bir kısmı EKSIK olarak beyanlı) |
| Otonomi | 7 | 7 | 49 | Manager müdahale/sor/asla merdiveni + plugin'de fail-closed frenler; F4 otonomi henüz tasarım |
| Manager | 6 | 8 | 48 | Paketin kalbi: tek kapı manager, MANAGER_BRIEF 4 bölüm, spawn tek noktadan sayılıyor — gerçek kodda |
| Handoff | 5 | 6 | 30 | Ekosistemde handoff zinciri güçlü; blueprint'te pano sekmesi olarak düşük öncelikli |
| Coding | 5 | 7 | 35 | Coder/tester spawn hattı gerçek; worktree izolasyonu planlı, tester "kod yazamaz" kuralı brief'te |
| Reasoning | 4 | 7 | 28 | Manager derleyici + deterministik checker ayrımı sağlam akıl yürütme mimarisi |
| Paralellik | 4 | 7 | 28 | spawnDogrula'da gerçek fren (3/2/6); kapasite tipi bazlı kuyruk |
| Schedule | 4 | 5 | 20 | 5sn poller + saat ekseni + pitbull 8dk; cron/schedule zenginliği yok |
| Memory | 4 | 7 | 28 | DERSLER enjeksiyonu + yonlendirici.json öğrenen döngü + retro; kısmen canlı |
| Hız/maliyet | 3 | 7 | 21 | Kapasite modeli (token/süre/limitsiz) + kimi-k3 hız sınırı + bench 3 eksen — iyi düşünülmüş |
| Taşınabilirlik | 3 | 3 | 9 | Hardcoded D:\Vibecode yolları, eksik modül, build/test altyapısı yok — snapshot taşınamaz |

**Ağırlıklı toplam: 65,7 / 100**

## İlk 3 açık

1. **Paket standalone derlenemez** — durum: UYGULAMA-EKSIK. Kod yeri: paseo-verimlilik/pano.ts:6 (`from "./planmd"` — modül pakette yok) + package.json/tsconfig yokluğu. Kabul testi: planmd.ts + bağımlılıklar pakete eklenir, `tsc --noEmit` exit 0, köprü `node` ile ayağa kalkar ve /api/durum 200 döner.
2. **Test altyapısı ve kanıt pakette yok** — durum: KANIT-EKSIK. Kod yeri: pakette tests/ yok; F1 19 + F2 12 test kaynak repoda (STATE_BOARD, *). Kabul testi: test dosyaları pakete taşınır, koşu çıktısı evidence/ altına damgalanır, ordu.ts spawnDogrula negatif testleri (max-toplam/max-coder aşımı) paket içinde yeşil.
3. **Token HTML'e tam enjekte + GET auth'suz** — durum: TASARIM-EKSIK (kendi kuralıyla çelişki). Kod yeri: paseo-verimlilik/pano.ts statikServis (__PANO_TOKEN__ replace) ve GET /api/ajanlar|izinler|plan auth kontrolsüz; BLUEPRINT.md §9.5 "anahtar hiçbir yerde tam görünmez". Kabul testi: yazma token'ı HTML'e gömülmez (session/localhost-cookie veya header-only akış), GET'ler en az loopback-token ister; negatif test: tokensuz GET 401/403.

## Hüküm

Blueprint, Final'in tersine kanıtlanmış çalışan parçalar içeren bir sistem fotoğrafı: köprü canlı doğrulanmış, spawn kuyruğu ve max-paralel freni gerçek kodda, K-0033 ikili temsil + kapasite modeli (token/süre/limitsiz, hız sınırı plugin'de fail-closed) özgün ve uygulanabilir tasarım. Zaafı paket disiplini: snapshot eksik (planmd.ts'siz derlenemez), test ve kanıt blueprint'e taşınmamış, ve kendi güvenlik kuralını (token gizliliği) kendi kodunda ihlal ediyor. Final'in tasarım olgunluğu + Blueprint'in çalışan kodu birleştiğinde sistem 80+ bandına çıkar; tek başına Blueprint 66/100 — değerli iskelet, taşınabilir teslim değil.
