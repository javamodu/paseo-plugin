// Browser-only design demo. No SDK, fetch, credentials, shell, persistence or actual agent execution.
const $ = selector => document.querySelector(selector);
const escapeText = text => String(text).replace(/[&<>"']/g, c =>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const statuses = {
  VERIFYING:['Doğrulanıyor','blue'], RUNNING:['Çalışıyor','blue'],
  DRAFT:['Taslak','blue'], WAITING_APPROVAL:['Karar bekliyor','orange'],
  PAUSED:['Duraklatıldı','orange'], CANCEL_REQUESTED:['İptal teyidi bekliyor','orange'],
  CANCELLED:['İptal edildi','red'], ACCEPTED:['Kabul edildi','green'],
};
const query = new URLSearchParams(location.search);
const pageQuery = query.get('page'), tabQuery = query.get('tab');
const state = {
  page:['capsules','decisions','lab','settings'].includes(pageQuery)?pageQuery:'capsules',
  selected:'K-01',
  tab:['summary','jobs','evidence','history'].includes(tabQuery)?tabQuery:'summary',
  stopped:false, newGoal:false,
};
const capsules = [
  {id:'K-01',title:'Oturum yenileme hatasını düzelt',goal:'Mevcut API sözleşmesi korunsun; token yenileme regresyonu giderilsin.',
   state:'VERIFYING',scope:'src/auth + tests/auth',candidate:'demo-candidate-01',version:1,
   current:'Evaluator sabit aday üzerinde test ediyor · örnek',decision:null,profile:'Dengeli',
   history:['Plan önizlendi ve örnek onay verildi.','Coder aday snapshot oluşturdu.','Doğrulama adımı açıldı.']},
  {id:'K-02',title:'Arama filtresini iyileştir',goal:'Küçük değişiklik; kapsamı büyütme.',
   state:'WAITING_APPROVAL',scope:'src/search',candidate:'demo-candidate-02',version:1,
   current:'Deneme sınırı doldu. İnsan kararı gerekiyor · örnek',decision:'repair',profile:'Dengeli',
   history:['İki örnek onarım aynı hata imzasını verdi.','Yeni deneme için karar istendi.']},
  {id:'K-03',title:'API dokümanını güncelle',goal:'Sadece doküman; kod davranışı değişmesin.',
   state:'DRAFT',scope:'docs/api',candidate:null,version:1,current:'Plan taslağı hazır; başlatılmadı.',
   decision:null,profile:'Ekonomik',history:['Örnek hedef taslağa çevrildi.']},
];
function chosen() { return capsules.find(c => c.id === state.selected); }
function badge(c) {
  const [label,color] = statuses[c.state];
  return `<span class="badge ${color}">${label} · örnek</span>`;
}
function notify(message) { $('#notice').textContent=message; }
function record(c,text) { c.history.push(text); c.version++; }
function render() {
  for (const page of ['capsules','decisions','lab','settings'])
    $(`#${page}-page`).hidden = state.page !== page;
  document.querySelectorAll('[data-page]').forEach(button =>
    button.setAttribute('aria-current',button.dataset.page === state.page ? 'page' : 'false'));
  $('#decision-count').textContent=capsules.filter(c => c.decision).length;
  $('#stop').textContent=state.stopped ? 'Demo kilidini aç' : 'Acil durdur · demo';
  renderCapsules(); renderDecisions(); renderLab(); renderSettings();
}
function renderCapsules() {
  $('#capsule-list').innerHTML=capsules.map(c =>
    `<button class="capsule ${c.id===state.selected?'selected':''}" data-capsule="${c.id}" aria-pressed="${c.id===state.selected}">
      ${badge(c)}<strong>${escapeText(c.title)}</strong><small>${c.id} · ${escapeText(c.profile)}</small></button>`).join('');
  const c=chosen();
  const tabs={summary:'Özet',jobs:'İşler',evidence:'Kanıt',history:'Geçmiş'};
  $('#capsule-detail').innerHTML=`
    <div class="detail-head"><div><span class="small">${c.id} · plan v1 · run sürümü ${c.version}</span>
      <h2>${escapeText(c.title)}</h2><p>${escapeText(c.goal)}</p>${badge(c)}</div></div>
    <div class="tabs" role="tablist" aria-label="Kapsül detayları">${Object.entries(tabs).map(([key,label]) =>
      `<button id="tab-${key}" role="tab" aria-selected="${state.tab===key}" tabindex="${state.tab===key?0:-1}" data-tab="${key}">${label}</button>`).join('')}</div>
    <div id="detail-panel" role="tabpanel" aria-labelledby="tab-${state.tab}">${detail(c)}</div>`;
  $('#context').textContent=state.newGoal?'Yeni kapsül taslağı':`${c.id} bağlamı`;
  $('#goal-label').textContent=state.newGoal?'Yeni hedef':'Kapsüle bağlı öneri';
  $('#send').textContent=state.newGoal?'Taslak oluştur · örnek':'Plan öner · örnek';
}
function detail(c) {
  if (state.tab==='jobs') return `<section class="panel"><h3>Recipe: repair-v1</h3>
    ${[['Prepare','Snapshot ve güvenlik kapısı'],['Produce','İzole coder; aday çıktı'],['Verify','Korunan evaluator; sabit snapshot'],['Accept','Gerekli insan kararı']].map(([title,note]) =>
      `<div class="row"><div><strong>${title}</strong><small>${note}</small></div><span class="small">Örnek akış</span></div>`).join('')}
    <p class="small">Repair yeni attempt'tir; grafın içine sonsuz döngü çizilmez.</p></section>`;
  if (state.tab==='evidence') return `<section class="panel"><h3>Kanıt paketi</h3>
    <p>Bu prototipte gerçek test raporu yok. Ajanın başarı beyanı kabul sayılmaz.</p>
    <div class="row"><span>Aday</span><strong>${escapeText(c.candidate||'Henüz yok')}</strong></div>
    <div class="row"><span>Canlı test durumu</span><strong>NOT_RUN</strong></div>
    <button data-action="download">Örnek manifesti indir</button></section>`;
  if (state.tab==='history') return `<section class="panel"><h3>Örnek olay geçmişi</h3>
    ${c.history.map(text=>`<div class="row">${escapeText(text)}</div>`).join('')}
    <p class="small">Tarayıcı belleğindeki örnek kayıt; kalıcı DB audit'i değil.</p></section>`;
  return `<section class="panel"><h3>Şimdi ne oluyor?</h3><p>${escapeText(c.current)}</p>
    ${c.state==='DRAFT'?'<button data-action="start" class="primary">Taslağı başlat · örnek</button>':''}
    ${['RUNNING','VERIFYING'].includes(c.state)?'<button data-action="pause">Duraklat · örnek</button>':''}
    ${c.state==='PAUSED'?'<button data-action="resume" class="primary">Devam et · örnek</button>':''}
    ${c.state==='CANCEL_REQUESTED'?'<button data-action="confirm-cancel">İptal teyidini göster · örnek</button>':''}
    ${c.state==='CANCELLED'?'<button data-action="fork-draft">Yeni iş taslağı · örnek</button>':''}</section>
    ${c.decision?`<section class="panel attention"><span class="badge orange">Kararın gerekiyor</span>
      <h3>Bir onarım denemesi daha yapılsın mı?</h3>
      <p>Yalnız ${c.id}, mevcut aday ve mevcut plan için. Sınır kendiliğinden artmaz.</p>
      <button class="primary" data-action="decision">Karar kartına git</button></section>`:''}
    <section class="panel"><h3>Çalışma sözleşmesi</h3><div class="limits">
      <div><strong>${escapeText(c.scope)}</strong><span>İzinli kapsam</span></div>
      <div><strong>Kontrollü</strong><span>Örnek yetki profili</span></div>
      <div><strong>İnsan kararı</strong><span>Merge ve yayın</span></div></div>
      <details><summary>Kabul ve teknik ayrıntı</summary><ul><li>Korunan test suite'i sabit aday üzerinde geçmeli.</li>
        <li>Kanıtın candidate/evaluator hash'i eşleşmeli.</li><li>Geçerli karar olmadan kabul yok.</li></ul></details></section>`;
}
function renderDecisions() {
  const pending=capsules.filter(c=>c.decision);
  $('#decisions-page').innerHTML=`<div class="page-heading"><div><h1>Karar bekleyen işler</h1>
    <p>Bildirim akışı değil; kapsamı açık karar kuyruğu.</p></div></div>`+
    (pending.length?pending.map(c=>`<section class="panel attention"><span class="small">${c.id} · plan v1 · run sürümü ${c.version} · ${escapeText(c.candidate)}</span>
      <h2>Bir sınırlı onarım denemesi daha</h2><p>Yalnız bu kapsüle izin verir. Başarısız işi başarılı saymaz; sonuç yine evaluator'dan geçer.</p>
      <div class="button-row"><button class="primary" data-approve="${c.id}" data-version="${c.version}">İzin ver · örnek</button>
      <button data-reject="${c.id}">Reddet ve duraklat · örnek</button></div></section>`).join(''):
      '<section class="panel"><h2>Bekleyen karar yok</h2><p>Yeni kapsam veya bütçe gerekiyorsa burada görünür.</p></section>');
}
function renderLab() {
  $('#lab-page').innerHTML=`<div class="page-heading"><div><h1>Model laboratuvarı</h1>
    <p>En yüksek genel puan değil; bu görev için güvenilir profil.</p></div></div>
    <section class="panel"><h2>Önce kapılar, sonra hız ve maliyet</h2>
      <div class="table-wrap"><table><thead><tr><th>Paket</th><th>Ne doğrular?</th><th>Durum</th></tr></thead><tbody>
        <tr><td>Capability</td><td>Şema, araç, usage, cancel</td><td>NOT_RUN</td></tr>
        <tr><td>Repo görevleri</td><td>Bağımsız kabul ve repair</td><td>NOT_RUN</td></tr>
        <tr><td>Güvenlik</td><td>Kapsam, sır, sahte PASS</td><td>NOT_RUN</td></tr>
        <tr><td>Dayanıklılık</td><td>Restart ve belirsiz spawn</td><td>NOT_RUN</td></tr>
      </tbody></table></div><p class="small">Gerçek model sıralaması veya ölçülmüş maliyet yok.</p></section>
    <section class="panel"><h2>Küçük pilot</h2><p>Aynı vakalar, sabit evaluator ve eşit sınırlar. Başarısız/timeout işler sonuçtan silinmez.</p>
      <button data-action="bench">Pilot planını göster</button><p id="bench-note" class="small"></p></section>`;
}
function renderSettings() {
  $('#settings-page').innerHTML=`<div class="page-heading"><div><h1>İkincil ayarlar</h1>
    <p>Günlük kontrol kapsülde; altyapı seçenekleri burada.</p></div></div><section class="panel">
    <h2>Bağlantı ve politikalar</h2><p>Paseo bağlantısı kurulmadı. Anahtar veya credential istenmez.</p>
    <ul><li>Core: ayrı kalıcı servis; bu sayfa core değildir.</li><li>Profil değişikliği yeni run'a snapshot olur.</li>
    <li>Global STOP restart'tan sonra korunmalı; demo yenilemede sıfırlanır.</li>
    <li>Worktree sandbox değildir; gerçek ortam testi gerekir.</li></ul></section>`;
}
document.addEventListener('click', event => {
  const button=event.target.closest('button'); if(!button) return;
  if(button.dataset.page) {state.page=button.dataset.page;render();return;}
  if(button.dataset.capsule) {state.selected=button.dataset.capsule;state.tab='summary';state.newGoal=false;$('#goal').value='';render();return;}
  if(button.dataset.tab) {state.tab=button.dataset.tab;render();return;}
  if(button.dataset.approve) {
    const c=capsules.find(x=>x.id===button.dataset.approve);
    if(c.version!==Number(button.dataset.version)||state.stopped) {notify('Karar eski veya demo kilidi açık; uygulanmadı.');return;}
    c.decision=null;c.state='PAUSED';c.current='Örnek ek deneme izni verildi; devam ayrıca başlatılır.';
    record(c,'Scope-bound örnek karar verildi.');render();notify('Yalnız seçili karar değişti. Gerçek bütçe veya worker etkisi yok.');return;
  }
  if(button.dataset.reject) {
    const c=capsules.find(x=>x.id===button.dataset.reject);c.decision=null;c.state='PAUSED';record(c,'Örnek karar reddedildi.');render();return;
  }
  const c=chosen();
  switch(button.dataset.action) {
    case 'pause': c.state='PAUSED';c.current='Yeni dispatch duraklatıldı · örnek';record(c,'Örnek pause');break;
    case 'start': case 'resume':
      if(state.stopped) {notify('Demo STOP kilidi açık; önce kilidi açık kararla kaldır.');return;}
      c.state='RUNNING';c.current='Örnek koşu başladı; gerçek process yok.';record(c,'Örnek açık başlatma');break;
    case 'confirm-cancel': c.state='CANCELLED';c.current='Örnek iptal teyidi gösterildi; gerçek runtime yok.';record(c,'Örnek teyit');break;
    case 'fork-draft': state.newGoal=true;$('#goal').value=c.goal;notify('Yeni iş taslağı açıldı; terminal kayıt diriltilmez.');break;
    case 'decision': state.page='decisions';break;
    case 'bench': $('#bench-note').textContent='Plan: 6 vaka × 2 profil × 2 tekrar = 24 pilot koşu. Bu demo koşuları başlatmaz.';return;
    case 'download':
      const blob=new Blob([JSON.stringify({demo:true,status:'NOT_RUN',capsule:c.id,candidate:c.candidate,warning:'Gerçek kanıt değildir'},null,2)],{type:'application/json'});
      const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='ornek-manifest.json';link.click();URL.revokeObjectURL(link.href);return;
    default: return;
  }
  render();
});
$('#new').addEventListener('click',()=>{state.page='capsules';state.newGoal=true;$('#goal').value='';render();$('#goal').focus();});
$('#send').addEventListener('click',()=>{
  const text=$('#goal').value.trim();if(!text){notify('Önce hedef veya öneriyi yaz.');return;}
  if(state.newGoal) {
    const c={id:`K-${String(capsules.length+1).padStart(2,'0')}`,title:text.slice(0,80),goal:text,
      state:'DRAFT',scope:'Plan onayında tanımlanacak',candidate:null,version:1,
      current:'Örnek taslak; otomatik çalıştırılmadı.',decision:null,profile:$('#profile').value,
      history:['Örnek taslak oluşturuldu; gerçek LLM çağrısı yapılmadı.']};
    capsules.push(c);state.selected=c.id;state.newGoal=false;state.tab='summary';
  } else {record(chosen(),`Manager önerisi · örnek: ${text}`);}
  $('#goal').value='';render();notify('Örnek öneri kaydedildi. Çalışma planı ve izinler sessizce değiştirilmedi.');
});
$('#goal').addEventListener('keydown',e=>{if(e.ctrlKey&&e.key==='Enter'){$('#send').click();e.preventDefault();}});
$('#stop').addEventListener('click',()=>{
  if(state.stopped) {state.stopped=false;notify('Demo kilidi kaldırıldı; iptal edilmiş işler otomatik başlamaz.');}
  else {state.stopped=true;for(const c of capsules)if(['RUNNING','VERIFYING'].includes(c.state)){
    c.state='CANCEL_REQUESTED';c.current='İptal istendi; teyit gösterilmeden iptal edildi denmez.';record(c,'Örnek STOP mandalı');}
    notify('Demo dispatch kilitlendi. Gerçek süreç durdurulmadı; iptal teyidi ayrıca gösterilir.');}
  render();
});
document.addEventListener('keydown',e=>{
  if(e.target.getAttribute('role')!=='tab'||!['ArrowLeft','ArrowRight'].includes(e.key))return;
  const keys=['summary','jobs','evidence','history'],index=keys.indexOf(state.tab);
  state.tab=keys[(index+(e.key==='ArrowRight'?1:3))%4];render();$(`#tab-${state.tab}`).focus();e.preventDefault();
});
render();
