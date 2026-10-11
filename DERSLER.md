# DERSLER — paseo-plugin (L5)

- PowerShell here-string kapanışı `'@` satır başında olmalı; değilse parser hatası.
- Remove-Item bazı ortamlarda politikaya takılır; Move-Item çalışır.
- "$anchor" çift tırnak içinde $ değişkeni interpolasyon yapar — eşleştirme metinlerini tek tırnakla tanımla.
- 130 satır markdown ≈ 4-5k token (Aider'in 1k token bütçesi yoğun kod sembolleri içindir; doküman haritası daha hacimli).
- Git post-commit hook testi temp repoda 5 dakikada kanıtlanır (HEAD damgalı CODEMAP üretildi).
- gh repo create stderr'e yazar; PowerShell NativeCommandError sanabilir — ls-remote ile doğrula.
