# 05-icerik.md — v10 İçerik Sekmeleri Fragment'ı

> Kapsam: **Galeri · Dosyalar · Linkler · Dökümanlar · Orkestrasyon** — panel listesi + orta sekme içeriği.
> Hedef mimari: rail → flyout panel; panel öğesi tıkla → orta sekme (tek-örnek), `ctx.ortaAc(tur)` ile açılır.
> Tema: koyu tokenlar (`--vurgu:#8b5cf6`), emoji yok (inline SVG), gövde 15px. Örnek veri: (T).
> Bağlam: `pano-mockup-2026-10-12.html` (v9) — `.galeri/.agac/.gorev/.dag` CSS'i ve `VERI.gorevler` şekli hazır.

---

## 1. Spec

| # | Bölüm | Panel listesi (flyout) | Orta sekme (tek-örnek) | Tık davranışı |
|---|---|---|---|---|
| 1 | Galeri | küçük thumbnail satırları (gradyan + ad + boyut) | büyük önizleme (üstte) + mockup PNG kart grid'i (gradyan placeholder + ad + tarih + boyut) | kart/thumb tık → aynı sekmede önizleme dolar |
| 2 | Dosyalar | kompakt ağaç (`.agac.kompakt`) | ağaç + dosya önizleme `pre` (`.dosyalar` grid) | dosya tık → `pre` dolar, satır `.sec` olur |
| 3 | Linkler | başlık + host satırları | globe SVG'li link kartları (başlık + URL + kısa not) + URL önizleme çerçevesi | kart tık → urlbar + çerçeve dolar |
| 4 | Dökümanlar | ad + tür satırları | doküman satırları (doc SVG + ad + tür + tarih + boyut) + okuma görünümü (tipografi odaklı, MD-benzeri) | satır tık → okuma dolar |
| 5 | Orkestrasyon | görev satırları T1–T4 (`VERI.gorevler`) | Görev detay sekmesi (`tpl-gorev`, 12 `data-f` alanı) | satır tık → detay dolar (v9 `gorevGoster` akışı) |

Etkileşim akışı (5 bölümde aynı): rail → flyout `.pbolum` → öğe tık → `ctx.ortaAc(tur)` (tek-örnek) → sekme ilk açılışta bir kez kurulur (`dataset.hazir`), sonra yalnız seçim/içerik güncellenir.

**ctx sözleşmesi:** `initIcerik(ctx)` · `ctx = { ikon, VERI, ortaAc, sekmeAc }`
- `ikon(ad)` → inline SVG string (v9 `I{}` sözlüğü: `image/folder/globe/doc/graph` mevcut).
- `VERI` → `gorevler` hazır; `galeri/dosyaAgaci/linkler/dokumanlar` bu fragment'ta (T) olarak eklenir (anahtar varsa ezilmez).
- `ortaAc(tur)` → tek-örnek orta sekme aç/odaklan; dönüş = sekme id (string) veya `{id}`.
- `sekmeAc(tur, baslik)` → v9 düşük-seviye açıcı; bu fragment kullanmaz (yedek).
- DOM varsayımı: `.yuzey[data-id]` (içerik) + `.tab[data-id]` (başlık güncelleme, savunmacı).

---

## 2. HTML fragment

### 2.1 Panel bölümleri — `#panel` içine

```html
<!-- === 05-icerik: panel bölümleri (flyout içerikleri JS ile dolar) === -->
<div class="pbolum" data-sekme="galeri">
  <h2>Galeri</h2>
  <div class="pliste" id="galeriPanel"></div>
</div>
<div class="pbolum" data-sekme="dosyalar">
  <h2>Dosyalar</h2>
  <div class="agac kompakt" id="dosyalarPanel"></div>
</div>
<div class="pbolum" data-sekme="linkler">
  <h2>Linkler</h2>
  <div class="pliste" id="linklerPanel"></div>
</div>
<div class="pbolum" data-sekme="dokumanlar">
  <h2>Dökümanlar</h2>
  <div class="pliste" id="dokumanlarPanel"></div>
</div>
<div class="pbolum" data-sekme="orkestrasyon">
  <h2>Orkestrasyon</h2>
  <div class="mini-metrik"><span>Perf <b>93</b></span><span>LCP <b style="color:var(--sari)">2.9s</b></span><span>CLS <b>0.02</b></span><span>SEO <b>100</b></span></div>
  <div class="gorev-grup">Görevler — detay için tıkla</div>
  <div id="orkestrasyonPanel"></div>
</div>
```

