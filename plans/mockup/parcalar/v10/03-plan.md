# 03 · Plan Görünümleri — v10 fragment'ı

Hedef: `plans/mockup/pano-mockup-2026-10-12.html` (v9 ara durum → v10) · Parça sırası: 03
Bağımlılık: 00-core (`VERI`, `DURUM_HAP`, `ikon`, sekme motoru, `ctx.ortaAc`) · Tüketen: 02-chat (`ctx.planKomut`)
Kapsam dışı: mockup dosyasını düzenlemek (bu parça yalnız spec + yapıştırılabilir blok üretir).

---

## 1. Spec

### 1.1 Mimarî

```
rail "Plan" ──> flyout panel (.pbolum[data-sekme="plan"])   hızlı liste · akordiyon · inline edit
panel satırı .pid tık ──> ctx.ortaAc('plan')                orta sekme: tam görünüm + öğeye odak
composer "plan: ..." ──> ctx.planKomut(islem)               VERI güncelle + iki görünüm tazele + chat yanıtı
```

Tek gerçek kaynak `VERI.planlar` + `VERI.dag`; üç temsil (Tablo/MD/JSON) dahil her görünüm aynı veriden üretilir. Örnek veriler (T).

### 1.2 Veri şekli (v9'dan aynen)

```js
VERI.planlar = [{ id:'F-H', ad, durum, acik?, sprintler:[
  { id:'S8', ad, durum, acik?, loc?, alt:[
    { id:'S8.1', ad, durum, tamam:65, loc:'~800', dalga:2, bag:'S8.1' } ] } ] }]
VERI.dag = [['S7','S8'],['S8','S9'],...]
DURUM_HAP = { bitti:'ok', aktif:'ok', onay:'uyari', taslak:'notr', pasif:'notr' }
```

Türetmeler (VERI'ya yazılmaz): faz/sprint `%tamam` = çocuk ortalaması (`tamamHesapla`, v9 ile aynı); kendi `loc`u olmayan düğümde LOC = çocuklardan toplam (`locTopla`: `~800`→800, `+1,2k`→1200).

### 1.3 Etkileşim haritası

| Nerede | Ne | Sonuç |
|---|---|---|
| Panel · faz/sprint gövdesi | tık | akordiyon aç/kapa; `acik` VERI'da saklanır (yeniden çizimde korunur) |
| Panel · her satırın `.pid`'i | tık | `ctx.ortaAc('plan')` + tabloda `scrollIntoView` + flaş vurgu |
| Panel · yaprak `.pad` | tık | inline edit (Enter/blur kaydet · Esc iptal) → VERI + iki görünüm tazele |
| Orta · DAG düğümü | tık | tabloda odakla (ID tabloda yoksa sessiz no-op) |
| Orta · temsil segmenti | tık | Tablo / MD / JSON geçişi; tercih sekme kapanıp açılsa da korunur |
| Composer | `plan: <id> <alan> <değer>` | VERI güncelle + iki görünüm tazele + sonuç metni (chat balonu) |

Çakışma çözümü: yaprak satırda **ad = inline edit**, **ID = ortada aç**. Tek tık iki işe atanmaz.

### 1.4 planKomut sözdizimi

```
plan: <id> <alan> <değer>      alan: durum | tamam | loc | ad   (ad boşluk içerebilir)
```

| Örnek (T) | Dönen metin |
|---|---|
| `plan: S8.2 tamam 80` | `S8.2 · tamam %65 → %80` |
| `plan: S8.2 tamam 100` | `… %65 → %100 · kapatmak için: "plan: S8.2 durum bitti"` |
| `plan: S9.1 durum aktif` | `S9.1 · durum taslak → aktif` |
| `plan: S8.3 loc ~500` | `S8.3 · loc ~400 → ~500` |
| `plan: S8.2 ad Emir şema doğrulayıcı` | `S8.2 · ad "Emir doğrulayıcı" → "Emir şema doğrulayıcı"` |
| `plan: S8 tamam 50` | reddedilir: sprint'te %tamam türetilir → yaprak ID önerisi (`S8.1`) |
| `plan: X1 tamam 10` | `ID bulunamadı: X1 — …` |
| `plan: S8.2 durum yoq` | geçerli durum listesiyle hata |
| `plan: ?` / boş | kullanım metni |

Kurallar: `tamam` 0–100'e kenetlenir; faz/sprint'te (çocuğu olan) `tamam` reddedilir; `durum` her seviyede serbest (kaskad yok).

### 1.5 v9'dan düzeltilenler

1. `yaprakSatir` içindeki `planFullYaz()` çağrısı tanımsızdı → inline edit kaydı ReferenceError verirdi; fragment tanımlar.
2. Akordiyon aç/kapa VERI'daki `acik`'a yazılmıyordu → edit sonrası yeniden çizimde açık gruplar kapanıyordu; artık senkron.
3. Altsız sprint'ler sarmalayıcı nesneye kopyalanıyordu → ad düzenleme VERI'ya işlemiyordu; artık doğrudan VERI düğümü normalize edilip kullanılır.
4. `.pbar`/`.fbar` inline `<span>`'a uygulanıyordu → `height` etkisiz, bar görünmüyordu; CSS ekine `display:block` kondu.

---

## 2. HTML fragment

Panel bölümü v9 ile birebir aynı (değişiklik yok, referans için):

```html
<!-- Sol flyout panel · plan bölümü -->
<div class="pbolum" data-sekme="plan">
  <h2>Sprint planı</h2>
  <div class="ptablo" id="planListe"></div>
</div>
```

`tpl-plan` template'i (v9'daki id'ler korunur; tek fark: inline `margin-bottom`/`max-height` CSS'e taşındı):

