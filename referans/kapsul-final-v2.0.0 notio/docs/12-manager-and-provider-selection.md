# Manager ve provider seçimi
Manager LLM sürekli açık scheduler değildir. Plan/diff, yeni failure signature veya kullanıcı mesajı olduğunda çağrılır.
Aynı run version olayları coalesce edilir; 5 saniyelik timer her seferinde LLM çağırmaz.
Supervisor READY işleri ve bütçeyi manager cevabı beklemeden onaylı recipe içinde yürütür.
Manager bağlamı kapsül bazlıdır; kardeş kapsüllerin sır/transkriptleri taşınmaz.
Input manifest/prompt/profile/output schema hash'i kaydedilir. Response schema-invalid ise bounded retry, sonra karar.

## Manager bağlantısı
Bir read-only Paseo session veya completion profile seçilebilir. Native MCP raw spawn/merge yüzeyi
manager/coder'ın control broker'ını bypass edemeyecek şekilde kapatılır; bu kurulu provider'da test edilir.
Kapatma veya sandbox sınırı doğrulanamazsa o profile autonomous write kapalıdır.
Provider discovery yalnız isim bulmak değil cancel/usage/permission/tool capability probe içerir.

## Profiller
Ekonomik: düşük riskli görevde onaylı ucuz aday; evaluator aynı.
Dengeli: owner'ın pilot ile seçtiği varsayılan paket.
Yüksek güvence: kritik task'ta daha iyi kanıtlı paket + gerektiğinde reviewer.
İlk uygulamada yalnız bir coder profile ile başla; profile çoğaltma benchmark sonucu gerektirir.
Model ID, fiyat ve kalite notu ölçümsüz sabit doğru olarak sunulmaz.

## Hız ve kalite
Bağımsız görevleri paralel, aynı candidate/merge hedefini seri yürüt.
Test suite küçültülmez; risk düşükse redundant LLM reviewer atlanabilir, deterministic gate atlanamaz.
Handoff kısa ve structured; full transcripts yerine evidence/snapshot ve failure signature.
Context contamination şüphesi veya runtime restart'ta yeni attempt; session reuse mümkün ama zorunlu değil.
