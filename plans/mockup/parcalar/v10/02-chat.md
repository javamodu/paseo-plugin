# 02-chat — Sağ Dock (Chat) Fragment'ı · v10

Hedef mimari: `64px rail | flyout | 1fr orta | sağ chat dock`. Bu fragment sağ dock'u üretir: üstte **oturum sekmeleri** (`chatTabbar`), ortada kayan mesaj alanı (`chatAlan`), altta sabit **composer** (`#composer`). Dock kapanınca composer **node taşıma** ile orta sayfanın dibine iner, açılınca geri döner.

Tasarım dili: mevcut tokenlar (`--bg:#0a0a10`, `--kart`, `--kart2`, `--sinir`, `--vurgu:#8b5cf6`, `--vurgu2`, `--yesil/--sari/--kirmizi`), emoji yok (inline SVG, `ctx.ikon()`), gövde 15px, bağımlılık yok. Tüm örnek veri (T) işaretlidir.

## 1) Davranış spec'i

1. Dock yerleşimi: `#sagPanel` dikey flex — `chatTabbar` (sabit) → `chatAlan` (`flex:1`, kendi scroll'u) → `#composer` (sabit, dibde). Varsayılan genişlik 340px; `sagHandle` sol kenardan sürüklemeyle 240–560px arası resize (sürükleme shell'in `surukleKur()`'undadır).
2. Oturumlar `Map<id, html>` ile tutulur; her sekmenin mesaj geçmişi ayrıdır. Sekme değişiminde aktif oturumun HTML'i (`chatAlan.innerHTML`) kaydedilir, hedef oturumunki yüklenir.
3. Sekmeler pill'dir; aktif sekme `.aktif` (kart2 zemin + sinir kenar) vurgusu alır. Sekmedeki ✕ oturumu kapatır; kapatılan aktif oturumsa kalan son oturum açılır.
4. Son oturum da kapatılırsa dock boş kalmaz: otomatik yeni "Sohbet 1" açılır.
5. `+` (`.chat-arti`) yeni oturum açar: ad otomatik `Sohbet N` (artan sayaç), pill `+`'nun soluna eklenir, açılır ve aktif olur.
6. Composer üst satırı: `<select id="modSec">` 5 mod (Orkestrasyon / Plan / Coder / Manager / Ask; varsayılan **Manager**) + sağda durum çipleri (`.hap` örnekleri (T)).
7. Mod değişimi yalnızca input placeholder'ını değiştirir (`MODLAR[k].ph`); sahte yanıt metni de `MODLAR[k].cv`'den gelir — composer **mod-unaware**'dir (plan komutu dışında mod davranışı simüle edilmez).
8. `gonder()`: aktif oturuma `.chat-ben` balonu (kullanıcı) + `.chat-ajan` balonu (sahte yanıt) düşer; input temizlenir, alan en alta kayar, oturum HTML'i Map'e kaydedilir.
9. `plan: <ID> <alan> <değer>` komutu `/^plan:\s*(\S+)\s+(\S+)\s+(.+)$/i` ile tanınır → `ctx.planKomut({id, alan, deger})` çağrılır. Hook string dönerse o metin, dönmezse varsayılan ack ajan balonu olur. Örnek: `plan: S8.2 tamam 80` (T).
10. **Kritik davranış:** `sagToggle` dock'u `.kapali` yapınca `#composer` `appendChild` ile `.orta` dibine taşınır; dock açılınca `sagPanel` dibine geri taşınır. Node taşındığı için tüm listener'lar ve iç durum (seçili mod, ek çipleri, mic kayıt durumu, input değeri) korunur — yeniden render yok.
11. Dock kapalıyken `chatAlan` DOM'da kalır (`display:none`); dock geri açılınca geçmiş aynen görünür, yeniden yükleme gerekmez.
12. Attach (`ekBtn`): her tık `#ekSerit`'e `ek: gorsel-N.png` çipi üretir (T); çipteki ✕ çipi kaldırır. Çipler `#composer` içinde olduğu için taşımada onlar da birlikte gelir.
13. Mic (`micBtn`): `.kayit` toggle + pill'e `.dinliyor` (kırmızı kenar); kayıt sırasında placeholder "Dinleniyor… (mockup)" olur, kapanınca aktif modun placeholder'ına döner.
14. Enter gönderir; boş/boşluk mesaj düşmez; kullanıcı metni `&lt;` escape'lenir (mockup'ta XSS yok).
15. Açılışta "Sohbet 1" otomatik açılır ve komut ipucu içeren (T) karşılama balonu düşer.

## 2) HTML fragment'ı

Shell'in `.govde` grid'inde `.orta`'dan sonra gelir. v9'daki orta statik composer kaldırılır; tek composer `#composer`'dır ve başlangıçta dock'un içindedir.

