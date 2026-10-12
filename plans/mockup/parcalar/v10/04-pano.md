# 04 — Pano (orta sekme, one-view dashboard) · v10

## 1. Spec (kısa)

- **Konum:** Pano, sağ dock'tan taşınıp orta sayfanın **varsayılan sekmesi** olur (tam genişlik). v9'daki `.sbolum[data-sp="pano"]` içeriği bu fragment ile değişir; sağ dock sadeleşir.
- **Izgara:** Geniş ekranda 12-kolon grid hissi (`.span3/.span4/.span5/.span12`); ≤1200px'de kartlar yarım sıra (span 6), ≤880px'de 2 sütun yoğun dashboard.
- **Sıra:** Başlık satırı (workspace + sunucu chip + son güncelleme) → sağlık rozetleri (borç/drift/fake-green/hiza/uyum) → SES donut + SKS trend · LOC hızı · Bugün → Token · CWV · Süre → Borç/drift · Aktif ajanlar · Gelen kutu → 7g aktivite grafiği.
- **Sade:** Hero YOK, uyarı bandı YOK; emoji yok (mevcut `I{}` inline SVG); sistem fontu; veri odaklı.
- **Grafikler saf CSS:** conic-gradient `.donut`, flex `.cubuk` barları, mini `.pano-spark` çubukları.
- **Veri-odaklı:** Tüm metrikler tek `PANO` objesinden `initPano(ctx)` ile render edilir; template'ta yalnız `data-p` bağlama noktaları vardır (AI genişletmesi = veri kaydı).
- **CWV:** `content-visibility` + `contain-intrinsic-size` kartlarda; grafikler sabit yükseklikli → layout shift yok; dış istek yok.
- **Örnek veri (T):** Aşağıdaki tüm `PANO` değerleri temsilidir; işaret yalnız `.kaynak` satırında görünür.

## 2. HTML fragment

```html
<template id="tpl-pano">
  <div class="pano">
    <header class="pano-baslik">
      <h2 data-p="baslik"></h2>
      <span data-p="sunucu"></span>
      <span class="pano-guncelleme" data-p="guncelleme"></span>
    </header>
    <div class="rozet-serit" data-p="rozetler"></div>
    <div class="pano-grid">
      <section class="kart pkart span3">
        <h3>Sözleşme (SES)</h3>
        <div class="pano-yan">
          <div class="donut" data-p="donut" role="img"><b></b></div>
          <div class="pano-esnek">
            <div class="pano-etiket">SKS trend</div>
            <div class="buyuk" data-p="sks"></div>
            <div class="pano-spark" data-p="sksSpark"></div>
            <div class="pkalt" data-p="sksAlt"></div>
          </div>
        </div>
      </section>
      <section class="kart pkart span5">
        <h3>LOC hızı · 14 gün</h3>
        <div class="buyuk" data-p="locHiz"></div>
        <div class="cubuk pano-loc" data-p="locBar"></div>
      </section>
      <section class="kart pkart span4">
        <h3>Bugün</h3>
        <div class="pano-ist" data-p="bugun"></div>
        <div class="pkalt" data-p="bugunAlt"></div>
      </section>
      <section class="kart pkart span4">
        <h3>Token</h3>
        <div data-p="token"></div>
      </section>
      <section class="kart pkart span4">
        <h3>Web (CWV)</h3>
        <div class="pano-cwv" data-p="cwv"></div>
      </section>
      <section class="kart pkart span4">
        <h3>Süre</h3>
        <div class="buyuk" data-p="sure"></div>
        <div data-p="sureSatir"></div>
      </section>
      <section class="kart pkart span3">
        <h3>Borç / drift</h3>
        <div data-p="borc"></div>
      </section>
      <section class="kart pkart span5">
        <h3>Aktif ajanlar</h3>
        <div data-p="ajanlar"></div>
      </section>
      <section class="kart pkart span4">
        <h3>Gelen kutu</h3>
        <div data-p="gelen"></div>
      </section>
      <section class="kart pkart span12">
        <h3>Aktivite · son 7 gün</h3>
        <div class="cubuk pano-akt" data-p="aktBar"></div>
        <div class="pano-gun" data-p="aktGun"></div>
        <div class="pkalt" data-p="aktAlt"></div>
      </section>
    </div>
    <div class="kaynak">örnek veri (T) · pano v10</div>
  </div>
</template>
```
## 3. CSS eki

