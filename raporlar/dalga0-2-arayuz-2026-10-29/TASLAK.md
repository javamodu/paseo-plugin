# KAPANIS TASLAGI - DALGA-0-2-R2

> Uretici: scripts/kapanis-taslak.ps1 (v8 madde V8-02b / K0053 pilot dalga). Bu cikti SSOT DEGILDIR:
> STATE_BOARD / graf / kabul / SENARYO / CODEMAP / kanit defterlerine otomatik YAZILMAZ -
> operator inceler, olcumsuz hucreleri doldurur, elle isler. Uydurma deger YOK (V9-04 s7).

## 1. STATE damga satiri taslagi

```
- 2026-10-29 15:59 - DALGA-0-2-R2 DALGA KAPANIS TASLAGI - commits b6e1d53 + 644c616 + b4336c1 + 8c4c459 - kanal d=2026-10-29T15:57:15.7962780+03:00 h=8c4c459 x=0 test=dalga0-2-r2 sureSn=53 - olcum cifti: KISMI (kanal sn + x dolu; duvar sn + tur sayisi TABAN YOK) (TASLAK: STATE_BOARD otomasyonu YOK)
```

## 2. Graf / kabul / SENARYO satir taslaklari (dalga kimligi + commit listesi + kanal sonucu etiketli)

- graf: DALGA-0-2-R2 - commits b6e1d53 + 644c616 + b4336c1 + 8c4c459 - kanal d=2026-10-29T15:57:15.7962780+03:00 h=8c4c459 x=0 test=dalga0-2-r2 sureSn=53 (TASLAK - graf defterine otomatik yazilmaz)
- kabul: DALGA-0-2-R2 - commits b6e1d53 + 644c616 + b4336c1 + 8c4c459 - kanal d=2026-10-29T15:57:15.7962780+03:00 h=8c4c459 x=0 test=dalga0-2-r2 sureSn=53 (TASLAK - kabul defterine otomatik yazilmaz)
- SENARYO: DALGA-0-2-R2 - commits b6e1d53 + 644c616 + b4336c1 + 8c4c459 - kanal d=2026-10-29T15:57:15.7962780+03:00 h=8c4c459 x=0 test=dalga0-2-r2 sureSn=53 (TASLAK - SENARYO dosyasina otomatik yazilmaz)

## 3. ONCE/SONRA olcum cifti tablosu (CALISTIRMA.md s7 - V9-04)

| olcut | ONCE (taban) | SONRA |
|---|---|---|
| kanal suresi (sn) | 206 | 53 |
| duvar suresi (sn, tur baslangic -> kapanis, olculmus) | TABAN YOK (kanal JSON semasinda duvar alani yok - uydurma YASAK) | 3061 |
| x (basarisiz kosum sayisi) | 0 | 0 |
| tur/kosum sayisi | kosum=1 (taban kanal kaydindan) - tur sayisi TABAN YOK (kayitta tur alani yok) | 1 tur / 1 kosum (bu taslagin girdileri: tek tur penceresi + tek kanal JSON) |

Durum: TABAN KISMI: kanal sn + x ONCE hucreleri taban kanalindan dolu (d=2026-10-29T11:22:32.4818965+03:00 h=ea78bd3 x=0 test=dalga0-arayuz-1 sureSn=206); duvar sn + tur sayisi ONCE hucreleri TABAN YOK (kanal JSON semasinda alan yok - ASLA uydurulmaz; operator olculmus tabani taslakta elle tamamlar).

## 4. Girdiler (iz surulebilirlik - degerler oldugu gibi, tahmin YOK)

- DalgaId: DALGA-0-2-R2
- Commits: b6e1d53 + 644c616 + b4336c1 + 8c4c459
- KanalJson: raporlar\kanit-hedef\son-kanit.json
- OnceKanalJson: raporlar\dalga0-2-arayuz-2026-10-29\once-kanit.json
- TurBas: 2026-10-29T15:08:28
- TurSon: 2026-10-29T15:59:29
- TurSon - TurBas (olculmus duvar suresi): 3061 sn
