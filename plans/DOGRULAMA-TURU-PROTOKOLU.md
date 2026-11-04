# ÇEKİRDEK DOĞRULAMA TURU PROTOKOLÜ — Ar-Ge + taban (2026-11-04)

Kaynak: kullanıcı emri «ilk önce çekirdek fonksiyonları doğrulayalım sonra makyaj cila» + sıra kararı [PANEL-DALGA-SIRASI] madde 1. Tur, FAZ-U kapanışı sonrası STABİL kodda koordinatör bizzat koşar; bu belge ölçüm yöntemi + o anki taban gerçeğidir.

## 1) API yüzeyi (pano/server.js — 4937 izole test sunucusu)

| Uç | Yöntem | Kapı | Not |
|---|---|---|---|
| `/ordu` | GET | açık | HTML statik |
| `/api/ordu/genel` `/kadro` `/akis` `/saglik` `/log` `/projeler` | GET | **açık (salt-okur)** | PANO_TOKEN yalnız POST'la ilişkili |
| `/api/ordu/konusma?ajan=<uuid>` | GET | açık | tail-read 512KB · 30 balon · 2000 krk; kayıt/transcript yoksa dürüst 404 |
| `/api/mesaj` | POST | **403 (TOKEN yok) / 401 (geçersiz)** + 400 whitelist + 429 2sn aralık + 502/503 köprü | dış-etki: SADECE kullanıcı onayıyla |

## 2) Disk taban gerçeği (Ar-Ge ölçümü 2026-11-04 ~14:1x +03:00 — SNAPSHOT, tur anında YENİDEN ölçülür)

- `~/.paseo/agents/` **1087 ajan kaydı** · durum: closed 853 · idle 187 · error 40 · **running 7**
- Yönetim hiyerarşisi: **481 bağlı kayıt** (subagent) · **46 yönetici** (parent-agent-id) · 606 parent'sız (operatör doğumlu). En büyük yönetici 53 ajan; KURMAY-1 (8cc610a4) **14** bağlı kayıt.
- Çalışan 7: 3f3584c0 [KURMAY-1'e bağlı] ordu-yazıcı · 8cc610a4 KURMAY-1 (ben) · 79932b50 ai-scene-graph-dart · cd8cab39 Chrome-ext-page-agent · 951b6c46 sarisite-export · e11bfe9c pc-guard (+1)
- ORDU projesi (D-Vibecode-ordu): **66 kayıt · 2 çalışan · 0 hata · 4 idle** · 60 closed
- Hata 40: yoğunluk «c-Users-gatep-Local-Sites-1» (WordPress R1-R5 probeleri)

## 3) Tur denetim listesi (ölçüm → kanıt)

1. **API zinciri**: GET uçlarının 7'si de 200 + şema (genel/kadro/akis/saglik/log/projeler/konusma) — tarayıcı `fetch` (evaluate) ile; token YALNIZ localStorage'dan header'a — ekrana/komuta/log'a YAZILMAZ.
2. **Veri-disk tutarlılığı** (ölçüm anında disk yeniden taranır): panel ağacındaki proje sayısı = disk dizin sayısı; ORDU satırı = 66 kayıt/2 çalışan; çalışan ajan sayısı = disk running sayısı; hata uyarı işareti = disk error sayısı (proje bazlı).
3. **Hiyerarşi doğruluğu** (FAZ-V'in veri temeli — şimdilik API+disk tarafı): parent-agent-id etiketi disk kayıtlarıyla birebir; KURMAY-1'in bağlıları listesi (yazıcı dahil) doğru.
4. **Fail-closed yüzeyler**: kök yolu olmayan uçta boş/dürüst yüzey (ölü buton YOK E10); konusma 404 düz metin; POST /api/mesaj token'sız 401/403.
5. **Oturum/transcript**: ağaçtan ajan seç → oturum sekmesi + balonlar (ölçüm anı etiketi dahil).
6. **Görsel boyutlar**: 390/1024/1280 (FAZ-T ölçümleri referans — serit sarma/sol kaydırma/composer).
7. **Canlı gönderim**: SADECE kullanıcı açık onayıyla (dış-etki) — onay gelmezse atlanır ve rapor edilir.
8. Çıktı: `raporlar/pano-cekirdek-dogrulama-2026-11-04/OZET.md` + .json (ölçümler + bulgular + islenme:null maddeleri varsa raporlar/gelen-kutu'ya).

## 4) Ar-Ge notları / riskler

- Taban sayıları CANLI sürü: ajanlar koşarken değişir → tur anında yeniden taranır, snapshot'a karşı değil ANLIK diske karşı karşılaştırılır.
- GET'ler kapısız (salt-okur, tasarım kararı — PANO_TOKEN POST kapısı): dışarıya açık DEĞİL (127.0.0.1 izole port); yine de turda doğrulanır.
- Ağaç 75 proje gösterir — disk 75 dizin (operatör sorusu: aktif 42 vs 75 — filtre kararı [PANEL-DALGA-SIRASI] makyaj maddesinde, kullanıcıda).
- Hiyerarşi etiketi yalnız subagent doğumlarda var: operatör doğumlular parent'sız — FAZ-V yüzeyinde «bağlı: operatör (pano dışı)» dürüst gösterimi.