Mevcut `.kart / .pkart / .hap / .nokta / .psat / .pkalt / .cubuk / .donut / .rozet-serit / .buyuk / .kaynak` sınıflarını **yeniden kullanır**; aşağıdakiler pano-özel uzantılardır (mockup'ta `/* === 10.5 === */` bloğunun yanına `/* === 10.7 Pano orta sekme (v10) === */` olarak eklenir).

```css
/* === 10.7 Pano orta sekme (v10) === */
.pano{max-width:1240px;margin:0 auto;width:100%;display:flex;flex-direction:column;gap:14px}
.pano .kart{contain-intrinsic-size:auto 150px}
.pano .pkart{padding:14px}
.pano .psat{font-size:13px;padding:6px 0;gap:10px}
.pano .buyuk{font-size:26px}
.pano-baslik{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.pano-baslik h2{margin:0;font-size:20px;font-weight:800;letter-spacing:-0.01em}
.pano-guncelleme{margin-left:auto;font-size:12px;color:var(--soluk)}
.pano-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:12px}
.pano-grid>.kart{min-width:0}
.span3{grid-column:span 3}.span4{grid-column:span 4}.span5{grid-column:span 5}.span12{grid-column:span 12}
.pano .donut{width:92px;height:92px;margin:0;flex:0 0 auto}
.pano .donut b{width:70px;height:70px;font-size:24px}
.pano-yan{display:flex;align-items:center;gap:16px}
.pano-esnek{flex:1;min-width:0}
.pano-etiket{font-size:11px;color:var(--soluk);text-transform:uppercase;letter-spacing:.6px;font-weight:700}
.pano-spark{display:flex;align-items:flex-end;gap:3px;height:24px;margin-top:8px}
.pano-spark i{width:8px;background:linear-gradient(180deg,var(--vurgu2),var(--vurgu));border-radius:3px 3px 0 0;opacity:.85}
.pano-loc{height:56px;margin-top:12px}
.pano-ist{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center;margin-top:2px}
.pano-ist b{display:block;font-size:28px;font-weight:800;letter-spacing:-0.01em}
.pano-ist span{font-size:10.5px;color:var(--soluk);text-transform:uppercase;letter-spacing:.5px}
.pano-cwv{display:grid;grid-template-columns:1fr 1fr;gap:10px 8px}
.pano-cwv-hucre span{display:block;font-size:10.5px;color:var(--soluk);text-transform:uppercase;letter-spacing:.5px}
.pano-cwv-hucre b{font-size:20px;font-weight:800}
.pano-ajan svg,.pano-gelen-satir svg{width:13px;height:13px;color:var(--vurgu2);margin-right:5px}
.pano-gelen-satir>span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.pano-akt{height:72px}
.pano-gun{display:flex;gap:4px;margin-top:6px;font-size:10.5px;color:var(--soluk)}
.pano-gun span{flex:1;text-align:center}
@media (max-width:1200px){
  .span3,.span4,.span5{grid-column:span 6}
}
@media (max-width:880px){
  .pano-grid{grid-template-columns:repeat(2,1fr);gap:8px}
  .pano-grid>.kart{grid-column:auto}
  .pano-grid>.span12{grid-column:span 2}
  .pano .donut{width:72px;height:72px}
  .pano .donut b{width:54px;height:54px;font-size:19px}
  .pano-baslik h2{font-size:17px}
  .pano .buyuk{font-size:22px}
  .pano-ist b{font-size:23px}
}
```
## 4. JS — PANO verisi + initPano(ctx)

`PANO` örnek verisi (T) — canlıda Doktor/telemetry uçlarından beslenir; mockup'ta `VERI.pano` altına da taşınabilir.

```js
/* === Pano verisi (örnek — T) === */
const PANO={
  workspace:'speakrapid',
  sunucu:{durum:'ok',etiket:'sunucu :5050'},
  guncelleme:'2 dk önce',
  rozetler:[
    {metin:'borç: 0 TODO',tip:'ok'},
    {metin:'drift: core↔engines',tip:'uyari'},
    {metin:'fake-green: yok',tip:'ok'},
    {metin:'hiza: doc↔kod↔plan',tip:'ok'},
    {metin:'plugin uyum 92',tip:'ok'}
  ],
  ses:{skor:92,sksOnce:'6,95',sksSimdi:'7,3',trend:[6.2,6.5,6.4,6.8,6.95,7.1,7.3]},
  loc:{hiz:'+3,2k/g',gunler:[30,45,40,60,55,75,90,50,65,70,85,95,80,100]},
  bugun:{tur:33,kabul:61,ajan:2,not:'dün: 28 tur · %57 kabul'},
  token:{giris:'12,4M',cikis:'86k',cache:'96,4',istek:148},
  cwv:[
    {etiket:'Perf',deger:'93',tip:'ok'},
    {etiket:'SEO',deger:'100',tip:'ok'},
    {etiket:'LCP',deger:'2.9s',tip:'uyari'},
    {etiket:'CLS',deger:'0.02',tip:'ok'}
  ],
  sure:{toplam:'6s 12d',ortTur:'1s 48sn'},
  borc:{
    todo:{deger:'0',tip:'ok'},
    drift:{deger:'core↔eng',tip:'uyari'},
    fakeGreen:{deger:'yok',tip:'ok'}
  },
  ajanlar:[
    {rol:'coder',ad:'speakrapid',durum:'t12',tip:'ok'},
    {rol:'bekçi',ad:'filo',durum:'izliyor',tip:'notr'},
    {rol:'reviewer',ad:'ds',durum:'kuyrukta',tip:'notr'}
  ],
  gelenKutu:[
    {zaman:'09:30',kimden:'speakrapid',ozet:'S9 gerçek çağrı onayı bekliyor',oncelik:'yüksek'},
    {zaman:'08:12',kimden:'filo',ozet:'gece bekçisi raporu: anomali yok',oncelik:'normal'}
  ],
  aktivite:{gunler:['Çar','Per','Cum','Cmt','Paz','Pzt','Sal'],degerler:[18,22,9,26,31,12,33]}
};

/* === Pano render: initPano(ctx) — ctx={PANO, ikon, kok?} === */
function initPano(ctx){
  const P=ctx.PANO, ikon=ctx.ikon||function(){return '';};
  const kok=ctx.kok||document;
  const q=function(s){return kok.querySelector('[data-p="'+s+'"]');};
  if(!q('baslik'))return;
  const RENK={ok:'var(--yesil)',uyari:'var(--sari)',kotu:'var(--kirmizi)',notr:'var(--metin)'};
  const esc=function(s){return String(s).replace(/</g,'&lt;');};
  const satir=function(etiket,deger){return '<div class="psat"><span>'+etiket+'</span><b>'+deger+'</b></div>';};
  const satirHap=function(etiket,deger,tip){return '<div class="psat"><span>'+etiket+'</span><span class="hap '+tip+'">'+deger+'</span></div>';};
  const barlar=function(el,degerler,taban){
    const mx=Math.max.apply(null,degerler)||1;
    el.innerHTML=degerler.map(function(v){return '<i style="height:'+Math.max(taban,Math.round(v/mx*100))+'%" title="'+v+'"></i>';}).join('');
  };

  /* baslik + sunucu + guncelleme */
  q('baslik').textContent='Pano — '+P.workspace;
  q('sunucu').innerHTML='<span class="hap '+(P.sunucu.durum==='ok'?'ok':'kotu')+'"><span class="nokta"></span>'+esc(P.sunucu.etiket)+'</span>';
  q('guncelleme').textContent='son güncelleme: '+P.guncelleme;

  /* saglik rozetleri */
  q('rozetler').innerHTML=P.rozetler.map(function(r){return '<span class="hap '+r.tip+'">'+esc(r.metin)+'</span>';}).join('');

  /* SES donut + SKS trend */
  const donut=q('donut');
  donut.style.setProperty('--d',P.ses.skor);
  donut.setAttribute('aria-label','SES skoru '+P.ses.skor);
  donut.querySelector('b').textContent=P.ses.skor;
  q('sks').textContent=P.ses.sksSimdi;
  barlar(q('sksSpark'),P.ses.trend,15);
  q('sksAlt').textContent='SKS '+P.ses.sksOnce+' → '+P.ses.sksSimdi+' ↑';

  /* LOC hizi */
  q('locHiz').textContent=P.loc.hiz;
  barlar(q('locBar'),P.loc.gunler,6);

  /* Bugun */
  q('bugun').innerHTML=[['Tur',P.bugun.tur],['Kabul','%'+P.bugun.kabul],['Ajan',P.bugun.ajan]]
    .map(function(x){return '<div><b>'+x[1]+'</b><span>'+x[0]+'</span></div>';}).join('');
  q('bugunAlt').textContent=P.bugun.not;

  /* Token + CWV + Sure */
  q('token').innerHTML=satir('In / Out',P.token.giris+' / '+P.token.cikis)+satir('Cache-hit','%'+P.token.cache)+satir('İstek',P.token.istek);
  q('cwv').innerHTML=P.cwv.map(function(c){return '<div class="pano-cwv-hucre"><span>'+c.etiket+'</span><b style="color:'+RENK[c.tip]+'">'+c.deger+'</b></div>';}).join('');
  q('sure').textContent=P.sure.toplam;
  q('sureSatir').innerHTML=satir('Ort. tur',P.sure.ortTur);

  /* Borc / drift */
  q('borc').innerHTML=satirHap('TODO',P.borc.todo.deger,P.borc.todo.tip)+satirHap('Drift',P.borc.drift.deger,P.borc.drift.tip)+satirHap('Fake-green',P.borc.fakeGreen.deger,P.borc.fakeGreen.tip);

  /* Aktif ajanlar + gelen kutu */
  q('ajanlar').innerHTML=P.ajanlar.map(function(a){
    return '<div class="psat"><span class="pano-ajan">'+ikon('chip')+'['+esc(a.rol)+'] '+esc(a.ad)+'</span><span class="hap '+a.tip+'">'+esc(a.durum)+'</span></div>';
  }).join('');
  q('gelen').innerHTML=P.gelenKutu.length?P.gelenKutu.map(function(m){
    return '<div class="psat pano-gelen-satir"><span>'+ikon('chat')+m.zaman+' · <b>'+esc(m.kimden)+'</b> — '+esc(m.ozet)+'</span><span class="hap '+(m.oncelik==='yüksek'?'uyari':'notr')+'">'+esc(m.oncelik)+'</span></div>';
  }).join(''):'<div class="pkalt">kutu boş</div>';

  /* 7g aktivite */
  barlar(q('aktBar'),P.aktivite.degerler,6);
  q('aktGun').innerHTML=P.aktivite.gunler.map(function(g){return '<span>'+g+'</span>';}).join('');
  const toplam=P.aktivite.degerler.reduce(function(t,v){return t+v;},0);
  q('aktAlt').textContent='toplam '+toplam+' tur · ort '+Math.round(toplam/P.aktivite.degerler.length)+'/g';
}
```

## 5. Entegratör notları

- **TUR kaydı:** `TUR` sözlüğüne `pano:['grid','Pano','tpl-pano']` ekle; açılışta `sekmeAc('pano')` varsayılan sekme olsun (chat ikincil). Pano sekmesi kapatılamaz (x'siz) yapılmak istenirse `sekmeAc` içindeki `tur==='chat'` koşulu `tur==='chat'||tur==='pano'` olur.
- **init sırası:** `const id=sekmeAc('pano'); initPano({PANO:PANO, ikon:ikon, kok:sekmeler.get(id).yuzey});` — `kok` verilmezse `document` taranır (tek pano varsayımı).
- **Sağ dock temizliği:** `.sbolum[data-sp="pano"]` ve `SAG` listesindeki `['pano','grid','Pano']` kaydı kalkar; dock'un varsayılanı `akis` olur. Dock'taki 2-sütun `.pgrid` düzeni orta sayfada `.pano-grid`'e evrildi; `.pgrid` kuralı başka yüzey kullanmıyorsa budanabilir.
- **Yeniden kullanım:** Yeni ikon GEREKMEZ (`grid/chip/chat` mevcut). `PANO`, ileride `VERI.pano`'ya taşınıp `setInterval` ile tazelenebilir — o noktada tam render yerine yalnız değişen `data-p` düğümlerini güncelleyen hafif bir `panoTazele(ctx)` önerilir (mockup kapsamı dışı).
- **CWV:** Kartlar `content-visibility:auto` + `contain-intrinsic-size` ile ekran dışıyken boyanmaz; tüm grafikler (`pano-loc` 56px, `pano-akt` 72px, `pano-spark` 24px, donut 92px) sabit yükseklikli → CLS 0. Sistem fontu ve inline SVG korunur; dış istek yok.
- **Erişilebilirlik:** Donut `role="img"` + dinamik `aria-label`; barlarda `title` ipucu. Emoji yok; durum renkleri yalnız token'dan (`--yesil/--sari/--kirmizi`).