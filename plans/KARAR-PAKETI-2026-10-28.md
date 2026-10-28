# KARAR PAKETİ — kümelenmiş [insan] kapıları (v8 hız paketi madde 7; 2026-10-28)

Amaç: bekleyen [insan] kapılarını TEK oturumda, her biri KENDİ onay metniyle sıraya
koymak — kapılar parça parça dağılmış oturumlarda kaybolmasın. Bu dosya ONAY DEĞİLDİR:
ajan hiçbir kapıyı kendi adına açamaz (EK-2); burada yalnız kullanıcıya sunulan sıra ve
her kapının tam cümlesi var. Kullanıcı istediği satırı kendi terminalinde/kendi
oturumunda söyler; kapı açılmış sayılması için cümlenin İNSAN aktöründen gelmesi yeter.

## Kapılar (öneri sırası — kullanıcı istediğini atlar/seçer)

| # | kapı | ne istiyor | kullanıcı cümlesi (tam metin) | açtığı şey |
|---|---|---|---|---|
| 1 | **rpl-03579e06** replan onayı | A0 dalga açılışı replan taslağı (core/data/replan.jsonl) | `node src/cli.ts replan --onay rpl-03579e06 --confirm "REPLAN ONAYLIYORUM"` (core/ dizininden, KULLANICI terminali) | replan taslağı onaylanır; dalga bütçesi bağlanır |
| 2 | **K-0044** uygulama penceresi | kart anahtarlarının env'e taşınması (config'de env-referans) | cümle değil ZAMAN penceresi: restart'ta birlikte (3 adımlı senaryo: env-referans sınama → setx'İ KULLANICI yapar → restart; anahtar DEĞERLER hiçbir çıktıya yazılmaz — sır hijyeni) | K-0044 uygulanır; config gizli anahtardan kurtulur |
| 3 | **K-0053** yazar hattı ADR | dalga-bazlı yazar hattı (worktree/branch + merge-birimi L4 kaydı) | "K-0053'ü onaylıyorum — dalga-bazlı yazar hattı pilotu başlasın" (ADR: kararlar/K-0053.md) | pilot dalga ölçülür; V8-05 paralel eşeme bu onayla açılır |
| 4 | **S0A_START** (DC-S0a-01) | uygulama paketi ilk keşif fişinin serbest bırakılması | "S0A_START'ı onaylıyorum — DC-S0a-01 kaynak/ortam keşfi" + CALISTIRMA §2'deki 8 maddeli koordinatör serbest bırakma kaydı (öNkoşul: kayıt gerçek kaynaktan bağlanmadan emir geçersiz) | salt-okur keşif fişi yürütülür (ürün kodu/probe/DB YOK; rapor çifti tek çıktı) |
| 5 | **H1 bütçe payları** (T) | atomik LOC paylarının kabulü (kaynak 2.230–3.700 / test 3.050–4.750 / toplam 5.880–9.450) | "H1 atomik LOC paylarını onaylıyorum" (fiş ayrıntısı: plans/uygulama-paketleri/DC-H1-2026-10-28/OZET.md §LOC) | S1 kapısının bütçe ayağı hazır olur (S1 yine G0 + teknik ADR bekler) |
| 6 | **S2/S5/S6 düdükleri** | graf kuyruğundaki açılış düdükleri | metinler burada YAZILMAZ (uydurma yasağı) — graf sahibi turda şekillenir | ilgili dalgalar açılır |

## Bağlam notları

- Kapı 1 ve 2 mevcut kuyruğun başı (HANDOFF-2026-10-28-2031 sırası); kapı 3 bu turun
  ürünü; kapı 4-5 DC-H1 paket fişlerinden (RBT-2026-10-28.2'nin alanı — burada yalnız
  özetlendiler, fiş/kabul yazılmadı); kapı 6 hatırlatma satırı.
- Onaylar kimlik bağlar: cümle hangi kapıyı adıyla anıyorsa o kapı açılır; karışık
  cümle = yeni karar kaydı ister (L4), ajan yorumuyla genişletilmez.
- Bu paket [insan] onayı vermez, DEPOLAR: kullanıcı hazır olduğunda tek bakışta
  sırayı görür. Kapı kapandıkça satırına işlenme damgası (tarih + bağlanan tur) eklenir.
