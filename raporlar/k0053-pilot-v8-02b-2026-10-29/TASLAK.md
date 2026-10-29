# KAPANIS TASLAGI - K0053-PILOT-1

> Uretici: scripts/kapanis-taslak.ps1 (v8 madde V8-02b / K0053 pilot dalga). Bu cikti SSOT DEGILDIR:
> STATE_BOARD / graf / kabul / SENARYO / CODEMAP / kanit defterlerine otomatik YAZILMAZ -
> operator inceler, olcumsuz hucreleri doldurur, elle isler. Uydurma deger YOK (V9-04 s7).

## 1. STATE damga satiri taslagi

```
- 2026-10-29 09:19 - K0053-PILOT-1 DALGA KAPANIS TASLAGI - commits c2e26ce + 3b137dd + c24c883 - kanal d=2026-10-29T09:17:49.4798958+03:00 h=c24c883 x=0 test=k0053-pilot-v8-02b sureSn=112 - olcum cifti: KISMI (kanal sn + x dolu; duvar sn + tur sayisi TABAN YOK) (TASLAK: STATE_BOARD otomasyonu YOK)
```

## 2. Graf / kabul / SENARYO satir taslaklari (dalga kimligi + commit listesi + kanal sonucu etiketli)

- graf: K0053-PILOT-1 - commits c2e26ce + 3b137dd + c24c883 - kanal d=2026-10-29T09:17:49.4798958+03:00 h=c24c883 x=0 test=k0053-pilot-v8-02b sureSn=112 (TASLAK - graf defterine otomatik yazilmaz)
- kabul: K0053-PILOT-1 - commits c2e26ce + 3b137dd + c24c883 - kanal d=2026-10-29T09:17:49.4798958+03:00 h=c24c883 x=0 test=k0053-pilot-v8-02b sureSn=112 (TASLAK - kabul defterine otomatik yazilmaz)
- SENARYO: K0053-PILOT-1 - commits c2e26ce + 3b137dd + c24c883 - kanal d=2026-10-29T09:17:49.4798958+03:00 h=c24c883 x=0 test=k0053-pilot-v8-02b sureSn=112 (TASLAK - SENARYO dosyasina otomatik yazilmaz)

## 3. ONCE/SONRA olcum cifti tablosu (CALISTIRMA.md s7 - V9-04)

| olcut | ONCE (taban) | SONRA |
|---|---|---|
| kanal suresi (sn) | 125 | 112 |
| duvar suresi (sn, tur baslangic -> kapanis, olculmus) | TABAN YOK (kanal JSON semasinda duvar alani yok - uydurma YASAK) | 1473 |
| x (basarisiz kosum sayisi) | 0 | 0 |
| tur/kosum sayisi | kosum=1 (taban kanal kaydindan) - tur sayisi TABAN YOK (kayitta tur alani yok) | 1 tur / 1 kosum (bu taslagin girdileri: tek tur penceresi + tek kanal JSON) |

Durum: TABAN KISMI: kanal sn + x ONCE hucreleri taban kanalindan dolu (d=2026-10-28T23:13:52.4148411+03:00 h=39f46e4 x=0 test=v9-06 sureSn=125); duvar sn + tur sayisi ONCE hucreleri TABAN YOK (kanal JSON semasinda alan yok - ASLA uydurulmaz; operator olculmus tabani taslakta elle tamamlar).

## 4. Girdiler (iz surulebilirlik - degerler oldugu gibi, tahmin YOK)

- DalgaId: K0053-PILOT-1
- Commits: c2e26ce + 3b137dd + c24c883
- KanalJson: raporlar\kanit-hedef\son-kanit.json
- OnceKanalJson: raporlar\k0053-pilot-v8-02b-2026-10-29\once-kanit.json
- TurBas: 2026-10-29 08:55:12
- TurSon: 2026-10-29 09:19:45
- TurSon - TurBas (olculmus duvar suresi): 1473 sn
