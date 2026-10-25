# K-0006 — MASTER-SSOT v1.0 devralması: ordu-v3 v3.1 (2026-10-14)

Yetki: kullanıcı emri "sen kendi planını en iyi hale getir". Değerlendirme girdisi:
`kararlar/DEGERLENDIRME-master-ssot-v1.0.md` (64/100) + GPT bağımsız değerlendirmesi
(`gpt/MASTER-SSOT-TASLAK-DEGERLENDIRME.md`, 6/10).

## Karar: A yolu — DEVRET, ÇATALLAMA YOK

MASTER-SSOT bir **otorite adayı** olarak reddedilir (file-SSOT, mevcut kanıtlı SQLite
defter hattını — 51/51 hermetik, A05–A08/A13/A35/A36 — karşılıksız bırakır; Y1 ihlali).
ANCAK planın gerçekten benden iyi olan 3 parçası ordu-v3'e işlenir. Otorite, veri
sözleşmesi ve kapı seti DEĞİŞMEZ (Final baseline + ADR-011/012 sabit).

## Devralınanlar

1. **İş modları** (atolye/firtina/ekonomi) → 00-master §4. Görev/profil başına, mesaj
   başına değil. Yalnız kapasite/bütçe/kademe etkiler; A-kapıları/fence/onay dokunulmaz.
2. **Kanonik adaptör sözleşmesi** (5 sözcük + SDK-sızma yasağı + iptal istek≠teyit +
   normalize hata sınıfları + usage-bilinmiyor) → 00-master §4. Karşılık koda zaten var:
   `dispatcher.ts` WorkerAdapter, `paseo-adapter.ts`, `local-runtime.ts`.
3. **Paseo-kapalı bileşen tablosu** → 20-uzaktan §11. ADR-012'nin operatör yüzü;
   "uyur ama ölmez" + tek gerçek dış-bağımlılık = yürütme.

## Eklenen kabul kapısı

- **STOP SLO ölçümü** (40-kabul V3-S1.5): "yeni spawn'ı ≤5sn keser" artık ölçülebilir
  iddia — latch okuma sırası mekanizması var (A16/S7), zaman hedefi koşarak doğrulanacak.

## Bilinçli ALINMAYANLAR (ve neden)

- 11-ekran varsayılan UI + PNG/konsol-hatası kabulü → bilişsel sadeliki bozar; ordu-v3
  3-bölge/5-soru varsayılanını korur (uzman ayrınti katlanır).
- "SQLite v1'de YOK" + dosya-SSOT → kanıtlanmış atomik/fence hattını kağıtla değiştirmek
  (K1/K2/K3 — recovery semantiği tanımsız). Reddedildi.
- "her sprint daha ucuz/hızlı" → confounder'lı garanti; ordu-v3 bunu öğrenme BAŞARI
  tanımı olarak ölçer (30 §5), söz olarak değil (Y5).

## Soy

Katılan: `plans/ORDU-CORE-BAGIMSIZLIK-PLAN.md` (workspace'te YOK — doğrulanamayan soy,
K8) bu kararla ordu-v3 §4/20-§11 içinde karşılanmış sayılır; ayrı dosya tutulmaz.

## EK (aynı oturumda bulunan daha tam baseline): Kapsul-Autonomous-Army-Master-v3.0.0

Denetim sırasında kullanıcının açtığı `Kapsul-Autonomous-Army-Master-v3.0.0/` paketinin
mevcut **teknik spec superset'i** olduğu görüldü (docs 01–15, ADR-011+012; eski
`kapsul-final-v2.0.0 notio/` alt küme). Bu bir ÇATALLAMA değil — içerik ordu-v3
kapılarıyla birebir örtüşüyor ve README "çalışır production DEĞİL / canlı kapılar NOT_RUN"
diyor; yani tasarım ekidir, çalışan kanıt hâlâ ordu-core. Yapılanlar:
- README otorite satırı v3.0.0'a hizalandı (v2.0.0 alt-küme olarak işaretlendi).
- **LLM ekonomisi** (her düğümde 6 rol koşmaz) → 00-master §3 sabit.
- **Slot sayımı rezervasyonla, etiketle değil** (WAITING/PAUSED slot tutar; ölçülemeyen
  iç nested ajan KAPALI) → 00-master §3 sabit (A07/A24 ile bağlı).
- **Otonomi merdiveni** ADVISORY→SUPERVISED→BOUNDED_AUTO → 20-uzaktan §7 başı.
Otorite, kapı seti ve defter değişmedi (Y1 sabit).
