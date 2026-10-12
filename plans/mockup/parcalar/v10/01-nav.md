# 01-nav — v10 Navigasyon Mimarisi Fragment'ı

Kapsam: rail + flyout panel iskeleti + aç/kapa/resize davranışı + panel→orta navigasyon köprüsü.
Kapsam dışı: panel içerik listelerinin detayı (bölüm sahibi fragment'lar), orta sekme/tabbar içi, sağ chat dock içeriği, composer.

Model: VS Code activity bar + sidebar. Rail yalnız flyout'u yönetir; orta sayfa açmak yalnız panel öğelerinin ve `ctx.ortaAc`'nin işidir.

## 1. Davranış Spec'i

1. Yerleşim: `.govde` grid `64px auto 1fr auto` = rail · flyout panel · orta · sağ chat dock. Panel kapalıyken `display:none` olduğundan `auto` iz 0'a çöker, orta tam genişler; layout shift yok.
2. Varsayılan durum: panel **KAPALI**, hiçbir rail öğesi aktif değil. Açılışta ortaya sekme koymak nav'ın işi değildir (entegratör/başka fragment karar verir).
3. Rail öğesine tıklamak **yalnız** o öğenin flyout bölümünü açar/kapatır; orta sayfa/sekme **açmaz**.
4. Aynı rail öğesine tekrar tık = paneli kapat. Panel açıkken farklı öğeye tık = bölümü değiştir, panel açık kalır (yeniden açılış animasyonu yok).
5. Panel açık kaldığı sürece ilgili rail öğesi `.aktif` görünür ve `aria-pressed="true"` taşır.
6. Flyout içindeki bir öğeye tıklayınca orta alanda sekme açılır. Nav yalnız `ctx.ortaAc(tur, params)` çağırır; **tek-örnek kuralı** (aynı `tur` zaten açıksa yenisini açma, mevcuda geç) orta fragment'ının sorumluluğundadır. Çok-örnekli türler (ör. görev detayı) için orta fragment `tur+params.id` anahtarıyla ayrıştırma yapabilir; nav buna karışmaz.
7. Panel→orta köprüsü **bildirimseldir**: bölüm sahibi öğesine `data-orta-tur="gorev" data-orta-params='{"id":"T1"}'` yazar; nav panelde delegated click ile yakalar. Ek event bağı yoktur, içerik sonradan değişse de çalışır.
8. Mobilde (≤880px) öğe seçimi orta sekmeyi açtıktan sonra drawer otomatik kapanır.
9. Resize: panelin sağ kenarındaki `.nav-handle` sürüklenir; genişlik **220–480px** arası kenetlenir; Pointer Events kullanılır (mouse + dokunmatik, `setPointerCapture`). Çift tık = 320px varsayılanına sıfırla. Seçilen genişlik bölüm değişiminde ve breakpoint geçişinde korunur.
10. Mobil kırılımda (≤880px) panel fixed drawer olur: soldan 180ms slide, `#backdrop` ile, genişlik `min(86vw, 320px)` sabit; `.nav-handle` gizlenir. Rail 52px'e daralır.
11. `ESC` tuşu, backdrop tıklaması ve header'daki kapat (×) butonu paneli kapatır. Backdrop ortak kaynak olduğundan gösteren taraf `backdrop.dataset.kaynak='nav'` yazar; nav yalnız kendi kaynağını kapatır.
12. Bölüm içeriği **lazy** dolar: kayıtlı doldurucu bölüm ilk açıldığında bir kez çalışır; `navApi.yenile(sekme)` zorla tazeler (veri değişiminde bölüm sahibi çağırır).
13. Doldurucu kaydedilmemiş bölüm açılırsa placeholder gösterilir ("Bu paneli X fragment'ı dolduracak") — fragment'lar bağımsız sırada geliştirilebilir.
14. Panel başlığı nav'ın `BASLIK` sözlüğünden gelir; bölüm sahibi yalnız kendi `.pgovde`'sini doldurur, isterse paylaşılan `#panelAksiyon` alanına bölüm-bazlı buton ekler (bölüm değişiminde nav bu alanı sıfırlar).
## 2. HTML Fragment'ı

```html
<!-- govde grid: rail | flyout | orta | sag dock -->
<div class="govde" id="govde">

  <nav class="rail" id="rail" aria-label="Ana gezinme"><!-- JS doldurur --></nav>

  <aside class="panel" id="panel" aria-hidden="true" aria-label="Flyout panel">
    <div class="nav-handle" id="navHandle" title="Genişliği ayarla (çift tık: sıfırla)"></div>
    <header class="pbaslik">
      <h2 id="panelBaslik"></h2>
      <div class="panel-aksiyon" id="panelAksiyon"><!-- bölüm sahibi aksiyonları --></div>
      <button class="panel-kapat" id="panelKapatBtn" aria-label="Paneli kapat">✕</button>
    </header>
    <!-- Konteynerler nav'a ait; içerik (.pgovde) bölüm sahibi fragment'ın -->
    <section class="pbolum" data-sekme="plan"><div class="pgovde"></div></section>
    <section class="pbolum" data-sekme="doktor"><div class="pgovde"></div></section>
    <section class="pbolum" data-sekme="orkestrasyon"><div class="pgovde"></div></section>
    <section class="pbolum" data-sekme="galeri"><div class="pgovde"></div></section>
    <section class="pbolum" data-sekme="dosyalar"><div class="pgovde"></div></section>
    <section class="pbolum" data-sekme="linkler"><div class="pgovde"></div></section>
    <section class="pbolum" data-sekme="dokumanlar"><div class="pgovde"></div></section>
  </aside>

  <div class="orta" id="orta">
    <div class="tabbar" id="tabbar"><!-- 02-orta fragment'ı --></div>
    <div class="icerik" id="icerik"><!-- 02-orta fragment'ı --></div>
    <!-- composer: kendi fragment'ı buraya monte edilir -->
  </div>

  <aside class="sagdock" id="sagDock"><!-- chat dock: kendi fragment'ı --></aside>
</div>
<div class="backdrop" id="backdrop"></div>
```
## 3. CSS Fragment'ı (yalnız nav)

```css
/* === v10 Nav: grid + rail + flyout panel === */
.govde{flex:1;display:grid;grid-template-columns:64px auto 1fr auto;min-height:0}

/* rail */
.rail{border-right:1px solid var(--sinir);display:flex;flex-direction:column;padding:10px 8px;gap:4px;overflow-y:auto}
.rail a{display:flex;flex-direction:column;align-items:center;gap:3px;padding:10px 2px;min-height:48px;color:var(--soluk);font-size:10.5px;font-weight:600;border-radius:12px;cursor:pointer;user-select:none}
.rail a:hover{color:var(--metin)}
.rail a.aktif{color:var(--metin);background:var(--kart2);box-shadow:inset 2px 0 0 var(--vurgu)}
.rail a svg{width:19px;height:19px}

/* flyout panel (varsayılan kapalı) */
.panel{display:none;width:320px;min-width:220px;max-width:480px;border-right:1px solid var(--sinir);overflow-y:auto;padding:0 18px 18px;position:relative;flex:0 0 auto}
.panel.acik{display:block}
.nav-handle{position:absolute;right:0;top:0;bottom:0;width:6px;cursor:col-resize;z-index:5;touch-action:none}
.nav-handle:hover,.nav-handle.tut{background:var(--vurgu)}
.pbaslik{display:flex;align-items:center;gap:8px;padding:16px 0 12px}
.pbaslik h2{font-size:14px;font-weight:800;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:0}
.panel-aksiyon{display:flex;align-items:center;gap:6px}
.panel-kapat{background:transparent;border:0;color:var(--soluk);cursor:pointer;font-size:13px;padding:6px 8px;border-radius:8px;line-height:1}
.panel-kapat:hover{color:var(--metin);background:var(--kart2)}
.pbolum{display:none}
.pbolum.acik{display:block}
.pbos{color:var(--soluk);font-size:12.5px;padding:14px 0}

/* panel→orta köprü öğeleri tıklanabilir görünür */
.pgovde [data-orta-tur]{cursor:pointer}

/* backdrop (nav + sağ dock ortak) */
.backdrop{position:fixed;inset:0;background:#000a;display:none;z-index:25}
.backdrop.goster{display:block}

/* orta + sağ dock iskeleti — içerik sahibi ilgili fragment; burada yalnız grid sağlığı */
.orta{display:flex;flex-direction:column;min-width:0;min-height:0}
.sagdock{border-left:1px solid var(--sinir);min-height:0}

@media (max-width:880px){
  .govde{grid-template-columns:52px 1fr}
  .rail{padding:8px 5px}
  .rail a{min-height:44px}
  .panel{display:block;position:fixed;left:52px;top:0;bottom:0;z-index:30;transform:translateX(-115%);transition:transform .18s ease;background:var(--bg);box-shadow:20px 0 60px #0008;width:min(86vw,320px);max-width:none}
  .panel.acik{transform:none}
  .nav-handle{display:none}
}
```
## 4. JS Fragment'ı

```js
/* === v10 Nav: rail + flyout panel + panel→orta köprüsü ===
   ctx = { ikon(ad):svgString, ortaAc(tur, params), VERI, panelDoldur?(sekme, govde, arac) }
   dönüş (navApi) = { railSec, panelKapat, yenile, doldurucuKaydet, acik } */
function initNav(ctx){
  var RAIL=[
    ['plan','Plan','list'],
    ['doktor','Doktor','pulse'],
    ['orkestrasyon','Orkestr.','graph'],
    ['galeri','Galeri','image'],
    ['dosyalar','Dosyalar','folder'],
    ['linkler','Linkler','link'],
    ['dokumanlar','Dökümanlar','doc']
  ];
  var BASLIK={
    plan:'Sprint planı',
    doktor:'Doktor — workspace sağlığı',
    orkestrasyon:'Orkestrasyon — görevler',
    galeri:'Galeri',
    dosyalar:'Dosyalar',
    linkler:'Linkler',
    dokumanlar:'Dökümanlar'
  };
  var PANEL_W=320, MIN_W=220, MAX_W=480;

  var rail=document.getElementById('rail'),
      panel=document.getElementById('panel'),
      handle=document.getElementById('navHandle'),
      backdrop=document.getElementById('backdrop'),
      baslik=document.getElementById('panelBaslik'),
      aksiyon=document.getElementById('panelAksiyon'),
      kapatBtn=document.getElementById('panelKapatBtn');

  var acikSekme=null, doldurucular={}, dolduruldu={};
  var mq=window.matchMedia('(max-width:880px)');
  function mobil(){ return mq.matches; }

  /* rail öğeleri (JS render) */
  RAIL.forEach(function(r){
    var a=document.createElement('a');
    a.dataset.p=r[0]; a.title=r[1];
    a.setAttribute('role','button'); a.setAttribute('aria-pressed','false');
    a.innerHTML=ctx.ikon(r[2])+'<span>'+r[1]+'</span>';
    a.addEventListener('click',function(){ railSec(r[0]); });
    rail.appendChild(a);
  });
  kapatBtn.addEventListener('click',panelKapat);

  function railEsitle(){
    rail.querySelectorAll('a').forEach(function(x){
      var on=(acikSekme===x.dataset.p);
      x.classList.toggle('aktif',on);
      x.setAttribute('aria-pressed',on?'true':'false');
    });
  }

  /* panelDoldur hook: önce kayıtlı doldurucu, yoksa ctx.panelDoldur, o da yoksa placeholder */
  function govdeDoldur(sekme){
    var govde=panel.querySelector('.pbolum[data-sekme="'+sekme+'"] .pgovde');
    aksiyon.innerHTML='';
    var fn=doldurucular[sekme]||ctx.panelDoldur;
    if(fn){ fn(sekme, govde, {ikon:ctx.ikon, ortaAc:ctx.ortaAc, VERI:ctx.VERI, aksiyon:aksiyon}); }
    else{ govde.innerHTML='<p class="pbos">Bu paneli <b>'+sekme+'</b> fragment\u2019ı dolduracak.</p>'; }
  }
  function doldurBirKere(sekme){
    if(dolduruldu[sekme]) return;
    dolduruldu[sekme]=true; govdeDoldur(sekme);
  }

  function backdropAc(){ backdrop.classList.add('goster'); backdrop.dataset.kaynak='nav'; }
  function backdropKapat(){
    if(backdrop.dataset.kaynak==='nav'){ backdrop.classList.remove('goster'); delete backdrop.dataset.kaynak; }
  }
  function railSec(p){
    if(acikSekme===p){ panelKapat(); return; }   /* aynı rail = kapat */
    acikSekme=p;
    panel.querySelectorAll('.pbolum').forEach(function(s){ s.classList.toggle('acik',s.dataset.sekme===p); });
    baslik.textContent=BASLIK[p]||p;
    panel.classList.add('acik'); panel.setAttribute('aria-hidden','false');
    if(mobil()){ backdropAc(); } else { panel.style.width=PANEL_W+'px'; }
    railEsitle();
    doldurBirKere(p);
  }

  function panelKapat(){
    if(!acikSekme) return;
    acikSekme=null;
    panel.classList.remove('acik'); panel.setAttribute('aria-hidden','true');
    backdropKapat();
    railEsitle();
  }

  /* panel→orta köprüsü: bildirimsel data öznitelikleri, delegated */
  panel.addEventListener('click',function(e){
    var t=e.target.closest('[data-orta-tur]');
    if(!t||!panel.contains(t)) return;
    var params={};
    try{ params=JSON.parse(t.dataset.ortaParams||'{}'); }catch(err){}
    ctx.ortaAc(t.dataset.ortaTur, params);
    if(mobil()) panelKapat();
  });

  /* resize: pointer events, 220–480 kenet, çift tık sıfırla */
  handle.addEventListener('pointerdown',function(e){
    e.preventDefault();
    handle.setPointerCapture(e.pointerId);
    handle.classList.add('tut');
    var startX=e.clientX, startW=panel.getBoundingClientRect().width;
    function hareket(ev){
      PANEL_W=Math.min(MAX_W,Math.max(MIN_W,startW+ev.clientX-startX));
      panel.style.width=PANEL_W+'px';
    }
    function birak(){
      handle.classList.remove('tut');
      handle.removeEventListener('pointermove',hareket);
      handle.removeEventListener('pointerup',birak);
      handle.removeEventListener('pointercancel',birak);
    }
    handle.addEventListener('pointermove',hareket);
    handle.addEventListener('pointerup',birak);
    handle.addEventListener('pointercancel',birak);
  });
  handle.addEventListener('dblclick',function(){ PANEL_W=320; if(!mobil()) panel.style.width='320px'; });

  /* ESC + backdrop tık */
  document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&acikSekme) panelKapat(); });
  backdrop.addEventListener('click',function(){ if(backdrop.dataset.kaynak==='nav') panelKapat(); });

  /* breakpoint geçişinde durumu koru */
  mq.addEventListener('change',function(){
    if(mobil()){
      panel.style.width='';
      if(acikSekme) backdropAc();
    }else{
      backdropKapat();
      if(acikSekme) panel.style.width=PANEL_W+'px';
    }
  });

  function yenile(sekme){
    sekme=sekme||acikSekme; if(!sekme) return;
    dolduruldu[sekme]=false; doldurBirKere(sekme);
  }
  function doldurucuKaydet(sekme,fn){ doldurucular[sekme]=fn; }

  return { railSec:railSec, panelKapat:panelKapat, yenile:yenile,
           doldurucuKaydet:doldurucuKaydet, acik:function(){ return acikSekme; } };
}

/* Kullanım (T — örnek):
   var nav=initNav({ ikon:ikon, ortaAc:ortaAc, VERI:VERI });
   nav.doldurucuKaydet('orkestrasyon', function(sekme, govde, arac){
     govde.innerHTML=arac.VERI.gorevler.map(function(g){
       return '<div class="satir" data-orta-tur="gorev" data-orta-params=\'{"id":"'+g.id+'"}\'>'+
              '<span>'+g.ad+'</span><b>'+g.durum+'</b></div>';
     }).join('');
   });
*/
```
## 5. Entegratör Notları

**Paylaşılan id/class sözleşmesi**

- `#govde` — grid kabı; orta/composer/chatdock fragment'ları bunun doğrudan çocuğu olarak monte edilir.
- `#rail` — yalnız nav render eder; başka fragment dokunmaz.
- `#panel`, `#panelBaslik`, `#panelAksiyon`, `#panelKapatBtn`, `#navHandle` — nav'a ait; bölüm sahibi yalnız `#panelAksiyon`'a buton ekleyebilir.
- `.pbolum[data-sekme]` × 7 — konteyner nav'dan, `.pgovde` içeriği bölüm sahibinden. Geçerli anahtarlar: `plan`, `doktor`, `orkestrasyon`, `galeri`, `dosyalar`, `linkler`, `dokumanlar`.
- `#backdrop` — nav + sağ dock ortak; gösteren taraf `dataset.kaynak` yazar (`'nav'`/`'sag'`), kapatan yalnız kendi kaynağını kaldırır.
- Durum sınıfları: `.rail a.aktif` · `.panel.acik` · `.pbolum.acik` · `.backdrop.goster` · `.nav-handle.tut`.
- Köprü öznitelikleri: `[data-orta-tur]` + `[data-orta-params]` (JSON) — tüm panel fragment'ları orta sekme açmak için bunu kullanır; doğrudan `ortaAc` çağırmak da serbesttir.

**Fonksiyon sözleşmesi**

- `initNav(ctx)` → `{ railSec, panelKapat, yenile, doldurucuKaydet, acik }`.
- `ctx.ikon(ad)` — ikon fragment'ından; `ctx.ortaAc(tur, params)` — 02-orta fragment'ından (tek-örnek dedupe onda); `ctx.VERI` — ortak veri sözlüğü; `ctx.panelDoldur(sekme, govde, arac)` opsiyonel genel fallback.
- `nav.doldurucuKaydet(sekme, fn)` — fn imzası `(sekme, govdeEl, arac)`; `arac = { ikon, ortaAc, VERI, aksiyon }`. Lazy çalıştığı için kayıtların panel açılmadan önce yapılması yeterlidir.
- `nav.yenile(sekme)` — veri değişince bölüm sahibi çağırır (ör. plan güncellendi).

**İkon ihtiyacı** — `list`, `pulse`, `graph`, `image`, `folder`, `doc` v9 `I{}` sözlüğünde var. Eksik (ikon fragment'ına eklenmeli):

```
link:S('<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>')
```

**Mount sırası** — HTML fragment'ı → nav CSS → (02-orta `ortaAc` hazır olduktan sonra) `initNav(ctx)` → bölüm sahiplerinin `doldurucuKaydet` çağrıları. Placeholder sayesinde eksik fragment mockup'ı bozmaz.

**Bilinen sınır** — Desktop panel aç/kapa `display` ile ani geçiş yapar (animasyon yok; bilinçli tercih: grid reflow + CLS yok). İstenirse `grid-template-columns` transition ile yumuşatılabilir; bu fragment dışına taşmadan `.govde` üzerinde yapılabilir.