### 2.2 Templateler — `</body>` öncesi template bölgesine

```html
<!-- === 05-icerik: orta sekme templateleri === -->
<template id="tpl-galeri">
  <div class="gonizleme" data-f="gonizleme"><span data-f="gAd">Kart seç — büyük önizleme burada görünür</span></div>
  <div class="galeri" data-f="grid" style="margin-top:14px"></div>
</template>
<template id="tpl-dosyalar">
  <div class="dosyalar">
    <div class="agac" data-f="agac"></div>
    <pre data-f="pre">Ağaçtan dosya seç — önizleme burada görünür</pre>
  </div>
</template>
<template id="tpl-linkler">
  <div class="linkliste" data-f="liste"></div>
  <div class="urlbar" style="margin-top:14px"><input data-f="url" readonly value=""><button class="ikincil" type="button">Yenile</button></div>
  <div class="onizleme" data-f="cerceve">Link seç — URL önizleme çerçevesi burada</div>
</template>
<template id="tpl-dokumanlar">
  <div class="dokgrid">
    <div class="dokliste" data-f="liste"></div>
    <div class="kart okuma" data-f="okuma"><p>Satır seç — okuma görünümü burada</p></div>
  </div>
</template>
<!-- tpl-gorev: v9'daki ile aynı (mockup'ta mevcut) — self-containment için kopyası:
<template id="tpl-gorev">
  <h2><span data-f="ad">—</span> <span class="hap" data-f="durum">—</span></h2>
  <div class="kart" style="margin-bottom:14px">
    <div class="satir"><span>Rol / Model / Mod</span><b data-f="meta">—</b></div>
    <div class="satir"><span>Ajanlar</span><b data-f="ajanlar">—</b></div>
    <div class="satir"><span>Önceki (DAG)</span><b data-f="once">—</b></div>
    <div class="satir"><span>Sınır</span><b data-f="sinir">—</b></div>
    <div class="satir"><span>Dizin kapsamı</span><b data-f="dizin">—</b></div>
    <div class="satir"><span>İzin — oku</span><b data-f="izinOku">—</b></div>
    <div class="satir"><span>İzin — edit</span><b data-f="izinEdit">—</b></div>
    <div class="satir"><span>Son aktivite</span><b data-f="son">—</b></div>
    <div class="satir"><span>Kapanış kanıtı</span><b data-f="kanit">—</b></div>
  </div>
  <h2>Detay</h2>
  <div class="kart"><p data-f="detay" style="color:var(--soluk)">—</p></div>
</template>
-->
```

---

## 3. CSS eki — `<style>` sonuna