```html
<aside class="sagpanel" id="sagPanel">
  <div class="sag-handle" id="sagHandle"></div>
  <div class="chat-tabbar" id="chatTabbar"></div>
  <div class="chat-alan" id="chatAlan"></div>
  <div class="composer" id="composer">
    <div class="composer-ic-wrap">
      <div class="composer-ust">
        <select id="modSec" class="mod-sec" title="Mod seçimi"></select>
        <div class="durum-serit"><span class="hap notr">+408 −13</span></div>
      </div>
      <div class="ek-serit" id="ekSerit"></div>
      <div class="composer-ic" id="composerPill">
        <button class="ikon-btn" id="ekBtn" title="Dosya ekle"></button>
        <input id="composerInput" placeholder="Yönetici talimatı — tüm modların üstünde…">
        <button class="ikon-btn" id="micBtn" title="Sesli giriş"></button>
        <button class="yuvarlak" id="composerBtn" title="Gönder"></button>
      </div>
    </div>
  </div>
</aside>
```

## 3) CSS fragment'ı (yalnız chat/composer + dock iskeleti)

```css
/* --- Dock iskeleti (paylaşılan: shell .sagpanel genişliğini zaten veriyorsa ilk kuralı atla) --- */
.sagpanel{width:340px;min-width:240px;max-width:560px;background:var(--kart);border-left:1px solid var(--sinir);position:relative;flex:0 0 auto;display:flex;flex-direction:column;min-height:0;overflow:hidden}
.sagpanel.kapali{display:none}
.sag-handle{position:absolute;left:0;top:0;bottom:0;width:6px;cursor:col-resize;z-index:5}
.sag-handle:hover,.sag-handle.tut{background:var(--vurgu)}
/* --- Oturum sekmeleri --- */
.chat-tabbar{display:flex;gap:6px;align-items:center;padding:10px;border-bottom:1px solid var(--sinir);flex:0 0 auto;overflow-x:auto}
.chat-tab{display:flex;align-items:center;gap:7px;padding:6px 12px;min-height:34px;border-radius:99px;border:1px solid transparent;background:transparent;color:var(--soluk);font:inherit;font-size:12.5px;font-weight:600;cursor:pointer;white-space:nowrap}
.chat-tab:hover{color:var(--metin)}
.chat-tab.aktif{background:var(--kart2);color:var(--metin);border-color:var(--sinir)}
.chat-tab .x{color:var(--soluk);font-size:12px;padding:0 1px}
.chat-tab .x:hover{color:var(--kirmizi)}
.chat-arti{border:1px solid var(--sinir);background:transparent;color:var(--soluk);border-radius:99px;min-width:34px;min-height:34px;font-size:15px;cursor:pointer;flex:0 0 auto}
.chat-arti:hover{color:var(--metin);background:var(--kart2)}
/* --- Mesaj alanı --- */
.chat-alan{flex:1;overflow-y:auto;min-height:0;padding:14px 12px;display:flex;flex-direction:column}
.chat-mesaj{max-width:88%;padding:10px 13px;border-radius:16px;margin-bottom:9px;font-size:14px}
.chat-ben{align-self:flex-end;background:linear-gradient(135deg,#2a2150,#1c1a33);border:1px solid rgba(139,92,246,.25)}
.chat-ajan{align-self:flex-start;background:var(--kart2);border:1px solid var(--sinir)}
.chat-zaman{font-size:10.5px;color:var(--soluk);margin-top:4px}
/* --- Composer (dock'ta da ortada da aynı node) --- */
.composer{flex:0 0 auto;border-top:1px solid var(--sinir);padding:12px 14px}
.orta>.composer{padding:14px 28px}
.composer-ic-wrap{max-width:780px;margin:0 auto;width:100%}
.sagpanel .composer-ic-wrap{max-width:none}
.composer-ust{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:10px;flex-wrap:wrap}
.mod-sec{width:auto;min-width:130px;background:var(--kart2);border:1px solid var(--sinir);color:var(--metin);border-radius:99px;padding:8px 12px;font-weight:700;font-size:12.5px;outline:0}
.durum-serit{display:flex;gap:8px;flex-wrap:wrap}
.ek-serit{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}
.ek-serit:empty{display:none}
.ek-serit .hap b{cursor:pointer;margin-left:5px;opacity:.7}
.ek-serit .hap b:hover{color:var(--kirmizi);opacity:1}
.composer-ic{display:flex;gap:6px;align-items:center;background:var(--kart);border:1px solid var(--sinir);border-radius:999px;padding:6px 8px 6px 10px}
.sagpanel .composer-ic{background:var(--kart2)}
.composer-ic.dinliyor{border-color:rgba(248,113,113,.5)}
.composer input{flex:1;background:transparent;color:var(--metin);border:0;outline:0;padding:10px 8px;margin:0;font-size:15px;min-width:0}
.ikon-btn{width:42px;height:42px;border-radius:50%;background:transparent;color:var(--soluk);border:0;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;flex:0 0 auto}
.ikon-btn:hover{background:var(--kart2);color:var(--metin)}
.ikon-btn.kayit{color:var(--kirmizi);background:rgba(248,113,113,.12)}
.ikon-btn svg{width:18px;height:18px}
.yuvarlak{width:44px;height:44px;border-radius:50%;background:#fff;color:#0a0a10;display:flex;align-items:center;justify-content:center;padding:0;border:0;cursor:pointer;flex:0 0 auto}
.yuvarlak svg{width:17px;height:17px}
```

