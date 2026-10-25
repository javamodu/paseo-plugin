# Sözleşmeler
Örnek hash/session/profile değerleri fixture'dır; execution-ready onay/model değildir.
Command.payload ve Event.payload semantic registry validation'ı production handler'da yapılır;
genel object schema bu iç payload'ın bütün iş kuralını doğrulamaz.
Core hiçbir typed actor, path veya PASS JSON'unu tek başına trusted receipt saymaz.
Schema doğruluğu graph dependency, niyet, sandbox veya safety doğruluğu değildir.
canonical TS implementation exports bu onaylı baseline ile compatibility fixture testinden geçer.