```css
/* === 05-icerik eki (v10) — mevcut sınıflarla çakışmaz === */
.pliste{display:flex;flex-direction:column;gap:6px}
.psatir{display:flex;align-items:center;gap:9px;padding:8px 10px;border:1px solid var(--sinir);border-radius:10px;background:var(--kart);color:var(--metin);cursor:pointer;font-family:inherit;font-size:12.5px;font-weight:600;width:100%;text-align:left;min-height:38px}
.psatir:hover{border-color:rgba(139,92,246,.4)}
.psatir svg{width:15px;height:15px;color:var(--soluk);flex:0 0 auto}
.psatir .pisim{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.psatir .pmeta2{color:var(--soluk);font-size:11px;font-weight:400;white-space:nowrap}
.pthumb{width:34px;height:24px;border-radius:6px;border:1px solid var(--sinir);flex:0 0 auto}
.agac.kompakt{padding:10px;font-size:12px}
.agac div.klasor{color:var(--metin);cursor:default;font-weight:700}
.agac div.sec{color:var(--metin);background:var(--kart2)}
.gonizleme{aspect-ratio:16/7;border-radius:var(--r);border:1px solid var(--sinir);display:flex;align-items:center;justify-content:center;background:var(--kart);color:var(--soluk);font-weight:700;font-size:14px;transition:background .18s ease}
.gonizleme.dolu{color:#0a0a10;font-size:17px;font-weight:800}
.gkart{background:var(--kart);border:1px solid var(--sinir);border-radius:14px;overflow:hidden;cursor:pointer;padding:0;text-align:left;font-family:inherit;min-height:0}
.gkart:hover{border-color:rgba(139,92,246,.4)}
.gkart .kare{border:0;border-radius:0}
.gkart .gmeta{padding:8px 11px;color:var(--metin);font-size:12.5px;font-weight:700}
.gkart .gmeta span{display:block;color:var(--soluk);font-size:11px;font-weight:400;margin-top:2px}
.linkliste{display:flex;flex-direction:column;gap:8px}
.linkkart{display:flex;gap:12px;align-items:flex-start;padding:12px 14px;background:var(--kart);border:1px solid var(--sinir);border-radius:12px;cursor:pointer;text-align:left;font-family:inherit;color:var(--metin);width:100%;font-size:13.5px;font-weight:400}
.linkkart:hover{border-color:rgba(139,92,246,.4)}
.likon{width:36px;height:36px;border-radius:10px;background:var(--kart2);border:1px solid var(--sinir);display:flex;align-items:center;justify-content:center;color:var(--vurgu2);flex:0 0 auto}
.likon svg{width:17px;height:17px}
.likon.buyuk{width:46px;height:46px}
.likon.buyuk svg{width:22px;height:22px}
.lgovde{min-width:0}
.lgovde b{font-size:13.5px}
.lurl{color:var(--vurgu2);font-size:12px;display:block;margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lnot{color:var(--soluk);font-size:12px;display:block;margin-top:3px}
.lcerceve{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;padding:20px}
.onizleme{min-height:220px}
.dokgrid{display:grid;grid-template-columns:290px 1fr;gap:14px;flex:1;min-height:0}
.dokliste{display:flex;flex-direction:column;gap:6px;overflow-y:auto;align-content:start}
.doksatir{display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--kart);border:1px solid var(--sinir);border-radius:10px;cursor:pointer;text-align:left;font-family:inherit;color:var(--metin);width:100%;font-size:13px;font-weight:400}
.doksatir:hover{border-color:rgba(139,92,246,.4)}
.doksatir.sec{border-color:var(--vurgu);background:var(--kart2)}
.doksatir>svg{width:16px;height:16px;color:var(--soluk);flex:0 0 auto}
.doksatir b{display:block;font-size:13px}
.dmeta{color:var(--soluk);font-size:11px;display:block;margin-top:2px}
.okuma{padding:22px 26px;overflow-y:auto}
.okuma h1{font-size:22px;font-weight:800;letter-spacing:-.01em;margin-bottom:12px}
.okuma h2{font-size:16px;font-weight:700;margin:18px 0 8px}
.okuma p{color:var(--soluk);font-size:14px;margin-bottom:10px}
.okuma code{background:var(--kart2);border:1px solid var(--sinir);border-radius:6px;padding:1px 6px;font-size:12.5px;color:var(--metin)}
.okuma pre{margin:10px 0}
@media (max-width:880px){.dokgrid{grid-template-columns:1fr}.gonizleme{aspect-ratio:16/9}}
```

---

## 4. JS — `initIcerik(ctx)` — `<script>` sonuna