```html
<template id="tpl-plan">
  <h2>Plan — tam görünüm</h2>
  <div class="kart" style="margin-bottom:14px">
    <h3>DAG — bağımlılık zincirleri</h3>
    <div class="dag" id="dagSerit"></div>
  </div>
  <div class="mod-serit" id="temsilSec"></div>
  <div class="kart fwrap" id="planTabloKart"><div class="fview" id="planFull"></div></div>
  <pre id="planTemsil" style="display:none"></pre>
</template>
```

---

## 3. CSS eki

Aşağıdakiler **yeni** kurallar; v9'daki `.ptablo/.prow/.psprint/.psub/.palt/.phead/.pid/.pcol/.pmeta/.ped/.dalga/.chev/.pfaz/.pd1/.pd2` ve `.fwrap/.frow/.fhead/.ffaz/.fs1/.fs2/.fyuzde/.dag/.dugum/.ok-imb` blokları **yeniden tanımlanmaz**.

```css
/* === 10.7 Plan v10 eki === */
.pbar,.fbar{display:block}                 /* düzeltme: inline span'da height etkisizdi, bar görünmüyordu */
.ptablo .pid{cursor:pointer}
.ptablo .pid:hover{color:var(--vurgu2);text-decoration:underline}
.frow .dalga{margin-left:0}                /* tablo hücresinde 6px sol boşluk hizayı bozuyordu */
.frow.odak{animation:planOdak 1.6s ease-out}
@keyframes planOdak{0%{box-shadow:inset 0 0 0 2px var(--vurgu);background:rgba(139,92,246,.14)}100%{box-shadow:inset 0 0 0 0 transparent;background:transparent}}
.dag .dugum{cursor:pointer}
.dag .dugum:hover{border-color:var(--vurgu)}
#temsilSec{align-self:flex-start;margin-bottom:10px}
#planTemsil{margin:0;max-height:420px;min-height:120px}
```

Çakışma notları:

