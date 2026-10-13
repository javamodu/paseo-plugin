// plans/mockup/cek.mjs — galeri PNG'lerini yeniden uretir (7 durum, CDP ile gercek viewport)
// Kullanim: once sunucu acik olmali (plans/mockup kok, :14395) → node plans/mockup/cek.mjs
// Not: Edge/Chrome headless --window-size <~500px'te minimum pencere genisligine kenetlenir (DERSLER) — mobil icin CDP Emulation sart.
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const kok=path.dirname(fileURLToPath(import.meta.url));
const OUT=path.join(kok,'png');
const EDGE='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT=9223;
const BASE='http://127.0.0.1:14395/pano-mockup-2026-10-12.html';
const states=[
  {ad:'mobil-1-varsayilan', hash:'', w:375, h:812, dpr:2},
  {ad:'mobil-2-nav-sheet', hash:'#nav', w:375, h:812, dpr:2},
  {ad:'mobil-3-chat-sheet', hash:'#chat', w:375, h:812, dpr:2},
  {ad:'mobil-4-plan-scroll', hash:'#plan', w:375, h:812, dpr:2},
  {ad:'desktop-1-varsayilan', hash:'', w:1440, h:900, dpr:1},
  {ad:'desktop-2-dock-kapali', hash:'#dock-kapali', w:1440, h:900, dpr:1},
  {ad:'desktop-3-nav-dock', hash:'#nav', w:1440, h:900, dpr:1},
];
const prof=process.env.TEMP+'/paseo-mockup-cek-profili';
const proc=spawn(EDGE,['--headless=new','--disable-gpu','--remote-debugging-port='+PORT,'--user-data-dir='+prof,'about:blank'],{stdio:'ignore'});
async function waitUp(){ for(let i=0;i<60;i++){ try{ const r=await fetch('http://127.0.0.1:'+PORT+'/json/version'); if(r.ok) return; }catch{} await new Promise(r=>setTimeout(r,250)); } throw new Error('devtools gelmedi'); }
await waitUp();
const list=await (await fetch('http://127.0.0.1:'+PORT+'/json/list')).json();
const page=list.find(t=>t.type==='page');
const ws=new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej;});
let id=0; const pend=new Map();
ws.onmessage=(ev)=>{ const m=JSON.parse(ev.data); if(m.id&&pend.has(m.id)){ pend.get(m.id)(m); pend.delete(m.id); } };
function cmd(method,params){ const i=++id; ws.send(JSON.stringify({id:i,method,params})); return new Promise(res=>pend.set(i,res)); }
await cmd('Page.enable');
const kontrol='JSON.stringify({w:innerWidth,nav:!!document.querySelector(".panel")&&document.querySelector(".panel").classList.contains("acik"),chat:!!document.getElementById("sagPanel")&&!document.getElementById("sagPanel").classList.contains("kapali"),plan:[...document.querySelectorAll(".tab")].some(t=>/plan/i.test(t.textContent))})';
for(const s of states){
  await cmd('Emulation.setDeviceMetricsOverride',{width:s.w,height:s.h,deviceScaleFactor:s.dpr,mobile:s.w<500});
  await cmd('Page.navigate',{url:'about:blank'});
  await new Promise(r=>setTimeout(r,250));
  await cmd('Page.navigate',{url:BASE+s.hash});
  await new Promise(r=>setTimeout(r,1500));
  const chk=await cmd('Runtime.evaluate',{expression:kontrol,returnByValue:true});
  const shot=await cmd('Page.captureScreenshot',{format:'png'});
  fs.writeFileSync(path.join(OUT,s.ad+'.png'),Buffer.from(shot.result.data,'base64'));
  console.log(s.ad, chk.result.result.value);
}
try{ws.close();}catch{}
proc.kill();
console.log('BITTI: 7 PNG ->', OUT);