```js
/* === 05-icerik: Galeri / Dosyalar / Linkler / Dokumanlar / Orkestrasyon ===
   ctx = { ikon, VERI, ortaAc, sekmeAc }
   ortaAc(tur): tek-ornek orta sekme ac/odaklan; donus = sekme id (string) ya da {id}. */
function initIcerik(ctx){
  const ikon=ctx.ikon, VERI=ctx.VERI;
  const DURUM_HAP={bitti:'ok',aktif:'ok',onay:'uyari',taslak:'notr',pasif:'notr'};

  /* --- ornek veri (T): yalniz anahtar yoksa eklenir --- */
  VERI.galeri=VERI.galeri||[
    {id:'G1',ad:'pano-v9-hero.png',tarih:'12 Eki 2026',boyut:'184 KB',g:['#8b5cf6','#a855f7'],etiket:'HERO'},
    {id:'G2',ad:'pano-v9-rail.png',tarih:'12 Eki 2026',boyut:'96 KB',g:['#312e81','#8b5cf6'],etiket:'RAIL'},
    {id:'G3',ad:'ork-dag-akis.png',tarih:'11 Eki 2026',boyut:'142 KB',g:['#0f766e','#34d399'],etiket:'DAG'},
    {id:'G4',ad:'composer-modlar.png',tarih:'11 Eki 2026',boyut:'88 KB',g:['#7c2d12','#fbbf24'],etiket:'MOD'},
    {id:'G5',ad:'doktor-rozetler.png',tarih:'10 Eki 2026',boyut:'121 KB',g:['#1e3a8a','#38bdf8'],etiket:'SES'},
    {id:'G6',ad:'plan-akordiyon.png',tarih:'10 Eki 2026',boyut:'103 KB',g:['#4a044e','#e879f9'],etiket:'PLAN'}
  ];
  VERI.dosyaAgaci=VERI.dosyaAgaci||{ad:'paseo-verimlilik',cocuk:[
    {ad:'server',cocuk:[
      {ad:'modlar.ts',icerik:'export const MODLAR: Record<ModAd, Mod> = {\n  atolye: { thinking: "ultra", paralellik: 6 },\n  matbaa: { istek: "bazli" },\n  cerrah: { token: "bazli" },\n  serbest: {}\n};'},
      {ad:'telemetry.ts',icerik:'export function turKaydi(t: Tur){\n  // model + token + sure tek satirda\n  defter.yaz(t);\n}'},
      {ad:'bekci.ts',icerik:'export function kotaKontrol(g: Gorev){\n  if (g.token > g.tavan) throw new Error("tavan asimi");\n}'}
    ]},
    {ad:'client',cocuk:[
      {ad:'panel.tsx',icerik:'// panel koku (T)\nexport function Panel(){ /* ... */ }'}
    ]},
    {ad:'shared',cocuk:[
      {ad:'tip.ts',icerik:'export type ModAd = "atolye" | "matbaa" | "cerrah" | "serbest";'}
    ]},
    {ad:'test',cocuk:[
      {ad:'dedektor.test.ts',icerik:'test("fake-green yakalanir", () => { /* ... */ });\n// 196 test gecti'}
    ]}
  ]};
  VERI.linkler=VERI.linkler||[
    {id:'L1',baslik:'Paseo dokumani — workspace modeli',url:'https://paseo.sh/docs/workspaces',not:'Rail + panel + orta sekme uclusunun referansi.'},
    {id:'L2',baslik:'Core Web Vitals esikleri',url:'https://web.dev/articles/vitals',not:'LCP 2.5s / CLS 0.1 hedefleri buradan.'},
    {id:'L3',baslik:'Veo BYOK API notlari',url:'https://ai.google.dev/gemini-api/docs/video',not:'S9 gorevinin cagri semasi; kota bekcisi bolumu onemli.'},
    {id:'L4',baslik:'template etiketi — MDN',url:'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template',not:'<template> klonlama — sekmeAc buna dayaniyor.'}
  ];
  VERI.dokumanlar=VERI.dokumanlar||[
    {id:'D1',ad:'ANAYASA.md',tur:'MD',tarih:'12 Eki 2026',boyut:'8,2 KB',govde:'# ANAYASA\n\nUst otorite — tum fermanlar ve sozlesmeler buraya dayanir.\n\n## Madde 1 · Kanit\n\nHer iddia etiketli yazilir: `(R)` resmi olcum, `(T)` tahmin, `*` tek-kaynak.\n\n## Madde 2 · Sinir\n\nAjan, dizin kapsami disina yazamaz; sinir asimi turu kapatir.'},
    {id:'D2',ad:'PASEO-VERIMLILIK-REHBERI-v2.0.md',tur:'MD',tarih:'11 Eki 2026',boyut:'21,4 KB',govde:'# Verimlilik Rehberi v2.0\n\nBaglayici sozlesme — rol, mod ve kanit disiplini.\n\n## Akis\n\n1. Emir yaz → sema kapisi\n2. Manager dagitir → DAG\n3. Kapanis kaniti → `raporlar/`'},
    {id:'D3',ad:'S9-kapanis-raporu.md',tur:'MD',tarih:'12 Eki 2026',boyut:'3,1 KB',govde:'# S9 kapanis raporu (taslak)\n\nDurum: `onay` bekleniyor.\n\n~~~\nkota: 340k/500k\nsonuc: BYOK cagrisi OK (T)\n~~~\n\nKanit dizini: `raporlar/s9/`'},
    {id:'D4',ad:'emir-S11.json',tur:'JSON',tarih:'10 Eki 2026',boyut:'1,2 KB',govde:'# emir-S11.json\n\nMakine-okunur emir — sema kapisindan gecer.\n\n~~~\n{ "gorevler": [ { "id": "T3", "rol": "planlayici" } ] }\n~~~'}
  ];

  /* --- ortak yardimcilar --- */
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');}
  function sekmeId(r){return (typeof r==='string')?r:(r&&(r.id||r.sid));}
  function yuzeyAl(tur){
    const id=sekmeId(ctx.ortaAc(tur));
    return id?document.querySelector('.yuzey[data-id="'+id+'"]'):null;
  }
  function sekmeBaslik(id,metin){
    const t=document.querySelector('.tab[data-id="'+id+'"]');
    if(t&&t.childNodes[1])t.childNodes[1].textContent=metin;
  }

  /* === 1. Galeri === */
  function galeriPanelYaz(){
    const k=document.getElementById('galeriPanel');if(!k)return;k.innerHTML='';
    VERI.galeri.forEach(function(g){
      const b=document.createElement('button');b.type='button';b.className='psatir';
      b.innerHTML='<span class="pthumb" style="background:linear-gradient(135deg,'+g.g[0]+','+g.g[1]+')"></span><span class="pisim">'+esc(g.ad)+'</span><span class="pmeta2">'+g.boyut+'</span>';
      b.addEventListener('click',function(){galeriGoster(g.id);});
      k.appendChild(b);
    });
  }
  function galeriSekmeHazir(y){
    if(y.dataset.hazir)return;y.dataset.hazir='1';
    const grid=y.querySelector('[data-f="grid"]');
    VERI.galeri.forEach(function(g){
      const k=document.createElement('button');k.type='button';k.className='gkart';
      k.innerHTML='<div class="kare" style="background:linear-gradient(135deg,'+g.g[0]+','+g.g[1]+')">'+esc(g.etiket)+'</div><div class="gmeta">'+esc(g.ad)+'<span>'+g.tarih+' · '+g.boyut+'</span></div>';
      k.addEventListener('click',function(){galeriGoster(g.id);});
      grid.appendChild(k);
    });
  }
  function galeriGoster(id){
    const g=VERI.galeri.find(function(x){return x.id===id;});if(!g)return;
    const y=yuzeyAl('galeri');if(!y)return;
    galeriSekmeHazir(y);
    const on=y.querySelector('[data-f="gonizleme"]');
    on.style.background='linear-gradient(135deg,'+g.g[0]+','+g.g[1]+')';
    on.classList.add('dolu');
    on.querySelector('[data-f="gAd"]').textContent=g.ad+' — '+g.tarih+' · '+g.boyut;
  }

  /* === 2. Dosyalar === */
  function agacSatirlar(cocuklar,onek){
    let out=[];
    cocuklar.forEach(function(n,i){
      const son=(i===cocuklar.length-1), dal=son?'└─ ':'├─ ';
      out.push({n:n,yazi:onek+dal+n.ad+(n.cocuk?'/':'')});
      if(n.cocuk)out=out.concat(agacSatirlar(n.cocuk,onek+(son?'   ':'│  ')));
    });
    return out;
  }
  function agacDoldur(k,kok,onSec){
    const b=document.createElement('b');b.style.color='var(--metin)';b.textContent=kok.ad+'/';k.appendChild(b);
    agacSatirlar(kok.cocuk||[],'').forEach(function(s){
      const d=document.createElement('div');
      d.textContent=s.yazi;
      if(s.n.cocuk){d.className='klasor';}
      else{d.dataset.dosya='1';d._n=s.n;d.addEventListener('click',function(){onSec(s.n);});}
      k.appendChild(d);
    });
  }
  function dosyaSekmeHazir(y){
    if(y.dataset.hazir)return;y.dataset.hazir='1';
    agacDoldur(y.querySelector('[data-f="agac"]'),VERI.dosyaAgaci,dosyaSec);
  }
  function dosyaSec(n){
    const y=yuzeyAl('dosyalar');if(!y)return;
    dosyaSekmeHazir(y);
    y.querySelector('[data-f="pre"]').textContent=n.icerik||'(bos)';
    document.querySelectorAll('.agac div[data-dosya]').forEach(function(d){d.classList.toggle('sec',d._n===n);});
  }

  /* === 3. Linkler === */
  function linkHost(u){return u.replace(/^https?:\/\//,'').split('/')[0];}
  function linklerPanelYaz(){
    const k=document.getElementById('linklerPanel');if(!k)return;k.innerHTML='';
    VERI.linkler.forEach(function(l){
      const b=document.createElement('button');b.type='button';b.className='psatir';
      b.innerHTML=ikon('globe')+'<span class="pisim">'+esc(l.baslik)+'</span><span class="pmeta2">'+linkHost(l.url)+'</span>';
      b.addEventListener('click',function(){linkGoster(l.id);});
      k.appendChild(b);
    });
  }
  function linkSekmeHazir(y){
    if(y.dataset.hazir)return;y.dataset.hazir='1';
    const k=y.querySelector('[data-f="liste"]');
    VERI.linkler.forEach(function(l){
      const b=document.createElement('button');b.type='button';b.className='linkkart';
      b.innerHTML='<span class="likon">'+ikon('globe')+'</span><span class="lgovde"><b>'+esc(l.baslik)+'</b><span class="lurl">'+esc(l.url)+'</span><span class="lnot">'+esc(l.not)+'</span></span>';
      b.addEventListener('click',function(){linkGoster(l.id);});
      k.appendChild(b);
    });
  }
  function linkGoster(id){
    const l=VERI.linkler.find(function(x){return x.id===id;});if(!l)return;
    const y=yuzeyAl('linkler');if(!y)return;
    linkSekmeHazir(y);
    y.querySelector('[data-f="url"]').value=l.url;
    y.querySelector('[data-f="cerceve"]').innerHTML='<div class="lcerceve"><span class="likon buyuk">'+ikon('globe')+'</span><b>'+esc(l.baslik)+'</b><span class="lurl">'+esc(l.url)+'</span><span class="lnot">iframe onizlemesi — canlida burada yuklenir (T)</span></div>';
  }

  /* === 4. Dokumanlar === */
  function mdYaz(md){
    return md.trim().split(/\n{2,}/).map(function(b){
      if(b.indexOf('# ')===0)return '<h1>'+esc(b.slice(2))+'</h1>';
      if(b.indexOf('## ')===0)return '<h2>'+esc(b.slice(3))+'</h2>';
      if(b.indexOf('~~~')===0)return '<pre>'+esc(b.replace(/^~~~\n?/,'').replace(/~~~$/,''))+'</pre>';
      return '<p>'+esc(b).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\n/g,'<br>')+'</p>';
    }).join('');
  }
  function dokumanlarPanelYaz(){
    const k=document.getElementById('dokumanlarPanel');if(!k)return;k.innerHTML='';
    VERI.dokumanlar.forEach(function(d){
      const b=document.createElement('button');b.type='button';b.className='psatir';
      b.innerHTML=ikon('doc')+'<span class="pisim">'+esc(d.ad)+'</span><span class="pmeta2">'+d.tur+'</span>';
      b.addEventListener('click',function(){dokGoster(d.id);});
      k.appendChild(b);
    });
  }
  function dokSekmeHazir(y){
    if(y.dataset.hazir)return;y.dataset.hazir='1';
    const k=y.querySelector('[data-f="liste"]');
    VERI.dokumanlar.forEach(function(d){
      const b=document.createElement('button');b.type='button';b.className='doksatir';
      b.innerHTML=ikon('doc')+'<span class="dgovde"><b>'+esc(d.ad)+'</b><span class="dmeta">'+d.tur+' · '+d.tarih+' · '+d.boyut+'</span></span>';
      b._d=d;
      b.addEventListener('click',function(){dokGoster(d.id);});
      k.appendChild(b);
    });
  }
  function dokGoster(id){
    const d=VERI.dokumanlar.find(function(x){return x.id===id;});if(!d)return;
    const y=yuzeyAl('dokumanlar');if(!y)return;
    dokSekmeHazir(y);
    y.querySelectorAll('.doksatir').forEach(function(s){s.classList.toggle('sec',s._d===d);});
    y.querySelector('[data-f="okuma"]').innerHTML=mdYaz(d.govde);
  }

  /* === 5. Orkestrasyon (VERI.gorevler T1-T4) === */
  function orkPanelYaz(){
    const k=document.getElementById('orkestrasyonPanel');if(!k)return;k.innerHTML='';
    VERI.gorevler.forEach(function(g){
      const d=document.createElement('button');d.type='button';d.className='gorev gsatir';
      d.innerHTML='<div class="ust"><b><span class="pid">'+g.id+'</span> · '+esc(g.ad)+'</b><span class="hap '+(DURUM_HAP[g.durum]||'notr')+'">'+g.durum+'</span></div><div class="alt">'+g.rol+' · '+g.model+' · '+g.mod+' · '+g.son+'</div>';
      d.addEventListener('click',function(){gorevGoster(g.id);});
      k.appendChild(d);
    });
  }
  function gorevGoster(id){
    const g=VERI.gorevler.find(function(x){return x.id===id;});if(!g)return;
    const sid=sekmeId(ctx.ortaAc('gorev'));
    const y=sid?document.querySelector('.yuzey[data-id="'+sid+'"]'):null;if(!y)return;
    const yaz=function(a,v){const e=y.querySelector('[data-f="'+a+'"]');if(e)e.textContent=v;};
    yaz('ad',g.ad);
    const d=y.querySelector('[data-f="durum"]');
    if(d){d.textContent=g.durum;d.className='hap '+(DURUM_HAP[g.durum]||'notr');}
    yaz('meta',g.rol+' · '+g.model+' · '+g.mod);
    yaz('ajanlar',g.ajanlar||'—');yaz('once',g.once||'—');yaz('sinir',g.sinir||'—');
    yaz('dizin',g.dizin||'—');yaz('izinOku',g.izinOku||'—');yaz('izinEdit',g.izinEdit||'—');
    yaz('son',g.son||'—');yaz('kanit',g.kanit||'—');yaz('detay',g.detay||'—');
    sekmeBaslik(sid,g.id+' · '+g.ad.split('·')[0].trim());
  }

  /* === init: 5 panel listesi === */
  galeriPanelYaz();linklerPanelYaz();dokumanlarPanelYaz();orkPanelYaz();
  const dp=document.getElementById('dosyalarPanel');
  if(dp){dp.innerHTML='';agacDoldur(dp,VERI.dosyaAgaci,dosyaSec);}

  /* capraz-acilis API'si (baska fragment'lar kullanabilir) */
  return {gorevGoster:gorevGoster,galeriGoster:galeriGoster,dosyaSec:dosyaSec,linkGoster:linkGoster,dokGoster:dokGoster};
}
```

