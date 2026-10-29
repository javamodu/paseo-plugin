# Ajan başlangıcı — yön bulma, uygulama emri değil

**Amaç:** Büyük durum/ders/plan belgelerinin tamamını bağlama yüklemeden doğru otoriteye ulaşmak. Bu sayfa yeni SSOT veya bağımsız durum defteri değildir; işaretçidir.

| İhtiyaç | Açılacak kaynak |
|---|---|
| Üst kural ve çalışma sınırları | [ANAYASA](../ANAYASA.md), [AGENTS](../AGENTS.md), [evrensel sözleşme](../sozlesme/PASEO-VERIMLILIK-REHBERI-v2.1.md) |
| Dosya seçmek | [CODEMAP](../CODEMAP.md); sonra yalnız görevle ilgili bölüm/dosya |
| Hangi belge yetkili? | [SSOT indeksi](SSOT-INDEX.md) |
| Şimdi ne açık, ne bekliyor? | [STATE_BOARD](../STATE_BOARD.md) Aktif iş ve ilgili güncel damga; eski START damgaları tarihçedir |
| Ürün sırası ve insan kapıları | [Ana plan](PLAN.md) §25; belge birleşimi §26; fişler §27; kapanış eki §28 |
| Göreve başlamak | [Atomik paket özeti](uygulama-paketleri/DC-H1-2026-10-28/OZET.md), ardından yalnız atanmış fiş ve [CALISTIRMA](uygulama-paketleri/DC-H1-2026-10-28/CALISTIRMA.md) |
| Veri/DB ve yerel komut güvenliği | [Veri yerleşimi](VERI-YERLESIMI.md); salt-okur sanılan CLI açılışı da yazabilir |
| Etkin açıklar ve kaynak düzeltmeleri | [Mevcut eksik defterinin DC eki](../raporlar/birlesik-eksik-defteri-2026-10-25/DC-2026-10-28.json), [birleşim paketi](../raporlar/rapor-birlesimi-2026-10-28/OZET.md) |
| Kilit adayının kanıtı | [Kapanış raporu](../raporlar/kilit-oncesi-kapanis-2026-10-28/OZET.md); aday, final insan kabulü değildir |

**Okuma disiplini:** Durum/ders belgesinin satır sayısı düşük olsa da uzun satırları vardır. İndeks → ilgili bölüm → kaynak; eski raporu tek başına güncel hüküm sayma. Kaynak raporların tarihli düzeltme ekleri ve makine ikizindeki etkin kayıt dikkate alınır.

**Sınır:** Görev fişleri ürün grafiğine yeni düğüm/PASS açmaz. B0–B4 belge hazırlığı S0a/G0/kod/sağlayıcı yetkisi değildir. Uygulama başlatma, harcama, kabul, commit/tag/push ve geri alma kendi insan kapılarını korur. Boş kararı ajan doldurmaz.
