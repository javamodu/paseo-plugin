# KAPANIS TASLAGI - DALGA0-ARAYUZ-1

> Uretici: scripts/kapanis-taslak.ps1 (v8 madde V8-02b / K0053 pilot dalga). Bu cikti SSOT DEGILDIR:
> STATE_BOARD / graf / kabul / SENARYO / CODEMAP / kanit defterlerine otomatik YAZILMAZ -
> operator inceler, olcumsuz hucreleri doldurur, elle isler. Uydurma deger YOK (V9-04 s7).

## 1. STATE damga satiri taslagi

```
- 2026-10-29 11:26 - DALGA0-ARAYUZ-1 DALGA KAPANIS TASLAGI - commits aefc03a + f56052b + ea78bd3 - kanal d=2026-10-29T11:22:32.4818965+03:00 h=ea78bd3 x=0 test=dalga0-arayuz-1 sureSn=206 - olcum cifti: KISMI (kanal sn + x dolu; duvar sn + tur sayisi TABAN YOK) (TASLAK: STATE_BOARD otomasyonu YOK)
```

## 2. Graf / kabul / SENARYO satir taslaklari (dalga kimligi + commit listesi + kanal sonucu etiketli)

- graf: DALGA0-ARAYUZ-1 - commits aefc03a + f56052b + ea78bd3 - kanal d=2026-10-29T11:22:32.4818965+03:00 h=ea78bd3 x=0 test=dalga0-arayuz-1 sureSn=206 (TASLAK - graf defterine otomatik yazilmaz)
- kabul: DALGA0-ARAYUZ-1 - commits aefc03a + f56052b + ea78bd3 - kanal d=2026-10-29T11:22:32.4818965+03:00 h=ea78bd3 x=0 test=dalga0-arayuz-1 sureSn=206 (TASLAK - kabul defterine otomatik yazilmaz)
- SENARYO: DALGA0-ARAYUZ-1 - commits aefc03a + f56052b + ea78bd3 - kanal d=2026-10-29T11:22:32.4818965+03:00 h=ea78bd3 x=0 test=dalga0-arayuz-1 sureSn=206 (TASLAK - SENARYO dosyasina otomatik yazilmaz)

## 3. ONCE/SONRA olcum cifti tablosu (CALISTIRMA.md s7 - V9-04)

| olcut | ONCE (taban) | SONRA |
|---|---|---|
| kanal suresi (sn) | 166 | 206 |
| duvar suresi (sn, tur baslangic -> kapanis, olculmus) | TABAN YOK (kanal JSON semasinda duvar alani yok - uydurma YASAK) | 1297 |
| x (basarisiz kosum sayisi) | 0 | 0 |
| tur/kosum sayisi | kosum=1 (taban kanal kaydindan) - tur sayisi TABAN YOK (kayitta tur alani yok) | 1 tur / 1 kosum (bu taslagin girdileri: tek tur penceresi + tek kanal JSON) |

Durum: TABAN KISMI: kanal sn + x ONCE hucreleri taban kanalindan dolu (d=2026-10-29T10:30:09.7572546+03:00 h=ebb6692 x=0 test=inceleme-3fail-2026-10-29 sureSn=166); duvar sn + tur sayisi ONCE hucreleri TABAN YOK (kanal JSON semasinda alan yok - ASLA uydurulmaz; operator olculmus tabani taslakta elle tamamlar).

## 4. Girdiler (iz surulebilirlik - degerler oldugu gibi, tahmin YOK)

- DalgaId: DALGA0-ARAYUZ-1
- Commits: aefc03a + f56052b + ea78bd3
- KanalJson: raporlar\kanit-hedef\son-kanit.json
- OnceKanalJson: raporlar\dalga0-arayuz-2026-10-29\once-kanit.json
- TurBas: 2026-10-29 11:04:48
- TurSon: 2026-10-29 11:26:25
- TurSon - TurBas (olculmus duvar suresi): 1297 sn