---

## 5. Entegratör notları

1. **Panel:** 5 `.pbolum` `#panel` içine. v9'daki `galeri` (filtre) ve `orkestrasyon` (`#gorevListe`) pbolumları bunlarla **değişir**; `dosyalar/linkler/dokumanlar` yeni eklenir.
2. **RAIL:** `['dosyalar','Dosyalar','folder']`, `['linkler','Linkler','globe']`, `['dokumanlar','Dökümanlar','doc']` ekle — `galeri`/`orkestrasyon` mevcut (ikonlar v9 `I{}`'den).
3. **TUR kayıtları:** `galeri:['image','Galeri','tpl-galeri']`, `linkler:['globe','Linkler','tpl-linkler']`, `dokumanlar:['doc','Dökümanlar','tpl-dokumanlar']` ekle; `dosyalar` ve `gorev` mevcut kayıtlar aynen kalır.
4. **Templateler:** `tpl-dosyalar` v9'daki statik sürümün **yerine** geçer; `tpl-gorev` v9'dakiyle birebir aynı — varsa tekrar ekleme (yukarıda yorum olarak kopyalı).
5. **Çağrı sırası:** sekme yöneticisi + `TUR` hazır olduktan sonra `initIcerik({ikon:ikon, VERI:VERI, ortaAc:ortaAc, sekmeAc:sekmeAc})`. v9'daki `gorevListesiYaz()` çağrısı kaldırılır (işi `orkPanelYaz` devralır).
6. **ctx varyansı:** `ortaAc(tur)` dönüşü string id veya `{id}` olabilir — `sekmeId()` her ikisini karşılar. `sekmeAc` bu fragment'ta kullanılmaz (yedek kontrakt).
7. **Veri:** örnek anahtarlar (T) — `VERI.galeri` (6 kart), `VERI.dosyaAgaci` (4 klasör / 6 dosya), `VERI.linkler` (4), `VERI.dokumanlar` (4); anahtar zaten doluysa ezilmez. Görevler hazır `VERI.gorevler`'den (T1–T4) okunur.
8. **CSS:** tüm sınıflar yeni (`.pliste/.psatir/.pthumb/.pisim/.pmeta2/.gonizleme/.gkart/.gmeta/.linkliste/.linkkart/.likon/.lgovde/.lurl/.lnot/.lcerceve/.dokgrid/.dokliste/.doksatir/.dmeta/.okuma`); tek eklemeli override `.onizleme{min-height:220px}` ve `.agac` varyantları (`.kompakt/.klasor/.sec`).
9. **Idempotensi:** sekme içi kurulum `dataset.hazir` bayrağıyla tek seferlik; panel listeleri her init'te sıfırdan yazılır. Dosya seçimi hem panel hem sekme ağacında `.sec` olarak işaretlenir (`d._n` kimliğiyle).
10. **Dönüş API'si:** `{gorevGoster, galeriGoster, dosyaSec, linkGoster, dokGoster}` — örn. Emir fragment'ı `gorevGoster('T1')` ile çapraz açılış yapabilir.
11. **Repo kuralı (AGENTS.md):** birleştirme sonrası `scripts\codemap.ps1` çalıştır, `scripts\saglik.ps1` yeşil kalmalı. (Bu fragment yalnız kendi dosyasını yazar; mockup düzenlenmez.)