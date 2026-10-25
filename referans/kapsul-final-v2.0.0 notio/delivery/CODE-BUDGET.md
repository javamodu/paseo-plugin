# Kod bütçesi — tahmin, ölçülmüş uygulama değil
El yazımı boş olmayan source lines; generated/dependency/lock/docs hariç.
| Katman | Ürün LOC düşük | yüksek |
|---|---:|---:|
| Contract + config | 350 | 650 |
| DB + commands + transaction | 550 | 900 |
| Supervisor/policy/recovery | 850 | 1350 |
| Paseo adapter | 300 | 550 |
| Evaluator + artifacts | 350 | 600 |
| API/SSE/auth | 350 | 550 |
| React UI | 900 | 1400 |
| Small benchmark + read-only completion | 300 | 500 |
| Runtime-local adapter (ADR-012; ikinci runner — tek defter kalır) | 300 | 550 |
| **Ürün toplamı** | **4250** | **7050** |
| **Testler ayrıca** | **1800** | **2800** |
| **Test dahil toplam** | **6050** | **9850** |

> 2026-10-13 revizyonu (ADR-012/K-0005): "ikinci tam runner" önceki kapsam dışiydı;
> kullanıcı kararıyla local runtime yolu (git worktree + provider CLI + süreç
> registry'si) eklendi. Eski taban 3950–6500 / 5750–9300 bugüne kadarki referanstı.

Bunlar mevcut daemon/provider tool loops ve hazır sandbox kullanan dar tek-host kapsam tahminidir.
İşin gerçekten bu satır sayısında tamamlanacağı garanti değil; S1 sonunda yeniden ölçülür.
LOC hedefi security/recovery testlerini budama gerekçesi olamaz.
Native plugin, full second tool runner, fleet, hosted auth/RBAC, multiuser ve sandbox inşa etme dahil değil.
Paketin kendi demo/reference LOC'si üretim uygulaması büyüklüğü değildir.
Takvim taahhüdü yok; capability/probe, dikey dilim ve acceptance kapıları ilerleme ölçütüdür.