## 4) JS — `initChat(ctx)`

`ctx = { ikon, MODLAR, planKomut }`. `ikon(ad)` inline SVG string döner; `MODLAR` kayıtları `{ad, ph, cv}`; `planKomut(islem)` plan fragment'ı (03) tarafından sağlanır.

```js
/* === Chat dock: oturumlar + composer tasima === */
function initChat(ctx){
  const ikon=ctx.ikon, MODLAR=ctx.MODLAR;
  const planKomut=ctx.planKomut||function(){return null;};
  const sagPanel=document.getElementById('sagPanel'),
        chatTabbar=document.getElementById('chatTabbar'),
        chatAlan=document.getElementById('chatAlan'),
        composer=document.getElementById('composer'),
        modSec=document.getElementById('modSec'),
        ekSerit=document.getElementById('ekSerit'),
        inp=document.getElementById('composerInput'),
        pill=document.getElementById('composerPill'),
        orta=document.querySelector('.orta');

  /* --- Oturumlar: Map<id, html> --- */
  const oturumlar=new Map();
  let sayac=0, aktif=null;
  const arti=document.createElement('button');
  arti.className='chat-arti'; arti.title='Yeni oturum'; arti.textContent='+';
  chatTabbar.appendChild(arti);
  function kaydet(){if(aktif){oturumlar.set(aktif,chatAlan.innerHTML);}}
  function yukle(){chatAlan.innerHTML=oturumlar.get(aktif)||'';chatAlan.scrollTop=1e6;}
  function sec(id){kaydet();aktif=id;
    chatTabbar.querySelectorAll('.chat-tab').forEach(function(t){t.classList.toggle('aktif',t.dataset.o===id);});
    yukle();}
  function oturumKapat(id){oturumlar.delete(id);
    const t=chatTabbar.querySelector('.chat-tab[data-o="'+id+'"]');
    if(t){t.remove();}
    if(aktif===id){aktif=null;
      const kalan=chatTabbar.querySelectorAll('.chat-tab');
      if(kalan.length){sec(kalan[kalan.length-1].dataset.o);}else{oturumAc();}}}
  function oturumAc(){sayac++;
    const id='o'+sayac;
    oturumlar.set(id,'');
    const t=document.createElement('button');
    t.className='chat-tab'; t.dataset.o=id;
    t.innerHTML='<span>Sohbet '+sayac+'</span><span class="x" title="Kapat">✕</span>';
    t.addEventListener('click',function(e){
      if(e.target.classList.contains('x')){oturumKapat(id);}else{sec(id);}});
    chatTabbar.insertBefore(t,arti);
    sec(id);
    return id;}
  arti.addEventListener('click',oturumAc);

  /* --- Balon --- */
  function balon(tip,html,kim){
    const d=document.createElement('div');
    d.className='chat-mesaj '+tip;
    d.innerHTML=html+'<div class="chat-zaman">şimdi · '+kim+'</div>';
    chatAlan.appendChild(d);
    chatAlan.scrollTop=1e6;}

  /* --- Modlar (select, varsayilan manager) --- */
  let aktifMod='manager';
  Object.keys(MODLAR).forEach(function(k){
    const o=document.createElement('option');
    o.value=k; o.textContent=MODLAR[k].ad;
    if(k===aktifMod){o.selected=true;}
    modSec.appendChild(o);});
  modSec.addEventListener('change',function(){
    aktifMod=modSec.value;
    inp.placeholder=MODLAR[aktifMod].ph;});
  inp.placeholder=MODLAR[aktifMod].ph;

  /* --- Gonder: plan: komutu + mod-unaware yanit --- */
  function gonder(){
    const m=inp.value.trim();
    if(!m){return;}
    balon('chat-ben',m.replace(/</g,'&lt;'),'siz');
    let cv;
    const pm=m.match(/^plan:\s*(\S+)\s+(\S+)\s+(.+)$/i);
    if(pm){
      const donen=planKomut({id:pm[1],alan:pm[2],deger:pm[3]});
      cv=donen||('Plan komutu uygulandı: <b>'+pm[1]+'</b> · '+pm[2]+' → '+pm[3]+' (T).');}
    else{cv=MODLAR[aktifMod].cv;}
    balon('chat-ajan',cv,'ajan');
    inp.value='';
    kaydet();}
  document.getElementById('composerBtn').addEventListener('click',gonder);
  inp.addEventListener('keydown',function(e){if(e.key==='Enter'){gonder();}});

  /* --- Attach / mic / ikonlar --- */
  document.getElementById('ekBtn').innerHTML=ikon('clip');
  document.getElementById('micBtn').innerHTML=ikon('mic');
  document.getElementById('composerBtn').innerHTML=ikon('send');
  let ekSayi=0;
  document.getElementById('ekBtn').addEventListener('click',function(){
    ekSayi++;
    const c=document.createElement('span');
    c.className='hap notr';
    c.innerHTML='ek: gorsel-'+ekSayi+'.png<b title="Kaldır">✕</b>';
    c.querySelector('b').addEventListener('click',function(){c.remove();});
    ekSerit.appendChild(c);});
  document.getElementById('micBtn').addEventListener('click',function(){
    const b=document.getElementById('micBtn');
    const kayit=b.classList.toggle('kayit');
    pill.classList.toggle('dinliyor',kayit);
    inp.placeholder=kayit?'Dinleniyor… (mockup)':MODLAR[aktifMod].ph;});

  /* --- Dock ac/kapa: composer node tasınır (listener korunur) --- */
  document.getElementById('sagToggle').addEventListener('click',function(){
    const kapali=sagPanel.classList.toggle('kapali');
    if(kapali){orta.appendChild(composer);}else{sagPanel.appendChild(composer);}});

  /* --- Acilis: Sohbet 1 + karsilama (T) --- */
  oturumAc();
  balon('chat-ajan','Merhaba — görev ya da soru yaz; planı güncellemek için <b>plan: &lt;ID&gt; &lt;alan&gt; &lt;değer&gt;</b> komutunu kullan (örn. <b>plan: S8.2 tamam 80</b>) (T).','ajan');
  kaydet();
}
```