- `.pbar`/`.fbar`: v9 tanımına yalnız `display:block` eklenir (§1.5.4); başka kullanıcı yok.
- `.pid`: genel tanıma dokunulmaz; tıklanabilirlik yalnız `.ptablo` kapsamına verilir (`.gsatir` içindeki `.pid`'ler zaten satır düğmesinin parçası).
- `.dalga`: paneldeki `margin-left:6px` korunur; sıfırlama yalnız `.frow` altında.
- `#planTemsil`: taban `pre` stili (mono/yeşil) korunur; `display` JS tarafından yönetilir, CSS karışmaz.

---

## 4. JS — initPlan(ctx)

`ctx = { ikon, VERI, DURUM_HAP, ortaAc }`. Script body sonunda, core'dan sonra bir kez çağrılır. v9'daki global `tamamHesapla / akorSatir / yaprakSatir / planYaz()` bloğu ve `planYaz();` çağrısı silinip yerine bu fonksiyon konur.

```js
/* === 10.7 Plan v10: panel listesi + orta tam görünüm + planKomut === */
function initPlan(ctx){
  const VERI=ctx.VERI, DURUM_HAP=ctx.DURUM_HAP;
  let planYuzey=null;    // açık orta Plan sekmesinin kökü; kapanırsa isConnected=false olur
  let temsil='tablo';    // tablo | md | json — sekme kapanıp açılsa da korunur

  /* --- türetme yardımcıları --- */
  function tamamHesapla(o){
    if(o.alt&&o.alt.length)return Math.round(o.alt.reduce(function(t,x){return t+(x.tamam||0);},0)/o.alt.length);
    if(o.sprintler&&o.sprintler.length){const s=o.sprintler.map(tamamHesapla);return Math.round(s.reduce(function(a,b){return a+b;},0)/s.length);}
    return o.tamam||0;
  }
  function locSayi(s){ /* '~800'→800 · '+1,2k'→1200 · '+18,4k'→18400 */
    if(!s)return 0;
    const m=(''+s).replace(',','.').match(/([\d.]+)\s*(k)?/i);
    if(!m)return 0;
    return Math.round(parseFloat(m[1])*(m[2]?1000:1));
  }
  function locTopla(o){ /* kendi loc'u yoksa çocuklardan türet (yalnız görünüm; VERI'ya yazılmaz) */
    if(o.loc)return o.loc;
    const c=(o.alt&&o.alt.length)?o.alt:(o.sprintler||[]);
    if(!c.length)return '';
    const t=c.reduce(function(a,x){return a+locSayi(locTopla(x));},0);
    if(!t)return '';
    return t>=1000?((t/1000).toFixed(1).replace('.',',').replace(',0','')+'k'):(''+t);
  }
  function dugumBul(id){
    for(let fi=0;fi<VERI.planlar.length;fi++){const f=VERI.planlar[fi];
      if(f.id===id)return {o:f,seviye:'faz'};
      const ss=f.sprintler||[];
      for(let si=0;si<ss.length;si++){const s=ss[si];
        if(s.id===id)return {o:s,seviye:'sprint'};
        const aa=s.alt||[];
        for(let ai=0;ai<aa.length;ai++){if(aa[ai].id===id)return {o:aa[ai],seviye:'gorev'};}
      }
    }
    return null;
  }
  function hap(d){return '<span class="hap '+(DURUM_HAP[d]||'notr')+'">'+d+'</span>';}
  function bar(t){return '<span class="pbar"><i style="width:'+t+'%"></i></span>';}

  /* --- 1) Flyout panel: Faz → Sprint → Alt görev akordiyonu --- */
  function akorSatir(o,cls){
    const b=document.createElement('button');
    b.className='prow '+cls+(o.acik?' acik':'');
    b.dataset.pid=o.id;
    const t=tamamHesapla(o);
    b.innerHTML='<span class="pid" title="Ortada aç">'+o.id+'</span>'
      +'<span class="pcol"><span>'+o.ad+'</span><span class="chev">›</span>'
      +'<span class="pmeta">%'+t+' tamam</span>'+bar(t)+'</span>'
      +hap(o.durum);
    b.querySelector('.pid').addEventListener('click',function(e){e.stopPropagation();odakAc(o.id);});
    return b;
  }
  function yaprakSatir(a,cls){
    const r=document.createElement('div');
    r.className='prow '+cls+(a.durum==='bitti'?' bitti':'');
    r.dataset.pid=a.id;
    r.innerHTML='<span class="pid" title="Ortada aç">'+a.id+'</span>'
      +'<span class="pcol"><span class="pad" title="Düzenlemek için tıkla">'+a.ad+'</span>'
      +(a.dalga?'<span class="dalga">D'+a.dalga+'</span>':'')
      +'<span class="pmeta">%'+(a.tamam||0)+(a.loc?' · '+a.loc+' LOC':'')+'</span>'+bar(a.tamam||0)+'</span>'
      +hap(a.durum);
    r.querySelector('.pid').addEventListener('click',function(e){e.stopPropagation();odakAc(a.id);});
    r.querySelector('.pad').addEventListener('click',function(){duzenle(r,a);});
    return r;
  }
  function duzenle(r,a){ /* inline edit: Enter/blur kaydet · Esc iptal → VERI + iki görünüm tazele */
    if(r.dataset.duzenle)return;
    r.dataset.duzenle='1';
    const pad=r.querySelector('.pad');
    const inp=document.createElement('input');
    inp.className='ped'; inp.value=a.ad;
    pad.replaceWith(inp); inp.focus(); inp.select();
    const bitir=function(kaydet){
      if(kaydet){const v=inp.value.trim(); if(v)a.ad=v;}
      delete r.dataset.duzenle;
      tazele();
    };
    inp.addEventListener('keydown',function(e){
      if(e.key==='Enter'){e.preventDefault();bitir(true);}
      if(e.key==='Escape'){bitir(false);}
    });
    inp.addEventListener('blur',function(){bitir(true);});
  }
  function planYaz(){
    const k=document.getElementById('planListe'); if(!k)return;
    k.innerHTML='<div class="prow phead"><span>ID</span><span>Ad</span><span>Durum</span></div>';
    VERI.planlar.forEach(function(f){
      const fb=akorSatir(f,'psprint pfaz');
      const sf=document.createElement('div'); sf.className='palt'+(f.acik?' acik':'');
      (f.sprintler||[]).forEach(function(s){
        if(!(s.alt&&s.alt.length)){
          if(s.tamam===undefined)s.tamam=0;   /* sarmalayıcı yok: VERI düğümü normalize edilir */
          sf.appendChild(yaprakSatir(s,'psub pd1'));
          return;
        }
        const sb=akorSatir(s,'psprint pd1');
        const sa=document.createElement('div'); sa.className='palt'+(s.acik?' acik':'');
        s.alt.forEach(function(a){sa.appendChild(yaprakSatir(a,'psub pd2'));});
        sb.addEventListener('click',function(){s.acik=!s.acik; sb.classList.toggle('acik',!!s.acik); sa.classList.toggle('acik',!!s.acik);});
        sf.appendChild(sb); sf.appendChild(sa);
      });
      fb.addEventListener('click',function(){f.acik=!f.acik; fb.classList.toggle('acik',!!f.acik); sf.classList.toggle('acik',!!f.acik);});
      k.appendChild(fb); k.appendChild(sf);
    });
  }

  /* --- 2) Orta "Plan" sekmesi: DAG + geniş tablo + 3 temsil --- */
  function frow(o,seviye){
    const d=document.createElement('div');
    d.className='frow'+(seviye===0?' ffaz':'');
    d.dataset.pid=o.id;
    const t=tamamHesapla(o);
    d.innerHTML='<span class="pid">'+o.id+'</span>'
      +'<span class="'+(seviye===1?'fs1':seviye===2?'fs2':'')+'">'+o.ad+'</span>'
      +'<span>'+hap(o.durum)+'</span>'
      +'<span><span class="fbar"><i style="width:'+t+'%"></i></span><span class="fyuzde">%'+t+'</span></span>'
      +'<span>'+(locTopla(o)||'—')+'</span>'
      +'<span>'+(o.dalga?'<span class="dalga">D'+o.dalga+'</span>':'—')+'</span>'
      +'<span class="pid">'+(o.bag||'—')+'</span>';
    return d;
  }
  function dagYaz(){
    const d=planYuzey.querySelector('#dagSerit');
    d.innerHTML='';
    let once=null;
    VERI.dag.forEach(function(c){
      if(c[0]!==once){
        if(once!==null)d.appendChild(ayrac('·'));
        d.appendChild(dugum(c[0]));
      }
      d.appendChild(ayrac('→'));
      d.appendChild(dugum(c[1]));
      once=c[1];
    });
    function dugum(id){
      const s=document.createElement('span'); s.className='dugum'; s.textContent=id;
      s.title='Tabloda göster';
      s.addEventListener('click',function(){odakla(id);});
      return s;
    }
    function ayrac(ch){const s=document.createElement('span'); s.className='ok-imb'; s.textContent=ch; return s;}
  }
  const TEMSIL=[['tablo','Tablo'],['md','MD'],['json','JSON']];
  function temsilKur(){
    const s=planYuzey.querySelector('#temsilSec');
    if(s.dataset.kuruldu)return;   /* yeniden açılan sekmede template taze gelir, tekrar kurulur */
    s.dataset.kuruldu='1';
    TEMSIL.forEach(function(t){
      const b=document.createElement('button');
      b.className='mod-btn'+(t[0]===temsil?' aktif':'');
      b.textContent=t[1]; b.dataset.t=t[0];
      b.addEventListener('click',function(){
        temsil=t[0];
        s.querySelectorAll('.mod-btn').forEach(function(x){x.classList.toggle('aktif',x.dataset.t===temsil);});
        temsilUygula();
      });
      s.appendChild(b);
    });
  }
  function temsilUygula(){
    const kart=planYuzey.querySelector('#planTabloKart'), pre=planYuzey.querySelector('#planTemsil');
    if(temsil==='tablo'){kart.style.display=''; pre.style.display='none'; return;}
    kart.style.display='none'; pre.style.display='block';
    pre.textContent=(temsil==='md')?mdUret():jsonUret();
  }
  function mdUret(){
    const L=['# Sprint planı',''];
    VERI.planlar.forEach(function(f){
      L.push('## '+f.id+' · '+f.ad+' — '+f.durum+' · %'+tamamHesapla(f));
      L.push('');
      (f.sprintler||[]).forEach(function(s){
        const sb=['- **'+s.id+'** '+s.ad+' — '+s.durum+' · %'+tamamHesapla(s)];
        const sl=locTopla(s); if(sl)sb.push(sl+' LOC');
        L.push(sb.join(' · '));
        (s.alt||[]).forEach(function(a){
          const p=['  - **'+a.id+'** '+a.ad+' — '+a.durum+' · %'+(a.tamam||0)];
          if(a.loc)p.push(a.loc+' LOC');
          if(a.dalga)p.push('D'+a.dalga);
          if(a.bag)p.push('← '+a.bag);
          L.push(p.join(' · '));
        });
      });
      L.push('');
    });
    if(VERI.dag&&VERI.dag.length)L.push('**DAG:** '+VERI.dag.map(function(c){return c[0]+' → '+c[1];}).join(' · '));
    return L.join('\n');
  }
  function jsonUret(){ /* makine-okur izdüşüm: hesaplı tamam + türetilmiş loc dahil */
    const p=VERI.planlar.map(function(f){
      return {id:f.id,ad:f.ad,durum:f.durum,tamam:tamamHesapla(f),loc:locTopla(f)||undefined,sprintler:(f.sprintler||[]).map(function(s){
        return {id:s.id,ad:s.ad,durum:s.durum,tamam:tamamHesapla(s),loc:locTopla(s)||undefined,alt:(s.alt||[]).map(function(a){
          return {id:a.id,ad:a.ad,durum:a.durum,tamam:a.tamam||0,loc:a.loc||undefined,dalga:a.dalga||undefined,bag:a.bag||undefined};
        })};
      })};
    });
    return JSON.stringify({planlar:p,dag:VERI.dag},null,2);
  }
  function planFullYaz(){
    if(!planYuzey||!planYuzey.isConnected)return;
    if(!planYuzey.querySelector('#planFull'))return;
    dagYaz(); temsilKur();
    const k=planYuzey.querySelector('#planFull');
    k.innerHTML='<div class="frow fhead"><span>ID</span><span>Ad</span><span>Durum</span><span>İlerleme</span><span>LOC</span><span>Dalga</span><span>Bağ</span></div>';
    VERI.planlar.forEach(function(f){
      k.appendChild(frow(f,0));
      (f.sprintler||[]).forEach(function(s){
        k.appendChild(frow(s,1));
        (s.alt||[]).forEach(function(a){k.appendChild(frow(a,2));});
      });
    });
    temsilUygula();
  }

  /* --- 3) odak: panel/satır → orta sekme --- */
  function yuzeyCoz(donen){
    if(donen&&donen.yuzey&&donen.yuzey.querySelector&&donen.yuzey.querySelector('#planFull'))return donen.yuzey;
    if(donen&&donen.nodeType===1&&donen.querySelector('#planFull'))return donen;
    const aktif=document.querySelector('.yuzey.acik');
    if(aktif&&aktif.querySelector('#planFull'))return aktif;
    return null;
  }
  function odakAc(id){
    const y=yuzeyCoz(ctx.ortaAc('plan'));
    if(!y)return;
    planYuzey=y;
    planFullYaz();
    if(id)odakla(id);
  }
  function odakla(id){
    if(!planYuzey||!planYuzey.isConnected)return;
    const r=planYuzey.querySelector('.frow[data-pid="'+id+'"]');
    if(!r)return;
    r.scrollIntoView({block:'center',behavior:'smooth'});
    r.classList.remove('odak'); void r.offsetWidth; r.classList.add('odak');
  }

  /* --- 4) planKomut: composer "plan:" komutları --- */
  const KULLANIM='Sözdizimi: plan: <id> <alan> <değer> · alan: durum | tamam | loc | ad · örn. "plan: S8.2 tamam 80"';
  function planKomut(islem){
    const p=(''+islem).trim().split(/\s+/);
    if(p.length<3||p[0]==='?'||p[0]==='yardim'||p[0]==='yardım')return KULLANIM;
    const id=p[0], alan=(p[1]||'').toLowerCase(), deger=p.slice(2).join(' ');
    const v=dugumBul(id);
    if(!v)return 'ID bulunamadı: '+id+' — paneldeki ID\'lerden birini kullan (örn. S8.2)';
    const o=v.o;
    if(alan==='tamam'){
      if((o.alt&&o.alt.length)||(o.sprintler&&o.sprintler.length))
        return id+' bir '+(v.seviye==='faz'?'faz':'sprint')+' — %tamam alt öğelerden türetilir; yaprak ID ver (örn. '+(o.alt&&o.alt.length?o.alt[0].id:o.sprintler[0].id)+')';
      const n=Math.max(0,Math.min(100,parseInt(deger,10)));
      if(isNaN(n))return 'tamam 0-100 arası sayı olmalı — örn. "plan: '+id+' tamam 80"';
      const eski=o.tamam||0; o.tamam=n; tazele();
      return id+' · tamam %'+eski+' → %'+n+(n===100?' · kapatmak için: "plan: '+id+' durum bitti"':'');
    }
    if(alan==='durum'){
      const yeni=deger.toLowerCase();
      if(!DURUM_HAP[yeni])return 'Geçersiz durum "'+deger+'" — geçerli: '+Object.keys(DURUM_HAP).join(', ');
      const eski=o.durum; o.durum=yeni; tazele();
      return id+' · durum '+eski+' → '+yeni;
    }
    if(alan==='loc'){
      const eski=o.loc||'—'; o.loc=deger; tazele();
      return id+' · loc '+eski+' → '+deger;
    }
    if(alan==='ad'){
      const eski=o.ad; o.ad=deger; tazele();
      return id+' · ad "'+eski+'" → "'+deger+'"';
    }
    return 'Bilinmeyen alan "'+alan+'" — geçerli: durum, tamam, loc, ad';
  }

  /* --- 5) kurulum --- */
  function tazele(){planYaz(); planFullYaz();}
  ctx.planKomut=planKomut;    /* chat fragment'ı "plan:" prefix'ini ayıklayıp buraya verir */
  ctx.planTazele=tazele;      /* core isterse ortaAc sonrası çağırır (opsiyonel) */
  ctx.planOdakAc=odakAc;
  planYaz();
  const icerik=document.getElementById('icerik');   /* Plan sekmesi fragment dışından açılırsa da dolsun */
  if(icerik&&window.MutationObserver){
    new MutationObserver(function(){
      const yuzeyler=icerik.querySelectorAll('.yuzey');
      for(let i=0;i<yuzeyler.length;i++){
        if(yuzeyler[i]!==planYuzey&&yuzeyler[i].querySelector('#planFull')){planYuzey=yuzeyler[i]; planFullYaz();}
      }
    }).observe(icerik,{childList:true});
  }
  return {tazele:tazele, odakAc:odakAc, planKomut:planKomut};
}
```

---

## 5. Entegratör notları

1. **Sıra:** core (VERI/DURUM_HAP/ikon/sekme motoru) → `initPlan(ctx)` body sonunda bir kez. v9'daki plan bloğu (akorSatir/yaprakSatir/planYaz, ~satır 523–573) ve dosyada kalan tanımsız `planFullYaz()` referansı silinir.
2. **`ctx.ortaAc(tur)` kontratı:** türün sekmesini açar/öne alır; yüzey elementini veya `{yuzey}` döndürür. Döndürmezse fragment aktif `.yuzey.acik`'i dener; o da yoksa `#icerik` MutationObserver'ı ilk eklenmede yakalar. v9'daki `sekmeAc('plan')` + `sekmeSec` akışı kontratı doğal olarak karşılar — `ortaAc('plan')` için "varsa mevcut plan sekmesini seç, yoksa aç" yeterli.
3. **Chat kontratı:** composer metni `plan:` ile başlıyorsa (moddan bağımsız) prefix ayıklanır, kalan string `ctx.planKomut(islem)`'e verilir; dönen string `chat-ajan` balonuna yazılır. Balonun üstüne kullanıcı balonu zaten chat fragment'ında düşer.
4. **Template:** `tpl-plan` id'leri (`dagSerit/temsilSec/planTabloKart/planFull/planTemsil`) v9 ile aynı — varsa dokunma, yalnız inline stilleri §2'deki gibi CSS'e taşı.
5. **Sekme yaşam döngüsü:** sekme kapanıp açılınca `temsilSec` template'ten taze gelir; `temsilKur` `dataset.kuruldu` ile çift kurulumu engeller, `temsil` tercihi closure'da korunur.
6. **Manuel kabul listesi:** akordiyon aç/kapa yeniden çizimde korunur · yaprak ad editi Enter/blur ile iki görünümü tazeler · `.pid` tıkı ortada açar + flaşlar · DAG düğümü tabloda odaklar · `plan: S8.2 tamam 80` sonrası panel barı + tablo + MD/JSON hep %80 gösterir · `plan: S8 tamam 50` reddedilir.
7. Fragment yalnızca bu dosyayı üretir; mockup'a uygulama ve sonrasındaki `scripts\codemap.ps1` / `scripts\saglik.ps1` turu entegrasyon adımına aittir.
