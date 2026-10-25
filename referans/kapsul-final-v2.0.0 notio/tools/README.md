# Araçlar
verify.py yalnız kendi paket dosyaları ve saf fixture testleri üzerinde çalışır; network/provider yok.
Manifest hash check paket tutarlılığıdır, owner approval veya güvenlik proof değildir.
Bu verifier subset'i draft-07'nın tüm keywords'lerini uygulamaz; production TypeBox/Ajv gerekir.
Paket dışı arbitrary dosya yolu veya kullanıcı shell metni çalıştırılmaz.
Offline report manifest kapsamı dışında üretilir; baseline içerik değiştirmek verify'ı kırar.