## 5) Entegratör notları

**Bu fragment'ın sahip olduğu id/class'lar (paylaşılan sözleşme):**
- id: `sagPanel`, `sagHandle`, `chatTabbar`, `chatAlan`, `composer`, `modSec`, `ekSerit`, `composerInput`, `composerBtn`, `ekBtn`, `micBtn` (ayrıca iç: `composerPill`)
- class: `.chat-tab`, `.chat-arti`, `.chat-mesaj`, `.chat-ben`, `.chat-ajan`, `.chat-zaman`, `.composer*` ailesi

**Shell'in sağlaması gerekenler:**
- `.orta` kapsayıcısı (composer taşıma hedefi) ve tabbar'daki `#sagToggle` butonu
- Tokenlar + `.hap`/`.nokta` çip stilleri; `I{}` içinde `clip`, `mic`, `send` ikonları ve `ikon()` yardımcısı
- `MODLAR` sözlüğü (`{ad, ph, cv}` kayıtları; 5 mod, key'ler: `orkestrasyon/plan/coder/manager/ask`)
- Resize: `sagHandle`'ı shell'in ortak `surukleKur(sagHandle, sagPanel, 'sag')` fonksiyonuna bağlayın (240–560); fragment yalnızca görünümü verir

**Çağrı (DOM hazırken, script sonunda):**
```js
initChat({ikon:ikon, MODLAR:MODLAR, planKomut:planKomut});
```

**`planKomut(islem)` sözleşmesi (03-plan fragment'ı uygular):**
- Girdi: `islem = {id, alan, deger}` (üçü de string). Örn. `plan: S8.2 tamam 80` → `{id:'S8.2', alan:'tamam', deger:'80'}`
- Dönüş `string` ise ajan balonu olarak basılır; falsy ise chat varsayılan ack balonu basar

**Dikkat:**
- `#sagToggle` dinleyicisi bu fragment'tadır (composer taşıma burada yaşanır); shell ayrıca bağlarsa çift toggle olur — tek yerden bağlayın
- Mobil kırılım (≤880px): dock overlay davranışı shell'indir; composer taşıma mantığı görünürlükten bağımsız çalışır
- v9'dan farklar: chat orta sekme değil sağ dock; composer tek node ve taşınabilir (`.orta` ↔ `#sagPanel`); oturum geçmişi DOM yeniden kurulmadan Map'te HTML olarak saklanır
