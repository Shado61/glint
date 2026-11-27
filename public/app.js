/* Manasenger — messenger client: chats, calls, video calls, screen sharing */
'use strict';
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store={get(k,d){try{const v=localStorage.getItem('glint.'+k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem('glint.'+k,JSON.stringify(v))}catch(e){}}};
const touch=matchMedia('(pointer:coarse)').matches;
document.documentElement.classList.add(/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)?'ios':/Android/.test(navigator.userAgent)?'android':'desk');
const mobile=()=>innerWidth<=760;
/* the iPhone version: lean and fast — no friends map and no AI tab (they keep GPS, timers and a heavy map library busy);
   everything else is the same app */
const IOS=document.documentElement.classList.contains('ios');

/* ---------- icons ---------- */
const P={
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  back:'<path d="m15 18-6-6 6-6"/>',
  phone:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>',
  video:'<path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
  videoOff:'<path d="M10.7 6H14a2 2 0 0 1 2 2v3.3l1 1L22 8v8"/><path d="M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2"/><path d="m2 2 20 20"/>',
  mic:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4"/>',
  micOff:'<path d="m2 2 20 20"/><path d="M18.9 13.2A7 7 0 0 0 19 12v-2M5 10v2a7 7 0 0 0 12 5M15 9.3V5a3 3 0 0 0-5.7-1.3M9 9v3a3 3 0 0 0 5.1 2.1M12 19v3"/>',
  screen:'<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="m9 10 3-3 3 3M12 7v6"/>',
  flip:'<path d="M20 5h-3.2l-1.8-2H9L7.2 5H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z"/><path d="m15 13-3 3-3-3M9 11l3-3 3 3"/>',
  end:'<path d="M10.7 13.3a13 13 0 0 0 3.9 2.4l1.5-1.5a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 3.2 6.2 2 2 0 0 1 5.1 4h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.8 12"/><path d="m22 2-20 20"/>',
  send:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  clip:'<path d="m21.4 11.1-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5"/>',
  x:'<path d="M18 6 6 18M6 6l12 12"/>',
  bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  reply:'<path d="m9 17-5-5 5-5"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/>',
  copy:'<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  trash:'<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
  chats:'<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-4-.9L3 20l1.1-4A8.4 8.4 0 1 1 21 11.5Z"/>',
  calls:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
  users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  more:'<circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/>',
  check:'<path d="M20 6 9 17l-5-5"/>',
  min:'<path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/>',
  pip:'<rect x="2" y="4" width="20" height="16" rx="2"/><rect x="12" y="12" width="8" height="6" rx="1" fill="currentColor"/>',
  incall:'<path d="m16 3 5 5-5 5"/><path d="M21 8h-7"/>',
  outcall:'<path d="M17 21l-5-5 5-5"/><path d="M12 16h7"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  vol:'<path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
  deaf:'<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>',
  deafOff:'<path d="m2 2 20 20"/><path d="M3 18v-6a9 9 0 0 1 14.6-7M21 12v6"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>',
  leave:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  link:'<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  smile:'<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>',
  image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
  save:'<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
  home:'<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-4-.9L3 20l1.1-4A8.4 8.4 0 1 1 21 11.5Z"/>',
  book:'<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  star:'<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
  fwd:'<path d="m15 17 5-5-5-5"/><path d="M4 18v-2a4 4 0 0 1 4-4h12"/>',
  contact:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
  addUser:'<circle cx="10" cy="8" r="4"/><path d="M2 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 4 1.5M19 8v6M16 11h6"/>',
  camera:'<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3.5"/>',
  mask:'<path d="M3 6c3-1 6-1 9 1 3-2 6-2 9-1 0 6-2 11-5 11-2 0-3-2-4-2s-2 2-4 2C5 17 3 12 3 6Z"/><path d="M7.5 10.5h2M14.5 10.5h2"/>',
  eye:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  text:'<path d="M4 7V5h16v2M9 20h6M12 5v15"/>',
  bolt:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  signal:'<path d="M3 20h2M8 20v-4M13 20v-8M18 20V8"/>',
  pin:'<path d="M12 22s7-6.1 7-12a7 7 0 0 0-14 0c0 5.9 7 12 7 12Z"/><circle cx="12" cy="10" r="2.6"/>',
  locate:'<path d="m3 11 19-9-9 19-2-8-8-2Z"/>',
  pad:'<rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><path d="M15 21v-6.5l5-1.5V19"/><circle cx="14" cy="21" r="1"/><circle cx="19" cy="19" r="1"/>',
  layers:'<path d="m12 2 10 5-10 5L2 7l10-5Z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>'
};
const ic=(n,cls='ico')=>`<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;
const TICK1='<svg viewBox="0 0 16 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m1.5 6.5 3.2 3L11 2.5"/></svg>';
const TICK2='<svg viewBox="0 0 16 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m1 6.5 3.2 3L10.5 2.5M7.5 9.2 14.5 2.5"/></svg>';

/* ---------- state ---------- */
const S={me:null,chats:{},users:{},msgs:{},more:{},cur:null,tab:'chats',q:'',found:[],typing:{},reply:null,edit:null,calls:null,draft:{},servers:{},view:'home',win:{},
  packs:[],pk:null,stk:false,contacts:{},stars:new Set(),stories:[],tz:5};
/* weak phones: lighter mode — no animations or glass, smaller camera picture, fewer messages on screen */
const LITE_AUTO=(navigator.deviceMemory&&navigator.deviceMemory<=(/Android/.test(navigator.userAgent)?3:2))||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=2)||(navigator.connection&&navigator.connection.saveData);
const isLite=()=>{const v=store.get('lite','auto');return v==='on'||(v==='auto'&&!!LITE_AUTO)};
document.documentElement.classList.toggle('lite',isLite());
const WIN=isLite()?50:IOS?60:matchMedia('(pointer:coarse)').matches?80:120; /* messages kept on screen at once; older ones appear on demand */

/* ---------- helpers ---------- */
async function api(path,body){
  const r=await fetch(path,body===undefined?{credentials:'same-origin'}:{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  let j=null;try{j=await r.json()}catch(e){}
  if(!r.ok)throw new Error((j&&j.error)||'Нет связи с сервером');
  return j;
}
let tt;function toast(t,ms){const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>e.classList.remove('on'),ms||Math.max(2800,t.length*55))}
/* first letters of the first two words; emoji and symbols are skipped so they never break into half-characters */
const initials=n=>String(n||'?').trim().split(/\s+/).map(w=>Array.from(w).find(ch=>/[\p{L}\p{N}]/u.test(ch))).filter(Boolean).slice(0,2).join('').toUpperCase()||'?';
function avatar(u,size='',dot=true){
  if(!u)return `<span class="ava ${size}">?</span>`;
  return `<span class="ava ${size}" style="--c:${esc(u.color||'#5b8cff')}">${u.avatar?`<img decoding="async" src="${esc(u.avatar)}" alt="" decoding="async" loading="lazy">`:esc(initials(nm(u)))}${dot&&u.online?'<i class="dot"></i>':''}</span>`;
}
function chatAvatar(c,size){
  if(c.type==='dm')return avatar(peerOf(c),size);
  if(c.type==='self')return `<span class="ava ${size} self">${ic('book')}</span>`;
  if(c.type==='channel'){const g=S.servers[c.server]||{};return `<span class="ava ${size}" style="--c:${esc(g.color||'#5f8cc0')}">${g.avatar?`<img decoding="async" src="${esc(g.avatar)}" alt="" loading="lazy">`:'#'}</span>`}
  return `<span class="ava ${size}" style="--c:${esc(c.color||'#9b6bff')}">${c.avatar?`<img decoding="async" src="${esc(c.avatar)}" alt="" loading="lazy">`:esc(initials(c.name))}</span>`;
}
const peerOf=c=>S.users[c.members.find(m=>m!==S.me.id)]||{name:'Удалённый аккаунт',color:'#777',username:''};
/* the name you saved a person under in contacts, otherwise their own name */
const nm=u=>u?(S.contacts[u.id]||u.name||'?'):'?';
const chatName=c=>c.type==='dm'?nm(peerOf(c)):c.type==='self'?'Избранное':c.type==='channel'?'# '+c.name:c.name;
/* ---------- the streak pet («Серийчик») ---------- */
const petDays=c=>Math.max((c.pet&&c.pet.best)||0,(c.streak&&c.streak.n)||0);
function petMood(c){const s=c.streak;if(!s)return c.st0?'wait':'sleep';if(s.today)return 'happy';return s.me&&s.me.length?'wait':'sleep'}
function petOpts(c,mood,big){const p=c.pet||{};return {days:petDays(c),color:p.color,style:p.style,hat:p.hat,eyes:p.eyes,neck:p.neck,fx:big?p.fx:'none',mini:!big,mood:mood||petMood(c)}}
function petSvgOf(c,mood,big){return window.PET?PET.petSVG(petOpts(c,mood,big)):''}
function refreshPetBtn(){const c=S.chats[S.cur],b=document.querySelector('.pet-btn');if(b&&c)b.innerHTML=petSvgOf(c);petFloat()}
/* pat the pet: hearts float up (also when the other person pats it) */
function petPat(mine){
  const h=$('#petHearts'),fl=document.querySelector('.pet-float'),btn=document.querySelector('.pet-btn');navigator.vibrate&&navigator.vibrate(8);
  const host=h||(fl&&fl.querySelector('.pf-hearts'))||btn;if(!host)return;
  for(let i=0;i<(h?6:3);i++){const e=document.createElement('i');e.textContent=mine?'💕':'💗';e.style.left=(20+Math.random()*60)+'%';e.style.animationDelay=(i*.08)+'s';host.appendChild(e);setTimeout(()=>e.remove(),1400)}
  const svg=(h?h.parentNode:fl||btn).querySelector('svg');if(svg){svg.classList.remove('patted');void svg.offsetWidth;svg.classList.add('patted')}
}
/* the pet walks around the chat: drag it anywhere, it springs to the nearest side like a picture-in-picture window.
   Tap — pat it, hold — open it. Its place is remembered. */
const PF=64;
function petFloatOn(c){return !!(c&&c.pet&&(c.type==='dm'||c.petOn)&&store.get('petfloat','on')==='on')}
function pfBounds(main){
  const W=main.clientWidth,H=main.clientHeight,hd=main.querySelector('.chat-h'),cp=main.querySelector('.composer'),mr=main.getBoundingClientRect();
  const top=(hd?hd.getBoundingClientRect().bottom-mr.top:60)+8,bot=(cp?cp.getBoundingClientRect().top-mr.top:H-80)-PF-8;
  return {l:8,r:W-PF-8,t:top,b:Math.max(top,bot)};
}
function pfPlace(el,x,y,anim){
  const B=pfBounds(el.parentNode);x=Math.min(B.r,Math.max(B.l,x));y=Math.min(B.b,Math.max(B.t,y));
  el.classList.toggle('snap',!!anim);el.style.transform=`translate3d(${x}px,${y}px,0)`;el._x=x;el._y=y;return [x,y];
}
function petFloat(){
  const main=$('#main'),c=S.chats[S.cur];let el=main&&main.querySelector('.pet-float');
  const hb=document.querySelector('.pet-btn');
  if(!main||!petFloatOn(c)){if(el)el.remove();if(hb)hb.hidden=false;return}
  if(hb)hb.hidden=true;
  const o=petOpts(c,null,true),sig=JSON.stringify(o);
  if(!el){el=document.createElement('div');el.className='pet-float';el.setAttribute('role','button');el.setAttribute('aria-label',(c.pet.name||'Серийчик')+' — перетащи, нажми, чтобы погладить, удерживай, чтобы открыть');main.appendChild(el);pfDrag(el);
    const same=S.pfLast===S.cur;S.pfLast=S.cur;if(same)el.classList.add('now');
    requestAnimationFrame(()=>{const B=pfBounds(main),p=store.get('pfp',null);pfPlace(el,p?B.l+p.x*(B.r-B.l):B.r,p?B.t+p.y*(B.b-B.t):B.b);el.classList.add('in');requestAnimationFrame(()=>el.classList.remove('now'))});
    if(!store.get('pfhint',0)){store.set('pfhint',1);setTimeout(()=>toast(`${c.pet.name||'Серийчик'} гуляет по чату: перетащи его куда хочешь, нажми — погладить, удерживай — открыть`,5000),900)}}
  if(el.dataset.sig!==sig){el.dataset.sig=sig;el.innerHTML=PET.petSVG(o)+'<span class="pf-hearts"></span>'}
}
function pfDrag(el){
  let sx,sy,ox,oy,moved=false,down=false,lp=0,last=[],tx=0;
  const look=(e)=>{const r=el.getBoundingClientRect();el.style.setProperty('--lx',Math.max(-1,Math.min(1,(e.clientX-r.left-PF/2)/120)).toFixed(2));el.style.setProperty('--ly',Math.max(-1,Math.min(1,(e.clientY-r.top-PF/2)/120)).toFixed(2))};
  el.addEventListener('pointerdown',e=>{if(e.button)return;down=true;moved=false;sx=e.clientX;sy=e.clientY;ox=el._x||0;oy=el._y||0;last=[[e.clientX,e.clientY,e.timeStamp]];
    el.setPointerCapture(e.pointerId);el.classList.add('held');el.classList.remove('snap');
    lp=setTimeout(()=>{if(!moved){down=false;el.classList.remove('held');navigator.vibrate&&navigator.vibrate(12);petSheet()}},480)});
  el.addEventListener('pointermove',e=>{if(!down)return;const dx=e.clientX-sx,dy=e.clientY-sy;
    if(!moved&&Math.hypot(dx,dy)>6){moved=true;clearTimeout(lp);el.classList.add('drag')}
    if(!moved)return;last.push([e.clientX,e.clientY,e.timeStamp]);if(last.length>5)last.shift();
    const vx=last.length>1?(last[last.length-1][0]-last[0][0])/Math.max(1,last[last.length-1][2]-last[0][2]):0;
    tx=Math.max(-25,Math.min(25,vx*14));el.style.setProperty('--tilt',tx.toFixed(1)+'deg');
    pfPlace(el,ox+dx,oy+dy,false)});
  const up=e=>{if(!down)return;down=false;clearTimeout(lp);el.classList.remove('held','drag');el.style.setProperty('--tilt','0deg');
    if(!moved){petPat(true);wsSend({t:'pat',chat:S.cur});return}
    /* fling: keep the speed for a moment, then spring to the nearest side */
    const a=last[0],b=last[last.length-1],dt=Math.max(1,b[2]-a[2]),vx=(b[0]-a[0])/dt,vy=(b[1]-a[1])/dt;
    const B=pfBounds(el.parentNode),px=el._x+vx*140,py=el._y+vy*140,x=px+PF/2<(B.l+B.r+PF)/2?B.l:B.r;
    const [fx,fy]=pfPlace(el,x,py,true);store.set('pfp',{x:B.r>B.l?(fx-B.l)/(B.r-B.l):1,y:B.b>B.t?(fy-B.t)/(B.b-B.t):1});navigator.vibrate&&navigator.vibrate(6)};
  el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
  el.addEventListener('contextmenu',e=>e.preventDefault());
  document.addEventListener('pointermove',e=>{if(!down&&el.isConnected)look(e)},{passive:true});
}
addEventListener('resize',()=>{const el=document.querySelector('.pet-float');if(el&&el.isConnected)pfPlace(el,el._x||0,el._y||0,false)});
function petSheet(tab){
  const c=S.chats[S.cur];if(!c||!c.pet||!window.PET)return;
  const P=PET,p=c.pet,days=petDays(c),st=P.stageOf(days),next=P.STAGES[st+1],mood=petMood(c),peer=peerOf(c);
  const groups={color:['Цвет',P.COLORS,'ember'],style:['Стиль',P.STYLES,'gloss'],hat:['Шапка',P.HATS,'none'],eyes:['Очки',P.EYES,'none'],neck:['Шея',P.NECK,'none'],fx:['Эффект',P.FX,'none']};
  S.petTab=tab||S.petTab||'color';if(!groups[S.petTab])S.petTab='color';
  const grpPet=c.type!=='dm';
  const moodText={happy:grpPet?'Счастлив — сегодня тут уже общались 💕':'Счастлив — вы оба написали сегодня 💕',wait:grpPet?'Ждёт, когда напишет ещё кто-нибудь (нужно хотя бы двое)':(c.streak&&c.streak.me&&c.streak.me.includes(S.me.id)?`Ждёт, когда напишет ${esc(nm(peer))}`:'Ждёт твоего сообщения'),sleep:c.streak?'Спит — сегодня ещё никто не написал':'Загрустил: серия прервалась. Напишите друг другу, чтобы он проснулся'}[mood];
  const [,T,def]=groups[S.petTab],cur=p[S.petTab]||def,best=p.best||0;
  const items=Object.keys(T).map(k=>{const it=T[k],lock=(it.need||0)>best,o=Object.assign(petOpts(c,'wait',true),{days:Math.max(days,8)});if(S.petTab!=='fx')o.fx='none';o[S.petTab]=k;
    return `<button class="pet-it ${cur===k?'on':''} ${lock?'lock':''}" data-act="petset" data-k="${S.petTab}" data-v="${k}" ${lock?`title="Откроется на ${it.need}-й день"`:''}>${P.petSVG(o)}<small>${esc(it.n)}</small>${lock?`<i class="pet-lock">🔒 ${it.need} дн.</i>`:''}</button>`}).join('');
  const fl=store.get('petfloat','on')==='on';
  sheet(`<div class="pet-hero ${mood}" data-act="petpat" id="petHero">${petSvgOf(c,null,true)}<span class="pet-hearts" id="petHearts"></span></div>
    <div class="pet-name"><input class="input" id="petName" maxlength="20" value="${esc(p.name||'Серийчик')}" aria-label="Имя питомца"><button class="gbtn" data-act="petname" aria-label="Сохранить имя">${ic('check')}</button></div>
    <p class="pet-mood">${moodText}</p>
    <div class="pet-stat"><span>${esc(P.STAGES[st].n)}</span><b>${fire(c,false)||'🔥 '+((c.streak&&c.streak.n)||0)}</b><span>Рекорд: ${best} дн.</span></div>
    ${next?`<div class="pet-prog"><i style="width:${Math.min(100,Math.round(days/next.from*100))}%"></i></div><p class="pet-mood dim">Ещё ${next.from-days} дн. подряд — и станет «${esc(next.n)}»</p>`:'<p class="pet-mood dim">Максимальная стадия — Легенда ✨</p>'}
    <div class="set-row pet-walk"><span class="mid"><b>Гуляет по чату</b><small>Перетаскивай его пальцем куда угодно</small></span><button class="sw ${fl?'on':''}" data-act="petfloat" role="switch" aria-checked="${fl}" aria-label="Гуляет по чату"><i></i></button></div>
    <div class="seg pet-tabs">${Object.entries(groups).map(([k,[n]])=>`<button class="${S.petTab===k?'on':''}" data-act="pettab" data-v="${k}">${n}</button>`).join('')}</div>
    <div class="pet-grid">${items}</div>
    <div class="btns"><button class="gbtn" data-act="petrand">🎲 Случайный образ</button></div>
    <p class="pet-mood dim">Нажми на питомца — погладить, поводи пальцем — он следит глазами. Наряд видят все в чате.</p>`);
  petTilt($('#petHero'));
}
/* the big pet turns in 3D after the finger and looks at it */
function petTilt(h){if(!h)return;
  const set=(x,y)=>{h.style.setProperty('--rx',(y*-16).toFixed(1)+'deg');h.style.setProperty('--ry',(x*20).toFixed(1)+'deg');h.style.setProperty('--lx',x.toFixed(2));h.style.setProperty('--ly',y.toFixed(2))};
  const mv=e=>{const r=h.getBoundingClientRect();set(Math.max(-1,Math.min(1,(e.clientX-r.left)/r.width*2-1)),Math.max(-1,Math.min(1,(e.clientY-r.top)/r.height*2-1)))};
  h.addEventListener('pointermove',mv);h.addEventListener('pointerdown',mv);
  h.addEventListener('pointerleave',()=>{h.classList.add('back');set(0,0);setTimeout(()=>h.classList.remove('back'),500)});
}
/* fire streak: shown from 3 days in a row; dimmed with an hourglass if nobody wrote today yet */
function fire(c,big){
  const s=c&&c.streak;
  /* the streak is shown by the pet itself: it and the fire are the same thing */
  if(c&&c.pet&&s&&s.n>=1&&!big)return `<span class="fire petf ${s.today?'':'cold'}" title="${esc(c.pet.name||'Серийчик')}: ${s.n} дн. подряд${s.today?'':' — напишите сегодня!'}">${petSvgOf(c)}${s.n}${s.today?'':'⏳'}</span>`;
  if(!s||s.n<3)return '';
  return `<span class="fire ${s.today?'':'cold'} ${big?'big':''}" title="${s.today?`Огонёк: ${s.n} дн. подряд`:'Напишите сегодня, чтобы огонёк не погас'}">🔥${s.n}${s.today?'':'⏳'}</span>`;
}
const tm=ts=>new Date(ts).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
function shortWhen(ts){
  const d=new Date(ts),n=new Date();
  if(d.toDateString()===n.toDateString())return tm(ts);
  const y=new Date(n);y.setDate(n.getDate()-1);if(d.toDateString()===y.toDateString())return 'вчера';
  if(n-d<6*864e5)return d.toLocaleDateString('ru-RU',{weekday:'short'});
  return d.toLocaleDateString('ru-RU',{day:'numeric',month:'short'});
}
function dayLabel(ts){
  const d=new Date(ts),n=new Date();if(d.toDateString()===n.toDateString())return 'Сегодня';
  const y=new Date(n);y.setDate(n.getDate()-1);if(d.toDateString()===y.toDateString())return 'Вчера';
  return d.toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:d.getFullYear()===n.getFullYear()?undefined:'numeric'});
}
function seen(u){
  if(!u)return '';if(u.online)return 'в сети';if(!u.lastSeen)return 'не в сети';
  const m=Math.round((Date.now()-u.lastSeen)/60e3);
  if(m<1)return 'был(а) только что';if(m<60)return `был(а) ${m} мин назад`;
  return 'был(а) '+(Date.now()-u.lastSeen<864e5?'сегодня в '+tm(u.lastSeen):shortWhen(u.lastSeen));
}
const durText=s=>s<60?`${s} с`:`${Math.floor(s/60)} мин ${s%60?s%60+' с':''}`.trim();
function lastText(m){
  if(!m)return 'Нет сообщений';if(m.del)return 'Сообщение удалено';if(m.sys)return m.sys;
  if(m.call)return (m.call.kind==='video'?'📹 ':'📞 ')+(m.call.group?'Групповой звонок'+(m.call.dur?', '+durText(m.call.dur):''):m.call.missed?'Пропущенный звонок':'Звонок, '+durText(m.call.dur));
  const who=m.from===S.me.id?'Вы: ':'';if(m.sticker)return who+'Стикер';
  if(m.once)return who+'🔥 '+ONCE_K[m.once.k][1]+' · 1 просмотр';
  if(m.media)return who+({voice:'🎤 Голосовое',round:'⭕ Видеосообщение',video:'🎬 Видео'}[m.media.k]||'')+(m.media.dur?' '+clock(m.media.dur):'')+(m.text?' '+m.text:'');if(m.story&&!m.text)return who+'Ответ на историю';return who+(m.img&&!m.text?'📷 Фото':(m.img?'📷 ':'')+m.text);
}
const sortedChats=()=>Object.values(S.chats).filter(c=>c.type!=='channel').sort((a,b)=>(b.type==='self')-(a.type==='self')||((b.last&&b.last.ts)||b.created)-((a.last&&a.last.ts)||a.created));

/* ---------- theme ---------- */
function applyTheme(){
  const t=store.get('theme','auto'),light=t==='light'||(t==='auto'&&matchMedia('(prefers-color-scheme: light)').matches);
  document.documentElement.classList.toggle('light',light);
  $('.wall').dataset.w=store.get('wall','slate');
  document.querySelector('meta[name=theme-color]').content=light?'#e4e6ea':'#1a1b1e';
}
matchMedia('(prefers-color-scheme: light)').addEventListener('change',applyTheme);
applyTheme();

/* ---------- sounds (generated, no files) ---------- */
let AC=null;
const ac=()=>{if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(AC&&AC.state==='suspended')AC.resume();return AC};
addEventListener('pointerdown',ac,{once:true});
function beep(freqs,dur=.12,gap=.02,vol=.08){
  const a=ac();if(!a)return;let t=a.currentTime;
  for(const f of freqs){const o=a.createOscillator(),g=a.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g).connect(a.destination);o.start(t);o.stop(t+dur+.02);t+=dur+gap}
}
let ringT=null;
function ring(kind){stopRing();const f=()=>kind==='in'?beep([784,988,784,988],.16,.04,.12):beep([440,440],.35,.25,.06);f();ringT=setInterval(f,kind==='in'?1800:2600)}
function stopRing(){clearInterval(ringT);ringT=null}

/* ---------- notifications ---------- */
/* a notification from the open page: used by the computer app (and browsers without push) when the window is in the background */
const IS_DESKTOP=/Electron\//.test(navigator.userAgent);
function notify(title,body,tag,chat){
  const away=document.hidden||!document.hasFocus();
  if(!('Notification' in window)||Notification.permission!=='granted'||!away||S.pushOn)return; /* with push on, the server sends it */
  if(chat&&S.chats[chat]&&S.chats[chat].muted)return;
  try{const n=new Notification(title,{body,tag,icon:'/icon-192.png',silent:false,requireInteraction:tag==='call'||tag==='gcall'});
    n.onclick=()=>{try{window.mnDesktop&&window.mnDesktop.show()}catch(e){}focus();n.close();if(chat&&S.chats[chat]&&S.cur!==chat){if(S.chats[chat].server)S.view=S.chats[chat].server;openChat(chat)}}}catch(e){}
}
function updateTitle(){const n=Object.values(S.chats).reduce((a,c)=>a+(c.unread||0),0);document.title=n?`(${n}) Manasenger`:'Manasenger'}

/* =================================================================== AUTH */
let authMode='login';
function viewAuth(){
  $('#app').className='auth';
  $('#app').innerHTML=`<form class="card glass" id="authForm" autocomplete="on">
    <img decoding="async" class="logo" src="/icon-192.png" alt="">
    <h1>Manasenger</h1><p>Сообщения, звонки, серверы и стикеры</p>
    <div class="seg" role="tablist"><button type="button" class="${authMode==='login'?'on':''}" data-act="amode" data-m="login">Вход</button><button type="button" class="${authMode==='reg'?'on':''}" data-act="amode" data-m="reg">Регистрация</button></div>
    ${authMode==='reg'?`<label class="field"><span>Имя</span><input class="input" name="name" maxlength="40" placeholder="Как тебя зовут" autocomplete="name"></label>`:''}
    <label class="field"><span>Логин</span><input class="input" name="username" required maxlength="20" placeholder="например, olya_p" autocomplete="username" autocapitalize="none" spellcheck="false"></label>
    <label class="field"><span>Пароль</span><input class="input" name="password" type="password" required minlength="6" placeholder="минимум 6 символов" autocomplete="${authMode==='reg'?'new-password':'current-password'}"></label>
    <div class="err" id="authErr"></div>
    <button class="gbtn primary" id="authGo">${authMode==='reg'?'Создать аккаунт':'Войти'}</button>
  </form>`;
}
async function authSubmit(f){
  const d=Object.fromEntries(new FormData(f)),b=$('#authGo');b.disabled=true;$('#authErr').textContent='';
  if(authMode==='reg'&&!/^[a-zA-Z0-9_]{3,20}$/.test(d.username||'')){$('#authErr').textContent='Логин: 3–20 символов, латиница, цифры и _';b.disabled=false;return}
  try{const r=await api(authMode==='reg'?'/api/register':'/api/login',d);if(r&&r.token)store.set('tok',r.token);await boot()}
  catch(e){$('#authErr').textContent=e.message;b.disabled=false}
}

/* =================================================================== BOOT */
async function boot(){
  let r;try{r=await api('/api/me')}catch(e){$('#app').innerHTML=`<div class="auth"><div class="card glass empty"><b>Нет связи</b>Проверь интернет и обнови страницу.</div></div>`;return}
  if(!r.me){
    /* the browser lost its sign-in (cleared cookies, a new app window): sign back in with the one kept on this device */
    const t=store.get('tok','');
    if(t&&!S.restoring){S.restoring=1;try{const x=await api('/api/session/restore',{token:t});if(x.ok)return boot()}catch(e){}}
    viewAuth();return}
  if(!store.get('tok',''))api('/api/session/keep',{}).then(x=>{if(x.token)store.set('tok',x.token)}).catch(()=>{});
  S.me=r.me;S.chats={};r.chats.forEach(c=>S.chats[c.id]=c);r.users.forEach(u=>S.users[u.id]=u);S.users[S.me.id]=S.me;
  S.servers={};(r.servers||[]).forEach(g=>S.servers[g.id]=g);setMe(r);loadStories();
  $('#app').className='app';applyAppWall();
  renderShell();connect();updateTitle();
  if(hashTab())return;
  const h=location.hash.slice(1),jm=/^join\/([\w-]{4,20})$/.exec(h);
  if(jm){history.replaceState(null,'',location.pathname);joinSheet(jm[1]);return}
  const pm=/^pack\/(p[\w-]{4,20})$/.exec(h);if(pm){history.replaceState(null,'',location.pathname);packPreview(pm[1]);return}
  const cm=/^chat=([\w-]+)$/.exec(h),km=/^call=([\w-]+)(&a=1)?$/.exec(h),gm=/^gcall=([\w-]+)(&a=1)?$/.exec(h);
  if(cm||km||gm)history.replaceState(null,'',location.pathname);
  if(gm&&S.chats[gm[1]]){const gc=S.chats[gm[1]];if(gc.server)S.view=gc.server;openChat(gm[1]);if(gm[2]&&gc.gcall)gcStart(gm[1],gc.gcall.kind);else if(gm[2])S.gcallAct={chat:gm[1],answer:true}}
  if(km)S.callAct={id:km[1],answer:!!km[2]}; /* opened from a call notification: the call arrives over the connection */
  const open=cm?cm[1]:h;
  if(open&&S.chats[open]){if(S.chats[open].server)S.view=S.chats[open].server;openChat(open)}
  pushSetup();
}
/* ---------- push notifications ---------- */
const PUSH_OK=!/Electron\//.test(navigator.userAgent)&&'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;
function b64u(s){const p='='.repeat((4-s.length%4)%4),b=atob((s+p).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(b,c=>c.charCodeAt(0))}
async function pushSubscribe(){
  if(!PUSH_OK||Notification.permission!=='granted')return false;
  try{
    const reg=await navigator.serviceWorker.ready,{key}=await api('/api/push/key');if(!key)return false;
    let sub=await reg.pushManager.getSubscription();
    if(sub&&sub.options&&sub.options.applicationServerKey){const a=new Uint8Array(sub.options.applicationServerKey),b=b64u(key);if(a.length!==b.length||a.some((x,i)=>x!==b[i])){await sub.unsubscribe();sub=null}}
    if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64u(key)});
    await api('/api/push/sub',{sub:sub.toJSON()});S.pushOn=true;return true;
  }catch(e){console.warn('push',e);return false}
}
async function pushEnable(){
  if(!('Notification' in window)){toast(/iP(hone|ad)/.test(navigator.userAgent)?'На iPhone: сначала «На экран „Домой“», потом откройте Manasenger оттуда':'Этот браузер не умеет уведомления');return}
  let p=Notification.permission;
  if(p==='default'){
    /* the browser shows its own small window: point at it, people miss it */
    const hint=setTimeout(()=>toast(touch?'Нажмите «Разрешить» в окне, которое появилось на экране':'👆 Нажмите «Разрешить» в окошке браузера вверху слева, у адресной строки',8000),400);
    try{p=await Notification.requestPermission()}catch(e){}clearTimeout(hint);
    if(p==='default'){notifHelp('default');return}
  }
  if(p==='denied'){notifHelp('denied');renderPushAsk();return}
  if(p==='granted'){
    if(!PUSH_OK){toast(IS_DESKTOP?'Уведомления включены 🔔':'Уведомления будут, пока Manasenger открыт');renderPushAsk();return}
    if(await pushSubscribe())toast('Уведомления включены 🔔');else toast('Не получилось подключить уведомления. Нажми «Проверить» в настройках');
  }
  else if(p==='denied')toast('Уведомления запрещены в настройках браузера для этого сайта');
  renderPushAsk();
}
function renderPushAsk(){
  let el=$('#pushask');
  const perm='Notification' in window?Notification.permission:'denied';
  const need=S.me&&perm==='default'&&Date.now()-store.get('pushNo',0)>3*864e5;
  if(!need){if(el)el.remove();return}
  if(el)return;
  el=document.createElement('div');el.id='pushask';el.className='pushask glass';
  el.innerHTML=`<span>🔔</span><span class="mid"><b>Включить уведомления?</b><small>Сообщения и звонки — даже когда Manasenger закрыт</small></span><button class="gbtn primary" data-act="pushon">Включить</button><button class="x" data-act="pushno" aria-label="Не сейчас">${ic('x')}</button>`;
  document.body.appendChild(el);
}
/* the browser didn't show the question or it was blocked: how to turn notifications on by hand */
function notifHelp(kind){
  const desk=!touch,apk=/Android/.test(navigator.userAgent);
  sheet(`<h2>🔔 Как включить уведомления</h2>
    <p class="sub">${kind==='denied'?'Уведомления для Manasenger запрещены в настройках браузера. Их можно разрешить так:':'Браузер не показал вопрос (так бывает, если он «приглушил» запросы). Разрешите вручную:'}</p>
    ${desk?`<ol class="help-ol"><li>Слева от адреса сайта нажмите значок <b>🔒</b> (или <b>⚙</b>)</li><li>Найдите <b>Уведомления</b> и выберите <b>Разрешить</b></li><li>Обновите страницу (F5)</li></ol>
      <p class="sub">Или установите программу Manasenger для Windows — в ней уведомления работают сразу: Настройки → Приложение.</p>`
    :apk?`<ol class="help-ol"><li>Откройте <b>Настройки телефона → Приложения → Manasenger</b> (или Chrome, если открываете в браузере)</li><li><b>Уведомления → Разрешить</b></li><li>Вернитесь в Manasenger и нажмите «Включить» ещё раз</li></ol>`
    :`<ol class="help-ol"><li>Добавьте Manasenger на экран «Домой» (Safari → Поделиться → На экран «Домой»)</li><li>Откройте его с иконки и нажмите «Включить»</li></ol>`}
    <div class="btns"><button class="gbtn primary" data-act="notifretry">Проверить ещё раз</button></div>`);
}
async function pushTest(){
  if(!('Notification' in window)||Notification.permission!=='granted'){await pushEnable();return}
  if(!PUSH_OK){new Notification('Manasenger',{body:'🔔 Уведомления работают!',icon:'/icon-192.png'});return}
  const ok=await pushSubscribe();
  try{const r=await api('/api/push/test',{});
    if(!ok||!r.sent)toast('Это устройство не подключилось к уведомлениям. Проверь, что уведомления разрешены для Manasenger в настройках телефона');
    else if(r.results.every(x=>x===201||x===200))toast('Отправили проверочное уведомление 🔔 Оно придёт через пару секунд');
    else toast('Сервис уведомлений ответил: '+r.results.join(', '));
  }catch(e){toast(e.message)}
}
function pushSetup(){
  if(!PUSH_OK){if(IS_DESKTOP&&'Notification' in window&&Notification.permission==='default')Notification.requestPermission().catch(()=>{});return}
  if(Notification.permission==='granted')pushSubscribe();else setTimeout(renderPushAsk,1200);
  navigator.serviceWorker.addEventListener('message',e=>{
    const m=e.data||{};
    if(m.t==='notif-chat'&&S.chats[m.chat]){if(S.chats[m.chat].server)S.view=S.chats[m.chat].server;openChat(m.chat)}
    if(m.t==='notif-gcall'&&S.chats[m.chat]){const c=S.chats[m.chat];if(c.server)S.view=c.server;openChat(m.chat);if(m.answer)gcStart(m.chat,(c.gcall&&c.gcall.kind)||'audio')}
    if(m.t==='live-hangup'){liveHangup();return}
    if(m.t==='notif-call'){if(CALL&&CALL.id===m.callId&&CALL.state==='ringing'){if(m.answer)acceptCall()}else S.callAct={id:m.callId,answer:m.answer}}
  });
}
/* the server sends notifications only while Manasenger is not on screen */
const sendVis=()=>wsSend({t:'vis',v:!document.hidden&&document.hasFocus()});
['visibilitychange','focus','blur'].forEach(ev=>(ev==='visibilitychange'?document:window).addEventListener(ev,sendVis));
function setMe(r){if(!ICE)setTimeout(()=>iceServers().catch(()=>{}),2500); /* call relays are fetched ahead, so the first call starts without waiting */
  if('ann' in r)showAnn(r.ann);if(!IOS)setTimeout(()=>{mapRefresh();if(store.get('geoShare',false))geoStart()},800);S.packs=r.packs||[];S.contacts=r.contacts||{};S.stars=new Set(r.stars||[]);if(r.tz!=null)S.tz=r.tz;if(S.pk!=='emoji'&&S.packs.length&&!S.packs.some(p=>p.id===S.pk))S.pk=S.packs[0].id}
function renderShell(){
  $('#app').innerHTML=`<nav class="rail glass" id="rail" aria-label="Серверы"></nav><aside class="side glass" id="side"></aside><main class="main glass" id="main"></main>`;
  renderRail();renderSide();renderMain();
}

/* =================================================================== SIDEBAR */
let sideQ=0;
function renderSide(){if(sideQ)return;sideQ=requestAnimationFrame(()=>{sideQ=0;renderSideNow();renderRail()})}
function renderSideNow(){
  const el=$('#side');if(!el)return;queueSync();
  el.classList.toggle('has-voice',!!VC);
  if(S.view!=='home'&&S.servers[S.view]){el.innerHTML=serverSideHTML(S.servers[S.view])+voicePanelHTML();return}
  S.view='home';
  const keep=document.activeElement&&document.activeElement.id==='q';
  const head={calls:'Звонки',contacts:'Контакты',ai:'ИИ-помощник'}[S.tab]||'Чаты';
  const btns=S.tab==='ai'?'':S.tab==='contacts'?`<button class="gbtn ic" data-act="addcontact" title="Добавить контакт" aria-label="Добавить контакт">${ic('addUser')}</button>`
    :`<button class="gbtn ic" data-act="newgroup" title="Новая группа" aria-label="Новая группа">${ic('users')}</button>
      <button class="gbtn ic" data-act="newchat" title="Новый чат" aria-label="Новый чат">${ic('edit')}</button>`;
  el.innerHTML=`<div class="side-h"><h1>${head}</h1>${btns}</div>
    ${S.tab!=='calls'&&S.tab!=='ai'?`<label class="search">${ic('search')}<input id="q" placeholder="${S.tab==='contacts'?'Поиск по контактам':'Поиск или @логин'}" value="${esc(S.q)}" autocomplete="off" spellcheck="false"></label>`:''}
    <div class="list" id="list">${S.tab==='chats'?storiesRowHTML()+chatListHTML():S.tab==='contacts'?contactsHTML():S.tab==='ai'?aiHTML():callsHTML()}</div>
    <nav class="tabbar glass pill">
      <button class="${S.tab==='chats'?'on':''}" data-act="tab" data-t="chats">${ic('chats')}<span>Чаты</span></button>
      <button class="${S.tab==='contacts'?'on':''}" data-act="tab" data-t="contacts">${ic('contact')}<span>Контакты</span></button>
      <button class="${S.tab==='calls'?'on':''}" data-act="tab" data-t="calls">${ic('calls')}<span>Звонки</span></button>
      ${IOS?'':`<button data-act="map">${ic('pin')}<span>Карта</span>${mapBadge()}</button>
      <button class="${S.tab==='ai'?'on':''}" data-act="tab" data-t="ai"><span class="tt-ic">✦</span><span>ИИ</span></button>`}
      <button data-act="settings">${S.me.avatar?avatar(S.me,'xs',false):ic('gear')}<span>Профиль</span></button></nav>${voicePanelHTML()}`;
  if(keep){const i=$('#q');i.focus();i.setSelectionRange(i.value.length,i.value.length)}
  const l=$('#list');
  if(LAST_TAB!==S.tab){const order=['chats','contacts','calls','ai'],a=order.indexOf(LAST_TAB),b=order.indexOf(S.tab);
    TAB_ANIM=a>=0&&b>=0?{c:b>a?'tab-in-r':'tab-in-l',t:Date.now()}:null;LAST_TAB=S.tab}
  if(l&&TAB_ANIM&&Date.now()-TAB_ANIM.t<120)l.classList.add(TAB_ANIM.c);
}
let LAST_TAB='chats',TAB_ANIM=null;
function chatListHTML(){
  const q=S.q.trim().toLowerCase().replace(/^@/,'');
  let list=sortedChats();
  if(q)list=list.filter(c=>chatName(c).toLowerCase().includes(q)||(c.type==='dm'&&(peerOf(c).username||'').includes(q)));
  let h=list.map(c=>{
    const typ=S.typing[c.id]&&Object.keys(S.typing[c.id]).length;
    return `<button class="row ${S.cur===c.id?'on':''}" data-act="open" data-id="${c.id}">${chatAvatar(c)}
      <span class="mid"><span class="top"><span class="nm">${esc(chatName(c))}</span>${fire(c)}<span class="tm">${c.last?shortWhen(c.last.ts):''}</span></span>
      <span class="sub"><span class="lm">${typ?'<i style="color:#9fbaff">печатает…</i>':esc(lastText(c.last))}</span>${c.muted?'<span class="mutedi" title="Без звука">🔕</span>':''}${c.unread?`<span class="badge${c.muted?' mut':''}">${c.unread>99?'99+':c.unread}</span>`:''}</span></span></button>`}).join('');
  if(q.length>=2){
    const known=new Set(list.filter(c=>c.type==='dm').map(c=>peerOf(c).id));
    const ppl=S.found.filter(u=>!known.has(u.id));
    if(ppl.length)h+=`<div class="section-t">Люди</div>`+ppl.map(u=>`<button class="row" data-act="dm" data-id="${u.id}">${avatar(u)}<span class="mid"><span class="top"><span class="nm">${esc(nm(u))}</span></span><span class="sub"><span class="lm">@${esc(u.username)}</span></span></span></button>`).join('');
  }
  if(!h)h=q?`<div class="empty">Никого не нашли по «${esc(S.q)}»</div>`:`<div class="empty"><b>Пока пусто</b>Найди друга по логину в поиске или нажми ${ic('edit')} вверху.<br><br>Твой логин: <b style="display:inline">@${esc(S.me.username)}</b></div>`;
  return h;
}
function callsHTML(){
  if(!S.calls){loadCalls();return '<div class="empty">Загружаем…</div>'}
  if(!S.calls.length)return `<div class="empty"><b>Звонков ещё не было</b>Открой чат и нажми ${ic('phone')} или ${ic('video')}</div>`;
  return S.calls.map(c=>{const u=S.users[c.user];if(!u)return '';
    return `<div class="row"><span style="display:contents">${avatar(u)}</span>
      <button class="mid" style="text-align:left" data-act="open" data-id="${c.chat}"><span class="top"><span class="nm" style="${c.missed&&!c.out?'color:#ff8a94':''}">${esc(nm(u))}</span><span class="tm">${shortWhen(c.ts)}</span></span>
      <span class="sub"><span class="lm">${c.out?'↗ Исходящий':'↙ Входящий'} ${c.kind==='video'?'видеозвонок':'звонок'}${c.missed?' · без ответа':' · '+durText(c.dur)}</span></span></button>
      <button class="gbtn ic" data-act="callu" data-chat="${c.chat}" data-k="${c.kind}" aria-label="Позвонить">${ic(c.kind==='video'?'video':'phone')}</button></div>`}).join('');
}
async function loadCalls(){try{const r=await api('/api/calls');r.users.forEach(u=>S.users[u.id]=Object.assign(S.users[u.id]||{},u));S.calls=r.calls}catch(e){S.calls=[]}if(S.tab==='calls')renderSide()}
/* ---------- contacts ---------- */
function contactsHTML(){
  const q=S.q.trim().toLowerCase().replace(/^@/,'');
  let l=Object.entries(S.contacts).map(([id,name])=>({u:S.users[id]||{id,name,color:'#5f7fa8',username:''},name}));
  if(q)l=l.filter(x=>x.name.toLowerCase().includes(q)||(x.u.username||'').includes(q));
  l.sort((a,b)=>(b.u.online-a.u.online)||a.name.localeCompare(b.name,'ru'));
  const add=`<button class="row add-row" data-act="addcontact"><span class="ava s add">${ic('addUser')}</span><span class="mid"><span class="nm">Добавить контакт</span></span></button>`;
  if(!l.length)return add+(q?`<div class="empty">Никого не нашли</div>`:`<div class="empty"><b>Контактов пока нет</b>Добавь человека по логину и запиши под удобным именем. Ещё можно открыть профиль в чате и нажать «В контакты».</div>`);
  return add+l.map(({u,name})=>`<button class="row" data-act="contact" data-id="${u.id}">${avatar(u)}<span class="mid"><span class="top"><span class="nm">${esc(name)}</span></span><span class="sub"><span class="lm">${u.username?'@'+esc(u.username)+' · ':''}${esc(seen(u))}</span></span></span></button>`).join('');
}
function addContactSheet(u){
  const has=u&&S.contacts[u.id];
  sheet(`<h2>${has?'Изменить контакт':'Новый контакт'}</h2><p class="sub">${u?'Запиши под удобным для тебя именем — так он будет подписан в чатах':'Введи логин человека и как его записать'}</p>
    ${u?`<div class="row" style="padding:6px 0 12px">${avatar(u)}<span class="mid"><span class="nm">${esc(u.name)}</span><span class="sub"><span class="lm">@${esc(u.username||'')}</span></span></span></div>`
      :`<label class="field"><span>Логин</span><input class="input" id="clogin" placeholder="@логин" autocomplete="off" autocapitalize="none" spellcheck="false"></label>`}
    <label class="field"><span>Как записать</span><input class="input" id="cname" maxlength="40" placeholder="Например, Мама или Саша работа" value="${esc(has?S.contacts[u.id]:u?u.name:'')}"></label>
    <div class="btns">${has?`<button class="gbtn danger" data-act="delcontact" data-id="${u.id}">Удалить</button>`:''}<button class="gbtn" data-act="closemenu">Отмена</button><button class="gbtn primary" data-act="savecontact" data-id="${u?u.id:''}">Сохранить</button></div>`);
  setTimeout(()=>{const i=u?$('#cname'):$('#clogin');if(i&&!touch)i.focus()},50);
}
async function saveContact(id){
  try{
    if(!id){const l=($('#clogin').value||'').trim();if(!l){toast('Введи логин');return}const r=await api('/api/users/find?u='+encodeURIComponent(l));S.users[r.user.id]=Object.assign(S.users[r.user.id]||{},r.user);id=r.user.id;if(id===S.me.id){toast('Это ты 🙂');return}}
    const r=await api('/api/contacts',{userId:id,name:$('#cname').value});S.contacts=r.contacts;S.users[r.user.id]=Object.assign(S.users[r.user.id]||{},r.user);
    closeLayer();toast('Контакт сохранён');renderSide();if(S.cur)renderMain();
  }catch(e){toast(e.message)}
}
function contactSheet(id){
  const u=S.users[id];if(!u)return;
  sheet(`<div class="prof">${avatar(u,'xl')}<h3>${esc(nm(u))}</h3><small>${nm(u)!==u.name?esc(u.name)+' · ':''}@${esc(u.username||'')} · ${esc(seen(u))}</small>${u.bio?`<p style="margin:8px 0 0">${esc(u.bio)}</p>`:''}</div>
    <div class="btns" style="justify-content:center"><button class="gbtn" data-act="dm" data-id="${u.id}">${ic('chats')}Написать</button><button class="gbtn" data-act="callid" data-id="${u.id}" data-k="audio">${ic('phone')}</button><button class="gbtn" data-act="callid" data-id="${u.id}" data-k="video">${ic('video')}</button><button class="gbtn" data-act="editcontact" data-id="${u.id}">${ic('edit')}</button></div>`);
}
let qT;async function searchUsers(){
  const q=S.q.trim();if(q.replace(/^@/,'').length<2){S.found=[];return}
  try{const r=await api('/api/users/search?q='+encodeURIComponent(q));if(q===S.q.trim()&&S.tab==='chats'){S.found=r.users;$('#list').innerHTML=storiesRowHTML()+chatListHTML()}}catch(e){}
}

/* =================================================================== CHAT */
function renderMain(){
  const el=$('#main');if(!el)return;queueSync();
  const c=S.chats[S.cur];
  $('#app').classList.toggle('open',!!c);
  if(!c){el.innerHTML=`<div class="nochat">${avatar(S.me,'l',false)}<b style="font-size:20px;display:block;margin-bottom:6px">Привет, ${esc(S.me.name)}!</b>Выбери чат слева или найди друга по логину.<br>Твой логин: <b>@${esc(S.me.username)}</b></div>`;return}
  el.innerHTML=`<div class="chat-bg" id="chatbg"></div><header class="chat-h glass pill">
      <button class="gbtn ic back" data-act="back" aria-label="Назад">${ic('back')}</button>
      <button class="who" data-act="info">${chatAvatar(c,'s')}<span style="min-width:0"><b>${esc(chatName(c))}</b><small id="status"></small></span></button>
      ${c.type==='self'?`<button class="gbtn ic" data-act="starred" title="Важное" aria-label="Важное">${ic('star')}</button>`:''}
      ${c.pet&&(c.type==='dm'||c.petOn)?`<button class="pet-btn ${petMood(c)}" data-act="pet" title="${esc(c.pet.name||'Серийчик')}" aria-label="Питомец">${petSvgOf(c)}</button>`:''}
      ${c.type==='group'||c.type==='channel'?`<button class="gbtn ic" data-act="gcall" data-k="audio" title="Групповой звонок" aria-label="Групповой звонок">${ic('phone')}</button><button class="gbtn ic" data-act="gcall" data-k="video" title="Групповой видеозвонок" aria-label="Групповой видеозвонок">${ic('video')}</button>`:''}
      ${c.type==='dm'?`<button class="gbtn ic" data-act="call" data-k="audio" title="Аудиозвонок" aria-label="Аудиозвонок">${ic('phone')}</button><button class="gbtn ic" data-act="call" data-k="video" title="Видеозвонок" aria-label="Видеозвонок">${ic('video')}</button>`:''}
      <button class="gbtn ic" data-act="chatmenu" aria-label="Ещё">${ic('more')}</button></header>
    <div id="gban"></div>
    <div class="msgs" id="msgs"></div>
    <div class="composer">
      <div id="stkp"></div>
      <div id="ctx"></div>
      <div class="comp-row">
        <button class="gbtn ic glass cbig" data-act="attach" title="Фото" aria-label="Прикрепить фото">${ic('clip')}</button>
        <div class="comp-in glass pill"><textarea id="txt" rows="1" placeholder="Сообщение" maxlength="4000" aria-label="Сообщение" enterkeyhint="send"></textarea>
 ${c.type!=='self'?`<button class="gbtn ic oncebtn ${S.once?'on':''}" data-act="once" title="На 1 просмотр" aria-label="На 1 просмотр"><b>1</b></button>`:''}
          <button class="gbtn ic stkbtn" data-act="stk" title="Стикеры" aria-label="Стикеры">${ic('smile')}</button>
          <button class="sendb" data-act="send" aria-label="Отправить">${ic('send')}</button>
          <button class="sendb recb" id="recb" data-kind="${S.recKind||'voice'}" aria-label="${(S.recKind||'voice')==='round'?'Видеосообщение':'Голосовое сообщение'}" title="Удерживай — запись, нажми — сменить голос/видео">${ic((S.recKind||'voice')==='round'?'camera':'mic')}</button></div>
      </div></div>
    <input type="file" id="file" accept="image/*,video/*" hidden>`;
  const t=$('#txt');t.value=S.draft[c.id]||'';autosize(t);compState();
  renderStatus();renderCtx();gcBanner();renderMsgs(true);applyChatWall(c.id);S.stk=false;
  if(c.type==='dm'){const o=peerOf(c);if((S.me.blocked||[]).includes(o.id)){const cp=document.querySelector('.composer');if(cp)cp.innerHTML=`<div class="blk-bar glass pill"><span>🚫 Вы заблокировали этого человека</span><button class="gbtn" data-act="block" data-id="${o.id}">Разблокировать</button></div>`}}
  petFloat();
  if(!mobile())t.focus();
}
function renderStatus(){
  const el=$('#status'),c=S.chats[S.cur];if(!el||!c)return;
  const ty=Object.keys(S.typing[c.id]||{});
  if(ty.length){el.className='typing';el.textContent=c.type==='dm'?'печатает…':`${ty.map(i=>nm(S.users[i])).join(', ')} печатает…`;return}
  if(c.type==='self'){el.className='';el.textContent='заметки и важное — видишь только ты';return}
  if(c.type==='dm'&&c.streak&&c.streak.n>=1&&c.pet){el.className='';el.innerHTML=`<span class="st-days">🔥${c.streak.n}${c.streak.today?'':'⏳'}</span> `+esc(seen(peerOf(c)));return}
  if(c.type==='channel'){el.className='';const g=S.servers[c.server];el.textContent=g?g.name+' · '+g.members.filter(i=>(S.users[i]||{}).online).length+' в сети':'';return}
  el.className='';el.textContent=c.type==='dm'?seen(peerOf(c)):`${c.members.length} участник${c.members.length%10===1&&c.members.length!==11?'':c.members.length%10>=2&&c.members.length%10<=4&&(c.members.length<12||c.members.length>14)?'а':'ов'}`;
}
async function openChat(id){
  if(S.chats[id]&&S.chats[id].server)S.view=S.chats[id].server;else if(S.chats[id])S.view='home';
  if(S.cur&&$('#txt'))S.draft[S.cur]=$('#txt').value;
  S.cur=id;S.reply=S.edit=null;
  history.replaceState(null,'','#'+id);
  const fresh=!$('#app').classList.contains('open');
  renderSide();renderMain();
  if(fresh&&mobile()&&!isLite()){const m=$('#main'),a=$('#app'),sd=$('#side');if(m){a.classList.add('peek','pushing');m.style.transition='none';m.style.transform='translate3d(100%,0,0)';
    if(sd){sd.style.transition='none';sd.style.transform='none'}void m.offsetWidth;
    m.style.transition='transform .42s cubic-bezier(.32,.72,0,1)';m.style.transform='translate3d(0,0,0)';if(sd){sd.style.transition='transform .42s cubic-bezier(.32,.72,0,1),filter .42s';sd.style.transform='translate3d(-28%,0,0)';sd.style.filter='brightness(.75)'}
    clearTimeout(S.pushT);S.pushT=setTimeout(()=>{m.style.transition='';m.style.transform='';if(sd){sd.style.transition='';sd.style.transform='';sd.style.filter=''}a.classList.remove('peek','pushing');petFloat()},430)}}
  if(!S.msgs[id]){
    try{const r=await api('/api/messages?chat='+id);S.msgs[id]=mergeMsgs(r.messages,S.msgs[id]);S.more[id]=r.more}catch(e){toast(e.message);S.msgs[id]=S.msgs[id]||[]}
    if(S.cur===id)renderMsgs(true);
  }
  markRead();
}
/* history that arrived from the server + anything sent or received while it was loading */
function mergeMsgs(loaded,live){
  if(!live||!live.length)return loaded;
  const ids=new Set(loaded.map(m=>m.id)),out=loaded.slice();
  live.forEach(m=>{if(!ids.has(m.id)&&!(m.pending&&loaded.some(x=>x.from===m.from&&x.text===m.text&&Math.abs(x.ts-m.ts)<15e3)))out.push(m)});
  return out.sort((a,b)=>a.ts-b.ts);
}
function closeChat(anim){if(anim===true&&mobile()&&!isLite()&&$('#main')&&!$('#app').classList.contains('peek')){
    const m=$('#main');$('#app').classList.add('peek');m.style.transition='transform .34s cubic-bezier(.32,.72,0,1)';m.style.transform='translate3d(100%,0,0)';
    const sd=$('#side');if(sd){sd.style.transform='translate3d(-28%,0,0)';sd.style.filter='brightness(.75)';sd.style.transition='none';requestAnimationFrame(()=>{sd.style.transition='transform .34s cubic-bezier(.32,.72,0,1),filter .34s';sd.style.transform='';sd.style.filter=''})}
    setTimeout(()=>{m.style.transition='';m.style.transform='';if(sd){sd.style.transition='';sd.style.transform='';sd.style.filter=''}$('#app').classList.remove('peek');closeChat(false)},330);return}
  if(S.cur&&$('#txt'))S.draft[S.cur]=$('#txt').value;S.cur=null;history.replaceState(null,'',location.pathname);renderSide();renderMain()}

/* who has read a message: everyone whose "read up to" time is at or after it */
function readers(c,m){const r=c.read||{};return c.members.filter(u=>u!==S.me.id&&u!==m.from&&(r[u]||0)>=m.ts)}
function readersSheet(cid,mid){
  const c=S.chats[cid],m=(S.msgs[cid]||[]).find(x=>x.id===mid);if(!c||!m)return;
  const yes=readers(c,m),no=c.members.filter(u=>u!==S.me.id&&u!==m.from&&!yes.includes(u));
  const row=(id,ok)=>{const u=S.users[id]||{id,name:'?'};return `<div class="row">${avatar(u,'s',false)}<span class="mid"><span class="nm">${esc(nm(u))}</span><span class="sub"><span class="lm">${ok?'прочитал(а)'+(c.read[id]?' · '+shortWhen(c.read[id]):''):'ещё не прочитал(а)'}</span></span></span>${ok?`<span class="rd-ic">${TICK2}</span>`:''}</div>`};
  sheet(`<h2>Кто прочитал</h2><p class="sub">${esc((m.text||(m.img?'📷 Фото':m.sticker?'Стикер':'')).slice(0,80))}</p>
    <div class="section-t">Прочитали · ${yes.length}</div>${yes.map(i=>row(i,true)).join('')||'<div class="empty" style="padding:14px">Пока никто</div>'}
    ${no.length?`<div class="section-t">Не прочитали · ${no.length}</div>${no.slice(0,100).map(i=>row(i,false)).join('')}`:''}`);
}
function isRead(c,m){
  const r=c.read||{};
  return c.members.some(u=>u!==S.me.id&&(r[u]||0)>=m.ts);
}
function msgHTML(c,m,prev,next){
  if(m.sys)return `<div class="sys glass pill">${esc(m.sys)}</div>`;
  const me=m.from===S.me.id,u=S.users[m.from]||{name:'?'},grp=c.type!=='dm'&&c.type!=='self';
  const tail=!next||next.from!==m.from||next.sys||next.ts-m.ts>300e3||new Date(next.ts).toDateString()!==new Date(m.ts).toDateString();
  const head=!prev||prev.from!==m.from||prev.sys||m.ts-prev.ts>300e3;
  const star=S.stars.has(c.id+':'+m.id)?'<span class="st-mark">★</span>':'';
  const rn=me&&grp&&!m.pending?readers(c,m).length:0;
  const ticks=c.type==='self'?'':me&&!m.pending?`<span class="${isRead(c,m)?'rd':''}">${isRead(c,m)?TICK2:TICK1}${rn?`<b class="rn">${rn}</b>`:''}</span>`:me?'<span>🕓</span>':'';
  const meta=`<span class="meta">${star}${m.edited?'изм. ':''}${tm(m.ts)}${ticks}</span>`;
  const fwd=m.fwd?`<div class="fwd">${ic('fwd')}Переслано от <b>${esc(nm(S.users[m.fwd.from])!=='?'?nm(S.users[m.fwd.from]):m.fwd.name)}</b></div>`:'';
  let inner;
  if(m.del)inner=`<span class="del">Сообщение удалено</span>${meta}`;
  else if(m.once)inner=onceHTML(m,me)+(m.text?`<span class="txt">${linkify(m.text)}</span>`:'')+meta;
  else if(m.sticker){
    const re2=m.react&&Object.keys(m.react).length?`<div class="reacts">${Object.entries(m.react).map(([e,l])=>`<button class="${l.includes(S.me.id)?'mine':''}" data-act="react" data-id="${m.id}" data-e="${esc(e)}">${reKey(e)}${l.length>1?' '+l.length:''}</button>`).join('')}</div>`:'';
    return `<div class="m ${me?'me':''} tail" data-id="${m.id}">${grp&&!me?avatar(u,'xs',false):''}<div class="bub stkb" data-act="msg" data-id="${m.id}">${grp&&!me&&head?`<div class="au" style="color:${esc(u.color)}">${esc(nm(u))}${(c.titles||{})[u.id]?` <span class="mtitle">${esc(c.titles[u.id])}</span>`:''}</div>`:''}${fwd}<img decoding="async" class="stk" src="${esc(m.sticker)}" alt="Стикер" loading="lazy" decoding="async">${meta}${re2}</div></div>`;
  }
  else if(m.media&&m.media.k==='round'){ /* video circle: no bubble, just the circle */
    const md=m.media,src=md.local||md.url,re3=m.react&&Object.keys(m.react).length?`<div class="reacts">${Object.entries(m.react).map(([e,l])=>`<button class="${l.includes(S.me.id)?'mine':''}" data-act="react" data-id="${m.id}" data-e="${esc(e)}">${reKey(e)}${l.length>1?' '+l.length:''}</button>`).join('')}</div>`:'';
    return `<div class="m ${me?'me':''} tail" data-id="${m.id}">${grp&&!me?avatar(u,'xs',false):''}<div class="bub stkb rndb" data-act="msg" data-id="${m.id}">${grp&&!me&&head?`<div class="au" style="color:${esc(u.color)}">${esc(nm(u))}</div>`:''}${fwd}
      <div class="rnd ${m.pending?'up':''} ${md.mirror?'mir':''}" data-act="rnd" data-id="${m.id}">${md.poster||md.posterLocal?`<img decoding="async" class="rnd-p" src="${esc(md.posterLocal||md.poster)}" alt="" decoding="async">`:''}<video src="${esc(src)}" playsinline webkit-playsinline muted loop preload="metadata" disablepictureinpicture></video><svg class="rring" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48"/></svg>
      <span class="rnd-t">${m.pending?`<i class="spin"></i>${md.progress||0}%`:clock(md.dur)}</span><span class="rnd-snd">${ic('vol')}</span></div>${meta}${re3}</div></div>`;
  }
  else if(m.call){
    const miss=m.call.missed,out=m.from===S.me.id;
    return `<div class="m ${me?'me':''} tail" data-id="${m.id}"><div class="bub callm ${miss?'miss':''}"><span class="ci">${ic(m.call.kind==='video'?'video':'phone')}</span>
      <span><b>${m.call.group?'Групповой':out?'Исходящий':'Входящий'} ${m.call.kind==='video'?'видеозвонок':'звонок'}</b><br><small style="opacity:.75">${m.call.group?(m.call.dur?durText(m.call.dur):'Никто не ответил'):miss?(out?'Без ответа':'Пропущенный'):durText(m.call.dur)} · ${tm(m.ts)}</small></span></div></div>`;
  }else{
    inner=(grp&&!me&&head?`<div class="au" style="color:${esc(u.color)}">${esc(nm(u))}${(c.titles||{})[u.id]?` <span class="mtitle">${esc(c.titles[u.id])}</span>`:''}</div>`:'')+fwd+
      (m.story?`<div class="story-ref"><img decoding="async" src="${esc(m.story.img)}" alt="" loading="lazy" decoding="async" onerror="this.parentNode.classList.add('gone')"><span>${me?'Вы ответили на историю':'Ответ на вашу историю'}</span></div>`:'')+
      (m.reply?`<button class="rq" data-act="jump" data-id="${esc(m.reply.id)}"><b>${esc(nm(S.users[m.reply.from]))}</b><span>${esc(m.reply.text)}</span></button>`:'')+
      (m.img?`<img decoding="async" class="pic" src="${esc(m.img)}" alt="Фото" data-act="zoom" loading="lazy" decoding="async">`:'')+
      (m.media&&m.media.k==='voice'?voiceHTML(m):'')+
      (m.media&&m.media.k==='video'?`<button class="vidm ${m.pending?'up':''}" data-act="playvid" data-id="${m.id}" style="${m.media.w&&m.media.h?`aspect-ratio:${m.media.w}/${m.media.h}`:''}">${m.media.poster||m.media.posterLocal?`<img decoding="async" src="${esc(m.media.posterLocal||m.media.poster)}" alt="" loading="lazy" decoding="async">`:'<video src="'+esc(m.media.local||m.media.url)+'#t=0.5" preload="metadata" muted playsinline></video>'}
        <span class="vid-play">${m.pending?`<i class="spin"></i>`:'▶'}</span><span class="vid-t">${m.pending?(m.media.progress||0)+'%':clock(m.media.dur)}</span></button>`:'')+
      (m.text?`<span class="tx">${linkify(m.text)}</span>`:'')+meta;
  }
  const re=m.react&&Object.keys(m.react).length?`<div class="reacts">${Object.entries(m.react).map(([e,l])=>`<button class="${l.includes(S.me.id)?'mine':''}" data-act="react" data-id="${m.id}" data-e="${esc(e)}">${reKey(e)}${l.length>1?' '+l.length:''}</button>`).join('')}</div>`:'';
  const bb=bubbleOf(m.from);
  return `<div class="m ${me?'me':''} ${tail?'tail':''}" data-id="${m.id}">${grp&&!me?avatar(u,'xs',false):''}<div class="bub${bb.cls}" data-act="msg" data-id="${m.id}">${bb.fr}${inner}${re}</div></div>`;
}
/* reactions: an emoji, or "img:" + a sticker picture */
const reKey=e=>e.startsWith('img:')?`<img decoding="async" class="re-img" src="${esc(e.slice(4))}" alt="стикер" loading="lazy">`:esc(e);
const QUICK=['❤️','👍','😂','😮','😢','🔥','👏','🥰'];
const quickRe=()=>{const r=store.get('recentRe',[]);return [...new Set(r.concat(QUICK))].slice(0,6)};
function useRe(e){if(e.startsWith('s:'))return;const r=store.get('recentRe',[]).filter(x=>x!==e);r.unshift(e);store.set('recentRe',r.slice(0,12))}
const EMO={
  'Смайлы':'😀😃😄😁😆😅🤣😂🙂😉😊😇🥰😍🤩😘😗😚😋😛😜🤪😝🤑🤗🤭🤫🤔🤐🤨😐😑😶😏😒🙄😬😮‍💨🤥😌😔😪🤤😴😷🤒🤕🤢🤮🥵🥶🥴😵🤯🤠🥳🥸😎🤓🧐😕😟🙁😮😯😲😳🥺🥹😦😧😨😰😥😢😭😱😖😣😞😓😩😫🥱😤😡😠🤬😈👿💀☠️💩🤡👹👺👻👽👾🤖😺😸😹😻😼😽🙀😿😾',
  'Жесты':'👋🤚🖐️✋🖖👌🤌🤏✌️🤞🫰🤟🤘🤙👈👉👆🖕👇☝️🫵👍👎✊👊🤛🤜👏🙌🫶👐🤲🤝🙏✍️💅🤳💪🦾🫡🫣🫢',
  'Сердечки':'❤️🧡💛💚💙💜🖤🤍🤎💔❣️💕💞💓💗💖💘💝💟❤️‍🔥❤️‍🩹💋💯💢💥💫💦💨🕳️💬💭💤',
  'Праздник':'🎉🎊🎈🎁🎂🍰🧁🥂🍾🎆🎇✨🏆🥇🎯🎮🎵🎶🎤🎧📸💡💎👑🌹🌸🌺🌻🌈☀️🌙⭐🌟⚡🔥❄️☃️🍀',
  'Еда':'🍏🍎🍐🍊🍋🍌🍉🍇🍓🫐🍒🍑🥭🍍🥥🥝🍅🥑🍆🥕🌽🌶️🥒🥦🍔🍟🍕🌭🥪🌮🌯🥗🍝🍜🍣🍤🍩🍪🍫🍬🍭🍯☕🍵🧋🥤🍺🍷',
  'Животные':'🐶🐱🐭🐹🐰🦊🐻🐼🐨🐯🦁🐮🐷🐸🐵🙈🙉🙊🐔🐧🐦🐤🦄🐝🦋🐌🐞🐢🐍🐙🦀🐠🐬🐳🦈🐊🦒🐘🦘🐾',
  'Флаги':'🇰🇿🇷🇺🇺🇿🇰🇬🇺🇦🇧🇾🇹🇷🇺🇸🇬🇧🇩🇪🇫🇷🇮🇹🇪🇸🇯🇵🇰🇷🇨🇳🇮🇳🇦🇪🏳️‍🌈🏁'
};
const emoList=str=>{try{return [...new Intl.Segmenter('ru',{granularity:'grapheme'}).segment(str)].map(x=>x.segment)}catch(e){return Array.from(str)}};
/* the full picker: all emoji by group, and your stickers */
function reactSheet(id,tab){
  S.reTab=tab||S.reTab||'Смайлы';
  const tabs=Object.keys(EMO).concat(S.packs.length?['Стикеры']:[]);
  const body=S.reTab==='Стикеры'?S.packs.map(p=>`<div class="section-t">${esc(p.name)}</div><div class="re-stk">${p.stickers.map(x=>`<button data-act="react" data-id="${id}" data-e="s:${p.id}:${x.id}"><img decoding="async" src="${esc(x.img)}" alt="" loading="lazy"></button>`).join('')||'<div class="empty" style="padding:10px">Пусто</div>'}</div>`).join('')
    :`<div class="re-grid">${emoList(EMO[S.reTab]).map(e=>`<button data-act="react" data-id="${id}" data-e="${esc(e)}">${e}</button>`).join('')}</div>`;
  sheet(`<h2>Реакция</h2><div class="re-tabs">${tabs.map(t=>`<button class="${S.reTab===t?'on':''}" data-act="retab" data-id="${id}" data-v="${esc(t)}">${t==='Стикеры'?'🎨 Стикеры':t}</button>`).join('')}</div><div class="re-body">${body}</div>`);
}
/* ---------- message styles (colour + frame) ---------- */
const BSTYLES=[['','Обычный'],['ocean','Океан'],['sunset','Закат'],['grape','Виноград'],['mint','Мята'],['candy','Конфета'],['lava','Лава'],['neon','Неон'],['galaxy','Галактика'],['gold','Золото'],['night','Ночь'],['cloud','Облако'],['comic','Комикс']];
const BFRAMES=[['','Без рамки'],['hearts','Сердечки'],['stars','Звёзды'],['flowers','Цветы'],['crown','Корона'],['cat','Котик'],['fire','Огонь'],['snow','Снежинки'],['music','Музыка'],['butterfly','Бабочки'],['lace','Кружево'],['rainbow','Радуга']];
function bubbleOf(uid){
  const b=(uid===S.me.id?S.me.bubble:(S.users[uid]||{}).bubble)||null;
  if(!b||(!b.s&&!b.f))return {cls:'',fr:''};
  return {cls:(b.s?' bs-'+b.s:'')+(b.f?' bf-'+b.f:''),fr:b.f?'<i class="bfr" aria-hidden="true"></i>':''};
}
function bubbleSheet(){
  const cur=S.bdraft||Object.assign({s:'',f:''},S.me.bubble||{});S.bdraft=cur;
  const cls=(cur.s?' bs-'+cur.s:'')+(cur.f?' bf-'+cur.f:''),fr=cur.f?'<i class="bfr"></i>':'';
  sheet(`<h2>Стиль сообщений</h2><p class="sub">Так ваши сообщения увидят все собеседники</p>
    <div class="bprev"><div class="m"><div class="bub"><span class="txt">Привет! Как дела? 👋</span></div></div>
      <div class="m me"><div class="bub${cls}">${fr}<span class="txt">Смотри, какой у меня стиль ✨</span></div></div></div>
    <div class="section-t">Цвет</div>
    <div class="bgrid">${BSTYLES.map(([k,n])=>`<button class="bopt ${cur.s===k?'on':''}" data-act="bstyle" data-v="${k}"><span class="bub sw${k?' bs-'+k:''}">Аа</span><small>${n}</small></button>`).join('')}</div>
    <div class="section-t">Рамка</div>
    <div class="bgrid">${BFRAMES.map(([k,n])=>`<button class="bopt ${cur.f===k?'on':''}" data-act="bframe" data-v="${k}"><span class="bub sw${cur.s?' bs-'+cur.s:''}${k?' bf-'+k:''}">${k?'<i class="bfr"></i>':''}Аа</span><small>${n}</small></button>`).join('')}</div>
    <div class="btns"><button class="gbtn" data-act="bcancel">Отмена</button><button class="gbtn primary" data-act="bsave">Сохранить</button></div>`);
}
/* ---------- view once: a photo, video, voice or circle each person can open one time ---------- */
const ONCE_K={photo:['📷','Фото'],video:['🎬','Видео'],voice:['🎤','Голосовое'],round:['⭕','Видеосообщение']};
function renderOnceBtn(){const b=document.querySelector('.oncebtn');if(b)b.classList.toggle('on',!!S.once);const t=$('#txt');if(t)t.placeholder=S.once?'🔥 Фото, видео, голосовое или кружок — на 1 просмотр':'Сообщение'}
function onceHTML(m,me){
  const o=m.once,[e,label]=ONCE_K[o.k]||['🔥','Медиа'],seen=(o.seen||[]).includes(S.me.id),n=(o.seen||[]).length;
  if(me)return `<div class="once mine"><span class="oic">🔥</span><span class="mid"><b>${e} ${label}</b><small>${m.pending?'Отправляется…':o.gone?'Просмотрено и удалено':n?'Просмотрели: '+n:'Ещё не открыли'} · 1 просмотр</small></span></div>`;
  if(seen||o.gone)return `<div class="once done"><span class="oic">🔥</span><span class="mid"><b>${e} ${label}</b><small>Просмотрено</small></span></div>`;
  return `<button class="once open" data-act="onceopen" data-id="${m.id}"><span class="oic">🔥</span><span class="mid"><b>${e} ${label}${o.dur?' · '+clock(o.dur):''}</b><small>Нажмите, чтобы посмотреть · 1 раз</small></span></button>`;
}
let OV=null;
/* the Android app (version 3 and up) opens Manasenger with ?apk=3: it has a protected screen for view-once messages */
(()=>{const q=new URLSearchParams(location.search);if(q.get('apk')){store.set('apk',+q.get('apk')||1);history.replaceState(null,'',location.pathname+location.hash)}})();
const IN_APK=()=>store.get('apk',0)>=3&&/Android/.test(navigator.userAgent);
async function onceOpen(id){
  if(OV)return;const c=S.cur;
  if(IN_APK()){
    let r;try{r=await api('/api/once/open',{chat:c,id,native:true})}catch(e){toast(e.message);return}
    location.href=`intent://open?u=${encodeURIComponent(r.url)}&k=${r.k}#Intent;scheme=manasenger-once;package=com.manasenger.app;end`;return;
  }
  let r;try{r=await api('/api/once/open',{chat:c,id})}catch(e){toast(e.message);return}
  try{window.mnDesktop&&window.mnDesktop.protect&&window.mnDesktop.protect(true)}catch(e){}
  OV={id};const el=document.createElement('div');el.id='oncev';el.className='oncev';
  const no='oncontextmenu="return false" draggable="false"';
  const body=r.k==='photo'?`<img decoding="async" src="${r.url}" alt="" ${no}>`
    :r.k==='voice'?`<div class="ov-voice"><div class="ov-ic">🎤</div><div class="ov-bar"><i id="ovp"></i></div><audio src="${r.url}" autoplay></audio></div>`
    :`<video class="${r.k==='round'?'ov-round':''}" src="${r.url}" autoplay playsinline ${r.k==='video'?'controls':''} controlslist="nodownload noplaybackrate" disablepictureinpicture disableremoteplayback ${no}></video>`;
  el.innerHTML=`<div class="ov-top"><span>🔥 Одноразовое ${ONCE_K[r.k][1].toLowerCase()} — исчезнет после просмотра${window.mnDesktop&&window.mnDesktop.protect?' · скриншот не сохранится':''}</span><button class="gbtn ic" data-act="onceclose" aria-label="Закрыть">${ic('x')}</button></div><div class="ov-body">${body}</div>`;
  el.addEventListener('contextmenu',e=>e.preventDefault());
  document.body.appendChild(el);VP.a.pause();
  const media=el.querySelector('video,audio');
  if(media){media.play().catch(()=>{});media.onended=()=>setTimeout(onceClose,500);
    if(r.k==='voice')media.ontimeupdate=()=>{const p=$('#ovp');if(p&&media.duration)p.style.width=(media.currentTime/media.duration*100)+'%'};
    if(r.k==='round')el.querySelector('.ov-body').addEventListener('click',()=>media.paused?media.play():media.pause())}
}
function onceClose(){try{window.mnDesktop&&window.mnDesktop.protect&&window.mnDesktop.protect(false)}catch(e){}const el=$('#oncev');if(el){el.querySelectorAll('video,audio').forEach(v=>{v.pause();v.removeAttribute('src');v.load()});el.remove()}OV=null}
const clock=s=>{s=Math.round(s||0);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
function voiceHTML(m){
  const md=m.media,w=md.wave&&md.wave.length?md.wave:Array.from({length:32},(_,i)=>8+((i*7)%11)),playing=VP.id===m.id;
  return `<div class="vm ${playing?'on':''}" data-vm="${m.id}"><button class="vm-play" data-act="vplay" data-id="${m.id}" aria-label="Слушать">${m.pending?'<i class="spin"></i>':playing&&!VP.a.paused?'❚❚':'▶'}</button>
    <span class="vm-wave" data-act="vseek" data-id="${m.id}">${w.map((v,i)=>`<i style="height:${Math.max(12,v/31*100)}%" data-i="${i}"></i>`).join('')}</span>
    <span class="vm-t">${m.pending?(md.progress||0)+'%':clock(md.dur)}</span>${playing?`<button class="vm-sp" data-act="vspeed">${VP.rate}×</button>`:''}</div>`;
}
/* one player for voice messages: plays the next one by itself, like in Telegram */
const VP={a:new Audio(),id:null,rate:1};
VP.a.preload='auto';
VP.a.ontimeupdate=()=>{const el=document.querySelector(`[data-vm="${VP.id}"]`);if(!el||!VP.a.duration)return;const k=VP.a.currentTime/VP.a.duration,bars=el.querySelectorAll('.vm-wave i');bars.forEach((b,i)=>b.classList.toggle('pl',i/bars.length<=k));el.querySelector('.vm-t').textContent=clock(VP.a.currentTime)};
VP.a.onended=()=>{const l=S.msgs[S.cur]||[],i=l.findIndex(x=>x.id===VP.id),next=l.slice(i+1).find(x=>x.media&&x.media.k==='voice'&&!x.pending);VP.id=null;if(next)voicePlay(next.id);else renderMsgs()};
function voicePlay(id){
  const m=(S.msgs[S.cur]||[]).find(x=>x.id===id);if(!m||!m.media)return;
  if(VP.id===id){if(VP.a.paused)VP.a.play().catch(()=>{});else VP.a.pause();renderMsgs();return}
  VP.a.pause();VP.id=id;VP.a.src=m.media.local||m.media.url;VP.a.playbackRate=VP.rate;VP.a.play().catch(e=>toast('Не получилось воспроизвести'));renderMsgs();
}
VP.a.onpause=VP.a.onplay=()=>{const b=document.querySelector(`[data-vm="${VP.id}"] .vm-play`);if(b)b.textContent=VP.a.paused?'▶':'❚❚'};
/* video circles: play silently in a loop while visible; a tap plays from the start with sound */
let RND=null;
const rndIO='IntersectionObserver' in window?new IntersectionObserver(es=>es.forEach(e=>{const v=e.target;if(v.dataset.snd)return;if(e.isIntersecting&&!isLite())v.play().catch(()=>{});else v.pause()}),{threshold:.6}):null;
function watchRounds(){document.querySelectorAll('.rnd video').forEach(v=>{if(!v.dataset.w){v.dataset.w=1;v.addEventListener('playing',()=>v.classList.add('on'));v.addEventListener('loadeddata',()=>{if(!v.previousElementSibling)v.classList.add('on');if(!v.videoWidth)v.closest('.rnd').classList.add('novid')});if(rndIO)rndIO.observe(v)}})}
function roundTap(el){
  const v=el.querySelector('video');if(!v)return;
  if(v.dataset.snd){v.pause();v.muted=true;v.loop=true;delete v.dataset.snd;el.classList.remove('snd');return}
  document.querySelectorAll('.rnd video[data-snd]').forEach(o=>{o.pause();o.muted=true;o.loop=true;delete o.dataset.snd;o.closest('.rnd').classList.remove('snd')});
  VP.a.pause();v.dataset.snd=1;v.muted=false;v.loop=false;v.currentTime=0;v.play().catch(()=>{});el.classList.add('snd');
  const ring=el.querySelector('.rring circle');
  v.ontimeupdate=()=>{if(v.duration&&ring)ring.style.strokeDashoffset=String(302*(1-v.currentTime/v.duration))};
  v.onended=()=>{delete v.dataset.snd;v.muted=true;v.loop=true;el.classList.remove('snd');if(ring)ring.style.strokeDashoffset='302';v.play().catch(()=>{})};
}
function linkify(t){
  return esc(t).replace(/\bhttps?:\/\/[^\s<]+#pack\/(p[\w-]{4,20})/g,(u,id)=>`<a href="#pack/${id}" data-act="pklinkmsg" data-id="${id}">🎨 Набор стикеров</a>`).replace(/(^|[^"])\bhttps?:\/\/[^\s<]+[^\s<.,:;"')\]!?]/g,(all,pre)=>pre+all.slice(pre.length).replace(/^.*$/,u=>`<a href="${u}" target="_blank" rel="noopener noreferrer">${u}</a>`));
}
/* #tab/chats etc. — opens a tab from a link */
function hashTab(){const m=/^#tab\/(chats|contacts|calls|ai|settings)$/.exec(location.hash);if(!m||!S.me)return false;
  history.replaceState(null,'',location.pathname);if(m[1]==='settings'){if(S.cur)closeChat();settingsSheet();return true}
  if(S.cur&&mobile())closeChat();S.tab=IOS&&m[1]==='ai'?'chats':m[1];S.q='';if(S.tab==='calls')S.calls=null;renderSide();return true}

/* ================= calls keep going when you leave the app =================
   While a call, a group call or a server voice chat is on: an "ongoing call" notification in the phone
   (tap — back to the call, «Завершить» — hang up), call buttons in the phone's media controls,
   the screen stays on while the app is open, and the camera comes back by itself when you return. */
const LIVE={k:'',wl:null};
function liveNow(){
  if(CALL&&CALL.state==='active')return {k:'call:'+(CALL.id||''),title:(CALL.kind==='video'?'📹 Видеозвонок':'📞 Звонок')+' · '+nm(CALL.peer),video:CALL.kind==='video',mic:CALL.mic,cam:CALL.cam};
  if(GC&&GC.state!=='connecting'){const c=S.chats[GC.chat];return {k:'gc:'+GC.chat,title:(GC.kind==='video'?'📹 Групповой видеозвонок':'📞 Групповой звонок')+(c?' · '+chatName(c):''),video:GC.kind==='video',mic:GC.mic,cam:GC.cam}}
  if(VC&&VC.state!=='connecting'){const g=S.servers[VC.sid],ch=S.chats[VC.cid];return {k:'vc:'+VC.cid,title:'🔊 Голосовой чат'+(ch?' · '+ch.name:'')+(g?' · '+g.name:''),video:false,mic:!VC.mute,cam:false}}
  return null}
async function liveNotify(L){
  try{const r=await navigator.serviceWorker.ready;(await r.getNotifications()).filter(n=>n.tag&&n.tag.startsWith('mnlive.')).forEach(n=>{if(!L||n.tag!=='mnlive.'+L.k.replace(/[^A-Za-z0-9_-]/g,'_'))n.close()});
    if(!L||Notification.permission!=='granted')return;
    await r.showNotification(L.title,{tag:'mnlive.'+L.k.replace(/[^A-Za-z0-9_-]/g,'_'),body:'Идёт сейчас · нажмите, чтобы вернуться',icon:'/icon-192.png',badge:'/icon-192.png',silent:true,renotify:false,requireInteraction:true,
      data:{type:'live'},actions:[{action:'hangup',title:'❌ Завершить'}]})}catch(e){}}
function liveMedia(L){const ms=navigator.mediaSession;if(!ms)return;
  try{if(!L){ms.metadata=null;ms.playbackState='none';['hangup','togglemicrophone','togglecamera','enterpictureinpicture'].forEach(a=>{try{ms.setActionHandler(a,null)}catch(e){}});return}
    ms.metadata=new MediaMetadata({title:L.title,artist:'Manasenger',artwork:[{src:'/icon-192.png',sizes:'192x192',type:'image/png'},{src:'/icon-512.png',sizes:'512x512',type:'image/png'}]});
    ms.playbackState='playing';
    const set=(a,f)=>{try{ms.setActionHandler(a,f)}catch(e){}};
    set('hangup',liveHangup);
    set('togglemicrophone',()=>{if(CALL)toggleMic();else if(GC)gcMic();else if(VC)voiceMute()});
    set('togglecamera',()=>{if(CALL)toggleCam();else if(GC)gcCam()});
    set('enterpictureinpicture',livePip);
    try{ms.setMicrophoneActive&&ms.setMicrophoneActive(!!L.mic);ms.setCameraActive&&ms.setCameraActive(!!L.cam)}catch(e){}}catch(e){}}
function liveHangup(){if(CALL)hangup();else if(GC)gcLeave();else if(VC)voiceLeave()}
/* ================= the call in its own small window, on top of other apps =================
   Computer (Chrome / Edge / the Manasenger app): a real mini window with the picture and buttons — mic, camera, hang up.
   Phone: a floating picture-in-picture window. For a voice call it shows the person, the time and the mic.
   It opens with the «Окно поверх» button and by itself when you leave Manasenger (where the phone allows it). */
const POP={win:null,card:null,cv:null,timer:0};
function popInfo(){
  if(CALL){const p=CALL.peer||{};return {name:nm(p),user:p,t0:CALL.started,mic:CALL.mic,cam:CALL.cam,stream:CALL.rs&&(CALL.rs.cam||CALL.rs.screen)?CALL.remote:null}}
  if(GC){const c=S.chats[GC.chat];let st=null,u=null;GC.peers.forEach((p,id)=>{if(!st&&p.stream&&p.stream.getVideoTracks().some(x=>x.readyState==='live'&&!x.muted)){st=p.stream;u=S.users[id]}});
    return {name:c?chatName(c):'Звонок',user:u||(c&&c.type==='dm'?peerOf(c):{name:c?chatName(c):'?',color:c&&c.color,avatar:c&&c.avatar}),t0:GC.t0,mic:GC.mic,cam:GC.cam,stream:st}}
  if(VC){const ch=S.chats[VC.cid],g=S.servers[VC.sid]||{};return {name:'🔊 '+((ch&&ch.name)||'Голосовой чат'),user:{name:g.name||'#',color:g.color,avatar:g.avatar},t0:VC.t0,mic:!VC.mute,cam:false,stream:null}}
  return null}
const popClock=t0=>{if(!t0)return 'соединение…';const s=Math.floor((Date.now()-t0)/1000);return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`};
/* a live picture of a voice call (avatar, name, time) for the phone's floating window */
function popCard(){
  if(POP.card)return POP.card;
  const cv=document.createElement('canvas');cv.width=480;cv.height=270;const x=cv.getContext('2d'),img=new Image();let imgSrc='';
  const draw=()=>{const I=popInfo();if(!I)return;const u=I.user||{};
    if(u.avatar&&imgSrc!==u.avatar){imgSrc=u.avatar;img.src=u.avatar}
    const g=x.createLinearGradient(0,0,0,270);g.addColorStop(0,'#3b4a63');g.addColorStop(1,'#151a22');x.fillStyle=g;x.fillRect(0,0,480,270);
    x.save();x.beginPath();x.arc(240,98,56,0,Math.PI*2);x.closePath();
    if(img.complete&&img.naturalWidth&&imgSrc){x.clip();x.drawImage(img,184,42,112,112)}else{x.fillStyle=u.color||'#5b8cff';x.fill();x.fillStyle='#fff';x.font='bold 44px system-ui,sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(initials(nm(u)||I.name),240,100)}
    x.restore();
    x.fillStyle='#fff';x.font='600 26px system-ui,sans-serif';x.textAlign='center';x.textBaseline='alphabetic';
    let n=I.name;while(x.measureText(n).width>440&&n.length>3)n=n.slice(0,-2);if(n!==I.name)n+='…';x.fillText(n,240,198);
    x.fillStyle='rgba(255,255,255,.75)';x.font='22px system-ui,sans-serif';x.fillText((I.mic?'🎙 ':'🔇 ')+popClock(I.t0),240,234)};
  draw();
  const v=document.createElement('video');v.muted=true;v.playsInline=true;v.autoplay=true;v.setAttribute('playsinline','');
  v.srcObject=cv.captureStream?cv.captureStream(2):null;v.style.cssText='position:fixed;width:2px;height:2px;opacity:0;pointer-events:none;left:0;top:0';document.body.appendChild(v);
  POP.card={v,draw};POP.timer=setInterval(()=>{if(!popInfo())return popClose();draw()},500);
  return POP.card}
async function callPop(auto){
  const I=popInfo();if(!I)return;
  /* computers: a real mini window with buttons */
  if(window.documentPictureInPicture&&!touch){
    if(POP.win&&!POP.win.closed){if(!auto)POP.win.focus();return}
    try{const w=await documentPictureInPicture.requestWindow({width:340,height:I.stream?240:200});POP.win=w;popFill(w);return}catch(e){if(auto)return}
  }
  /* phones: a floating window from a video */
  try{if(document.pictureInPictureElement)return;
    let v=null;
    if(I.stream){v=[...document.querySelectorAll('#callEl video.remote,.gcall video')].find(x=>x.srcObject===I.stream&&x.videoWidth)}
    if(!v){const c=popCard();v=c.v;await v.play().catch(()=>{});if(!v.videoWidth)await new Promise(k=>{v.onloadedmetadata=k;setTimeout(k,600)})}
    if(v&&v.requestPictureInPicture){await v.requestPictureInPicture();v.addEventListener('leavepictureinpicture',()=>{if(POP.card&&v===POP.card.v)popCardStop()},{once:true})}
    else if(!auto)toast('Это устройство не умеет показывать звонок в отдельном окне')}
  catch(e){if(!auto)toast('Окно поверх других приложений недоступно: разрешите «Картинка в картинке» для браузера в настройках телефона',5000)}
}
function popCardStop(){clearInterval(POP.timer);if(POP.card){try{POP.card.v.srcObject&&POP.card.v.srcObject.getTracks().forEach(t=>t.stop())}catch(e){}POP.card.v.remove()}POP.card=null}
function popClose(){popCardStop();if(POP.win&&!POP.win.closed)POP.win.close();POP.win=null;if(document.pictureInPictureElement)document.exitPictureInPicture().catch(()=>{})}
/* fills the computer mini window: picture (or avatar), name, time, buttons */
function popFill(w){
  const d=w.document;d.title='Manasenger · звонок';
  const st=d.createElement('style');st.textContent=`*{box-sizing:border-box;margin:0}body{font:14px system-ui,-apple-system,Segoe UI,sans-serif;background:#151a22;color:#fff;height:100vh;overflow:hidden;display:flex;flex-direction:column}
  .v{flex:1;min-height:0;position:relative;display:grid;place-items:center;background:linear-gradient(#3b4a63,#151a22)}video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  .av{width:72px;height:72px;border-radius:50%;display:grid;place-items:center;font-size:28px;font-weight:700;background:#5b8cff;background-size:cover;background-position:center}
  .inf{position:absolute;left:8px;top:8px;right:8px;display:flex;gap:6px;align-items:center;font-weight:600;text-shadow:0 1px 3px #000}.inf small{opacity:.8;font-weight:400}
  .bar{display:flex;justify-content:center;gap:10px;padding:8px;background:#0d1016}button{width:44px;height:44px;border-radius:50%;border:0;background:#2b3240;color:#fff;cursor:pointer;display:grid;place-items:center}
  button.off{background:#fff;color:#111}button.end{background:#ff3b4f}button svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}`;
  d.head.appendChild(st);
  d.body.innerHTML=`<div class="v"><video autoplay playsinline muted></video><div class="av"></div><div class="inf"><span class="nm"></span><small class="tm"></small></div></div><div class="bar"><button data-a="mic"></button><button data-a="cam"></button><button data-a="back" title="Вернуться в Manasenger"><svg viewBox="0 0 24 24">${P.min}</svg></button><button data-a="end" class="end" title="Завершить"><svg viewBox="0 0 24 24">${P.end}</svg></button></div>`;
  const vid=d.querySelector('video'),av=d.querySelector('.av');
  const upd=()=>{const I=popInfo();if(!I){w.close();return}
    const s=I.stream;if(vid.srcObject!==s){vid.srcObject=s;if(s)vid.play().catch(()=>{})}vid.style.display=s?'':'none';av.style.display=s?'none':'';
    const u=I.user||{};av.style.background=u.avatar?`center/cover url("${u.avatar}")`:(u.color||'#5b8cff');av.textContent=u.avatar?'':initials(nm(u)||I.name);
    d.querySelector('.nm').textContent=I.name;d.querySelector('.tm').textContent=popClock(I.t0);
    const m=d.querySelector('[data-a=mic]'),c=d.querySelector('[data-a=cam]');
    m.className=I.mic?'':'off';m.innerHTML=`<svg viewBox="0 0 24 24">${P[I.mic?'mic':'micOff']}</svg>`;m.title=I.mic?'Выключить микрофон':'Включить микрофон';
    c.style.display=VC?'none':'';c.className=I.cam?'':'off';c.innerHTML=`<svg viewBox="0 0 24 24">${P[I.cam?'video':'videoOff']}</svg>`};
  d.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const a=b.dataset.a;
    if(a==='mic'){if(CALL)toggleMic();else if(GC)gcMic();else if(VC)voiceMute()}
    else if(a==='cam'){if(CALL)toggleCam();else if(GC)gcCam()}
    else if(a==='end'){liveHangup();w.close()}
    else if(a==='back'){window.focus();w.close()}
    setTimeout(upd,150)});
  upd();const t=setInterval(upd,1000);w.addEventListener('pagehide',()=>{clearInterval(t);if(POP.win===w)POP.win=null});
}
const livePip=()=>callPop(true);
async function liveWake(on){try{if(on&&!LIVE.wl&&'wakeLock' in navigator&&!document.hidden){LIVE.wl=await navigator.wakeLock.request('screen');LIVE.wl.addEventListener('release',()=>{LIVE.wl=null})}
  else if(!on&&LIVE.wl){LIVE.wl.release();LIVE.wl=null}}catch(e){}}
/* the camera is switched off by the phone while the app is in the background; bring it back */
async function liveCamBack(){
  try{if(CALL&&CALL.cam&&CALL.local){const t=CALL.local.getVideoTracks()[0];if(!t||t.readyState==='ended'){
      const st=await navigator.mediaDevices.getUserMedia({video:{facingMode:CALL.facing||'user'}});const nt=st.getVideoTracks()[0];
      if(t){CALL.local.removeTrack(t)}CALL.local.addTrack(nt);if(CALL.fx&&CALL.fx.setSource)CALL.fx.setSource(nt);pushVideo()}}}catch(e){}}
function liveTick(){const L=liveNow(),k=L?L.k+'|'+L.mic+'|'+L.cam:'';
  if(k!==LIVE.k){const changedCall=(LIVE.k.split('|')[0])!==(L?L.k:'');LIVE.k=k;if(changedCall)liveNotify(L);liveMedia(L);liveWake(!!L);if(!L)popClose()}}
setInterval(liveTick,1000);
document.addEventListener('visibilitychange',()=>{const L=liveNow();if(!L)return;
  if(document.hidden){livePip()}else{liveWake(true);liveCamBack();if(document.pictureInPictureElement)document.exitPictureInPicture().catch(()=>{})}});
/* ================= friends map (like 2GIS): friends who added each other see where the other one is ================= */
const MAP_STYLES={liberty:['Обычная','https://tiles.openfreemap.org/styles/liberty'],bright:['Яркая','https://tiles.openfreemap.org/styles/bright'],positron:['Светлая','https://tiles.openfreemap.org/styles/positron']};
let MAPD={sharing:false,friends:[]},MAP=null,MAPV=null,MK=new Map(),MEMK=null,mapSel=null;
const GEO={watch:null,last:null,lastAt:0,sentAt:0,sentPos:null,tick:null,lowAcc:false,native:false};
let MAPT=0,mapFitted=false;
const mapIn=()=>MAPD.friends.filter(f=>f.st==='in');
function mapBadge(){const n=mapIn().length;return n?`<i class="tab-badge">${n}</i>`:''}
async function mapRefresh(quiet){try{MAPD=await api('/api/map');}catch(e){return}if(!quiet&&S.view==='home'&&$('#side .tabbar'))renderSide();if(MAPV)mapDraw()}
function ago(ts){const d=(Date.now()-ts)/1000;if(d<90)return 'только что';if(d<3600)return Math.round(d/60)+' мин назад';if(d<86400)return Math.round(d/3600)+' ч назад';return new Date(ts).toLocaleDateString('ru-RU',{day:'numeric',month:'short'})}
function distKm(a,b){const R=6371,r=x=>x*Math.PI/180,dl=r(b.lat-a.lat),dg=r(b.lng-a.lng),h=Math.sin(dl/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(dg/2)**2;return 2*R*Math.asin(Math.sqrt(h))}
const fmtDist=km=>km<1?Math.round(km*1000)+' м':km<10?km.toFixed(1).replace('.',',')+' км':Math.round(km)+' км';
const myPos=()=>GEO.last?{lat:GEO.last.latitude,lng:GEO.last.longitude}:null;
function loadMapLib(){if(window.maplibregl)return Promise.resolve();
  return new Promise((ok,no)=>{if(!document.querySelector('link[data-ml]')){const l=document.createElement('link');l.rel='stylesheet';l.href='/vendor/maplibre/maplibre-gl.css?v=471';l.dataset.ml=1;document.head.appendChild(l)}
    const sc=document.createElement('script');sc.src='/vendor/maplibre/maplibre-gl.js?v=471';sc.onload=ok;sc.onerror=no;document.head.appendChild(sc)})}
async function openMap(){
  if(MAPV)return;
  MAPV=document.createElement('div');MAPV.id='mapview';MAPV.className='mapview';
  MAPV.innerHTML=`<div id="mapc" class="mapc"><div class="map-load">${ic('pin')}<span>Загружаем карту…</span></div></div>
    <div class="map-top"><button class="gbtn ic glass map-fab" data-act="mapclose" aria-label="Закрыть карту">${ic('x')}</button>
      <div class="map-title glass pill"><b>Карта друзей</b><small id="mapsub"></small></div>
      <button class="gbtn ic glass map-fab" data-act="mapadd" aria-label="Добавить друзей" title="Добавить друзей">${ic('addUser')}<span id="mapinb"></span></button></div>
    <div class="map-tools"><button class="gbtn ic glass map-fab" data-act="mapme" aria-label="Где я" title="Где я">${ic('locate')}</button>
      <button class="gbtn ic glass map-fab" data-act="mapstyle" aria-label="Вид карты" title="Вид карты">${ic('layers')}</button>
      <button class="gbtn glass map-fab map-3d" data-act="map3d" aria-label="3D" title="Объёмные здания">3D</button>
      <button class="gbtn glass map-fab map-tr ${TR.on?'on':''}" data-act="maptr" aria-label="Остановки и транспорт" title="Остановки и транспорт">🚌</button></div>
    <div class="map-bottom glass" id="mapbot"></div>`;
  document.body.appendChild(MAPV);requestAnimationFrame(()=>MAPV&&MAPV.classList.add('on'));
  mapDraw();mapRefresh(true);mapFitted=false;
  clearInterval(MAPT);MAPT=setInterval(()=>{if(!document.hidden&&MAPV){mapRefresh(true);if(GEO.watch!=null)geoPoll()}},12e3);
  try{await loadMapLib()}catch(e){$('#mapc').innerHTML='<div class="map-load">Не удалось загрузить карту. Проверьте интернет.</div>';return}
  if(!MAPV)return;
  const me=myPos(),first=MAPD.friends.find(f=>f.geo);
  const st=store.get('mapStyle','liberty');
  try{
    MAP=new maplibregl.Map({container:'mapc',style:(MAP_STYLES[st]||MAP_STYLES.liberty)[1],center:me?[me.lng,me.lat]:first?[first.geo.lng,first.geo.lat]:[76.945,43.238],zoom:me||first?13:11,
      attributionControl:{compact:true},dragRotate:true,pitchWithRotate:true,touchPitch:true,fadeDuration:150,maxPitch:70,renderWorldCopies:false});
  }catch(e){$('#mapc').innerHTML='<div class="map-load">Карта не поддерживается на этом устройстве</div>';MAP=null;return}
  MAP.on('load',()=>{const l=$('#mapc .map-load');if(l)l.remove();mapDraw();mapFitAll();trSched()});
  MAP.on('styledata',()=>{if(ROUTE&&ROUTE.geo&&!MAP.getSource('route')){if(ROUTE.mode==='bus')busDraw();else routeLayer()}trLayers();if(TR.line&&!MAP.getSource('trline'))trLineDraw()});
  MAP.on('moveend',trSched);
  MAP.on('click','tr-stops',e=>{const f=e.features&&e.features[0];if(!f)return;TR.clickAt=Date.now();trOpen(f.properties.id)});
  MAP.on('mouseenter','tr-stops',()=>{MAP.getCanvas().style.cursor='pointer'});MAP.on('mouseleave','tr-stops',()=>{MAP.getCanvas().style.cursor=''});
  MAP.on('click',()=>{if(Date.now()-(TR.clickAt||0)<400)return;if(TR.sel&&!ROUTE){trClose();return}if(mapSel&&!ROUTE){mapSel=null;mapBottom()}});
  if(!GEO.last&&navigator.geolocation&&store.get('geoAsked',false))navigator.geolocation.getCurrentPosition(p=>{GEO.last=p.coords;mapDraw()},()=>{},{maximumAge:60e3,timeout:15e3});
}
function closeMap(){if(!MAPV)return;const v=MAPV;MAPV=null;mapSel=null;ROUTE=null;TR.sel=null;TR.line=null;clearInterval(MAPT);MAPT=0;v.classList.remove('on');setTimeout(()=>{if(MAP){MAP.remove();MAP=null}MK.clear();MEMK=null;v.remove()},220)}
/* a friend's dot glides to the new place instead of jumping */
/* a friend's pin glides at an even speed for about as long as the gap between two updates,
   so it keeps moving until the next position arrives instead of jumping and then waiting */
function mkMove(m,lng,lat){const a=m.getLngLat(),now=performance.now();if(Math.abs(a.lng-lng)<1e-7&&Math.abs(a.lat-lat)<1e-7)return;
  const gap=m._at?now-m._at:1000;m._at=now;
  if(m._anim)cancelAnimationFrame(m._anim);if(distKm({lat:a.lat,lng:a.lng},{lat,lng})>3||document.hidden){m.setLngLat([lng,lat]);m._anim=0;return}
  const D=Math.max(700,Math.min(5000,gap*.95)),t0=now,st=t=>{const k=Math.min(1,(t-t0)/D),e=k-.15*Math.sin(2*Math.PI*k)/(2*Math.PI);
    m.setLngLat([a.lng+(lng-a.lng)*e,a.lat+(lat-a.lat)*e]);m._anim=k<1?requestAnimationFrame(st):0};m._anim=requestAnimationFrame(st)}
/* on opening: show everyone at once, even friends in another city or country */
function mapFitAll(){if(!MAP||mapFitted)return;const pts=MAPD.friends.filter(f=>f.st==='ok'&&f.geo).map(f=>[f.geo.lng,f.geo.lat]),p=myPos();if(p)pts.push([p.lng,p.lat]);
  if(pts.length<2)return;mapFitted=true;const xs=pts.map(q=>q[0]),ys=pts.map(q=>q[1]);
  MAP.fitBounds([[Math.min(...xs),Math.min(...ys)],[Math.max(...xs),Math.max(...ys)]],{padding:{top:110,bottom:230,left:50,right:80},maxZoom:15,duration:800})}
function fmEl(u,me){const d=document.createElement('div');d.className='fm'+(me?' me':'');d.style.setProperty('--c',u.color||'#5b8cff');
  d.innerHTML=me?'<i class="pulse"></i><i class="core"></i>':`<span class="fm-pin">${avatar(u,'s',false)}</span><span class="fm-n"></span>`;return d}
function mapDraw(){
  if(!MAPV)return;
  const ok=MAPD.friends.filter(f=>f.st==='ok'),on=ok.filter(f=>f.geo);
  const sub=$('#mapsub');if(sub)sub.textContent=ok.length?`${on.length} из ${ok.length} на карте`:'Добавьте друзей';
  const ib=$('#mapinb');if(ib)ib.innerHTML=mapBadge();
  if(MAP&&window.maplibregl){
    const seen=new Set();
    on.forEach(f=>{seen.add(f.user.id);let m=MK.get(f.user.id);
      if(!m){const el=fmEl(f.user);el.addEventListener('click',ev=>{ev.stopPropagation();mapFocus(f.user.id)});m=new maplibregl.Marker({element:el,anchor:'bottom'}).setLngLat([f.geo.lng,f.geo.lat]).addTo(MAP);MK.set(f.user.id,m)}
      else mkMove(m,f.geo.lng,f.geo.lat);
      const n=m.getElement().querySelector('.fm-n');n.textContent=nm(f.user).split(' ')[0]+(Date.now()-f.geo.ts>180e3?' · '+ago(f.geo.ts):'');
      m.getElement().classList.toggle('old',Date.now()-f.geo.ts>3600e3);m.getElement().classList.toggle('sel',mapSel===f.user.id)});
    for(const [id,m] of MK)if(!seen.has(id)){m.remove();MK.delete(id)}
    const p=myPos();if(p){if(!MEMK)MEMK=new maplibregl.Marker({element:fmEl(S.me,true)}).setLngLat([p.lng,p.lat]).addTo(MAP);else mkMove(MEMK,p.lng,p.lat)}
    if(!mapFitted&&MAP.loaded())mapFitAll();
  }
  mapBottom();
}
function mapBottom(){
  const el=$('#mapbot');if(!el)return;
  const ok=MAPD.friends.filter(f=>f.st==='ok'),p=myPos();
  if(ROUTE&&ROUTE.id===mapSel){const f=ok.find(x=>x.user.id===ROUTE.id);if(f){
    const M={bus:['🚌','Автобус'],car:['🚗','Авто'],foot:['🚶','Пешком'],bike:['🚲','Вело']};
    if(ROUTE.mode==='bus'){el.innerHTML=busPanel(f,M);return}
    el.innerHTML=`<div class="map-card">${avatar(f.user,'s',false)}<span class="mid"><b>${ROUTE.busy?'Строим маршрут…':ROUTE.err?esc(ROUTE.err):`${M[ROUTE.mode][0]} ${fmtDur(ROUTE.dur)} · ${fmtDist(ROUTE.dist/1000)}`}</b><small>${esc(nm(f.user))}${ROUTE.busy||ROUTE.err?'':' · прибытие в '+new Date(Date.now()+ROUTE.dur*1000).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}</small></span>
      <button class="gbtn ic" data-act="maprouteoff" aria-label="Убрать маршрут">${ic('x')}</button></div>
      <div class="seg map-modes">${Object.keys(M).map(k=>`<button class="${ROUTE.mode===k?'on':''}" data-act="maproute" data-id="${f.user.id}" data-mode="${k}">${M[k][0]} ${M[k][1]}</button>`).join('')}</div>
      <div class="btns map-acts">${gisLinks(ROUTE.mode==='car'?'car':ROUTE.mode==='foot'?'pedestrian':'car')}<a class="gbtn" href="https://www.google.com/maps/dir/?api=1&origin=${ROUTE.a.lat},${ROUTE.a.lng}&destination=${ROUTE.b.lat},${ROUTE.b.lng}&travelmode=${ROUTE.mode==='car'?'driving':ROUTE.mode==='foot'?'walking':'bicycling'}" target="_blank" rel="noopener">Google Карты</a></div>`;return}ROUTE=null}
  if(TR.sel){el.innerHTML=trPanel();return}
  if(mapSel){const f=ok.find(x=>x.user.id===mapSel);if(f){
    el.innerHTML=`<div class="map-card">${avatar(f.user,'',true)}<span class="mid"><b>${esc(nm(f.user))}</b><small>${f.geo?`${ago(f.geo.ts)}${p?' · '+fmtDist(distKm(p,f.geo))+' от вас':''}`:'Сейчас не делится геопозицией'}</small></span>
      <button class="gbtn ic" data-act="mapdesel" aria-label="Назад">${ic('x')}</button></div>
      <div class="btns map-acts"><button class="gbtn primary" data-act="mapmsg" data-id="${f.user.id}">${ic('chats')}Написать</button>${f.geo?`<button class="gbtn" data-act="maproute" data-id="${f.user.id}">${ic('locate')}Маршрут</button>`:''}
      <button class="gbtn" data-act="mapdel" data-id="${f.user.id}">Убрать</button></div>`;return}mapSel=null}
  const share=MAPD.sharing&&GEO.watch!=null;
  el.innerHTML=`<div class="map-share"><span class="mid"><b>${share?'Вы делитесь геопозицией':'Геопозиция скрыта'}</b><small>${share?'Её видят только друзья на карте':'Друзья не видят, где вы'}</small></span>
      <button class="sw ${share?'on':''}" data-act="mapshare" role="switch" aria-checked="${share}" aria-label="Делиться геопозицией"><i></i></button></div>
    ${ok.length?`<div class="map-chips">${ok.map(f=>`<button class="map-chip ${f.geo?'':'off'}" data-act="mapgo" data-id="${f.user.id}">${avatar(f.user,'s',false)}<span><b>${esc(nm(f.user).split(' ')[0])}</b><small>${f.geo?(p?fmtDist(distKm(p,f.geo)):ago(f.geo.ts)):'скрыт'}</small></span></button>`).join('')}</div>`
      :`<button class="map-empty" data-act="mapadd">${ic('addUser')}<span><b>Добавьте друзей на карту</b><small>Вы будете видеть друг друга, когда оба согласитесь</small></span></button>`}`;
}
/* by bus: bus stops and lines from OpenStreetMap; the bus that goes from a stop near you to a stop near your friend */
const OVERPASS=['https://overpass-api.de/api/interpreter','https://overpass.private.coffee/api/interpreter'];
function gisLinks(t){if(!ROUTE)return '';const a=ROUTE.a,b=ROUTE.b;
  return `${touch?`<a class="gbtn primary" href="dgis://2gis.ru/routeSearch/rsType/${t}/from/${a.lng},${a.lat}/to/${b.lng},${b.lat}">2ГИС</a>`:''}<a class="gbtn${touch?'':' primary'}" href="https://2gis.kz/directions/points/${a.lng}%2C${a.lat}%7C${b.lng}%2C${b.lat}" target="_blank" rel="noopener">2ГИС${touch?' (сайт)':''}</a>`}
function busPanel(f,M){const R=ROUTE,B=R.bus;
  const modes=`<div class="seg map-modes">${Object.keys(M).map(k=>`<button class="${R.mode===k?'on':''}" data-act="maproute" data-id="${f.user.id}" data-mode="${k}">${M[k][0]} ${M[k][1]}</button>`).join('')}</div>`;
  const head=t=>`<div class="map-card">${avatar(f.user,'s',false)}<span class="mid"><b>${t}</b><small>${esc(nm(f.user))} · общественный транспорт</small></span><button class="gbtn ic" data-act="maprouteoff" aria-label="Убрать маршрут">${ic('x')}</button></div>`;
  const links=`<div class="btns map-acts">${gisLinks('ctx')}</div>`;
  if(R.busy)return head('Ищем автобусы и остановки…')+modes;
  if(!B||!B.opts.length)return head(B&&B.near?'Прямого автобуса нет':'Не нашли остановок рядом')+modes+`<p class="hint bus-hint">${B&&B.near?`Рядом с вами: ${esc(B.near)}. Маршрут с пересадками покажет 2ГИС.`:'Откройте маршрут в 2ГИС — там все автобусы с пересадками.'}</p>`+links;
  const o=B.opts[B.sel||0];
  return head(`🚌 ${fmtDur(o.total)} · ${o.lines.slice(0,4).map(l=>esc(l)).join(', ')}`)+modes+
    `<div class="bus-steps"><div class="bus-st"><i>🚶</i><span>${fmtDur(o.walkA)} пешком до остановки <b>«${esc(o.from)}»</b></span></div>
      <div class="bus-st"><i>🚌</i><span>${o.lines.map(l=>`<em class="bus-n">${esc(l)}</em>`).join('')} · ${o.stops?o.stops+' '+(o.stops%10===1&&o.stops%100!==11?'остановка':o.stops%10>=2&&o.stops%10<=4&&(o.stops%100<12||o.stops%100>14)?'остановки':'остановок')+' · ':''}≈ ${fmtDur(o.ride)}</span></div>
      <div class="bus-st"><i>📍</i><span>выйти на <b>«${esc(o.to)}»</b>, ${fmtDur(o.walkB)} пешком до друга</span></div></div>
    ${B.opts.length>1?`<div class="bus-alt">${B.opts.slice(0,4).map((x,i)=>`<button class="${i===(B.sel||0)?'on':''}" data-act="busopt" data-i="${i}">${esc(x.lines[0])}${x.lines.length>1?' +'+(x.lines.length-1):''} · ${fmtDur(x.total)}</button>`).join('')}</div>`:''}
    <p class="hint bus-hint">Время примерное, без ожидания автобуса.</p>`+links}
async function overpass(q){let last;for(const u of OVERPASS){try{const r=await fetch(u,{method:'POST',body:'data='+encodeURIComponent(q),headers:{'Content-Type':'application/x-www-form-urlencoded'}});if(r.ok)return await r.json();last=new Error('busy')}catch(e){last=e}}throw last}
async function busRoute(a,b){
  const R=600,q=`[out:json][timeout:20];
(node(around:${R},${a.lat},${a.lng})[highway=bus_stop];node(around:${R},${a.lat},${a.lng})[public_transport~"^(platform|stop_position)$"];node(around:${R},${a.lat},${a.lng})[railway~"^(tram_stop|station)$"];)->.A;
(node(around:${R},${b.lat},${b.lng})[highway=bus_stop];node(around:${R},${b.lat},${b.lng})[public_transport~"^(platform|stop_position)$"];node(around:${R},${b.lat},${b.lng})[railway~"^(tram_stop|station)$"];)->.B;
rel(bn.A)[type=route][route~"^(bus|trolleybus|tram|subway|light_rail|share_taxi|minibus)$"]->.RA;
rel(bn.B)[type=route][route~"^(bus|trolleybus|tram|subway|light_rail|share_taxi|minibus)$"]->.RB;
rel.RA.RB->.C;
.A out;.B out;.C out body;`;
  const j=await overpass(q),nodes=new Map(),rels=[];
  j.elements.forEach(e=>{if(e.type==='node')nodes.set(e.id,e);else if(e.type==='relation')rels.push(e)});
  const near=(p,id)=>{const n=nodes.get(id);return n?distKm(p,{lat:n.lat,lng:n.lon}):1e9};
  const name=id=>{const n=nodes.get(id);return n&&n.tags&&(n.tags.name||n.tags['name:ru']||n.tags['name:kk'])||'остановка'};
  const walk=km=>km*1000/1.25,opts=new Map();
  for(const r of rels){
    const st=r.members.filter(m=>m.type==='node'&&nodes.has(m.ref)).map((m,i)=>({id:m.ref,i:r.members.indexOf(m)}));
    let best=null;
    for(const x of st)for(const y of st){if(y.i<=x.i)continue;const da=near(a,x.id),db=near(b,y.id);if(da>R/1000*1.2||db>R/1000*1.2)continue;
      const stops=r.members.slice(x.i,y.i+1).filter(m=>m.type==='node'&&/stop|platform/.test(m.role||'')).length-1;
      const n1=nodes.get(x.id),n2=nodes.get(y.id),ride=distKm({lat:n1.lat,lng:n1.lon},{lat:n2.lat,lng:n2.lon})*1.35*1000/(20/3.6);
      const total=walk(da)+walk(db)+ride;if(!best||total<best.total)best={x:x.id,y:y.id,da,db,stops:Math.max(1,stops),ride,total}}
    if(!best)continue;
    const ln=(r.tags&&(r.tags.ref||r.tags.name))||'?',k=best.x+'-'+best.y;
    const o=opts.get(k);
    if(o){if(!o.lines.includes(ln))o.lines.push(ln)}
    else opts.set(k,{from:name(best.x),to:name(best.y),fa:nodes.get(best.x),fb:nodes.get(best.y),lines:[ln],stops:best.stops,walkA:walk(best.da),walkB:walk(best.db),ride:best.ride,total:best.total})}
  const list=[...opts.values()].sort((p,q)=>p.total-q.total);
  list.forEach(o=>o.lines.sort((p,q)=>(parseInt(p)||999)-(parseInt(q)||999)));
  const stA=[...nodes.values()].filter(n=>distKm(a,{lat:n.lat,lng:n.lon})<=R/1000).sort((p,q)=>distKm(a,{lat:p.lat,lng:p.lon})-distKm(a,{lat:q.lat,lng:q.lon}));
  return {opts:list.slice(0,6),near:stA.length?`«${name(stA[0].id)}»`:''};
}
function busDraw(){if(!MAP||!ROUTE||!ROUTE.bus)return;const B=ROUTE.bus,o=B.opts[B.sel||0];routeClear();
  if(!o)return;const A=ROUTE.a,Z=ROUTE.b,p1=[o.fa.lon,o.fa.lat],p2=[o.fb.lon,o.fb.lat];
  ROUTE.geo={type:'MultiLineString',coordinates:[[[A.lng,A.lat],p1],[p1,p2],[p2,[Z.lng,Z.lat]]]};
  if(!MAP.isStyleLoaded())return;
  MAP.addSource('route',{type:'geojson',data:{type:'FeatureCollection',features:[
    {type:'Feature',properties:{k:'w'},geometry:{type:'LineString',coordinates:[[A.lng,A.lat],p1]}},
    {type:'Feature',properties:{k:'b'},geometry:{type:'LineString',coordinates:[p1,p2]}},
    {type:'Feature',properties:{k:'w'},geometry:{type:'LineString',coordinates:[p2,[Z.lng,Z.lat]]}},
    {type:'Feature',properties:{k:'s',n:o.from},geometry:{type:'Point',coordinates:p1}},
    {type:'Feature',properties:{k:'s',n:o.to},geometry:{type:'Point',coordinates:p2}}]}});
  MAP.addLayer({id:'route-case',type:'line',source:'route',filter:['==',['get','k'],'b'],layout:{'line-cap':'round'},paint:{'line-color':'#fff','line-width':10}});
  MAP.addLayer({id:'route',type:'line',source:'route',filter:['==',['get','k'],'b'],layout:{'line-cap':'round'},paint:{'line-color':'#18a34a','line-width':6}});
  MAP.addLayer({id:'route-walk',type:'line',source:'route',filter:['==',['get','k'],'w'],layout:{'line-cap':'round'},paint:{'line-color':'#8e5bff','line-width':4,'line-dasharray':[1,1.8]}});
  MAP.addLayer({id:'route-stops',type:'circle',source:'route',filter:['==',['get','k'],'s'],paint:{'circle-radius':8,'circle-color':'#18a34a','circle-stroke-color':'#fff','circle-stroke-width':3}});
  const xs=[A.lng,Z.lng,p1[0],p2[0]],ys=[A.lat,Z.lat,p1[1],p2[1]];
  MAP.fitBounds([[Math.min(...xs),Math.min(...ys)],[Math.max(...xs),Math.max(...ys)]],{padding:{top:120,bottom:330,left:50,right:70},duration:900,pitch:0,bearing:0})}
/* ================= public transport like 2GIS: every stop on the map; tap a stop → which buses, trolleybuses, trams,
   metro and minibuses stop there, how often they come, and the whole line of any route on the map (OpenStreetMap data) ================= */
const TR={on:store.get('mapTr',true),cells:new Set(),stops:new Map(),busy:0,timer:0,sel:null,line:null,clickAt:0,warned:false};
const TRT={bus:['🚌','Автобус','#18a34a'],trolleybus:['🚎','Троллейбус','#2f80ff'],tram:['🚋','Трамвай','#e5484d'],subway:['🚇','Метро','#8e5bff'],light_rail:['🚈','Электричка','#8e5bff'],train:['🚆','Поезд','#6b7a90'],share_taxi:['🚐','Маршрутка','#f08a00'],minibus:['🚐','Маршрутка','#f08a00']};
const TRDEF={bus:12,trolleybus:15,tram:15,subway:8,light_rail:30,train:60,share_taxi:10,minibus:10};
const TR_CELL=0.02,TR_ZOOM=14;
const trKind=t=>t.station==='subway'||t.subway==='yes'&&t.railway?'subway':t.railway==='tram_stop'||t.tram==='yes'&&!t.bus?'tram':t.trolleybus==='yes'&&t.bus!=='yes'?'trolleybus':'bus';
const trName=t=>t&&(t.name||t['name:ru']||t['name:kk']||t.ref)||'Остановка';
function trSched(){clearTimeout(TR.timer);TR.timer=setTimeout(trLoad,400)}
async function trLoad(){if(!MAP||!MAPV)return;trLayers();if(!TR.on)return;
  if(MAP.getZoom()<TR_ZOOM){if(!TR.warned&&MAP.getZoom()>=12){TR.warned=true;toast('Приблизьте карту — покажем все остановки',2200)}return}
  const b=MAP.getBounds(),c=TR_CELL,need=[];
  for(let y=Math.floor(b.getSouth()/c);y<=Math.floor(b.getNorth()/c);y++)for(let x=Math.floor(b.getWest()/c);x<=Math.floor(b.getEast()/c);x++){const k=x+':'+y;if(!TR.cells.has(k))need.push([k,x,y])}
  if(!need.length||need.length>16)return;
  need.forEach(([k])=>TR.cells.add(k));
  const S0=Math.min(...need.map(n=>n[2]))*c,W0=Math.min(...need.map(n=>n[1]))*c,N0=(Math.max(...need.map(n=>n[2]))+1)*c,E0=(Math.max(...need.map(n=>n[1]))+1)*c,bb=`${S0.toFixed(4)},${W0.toFixed(4)},${N0.toFixed(4)},${E0.toFixed(4)}`;
  const q=`[out:json][timeout:25];(node[highway=bus_stop](${bb});node[public_transport=platform](${bb});node[railway=tram_stop](${bb});node[railway=station][station=subway](${bb}););out body;`;
  TR.busy++;
  try{const j=await overpass(q);j.elements.forEach(e=>{if(e.type==='node'&&e.tags)TR.stops.set(e.id,e)})}catch(e){need.forEach(([k])=>TR.cells.delete(k))}
  TR.busy--;trPaint()}
function trData(){const out=[],seen=[];
  for(const n of TR.stops.values()){const t=n.tags,nm0=trName(t);
    /* the same stop is often drawn twice (pole + platform): keep one */
    if(seen.some(o=>o.n===nm0&&Math.abs(o.lat-n.lat)<.00025&&Math.abs(o.lon-n.lon)<.00035))continue;seen.push({n:nm0,lat:n.lat,lon:n.lon});
    const k=trKind(t);out.push({type:'Feature',properties:{id:n.id,n:nm0,c:TRT[k][2],k},geometry:{type:'Point',coordinates:[n.lon,n.lat]}})}
  return {type:'FeatureCollection',features:out}}
function trLayers(){if(!MAP||!MAP.isStyleLoaded()||MAP.getSource('trstops'))return;
  MAP.addSource('trstops',{type:'geojson',data:trData()});
  const before=MAP.getLayer('route-case')?'route-case':undefined;
  MAP.addLayer({id:'tr-stops',type:'circle',source:'trstops',minzoom:TR_ZOOM,layout:{visibility:TR.on?'visible':'none'},paint:{'circle-radius':['interpolate',['linear'],['zoom'],14,4,17,8],'circle-color':['get','c'],'circle-stroke-color':'#fff','circle-stroke-width':['interpolate',['linear'],['zoom'],14,1.5,17,2.5]}},before);
  MAP.addLayer({id:'tr-names',type:'symbol',source:'trstops',minzoom:16,layout:{visibility:TR.on?'visible':'none','text-field':['get','n'],'text-font':['Noto Sans Regular'],'text-size':11.5,'text-offset':[0,1.1],'text-anchor':'top','text-max-width':8,'text-optional':true},paint:{'text-color':'#24364d','text-halo-color':'#fff','text-halo-width':1.6}},before)}
function trPaint(){if(!MAP)return;const src=MAP.getSource('trstops');if(src)src.setData(trData());else trLayers()}
function trToggle(){TR.on=!TR.on;store.set('mapTr',TR.on);const b=$('.map-tr');if(b)b.classList.toggle('on',TR.on);
  if(MAP)['tr-stops','tr-names'].forEach(l=>{if(MAP.getLayer(l))MAP.setLayoutProperty(l,'visibility',TR.on?'visible':'none')});
  if(!TR.on&&TR.sel)trClose();toast(TR.on?'Остановки и транспорт показаны':'Остановки скрыты',1500);if(TR.on)trSched()}
const trIv=t=>{const v=String(t&&(t['interval']||t['interval:conditional']||'')).match(/(\d{1,2}):(\d{2})|^(\d{1,3})/);return v?(v[3]?+v[3]:(+v[1])*60+(+v[2])):0};
async function trOpen(id){const n=TR.stops.get(+id);if(!n)return;mapSel=null;if(ROUTE){routeClear();ROUTE=null}trLineClear();
  TR.sel={id:n.id,n:trName(n.tags),lat:n.lat,lon:n.lon,busy:true,routes:[]};mapBottom();
  const q=`[out:json][timeout:20];node(${n.id})->.s;node(around.s:40)[public_transport~"^(stop_position|platform)$"]->.n;node(around.s:40)[highway=bus_stop]->.b;(.s;.n;.b;)->.a;rel(bn.a)[type=route][route~"^(bus|trolleybus|tram|subway|light_rail|train|share_taxi|minibus)$"];out tags;`;
  let rs=[];try{rs=(await overpass(q)).elements.filter(e=>e.type==='relation')}catch(e){if(TR.sel&&TR.sel.id===n.id){TR.sel.busy=false;TR.sel.err=true;mapBottom()}return}
  if(!TR.sel||TR.sel.id!==n.id)return;
  const by=new Map();rs.forEach(r=>{const t=r.tags||{},ty=TRT[t.route]?t.route:'bus',ref=t.ref||t.name||'?',k=ty+'|'+ref;
    const o=by.get(k)||{ty,ref,ids:[],to:[],iv:0};o.ids.push(r.id);const to=t.to||(t.name||'').split(/→|=>|-\s/).pop().trim();if(to&&!o.to.includes(to))o.to.push(to);o.iv=o.iv||trIv(t);by.set(k,o)});
  const ord=Object.keys(TRT);TR.sel.routes=[...by.values()].sort((a,b)=>ord.indexOf(a.ty)-ord.indexOf(b.ty)||(parseInt(a.ref)||999)-(parseInt(b.ref)||999)||String(a.ref).localeCompare(b.ref));
  TR.sel.busy=false;mapBottom()}
function trClose(quiet){TR.sel=null;trLineClear();if(!quiet)mapBottom()}
function trPanel(){const T=TR.sel,map2=`https://2gis.kz/search/${encodeURIComponent(T.n)}?m=${T.lon}%2C${T.lat}%2F18`;
  const head=`<div class="map-card"><span class="tr-ic">🚏</span><span class="mid"><b>${esc(T.n)}</b><small>${T.busy?'Ищем, какой транспорт здесь ходит…':T.err?'Не удалось загрузить — проверьте интернет':T.routes.length?T.routes.length+' '+plural(T.routes.length,'маршрут','маршрута','маршрутов'):'Маршрутов не нашли'}</small></span><button class="gbtn ic" data-act="troff" aria-label="Закрыть">${ic('x')}</button></div>`;
  if(T.busy||T.err)return head;
  if(TR.line&&TR.line.busy!==undefined){const L=TR.line,ty=TRT[L.ty]||TRT.bus;
    return head+`<div class="tr-line"><em class="bus-n" style="background:${ty[2]}">${ty[0]} ${esc(L.ref)}</em><span>${L.busy?'Рисуем маршрут…':L.err?'Не удалось загрузить маршрут':`${L.stops} ${plural(L.stops,'остановка','остановки','остановок')}${L.len?' · '+fmtDist(L.len):''}${L.to?' · до «'+esc(L.to)+'»':''}`}</span><button class="gbtn" data-act="trback">Все маршруты</button></div>
      <div class="btns map-acts"><a class="gbtn primary" href="${map2}" target="_blank" rel="noopener">Прибытие онлайн в 2ГИС</a></div>`}
  const rows=T.routes.map((r,i)=>{const ty=TRT[r.ty]||TRT.bus,iv=r.iv||TRDEF[r.ty]||12;
    return `<button class="tr-row" data-act="trroute" data-i="${i}"><em class="bus-n" style="background:${ty[2]}">${ty[0]} ${esc(r.ref)}</em><span class="mid"><b>${r.to.length?'→ '+esc(r.to.slice(0,2).join(' / ')):ty[1]}</b><small>${r.iv?'':'≈ '}каждые ${iv} мин · ждать ≈ ${Math.max(1,Math.round(iv/2))} мин</small></span></button>`}).join('');
  return head+(rows?`<div class="tr-list">${rows}</div><p class="hint bus-hint">Время примерное — по интервалу движения. Нажмите на маршрут, чтобы увидеть его на карте.</p>`:'')+
    `<div class="btns map-acts"><a class="gbtn primary" href="${map2}" target="_blank" rel="noopener">Прибытие онлайн в 2ГИС</a></div>`}
const plural=(n,a,b,c)=>n%10===1&&n%100!==11?a:n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?b:c;
async function trRoute(i){const T=TR.sel;if(!T)return;const r=T.routes[+i];if(!r)return;
  trLineClear();TR.line={ty:r.ty,ref:r.ref,to:r.to[0]||'',busy:true};mapBottom();const L=TR.line;
  const q=`[out:json][timeout:25];rel(${r.ids[0]})->.r;way(r.r);out geom;node(r.r);out;`;
  try{const j=await overpass(q);if(TR.line!==L)return;
    const lines=j.elements.filter(e=>e.type==='way'&&e.geometry).map(w=>w.geometry.map(g=>[g.lon,g.lat]));
    const st=j.elements.filter(e=>e.type==='node'&&e.tags&&(e.tags.public_transport==='platform'||e.tags.highway==='bus_stop'||e.tags.railway==='tram_stop'||e.tags.railway==='station'));
    let len=0;lines.forEach(l=>{for(let k=1;k<l.length;k++)len+=distKm({lat:l[k-1][1],lng:l[k-1][0]},{lat:l[k][1],lng:l[k][0]})});
    Object.assign(L,{busy:false,lines,st:st.map(n=>[n.lon,n.lat,trName(n.tags)]),stops:st.length,len});
    trLineDraw();
    const all=lines.flat().concat(L.st.map(x=>[x[0],x[1]]));if(all.length&&MAP){const xs=all.map(p=>p[0]),ys=all.map(p=>p[1]);
      MAP.fitBounds([[Math.min(...xs),Math.min(...ys)],[Math.max(...xs),Math.max(...ys)]],{padding:{top:110,bottom:300,left:40,right:80},duration:900,pitch:0,bearing:0})}}
  catch(e){if(TR.line===L){L.busy=false;L.err=true}}
  mapBottom()}
function trLineDraw(){const L=TR.line;if(!MAP||!L||!L.lines||!MAP.isStyleLoaded())return;const col=(TRT[L.ty]||TRT.bus)[2];
  const data={type:'FeatureCollection',features:[{type:'Feature',properties:{},geometry:{type:'MultiLineString',coordinates:L.lines}},...L.st.map(p=>({type:'Feature',properties:{s:1,n:p[2]},geometry:{type:'Point',coordinates:[p[0],p[1]]}}))]};
  if(MAP.getSource('trline')){MAP.getSource('trline').setData(data);return}
  MAP.addSource('trline',{type:'geojson',data});
  MAP.addLayer({id:'trline-case',type:'line',source:'trline',filter:['==',['geometry-type'],'LineString'],layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#fff','line-width':['interpolate',['linear'],['zoom'],10,5,16,12]}});
  MAP.addLayer({id:'trline',type:'line',source:'trline',filter:['==',['geometry-type'],'LineString'],layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':col,'line-width':['interpolate',['linear'],['zoom'],10,3,16,7]}});
  MAP.addLayer({id:'trline-st',type:'circle',source:'trline',filter:['==',['geometry-type'],'Point'],paint:{'circle-radius':['interpolate',['linear'],['zoom'],11,3,16,6],'circle-color':'#fff','circle-stroke-color':col,'circle-stroke-width':2.5}});
  MAP.addLayer({id:'trline-n',type:'symbol',source:'trline',minzoom:14,filter:['==',['geometry-type'],'Point'],layout:{'text-field':['get','n'],'text-font':['Noto Sans Regular'],'text-size':11,'text-offset':[0,1],'text-anchor':'top','text-optional':true},paint:{'text-color':'#24364d','text-halo-color':'#fff','text-halo-width':1.6}})}
function trLineClear(){TR.line=null;if(MAP){['trline-n','trline-st','trline','trline-case'].forEach(l=>{if(MAP.getLayer(l))MAP.removeLayer(l)});if(MAP.getSource('trline'))MAP.removeSource('trline')}}
/* route to a friend: free OpenStreetMap routing (car, on foot, by bike), drawn as a line on the map */
let ROUTE=null;
const fmtDur=s=>{const m=Math.max(1,Math.round(s/60));return m<60?m+' мин':Math.floor(m/60)+' ч '+(m%60?m%60+' мин':'')};
function routeLayer(){if(!MAP||!ROUTE||!ROUTE.geo||!MAP.isStyleLoaded())return;
  const data={type:'Feature',geometry:ROUTE.geo,properties:{}};
  if(MAP.getSource('route'))MAP.getSource('route').setData(data);
  else{MAP.addSource('route',{type:'geojson',data});
    MAP.addLayer({id:'route-case',type:'line',source:'route',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#ffffff','line-width':['interpolate',['linear'],['zoom'],10,6,16,14]}});
    MAP.addLayer({id:'route',type:'line',source:'route',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':ROUTE.mode==='foot'?'#8e5bff':'#2f80ff','line-width':['interpolate',['linear'],['zoom'],10,3.5,16,9],...(ROUTE.mode==='foot'?{'line-dasharray':[1,1.6]}:{})}})}}
function routeClear(){if(MAP){['route','route-case','route-walk','route-stops'].forEach(l=>{if(MAP.getLayer(l))MAP.removeLayer(l)});if(MAP.getSource('route'))MAP.removeSource('route')}}
async function mapRoute(id,mode){
  const f=MAPD.friends.find(x=>x.user.id===id);if(!f||!f.geo)return;
  mode=mode||(ROUTE&&ROUTE.mode)||'car';
  let a=myPos();
  if(!a){if(!navigator.geolocation){toast('Не удалось определить, где вы');return}
    store.set('geoAsked',true);toast('Определяем, где вы…',1500);
    try{const p=await new Promise((ok,no)=>navigator.geolocation.getCurrentPosition(ok,no,{enableHighAccuracy:true,timeout:15e3,maximumAge:30e3}));GEO.last=p.coords;a=myPos();mapDraw()}
    catch(e){toast('Разрешите доступ к геопозиции, чтобы построить маршрут',4000);return}}
  const b={lat:f.geo.lat,lng:f.geo.lng};
  routeClear();if(TR.sel)trClose(true);ROUTE={id,mode,a,b,busy:true,at:Date.now()};mapSel=id;mapBottom();
  if(mode==='bus'){try{const bus=await busRoute(a,b);if(!ROUTE||ROUTE.id!==id||ROUTE.mode!=='bus')return;ROUTE.busy=false;ROUTE.bus=bus;busDraw()}
    catch(e){if(ROUTE&&ROUTE.mode==='bus'){ROUTE.busy=false;ROUTE.bus={opts:[],near:''}}}mapBottom();return}
  const prof={car:'routed-car',foot:'routed-foot',bike:'routed-bike'}[mode];
  try{const r=await fetch(`https://routing.openstreetmap.de/${prof}/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`);
    const j=await r.json();if(!ROUTE||ROUTE.id!==id||ROUTE.mode!==mode)return;
    if(!j.routes||!j.routes.length)throw new Error('Маршрут не найден');
    const rt=j.routes[0];Object.assign(ROUTE,{busy:false,geo:rt.geometry,dist:rt.distance,dur:rt.duration});
    routeLayer();const cs=rt.geometry.coordinates,bb=cs.reduce((m,c)=>[Math.min(m[0],c[0]),Math.min(m[1],c[1]),Math.max(m[2],c[0]),Math.max(m[3],c[1])],[180,90,-180,-90]);
    if(MAP)MAP.fitBounds([[bb[0],bb[1]],[bb[2],bb[3]]],{padding:{top:120,bottom:230,left:50,right:70},duration:900,pitch:0,bearing:0});
  }catch(e){if(ROUTE&&ROUTE.id===id){ROUTE.busy=false;ROUTE.err=e.message&&/не найден/.test(e.message)?e.message:'Не получилось построить маршрут'}}
  mapBottom()}
function mapFocus(id){const f=MAPD.friends.find(x=>x.user.id===id);if(TR.sel)trClose(true);mapSel=id;mapDraw();
  if(f&&f.geo&&MAP)MAP.flyTo({center:[f.geo.lng,f.geo.lat],zoom:Math.max(MAP.getZoom(),15),speed:1.6,curve:1.4,essential:true})}
function mapAddSheet(){
  const st=Object.fromEntries(MAPD.friends.map(f=>[f.user.id,f.st]));
  const ids=new Set(Object.keys(S.contacts||{}));Object.values(S.chats).forEach(c=>{if(c.type==='dm')c.members.forEach(m=>ids.add(m))});ids.delete(S.me.id);
  const inc=mapIn(),cand=[...ids].map(i=>S.users[i]).filter(u=>u&&u.username&&st[u.id]!=='in').sort((a,b)=>(st[a.id]==='ok')-(st[b.id]==='ok')||nm(a).localeCompare(nm(b)));
  const row=(u,btn)=>`<div class="row map-row">${avatar(u,'s')}<span class="mid"><span class="top"><span class="nm">${esc(nm(u))}</span></span><span class="sub">@${esc(u.username)}</span></span>${btn}</div>`;
  sheet(`<h2>Друзья на карте</h2>
    <p class="hint">Друг увидит приглашение и сможет согласиться. Вы видите друг друга, только когда согласны оба, и каждый может скрыться в любой момент.</p>
    <div class="map-find"><input class="input" id="mapq" placeholder="Логин, например @aru" autocomplete="off" spellcheck="false"><button class="gbtn primary" data-act="mapfind">Пригласить</button></div>
    ${inc.length?`<div class="section-t">Хотят видеть вас на карте</div>${inc.map(f=>row(f.user,`<button class="gbtn primary" data-act="mapacc" data-id="${f.user.id}">Принять</button><button class="gbtn ic" data-act="mapdel" data-id="${f.user.id}" aria-label="Отклонить">${ic('x')}</button>`)).join('')}`:''}
    <div class="section-t">Ваши контакты</div>
    <div class="map-list">${cand.length?cand.map(u=>row(u,st[u.id]==='ok'?'<span class="map-st ok">На карте</span>':st[u.id]==='out'?'<span class="map-st">Ждём ответа</span>':`<button class="gbtn" data-act="mapinv" data-id="${u.id}">Пригласить</button>`)).join(''):'<p class="hint">Пока нет контактов — пригласите друга по логину</p>'}</div>`);
}
/* sharing your own position: only while the person has switched it on; the phone asks for permission the first time */
/* the Android app (version 5 and up) has a background service: the position keeps updating with the screen off */
const IN_APK_GEO=()=>store.get('apk',0)>=5&&/Android/.test(navigator.userAgent);
async function geoNative(on){try{
  if(on){const r=await api('/api/map/bgkey',{});GEO.native=true;location.href=`intent://start?k=${encodeURIComponent(r.key)}#Intent;scheme=manasenger-geo;package=com.manasenger.app;end`}
  else{GEO.native=false;location.href='intent://stop#Intent;scheme=manasenger-geo;package=com.manasenger.app;end'}}catch(e){}}
function geoGot(c){if(!c)return;const t=Date.now();
  /* a rough network fix doesn't overwrite a fresh precise GPS one */
  if(GEO.last&&c.accuracy>150&&GEO.last.accuracy<c.accuracy/2&&t-GEO.lastAt<30e3)return;
  GEO.last=c;GEO.lastAt=t;if(c.accuracy<150)GEO.lowAcc=false;geoSend();if(MAPV)mapDraw()}
function geoLow(){navigator.geolocation.getCurrentPosition(p=>geoGot(p.coords),()=>{},{enableHighAccuracy:false,timeout:20e3,maximumAge:60e3})}
/* asks the phone for a fresh position (watchPosition alone goes quiet when you stand still or the GPS sleeps) */
function geoPoll(){if(!navigator.geolocation||GEO.watch==null||document.hidden)return;
  navigator.geolocation.getCurrentPosition(p=>geoGot(p.coords),e=>{if(e.code!==1)geoLow()},{enableHighAccuracy:true,timeout:12e3,maximumAge:3e3})}
function geoStart(){
  if(!navigator.geolocation){toast('Это устройство не умеет определять геопозицию');return false}
  if(GEO.watch!=null)return true;store.set('geoAsked',true);
  GEO.watch=navigator.geolocation.watchPosition(p=>geoGot(p.coords),err=>{
    if(err.code===1){toast('Разрешите доступ к геопозиции для Manasenger в настройках телефона или браузера',5000);geoStop(true);return}
    geoLow()},{enableHighAccuracy:true,maximumAge:3e3,timeout:20e3});
  clearInterval(GEO.tick);GEO.tick=setInterval(()=>{if(document.hidden)return;geoPoll();geoSend()},4e3);
  geoPoll();
  if(IN_APK_GEO()&&!GEO.native)setTimeout(()=>{if(GEO.watch!=null&&!GEO.native)geoNative(true)},1500);
  return true}
/* sent when you've moved 10+ metres (no more often than every 4 seconds), and at least every 25 seconds anyway */
function geoSend(force){const c=GEO.last;if(!c)return;const p={lat:c.latitude,lng:c.longitude},t=Date.now();
  const moved=GEO.sentPos?distKm(GEO.sentPos,p)*1000:1e9;
  if(t-GEO.sentAt<3e3)return;
  if(!force&&moved<Math.max(10,Math.min(60,(c.accuracy||0)/2))&&t-GEO.sentAt<25e3)return;
  GEO.sentAt=t;GEO.sentPos=p;MAPD.sharing=true;api('/api/map/loc',{lat:p.lat,lng:p.lng,acc:c.accuracy}).catch(()=>{GEO.sentAt=0})}
function geoStop(silent){if(GEO.watch!=null)navigator.geolocation.clearWatch(GEO.watch);GEO.watch=null;clearInterval(GEO.tick);GEO.sentAt=0;GEO.sentPos=null;
  if(IN_APK_GEO())geoNative(false);
  store.set('geoShare',false);MAPD.sharing=false;api('/api/map/stop',{}).catch(()=>{});if(MAPV)mapDraw()}
/* back to the app: send where you are right away and pull friends' fresh positions */
document.addEventListener('visibilitychange',()=>{if(document.hidden||!S.me)return;if(GEO.watch!=null){geoPoll();geoSend(true)}if(MAPV)mapRefresh(true)});
function shareSheet(){sheet(`<h2>Делиться геопозицией?</h2>
  <p class="hint">Вашу геопозицию увидят <b>только друзья, которых вы добавили на карту</b> и которые согласились. Она обновляется каждые несколько секунд, пока вы двигаетесь${IN_APK_GEO()?', — даже с выключенным экраном (в шторке будет значок)':', пока Manasenger открыт'}. Выключить можно в любой момент этим же переключателем.</p>
  <div class="btns"><button class="gbtn primary" data-act="mapshareon">Включить</button><button class="gbtn" data-act="closemenu">Не сейчас</button></div>`)}
/* «ИИ» tab: chat with a free assistant (Gemini when the server has a key) */
let AI=null,AIbusy=false,AIimg=null,AIctl=null;
function aiList(){if(!AI){AI=store.get('ai',[]);if(!Array.isArray(AI))AI=[]}return AI}
/* the answer is written in Markdown: bold, lists, headings, code — shown nicely (everything is escaped first) */
function aiMd(t){
  const parts=String(t||'').replace(/<think>[\s\S]*?(<\/think>|$)/g,'').replace(/^\s+/,'').split(/```/);
  return parts.map((p,i)=>{
    if(i%2){const nl=p.indexOf('\n'),lang=nl>=0?p.slice(0,nl).trim():'',code=nl>=0?p.slice(nl+1):p;
      return `<pre class="ai-code">${lang&&/^[\w+#.-]{1,20}$/.test(lang)?`<small>${esc(lang)}</small>`:''}<code>${esc(code.replace(/\n$/,''))}</code></pre>`}
    return linkify(p)
      .replace(/`([^`\n]+)`/g,'<code>$1</code>')
      .replace(/\*\*([^*\n]+)\*\*/g,'<b>$1</b>').replace(/__([^_\n]+)__/g,'<b>$1</b>')
      .replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,!?:;]|$)/g,'$1<i>$2</i>')
      .replace(/^#{1,6}\s+(.+)$/gm,'<b class="ai-h">$1</b>')
      .replace(/^(\s*)[-*•]\s+/gm,'$1• ')
      .replace(/^\s*(?:-{3,}|\*{3,})\s*$/gm,'<hr>')
      .replace(/^&gt;\s?(.*)$/gm,'<span class="ai-q">$1</span>');
  }).join('');
}
function aiMsgs(){const l=aiList();
  return l.length?l.map((m,i)=>`<div class="ai-m ${m.r==='a'?'a':'u'}"${m.live?' id="ailive"':''}>${m.img||m.th?`<img decoding="async" class="ai-pic" src="${m.img||m.th}" alt="">`:''}${m.r==='a'?aiMd(m.t)+(m.live?'<i class="ai-cur"></i>':''):esc(m.t)}</div>${m.r==='a'&&!m.live&&m.t?`<div class="ai-tools"><button data-act="aicopy" data-i="${i}">Копировать</button>${i===l.length-1&&!AIbusy?`<button data-act="airegen">Ответить заново</button>`:''}</div>`:''}`).join('')+(AIbusy&&!(l[l.length-1]||{}).live?'<div class="ai-m a dots"><i></i><i></i><i></i></div>':'')
    :`<div class="ai-empty"><span class="tt-logo big">✦</span><b>Спросите что угодно</b><small>Помощь с учёбой, текстами, переводом, кодом, идеями, свежими новостями — бесплатно, прямо в Manasenger. Можно прикрепить фото.</small>
      <div class="ai-sug">${['Объясни тему по физике простыми словами','Придумай подпись к фото','Переведи текст на английский','Составь план на неделю'].map(x=>`<button class="gbtn" data-act="aisug">${x}</button>`).join('')}</div></div>`}
function aiHTML(){return `<div class="ai-box"><div class="ai-msgs" id="aimsgs">${aiMsgs()}</div>
  ${AIimg?`<div class="ai-att"><img decoding="async" src="${AIimg}" alt=""><button class="x" data-act="aiunpic" aria-label="Убрать фото">${ic('x')}</button></div>`:''}<div class="ai-in glass"><button class="x" data-act="aipic" title="Фото" aria-label="Прикрепить фото">${ic('image')}</button><input type="file" id="aifile" accept="image/*" hidden><textarea id="aiq" rows="1" placeholder="Сообщение для ИИ" maxlength="4000"></textarea><button class="sendb" data-act="aisend" aria-label="${AIbusy?'Остановить':'Отправить'}">${AIbusy?'<i class="ai-stop"></i>':ic('send')}</button>${aiList().length?`<button class="x" data-act="aiclear" title="Новый разговор" aria-label="Новый разговор">${ic('x')}</button>`:''}</div></div>`}
/* shrinks a picture so it is quick to send (and small to keep on the phone) */
function picScale(src,max,q){return new Promise(ok=>{const im=new Image();im.onload=()=>{const k=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');
  c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);ok(c.toDataURL('image/jpeg',q))};im.onerror=()=>ok(null);im.src=src})}
function aiFile(f){if(!f||!/^image\//.test(f.type))return;const u=URL.createObjectURL(f);
  picScale(u,1280,.82).then(d=>{URL.revokeObjectURL(u);if(!d)return toast('Не получилось открыть фото');AIimg=d;aiRe();const q=$('#aiq');q&&q.focus()})}
function aiRe(){const o=$('#aiq'),v=o?o.value:'';renderSide();const q=$('#aiq');if(q&&v)q.value=v;aiDraw()}
function aiDraw(live){const b=$('#aimsgs');if(!b)return;
  /* while the answer is being written only that one bubble is redrawn, not the whole conversation */
  const lv=live&&$('#ailive'),am=aiList()[aiList().length-1];if(lv&&am&&am.live){const sc=$('#list'),near=!sc||sc.scrollHeight-sc.scrollTop-sc.clientHeight<140;lv.innerHTML=aiMd(am.t)+'<i class="ai-cur"></i>';if(near&&sc)sc.scrollTop=sc.scrollHeight;return}
 const sc=$('#list'),near=!live||!sc||sc.scrollHeight-sc.scrollTop-sc.clientHeight<140;b.innerHTML=aiMsgs();b.scrollTop=b.scrollHeight;if(near&&sc)sc.scrollTop=sc.scrollHeight}
async function aiSend(again){
  const q=$('#aiq'),t=q?q.value.trim():'';if(AIbusy)return;
  const l=aiList();
  if(again){while(l.length&&l[l.length-1].r==='a')l.pop();if(!l.length)return}
  else{if(!t&&!AIimg)return;const m={r:'u',t};if(AIimg){m.img=AIimg;m.th=await picScale(AIimg,160,.6)}l.push(m);AIimg=null;if(q)q.value=''}
  AIbusy=true;renderSide();aiDraw();
  const send=l.map((x,i)=>i===l.length-1?{r:x.r,t:x.t,img:x.img}:{r:x.r,t:x.t||(x.th?'[фото]':'')});
  const body={msgs:send,tz:(()=>{try{return Intl.DateTimeFormat().resolvedOptions().timeZone}catch(e){return ''}})()};
  const a={r:'a',t:'',live:true};let raf=0;const paint=()=>{raf=0;aiDraw(true)};
  AIctl=window.AbortController?new AbortController():null;
  /* one quiet retry when the answer didn't come (busy free service, bad connection) — the person just sees the answer */
  for(let attempt=0;attempt<2;attempt++){
    try{
      const r=await fetch('/api/ai/stream',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AIctl&&AIctl.signal});
      if(!r.ok||!r.body){let j=null;try{j=await r.json()}catch(e){}
        if(r.status===404||!r.body){const j2=await api('/api/ai',body);a.t=j2.t;if(!l.includes(a))l.push(a)}else{const er=new Error((j&&j.error)||'ИИ не ответил');er.hard=r.status===429||r.status===401;throw er}}
      else{if(!l.includes(a))l.push(a);const rd=r.body.getReader(),dec=new TextDecoder();let buf='';
        for(;;){const {done,value}=await rd.read();if(done)break;buf+=dec.decode(value,{stream:true});let i;
          while((i=buf.indexOf('\n'))>=0){const ln=buf.slice(0,i);buf=buf.slice(i+1);if(!ln)continue;let o;try{o=JSON.parse(ln)}catch(e){continue}
            if(o.d){a.t+=o.d;if(!raf)raf=requestAnimationFrame(paint)}if(o.error)throw new Error(o.error)}}
        if(!a.t)throw new Error('ИИ не ответил')}
      break;
    }catch(e){
      if(e.name==='AbortError')break;
      if(a.t)break; /* part of the answer came: keep it */
      if(attempt===0&&!e.hard){await new Promise(k=>setTimeout(k,1200));continue}
      toast(e.message||'ИИ не ответил');const k=l.indexOf(a);if(k>=0)l.splice(k,1);
    }
  }
  if(!a.t){const k=l.indexOf(a);if(k>=0)l.splice(k,1)}
  delete a.live;AIbusy=false;AIctl=null;if(l.length>60)l.splice(0,l.length-60);store.set('ai',l.map(x=>({r:x.r,t:x.t,th:x.th})));
  if(S.tab==='ai'){renderSide();aiDraw()}
}
function aiStop(){if(AIctl)AIctl.abort()}
function linkifyOld(t){
  return esc(t).replace(/\bhttps?:\/\/[^\s<]+[^\s<.,:;"')\]!?]/g,u=>`<a href="${u}" target="_blank" rel="noopener noreferrer">${u}</a>`);
}
/* puts new HTML into a box but keeps every element that did not change: pictures don't reload,
   voice messages and video circles keep playing, and the phone does much less work */
function patchHTML(box,h){
  const t=document.createElement('div');t.innerHTML=h;
  const olds=new Map();for(const o of box.children){const k=o._h;if(k!==undefined){if(!olds.has(k))olds.set(k,[]);olds.get(k).push(o)}}
  let cur=box.firstChild;
  for(const n of [...t.children]){
    const k=n.outerHTML,pool=olds.get(k),reuse=pool&&pool.shift();
    if(reuse){if(reuse===cur)cur=cur.nextSibling;else box.insertBefore(reuse,cur)}
    else{n._h=k;box.insertBefore(n,cur)}
  }
  while(cur){const nx=cur.nextSibling;cur.remove();cur=nx}
}
/* like patchHTML, but takes the pieces one by one: a message that did not change is not even parsed again,
   so a new message in a long chat costs one message of work, not a hundred */
const TPL=document.createElement('template');
function patchList(box,arr){
  const olds=new Map();for(const o of box.children){const k=o._h;if(k!==undefined){let p=olds.get(k);if(!p)olds.set(k,p=[]);p.push(o)}}
  let cur=box.firstChild;
  for(const s of arr){if(!s)continue;const pool=olds.get(s),reuse=pool&&pool.shift();
    if(reuse){if(reuse===cur)cur=cur.nextSibling;else box.insertBefore(reuse,cur);continue}
    TPL.innerHTML=s;const kids=[...TPL.content.children];if(kids.length===1)kids[0]._h=s;
    for(const n of kids)box.insertBefore(n,cur)}
  while(cur){const nx=cur.nextSibling;cur.remove();cur=nx}
}
function renderMsgs(toBottom){
  const box=$('#msgs'),c=S.chats[S.cur];if(!box||!c)return;
  const list=S.msgs[c.id];
  if(!list){box.innerHTML='<div class="sys">Загружаем…</div>';return}
  const near=box.scrollHeight-box.scrollTop-box.clientHeight<140;
  const win=S.win[c.id]||WIN,from=Math.max(0,list.length-win),shown=list.slice(from);
  const H=[];H.push((from>0||S.more[c.id])?`<button class="gbtn more" data-act="older">Показать раньше</button>`:'');
  if(!list.length)H.push(`<div class="sys glass pill" style="margin-top:auto">${c.type==='channel'?'Это начало канала '+esc(chatName(c))+' 👋':c.type==='self'?'Сохраняй сюда заметки, ссылки и фото. Пересылай важное из других чатов ⭐':'Напиши первое сообщение 👋'}</div>`);
  let day='';
  const fresh=S.fresh;S.fresh=null;
  /* groups and servers: small avatars under the latest of my messages each person has read */
  const seenAt=new Map();
  if(c.type==='group'||c.type==='channel'){const r=c.read||{},mine=shown.filter(m=>m.from===S.me.id&&!m.pending&&!m.sys&&!m.del);
    c.members.forEach(u=>{if(u===S.me.id||!r[u])return;let last=null;for(const m of mine){if(m.ts<=r[u])last=m;else break}if(last){if(!seenAt.has(last.id))seenAt.set(last.id,[]);seenAt.get(last.id).push(u)}})}
  shown.forEach((m,i)=>{const d=new Date(m.ts).toDateString();if(d!==day){day=d;H.push(`<div class="day glass pill">${dayLabel(m.ts)}</div>`)}let x=msgHTML(c,m,shown[i-1],shown[i+1]);if(fresh===m.id)x=x.replace('class="m ','class="m new ');H.push(x);
    const sa=seenAt.get(m.id);if(sa)H.push(`<button class="seen" data-act="readers" data-id="${m.id}" title="Кто прочитал">${sa.slice(0,5).map(u=>avatar(S.users[u],'xs',false)).join('')}${sa.length>5?`<small>+${sa.length-5}</small>`:''}</button>`)});
  const prevH=box.scrollHeight,prevT=box.scrollTop,fromBottom=prevH-prevT-box.clientHeight;
  patchList(box,H);
  /* stay at the bottom after sending and when new messages come; otherwise keep the same place */
  const place=()=>{if(toBottom||near)box.scrollTop=box.scrollHeight;else if(toBottom===null)box.scrollTop=box.scrollHeight-prevH+prevT;else box.scrollTop=box.scrollHeight-box.clientHeight-fromBottom};
  place();requestAnimationFrame(place);watchRounds();
  /* pictures that load later make the chat taller: keep the bottom in view */
  if(toBottom||near)box.querySelectorAll('img').forEach(im=>{if(!im.complete)im.addEventListener('load',()=>{if(box.scrollHeight-box.scrollTop-box.clientHeight<400)box.scrollTop=box.scrollHeight},{once:true})});
}
async function loadOlder(){
  const c=S.cur,l=S.msgs[c];if(!l||!l.length)return;
  const win=S.win[c]||WIN;if(l.length>win){S.win[c]=win+WIN;renderMsgs(null);return}
  try{const r=await api(`/api/messages?chat=${c}&before=${l[0].ts}`);S.msgs[c]=r.messages.concat(l);S.more[c]=r.more;S.win[c]=(S.win[c]||WIN)+r.messages.length;if(S.cur===c)renderMsgs(null)}catch(e){toast(e.message)}
}
function markRead(){
  const c=S.chats[S.cur];if(!c||document.hidden)return;
  const l=S.msgs[c.id];const last=l&&l[l.length-1];
  if(c.unread){c.unread=0;renderSide();updateTitle()}
  if(last&&((c.read||{})[S.me.id]||0)<last.ts){c.read=c.read||{};c.read[S.me.id]=last.ts;wsSend({t:'read',chat:c.id,ts:last.ts})}
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)markRead()});

function renderCtx(){
  const el=$('#ctx');if(!el)return;
  const r=S.reply||S.edit;
  if(!r){el.innerHTML='';return}
  const m=r.m;
  el.innerHTML=`<div class="ctx-bar glass pill">${ic(S.edit?'edit':'reply')}<span class="mid"><b>${S.edit?'Редактирование':'Ответ '+esc(nm(S.users[m.from]))}</b><span>${esc(m.text||(m.img?'📷 Фото':''))}</span></span>
    <button class="gbtn ic" data-act="ctxx" aria-label="Отменить">${ic('x')}</button></div>`;
}
function autosize(t){t.style.height='auto';const h=Math.min(140,t.scrollHeight);t.style.height=h+'px';const box=t.closest('.comp-in');if(box)box.classList.toggle('multi',h>44);compState()}
/* empty message box: the microphone / camera button instead of "send" */
function compState(){const t=$('#txt'),c=document.querySelector('.composer');if(t&&c)c.classList.toggle('empty',!t.value.trim()&&!S.edit)}
let cidN=0;
function sendMsg(img){
  const c=S.chats[S.cur],t=$('#txt');if(!c||!t)return;
  const text=t.value.trim();
  if(S.edit){if(text)wsSend({t:'edit',chat:c.id,id:S.edit.m.id,text});S.edit=null;t.value='';autosize(t);renderCtx();return}
  if(!text&&!img)return;
  if(!WS||WS.readyState!==1){toast('Нет связи. Переподключаемся…');return}
  const cid='c'+(++cidN)+Date.now();
  const tmp={id:cid,from:S.me.id,ts:Date.now(),text,pending:true};if(img)tmp.img=img;
  if(S.reply)tmp.reply={id:S.reply.m.id,from:S.reply.m.from,text:(S.reply.m.text||'📷 Фото').slice(0,120)};
  (S.msgs[c.id]=S.msgs[c.id]||[]).push(tmp);
  const once=!!(img&&S.once&&c.type!=='self');if(once){tmp.once={k:'photo',seen:[]};S.once=false;renderOnceBtn()}
  wsSend({t:'send',chat:c.id,text,img,once,reply:S.reply&&S.reply.m.id,cid});
  S.reply=null;t.value='';S.draft[c.id]='';autosize(t);renderCtx();renderMsgs(true);
}
/* images are shrunk in the browser before sending: max 1600 px, JPEG */
let SHRINK_WEBP=null;
function shrink(file,max=1600,q=.82){
  return new Promise((ok,bad)=>{
    if(!/^image\//.test(file.type))return bad(new Error('Это не картинка'));
    const img=new Image(),url=URL.createObjectURL(file);
    img.onload=()=>{
      let w=img.naturalWidth,h=img.naturalHeight;const k=Math.min(1,max/Math.max(w,h));w=Math.round(w*k);h=Math.round(h*k);
      const cv=document.createElement('canvas');cv.width=w;cv.height=h;cv.getContext('2d').drawImage(img,0,0,w,h);URL.revokeObjectURL(url);
      /* WebP is about a third smaller than JPEG at the same look; browsers that can't make it give back PNG, then JPEG is used */
      const fmt=SHRINK_WEBP!==false&&(SHRINK_WEBP=SHRINK_WEBP??cv.toDataURL('image/webp',.5).startsWith('data:image/webp'))?'image/webp':'image/jpeg';
      let d=cv.toDataURL(fmt,q);
      while(d.length>1.25e6&&q>.4){q-=.12;d=cv.toDataURL(fmt,q)}
      d.length>1.6e6?bad(new Error('Картинка слишком большая')):ok(d);
    };
    img.onerror=()=>bad(new Error('Не удалось открыть картинку'));img.src=url;
  });
}

/* =================================================================== VOICE, VIDEO CIRCLES, VIDEOS
   Hold the round button to record (voice or video circle); slide left to cancel, slide up to keep recording hands-free.
   A short tap switches between voice and video circle. Files go to the server first, then the message is sent. */
function uploadMedia(blob,kind,onProgress){
  return new Promise((ok,bad)=>{
    const x=new XMLHttpRequest();x.open('POST','/api/upload?kind='+kind);x.setRequestHeader('Content-Type',blob.type||'application/octet-stream');
    x.upload.onprogress=e=>{if(e.lengthComputable&&onProgress)onProgress(Math.round(e.loaded/e.total*100))};
    x.onload=()=>{let j=null;try{j=JSON.parse(x.responseText)}catch(e){}x.status===200&&j?ok(j):bad(new Error((j&&j.error)||'Не удалось отправить файл'))};
    x.onerror=()=>bad(new Error('Нет связи с сервером'));
    /* no progress for 40 seconds (the server is restarting, the connection dropped): give up and say so */
    let last=Date.now();const p0=x.upload.onprogress;x.upload.onprogress=e=>{last=Date.now();p0(e)};
    const wd=setInterval(()=>{if(Date.now()-last>40e3){clearInterval(wd);x.abort();bad(new Error('Файл не отправился: нет связи с сервером. Попробуй ещё раз'))}},2000);
    x.onloadend=()=>clearInterval(wd);
    x.send(blob);
  });
}
/* a message that shows at once with a progress bar while its file uploads */
async function sendMedia(blob,media,text){
  const c=S.chats[S.cur];if(!c)return;
  const cid='c'+(++cidN)+Date.now(),tmp={id:cid,from:S.me.id,ts:Date.now(),text:text||'',pending:true,media:Object.assign({local:URL.createObjectURL(blob),progress:0},media)};
  const once=!!(S.once&&c.type!=='self');if(once){tmp.once={k:media.k,dur:media.dur,seen:[]};S.once=false;renderOnceBtn()}
  if(S.reply){tmp.reply={id:S.reply.m.id,from:S.reply.m.from,text:(S.reply.m.text||'').slice(0,120)}}
  const reply=S.reply&&S.reply.m.id;S.reply=null;renderCtx();
  (S.msgs[c.id]=S.msgs[c.id]||[]).push(tmp);renderMsgs(true);
  let last=0;
  try{
    const r=await uploadMedia(blob,media.k,p=>{tmp.media.progress=p;if(Date.now()-last>250){last=Date.now();const el=document.querySelector(`.m[data-id="${cid}"] .rnd-t, .m[data-id="${cid}"] .vm-t, .m[data-id="${cid}"] .vid-t`);if(el)el.innerHTML=(media.k==='round'?'<i class="spin"></i>':'')+p+'%'}});
    tmp.media.url=r.url;
    const out={k:media.k,url:r.url,dur:media.dur};if(media.wave)out.wave=media.wave;if(media.mirror)out.mirror=1;if(media.w){out.w=media.w;out.h=media.h}if(media.poster)out.poster=media.poster;
    if(!wsSend({t:'send',chat:c.id,text:text||'',media:out,once,reply,cid}))throw new Error('Нет связи. Переподключаемся…');
  }catch(e){toast(e.message);const l=S.msgs[c.id],i=l.indexOf(tmp);if(i>=0)l.splice(i,1);renderMsgs()}
}
/* a video from the gallery: its length, size and a still picture for the bubble */
async function sendVideoFile(f){
  if(f.size>45e6){toast('Видео слишком большое — до 45 МБ. Обрежь его в галерее.');return}
  const url=URL.createObjectURL(f),v=document.createElement('video');v.muted=true;v.playsInline=true;v.preload='auto';v.src=url;
  try{
    await new Promise((ok,bad)=>{v.onloadeddata=ok;v.onerror=()=>bad(new Error('Не удалось открыть видео'));setTimeout(ok,4000)});
    try{v.currentTime=Math.min(.5,(v.duration||1)/3);await new Promise(ok=>{v.onseeked=ok;setTimeout(ok,1500)})}catch(e){}
    const w=v.videoWidth||640,h=v.videoHeight||360,k=Math.min(1,480/Math.max(w,h)),cv=document.createElement('canvas');cv.width=Math.round(w*k);cv.height=Math.round(h*k);
    let poster='';try{cv.getContext('2d').drawImage(v,0,0,cv.width,cv.height);poster=cv.toDataURL('image/jpeg',.7)}catch(e){}
    const text=($('#txt')||{}).value||'';if($('#txt')){$('#txt').value='';autosize($('#txt'))}
    sendMedia(f,{k:'video',dur:v.duration&&isFinite(v.duration)?v.duration:0,w,h,poster,posterLocal:poster},text.trim());
  }catch(e){toast(e.message)}finally{setTimeout(()=>URL.revokeObjectURL(url),60000)}
}
function hasVideo(blob){
  return new Promise(ok=>{
    const v=document.createElement('video'),u=URL.createObjectURL(blob);v.muted=true;v.playsInline=true;v.preload='metadata';
    const done=r=>{clearTimeout(t);URL.revokeObjectURL(u);ok(r)};
    v.onloadedmetadata=()=>done(v.videoWidth>0);v.onerror=()=>done(true); /* can't check here: send it as a circle */
    const t=setTimeout(()=>done(true),4000);v.src=u;
  });
}
const REC={
  on:false,
  mime(kind){
    /* WebM first: some phones say they can record MP4 video but write only the sound.
       Safari (iPhone, Mac) records only MP4, so it keeps MP4. */
    const safari=/^((?!chrome|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent);
    const c=kind==='round'?(safari?['video/mp4;codecs=avc1,mp4a','video/mp4']:['video/webm;codecs=vp8,opus','video/webm;codecs=vp9,opus','video/webm','video/mp4;codecs=avc1,mp4a','video/mp4']):['audio/mp4','audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus'];
    return c.find(t=>window.MediaRecorder&&MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(t))||'';
  },
  async start(kind){
    if(this.on)return;if(!window.MediaRecorder){toast('Этот браузер не умеет записывать. Обнови его');return}
    if(CALL||VC){toast('Сначала заверши звонок');return}
    this.on=true;this.kind=kind;this.cancelled=false;this.locked=false;this.wave=[];
    try{
      this.stream=await navigator.mediaDevices.getUserMedia(kind==='round'?{audio:AUDIO,video:isLite()?{facingMode:'user',width:{ideal:480},height:{ideal:480},aspectRatio:{ideal:1},frameRate:{ideal:30,max:30}}:{facingMode:'user',width:{ideal:720},height:{ideal:720},aspectRatio:{ideal:1},frameRate:{ideal:30,max:30},resizeMode:{ideal:'crop-and-scale'}}}:{audio:AUDIO});
    }catch(e){this.on=false;toast(e.name==='NotAllowedError'?'Нет доступа к '+(kind==='round'?'камере':'микрофону')+'. Разреши его в настройках браузера.':'Не удалось включить '+(kind==='round'?'камеру':'микрофон'));return}
    if(!this.on){this.stream.getTracks().forEach(t=>t.stop());return} /* released before the microphone was ready */
    this.stream=await micWrap(this.stream);
    if(!this.on){this.stream.getTracks().forEach(t=>t.stop());return}
    let rec=this.stream;
    if(kind==='round'){
      /* the camera is recorded as it is (drawing it through a canvas records black on many Android phones);
         the circle shape and the selfie mirror are done when it is shown */
      const v=this.v=document.createElement('video');v.muted=true;v.playsInline=true;v.setAttribute('playsinline','');v.autoplay=true;v.srcObject=this.stream;
      this.poster='';await v.play().catch(()=>{});
      setTimeout(()=>{try{const w=v.videoWidth,h=v.videoHeight,m=Math.min(w,h);if(!m)return;const cv=document.createElement('canvas');cv.width=cv.height=360;const x=cv.getContext('2d');x.translate(360,0);x.scale(-1,1);x.drawImage(v,(w-m)/2,(h-m)/2,m,m,0,0,360,360);this.poster=cv.toDataURL('image/jpeg',.7)}catch(e){}},700);
    }
    const a=ac();if(a){try{const src=a.createMediaStreamSource(this.stream),an=a.createAnalyser();an.fftSize=512;src.connect(an);const buf=new Uint8Array(256);
      this.meter=setInterval(()=>{an.getByteTimeDomainData(buf);let s=0;for(let i=0;i<buf.length;i++){const q=(buf[i]-128)/128;s+=q*q}this.wave.push(Math.min(31,Math.round(Math.sqrt(s/buf.length)*140)));const d=document.querySelector('.rec-dot');if(d)d.style.transform=`scale(${1+Math.min(.8,Math.sqrt(s/buf.length)*4)})`},100)}catch(e){}}
    /* the sound goes through a small studio chain: rumble filter, compressor and a bit of gain —
       the voice is louder, even and clear, without wind and hum (only when the audio engine is running) */
    this.fx=null;
    if(!this.stream._mn&&a&&a.state==='running'&&a.createMediaStreamDestination){try{
      const src=a.createMediaStreamSource(this.stream),hp=a.createBiquadFilter(),pres=a.createBiquadFilter(),cmp=a.createDynamicsCompressor(),g=a.createGain(),dst=a.createMediaStreamDestination();
      hp.type='highpass';hp.frequency.value=85;hp.Q.value=.7;
      pres.type='peaking';pres.frequency.value=3200;pres.Q.value=.9;pres.gain.value=3; /* clearer speech */
      cmp.threshold.value=-26;cmp.knee.value=10;cmp.ratio.value=3.5;cmp.attack.value=.004;cmp.release.value=.22;
      g.gain.value=1.7;
      src.connect(hp);hp.connect(pres);pres.connect(cmp);cmp.connect(g);g.connect(dst);
      const at=dst.stream.getAudioTracks()[0];
      if(at){rec=new MediaStream([at].concat(this.stream.getVideoTracks()));this.fx={src,dst}}
    }catch(e){rec=this.stream;this.fx=null}}
    const mime=this.mime(kind);this.chunks=[];
    try{this.mr=new MediaRecorder(rec,mime?{mimeType:mime,audioBitsPerSecond:kind==='voice'?64000:128000,videoBitsPerSecond:kind==='round'?(isLite()?900000:2000000):undefined}:undefined)}catch(e){try{this.mr=new MediaRecorder(this.stream,mime?{mimeType:mime}:undefined)}catch(e2){this.mr=new MediaRecorder(this.stream)}}
    this.mr.ondataavailable=e=>{if(e.data&&e.data.size)this.chunks.push(e.data)};
    this.mr.onstop=()=>this.done();
    this.mr.start(500);this.t0=Date.now();navigator.vibrate&&navigator.vibrate(15);
    this.ui();this.tick=setInterval(()=>{const t=$('#recTime');if(t)t.textContent=clock((Date.now()-this.t0)/1000);if(Date.now()-this.t0>(kind==='round'?60e3:600e3))this.stop(true)},250);
  },
  ui(){
    const comp=document.querySelector('.composer');if(!comp)return;comp.classList.add('recording');
    let bar=$('#recBar');if(!bar){bar=document.createElement('div');bar.id='recBar';bar.className='rec-bar glass pill';comp.querySelector('.comp-row').appendChild(bar)}
    bar.innerHTML=`<i class="rec-dot"></i><b id="recTime">0:00</b>${this.locked?`<button class="gbtn" data-act="rec-cancel">${ic('trash')}Отмена</button><button class="gbtn primary" data-act="rec-send">${ic('send')}Отправить</button>`:`<span class="rec-hint">← влево — отмена · вверх — без рук</span>`}`;
    if(this.kind==='round'&&!$('#recRound')){const r=document.createElement('div');r.id='recRound';r.className='rec-round';r.appendChild(this.v);document.body.appendChild(r);this.v.play().catch(()=>{})}
  },
  stop(send){
    if(!this.on)return;this.cancelled=!send;this.on=false;clearInterval(this.tick);clearInterval(this.meter);cancelAnimationFrame(this.raf);
    try{this.mr&&this.mr.state!=='inactive'?this.mr.stop():this.done()}catch(e){this.done()}
    this.stream&&this.stream.getTracks().forEach(t=>t.stop());
    if(this.fx){const fx=this.fx;this.fx=null;setTimeout(()=>{try{fx.src.disconnect();fx.dst.stream.getTracks().forEach(t=>t.stop())}catch(e){}},600)}
    const comp=document.querySelector('.composer');if(comp)comp.classList.remove('recording');const b=$('#recBar');if(b)b.remove();const r=$('#recRound');if(r)r.remove();
  },
  done(){
    const dur=(Date.now()-this.t0)/1000;if(this.cancelled||!this.chunks||!this.chunks.length){if(!this.cancelled&&this.t0)toast('Ничего не записалось');return}
    if(dur<.7){toast('Удерживай кнопку, чтобы записать');return}
    const type=(this.mr&&this.mr.mimeType||this.mime(this.kind)||'').split(';')[0]||(this.kind==='round'?'video/webm':'audio/webm');
    const blob=new Blob(this.chunks,{type});this.chunks=[];
    const w=this.wave,N=40,wave=Array.from({length:N},(_,i)=>{const a=Math.floor(i*w.length/N),b=Math.max(a+1,Math.floor((i+1)*w.length/N));let m=0;for(let k=a;k<b&&k<w.length;k++)m=Math.max(m,w[k]);return m});
    if(this.kind!=='round'){sendMedia(blob,{k:'voice',dur,wave});return}
    /* make sure the circle really has a picture; if the phone recorded only sound, send it as a voice message */
    const poster=this.poster||'';
    hasVideo(blob).then(ok=>{
      if(ok)sendMedia(blob,{k:'round',dur,mirror:1,poster,posterLocal:poster});
      else{toast('Камера на этом устройстве не записала видео — отправили как голосовое',5000);sendMedia(new Blob([blob],{type:(blob.type||'').replace('video','audio')||'audio/webm'}),{k:'voice',dur,wave})}
    });
  }
};
/* the round button: hold to record, short tap switches voice / video circle */
(function(){
  let hold=null,sx=0,sy=0,pid=null,started=false;
  document.addEventListener('pointerdown',e=>{
    const b=e.target.closest('#recb');if(!b)return;e.preventDefault();micCtx();sx=e.clientX;sy=e.clientY;pid=e.pointerId;started=false;
    try{b.setPointerCapture(e.pointerId)}catch(x){}
    hold=setTimeout(()=>{hold=null;started=true;REC.start(S.recKind||'voice')},220);
  });
  document.addEventListener('pointermove',e=>{
    if(e.pointerId!==pid||!REC.on||REC.locked)return;const dx=e.clientX-sx,dy=e.clientY-sy;
    const bar=$('#recBar');if(bar)bar.style.transform=dx<0?`translateX(${Math.max(-120,dx)/3}px)`:'';
    if(dx<-110){pid=null;REC.stop(false);toast('Запись отменена')}
    else if(dy<-80){REC.locked=true;REC.ui();navigator.vibrate&&navigator.vibrate(10)}
  });
  const up=e=>{
    if(e.pointerId!==pid)return;pid=null;
    if(hold){clearTimeout(hold);hold=null; /* a short tap: switch voice / video circle */
      S.recKind=(S.recKind||'voice')==='voice'?'round':'voice';const b=$('#recb');if(b){b.dataset.kind=S.recKind;b.innerHTML=ic(S.recKind==='round'?'camera':'mic')}
      if(!S.recHint){S.recHint=1;toast(S.recKind==='round'?'Видеокружок: удерживай кнопку, чтобы записать':'Голосовое: удерживай кнопку, чтобы записать')}return}
    if(started&&REC.on&&!REC.locked)REC.stop(true);
  };
  document.addEventListener('pointerup',up);document.addEventListener('pointercancel',e=>{if(e.pointerId===pid&&REC.on&&!REC.locked){pid=null;REC.stop(true)}});
})();

/* ---------- message menu: the "click GUI" ---------- */
function msgMenu(id,x,y){
  const l=S.msgs[S.cur]||[],m=l.find(v=>v.id===id);if(!m||m.del||m.pending||m.sys)return;
  const me=m.from===S.me.id;
  const c=S.chats[S.cur],starred=S.stars.has(S.cur+':'+m.id);
  const items=[['reply','reply','Ответить'],
    ['star','star',starred?'Убрать из важного':'Отметить важным'],
    ['fwd','fwd','Переслать'],
    c&&c.type!=='self'?['saved','book','В Избранное']:null,
    m.sticker&&m.pack?['pack','smile','Набор стикеров']:null,
    m.sticker?['savestk','save','В мой набор']:null,
    me&&c&&(c.type==='group'||c.type==='channel')?['readers','eye','Кто прочитал']:null,
    m.text?['copy','copy','Копировать']:null,me&&m.text&&!m.call?['edit','edit','Изменить']:null,me&&!m.call?['del','trash','Удалить','bad']:null].filter(Boolean);
  if(m.call)return;
  openMenu(`<div class="emo">${quickRe().map(e=>`<button data-act="react" data-id="${m.id}" data-e="${esc(e)}">${e}</button>`).join('')}<button class="emo-more" data-act="remore" data-id="${m.id}" aria-label="Все реакции">${ic('plus')}</button></div>`+
    items.map(([a,i,t,cls])=>`<button class="it ${cls||''}" data-act="mm-${a}" data-id="${m.id}">${ic(i)}${t}</button>`).join(''),x,y);
}
/* forward a message to any chat, Saved Messages first */
function forwardSheet(id){
  const from=S.cur,list=sortedChats().concat(Object.values(S.chats).filter(c=>c.type==='channel'));
  sheet(`<h2>Переслать</h2><p class="sub">Выбери чат</p><div class="pick-list" style="max-height:min(420px,60vh)">${list.map(c=>`<button class="row" data-act="dofwd" data-id="${id}" data-to="${c.id}" data-from="${from}">${chatAvatar(c,'s')}<span class="mid"><span class="nm">${esc(chatName(c))}</span></span></button>`).join('')}</div>`);
}
const selfId=()=>{const c=Object.values(S.chats).find(x=>x.type==='self');return c&&c.id};
async function starredSheet(){
  sheet(`<h2>⭐ Важное</h2><p class="sub">Сообщения, отмеченные звёздочкой во всех чатах</p><div id="stl"><div class="empty">Загружаем…</div></div>`);
  try{
    const r=await api('/api/starred');r.users.forEach(u=>S.users[u.id]=Object.assign(S.users[u.id]||{},u));
    const el=$('#stl');if(!el)return;
    el.innerHTML=r.items.length?r.items.map(({chat,msg})=>{const c=S.chats[chat];if(!c)return '';const u=S.users[msg.from];
      return `<button class="row star-row" data-act="gostar" data-id="${msg.id}" data-chat="${chat}">${avatar(u,'s',false)}<span class="mid"><span class="top"><span class="nm">${esc(nm(u))}</span><span class="tm">${shortWhen(msg.ts)}</span></span>
        <span class="sub"><span class="lm">${msg.img?'📷 ':''}${msg.sticker?'Стикер':esc(msg.text||'')}</span></span><small style="color:var(--fg3)">${esc(chatName(c))}</small></span></button>`}).join('')
      :`<div class="empty"><b>Пока пусто</b>Удерживай сообщение и выбери «Отметить важным»</div>`;
  }catch(e){toast(e.message)}
}
function openMenu(html,x,y){
  const L=$('#layer');L.innerHTML=`<div class="scrim clear" data-act="closemenu"></div><div class="menu glass" id="menu" role="menu">${html}</div>`;
  const mn=$('#menu'),w=mn.offsetWidth,h=mn.offsetHeight;
  const left=Math.max(10,Math.min(x-w/2,innerWidth-w-10)),top=y+h+20>innerHeight?Math.max(10,y-h-10):y+10;
  mn.style.left=left+'px';mn.style.top=top+'px';mn.style.setProperty('--ox',(x-left)+'px');mn.style.setProperty('--oy',(y<top?0:h)+'px');
}
function closeLayer(){const L=$('#layer');if(!L||!L.innerHTML)return;
  if(isLite()||matchMedia('(prefers-reduced-motion:reduce)').matches){L.innerHTML='';document.body.classList.remove('sheet-on');return}
  const g=document.createElement('div');g.className='layer-out';g.setAttribute('aria-hidden','true');document.body.classList.remove('sheet-on');
  while(L.firstChild)g.appendChild(L.firstChild);document.body.appendChild(g);setTimeout(()=>g.remove(),300)}
function sheet(html){const L=$('#layer'),old=L.querySelector('.sheet'),sk=html.slice(0,48),top=old&&L.dataset.sk===sk?old.scrollTop:0;L.dataset.sk=sk;
  L.innerHTML=`<div class="scrim" data-act="closemenu"></div><div class="sheet glass ${old?'swap':''}" role="dialog" aria-modal="true">${html}</div>`;
  if(old&&top)L.querySelector('.sheet').scrollTop=top;
  /* like iOS: the app behind a bottom window moves back a little */
  if(mobile()&&!isLite())document.body.classList.add('sheet-on')}
/* any other way the layer gets emptied: the app comes forward again */
new MutationObserver(()=>{const L=$('#layer');if(L&&!L.querySelector('.sheet'))document.body.classList.remove('sheet-on')}).observe(document.getElementById('layer')||document.body,{childList:true});

/* ---------- new chat / new group / info / settings ---------- */
/* addTo: a group id — then the same picker adds people to an existing group */
function memberSheet(cid,uid){
  const c=S.chats[cid],u=S.users[uid];if(!c||!u)return;const t=(c.titles||{})[uid]||'';
  sheet(`<div class="row" style="padding:0 0 12px">${avatar(u)}<span class="mid"><span class="nm">${esc(nm(u))}</span><span class="sub"><span class="lm">@${esc(u.username||'')}</span></span></span></div>
    <label class="field"><span>Подпись в группе</span><input class="input" id="mtitle" maxlength="24" value="${esc(t)}" placeholder="Например: Мама, Староста, Капитан"></label>
    <p class="sub" style="margin-top:-4px">Подпись видят все участники — рядом с именем в сообщениях</p>
    <div class="btns"><button class="gbtn danger" data-act="gkick" data-id="${uid}">Удалить из группы</button><button class="gbtn" data-act="info">Назад</button><button class="gbtn primary" data-act="gtitle" data-id="${uid}">Сохранить</button></div>`);
}
function newChatSheet(group,addTo){
  const sel=new Set(),g=addTo&&S.chats[addTo];if(addTo)group=true;
  sheet(`<h2>${g?'Добавить в «'+esc(g.name)+'»':group?'Новая группа':'Новый чат'}</h2><p class="sub">${g?'Отметь, кого добавить':group?'Назови группу и отметь участников':'Найди человека по логину или имени'}</p>
    ${group&&!g?`<label class="field"><span>Название</span><input class="input" id="gname" maxlength="40" placeholder="Например, Семья"></label>`:''}${group?'<div class="chips" id="chips"></div>':''}
    <label class="search" style="margin:0 0 10px">${ic('search')}<input id="pq" placeholder="@логин или имя" autocomplete="off" spellcheck="false"></label>
    <div class="pick-list" id="pl"><div class="empty" style="padding:20px">Начни вводить — от 2 букв</div></div>
    ${group?`<div class="btns"><button class="gbtn" data-act="closemenu">Отмена</button><button class="gbtn primary" id="gcreate">${g?'Добавить':'Создать'}</button></div>`:''}`);
  const known=()=>{const s=new Map();Object.values(S.chats).forEach(c=>c.members.forEach(m=>{if(m!==S.me.id&&S.users[m])s.set(m,S.users[m])}));Object.keys(S.contacts).forEach(m=>{if(S.users[m])s.set(m,S.users[m])});
    if(g)g.members.forEach(m=>s.delete(m));return [...s.values()]};
  const draw=list=>{
    $('#pl').innerHTML=list.length?list.map(u=>`<button class="row ${sel.has(u.id)?'sel':''}" data-pick="${u.id}">${avatar(u)}<span class="mid"><span class="top"><span class="nm">${esc(nm(u))}</span></span><span class="sub"><span class="lm">@${esc(u.username)}</span></span></span>${group?`<span class="check">${sel.has(u.id)?ic('check'):''}</span>`:''}</button>`).join(''):'<div class="empty" style="padding:20px">Никого не нашли</div>';
    if(group)$('#chips').innerHTML=[...sel].map(i=>`<span class="chip">${avatar(S.users[i],'xs',false)}${esc(nm(S.users[i]))}</span>`).join('');
  };
  let last=[];
  const k=known();if(k.length){last=k;draw(k)}
  let t;$('#pq').addEventListener('input',e=>{clearTimeout(t);const q=e.target.value.trim();t=setTimeout(async()=>{
    if(q.replace(/^@/,'').length<2){last=k;draw(k);return}
    try{const r=await api('/api/users/search?q='+encodeURIComponent(q));r.users.forEach(u=>S.users[u.id]=Object.assign(S.users[u.id]||{},u));last=g?r.users.filter(u=>!g.members.includes(u.id)):r.users;draw(last)}catch(err){}
  },250)});
  $('#pl').addEventListener('click',async e=>{
    const b=e.target.closest('[data-pick]');if(!b)return;const id=b.dataset.pick;
    if(!group){closeLayer();startDM(id);return}
    sel.has(id)?sel.delete(id):sel.add(id);draw(last);
  });
  if(g)$('#gcreate').onclick=async()=>{
    try{const r=await api('/api/chats/add',{chat:g.id,members:[...sel]});r.users.forEach(u=>S.users[u.id]=Object.assign(S.users[u.id]||{},u));S.chats[g.id]=Object.assign(S.chats[g.id],r.chat);closeLayer();toast('Добавлено');renderStatus()}catch(e){toast(e.message)}
  };
  else if(group)$('#gcreate').onclick=async()=>{
    try{const r=await api('/api/chats/group',{name:$('#gname').value,members:[...sel]});r.users.forEach(u=>S.users[u.id]=u);S.chats[r.chat.id]=r.chat;closeLayer();openChat(r.chat.id)}catch(e){toast(e.message)}
  };
  setTimeout(()=>{const i=group&&!g?$('#gname'):$('#pq');if(i&&!touch)i.focus()},50);
}
async function startDM(uid){
  try{const r=await api('/api/chats/dm',{userId:uid});r.users.forEach(u=>S.users[u.id]=u);S.chats[r.chat.id]=Object.assign(S.chats[r.chat.id]||{},r.chat);S.q='';openChat(r.chat.id)}catch(e){toast(e.message)}
}
function infoSheet(){
  const c=S.chats[S.cur];if(!c)return;
  if(c.type==='channel'){const g=S.servers[c.server];if(g)serverSheet(g);return}
  if(c.type==='self'){starredSheet();return}
  if(c.type==='dm'){const u=peerOf(c),saved=!!S.contacts[u.id];
    sheet(`<div class="prof">${avatar(u,'xl')}<h3>${esc(nm(u))}</h3><small>${saved&&nm(u)!==u.name?esc(u.name)+' · ':''}@${esc(u.username)} · ${esc(seen(u))}</small>${u.bio?`<p style="margin:8px 0 0">${esc(u.bio)}</p>`:''}
      ${c.streak&&c.streak.n>=3?`<p class="fire-note">${fire(c,true)}<br>${c.streak.today?`Вы общаетесь ${c.streak.n} дн. подряд`:'Напишите друг другу сегодня, иначе огонёк погаснет'}</p>`:`<p class="fire-note dim">Общайтесь 3 дня подряд — и появится огонёк 🔥</p>`}
      ${c.pet?`<button class="gbtn" style="margin-top:10px" data-act="pet">🥚 ${esc(c.pet.name||'Серийчик')} — открыть питомца</button>`:`<p class="fire-note dim">Напишите друг другу сегодня — появится ваш питомец Серийчик 🥚</p>`}</div>
      <div class="btns" style="justify-content:center"><button class="gbtn" data-act="call" data-k="audio">${ic('phone')}Звонок</button><button class="gbtn" data-act="call" data-k="video">${ic('video')}Видео</button>
      <button class="gbtn" data-act="editcontact" data-id="${u.id}">${ic(saved?'edit':'addUser')}${saved?'Имя':'В контакты'}</button></div>
      <div class="btns" style="justify-content:center"><button class="gbtn ${(S.me.blocked||[]).includes(u.id)?'':'danger'}" data-act="block" data-id="${u.id}">${ic('x')}${(S.me.blocked||[]).includes(u.id)?'Разблокировать':'Заблокировать'}</button></div>`);return}
  const admin=c.admin===S.me.id,T=c.titles||{};
  sheet(`<div class="prof">${chatAvatar(c,'xl')}${admin?`<div class="btns" style="justify-content:center;margin:6px 0 0"><button class="gbtn" data-act="grava">${ic('image')}Сменить фото группы</button>${c.avatar?'<button class="gbtn" data-act="gravadel">Убрать</button>':''}</div>`:''}${admin?`<label class="field" style="width:100%;margin:8px 0 0"><input class="input" id="grname" maxlength="40" value="${esc(c.name)}" style="text-align:center;font-weight:700"></label>`:`<h3>${esc(c.name)}</h3>`}<small>${c.members.length} участник(ов)</small></div>
    <button class="row add-row" data-act="gadd"><span class="ava s add">${ic('addUser')}</span><span class="mid"><span class="nm">Добавить участников</span></span></button>
    ${c.petOn?`<button class="row add-row" data-act="pet"><span class="ava s add pet-ava">${petSvgOf(c)}</span><span class="mid"><span class="nm">${esc(c.pet.name||'Серийчик')}</span><span class="sub"><span class="lm">питомец группы · ${(c.streak&&c.streak.n)||0} дн. подряд</span></span></span></button>`
      :`<button class="row add-row" data-act="petadd"><span class="ava s add">🥚</span><span class="mid"><span class="nm">Добавить Серийчика в группу</span><span class="sub"><span class="lm">питомец растёт, если вы пишете сюда каждый день</span></span></span></button>`}
    <div class="section-t">Участники${admin?' · нажми, чтобы подписать':''}</div>
    ${c.members.map(i=>S.users[i]).filter(Boolean).sort((a,b)=>(b.id===c.admin)-(a.id===c.admin)).map(u=>`<${admin&&u.id!==S.me.id?'button':'div'} class="row" ${admin&&u.id!==S.me.id?`data-act="gmember" data-id="${u.id}"`:''}>${avatar(u,'s')}<span class="mid"><span class="top"><span class="nm">${esc(nm(u))}${T[u.id]?` <span class="mtitle">${esc(T[u.id])}</span>`:''}${u.id===c.admin?' <small style="color:var(--fg3)">создатель</small>':''}</span></span><span class="sub"><span class="lm">${esc(seen(u))}</span></span></span></${admin&&u.id!==S.me.id?'button':'div'}>`).join('')}
    <div class="btns"><button class="gbtn danger" data-act="leave">Выйти из группы</button>${admin?'<button class="gbtn primary" data-act="grsave">Сохранить</button>':''}</div>`);
}
function blockedSheet(){
  const l=(S.me.blocked||[]).map(i=>S.users[i]||{id:i,name:'Пользователь',username:''});
  sheet(`<h2>Заблокированные</h2><p class="sub">Эти люди не могут вам писать и звонить</p>${l.map(u=>`<div class="row">${avatar(u,'s',false)}<span class="mid"><span class="nm">${esc(nm(u))}</span><span class="sub"><span class="lm">@${esc(u.username||'')}</span></span></span><button class="gbtn" data-act="block" data-id="${u.id}">Разблокировать</button></div>`).join('')||'<div class="empty">Никого</div>'}`);
}
/* admin: statistics, an announcement for everybody, registration, and every account with actions */
const admAgo=t=>{if(!t)return '—';const m=Math.round((Date.now()-t)/60e3);return m<1?'только что':m<60?m+' мин назад':m<1440?Math.round(m/60)+' ч назад':Math.round(m/1440)+' дн. назад'};
async function adminSheet(keep){
  let r;try{r=await api('/api/admin/users')}catch(e){toast(e.message);return}
  S.adm=r;S.admF=S.admF||'all';S.admS=S.admS||'act';const q=keep&&$('#admq')?$('#admq').value:'';
  const st=r.stats||{},mx=Math.max(1,...(st.perDay||[0])),days=['вс','пн','вт','ср','чт','пт','сб'];
  const up=st.uptime?(st.uptime>864e5?Math.floor(st.uptime/864e5)+' дн. ':'')+Math.floor(st.uptime%864e5/36e5)+' ч':'—';
  const tile=(n,l,cl)=>`<div><b${cl?` style="color:var(--${cl})"`:''}>${n==null?'—':n}</b><small>${l}</small></div>`;
  const ann=r.ann;
  sheet(`<h2>👑 Админ-панель</h2>
    <div class="adm-stats">${tile(r.total,'пользователей')}${tile(r.online,'в сети','good')}${tile(st.active,'активны за сутки')}
      ${tile(st.newWeek,'новых за неделю')}${tile(st.today,'сообщений сегодня')}${tile(st.week,'за неделю')}
      ${tile(st.dms,'личных чатов')}${tile(st.groups,'групп')}${tile(st.servers,'серверов')}</div>
    <div class="adm-chart" aria-label="Сообщения за 7 дней">${(st.perDay||[]).map((v,i)=>{const d=new Date(Date.now()-(6-i)*864e5);return `<div title="${v} сообщ." style="--i:${i}"><i style="height:${Math.max(4,Math.round(v/mx*100))}%"></i><small>${i===6?'сег.':days[d.getDay()]}</small></div>`}).join('')}</div>
    <p class="pet-mood dim" style="margin:4px 0 0">Сервер работает ${up} · память ${st.mem||'—'} МБ · сеансов ${st.sessions||0} · звонков сейчас ${st.calls||0} · всего сообщений ${st.msgs||0}</p>
    <div class="section-t set-sec">Объявление для всех</div>
    ${ann?`<div class="adm-ann"><b>Сейчас висит:</b> ${esc(ann.text)}<small>${esc(ann.by||'')} · ${admAgo(ann.ts)}</small></div>`:''}
    <textarea class="input" id="admann" rows="2" maxlength="300" placeholder="Например: «Сегодня в 22:00 обновление, приложение перезапустится»"></textarea>
    <div class="btns" style="margin-top:8px">${ann?'<button class="gbtn" data-act="adm-annoff">Убрать</button>':''}<button class="gbtn primary" data-act="adm-ann">📣 Отправить всем</button></div>
    <div class="section-t set-sec">Доступ</div>
    <div class="set-row"><span class="mid"><b>Регистрация новых аккаунтов</b><small>${r.regClosed?'Закрыта — войти могут только те, у кого уже есть аккаунт':'Открыта — любой может создать аккаунт'}</small></span><button class="sw ${r.regClosed?'':'on'}" data-act="adm-reg" role="switch" aria-checked="${!r.regClosed}" aria-label="Регистрация"><i></i></button></div>
    <div class="section-t set-sec">Пользователи · ${r.total}${r.banned?` · <span style="color:var(--bad)">${r.banned} заблок.</span>`:''}</div>
    <input class="input" id="admq" placeholder="Поиск по имени или логину" value="${esc(q)}">
    <div class="seg" style="margin-top:8px">${[['all','Все'],['on','В сети'],['new','Новые'],['ban','Заблок.']].map(([k,n])=>`<button class="${S.admF===k?'on':''}" data-act="adm-f" data-v="${k}">${n}</button>`).join('')}</div>
    <div class="seg" style="margin-top:6px">${[['act','По активности'],['msg','По сообщениям'],['reg','По дате']].map(([k,n])=>`<button class="${S.admS===k?'on':''}" data-act="adm-s" data-v="${k}">${n}</button>`).join('')}</div>
    <div class="adm-list" id="admList"></div>`);
  admList();const i=$('#admq');if(i&&q)i.dispatchEvent(new Event('input'));
}
function admList(){
  const r=S.adm,box=$('#admList');if(!r||!box)return;
  const wk=Date.now()-7*864e5,F={all:()=>true,on:u=>u.online,new:u=>u.created>=wk,ban:u=>u.banned}[S.admF]||(()=>true);
  const sorter={act:(a,b)=>(b.online-a.online)||(b.lastSeen-a.lastSeen),msg:(a,b)=>b.msgs-a.msgs,reg:(a,b)=>(b.created||0)-(a.created||0)}[S.admS];
  const list=r.users.filter(F).sort(sorter);
  box.innerHTML=list.map(u=>`<button class="row adm-row" data-act="adm-user" data-id="${u.id}" data-q="${esc((u.name+' '+u.username).toLowerCase())}">${avatar(Object.assign({},u,{online:u.online}),'s')}<span class="mid"><span class="top"><span class="nm">${esc(u.name)}${u.admin?' 👑':''}${u.banned?' <b class="adm-ban">ЗАБЛОКИРОВАН</b>':''}</span></span><span class="sub"><span class="lm">@${esc(u.username)} · ${u.online?'<b style="color:var(--good)">в сети</b>':admAgo(u.lastSeen)} · ${u.msgs} сообщ.</span></span></span><span class="adm-chev">›</span></button>`).join('')||'<div class="empty" style="padding:16px">Никого</div>';
  const q=$('#admq');if(q&&q.value)q.dispatchEvent(new Event('input'));
}
/* one account: what we know and what the admin can do */
function adminUser(id){
  const u=S.adm&&S.adm.users.find(x=>x.id===id);if(!u)return;
  sheet(`<div class="adm-back"><button class="gbtn" data-act="admin-back">‹ Все пользователи</button></div>
    <div class="prof">${avatar(Object.assign({},u,{online:u.online}),'xl')}<h3>${esc(u.name)}${u.admin?' 👑':''}</h3><small>@${esc(u.username)} · ${u.online?'в сети':'был(а) '+admAgo(u.lastSeen)}</small></div>
    <div class="adm-stats">${[[u.msgs,'сообщений'],[u.chats,'чатов'],[u.created?new Date(u.created).toLocaleDateString('ru'):'—','с нами с']].map(([n,l])=>`<div><b>${n}</b><small>${l}</small></div>`).join('')}</div>
    ${u.banned?'<p class="pet-mood" style="color:var(--bad)">⛔ Аккаунт заблокирован</p>':''}
    <div class="adm-acts">
      ${u.id!==S.me.id?`<button class="row" data-act="adm-dm" data-id="${u.id}"><span class="adm-ic">💬</span><span class="mid"><span class="nm">Написать</span><span class="sub"><span class="lm">Открыть личный чат</span></span></span></button>`:''}
      <button class="row" data-act="adm-copy" data-v="@${esc(u.username)}"><span class="adm-ic">📋</span><span class="mid"><span class="nm">Скопировать логин</span><span class="sub"><span class="lm">@${esc(u.username)}</span></span></span></button>
      ${u.id!==S.me.id?`<button class="row" data-act="adm-out" data-id="${u.id}"><span class="adm-ic">🚪</span><span class="mid"><span class="nm">Завершить все сеансы</span><span class="sub"><span class="lm">Выйдет на всех устройствах (например, потерял телефон)</span></span></span></button>`:''}
      ${!u.admin||u.id===S.me.id?`<button class="row" data-act="adm-pass" data-id="${u.id}"><span class="adm-ic">🔑</span><span class="mid"><span class="nm">Сбросить пароль</span><span class="sub"><span class="lm">Получите временный пароль и передайте человеку</span></span></span></button>`:''}
      ${u.admin?'':`<button class="row ${u.banned?'':'bad'}" data-act="adm-ban" data-id="${u.id}" data-on="${u.banned?0:1}"><span class="adm-ic">${u.banned?'✅':'⛔'}</span><span class="mid"><span class="nm">${u.banned?'Разблокировать':'Заблокировать'}</span><span class="sub"><span class="lm">${u.banned?'Снова сможет входить и писать':'Не сможет войти, все сеансы завершатся'}</span></span></span></button>`}
    </div><div id="admRes"></div>`);
}
/* the announcement banner at the top of the app */
function showAnn(a){
  const old=$('#annBar');if(!a||store.get('annSeen','')===a.id){if(old)old.remove();return}
  const el=old||document.createElement('div');el.id='annBar';el.className='ann-bar glass';el.setAttribute('role','status');
  el.innerHTML=`<span class="ann-ic">📣</span><span class="ann-t"><b>Объявление</b>${esc(a.text)}</span><button class="gbtn ic" data-act="annclose" data-id="${a.id}" aria-label="Закрыть">${ic('x')}</button>`;
  if(!old)document.body.appendChild(el);
}
function settingsSheet(){
  const me=S.me,th=store.get('theme','auto'),w=store.get('wall','slate');
  const np='Notification' in window?Notification.permission:'unsupported';
  sheet(`<div class="prof"><button data-act="ava" title="Сменить аватарку" aria-label="Сменить аватарку">${avatar(me,'xl',false)}</button><div class="btns" style="justify-content:center;margin:4px 0 0"><button class="gbtn" data-act="ava">${ic('image')}Сменить аватарку</button>${me.avatar?`<button class="gbtn" data-act="avadel">Убрать</button>`:''}</div></div>
    <label class="field"><span>Имя</span><input class="input" id="pname" maxlength="40" value="${esc(me.name)}"></label>
    <label class="field"><span>О себе</span><input class="input" id="pbio" maxlength="140" value="${esc(me.bio||'')}" placeholder="Пара слов о себе"></label>
    <div class="set-row"><span class="mid"><b>Логин</b><small>@${esc(me.username)} — по нему тебя находят</small></span><button class="gbtn" data-act="copyname">${ic('copy')}</button></div>
    ${me.admin?`<div class="set-row"><span class="mid"><b>👑 Админ-панель</b><small>Пользователи, статистика, объявления, регистрация</small></span><button class="gbtn primary" data-act="admin">Открыть</button></div>`:''}
    <div class="section-t set-sec">Оформление</div>
    <div class="set-row"><span class="mid"><b>Тема</b></span><div class="seg" style="width:220px">${[['auto','Авто'],['light','Светлая'],['dark','Тёмная']].map(([k,n])=>`<button class="${th===k?'on':''}" data-act="theme" data-v="${k}">${n}</button>`).join('')}</div></div>
    <div class="set-row" style="display:block"><b>Обои</b><div class="walls" style="margin-top:8px">${[['slate','Сланец'],['steel','Сталь'],['mist','Туман'],['ocean','Море']].map(([k,n])=>`<button class="${w===k&&!S.appWall?'on':''}" data-act="wall" data-w="${k}" aria-label="${n}" title="${n}"></button>`).join('')}<button class="wall-pick ${S.appWall?'on':''}" data-act="appwall" title="Своё фото" aria-label="Обои из галереи" ${S.appWall?`style="background-image:url('${S.appWall}')"`:''}>${S.appWall?'':ic('image')}</button></div>${S.appWall?'<div class="btns" style="margin-top:8px"><button class="gbtn" data-act="appwalldel">Убрать своё фото</button></div>':''}</div>
    <div class="set-row"><span class="mid"><b>Стиль сообщений</b><small>Цвет и рамка ваших сообщений</small></span><button class="gbtn" data-act="bubbles">Выбрать</button></div>
    <div class="set-row"><span class="mid"><b>Серийчик гуляет по чату</b><small>Питомца можно перетаскивать пальцем по экрану чата</small></span><button class="sw ${store.get('petfloat','on')==='on'?'on':''}" data-act="petfloat" role="switch" aria-checked="${store.get('petfloat','on')==='on'}" aria-label="Серийчик гуляет по чату"><i></i></button></div>
    <div class="section-t set-sec">Чаты и стикеры</div>
    <div class="set-row"><span class="mid"><b>Стикеры</b><small>${S.packs.length} набор(ов)</small></span><button class="gbtn" data-act="newpack">${ic('plus')}Набор</button></div>
    <div class="set-row"><span class="mid"><b>Уведомления</b><small>${np==='granted'?'включены — сообщения и звонки придут, даже когда Manasenger закрыт':np==='denied'?'запрещены в браузере':np==='unsupported'?'не поддерживаются':'выключены'}</small></span>${np!=='denied'&&np!=='unsupported'?`<button class="gbtn" data-act="notif">${np==='granted'?'Проверить':'Включить'}</button>`:''}</div>
    ${SERVER_V&&MY_V&&SERVER_V!==MY_V&&SERVER_V!=='dev'?`<div class="set-row"><span class="mid"><b>⬆️ Есть обновление</b><small>Это окно открыто со старой версией. Нажмите, чтобы обновить</small></span><button class="gbtn primary" data-act="appupdate">Обновить</button></div>`:''}
    <div class="section-t set-sec">Звонки и звук</div>
    <div class="set-row"><span class="mid"><b>🎙 Микрофон и звук</b><small>Шумоподавление ${({off:'выкл',std:'обычное',strong:'сильное',max:'максимум'})[MIC.ns]||''}${MIC.gate?' · фон отсекается':''} · громкость собеседника ${Math.round(SPK.vol*100)}%</small></span><button class="gbtn" data-act="soundsheet">Настроить</button></div>
    <div class="set-row"><span class="mid"><b>🎛 Саундпад</b><small>Смешные звуки в звонках и голосовых чатах · своих звуков: ${PAD.own.length}</small></span><button class="gbtn" data-act="c-pad">Открыть</button></div>
    <div class="section-t set-sec">Конфиденциальность</div>
    <div class="set-row"><span class="mid"><b>Заблокированные</b><small>${(me.blocked||[]).length?(me.blocked.length+' чел. — не могут вам писать и звонить'):'Никого'}</small></span>${(me.blocked||[]).length?'<button class="gbtn" data-act="blocklist">Список</button>':''}</div>
    <details class="set-row" style="display:block"><summary style="cursor:pointer;font-weight:600">Сменить пароль</summary>
      <label class="field" style="margin-top:10px"><span>Текущий пароль</span><input class="input" id="op" type="password" autocomplete="current-password"></label>
      <label class="field"><span>Новый пароль</span><input class="input" id="nwp" type="password" minlength="6" autocomplete="new-password"></label></details>
    <div class="section-t set-sec">Приложение</div>
    <div class="set-row"><span class="mid"><b>Приложение</b><small>Установи Manasenger на телефон или ПК · версия ${esc(MY_V||SERVER_V||'—')}${SERVER_V&&MY_V&&SERVER_V!==MY_V&&SERVER_V!=='dev'?` · <b style="color:#2bd47d">вышло обновление ${esc(SERVER_V)}</b>`:''}</small></span><button class="gbtn" data-act="install">Как?</button></div>
    <div class="set-row"><span class="mid"><b>Экономный режим</b><small>Для слабых телефонов: без анимаций и прозрачности, легче камера${LITE_AUTO?' · ваш телефон подходит под «Авто»':''}</small></span></div>
    <div class="seg" style="margin:-4px 0 8px">${[['auto','Авто'],['on','Вкл'],['off','Выкл']].map(([k,n])=>`<button class="${store.get('lite','auto')===k?'on':''}" data-act="lite" data-v="${k}">${n}</button>`).join('')}</div>
    <div class="btns"><button class="gbtn danger" data-act="logout">Выйти</button><button class="gbtn primary" data-act="saveprof">Сохранить</button></div>`);
}
function installSheet(){
  sheet(`<h2>Установить Manasenger</h2><p class="sub">Manasenger работает как приложение: своя иконка, отдельное окно, уведомления.</p>
    <div class="section-t">Скачать приложение</div>
    <div class="set-row"><span class="mid"><b>Android</b><small>Файл APK: откройте его на телефоне и разрешите установку</small></span><a class="gbtn primary" href="https://github.com/Shado61/glint/releases/download/apps/Manasenger.apk" target="_blank" rel="noopener">Скачать</a></div>
    <div class="set-row"><span class="mid"><b>Windows</b><small>Программа для компьютера, работает в фоне — звонки и сообщения приходят</small></span><a class="gbtn primary" href="https://github.com/Shado61/glint/releases/download/apps/Manasenger-Setup.exe" target="_blank" rel="noopener">Скачать</a></div>
    <div class="set-row"><span class="mid"><b>Mac · Linux</b></span><a class="gbtn" href="https://github.com/Shado61/glint/releases/download/apps/Manasenger-mac.dmg" target="_blank" rel="noopener">Mac</a><a class="gbtn" href="https://github.com/Shado61/glint/releases/download/apps/Manasenger-linux.AppImage" target="_blank" rel="noopener" style="margin-left:6px">Linux</a></div>
    <div class="section-t">Или без скачивания</div>
    <div class="set-row"><span class="mid"><b>iPhone / iPad</b><small>Safari → кнопка «Поделиться» → «На экран „Домой“»</small></span></div>
    <div class="set-row"><span class="mid"><b>Android</b><small>Chrome → меню ⋮ → «Установить приложение»</small></span></div>
    <div class="set-row"><span class="mid"><b>Компьютер</b><small>Chrome или Edge → значок установки справа в адресной строке</small></span></div>
    ${deferredInstall?'<div class="btns"><button class="gbtn primary" data-act="doinstall">Установить сейчас</button></div>':'<div class="btns"><button class="gbtn" data-act="closemenu">Понятно</button></div>'}`);
}
let deferredInstall=null;
addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e});

/* =================================================================== WEBSOCKET */
let WS=null,wsTry=0,wsTimer=null;
function connect(){
  clearTimeout(wsTimer);
  WS=new WebSocket(`${location.protocol==='https:'?'wss':'ws'}://${location.host}/ws`);
  WS.onopen=async()=>{
    if(wsTry>0){ /* back after a drop: catch up on what was missed */
      try{const r=await api('/api/me');if(!r.me)return location.reload();r.chats.forEach(c=>S.chats[c.id]=c);r.users.forEach(u=>S.users[u.id]=u);S.servers={};(r.servers||[]).forEach(g=>S.servers[g.id]=g);setMe(r);loadStories();if(VC)voiceRejoin();
        if(S.cur){const m=await api('/api/messages?chat='+S.cur);S.msgs[S.cur]=m.messages;S.more[S.cur]=m.more}
        Object.keys(S.msgs).forEach(k=>{if(k!==S.cur)delete S.msgs[k]});renderSide();renderMsgs();renderStatus();markRead();updateTitle()}catch(e){}
    }
    wsTry=0;sendVis();
  };
  WS.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch(x){return}onWS(m)};
  WS.onclose=()=>{wsTry++;wsTimer=setTimeout(connect,Math.min(15000,600*2**Math.min(wsTry,5)))};
}
function wsSend(o){if(WS&&WS.readyState===1){WS.send(JSON.stringify(o));return true}return false}
/* like Telegram's "fasterdom": many events in a row (a burst of messages, reactions, typing) are drawn once, in the next screen frame */
const FQ={m:false,s:false,st:false,raf:0};
function frameFlush(){FQ.raf=0;const m=FQ.m,sd=FQ.s,st=FQ.st;FQ.m=FQ.s=FQ.st=false;if(sd)renderSide();if(m)renderMsgs();if(st)renderStatus()}
function frameSched(){if(!FQ.raf)FQ.raf=document.hidden?setTimeout(frameFlush,0)&&-1:requestAnimationFrame(frameFlush)}
const frameMsgs=()=>{FQ.m=true;frameSched()},frameSide=()=>{FQ.s=true;frameSched()},frameStatus=()=>{FQ.st=true;frameSched()};
function onWS(m){
  switch(m.t){
    case 'map':if(!IOS)mapRefresh();return;
    case 'mapLoc':{const f=MAPD.friends.find(x=>x.user.id===m.id);if(f){f.geo=m.geo;if(MAPV)mapDraw();
      /* the route follows a friend who keeps moving: rebuilt when they are 150+ m from its end, at most every 30 s */
      if(m.geo&&ROUTE&&ROUTE.id===m.id&&ROUTE.mode!=='bus'&&!ROUTE.busy&&Date.now()-(ROUTE.at||0)>30e3&&distKm(ROUTE.b,m.geo)>.15){ROUTE.at=Date.now();mapRoute(m.id,ROUTE.mode)}}return}
    case 'msg':{
      const c=S.chats[m.chat];if(!c)return;
      const l=S.msgs[m.chat]||(S.cur===m.chat?(S.msgs[m.chat]=[]):null);
      if(l){if(!l.some(x=>x.id===m.msg.id)){
        if(m.msg.from===S.me.id){const i=l.findIndex(x=>x.pending&&(m.msg.once?x.once&&x.once.k===m.msg.once.k&&(x.text||'')===(m.msg.text||'')&&(x.once.k==='photo'||x.media&&x.media.url):m.msg.media?x.media&&x.media.url===m.msg.media.url:!x.media&&x.text===m.msg.text&&!!x.img===!!m.msg.img));if(i>=0){if(l[i].media&&l[i].media.local)setTimeout(()=>URL.revokeObjectURL(l[i]&&l[i].media&&l[i].media.local||''),30000);l.splice(i,1)}}
        l.push(m.msg)}}
      c.last=m.msg;
      if(S.typing[m.chat])delete S.typing[m.chat][m.msg.from];
      const mine=m.msg.from===S.me.id,here=S.cur===m.chat&&!document.hidden;
      S.fresh=m.msg.id;
      if(!mine&&!m.msg.sys&&!m.msg.call){
        if(!here){c.unread=(c.unread||0)+1;if(c.type!=='channel'&&!c.muted)beep([880,1320],.07,.03,.05)}
        if(c.type!=='channel'||(m.msg.text||'').includes('@'+S.me.username))notify(chatName(c),c.type!=='dm'?`${nm(S.users[m.msg.from])}: ${lastText(m.msg)}`:lastText(m.msg),m.chat,m.chat);
      }
      if(S.cur===m.chat){renderMsgs(mine?true:undefined);frameStatus();markRead()}
      frameSide();updateTitle();
      if(S.tab==='calls'&&m.msg.call)S.calls=null;
      return;
    }
    case 'ack':return;
    case 'upd':{const l=S.msgs[m.chat];if(l){const i=l.findIndex(x=>x.id===m.msg.id);if(i>=0)l[i]=m.msg}const c=S.chats[m.chat];if(c&&c.last&&c.last.id===m.msg.id)c.last=m.msg;if(S.cur===m.chat)frameMsgs();frameSide();return}
    case 'read':{const c=S.chats[m.chat];if(!c)return;c.read=c.read||{};c.read[m.user]=m.ts;if(S.cur===m.chat)frameMsgs();return}
    case 'typing':{
      const t=S.typing[m.chat]=S.typing[m.chat]||{};clearTimeout(t[m.user]);
      t[m.user]=setTimeout(()=>{delete t[m.user];if(S.cur===m.chat)frameStatus();frameSide()},4000);
      if(S.cur===m.chat)frameStatus();frameSide();return;
    }
    case 'user':{const ob=JSON.stringify((S.users[m.user.id]||{}).bubble||null);S.users[m.user.id]=Object.assign(S.users[m.user.id]||{},m.user);if(m.user.id===S.me.id)S.me=S.users[m.user.id];frameSide();frameStatus();if(ob!==JSON.stringify(m.user.bubble||null))frameMsgs();return}
    case 'chat':{m.users.forEach(u=>S.users[u.id]=Object.assign(S.users[u.id]||{},u));
      if(!m.chat.members.includes(S.me.id)){delete S.chats[m.chat.id];if(S.cur===m.chat.id)closeChat();else frameSide();return}
      const was=S.chats[m.chat.id];S.chats[m.chat.id]=Object.assign(was||{},m.chat);if(!m.chat.streak)delete S.chats[m.chat.id].streak;
      if(m.chat.streak&&m.chat.streak.n>=3&&was&&(!was.streak||was.streak.n<m.chat.streak.n)&&m.chat.streak.today&&S.cur===m.chat.id)navigator.vibrate&&navigator.vibrate([20,40,20]);
      frameSide();if(S.cur===m.chat.id){frameStatus();if(m.chat.pet&&!document.querySelector('.pet-btn'))renderMain();else refreshPetBtn()}return}
    case 'announce':showAnn(m.ann);if(m.ann&&store.get('annSeen','')!==m.ann.id)navigator.vibrate&&navigator.vibrate([10,40,10]);return;
    case 'signedout':{S.banned=true;try{WS.onclose=null;WS.close()}catch(e){}toast(m.reason||'Сеанс завершён',4000);store.set('tok','');setTimeout(()=>location.reload(),2500);return}
    case 'banned':{S.banned=true;try{WS.onclose=null;WS.close()}catch(e){}$('#app').innerHTML=`<div class="auth"><div class="card glass empty"><b>⛔ Аккаунт заблокирован</b>${esc(m.reason||'Администратор заблокировал этот аккаунт')}</div></div>`;return}
    case 'error':{
      if(m.cid){const l=S.msgs[S.cur];if(l){const i=l.findIndex(x=>x.id===m.cid);if(i>=0)l.splice(i,1);frameMsgs()}}
      toast(m.error);if(CALL&&CALL.state==='calling'&&!CALL.id)hangup(true);return;
    }
    case 'call-started':case 'call-incoming':case 'call-accepted':case 'call-end':case 'rtc':case 'call-waiting':case 'call-reached':return onCallMsg(m);
    case 'groom':case 'gcall-ring':case 'gjoined':case 'gpeer-left':case 'grtc':return onGroupMsg(m);
    case 'server':{
      m.users.forEach(u=>S.users[u.id]=Object.assign(S.users[u.id]||{},u));S.servers[m.server.id]=m.server;
      if(m.removed&&S.cur===m.removed){delete S.chats[m.removed];closeChat()}
      if(m.removed&&VC&&VC.cid===m.removed)voiceLeave(true);
      frameSide();if(S.chats[S.cur]&&S.chats[S.cur].server===m.server.id)frameStatus();return;
    }
    case 'server-gone':{
      const g=S.servers[m.server];delete S.servers[m.server];
      if(g)g.channels.forEach(ch=>delete S.chats[ch.id]);
      if(VC&&VC.sid===m.server)voiceLeave(true);
      if(S.view===m.server)S.view='home';
      if(S.cur&&!S.chats[S.cur])closeChat();else frameSide();return;
    }
    case 'voice':{const g=S.servers[m.server];if(!g)return;const ch=g.channels.find(x=>x.id===m.channel);if(ch)ch.users=m.users;
      if(VW&&VC&&m.channel===VC.cid&&!m.users.some(x=>x.id===VW.uid&&x.screen)){voiceWatch(null);toast('Демонстрация экрана закончилась')}
      frameSide();return}
    case 'vjoined':case 'vrtc':case 'vpeer-left':case 'vkicked':return onVoiceMsg(m);
    case 'stars':S.stars=new Set(m.stars);if(S.cur)frameMsgs();return;
    case 'pat':if(S.cur===m.chat){petPat(false);if(!$('#petHearts'))toast(`${nm(S.users[m.user])} погладил(а) ${(S.chats[m.chat].pet||{}).name||'Серийчика'} 💗`)}return;
    case 'fwd-ok':return;
    case 'pack':{const i=S.packs.findIndex(p=>p.id===m.pack.id);if(i>=0){S.packs[i]=m.pack;renderStickers()}return}
    case 'story':{S.users[m.user.id]=Object.assign(S.users[m.user.id]||{},m.user);if(!S.stories.some(x=>x.id===m.story.id))S.stories.push(m.story);frameSide();return}
    case 'story-gone':S.stories=S.stories.filter(x=>x.id!==m.id);frameSide();return;
    case 'story-views':{const st=S.stories.find(x=>x.id===m.id);if(st)st.views=m.views;const v=$('#sv-views');if(v&&SV&&SV.cur&&SV.cur.id===m.id)v.textContent=m.views;return}
  }
}

/* =================================================================== CALLS
   One-to-one WebRTC. Both sides always open one audio and one video channel,
   so turning the camera on, off or switching to screen sharing is a track swap, no renegotiation.
   Quality: clear voice (Opus 64 kbit/s with loss protection), HD video that steps down on a bad network,
   automatic reconnection when the network changes, and a connection indicator. */
let CALL=null,ICE=null;
/* call servers, with fresh relay passwords every few hours */
let ICE_AT=0,ICE_RELAY=false;
async function iceServers(){if(!ICE||Date.now()-ICE_AT>3*3600e3){try{const r=await api('/api/ice');ICE=r.iceServers;ICE_RELAY=!!r.relay;ICE_AT=Date.now()}catch(e){ICE=ICE||[{urls:'stun:stun.l.google.com:19302'}]}}return ICE}
/* ================= microphone: noise suppression and settings =================
   The voice goes: microphone (with the browser's echo cancelling) → rumble filter → neural noise removal
   (GTCRN, or RNNoise on weaker phones) → voice gate (silence whenever you are not speaking: far-away voices,
   TV, keyboard and the room are cut) → gentle leveller → your volume. Works in calls, group calls, voice chats,
   voice messages and video circles. If anything is not supported, the plain microphone is used. */
const MIC_DEF={ns:isLite()?'strong':'max',vol:1,gate:true,th:-50,adapt:true,margin:12,ec:true,agc:false,dev:''};
const MIC=Object.assign({},MIC_DEF,store.get('mic',{}));
/* v2 of the settings: the background is followed by itself; old saved values get the new defaults once */
if(!store.get('micV2',false)){Object.assign(MIC,{adapt:true,margin:12,agc:false,th:Math.min(MIC.th,-50)});store.set('mic',MIC);store.set('micV2',true)}
const AUDIO={};
function micConstraints(){
  for(const k of Object.keys(AUDIO))delete AUDIO[k];
  Object.assign(AUDIO,{echoCancellation:MIC.ec,noiseSuppression:MIC.ns!=='off',autoGainControl:MIC.agc,channelCount:{ideal:1},sampleRate:{ideal:48000}});
  if(MIC.ns==='max')AUDIO.voiceIsolation=true; /* where the system has its own voice isolation (some Chrome/Mac), it is used too */
  if(MIC.dev)AUDIO.deviceId={ideal:MIC.dev};
}
micConstraints();
function micSave(){store.set('mic',MIC);micConstraints();MICX.live.forEach(ch=>ch.apply())}
const MICX={ctx:null,mods:{},bins:{},live:new Set()};
async function micCtx(){
  if(MICX.ctx&&MICX.ctx.state!=='closed')return MICX.ctx;
  const A=window.AudioContext||window.webkitAudioContext;if(!A||!window.AudioWorkletNode)return null;
  try{MICX.ctx=new A({sampleRate:48000,latencyHint:'interactive'})}catch(e){try{MICX.ctx=new A({latencyHint:'interactive'})}catch(e2){return null}}
  const c=MICX.ctx;c.resume().catch(()=>{}); /* called right inside the tap: iPhone lets the audio engine start only then */
  c.onstatechange=()=>{if(c.state==='suspended'||c.state==='interrupted')c.resume().catch(()=>{})};
  document.addEventListener('visibilitychange',()=>{if(c.state!=='running')c.resume().catch(()=>{})});
  return c;
}
async function micMod(name){
  const c=await micCtx();if(!c)return false;
  if(!MICX.mods[name])MICX.mods[name]=c.audioWorklet.addModule('/vendor/ns/'+name+'.js').then(()=>true,()=>false);
  return MICX.mods[name];
}
function micBin(name){
  if(!MICX.bins[name]){let url='/vendor/ns/'+name+'.wasm';
    if(name==='rnnoise'){try{if(WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,10,1,8,0,65,0,253,15,253,98,11])))url='/vendor/ns/rnnoise_simd.wasm'}catch(e){}}
    MICX.bins[name]=fetch(url).then(r=>r.ok?r.arrayBuffer():null).catch(()=>null)}
  return MICX.bins[name];
}
/* the neural noise remover for a level: max → GTCRN (best), strong → RNNoise (lighter) */
async function micNS1(name){const c=MICX.ctx;
  try{if(!await micMod(name))return null;const bin=await micBin(name);if(!bin)return null;
    const n=new AudioWorkletNode(c,'@sapphi-red/web-noise-suppressor/'+name,{processorOptions:{maxChannels:1,wasmBinary:bin.slice(0)},channelCount:1,channelCountMode:'explicit'});n.kind=name;return n}catch(e){console.warn('[mic]',name,e);return null}}
/* «Максимум»: two different neural networks one after another — GTCRN removes TV, music and noise, RNNoise cleans what is left */
async function micNS(level){
  if(level==='max'){const a=await micNS1('gtcrn'),b=await micNS1('rnnoise');
    if(a&&b){a.connect(b);return {first:a,last:b,kind:'max',destroy(){try{a.destroy();b.destroy()}catch(e){}},disconnect(){try{a.disconnect();b.disconnect()}catch(e){}}}}
    const one=a||b;return one?{first:one,last:one,kind:one.kind,destroy(){try{one.destroy()}catch(e){}},disconnect(){try{one.disconnect()}catch(e){}}}:null}
  const c=MICX.ctx;
  for(const name of level==='strong'?['rnnoise']:[]){
    try{if(!await micMod(name))continue;const bin=await micBin(name);if(!bin)continue;
      const n=new AudioWorkletNode(c,'@sapphi-red/web-noise-suppressor/'+name,{processorOptions:{maxChannels:1,wasmBinary:bin.slice(0)},channelCount:1,channelCountMode:'explicit'});
      n.kind=name;return n}catch(e){console.warn('[mic]',name,e)}
  }
  return null;
}
/* wraps a camera/microphone stream: its sound is replaced by the cleaned one; video tracks stay as they are */
async function micWrap(stream,force){
  const raw=stream&&stream.getAudioTracks()[0];if(!raw||(!force&&MIC.ns==='off'&&!MIC.gate&&MIC.vol===1))return stream;
  try{
    const c=await micCtx();if(!c)return stream;
    if(c.state!=='running'){c.resume().catch(()=>{});await new Promise(k=>setTimeout(k,250))}
    if(c.state!=='running')return stream; /* the audio engine is asleep (iPhone before a tap): plain microphone, never silence */
    const ch={raw,src:c.createMediaStreamSource(new MediaStream([raw])),hp:c.createBiquadFilter(),lp:c.createBiquadFilter(),cmp:c.createDynamicsCompressor(),vol:c.createGain(),dst:c.createMediaStreamDestination(),ns:null,gate:null,lvl:-100,open:false};
    ch.hp.type='highpass';ch.hp.frequency.value=90;ch.hp.Q.value=.7;
    ch.lp.type='lowpass';ch.lp.frequency.value=11000;
    ch.cmp.threshold.value=-24;ch.cmp.knee.value=12;ch.cmp.ratio.value=3;ch.cmp.attack.value=.005;ch.cmp.release.value=.2;
    if(await micMod('gate')){ch.gate=new AudioWorkletNode(c,'mn-voice-gate',{processorOptions:{th:MIC.th,on:MIC.gate,adapt:MIC.adapt,margin:MIC.margin,voice:store.get('micVoice',null)},channelCount:1,channelCountMode:'explicit'});
      ch.gate.port.onmessage=e=>{const d=e.data;ch.lvl=d.lvl;ch.open=d.open;ch.floor=d.floor;ch.cut=d.cut;
        /* the learned loudness of your voice is kept, so the next call starts already tuned to you */
        if(d.voice!=null&&Date.now()-(MICX.vt||0)>5000){MICX.vt=Date.now();store.set('micVoice',Math.round(d.voice*10)/10)}}}
    ch.wire=async()=>{
      if(ch.busy){ch.again=true;return}ch.busy=true;try{await ch.wire1()}finally{ch.busy=false}if(ch.again){ch.again=false;ch.wire()}
    };
    ch.wire1=async()=>{
      const want=MIC.ns==='strong'||MIC.ns==='max'?MIC.ns:'';
      if((ch.ns&&ch.ns.lv)!==want){const old=ch.ns;ch.ns=want?await micNS(want):null;if(ch.ns)ch.ns.lv=want;
        try{ch.src.disconnect();ch.hp.disconnect();old&&old.disconnect()}catch(e){}
        if(old&&old.destroy)setTimeout(()=>{try{old.destroy()}catch(e){}},200);
        let a=ch.src;a.connect(ch.hp);a=ch.hp;if(ch.ns){a.connect(ch.ns.first||ch.ns);a=ch.ns.last||ch.ns}
        if(ch.gate){a.connect(ch.gate);a=ch.gate}
        a.connect(ch.lp)}
    };
    ch.apply=()=>{ch.vol.gain.setTargetAtTime(MIC.vol,c.currentTime,.03);if(ch.gate)ch.gate.port.postMessage({th:MIC.th,on:MIC.gate,adapt:MIC.adapt,margin:MIC.margin});ch.wire()};
    ch.lp.connect(ch.cmp);ch.cmp.connect(ch.vol);ch.vol.connect(ch.dst);ch.vol.gain.value=MIC.vol;
    await ch.wire();
    const t=ch.dst.stream.getAudioTracks()[0];if('contentHint' in t)t.contentHint='speech';
    const stop=t.stop.bind(t);
    t.stop=()=>{stop();ch.raw.stop();MICX.live.delete(ch);setTimeout(()=>{try{ch.src.disconnect();ch.vol.disconnect();ch.ns&&ch.ns.destroy&&ch.ns.destroy()}catch(e){}},100)};
    ch.raw.addEventListener('ended',()=>{try{t.dispatchEvent(new Event('ended'))}catch(e){}});
    t._mn=ch;MICX.live.add(ch);
    const out=new MediaStream([t].concat(stream.getVideoTracks()));out._mn=ch;return out;
  }catch(e){console.warn('[mic]',e);return stream}
}
/* ================= who is speaking in a call: a green glow around them =================
   every 0.1 s the loudness of each voice is measured; a voice above the threshold lights up for a moment
   (your own glow follows the noise gate, so background noise never lights you up) */
const SPKD={t:0,an:new Map()};
function spkAn(key,st){let x=SPKD.an.get(key);if(x&&x.st===st)return x;const a=ac();if(!a||!st||!st.getAudioTracks().length)return null;
  try{if(x)x.src.disconnect();const src=a.createMediaStreamSource(st),an=a.createAnalyser();an.fftSize=512;src.connect(an);
    x={st,src,an,buf:new Float32Array(512),hold:0};SPKD.an.set(key,x);return x}catch(e){return null}}
function spkOn(x,now){if(!x)return false;x.an.getFloatTimeDomainData(x.buf);let s=0;for(let i=0;i<x.buf.length;i++)s+=x.buf[i]*x.buf[i];
  if(10*Math.log10(s/x.buf.length+1e-12)>-48)x.hold=now+350;return now<x.hold}
function meSpeaking(st,on,now){if(!on||!st)return false;const t=st.getAudioTracks()[0];if(!t||!t.enabled)return false;
  if(t._mn){if(t._mn.open&&t._mn.lvl>MIC.th)SPKD.me=now+300;return now<(SPKD.me||0)}return spkOn(spkAn('me',st),now)}
function spkTick(){
  const now=performance.now(),seen=new Set();
  if(CALL&&CALL.state==='active'){const el=$('#callEl');seen.add('c');seen.add('me');
    if(el){el.classList.toggle('rspk',spkOn(spkAn('c',CALL.remote),now));el.classList.toggle('mspk',meSpeaking(CALL.local,CALL.mic,now))}}
  if(GC&&GC.tiles){seen.add('me');GC.peers.forEach((p,id)=>{const st=p.audio&&p.audio.srcObject;seen.add('g'+id);const t=GC.tiles.get(id);if(t)t.classList.toggle('spk',spkOn(spkAn('g'+id,st),now))});
    const t=GC.tiles.get(S.me.id);if(t)t.classList.toggle('spk',meSpeaking(GC.local,GC.mic,now))}
  SPKD.an.forEach((x,k)=>{if(!seen.has(k)){try{x.src.disconnect()}catch(e){}SPKD.an.delete(k)}});
  if(!seen.size){clearInterval(SPKD.t);SPKD.t=0}
}
function spkWatch(){if(!SPKD.t)SPKD.t=setInterval(spkTick,100)}
/* «Микрофон и звук»: noise suppression, voice gate, microphone and speaker volume, devices, a live level meter */
const MICT={st:null,raf:0};
async function micTest(on){
  if(MICT.st){MICT.st.getTracks().forEach(t=>t.stop());MICT.st=null}
  if(on){try{const s=await navigator.mediaDevices.getUserMedia({audio:AUDIO});MICT.st=await micWrap(s)}catch(e){toast('Нет доступа к микрофону')}}
  const b=$('#micTestB');if(b)b.textContent=MICT.st?'Остановить проверку':'Проверить микрофон';micMeter();
}
function micMeter(){cancelAnimationFrame(MICT.raf);const m=$('#micMeter');if(!m){if(MICT.st)micTest(false);return}
  const ch=[...MICX.live][0];if(ch){const v=Math.max(0,Math.min(1,(ch.lvl+70)/60));m.style.setProperty('--v',v);m.style.setProperty('--t',Math.max(0,Math.min(1,((ch.cut!=null?ch.cut:MIC.th)+70)/60)));m.classList.toggle('open',!!ch.open);
    const st=$('#micState');if(st)st.textContent=ch.open?'🟢 Слышно голос':'⚪ Тишина — фон отсекается'}
  else{m.style.setProperty('--v',0);m.style.setProperty('--t',Math.max(0,Math.min(1,(MIC.th+70)/60)));const st=$('#micState');if(st)st.textContent='Нажмите «Проверить микрофон» или начните звонок'}
  MICT.raf=requestAnimationFrame(micMeter)}
async function soundSheet(){
  let ins=[],outs=[];try{const d=await navigator.mediaDevices.enumerateDevices();ins=d.filter(x=>x.kind==='audioinput'&&x.deviceId&&x.deviceId!=='communications');outs=d.filter(x=>x.kind==='audiooutput'&&x.deviceId!=='communications')}catch(e){}
  const canOut=outs.length>1&&('setSinkId' in HTMLMediaElement.prototype),pct=v=>Math.round(v*100)+'%';
  const tog=(k,b,sm)=>`<div class="set-row"><span class="mid"><b>${b}</b><small>${sm}</small></span><button class="gbtn ${MIC[k]?'primary':''}" data-act="mic-tog" data-k="${k}">${MIC[k]?'Вкл':'Выкл'}</button></div>`;
  sheet(`<h2>🎙 Микрофон и звук</h2>
    <div class="section-t set-sec">Шумоподавление</div>
    <div class="seg mic-seg">${[['off','Выкл'],['std','Обычное'],['strong','Сильное'],['max','Максимум']].map(([k,n])=>`<button class="${MIC.ns===k?'on':''}" data-act="mic-ns" data-v="${k}">${n}</button>`).join('')}</div>
    <p class="hint">${MIC.ns==='max'?'Нейросеть убирает всё, кроме вашего голоса: шум улицы, музыку, клавиатуру, гул, эхо комнаты, а вместе с «отсечкой фона» — и чужие голоса вдалеке.':MIC.ns==='strong'?'Нейросеть полегче — для слабых телефонов. Убирает шумы, гул и клавиатуру.':MIC.ns==='std'?'Встроенное шумоподавление браузера.':'Микрофон как есть, без обработки.'}</p>
    ${tog('gate','Отсекать фон и чужие голоса','Звук идёт, только когда говорите вы. Тише порога — тишина')}
    <div class="set-row" style="display:block"><b>Чувствительность</b> <small class="mv">${MIC.th} дБ</small>
      <div class="mic-meter" id="micMeter"><i></i><b></b></div><small id="micState" class="hint" style="display:block;margin:4px 0"></small>
      <input type="range" min="-70" max="-20" step="1" value="${MIC.th}" data-mic="th"><small class="hint">Зелёная черта — граница: громче неё (ваш голос) проходит, тише — тишина. Черта сама поднимается, когда рядом шумит телевизор. Нажмите «Проверить микрофон» и скажите пару фраз — приложение подстроится под ваш голос.</small>
      <button class="gbtn" id="micTestB" data-act="mic-test" style="margin-top:8px">${MICT.st?'Остановить проверку':'Проверить микрофон'}</button></div>
    ${tog('adapt','Отсекать телевизор и людей рядом','Приложение запоминает, как громко звучит ваш голос у микрофона. Всё, что заметно тише (телевизор в метре, разговоры в комнате), не слышно')}
    ${MIC.adapt?`<div class="set-row" style="display:block"><b>Строгость</b> <small class="mv">${MIC.margin} дБ</small><input type="range" min="6" max="20" step="1" value="${MIC.margin}" data-mic="margin" style="direction:rtl"><small class="hint">Правее — строже: телевизор не слышно, даже если он громкий. Если у собеседника пропадают ваши тихие слова — сдвиньте левее или говорите ближе к микрофону.</small></div>`:''}
    <div class="set-row" style="display:block"><b>Громкость микрофона</b> <small class="mv">${pct(MIC.vol)}</small><input type="range" min="0.3" max="2.5" step="0.05" value="${MIC.vol}" data-mic="vol"></div>
    ${tog('ec','Эхоподавление','Собеседник не слышит сам себя из вашего динамика')}
    ${tog('agc','Автогромкость','Браузер сам выравнивает громкость голоса')}
    ${ins.length>1?`<div class="section-t set-sec">Микрофон</div>${ins.map(d=>`<button class="row" data-act="mic-dev" data-id="${esc(d.deviceId)}"><span class="mid"><span class="nm">${esc(d.label||'Микрофон')}</span></span>${(MIC.dev||'default')===d.deviceId?ic('check'):''}</button>`).join('')}`:''}
    <div class="section-t set-sec">Собеседник</div>
    <div class="set-row" style="display:block"><b>Громкость собеседника</b> <small class="mv">${pct(SPK.vol)}</small><input type="range" min="0.5" max="4" step="0.1" value="${SPK.vol}" data-spk="vol"></div>
    <div class="set-row"><span class="mid"><b>Громкая связь</b><small>Голос чётче и громче, без хрипа</small></span><button class="gbtn ${SPK.loud?'primary':''}" data-act="spk-loud">${SPK.loud?'Вкл':'Выкл'}</button></div>
    ${canOut?`<div class="section-t set-sec">Куда выводить звук</div>${outs.map(d=>`<button class="row" data-act="spk-out" data-id="${esc(d.deviceId)}"><span class="mid"><span class="nm">${esc(d.label||(d.deviceId==='default'?'По умолчанию':'Устройство'))}</span></span>${((SPK.sink||'default')===d.deviceId)?ic('check'):''}</button>`).join('')}`:''}
    ${document.documentElement.classList.contains('ios')?'<p class="hint">На iPhone можно включить ещё и системную «Изоляцию голоса»: во время звонка откройте Пункт управления → «Режим микрофона».</p>':''}
    <div class="btns" style="margin-top:10px"><button class="gbtn" data-act="mic-reset">Сбросить</button><button class="gbtn primary" data-act="closemenu">Готово</button></div>`);
  micMeter();
}
/* a changed microphone or echo / auto-volume setting during a call: a new microphone goes into the same chain,
   the other side does not notice anything */
/* echo, auto-volume and the browser's own noise suppression change on the running microphone */
function micRecon(){MICX.live.forEach(ch=>{try{ch.raw.applyConstraints({echoCancellation:MIC.ec,noiseSuppression:MIC.ns!=='off',autoGainControl:MIC.agc}).catch(()=>{})}catch(e){}})}
async function micReopen(){
  for(const ch of MICX.live){try{const s=await navigator.mediaDevices.getUserMedia({audio:AUDIO});const nr=s.getAudioTracks()[0];
    const old=ch.raw,os=ch.src;ch.raw=nr;ch.src=MICX.ctx.createMediaStreamSource(new MediaStream([nr]));
    try{os.disconnect()}catch(e){}ch.src.connect(ch.hp);old.stop()}catch(e){}}
}
/* ================= soundpad: funny sounds in calls, group calls and voice chats =================
   A sound goes straight into what the others hear — after the noise remover and the voice gate, so it is never cut —
   and quietly into your own speaker. The built-in sounds are synthesized right here (nothing to download);
   your own sounds (mp3, m4a, wav…) are kept on this device. */
const PAD={vol:+store.get('padVol',.8)||.8,me:store.get('padMe',true)!==false,bufs:{},live:new Set(),edit:false,own:store.get('padOwn',[]),told:0};
if(!Array.isArray(PAD.own))PAD.own=[];
/* real recorded sounds (files in /vendor/pad, cleaned up and evened out in loudness); the last group is made by code */
const PAD_SND=[
  ["boom", "💥", "Бум", "meme"],
  ["rim", "🥁", "Ба-дум-тсс", "meme"],
  ["sad", "📉", "Провал", "meme"],
  ["win", "🏆", "Победа", "meme"],
  ["womp", "😬", "Упс", "meme"],
  ["nope", "🚫", "Неа", "meme"],
  ["banjo", "🪕", "Ну такое", "meme"],
  ["drum", "🪘", "Барабаны", "meme"],
  ["laugh", "😂", "Смех", "voice"],
  ["giggle", "🤭", "Хихи", "voice"],
  ["evil", "😈", "Злодей", "voice"],
  ["burp", "🤢", "Отрыжка", "voice"],
  ["scream", "😱", "А-а-а!", "voice"],
  ["clap", "👏", "Аплодисменты", "party"],
  ["ovation", "🎉", "Овации", "party"],
  ["popper", "🎊", "Хлопушка", "party"],
  ["fire", "🎆", "Салют", "party"],
  ["ding", "✅", "Верно!", "party"],
  ["cash", "💰", "Касса", "things"],
  ["coins", "🪙", "Монетки", "things"],
  ["boing", "🌀", "Боинг", "things"],
  ["spring", "➰", "Пружина", "things"],
  ["poof", "💨", "Пуф", "things"],
  ["pop", "🫧", "Чпок", "things"],
  ["gong", "🔔", "Гонг", "things"],
  ["alarm", "⏰", "Будильник", "things"],
  ["ring", "☎️", "Звонок", "things"],
  ["doorbell", "🚪", "Дзынь-дон", "things"],
  ["thunder", "⚡", "Гром", "things"],
  ["splash", "💦", "Плюх", "things"],
  ["quack", "🦆", "Кря", "animals"],
  ["sheep", "🐑", "Бе-е", "animals"],
  ["pig", "🐷", "Хрю", "animals"],
  ["dog", "🐶", "Гав", "animals"],
  ["chicken", "🐔", "Ко-ко", "animals"],
  ["fart","💩","Пук","synth"],["horn","📯","Дудка","synth"],["crick","🦗","Сверчки","synth"],["siren","🚨","Сирена","synth"],["pew","🔫","Пиу-пиу","synth"]];
const PAD_FILE=new Set(PAD_SND.filter(x=>x[3]!=='synth').map(x=>x[0])),PAD_V=2;
const PAD_G=[['meme','Мемы'],['voice','Голоса'],['party','Праздник'],['things','Звуки'],['animals','Животные'],['synth','Классика']];
const PAD_LEN={horn:1.2,rim:1.3,sad:2.5,boing:1,fart:1.15,quack:.65,clap:2.5,crick:2.3,drum:3.1,cash:1.4,siren:2.3,pew:.65,up:.95,down:.95,pop:.22,gong:3,scratch:.8,wow:1.6};
function padSynth(id){
  const sr=44100,O=window.OfflineAudioContext||window.webkitOfflineAudioContext;if(!O)return Promise.resolve(null);
  const c=new O(1,Math.ceil(sr*(PAD_LEN[id]||1)),sr),out=c.createDynamicsCompressor(),master=c.createGain();
  out.threshold.value=-12;out.knee.value=6;out.ratio.value=8;out.attack.value=.002;out.release.value=.1;master.gain.value=.9;out.connect(master);master.connect(c.destination);
  const NB=c.createBuffer(1,sr*2,sr);{const d=NB.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}
  /* G: a volume envelope (attack, hold, release); O1: a tone; N: noise; F: a filter */
  const G=(t,a,h,r,v,dst)=>{const g=c.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+a);g.gain.setValueAtTime(v,t+a+h);g.gain.exponentialRampToValueAtTime(.0001,t+a+h+r);g.connect(dst||out);return g};
  const O1=(type,f,t,dur,dst)=>{const o=c.createOscillator();o.type=type;o.frequency.setValueAtTime(f,t);o.connect(dst);o.start(t);o.stop(t+dur+.05);return o};
  const N=(t,dur,dst)=>{const s=c.createBufferSource();s.buffer=NB;s.loop=true;s.connect(dst);s.start(t,Math.random()*1.5);s.stop(t+dur+.05);return s};
  const F=(type,f,q,dst)=>{const b=c.createBiquadFilter();b.type=type;b.frequency.setValueAtTime(f,0);if(q!=null)b.Q.value=q;b.connect(dst||out);return b};
  const LFO=(param,f,depth,t0,t1)=>{const l=c.createOscillator(),g=c.createGain();l.frequency.value=f;g.gain.value=depth;l.connect(g);g.connect(param);l.start(t0);l.stop(t1);return {l,g}};
  const snare=(t,v)=>{N(t,.12,F('bandpass',1900,.8,G(t,.001,0,.11,v)));O1('triangle',190,t,.08,G(t,.001,0,.07,v*.7))};
  const tom=(t,f0,f1,v)=>{const o=O1('sine',f0,t,.35,G(t,.003,.02,.3,v));o.frequency.exponentialRampToValueAtTime(f1,t+.3)};
  const cym=(t,d,v)=>N(t,d,F('highpass',6500,.5,G(t,.002,0,d,v)));
  switch(id){
    case 'horn':[[0,.16],[.21,.16],[.42,.62]].forEach(([t,d])=>{const b=F('peaking',1800,1,G(t,.015,d,.08,.3));b.gain.value=8;
      [466,470,233.5].forEach((f,i)=>{const o=O1(i<2?'sawtooth':'square',f*.94,t,d+.1,b);o.frequency.linearRampToValueAtTime(f,t+.04)})});break;
    case 'rim':tom(0,190,120,.9);tom(.17,140,85,.9);snare(.42,.8);cym(.42,.75,.5);break;
    case 'sad':{const lp=F('lowpass',1400,1.5);[[0,392,.42],[.48,370,.42],[.96,349,.42],[1.44,330,.95]].forEach(([t,f,d],i)=>{
      const o=O1('sawtooth',f*1.03,t,d+.1,G(t,.03,d-.08,.12,.4,lp));o.frequency.exponentialRampToValueAtTime(f,t+.08);
      if(i===3){o.frequency.setValueAtTime(f,t+.3);o.frequency.linearRampToValueAtTime(f*.93,t+d);LFO(o.frequency,5.5,9,t+.15,t+d+.1)}});break}
    case 'boing':{const o=O1('triangle',180,0,.9,G(0,.005,.05,.8,.5));o.frequency.linearRampToValueAtTime(260,.8);
      const m=LFO(o.frequency,16,110,0,.9);m.l.frequency.setValueAtTime(16,0);m.l.frequency.linearRampToValueAtTime(9,.85);m.g.gain.setValueAtTime(110,0);m.g.gain.exponentialRampToValueAtTime(5,.85);break}
    case 'up':case 'down':{const o=O1('sine',id==='up'?380:1900,0,.85,G(0,.02,.62,.15,.4));o.frequency.exponentialRampToValueAtTime(id==='up'?1900:300,.75);LFO(o.frequency,7,18,0,.85);break}
    case 'fart':{const g=G(0,.02,.6,.38,.75,F('lowpass',520,2)),o=O1('sawtooth',95,0,1.05,g),curve=new Float32Array(64);let f=95;
      for(let i=0;i<64;i++){f+=(Math.random()-.5)*18;f=Math.max(60,Math.min(140,f));curve[i]=f*(i<40?1+i/120:1.33-(i-40)/90)}
      o.frequency.setValueCurveAtTime(curve,.01,.95);LFO(g.gain,24,.35,0,1);N(0,.95,F('bandpass',180,1,G(0,.02,.5,.4,.35)));break}
    case 'quack':[0,.3].forEach(t=>{const o=O1('sawtooth',560,t,.25,F('bandpass',1150,3,G(t,.01,.1,.1,.9)));o.frequency.exponentialRampToValueAtTime(380,t+.2);o.connect(F('bandpass',2600,4,G(t,.01,.1,.1,.35)))});break;
    case 'clap':for(let t=0;t<2.3;t+=.012+Math.random()*.03){const v=.35*Math.min(1,t/.35,(2.4-t)/.7)*(.5+Math.random()*.5);N(t,.05,F('bandpass',900+Math.random()*1800,1.2,G(t,.001,.003,.045,v)))}break;
    case 'crick':for(let b=0;b<4;b++)for(let k=0;k<3;k++){const t=.1+b*.52+k*.055;O1('sine',4400+b*40,t,.05,G(t,.004,.02,.02,.22));O1('sine',8800,t,.05,G(t,.004,.02,.02,.04))}break;
    case 'drum':{for(let t=0;t<1.8;t+=.055)snare(t,.18+.5*t/1.8);tom(1.85,110,60,1);cym(1.85,1.2,.55);break}
    case 'cash':N(0,.06,F('highpass',2500,.7,G(0,.001,.01,.05,.6)));N(.09,.05,F('highpass',3000,.7,G(.09,.001,.01,.04,.4)));
      [2637,3520,5274,7040].forEach((f,i)=>O1('sine',f,.16,1.1,G(.16,.002,.02,1-i*.15,.22/(i+1))));break;
    case 'siren':{const o=O1('sawtooth',650,0,2.2,G(0,.05,1.95,.15,.3,F('lowpass',2600,.7)));[.5,1,1.5,2].forEach((t,i)=>o.frequency.linearRampToValueAtTime(i%2?650:1250,t));break}
    case 'pew':[0,.3].forEach(t=>{const o=O1('square',1600,t,.28,F('lowpass',3500,.7,G(t,.002,.02,.22,.25)));o.frequency.exponentialRampToValueAtTime(180,t+.24)});break;
    case 'pop':{const o=O1('sine',280,0,.12,G(0,.001,.01,.08,.7));o.frequency.exponentialRampToValueAtTime(1100,.05);N(0,.02,F('highpass',3000,.7,G(0,.0005,.002,.015,.4)));break}
    case 'gong':[[110,1],[155.6,.6],[207,.5],[262,.35],[330,.3],[412,.2],[523,.12]].forEach(([f,v],i)=>{O1('sine',f,0,2.95,G(0,.005,.05,2.8-i*.25,v*.32));O1('sine',f*1.004,0,2.95,G(0,.005,.05,2.6-i*.25,v*.12))});
      N(0,.3,F('lowpass',900,.7,G(0,.002,.02,.25,.4)));break;
    case 'scratch':[[0,.3,1],[.34,.36,0]].forEach(([t,d,up])=>{const b=F('bandpass',up?300:2600,4,G(t,.01,d-.06,.05,1.4));b.frequency.setValueAtTime(up?300:2600,t);b.frequency.exponentialRampToValueAtTime(up?2600:250,t+d);N(t,d,b);
      const o=O1('sawtooth',up?90:300,t,d,F('lowpass',900,1,G(t,.01,d-.06,.05,.25)));o.frequency.exponentialRampToValueAtTime(up?300:80,t+d)});break;
    case 'wow':{const f1=F('bandpass',320,5,G(0,.06,.9,.3,1.6)),f2=F('bandpass',700,6,G(0,.06,.9,.3,.8)),o=O1('sawtooth',170,0,1.3,f1);o.connect(f2);
      o.frequency.linearRampToValueAtTime(240,.35);o.frequency.linearRampToValueAtTime(150,1.2);
      f1.frequency.linearRampToValueAtTime(650,.35);f1.frequency.linearRampToValueAtTime(380,1.2);f2.frequency.linearRampToValueAtTime(1100,.35);f2.frequency.linearRampToValueAtTime(750,1.2);
      LFO(o.frequency,5,6,.4,1.3);break}
  }
  return new Promise(ok=>{c.oncomplete=e=>ok(e.renderedBuffer);try{const p=c.startRendering();if(p&&p.then)p.then(ok,()=>ok(null))}catch(e){ok(null)}});
}
function padDecode(ab){const c=MICX.ctx||ac();if(!c)return Promise.resolve(null);
  return new Promise(ok=>{try{const r=c.decodeAudioData(ab,ok,()=>ok(null));if(r&&r.then)r.then(ok,()=>ok(null))}catch(e){ok(null)}})}
const padOwnId=id=>PAD.own.some(x=>x.id===id);
function padFetch(id){return fetch(`/vendor/pad/${id}.mp3?v=${PAD_V}`).then(r=>r.ok?r.arrayBuffer():null).then(ab=>ab?padDecode(ab):null).catch(()=>null)}
function padBuf(id){
  if(!PAD.bufs[id]){const p=padOwnId(id)?IDB.get('pad:'+id).then(ab=>ab?padDecode(ab.slice(0)):null):PAD_FILE.has(id)?padFetch(id).then(b=>b||padSynth(id)):padSynth(id);
    PAD.bufs[id]=p.then(b=>{if(!b)delete PAD.bufs[id];return b},()=>{delete PAD.bufs[id];return null})}
  return PAD.bufs[id];
}
const padLive=()=>!!((CALL&&CALL.state==='active'&&CALL.local)||(GC&&GC.local)||(VC&&VC.local));
const padMicOn=()=>CALL?CALL.mic:GC?GC.mic:VC?!VC.mute:true;
/* the sound needs the cleaned-microphone chain; if the call went out with the plain microphone, it is wrapped now
   and the new track quietly replaces the old one (the others notice nothing) */
async function padEnsure(){
  const st=CALL&&CALL.local||GC&&GC.local||VC&&VC.local,t=st&&st.getAudioTracks()[0];if(!t)return null;if(t._mn)return t._mn;
  const w=await micWrap(st,true),a=w.getAudioTracks()[0];if(!a||!a._mn)return null;
  if(CALL&&CALL.local===st){a.enabled=CALL.mic;CALL.local=w;if(CALL.va)CALL.va.sender.replaceTrack(a).catch(()=>{})}
  else if(GC&&GC.local===st){a.enabled=GC.mic;GC.local=w;GC.peers.forEach(p=>{if(p.as)p.as.replaceTrack(a).catch(()=>{})})}
  else if(VC&&VC.local===st){a.enabled=!VC.mute;VC.local=w;VC.peers.forEach(p=>{const s=p.pc.getSenders().find(x=>x.track&&x.track.kind==='audio');if(s)s.replaceTrack(a).catch(()=>{})})}
  else return null;
  return a._mn;
}
async function padPlay(id){
  const ctx=await micCtx()||ac();if(!ctx)return toast('Этот браузер не умеет проигрывать звуки');
  if(ctx.state!=='running')ctx.resume().catch(()=>{});
  const buf=await padBuf(id);if(!buf)return toast('Не удалось открыть звук');
  const live=padLive();let ch=null;
  if(live){ch=await padEnsure();if(!ch)toast('Не получилось подключить звук к звонку — слышите только вы')}
  if(PAD.live.size>=4){const o=PAD.live.values().next().value;try{o.stop()}catch(e){}PAD.live.delete(o)}
  const src=ctx.createBufferSource(),g0=ctx.createGain();src.buffer=buf;g0.gain.value=PAD.vol;src.connect(g0);
  /* a limiter per sound: at 150% volume a loud sound is held just under the top instead of crackling */
  const g=ctx.createDynamicsCompressor();g.threshold.value=-4;g.knee.value=2;g.ratio.value=20;g.attack.value=.001;g.release.value=.08;g0.connect(g);
  if(ch&&ch.dst.context===ctx){if(!ch.pad){ch.pad=ctx.createGain();ch.pad.connect(ch.dst)}g.connect(ch.pad)}
  let mon=null;if(!live||PAD.me||!ch){mon=ctx.createGain();mon.gain.value=live&&ch?.45:1;g.connect(mon);mon.connect(ctx.destination)}
  src.onended=()=>{PAD.live.delete(src);try{g0.disconnect();g.disconnect();if(mon)mon.disconnect()}catch(e){}};
  src.start();try{src.stop(ctx.currentTime+30)}catch(e){}
  PAD.live.add(src);
  if(live&&ch){padTell(id);if(!padMicOn())toast('🎙 Микрофон выключен — собеседники не услышат звук')}
}
function padStop(){PAD.live.forEach(s=>{try{s.stop()}catch(e){}});PAD.live.clear()}
/* the others get a small note who played what */
function padTell(id){const now=Date.now();if(now-PAD.told<1200)return;PAD.told=now;
  const s=PAD_SND.find(x=>x[0]===id),o=PAD.own.find(x=>x.id===id),d={pad:(s?s[1]+' '+s[2]:o?o.e+' '+o.name:'🎵').slice(0,40)};
  if(CALL&&CALL.id)wsSend({t:'rtc',callId:CALL.id,data:d});
  else if(GC)GC.peers.forEach((p,uid)=>wsSend({t:'grtc',to:uid,data:d}));
  else if(VC)VC.peers.forEach((p,uid)=>wsSend({t:'vrtc',to:uid,data:d}));
}
function padHeard(uid,label){const u=uid&&S.users[uid];toast(`🔊 ${u?nm(u):'Собеседник'}: ${String(label).slice(0,40)}`,1800)}
function padSaveOwn(){store.set('padOwn',PAD.own)}
function padAdd(){const f=document.createElement('input');f.type='file';f.accept='audio/*,.mp3,.m4a,.wav,.ogg,.aac,.opus,.caf';f.onchange=()=>{if(f.files[0])padAddFile(f.files[0])};f.click()}
async function padAddFile(file){
  if(PAD.own.length>=40)return toast('Уже 40 своих звуков — удалите ненужные');
  if(file.size>10e6)return toast('Файл слишком большой — до 10 МБ');
  let ab;try{ab=await file.arrayBuffer()}catch(e){return toast('Не удалось прочитать файл')}
  await micCtx();const b=await padDecode(ab.slice(0));
  if(!b)return toast('Не получилось открыть этот звук. Подойдут mp3, m4a, wav');
  const id='u'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
  try{await IDB.set('pad:'+id,ab)}catch(e){return toast('Не удалось сохранить звук на телефоне')}
  PAD.own.push({id,name:(file.name||'').replace(/\.[a-z0-9]+$/i,'').replace(/[_-]+/g,' ').trim().slice(0,24)||'Мой звук',e:'🎵'});padSaveOwn();
  PAD.bufs[id]=Promise.resolve(b);
  toast(b.duration>30?'Звук добавлен. В звонке прозвучат первые 30 секунд':'Звук добавлен');padSheet();
}
function padWarm(){if(PAD.warm)return;PAD.warm=true;const ids=PAD_SND.map(x=>x[0]).concat(PAD.own.map(x=>x.id));let i=0;
  const next=()=>{if(i>=ids.length)return;const id=ids[i++];padBuf(id).finally(()=>setTimeout(next,isLite()?60:0))};for(let k=0;k<3;k++)next()}
function padSheet(){
  const live=padLive();micCtx().then(()=>padWarm());
  const key=(id,e,n,own)=>`<button class="pad-k${own?' own':''}${PAD.edit&&own?' ed':''}" data-act="${PAD.edit&&own?'pad-edit':'pad-play'}" data-id="${esc(id)}"><span class="pe">${esc(e)}</span><span class="pn">${esc(n)}</span></button>`;
  sheet(`<h2>🎛 Саундпад</h2><p class="sub">${live?'Нажмите — звук услышат все в звонке':'Нажмите, чтобы послушать. Во время звонка звук услышат все'}</p>
    ${PAD_G.map(([g,t])=>`<div class="section-t set-sec">${t}</div><div class="pad-grid g-${g}">${PAD_SND.filter(x=>x[3]===g).map(([id,e,n])=>key(id,e,n)).join('')}</div>`).join('')}
    <div class="section-t set-sec">Мои звуки</div>
    <div class="pad-grid">${PAD.own.map(s=>key(s.id,s.e,s.name,true)).join('')}<button class="pad-k add" data-act="pad-add"><span class="pe">＋</span><span class="pn">Свой звук</span></button></div>
    ${PAD.own.length?`<button class="gbtn" data-act="pad-editmode" style="margin-top:8px">${PAD.edit?'✓ Готово':'✎ Переименовать или удалить'}</button>`:'<p class="hint">Добавьте свой звук из файлов телефона: mp3, m4a или wav. Он хранится только на этом устройстве.</p>'}
    <div class="set-row" style="display:block;margin-top:10px"><b>Громкость звуков</b> <small class="mv">${Math.round(PAD.vol*100)}%</small><input type="range" min="0.1" max="1.5" step="0.05" value="${PAD.vol}" data-pad="vol"></div>
    <div class="set-row"><span class="mid"><b>Слышать самому</b><small>Звук играет и у вас, потише</small></span><button class="gbtn ${PAD.me?'primary':''}" data-act="pad-me">${PAD.me?'Вкл':'Выкл'}</button></div>
    <div class="btns" style="margin-top:10px"><button class="gbtn" data-act="pad-stop">⏹ Тишина</button><button class="gbtn primary" data-act="closemenu">Готово</button></div>
    <p class="hint pad-cr">Звуки: SFX Kit (CC0) и «Oculus Audio Pack 01» © Oculus VR, LLC, CC BY 4.0</p>`);
}
function padEditSheet(id){const s=PAD.own.find(x=>x.id===id);if(!s)return;
  sheet(`<h2>Свой звук</h2>
    <label class="field"><span>Название</span><input class="input" id="padNm" maxlength="24" value="${esc(s.name)}"></label>
    <label class="field"><span>Значок (эмодзи)</span><input class="input" id="padEm" maxlength="8" value="${esc(s.e)}"></label>
    <div class="btns"><button class="gbtn danger" data-act="pad-del" data-id="${esc(id)}">Удалить</button><button class="gbtn" data-act="pad-play" data-id="${esc(id)}">▶︎</button><button class="gbtn primary" data-act="pad-save" data-id="${esc(id)}">Сохранить</button></div>`)}

const camC=(facing)=>(isLite()||(touch&&GC&&GC.peers.size>2))?{facingMode:facing||'user',width:{ideal:640},height:{ideal:480},frameRate:{ideal:24,max:24}}:(touch?{facingMode:facing||'user',width:{ideal:1280},height:{ideal:720},frameRate:{ideal:30,max:30}}:{facingMode:facing||'user',width:{ideal:1920},height:{ideal:1080},frameRate:{ideal:30,max:30}});
async function getMedia(video){
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)throw new Error('Браузер не даёт доступ к микрофону. Открой сайт по https.');
  let st;
  try{st=await navigator.mediaDevices.getUserMedia({audio:AUDIO,video:video?camC():false})}
  catch(e){
    if(video){try{st=await navigator.mediaDevices.getUserMedia({audio:AUDIO})}catch(e2){}}
    if(!st){try{st=await navigator.mediaDevices.getUserMedia({audio:true,video:!!video})}catch(e3){}}
    if(!st)throw new Error(e.name==='NotAllowedError'?'Нет доступа к микрофону/камере. Разреши его в настройках браузера.':'Не удалось включить микрофон: '+e.message);
  }
  st=await micWrap(st);
  st.getAudioTracks().forEach(t=>{if('contentHint' in t)t.contentHint='speech'});
  st.getVideoTracks().forEach(t=>{if('contentHint' in t)t.contentHint='motion'});
  return st;
}
/* voice: Opus at 48 kbit/s (full-band, clean), with forward error correction so short network hiccups are not heard.
   On top of that every packet also carries a copy of the previous one (RED, RFC 2198 — what Google Meet and Jitsi use):
   a lost packet is rebuilt from the next one, so even 20–30 % loss on mobile internet sounds whole. */
function tuneSdp(sdp,kbps){
  const m=/a=rtpmap:(\d+) opus\/48000/i.exec(sdp);if(!m)return sdp;const pt=m[1];
  const extra=`maxaveragebitrate=${(kbps||48)*1000};useinbandfec=1;usedtx=0;stereo=0;maxplaybackrate=48000`;
  const re=new RegExp(`a=fmtp:${pt} ([^\\r\\n]*)`);
  if(re.test(sdp))return sdp.replace(re,(all,p)=>`a=fmtp:${pt} `+p.split(';').filter(x=>!/^(maxaveragebitrate|useinbandfec|usedtx|stereo|maxplaybackrate)=/.test(x.trim())).concat(extra).join(';'));
  return sdp.replace(m[0],m[0]+`\r\na=fmtp:${pt} ${extra}`);
}
async function setLocal(pc,desc,kbps){await pc.setLocalDescription({type:desc.type,sdp:tuneSdp(desc.sdp,kbps)})}
/* RED first, then Opus: the browser then sends every voice packet twice (the fresh one + the previous one).
   A side that cannot do RED simply gets plain Opus — nothing breaks. */
let AUDIO_CODECS=null;
function redFirst(pc){
  try{if(!RTCRtpReceiver.getCapabilities||!('setCodecPreferences' in RTCRtpTransceiver.prototype))return;
    if(!AUDIO_CODECS){const cs=RTCRtpReceiver.getCapabilities('audio').codecs,snd=(RTCRtpSender.getCapabilities&&RTCRtpSender.getCapabilities('audio').codecs)||cs;
      const canRed=snd.some(c=>/audio\/red/i.test(c.mimeType))&&cs.some(c=>/audio\/red/i.test(c.mimeType));
      const rank=c=>/audio\/red/i.test(c.mimeType)?(canRed?0:5):/opus/i.test(c.mimeType)?1:/CN|telephone-event/i.test(c.mimeType)?3:2;
      AUDIO_CODECS=cs.slice().sort((a,b)=>rank(a)-rank(b))}
    pc.getTransceivers().forEach(t=>{const k=(t.receiver&&t.receiver.track&&t.receiver.track.kind)||(t.sender&&t.sender.track&&t.sender.track.kind);
      if(k==='audio'&&!t.stopped){try{t.setCodecPreferences(AUDIO_CODECS)}catch(e){}}});
  }catch(e){}
}
const mkOffer=(pc,o)=>{redFirst(pc);return pc.createOffer(o)};
const mkAnswer=pc=>{redFirst(pc);return pc.createAnswer()};
/* the receiving side: a slightly deeper jitter buffer on a shaky network, so the voice never stutters */
function jitterFor(pc,bad){try{pc.getReceivers().forEach(r=>{if(r.track&&r.track.kind==='audio'){if('jitterBufferTarget' in r)r.jitterBufferTarget=bad?160:null;else if('playoutDelayHint' in r)r.playoutDelayHint=bad?.16:null}})}catch(e){}}
/* weak phones encode H.264 in hardware, which is much lighter than doing VP8 in software */
function preferCodecs(tv){
  try{
    if(!tv.setCodecPreferences||!RTCRtpReceiver.getCapabilities)return;
    const cs=RTCRtpReceiver.getCapabilities('video').codecs;
    const hw=isLite()||touch,rank=c=>/H264/i.test(c.mimeType)?(hw?0:2):/VP9/i.test(c.mimeType)?(hw?2:0):/VP8/i.test(c.mimeType)?1:/AV1/i.test(c.mimeType)?3:4;
    tv.setCodecPreferences(cs.slice().sort((a,b)=>rank(a)-rank(b)));
  }catch(e){}
}
async function startCall(chatId,kind){
  micCtx();
  if(CALL){toast('Ты уже в звонке');return}
  if(VC){toast('Сначала выйди из голосового канала');return}
  if(GC){toast('Сначала выйди из группового звонка');return}
  const c=S.chats[chatId];if(!c||c.type!=='dm')return;
  closeLayer();
  const peer=peerOf(c);
  CALL={id:null,chat:chatId,peer,kind,dir:'out',state:'calling',mic:true,cam:kind==='video',screen:false,remote:new MediaStream(),pending:[],rs:{cam:false,screen:false,mic:true},q:'good',fxs:fxState()};
  renderCall();
  try{CALL.local=await getMedia(kind==='video');CALL.cam=CALL.local.getVideoTracks().length>0;renderCall()}
  catch(e){toast(e.message);cleanupCall();return}
  if(!CALL)return;
  if(!wsSend({t:'call',chat:chatId,kind})){toast('Нет связи с сервером');cleanupCall();return}
  ring('out');
}
async function acceptCall(){
  if(!CALL||CALL.state!=='ringing')return;stopRing();
  CALL.state='connecting';renderCall();
  try{CALL.local=await getMedia(CALL.kind==='video');CALL.cam=CALL.local.getVideoTracks().length>0}
  catch(e){toast(e.message);wsSend({t:'call-reject',callId:CALL.id});cleanupCall();return}
  await makePC();
  wsSend({t:'call-accept',callId:CALL.id});
  renderCall();
}
async function makePC(){
  const pc=CALL.pc=new RTCPeerConnection({iceServers:await iceServers(),bundlePolicy:'max-bundle',iceCandidatePoolSize:2});
  pc.onicecandidate=e=>{if(e.candidate&&CALL)wsSend({t:'rtc',callId:CALL.id,data:{cand:e.candidate.toJSON()}})};
  pc.ontrack=e=>{if(!CALL)return;CALL.remote.addTrack(e.track);attachRemote()};
  /* reconnection: the caller restarts the network path; the other side asks the caller to do it */
  pc.onnegotiationneeded=async()=>{
    if(!CALL||CALL.dir!=='out'||!CALL.negotiated||CALL.pc!==pc)return;
    try{const o=await mkOffer(pc,{iceRestart:true});await setLocal(pc,o);wsSend({t:'rtc',callId:CALL.id,data:{sdp:pc.localDescription.toJSON()}})}catch(e){}
  };
  /* never connected: the two networks cannot reach each other directly */
  clearTimeout(CALL.connT);CALL.connT=setTimeout(()=>{if(CALL&&CALL.pc===pc&&!CALL.started){toast(ICE_RELAY?'Не удалось соединиться. Проверьте интернет у обоих и позвоните ещё раз':'Не удалось соединиться: сети не пускают звонок напрямую. Нужен сервер-посредник (TURN) — см. настройки сервера',6000);hangup()}},30000);
  pc.onconnectionstatechange=()=>{
    if(!CALL||CALL.pc!==pc)return;const s=pc.connectionState;
    if(s==='connected'){
      clearTimeout(CALL.discT);clearTimeout(CALL.failT);
      if(CALL.state!=='active'){CALL.state='active';CALL.started=Date.now();sendState();startTimer();startStats()}
      CALL.reconnecting=false;tuneSenders();renderCall();
    }
    if(s==='disconnected'||s==='failed'){
      CALL.reconnecting=true;renderCall();clearTimeout(CALL.discT);
      CALL.discT=setTimeout(restartIce,s==='failed'?0:1500);
      clearTimeout(CALL.failT);CALL.failT=setTimeout(()=>{if(CALL&&CALL.pc===pc&&pc.connectionState!=='connected'){toast('Связь потеряна. Звонок завершён.');hangup()}},25000);
    }
  };
  return pc;
}
function restartIce(){
  if(!CALL||!CALL.pc||CALL.pc.connectionState==='connected')return;
  if(CALL.dir==='out'){try{CALL.pc.restartIce()}catch(e){}}else wsSend({t:'rtc',callId:CALL.id,data:{restart:1}});
}
/* video bitrate: HD when the network is good, lower when it is not */
/* ---------- speaker: where the call sound goes (speakers, headphones…) and "loud" mode ----------
   Loud mode sends the other side's voice through a volume boost with a limiter, so it is louder but never crackles. */
/* loud mode is on by default on Android and computers (iPhone plays calls through its own path, there it stays an option) */
const SPK={loud:store.get('loud',!document.documentElement.classList.contains('ios')),vol:+store.get('spkVol',1)||1,sink:store.get('sink',''),ctx:null,nodes:new Map()};
function callStreams(){const l=[];if(CALL&&CALL.remote)l.push(['c',CALL.remote,$('#ra')]);if(GC)GC.peers.forEach((p,id)=>{if(p.audio&&p.audio.srcObject)l.push(['g'+id,p.audio.srcObject,p.audio])});return l}
function applySpeaker(){
  store.set('sink',SPK.sink);
  const list=callStreams();
  if((SPK.loud||SPK.vol!==1)&&list.length&&(window.AudioContext||window.webkitAudioContext)){
    if(!SPK.ctx){const A=window.AudioContext||window.webkitAudioContext;SPK.ctx=new A({latencyHint:'interactive'});
      /* voice → clarity (presence boost) → compressor (quiet words come up) → gain → limiter (loud, but never crackles) */
      const c=SPK.ctx,eq=c.createBiquadFilter(),cmp=c.createDynamicsCompressor(),g=c.createGain(),lim=c.createDynamicsCompressor();
      eq.type='peaking';eq.frequency.value=2600;eq.Q.value=.8;eq.gain.value=4;
      cmp.threshold.value=-30;cmp.knee.value=8;cmp.ratio.value=4;cmp.attack.value=.003;cmp.release.value=.2;
      g.gain.value=3.4;
      lim.threshold.value=-1.5;lim.knee.value=0;lim.ratio.value=20;lim.attack.value=.001;lim.release.value=.08;
      eq.connect(cmp);cmp.connect(g);g.connect(lim);lim.connect(c.destination);SPK.gain=eq;SPK.comp=lim;SPK.eq=eq;SPK.cmp=cmp;SPK.g=g}
    spkLevels();
    SPK.ctx.resume().catch(()=>{});
    if(SPK.sink&&SPK.ctx.setSinkId)SPK.ctx.setSinkId(SPK.sink).catch(()=>{});
    for(const [k,st,el] of list){
      if(!st.getAudioTracks().length)continue;
      if(!SPK.nodes.has(k)||SPK.nodes.get(k).st!==st){try{const n=SPK.ctx.createMediaStreamSource(st);n.connect(SPK.gain);SPK.nodes.set(k,{n,st})}catch(e){}}
      if(el){el.muted=true;el.play().catch(()=>{})} /* the element must keep playing (muted) or Chrome gives silence */
    }
  }else{
    SPK.nodes.forEach(x=>{try{x.n.disconnect()}catch(e){}});SPK.nodes.clear();
    for(const [k,st,el] of list)if(el){el.muted=false;if(SPK.sink&&el.setSinkId)el.setSinkId(SPK.sink).catch(()=>{});el.play().catch(()=>{})}
  }
}
/* loud mode = clarity + leveller + boost; the volume slider multiplies on top (0.5× … 4×), the limiter keeps it clean */
function spkLevels(){if(!SPK.ctx||!SPK.g)return;const t=SPK.ctx.currentTime;
  SPK.eq.gain.setTargetAtTime(SPK.loud?4:0,t,.05);SPK.cmp.ratio.setTargetAtTime(SPK.loud?4:1,t,.05);SPK.g.gain.setTargetAtTime((SPK.loud?3.4:1)*SPK.vol,t,.05)}
async function speakerSheet(){soundSheet()}
async function speakerSheetOld(){
  let outs=[];try{outs=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==='audiooutput'&&d.deviceId!=='communications')}catch(e){}
  const canPick=outs.length>1&&('setSinkId' in HTMLMediaElement.prototype);
  if(!canPick){SPK.loud=!SPK.loud;store.set('loud',SPK.loud);applySpeaker();toast(SPK.loud?'🔊 Громкая связь включена':'Обычная громкость');if(CALL)renderCall();if(GC)gcRender();return}
  const cur=SPK.sink||'default';
  sheet(`<h2>🔊 Звук звонка</h2><div class="section-t">Куда выводить</div>
    ${outs.map(d=>`<button class="row" data-act="spk-out" data-id="${esc(d.deviceId)}"><span class="mid"><span class="nm">${esc(d.label||(d.deviceId==='default'?'По умолчанию':'Устройство'))}</span></span>${(cur===d.deviceId)?ic('check'):''}</button>`).join('')}
    <div class="set-row" style="margin-top:8px"><span class="mid"><b>Громкая связь</b><small>Голос собеседника громче</small></span><button class="gbtn ${SPK.loud?'primary':''}" data-act="spk-loud">${SPK.loud?'Вкл':'Выкл'}</button></div>`);
}
function tuneSenders(){
  if(!CALL||!CALL.vv)return;
  const sd=CALL.vv.sender,p=sd.getParameters();if(!p.encodings||!p.encodings.length)p.encodings=[{}];
  const bad=CALL.q==='bad',mid=CALL.q==='mid',lite=isLite();
  const e=p.encodings[0];
  if(CALL.screen){e.maxBitrate=bad?1000e3:mid?2500e3:lite?2500e3:5000e3;e.maxFramerate=bad?12:mid?20:30;e.scaleResolutionDownBy=1}
  else{e.maxBitrate=bad?250e3:mid?900e3:lite?1200e3:touch?2500e3:3500e3;e.maxFramerate=bad?15:lite?24:30;e.scaleResolutionDownBy=bad?2.5:1}
  e.priority='high';
  /* on a weak network keep the picture smooth (lower sharpness) instead of freezing */
  p.degradationPreference=CALL.screen?'maintain-resolution':bad?'maintain-framerate':'balanced';
  sd.setParameters(p).catch(()=>{});
  /* the voice always goes first: on a weak network the picture gives way, the voice keeps enough room for itself and its copy */
  jitterFor(CALL.pc,bad);
  if(CALL.va){const ap=CALL.va.sender.getParameters();if(ap.encodings&&ap.encodings[0]){ap.encodings[0].maxBitrate=bad?28e3:mid?36e3:48e3;ap.encodings[0].priority='high';ap.encodings[0].networkPriority='high';CALL.va.sender.setParameters(ap).catch(()=>{})}}
}
/* every 2 seconds: round-trip time and lost packets → connection bars and video quality */
function startStats(){
  clearInterval(CALL.statT);let prev=null,badN=0,goodN=0;
  CALL.statT=setInterval(async()=>{
    if(!CALL||!CALL.pc)return;
    let rtt=0,lost=0,recv=0;
    try{(await CALL.pc.getStats()).forEach(r=>{
      if(r.type==='candidate-pair'&&r.state==='succeeded'&&r.nominated&&r.currentRoundTripTime!=null)rtt=r.currentRoundTripTime;
      if(r.type==='inbound-rtp'&&!r.isRemote){lost+=r.packetsLost||0;recv+=r.packetsReceived||0}
    })}catch(e){return}
    let loss=0;if(prev){const dl=lost-prev.lost,dr=recv-prev.recv;loss=dl+dr>0?dl/(dl+dr):0}prev={lost,recv};
    const q=rtt>.6||loss>.08?'bad':rtt>.3||loss>.03?'mid':'good';
    if(q==='good'){goodN++;badN=0}else{badN++;goodN=0}
    const nq=q==='good'&&goodN<3&&CALL.q!=='good'?CALL.q:q; /* step back up only after 6 s of good network */
    if(nq!==CALL.q){CALL.q=nq;tuneSenders();const el=$('#cq');if(el){el.className='cq '+nq;el.title=qText()}}
  },2000);
}
const qText=()=>CALL?{good:'Хорошая связь',mid:'Средняя связь',bad:'Слабая связь — качество снижено'}[CALL.q]:'';
/* put our microphone and camera into the two channels (caller creates them, callee finds them in the offer) */
function attachLocal(){
  const pc=CALL.pc,a=CALL.local.getAudioTracks()[0]||null;
  let ta=pc.getTransceivers().find(t=>t.receiver.track.kind==='audio'),tv=pc.getTransceivers().find(t=>t.receiver.track.kind==='video');
  if(!ta)ta=pc.addTransceiver('audio',{direction:'sendrecv',streams:[CALL.local]});
  if(!tv)tv=pc.addTransceiver('video',{direction:'sendrecv',streams:[CALL.local]});
  ta.direction='sendrecv';tv.direction='sendrecv';
  preferCodecs(tv);
  CALL.va=ta;CALL.vv=tv;
  ta.sender.replaceTrack(a);tv.sender.replaceTrack(outVideo());
}
/* what goes out as video: the screen, the camera with a mask, or the plain camera */
function camTrack(){return CALL&&CALL.local?CALL.local.getVideoTracks()[0]||null:null}
function outVideo(){if(!CALL)return null;if(CALL.screen)return CALL.screenTrack;if(!CALL.cam)return null;if(CALL.fx&&CALL.fx.outTrack)return CALL.fx.outTrack;return camTrack()}
function pushVideo(){if(CALL&&CALL.vv)CALL.vv.sender.replaceTrack(outVideo()).catch(()=>{});renderCall()}
async function onCallMsg(m){
  if(m.t==='call-incoming'){
    if(CALL||VC||GC){wsSend({t:'call-reject',callId:m.callId});return}
    S.users[m.from.id]=Object.assign(S.users[m.from.id]||{},m.from);
    CALL={id:m.callId,chat:m.chat,peer:S.users[m.from.id],kind:m.kind,dir:'in',state:'ringing',mic:true,cam:false,screen:false,remote:new MediaStream(),pending:[],rs:{cam:m.kind==='video',screen:false,mic:true},q:'good',fxs:fxState()};
    renderCall();ring('in');desktopAttention();
    if(S.callAct&&S.callAct.id===m.callId){const a=S.callAct;S.callAct=null;if(a.answer){acceptCall();return}}
    notify(nm(S.users[m.from.id]),m.kind==='video'?'Входящий видеозвонок':'Входящий звонок','call');
    return;
  }
  if(!CALL)return;
  if(m.t==='call-started'){if(CALL.dir==='out'&&!CALL.id&&m.chat===CALL.chat){CALL.id=m.callId;renderCall()}return}
  if(m.t==='call-waiting'||m.t==='call-reached'){if(m.callId===CALL.id){CALL.away=m.t==='call-waiting';renderCall()}return}
  if(m.callId!==CALL.id)return;
  if(m.t==='call-accepted'){
    stopRing();CALL.state='connecting';renderCall();
    await makePC();attachLocal();
    const offer=await mkOffer(CALL.pc);await setLocal(CALL.pc,offer);
    wsSend({t:'rtc',callId:CALL.id,data:{sdp:CALL.pc.localDescription.toJSON()}});return;
  }
  if(m.t==='call-end'){
    const why={rejected:'Звонок отклонён',busy:'Абонент занят',offline:'Абонент не в сети',timeout:'Абонент не ответил',cancelled:'Звонок отменён',elsewhere:'Ответили на другом устройстве'}[m.reason];
    if(why&&!(m.reason==='hangup'))toast(why);else if(CALL.state==='active')toast('Звонок завершён');
    cleanupCall();return;
  }
  if(m.t==='rtc'){
    const d=m.data,pc=CALL.pc;if(!pc)return;
    try{
      if(d.sdp){
        await pc.setRemoteDescription(d.sdp);
        if(d.sdp.type==='offer'){attachLocal();const ans=await mkAnswer(pc);await setLocal(pc,ans);wsSend({t:'rtc',callId:CALL.id,data:{sdp:pc.localDescription.toJSON()}})}
        else CALL.negotiated=true;
        for(const c of CALL.pending.splice(0))await pc.addIceCandidate(c).catch(()=>{});
      }else if(d.cand){
        if(pc.remoteDescription)await pc.addIceCandidate(d.cand).catch(()=>{});else CALL.pending.push(d.cand);
      }else if(d.restart){if(CALL.dir==='out'){try{pc.restartIce()}catch(e){}}}
      else if(d.state){CALL.rs=Object.assign(CALL.rs,d.state);renderCall()}
      else if(d.pad)padHeard(CALL.peer&&CALL.peer.id,d.pad);
    }catch(e){console.error(e)}
  }
}
function sendState(){if(CALL&&CALL.id)wsSend({t:'rtc',callId:CALL.id,data:{state:{cam:CALL.cam,screen:CALL.screen,mic:CALL.mic}}})}
function hangup(silent){
  if(!CALL)return;
  if(CALL.id)wsSend({t:CALL.state==='ringing'?'call-reject':'call-end',callId:CALL.id});
  cleanupCall();
}
function cleanupCall(){SPK.nodes.forEach(x=>{try{x.n.disconnect()}catch(e){}});SPK.nodes.clear();
  stopRing();
  if(!CALL)return;
  clearInterval(CALL.timer);clearInterval(CALL.statT);clearTimeout(CALL.discT);clearTimeout(CALL.failT);clearTimeout(CALL.idleT);
  try{CALL.pc&&CALL.pc.close()}catch(e){}
  if(CALL.fx)CALL.fx.stop();
  [CALL.local,CALL.screenStream].forEach(s=>s&&s.getTracks().forEach(t=>t.stop()));
  CALL=null;const el=$('#callEl');if(el)el.remove();const mc=$('#miniCall');if(mc)mc.remove();
  if($('.fx-panel'))closeLayer();
  if(S.tab==='calls'){S.calls=null;renderSide()}
}
function startTimer(){clearInterval(CALL.timer);CALL.timer=setInterval(()=>{if(CALL&&CALL.started){const s=Math.floor((Date.now()-CALL.started)/1000),t=`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;document.querySelectorAll('.ctime').forEach(e=>e.textContent=t)}},1000)}
function toggleMic(){if(!CALL||!CALL.local)return;CALL.mic=!CALL.mic;CALL.local.getAudioTracks().forEach(t=>t.enabled=CALL.mic);sendState();renderCall()}
async function toggleCam(){
  if(!CALL||!CALL.local)return;
  if(CALL.cam){CALL.local.getVideoTracks().forEach(t=>{t.stop();CALL.local.removeTrack(t)});CALL.cam=false;if(CALL.fx){CALL.fx.stop();CALL.fx=null}}
  else{
    try{const s=await navigator.mediaDevices.getUserMedia({video:camC(CALL.facing)});const t=s.getVideoTracks()[0];if('contentHint' in t)t.contentHint='motion';CALL.local.addTrack(t);CALL.cam=true;await rebuildFx()}
    catch(e){toast('Не удалось включить камеру');return}
  }
  sendState();pushVideo();
}
/* front or back camera. Many phones cannot keep two cameras open, so the old one is released first (before());
   if the phone does not understand "back camera", it is found in the list of cameras by name or order. */
/* ---------- opening the front or back camera ----------
   Some phones hand back the same camera when asked for the other one, so every result is checked:
   it must really face the asked way (or be a different camera than before); otherwise the next camera is tried.
   Which camera is front and which is back is remembered once found. */
const CAMS={user:'',environment:''};
const BACK_RE=/back|rear|environment|задн|тыл|основн/i,FRONT_RE=/front|user|фронт|передн|selfie|face/i;
function camFacing(t){try{const s=t.getSettings();if(s.facingMode)return s.facingMode==='user'?'user':'environment';}catch(e){}
  const l=(t&&t.label)||'';return FRONT_RE.test(l)?'user':BACK_RE.test(l)?'environment':''}
async function openCam(facing,size,before,prevId){
  const md=navigator.mediaDevices,base=Object.assign({},size||camC());delete base.facingMode;delete base.deviceId;
  if(before)before();
  await new Promise(r=>setTimeout(r,60)); /* some phones need a moment after the old camera is released */
  const good=s=>{const t=s.getVideoTracks()[0];if(!t)return false;const f=camFacing(t),id=t.getSettings().deviceId;
    if(f&&f!==facing)return false;if(!f&&prevId&&id===prevId)return false;return true};
  const tryGet=async c=>{const s=await md.getUserMedia({video:Object.assign({},base,c)});if(good(s)){const t=s.getVideoTracks()[0];CAMS[facing]=t.getSettings().deviceId||CAMS[facing];return s}s.getTracks().forEach(t=>t.stop());throw new Error('wrong camera')};
  const tries=[];
  if(CAMS[facing])tries.push(()=>tryGet({deviceId:{exact:CAMS[facing]}}));
  tries.push(()=>tryGet({facingMode:{exact:facing}}));
  tries.push(async()=>{
    const ds=(await md.enumerateDevices()).filter(d=>d.kind==='videoinput');if(!ds.length)throw new Error('no camera');
    const want=facing==='user'?FRONT_RE:BACK_RE,not=facing==='user'?BACK_RE:FRONT_RE;
    const order=[...ds.filter(d=>want.test(d.label)),...ds.filter(d=>!want.test(d.label)&&!not.test(d.label)&&d.deviceId!==prevId),...ds.filter(d=>d.deviceId!==prevId)];
    let err;for(const d of [...new Set(order)]){try{return await tryGet({deviceId:{exact:d.deviceId}})}catch(e){err=e}}
    throw err||new Error('no camera');
  });
  tries.push(()=>md.getUserMedia({video:Object.assign({},base,{facingMode:facing})}));
  let err;for(const t of tries){try{return await t()}catch(e){err=e;if(e.name==='NotAllowedError')break}}
  throw err;
}
const curCamId=stream=>{const t=stream&&stream.getVideoTracks()[0];try{return t?t.getSettings().deviceId:''}catch(e){return ''}};
async function flipCam(){
  if(!CALL||!CALL.cam)return;const to=CALL.facing==='environment'?'user':'environment';
  try{
    const prev=curCamId(CALL.local);
    const s=await openCam(to,camC(),()=>{if(CALL.fx){CALL.fx.stop();CALL.fx=null}CALL.local.getVideoTracks().forEach(o=>{o.stop();CALL.local.removeTrack(o)})},prev);
    const t=s.getVideoTracks()[0];if('contentHint' in t)t.contentHint='motion';CALL.facing=camFacing(t)||to;
    CALL.local=new MediaStream([...CALL.local.getAudioTracks(),t]);await rebuildFx();pushVideo();renderCall();
  }catch(e){toast('Не удалось переключить камеру');try{const s=await openCam(CALL.facing||'user');CALL.local.addTrack(s.getVideoTracks()[0]);await rebuildFx();pushVideo()}catch(e2){CALL.cam=false;sendState();pushVideo()}}
}
/* masks in calls: the camera goes through the effect canvas only while a mask or filter is on */
/* ---------- camera effects (masks, filters, backgrounds) ----------
   The engine (fx.js + the face tracker) is loaded only the first time someone opens effects. */
const fxState=()=>({mask:'none',filter:'none',bg:'none',beauty:false,tab:'m'});
const fxOn=st=>!!st&&(st.mask!=='none'||st.filter!=='none'||st.bg!=='none'||st.beauty);
function loadScript(src){return new Promise((ok,bad)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=()=>bad(new Error('Не удалось загрузить маски. Проверь интернет.'));document.head.appendChild(s)})}
let fxLib=null;
function loadFxLib(){
  if(window.MFX)return Promise.resolve(window.MFX);
  return fxLib||(fxLib=(async()=>{
    if(!window.FACEGEO)await loadScript('/vendor/mp/facegeo.js');
    await loadScript('/fx.js?v='+(MY_V||Date.now()));
    if(!window.MFX)throw new Error('Не удалось загрузить маски');
    window.MFX.onStatus(()=>document.querySelectorAll('.fx-note').forEach(e=>e.outerHTML=fxNoteHTML()));
    return window.MFX;
  })().catch(e=>{fxLib=null;throw e}));
}
/* the effects strip, shared by calls, the story camera and the editor; a: the click attribute of that screen */
let fxNoteFor=null;
function fxNoteHTML(){
  const M=window.MFX,st=fxNoteFor&&fxNoteFor.st,fx=fxNoteFor&&fxNoteFor.fx&&fxNoteFor.fx();if(!M||!st)return '<div class="fx-note"></div>';
  const cur=M.MASKS.find(m=>m.id===st.mask),need=st.mask!=='none'||st.beauty||st.bg!=='none';
  let t='';
  if(need&&M.status()==='loading')t='<i class="spin"></i>Загружаем маски… это нужно только один раз';
  else if(need&&M.status()==='error')t='Маски не загрузились. Проверь интернет и попробуй ещё раз';
  else if(fx&&!fx.ok)t='Этот телефон не поддерживает эффекты';
  else if((st.mask!=='none'||st.beauty)&&fx&&!fx.face&&M.status()==='ready')t='Покажи лицо в камеру 🙂';
  else if(cur&&cur.hint&&st.tab==='m')t=esc(cur.hint)+' 😉';
  return `<div class="fx-note ${t?'on':''}">${t}</div>`;
}
/* the hint under the masks: changed only when its text changes (no needless page work every 0.7 s) */
setInterval(()=>{if(document.hidden||!fxNoteFor)return;const n=document.querySelector('.fx-note');if(!n)return;const h=fxNoteHTML();if(n.outerHTML!==h)n.outerHTML=h},700);
function fxStripHTML(M,st,a){
  const it=(on,k,v,icon,n)=>`<button class="fx-it ${on?'on':''}" ${a}="fx" data-${k}="${v}">${icon}<small>${esc(n)}</small></button>`;
  let row;
  if(st.tab==='f')row=it(st.beauty,'beauty','1','<span class="fx-em">✨</span>','Бьюти')+M.FILTERS.map(f=>it(st.filter===f.id,'f',f.id,`<span class="fx-sw fl-${f.id}"></span>`,f.n)).join('');
  else if(st.tab==='b')row=M.BGS.map(b=>it(st.bg===b.id,'b',b.id,`<span class="fx-em">${b.e}</span>`,b.n)).join('')+it(st.bg==='photo','b','photo',`<span class="fx-em">${ic('image')}</span>`,'Своё фото');
  else row=M.MASKS.map(m=>it(st.mask===m.id,'m',m.id,`<span class="fx-em">${m.e}</span>`,m.n)).join('');
  return `${fxNoteHTML()}<div class="seg fx-tabs">${[['m','Маски'],['f','Фильтры'],['b','Фон']].map(([k,n])=>`<button class="${(st.tab||'m')===k?'on':''}" ${a}="tab" data-v="${k}">${n}</button>`).join('')}</div><div class="fx-row" data-tab="${st.tab}">${row}</div>`;
}
/* redraw a strip but keep its scroll position */
function fxRedraw(el,html){const r=el.querySelector('.fx-row'),x=r&&r.dataset.tab,l=r?r.scrollLeft:0;el.innerHTML=html;const n=el.querySelector('.fx-row');if(n&&n.dataset.tab===x)n.scrollLeft=l}
/* a tap in the strip; returns a promise of the gallery photo when "Своё фото" was picked */
function fxTap(st,b){
  const d=b.dataset;
  if(d.m)st.mask=d.m;if(d.f)st.filter=d.f;if(d.beauty)st.beauty=!st.beauty;
  if(d.b==='photo')return new Promise(ok=>pickImage(async f=>{try{const img=await loadImg(f);st.bg='photo';ok(img)}catch(e){toast(e.message);ok(null)}}));
  if(d.b)st.bg=d.b;
  return null;
}
async function rebuildFx(){
  if(!CALL)return;
  if(CALL.fx){CALL.fx.stop();CALL.fx=null}
  const t=camTrack();
  if(!t||!fxOn(CALL.fxs))return;
  const M=await loadFxLib();if(!CALL)return;
  const fx=new M.FX(t,{mirror:false});
  if(!fx.out){fx.stop();toast('Этот браузер не умеет маски в звонке');CALL.fxs=fxState();return}
  const st=CALL.fxs;fx.set(st.mask,st.filter,st.bg==='photo'?'none':st.bg,st.beauty);if(st.bg==='photo'&&CALL.bgImg)fx.setBgImage(CALL.bgImg);CALL.fx=fx;
}
async function setCallFx(b){
  if(!CALL)return;
  const st=CALL.fxs,photo=fxTap(st,b);if(photo){const img=await photo;if(!img||!CALL)return;CALL.bgImg=img}
  if(!CALL.cam){await toggleCam();if(!CALL||!CALL.cam)return}
  if(CALL.fx&&CALL.fx.track===camTrack()&&fxOn(st)){CALL.fx.set(st.mask,st.filter,st.bg==='photo'?null:st.bg,st.beauty);if(st.bg==='photo'&&b.dataset.b==='photo')CALL.fx.setBgImage(CALL.bgImg)}
  else{try{await rebuildFx()}catch(e){toast(e.message)}}
  pushVideo();
}
async function callFxSheet(){
  let M;try{M=await loadFxLib()}catch(e){toast(e.message);return}
  if(!CALL)return;
  fxNoteFor={st:CALL.fxs,fx:()=>CALL&&CALL.fx};
  const L=$('#layer');
  L.innerHTML=`<div class="scrim clear" data-act="closemenu"></div><div class="fx-panel glass" id="cfxp"></div>`;
  const draw=()=>{const el=$('#cfxp');if(!CALL||!el){return}fxRedraw(el,fxStripHTML(M,CALL.fxs,'data-act="cfx" data-x'))};
  S.fxDraw=draw;draw();
}
/* ---------- screen sharing (any call): the whole screen or one app ----------
   In the computer app: our own list of screens and windows with previews.
   In a browser: the browser's own choice of tab / window / whole screen. */
const canShare=()=>!!(navigator.mediaDevices&&navigator.mediaDevices.getDisplayMedia)&&!/iP(hone|ad|od)/.test(navigator.userAgent);
function pickSource(){
  return new Promise(async(ok)=>{
    let list=[];try{list=await window.mnDesktop.sources()}catch(e){}
    if(!list.length){ok(null);return}
    const card=x=>`<button class="src" data-act="srcpick" data-id="${esc(x.id)}">${x.thumb?`<img decoding="async" src="${x.thumb}" alt="">`:'<span class="nothumb"></span>'}<span class="srcn">${x.icon?`<img decoding="async" class="srci" src="${x.icon}" alt="">`:''}${esc(x.screen?(x.name.replace(/^Screen\s*/i,'Экран ')||'Весь экран'):x.name)}</span></button>`;
    S.srcPick=id=>{S.srcPick=null;closeLayer();ok(id)};
    sheet(`<h2>Что показать?</h2>
      <div class="section-t">Весь экран</div><div class="srcs">${list.filter(x=>x.screen).map(card).join('')}</div>
      ${list.some(x=>!x.screen)?`<div class="section-t">Окно приложения</div><div class="srcs">${list.filter(x=>!x.screen).map(card).join('')}</div>`:''}
      <div class="btns"><button class="gbtn" data-act="srccancel">Отмена</button></div>`);
  });
}
async function captureScreen(){
  if(!canShare()){toast('На этом устройстве браузер не умеет показывать экран. Попробуйте с компьютера');return null}
  try{
    if(window.mnDesktop&&window.mnDesktop.sources){const id=await pickSource();if(!id)return null;window.mnDesktop.choose(id)}
    const s=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:{ideal:30,max:30},width:{ideal:1920,max:2560},height:{ideal:1080,max:1440}},audio:false,selfBrowserSurface:'exclude',surfaceSwitching:'include',preferCurrentTab:false});
    const t=s.getVideoTracks()[0];if(t&&'contentHint' in t)t.contentHint='detail';
    return s;
  }catch(e){if(e.name!=='NotAllowedError'&&e.name!=='AbortError')toast('Демонстрация экрана недоступна');return null}
}
async function toggleScreen(){
  if(!CALL||!CALL.vv)return;
  if(CALL.screen){stopScreen();return}
  try{
    const s=await captureScreen();if(!s||!CALL)return;
    const t=s.getVideoTracks()[0];
    CALL.screenStream=s;CALL.screenTrack=t;CALL.screen=true;
    await CALL.vv.sender.replaceTrack(t);tuneSenders();
    t.onended=()=>stopScreen();
    sendState();renderCall();
  }catch(e){if(e.name!=='NotAllowedError')toast('Демонстрация экрана недоступна')}
}
function stopScreen(){
  if(!CALL||!CALL.screen)return;
  CALL.screenStream.getTracks().forEach(t=>t.stop());CALL.screen=false;CALL.screenStream=CALL.screenTrack=null;
  tuneSenders();sendState();pushVideo();
}
function attachRemote(){
  const v=$('#rv'),a=$('#ra');
  if(a&&a.srcObject!==CALL.remote){a.srcObject=CALL.remote;a.play().catch(()=>{});setTimeout(applySpeaker,200)}
  if(v&&v.srcObject!==CALL.remote){v.srcObject=CALL.remote;v.play().catch(()=>{})}
}
function renderCall(){
  if(!CALL)return;queueSync();spkWatch();
  let el=$('#callEl');
  if(CALL.min){if(el)el.style.display='none';renderMini();return}
  const mc=$('#miniCall');if(mc)mc.remove();
  if(!el){el=document.createElement('div');el.id='callEl';el.className='call';document.body.appendChild(el);
    el.addEventListener('pointermove',wake);el.addEventListener('pointerdown',wake)}
  el.style.display='';
  const p=CALL.peer||{},st=CALL.state,remoteVid=st==='active'&&(CALL.rs.cam||CALL.rs.screen);
  const label={calling:CALL.id?(CALL.away?'Не в сети · отправили звонок на телефон…':'Вызов…'):'Подключаемся…',ringing:CALL.kind==='video'?'Входящий видеозвонок':'Входящий звонок',connecting:'Соединение…',active:''}[st];
  el.classList.toggle('incoming',st==='ringing');
  const btn=(act,icon,cls,lb,title)=>`<button class="cbtn ${cls||''}" data-act="${act}" aria-label="${title||lb}" title="${title||lb}">${ic(icon)}${lb?`<span class="lb">${lb}</span>`:''}</button>`;
  const fxIsOn=fxOn(CALL.fxs);
  const controls=st==='ringing'
    ?btn('c-reject','end','end','Отклонить')+btn('c-accept',CALL.kind==='video'?'video':'phone','acc','Принять')
    :btn('c-mic',CALL.mic?'mic':'micOff',CALL.mic?'':'off','',CALL.mic?'Выключить микрофон':'Включить микрофон')+
     btn('c-cam',CALL.cam?'video':'videoOff',CALL.cam?'':'off','',CALL.cam?'Выключить камеру':'Включить камеру')+
     btn('c-spk',SPK.loud?'vol':'vol',SPK.loud?'on':'','',SPK.loud?'Громкая связь включена':'Динамик и громкая связь')+
     btn('c-fx','mask',fxIsOn?'on':'','','Маски и фильтры')+
     btn('c-pad','pad','','','Саундпад — смешные звуки')+
     (touch&&CALL.cam?btn('c-flip','flip','','','Сменить камеру'):'')+
     (canShare()?btn('c-screen','screen',CALL.screen?'on':'','',CALL.screen?'Остановить демонстрацию':'Демонстрация экрана'):'')+
     (st==='active'?btn('c-pop','pip','','','Окно поверх других приложений'):'')+
     btn('c-min','min','','','Свернуть')+
     btn('c-end','end','end','','Завершить');
  /* keep the <video> elements alive between renders so the picture does not blink */
  if(!$('#rv')){el.innerHTML=`<div class="bg grad" id="cbg"></div><video id="rv" class="remote" autoplay playsinline muted></video><audio id="ra" autoplay></audio>
      <div class="local" id="lv"><video autoplay playsinline muted></video></div><div id="cui"></div>`;
    dragPiP($('#lv'))}
  const rv=$('#rv');rv.style.display=remoteVid?'':'none';rv.classList.toggle('cover',!CALL.rs.screen);
  attachRemote();
  const lv=$('#lv'),showLocal=(CALL.cam||CALL.screen)&&CALL.local;
  lv.style.display=showLocal?'':'none';lv.classList.toggle('screen',CALL.screen);lv.classList.toggle('back',CALL.facing==='environment');lv.classList.toggle('wide',CALL.screen);
  const lvv=lv.querySelector('video'),src=CALL.screen?CALL.screenStream:CALL.fx&&CALL.fx.out?CALL.fx.out:CALL.local;
  if(showLocal&&lvv.srcObject!==src){lvv.srcObject=src;lvv.play().catch(()=>{})}
  const bg=$('#cbg');if(p.avatar){bg.className='bg';bg.style.backgroundImage=`url("${p.avatar}")`}
  $('#cui').innerHTML=`${st==='active'?`<div class="top glass pill">${avatar(p,'xs',false)}<b>${esc(nm(p))}</b><span class="ctime">00:00</span><span id="cq" class="cq ${CALL.q}" title="${qText()}"><i></i><i></i><i></i></span>${CALL.rs.mic?'':ic('micOff')}</div>`:''}
    ${CALL.reconnecting&&st==='active'?`<div class="tag-screen glass pill recon">Восстанавливаем связь…</div>`:''}
    ${CALL.rs.screen&&st==='active'&&!CALL.reconnecting?`<div class="tag-screen glass pill">${ic('screen')} ${esc(nm(p))} показывает экран</div>`:''}
    ${CALL.screen?`<div class="tag-screen glass pill" style="top:auto;bottom:calc(120px + var(--safe-b))">${ic('screen')} Вы показываете экран</div>`:''}
    ${!remoteVid?`<div class="center ${st!=='active'?'ring':''}">${avatar(p,'xl',false)}<h2>${esc(nm(p))}</h2><div class="st">${label||(st==='active'?'<span class="ctime">00:00</span>':'')}</div></div>`:''}
    <div class="bar glass pill">${controls}</div>`;
  if(st==='active')startTimer();
  el.classList.remove('idle');idle();
}
function wake(){const el=$('#callEl');if(el){el.classList.remove('idle');idle()}}
function idle(){if(!CALL)return;clearTimeout(CALL.idleT);CALL.idleT=setTimeout(()=>{const el=$('#callEl');if(el&&CALL&&CALL.state==='active'&&(CALL.rs.cam||CALL.rs.screen)&&!$('.fx-panel'))el.classList.add('idle')},4000)}
function renderMini(){
  let mc=$('#miniCall');
  if(!mc){mc=document.createElement('button');mc.id='miniCall';mc.className='mini-call glass pill';mc.dataset.act='c-max';document.body.appendChild(mc)}
  mc.innerHTML=`${avatar(CALL.peer,'s',false)}<span style="text-align:left"><b>${esc(nm(CALL.peer))}</b><br><small class="ctime" style="color:var(--good)">в звонке</small></span>`;
}
function dragPiP(el){
  let sx,sy,ox,oy,on=false;
  el.addEventListener('pointerdown',e=>{on=true;el.setPointerCapture(e.pointerId);const r=el.getBoundingClientRect();sx=e.clientX;sy=e.clientY;ox=r.left;oy=r.top});
  el.addEventListener('pointermove',e=>{if(!on)return;const w=el.offsetWidth,h=el.offsetHeight;
    el.style.left=Math.max(8,Math.min(innerWidth-w-8,ox+e.clientX-sx))+'px';el.style.top=Math.max(8,Math.min(innerHeight-h-8,oy+e.clientY-sy))+'px';el.style.right='auto'});
  el.addEventListener('pointerup',()=>{on=false});
}
addEventListener('beforeunload',e=>{if(CALL&&CALL.state==='active'){e.preventDefault();e.returnValue=''}});
addEventListener('pagehide',()=>{if(CALL)hangup()});

/* =================================================================== SERVERS */
function serverUnread(g){return g.channels.reduce((n,ch)=>n+((S.chats[ch.id]||{}).unread||0),0)}
function renderRail(){
  const el=$('#rail');if(!el)return;
  const homeUnread=Object.values(S.chats).filter(c=>c.type!=='channel').reduce((n,c)=>n+(c.unread||0),0);
  const list=Object.values(S.servers).sort((a,b)=>a.name.localeCompare(b.name));
  el.innerHTML=`<button class="rbtn home ${S.view==='home'?'on':''}" data-act="view" data-v="home" title="Личные сообщения" aria-label="Личные сообщения">${ic('home')}${homeUnread?`<span class="badge">${homeUnread>99?'99+':homeUnread}</span>`:''}</button>
    <span class="sep"></span>
    ${list.map(g=>{const u=serverUnread(g),inV=VC&&VC.sid===g.id;
      return `<button class="rbtn ${S.view===g.id?'on':''} ${u?'unread':''}" style="--c:${esc(g.color)}" data-act="view" data-v="${g.id}" title="${esc(g.name)}" aria-label="${esc(g.name)}">${g.avatar?`<img decoding="async" class="srv-img" src="${esc(g.avatar)}" alt="">`:esc(initials(g.name))}${inV?`<span class="vdot">${ic('vol')}</span>`:''}</button>`}).join('')}
    <button class="rbtn add" data-act="addserver" title="Создать или войти на сервер" aria-label="Добавить сервер">${ic('plus')}</button>`;
}
function serverSideHTML(g){
  const own=g.owner===S.me.id;
  const text=g.channels.filter(c=>c.type==='text'),voice=g.channels.filter(c=>c.type==='voice');
  return `<div class="srv-h"><h1>${esc(g.name)}</h1>
      <button class="gbtn ic" data-act="invite" title="Пригласить" aria-label="Пригласить">${ic('link')}</button>
      <button class="gbtn ic" data-act="srvmenu" title="Настройки сервера" aria-label="Настройки сервера">${ic('gear')}</button></div>
    <div class="list">
      <div class="ch-group"><span>Текстовые каналы</span>${own?`<button data-act="newch" data-k="text" title="Создать текстовый канал" aria-label="Создать текстовый канал">${ic('plus')}</button>`:''}</div>
      ${text.map(ch=>{const c=S.chats[ch.id]||{};return `<button class="ch ${S.cur===ch.id?'on':''} ${c.unread?'unread':''}" data-act="open" data-id="${ch.id}"><span class="hash">#</span><span class="nm">${esc(ch.name)}</span>${c.pet?fire(c):''}${c.unread?`<span class="badge">${c.unread>99?'99+':c.unread}</span>`:''}</button>`}).join('')}
      <div class="ch-group"><span>Голосовые каналы</span>${own?`<button data-act="newch" data-k="voice" title="Создать голосовой канал" aria-label="Создать голосовой канал">${ic('plus')}</button>`:''}</div>
      ${voice.map(ch=>`<button class="ch ${VC&&VC.cid===ch.id?'on':''}" data-act="vjoin" data-id="${ch.id}" data-s="${g.id}">${ic('vol')}<span class="nm">${esc(ch.name)}</span>${ch.users&&ch.users.length?`<small style="color:var(--fg3)">${ch.users.length}</small>`:''}</button>
        ${ch.users&&ch.users.length?`<div class="vusers">${ch.users.map(v=>{const u=S.users[v.id]||{name:'?'};return `<div class="vu ${VC&&VC.speaking&&VC.speaking.has(v.id)?'speaking':''}" data-vu="${v.id}">${avatar(u,'xs',false)}<span>${esc(nm(u))}</span><span class="st">${v.screen?`<button class="live" data-act="vwatch" data-id="${v.id}" title="Смотреть экран">${v.id===S.me.id?'ЭКРАН':'СМОТРЕТЬ'}</button>`:''}${v.mute?ic('micOff'):''}${v.deaf?ic('deafOff'):''}</span></div>`}).join('')}</div>`:''}`).join('')}
    </div>`;
}
function voicePanelHTML(){
  if(!VC)return '';
  const g=S.servers[VC.sid],ch=g&&g.channels.find(x=>x.id===VC.cid);
  return `<div class="vpanel glass"><span class="mid"><b>${VC.state==='on'?'Голосовая связь':'Подключение…'}</b><small>${esc(ch?ch.name:'')} · ${esc(g?g.name:'')}</small></span>
    <button class="gbtn ic ${VC.mute?'off':''}" data-act="vmute" title="${VC.mute?'Включить микрофон':'Выключить микрофон'}" aria-label="Микрофон">${ic(VC.mute?'micOff':'mic')}</button>
    <button class="gbtn ic" data-act="c-pad" title="Саундпад — смешные звуки" aria-label="Саундпад">${ic('pad')}</button>
    <button class="gbtn ic ${VC.deaf?'off':''}" data-act="vdeaf" title="${VC.deaf?'Включить звук':'Выключить звук'}" aria-label="Звук">${ic(VC.deaf?'deafOff':'deaf')}</button>
    ${canShare()?`<button class="gbtn ic ${VC.screen?'on':''}" data-act="vscreen" title="${VC.screen?'Остановить демонстрацию':'Показать экран'}" aria-label="Демонстрация экрана">${ic('screen')}</button>`:''}
    <button class="gbtn ic danger" data-act="vleave" title="Отключиться" aria-label="Отключиться">${ic('end')}</button></div>`;
}
function addServerSheet(){
  sheet(`<h2>Сервер</h2><p class="sub">Создай свой сервер с каналами или войди по приглашению</p>
    <label class="field"><span>Название нового сервера</span><input class="input" id="sname" maxlength="40" placeholder="Например, Друзья"></label>
    <div class="btns" style="margin-top:0"><button class="gbtn primary" data-act="mkserver">Создать сервер</button></div>
    <div class="section-t" style="padding-left:4px;margin-top:14px">Или войти по приглашению</div>
    <label class="field"><span>Ссылка или код приглашения</span><input class="input" id="scode" placeholder="https://…/#join/abc123" autocomplete="off" spellcheck="false"></label>
    <div class="btns" style="margin-top:0"><button class="gbtn" data-act="joincode">Войти</button></div>`);
  setTimeout(()=>{const i=$('#sname');if(i&&!touch)i.focus()},50);
}
async function joinSheet(code){
  try{
    const r=await api('/api/servers/preview?code='+encodeURIComponent(code));
    if(r.joined){S.view=r.id;renderSide();return}
    sheet(`<div class="join-card"><div class="rbtn" style="--c:${esc(r.color)}">${esc(initials(r.name))}</div><h2>${esc(r.name)}</h2><p class="sub">${r.members} участник(ов) · тебя пригласили на сервер</p>
      <div class="btns" style="justify-content:center"><button class="gbtn" data-act="closemenu">Не сейчас</button><button class="gbtn primary" data-act="dojoin" data-code="${esc(code)}">Присоединиться</button></div></div>`);
  }catch(e){toast(e.message)}
}
const inviteLink=g=>`${location.origin}/#join/${g.invite}`;
function inviteSheet(g){
  if(g.owner!==S.me.id){sheet(`<h2>Пригласить</h2><p class="sub">Попроси создателя сервера прислать ссылку-приглашение.</p><div class="btns"><button class="gbtn" data-act="closemenu">Понятно</button></div>`);return}
  sheet(`<h2>Пригласить на «${esc(g.name)}»</h2><p class="sub">Отправь ссылку друзьям. По ней они попадут на сервер.</p>
    <div class="invite"><input class="input" readonly value="${esc(inviteLink(g))}" id="inv"><button class="gbtn primary" data-act="copyinv">${ic('copy')}Копировать</button></div>
    ${navigator.share?`<div class="btns"><button class="gbtn" data-act="shareinv">Поделиться…</button></div>`:''}`);
}
function serverSheet(g){
  const own=g.owner===S.me.id;
  sheet(`<div class="join-card"><div class="rbtn" style="--c:${esc(g.color)}">${g.avatar?`<img decoding="async" class="srv-img" src="${esc(g.avatar)}" alt="">`:esc(initials(g.name))}</div>${own?`<div class="btns" style="justify-content:center;margin-top:8px"><button class="gbtn" data-act="srvava" data-id="${g.id}">${ic('image')}Сменить фото сервера</button>${g.avatar?`<button class="gbtn" data-act="srvavadel" data-id="${g.id}">Убрать</button>`:''}</div>`:''}</div>
    ${own?`<label class="field"><span>Название</span><input class="input" id="srvname" maxlength="40" value="${esc(g.name)}"></label>`:`<h2 style="text-align:center">${esc(g.name)}</h2>`}
    ${own?`<div class="section-t" style="padding-left:4px">Каналы</div>${g.channels.map(ch=>`<div class="set-row"><span class="mid">${ch.type==='voice'?'🔊 ':'# '}${esc(ch.name)}</span><button class="gbtn ic" data-act="delch" data-id="${ch.id}" title="Удалить канал" aria-label="Удалить канал">${ic('trash')}</button></div>`).join('')}`:''}
    <div class="section-t" style="padding-left:4px">Участники · ${g.members.length}</div>
    <div>${g.members.map(i=>S.users[i]).filter(Boolean).map(u=>`<div class="row">${avatar(u,'s')}<span class="mid"><span class="top"><span class="nm">${esc(nm(u))}${u.id===g.owner?' <small style="color:var(--fg3)">создатель</small>':''}</span></span><span class="sub"><span class="lm">${esc(seen(u))}</span></span></span>${u.id!==S.me.id?`<button class="gbtn ic" data-act="dm" data-id="${u.id}" title="Написать" aria-label="Написать">${ic('chats')}</button>`:''}</div>`).join('')}</div>
    <div class="btns">${own?`<button class="gbtn" data-act="newinv">Новая ссылка</button><button class="gbtn danger" data-act="delsrv">Удалить сервер</button><button class="gbtn primary" data-act="savesrv">Сохранить</button>`:`<button class="gbtn danger" data-act="leavesrv">Покинуть сервер</button>`}</div>`);
}
function newChannelSheet(type){
  sheet(`<h2>${type==='voice'?'Голосовой канал':'Текстовый канал'}</h2><p class="sub">${type==='voice'?'В голосовом канале можно разговаривать всем вместе, до 8 человек':'Канал для переписки всех участников сервера'}</p>
    <label class="field"><span>Название</span><input class="input" id="chname" maxlength="32" placeholder="${type==='voice'?'Например, Болталка':'например, мемы'}"></label>
    <div class="btns"><button class="gbtn" data-act="closemenu">Отмена</button><button class="gbtn primary" data-act="mkch" data-k="${type}">Создать</button></div>`);
  setTimeout(()=>{const i=$('#chname');if(i&&!touch)i.focus()},50);
}

/* =================================================================== VOICE CHANNELS
   Everyone in a channel is connected to everyone else (mesh), up to 8 people.
   The newcomer calls each person already inside; the server only relays the signals. */
/* ---------- group calls (groups and server channels) ----------
   Everyone connects with everyone (up to 8). Each connection has one sound and one picture slot,
   so turning the camera or the screen on and off only swaps the picture, no reconnecting. */
let GC=null;
const gcName=id=>{const c=S.chats[id];return c?chatName(c):'Звонок'};
async function gcStart(chatId,kind){
  micCtx();
  if(CALL||VC){toast('Сначала заверши другой звонок');return}
  if(GC){if(GC.chat===chatId){GC.min=false;gcRender();return}gcLeave()}
  gcRingClose();stopRing();
  const g=GC={chat:chatId,kind,mic:true,cam:kind==='video',facing:'user',screen:false,peers:new Map(),state:'connecting',min:false,t0:0,tiles:new Map()};
  gcRender();
  try{g.local=await navigator.mediaDevices.getUserMedia({audio:AUDIO,video:g.cam?camC('user'):false})}
  catch(e){
    if(g.cam){try{g.local=await navigator.mediaDevices.getUserMedia({audio:AUDIO});g.cam=false;toast('Камера недоступна — звонок без видео')}catch(e2){}}
    if(!g.local){toast(e.name==='NotAllowedError'?'Нет доступа к микрофону. Разреши его в настройках браузера.':'Не удалось включить микрофон');if(GC===g){GC=null;gcRender()}return}
  }
  g.local=await micWrap(g.local);
  if(GC!==g){g.local.getTracks().forEach(t=>t.stop());return}
  const vt=g.local.getVideoTracks()[0];if(vt&&'contentHint' in vt)vt.contentHint='motion';
  if(!wsSend({t:'gcall',chat:chatId,kind,cam:g.cam,mic:true})){toast('Нет связи');gcLeave(true);return}
  gcRender();
}
/* group calls: the upload is shared between everyone, so with more people each picture is lighter (no freezing) */
function gcTune(){
  if(!GC)return;const n=Math.max(1,GC.peers.size),lite=isLite()||touch;
  const total=GC.screen?(lite?2000e3:5000e3):(lite?1500e3:4000e3),per=Math.max(200e3,Math.min(GC.screen?4000e3:2000e3,total/n));
  GC.peers.forEach(p=>{
    if(p.vs){const q=p.vs.getParameters();if(!q.encodings||!q.encodings.length)q.encodings=[{}];const e=q.encodings[0];
      e.maxBitrate=per;e.maxFramerate=GC.screen?15:(n>3?20:24);e.scaleResolutionDownBy=GC.screen?1:(n>4?2:n>2?1.5:1);q.degradationPreference=GC.screen?'maintain-resolution':'maintain-framerate';p.vs.setParameters(q).catch(()=>{})}
    if(p.as){const q=p.as.getParameters();if(q.encodings&&q.encodings[0]){q.encodings[0].priority='high';q.encodings[0].networkPriority='high';p.as.setParameters(q).catch(()=>{})}}
  });
}
function gcOutVideo(){if(!GC||!GC.local)return null;if(GC.screen&&GC.screenTrack)return GC.screenTrack;return GC.cam?GC.local.getVideoTracks()[0]||null:null}
function gcPush(){if(!GC||!GC.local)return;setTimeout(gcTune,300);const v=gcOutVideo(),a=GC.local.getAudioTracks()[0]||null;GC.peers.forEach(p=>{if(p.vs)p.vs.replaceTrack(v).catch(()=>{});if(p.as)p.as.replaceTrack(a).catch(()=>{})});wsSend({t:'gstate',mic:GC.mic,cam:!!(GC.cam||GC.screen),screen:GC.screen});gcRender()}
/* ---------- getting a call back after the network changes (Wi-Fi ↔ mobile, a lift, a tunnel) ----------
   Group calls and voice channels: the side that made the first offer finds a new path (ICE restart) and sends it;
   the other side asks it to. Starts 1.5 s after the link drops, at once when it fails or the phone switches networks. */
async function peerRecover(p){
  if(!p||!p.pc||p.pc.signalingState==='closed'||p.pc.connectionState==='connected'&&!p.force)return;p.force=false;
  if(Date.now()-(p.recAt||0)<3000)return;p.recAt=Date.now();
  if(!p.off){wsSend({t:p.kind,to:p.uid,data:{restart:1}});return}
  try{if(p.pc.signalingState!=='stable')return;const o=await mkOffer(p.pc,{iceRestart:true});await setLocal(p.pc,o,p.kind==='vrtc'?48:undefined);
    wsSend({t:p.kind,to:p.uid,data:{sdp:p.pc.localDescription.toJSON()}})}catch(e){}
}
function peerWatch(p){const s=p.pc.connectionState;clearTimeout(p.recT);
  if(s==='disconnected')p.recT=setTimeout(()=>peerRecover(p),1500);else if(s==='failed')peerRecover(p);else if(s==='connected')p.recAt=0}
let NET_T=0,NET_TYPE=navigator.connection&&navigator.connection.type;
function netChanged(){clearTimeout(NET_T);NET_T=setTimeout(()=>{
  ICE_AT=0; /* fresh relay addresses for the new network */
  if(CALL&&CALL.pc&&CALL.state==='active'){if(CALL.dir==='out'){try{CALL.pc.restartIce()}catch(e){}}else wsSend({t:'rtc',callId:CALL.id,data:{restart:1}})}
  const all=[].concat(GC?[...GC.peers.values()]:[],VC?[...VC.peers.values()]:[]);all.forEach(p=>{p.force=true;p.recAt=0;peerRecover(p)})},600)}
addEventListener('online',netChanged);
try{navigator.connection&&navigator.connection.addEventListener('change',()=>{const t=navigator.connection.type;if(t&&t!==NET_TYPE){NET_TYPE=t;netChanged()}})}catch(e){}
async function gcPeer(uid,offer){
  const pc=new RTCPeerConnection({iceServers:await iceServers(),bundlePolicy:'max-bundle',iceCandidatePoolSize:2});
  const p={pc,uid,pending:[],stream:new MediaStream(),off:!!offer,kind:'grtc'};GC.peers.set(uid,p);
  if(offer){
    p.as=pc.addTransceiver('audio',{direction:'sendrecv'}).sender;p.vs=pc.addTransceiver('video',{direction:'sendrecv'}).sender;
    p.as.replaceTrack(GC.local.getAudioTracks()[0]||null);p.vs.replaceTrack(gcOutVideo());
  }
  pc.onicecandidate=e=>{if(e.candidate)wsSend({t:'grtc',to:uid,data:{cand:e.candidate.toJSON()}})};
  pc.ontrack=e=>{p.stream.getTracks().filter(t=>t.kind===e.track.kind).forEach(t=>p.stream.removeTrack(t));p.stream.addTrack(e.track);
    if(e.track.kind==='audio'){if(!p.audio){p.audio=document.createElement('audio');p.audio.autoplay=true;p.audio.playsInline=true;document.body.appendChild(p.audio)}p.audio.srcObject=new MediaStream([e.track]);p.audio.play().catch(()=>{});setTimeout(applySpeaker,200)}
    e.track.onunmute=()=>gcRender();gcRender()};
  pc.onconnectionstatechange=()=>{peerWatch(p);if(pc.connectionState==='connected')gcTune();gcRender()};
  if(offer){const o=await mkOffer(pc);await setLocal(pc,o);wsSend({t:'grtc',to:uid,data:{sdp:pc.localDescription.toJSON()}})}
  return p;
}
async function onGroupMsg(m){
  if(m.t==='groom'){
    const c=S.chats[m.chat];if(c){if(m.room)c.gcall=m.room;else delete c.gcall}
    if(!m.room&&GR&&GR.chat===m.chat)gcRingClose();
    if(GC&&GC.chat===m.chat)GC.room=m.room;
    gcBanner();gcRender();renderSide();return;
  }
  if(m.t==='gcall-ring'){
    S.users[m.from.id]=Object.assign(S.users[m.from.id]||{},m.from);
    if(S.gcallAct&&S.gcallAct.chat===m.chat){const a=S.gcallAct;S.gcallAct=null;if(a.answer){gcStart(m.chat,m.kind);return}}
    if(CALL||VC||GC)return;
    gcRing(m);return;
  }
  if(!GC||m.chat!==GC.chat)return;
  if(m.t==='gjoined'){GC.state='on';GC.t0=Date.now();GC.kind=m.kind;beep([523,659,784],.09,.02,.06);for(const uid of m.peers)await gcPeer(uid,true);gcRender();return}
  if(m.t==='gpeer-left'){const p=GC.peers.get(m.user);if(p){gcClosePeer(p);GC.peers.delete(m.user)}gcRender();return}
  if(m.t==='grtc'){
    let p=GC.peers.get(m.from);const d=m.data;
    try{
      if(d.sdp){
        if(!p)p=await gcPeer(m.from,false);
        await p.pc.setRemoteDescription(d.sdp);
        if(d.sdp.type==='offer'){
          p.pc.getTransceivers().forEach(tr=>{tr.direction='sendrecv';const k=tr.receiver.track&&tr.receiver.track.kind;if(k==='audio'&&!p.as){p.as=tr.sender;tr.sender.replaceTrack(GC.local.getAudioTracks()[0]||null)}if(k==='video'&&!p.vs){p.vs=tr.sender;tr.sender.replaceTrack(gcOutVideo())}});
          const a=await mkAnswer(p.pc);await setLocal(p.pc,a);wsSend({t:'grtc',to:m.from,data:{sdp:p.pc.localDescription.toJSON()}});
        }
        for(const c of p.pending.splice(0))await p.pc.addIceCandidate(c).catch(()=>{});
      }else if(d.cand){if(!p)return;if(p.pc.remoteDescription)await p.pc.addIceCandidate(d.cand).catch(()=>{});else p.pending.push(d.cand)}else if(d.restart){if(p)peerRecover(p)}else if(d.pad)padHeard(m.from,d.pad);
    }catch(e){console.error(e)}
  }
}
function gcClosePeer(p){try{p.pc.close()}catch(e){}if(p.audio){p.audio.srcObject=null;p.audio.remove()}}
function gcLeave(silent){
  if(!GC)return;const g=GC;GC=null;SPK.nodes.forEach(x=>{try{x.n.disconnect()}catch(e){}});SPK.nodes.clear();
  wsSend({t:'gleave'});g.peers.forEach(gcClosePeer);
  g.local&&g.local.getTracks().forEach(t=>t.stop());g.screenStream&&g.screenStream.getTracks().forEach(t=>t.stop());
  clearInterval(g.clock);if(!silent)beep([784,523],.09,.02,.05);
  const el=$('#gcall');if(el)el.remove();gcBanner();
}
function gcMic(){if(!GC)return;GC.mic=!GC.mic;GC.local.getAudioTracks().forEach(t=>t.enabled=GC.mic);gcPush()}
async function gcCam(){
  if(!GC)return;
  if(GC.cam){GC.cam=false;GC.local.getVideoTracks().forEach(t=>{t.stop();GC.local.removeTrack(t)});gcPush();return}
  try{const s=await openCam(GC.facing,camC(GC.facing));const t=s.getVideoTracks()[0];if('contentHint' in t)t.contentHint='motion';GC.local.addTrack(t);GC.cam=true;gcPush()}
  catch(e){toast('Не удалось включить камеру')}
}
async function gcFlip(){
  if(!GC||!GC.cam)return;const to=GC.facing==='environment'?'user':'environment';
  try{const prev=curCamId(GC.local);const s=await openCam(to,camC(to),()=>GC.local.getVideoTracks().forEach(t=>{t.stop();GC.local.removeTrack(t)}),prev);const t=s.getVideoTracks()[0];GC.local=new MediaStream([...GC.local.getAudioTracks(),t]);GC.facing=camFacing(t)||to;gcPush()}
  catch(e){toast('Не удалось переключить камеру');try{const s=await openCam(GC.facing);GC.local.addTrack(s.getVideoTracks()[0])}catch(e2){GC.cam=false}gcPush()}
}
async function gcScreen(){
  if(!GC)return;
  if(GC.screen){GC.screenStream.getTracks().forEach(t=>t.stop());GC.screen=false;GC.screenStream=GC.screenTrack=null;gcPush();return}
  try{const s=await captureScreen();if(!s||!GC)return;GC.screenStream=s;GC.screenTrack=s.getVideoTracks()[0];GC.screen=true;GC.screenTrack.onended=()=>{if(GC&&GC.screen)gcScreen()};gcPush()}
  catch(e){if(e.name!=='NotAllowedError')toast('Демонстрация экрана недоступна')}
}
function gcTile(uid){
  let t=GC.tiles.get(uid);
  if(!t){t=document.createElement('div');t.className='gtile';t.innerHTML='<video autoplay playsinline muted></video><div class="gav"></div><div class="glab"></div>';GC.tiles.set(uid,t)}
  return t;
}
function gcRender(){
  let el=$('#gcall');
  if(!GC){if(el)el.remove();return}
  spkWatch();
  if(!el){el=document.createElement('div');el.id='gcall';document.body.appendChild(el);
    el.innerHTML=`<div class="gc-top"><button class="gbtn ic" data-act="gc-min" aria-label="Свернуть">${ic('back')}</button><span class="mid"><b class="gc-name"></b><small class="gc-st"></small></span></div><div class="ggrid"></div><div class="gc-bar glass pill"></div><button class="gc-pill glass pill" data-act="gc-max"></button>`;
    GC.clock=setInterval(()=>{const s=el.querySelector('.gc-st');if(s&&GC&&GC.t0)s.textContent=gcStatus()},1000)}
  el.className='gcall'+(GC.min?' min':'');
  el.querySelector('.gc-name').textContent=gcName(GC.chat);el.querySelector('.gc-st').textContent=gcStatus();
  const room=GC.room&&GC.room.users||[],state=Object.fromEntries(room.map(u=>[u.id,u]));
  const ids=[S.me.id].concat([...GC.peers.keys()]),grid=el.querySelector('.ggrid');
  grid.className='ggrid n'+Math.min(ids.length,8);
  ids.forEach((uid,i)=>{
    const t=gcTile(uid),me=uid===S.me.id,p=GC.peers.get(uid),v=t.querySelector('video'),u=S.users[uid]||{name:'…'};
    const st=me?{mic:GC.mic,cam:GC.cam||GC.screen,screen:GC.screen}:(state[uid]||{mic:true,cam:false});
    const src=me?(GC.screen&&GC.screenStream?GC.screenStream:GC.local):(p&&p.stream);
    if(src&&v.srcObject!==src){v.srcObject=src;v.play().catch(()=>{})}
    const vid=me?!!gcOutVideo():!!(st.cam&&p&&p.stream.getVideoTracks().some(x=>x.readyState==='live'&&!x.muted));
    t.classList.toggle('vid',vid);t.classList.toggle('me',me&&!GC.screen&&GC.facing!=='environment');t.classList.toggle('scr',!!st.screen);
    const av=t.querySelector('.gav');if(av.dataset.u!==uid){av.dataset.u=uid;av.innerHTML=avatar(u,'xl',false)}
    t.querySelector('.glab').innerHTML=`${st.mic===false?ic('micOff'):''}${esc(me?'Вы':nm(u))}${!me&&p&&p.pc.connectionState!=='connected'?' · <i>подключение…</i>':''}`;
    if(grid.children[i]!==t)grid.insertBefore(t,grid.children[i]||null);
  });
  [...grid.children].slice(ids.length).forEach(x=>x.remove());
  GC.tiles.forEach((t,uid)=>{if(!ids.includes(uid))GC.tiles.delete(uid)});
  const canScreen=canShare();
  el.querySelector('.gc-bar').innerHTML=`<button class="cbtn ${GC.mic?'':'off'}" data-act="gc-mic" aria-label="Микрофон">${ic(GC.mic?'mic':'micOff')}</button>
    <button class="cbtn ${GC.cam?'':'off'}" data-act="gc-cam" aria-label="Камера">${ic(GC.cam?'video':'videoOff')}</button>
    ${GC.cam&&touch?`<button class="cbtn" data-act="gc-flip" aria-label="Другая камера">${ic('flip')}</button>`:''}
    ${canScreen?`<button class="cbtn ${GC.screen?'on':''}" data-act="gc-screen" aria-label="Экран">${ic('screen')}</button>`:''}
    <button class="cbtn ${SPK.loud?'on':''}" data-act="c-spk" aria-label="Динамик">${ic('vol')}</button>
    <button class="cbtn" data-act="c-pad" aria-label="Саундпад" title="Саундпад — смешные звуки">${ic('pad')}</button>
    <button class="cbtn" data-act="c-pop" aria-label="Окно поверх" title="Окно поверх других приложений">${ic('pip')}</button>
    <button class="cbtn end" data-act="gc-end" aria-label="Выйти из звонка">${ic('end')}</button>`;
  el.querySelector('.gc-pill').innerHTML=`${ic('phone')}<span>${esc(gcName(GC.chat))} · ${ids.length}</span>`;
}
function gcStatus(){if(!GC)return '';if(GC.state!=='on')return 'Подключение…';const n=1+GC.peers.size,s=Math.round((Date.now()-GC.t0)/1000);return (n<2?'Ждём остальных · ':n+' участ. · ')+clock(s)}
/* "a call is going on" bar inside the chat, for those not in it yet */
function gcBanner(){
  const box=$('#gban');if(!box)return;const c=S.chats[S.cur];
  const r=c&&c.gcall,mine=GC&&GC.chat===S.cur;
  if(!r||mine){box.innerHTML='';return}
  box.innerHTML=`<div class="gban glass pill"><span class="gdot"></span><span class="mid"><b>${r.kind==='video'?'Идёт видеозвонок':'Идёт звонок'}</b><small>${r.users.map(u=>esc(nm(S.users[u.id]||{name:'…'}))).join(', ')}</small></span><button class="gbtn primary" data-act="gcall" data-k="${r.kind}">Войти</button></div>`;
}
/* someone started a call in a group: a ringing screen with "join" and "decline" */
let GR=null;
function gcRing(m){
  gcRingClose();GR={chat:m.chat,kind:m.kind};const u=S.users[m.from.id];
  const el=document.createElement('div');el.id='gring';el.className='gring';
  el.innerHTML=`<div class="gr-card glass">${avatar(u,'xl',false)}<b>${esc(nm(u))}</b><small>${m.kind==='video'?'📹 Групповой видеозвонок':'📞 Групповой звонок'} · ${esc(gcName(m.chat))}</small>
    <div class="gr-btns"><button class="cbtn end" data-act="gr-no" aria-label="Отклонить">${ic('end')}</button><button class="cbtn acc" data-act="gr-yes" aria-label="Присоединиться">${ic(m.kind==='video'?'video':'phone')}</button></div></div>`;
  document.body.appendChild(el);ring('in');desktopAttention();
  notify(nm(u),(m.kind==='video'?'Групповой видеозвонок':'Групповой звонок')+' · '+gcName(m.chat),'gcall');
  GR.t=setTimeout(gcRingClose,40e3);
}
function gcRingClose(){if(!GR)return;clearTimeout(GR.t);GR=null;stopRing();const el=$('#gring');if(el)el.remove()}
/* the computer app: bring the window to the front for an incoming call */
function desktopAttention(){try{window.mnDesktop&&window.mnDesktop.attention()}catch(e){}}
addEventListener('pagehide',()=>{if(GC)wsSend({t:'gleave'})});
let VC=null;
async function voiceJoin(sid,cid){
  micCtx();
  if(CALL){toast('Сначала заверши звонок');return}
  if(VC&&VC.cid===cid)return;
  if(VC)voiceLeave();
  VC={sid,cid,state:'connecting',mute:false,deaf:false,peers:new Map(),speaking:new Set(),t0:Date.now()};
  renderSide();
  try{VC.local=await navigator.mediaDevices.getUserMedia({audio:AUDIO})}
  catch(e){toast(e.name==='NotAllowedError'?'Нет доступа к микрофону. Разреши его в настройках браузера.':'Не удалось включить микрофон');VC=null;renderSide();return}
  if(!VC||VC.cid!==cid)return;
  {const raw=VC.local,w=await micWrap(raw);if(!VC||VC.cid!==cid){w.getTracks().forEach(t=>t.stop());return}VC.local=w}
  watchLevel(S.me.id,VC.local);
  if(!wsSend({t:'vjoin',channel:cid})){toast('Нет связи с сервером');voiceLeave(true);return}
  beep([523,784],.09,.02,.05);
}
function voiceRejoin(){if(VC){const {sid,cid}=VC;VC.peers.forEach(p=>closePeer(p));VC.peers.clear();wsSend({t:'vjoin',channel:cid,mute:VC.mute,deaf:VC.deaf})}}
function voiceLeave(silent){
  if(!VC)return;
  if(!silent)wsSend({t:'vleave'});
  VC.peers.forEach(p=>closePeer(p));
  VC.local&&VC.local.getTracks().forEach(t=>t.stop());VC.screenStream&&VC.screenStream.getTracks().forEach(t=>t.stop());voiceWatch(null);
  clearInterval(VC.levelT);
  VC=null;beep([784,523],.09,.02,.05);renderSide();
}
function closePeer(p){try{p.pc.close()}catch(e){}if(p.audio){p.audio.srcObject=null;p.audio.remove()}}
async function voicePeer(uid,offer){
  const pc=new RTCPeerConnection({iceServers:await iceServers(),bundlePolicy:'max-bundle',iceCandidatePoolSize:2});
  const p={pc,uid,pending:[],audio:null,off:!!offer,kind:'vrtc'};VC.peers.set(uid,p);
  VC.local.getTracks().forEach(t=>pc.addTrack(t,VC.local));
  if(VC.screen&&VC.screenTrack&&offer)p.ss=pc.addTrack(VC.screenTrack,VC.screenStream);
  pc.onicecandidate=e=>{if(e.candidate)wsSend({t:'vrtc',to:uid,data:{cand:e.candidate.toJSON()}})};
  pc.ontrack=e=>{
    if(e.track.kind==='video'){p.video=new MediaStream([e.track]);e.track.onended=e.track.onmute=()=>voiceWatchRefresh();e.track.onunmute=()=>voiceWatchRefresh();voiceWatchRefresh();return}
    if(!p.audio){p.audio=document.createElement('audio');p.audio.autoplay=true;p.audio.playsInline=true;document.body.appendChild(p.audio)}
    const st=e.streams[0]||new MediaStream([e.track]);p.audio.srcObject=st;p.audio.muted=VC.deaf;p.audio.play().catch(()=>{});
    watchLevel(uid,st);
  };
  pc.onconnectionstatechange=()=>{if(pc.connectionState==='connected'&&VC&&VC.state!=='on'){VC.state='on';renderSide()}peerWatch(p)};
  if(offer){const o=await mkOffer(pc);await setLocal(pc,o,48);wsSend({t:'vrtc',to:uid,data:{sdp:pc.localDescription.toJSON()}})}
  return p;
}
async function onVoiceMsg(m){
  if(!VC||m.channel!==VC.cid)return;
  if(m.t==='vjoined'){VC.state=m.peers.length?'connecting':'on';renderSide();for(const uid of m.peers)await voicePeer(uid,true);return}
  if(m.t==='vkicked'){toast('Голосовой канал закрыт');voiceLeave(true);return}
  if(m.t==='vpeer-left'){const p=VC.peers.get(m.user);if(p){closePeer(p);VC.peers.delete(m.user)}VC.speaking.delete(m.user);return}
  if(m.t==='vrtc'){
    let p=VC.peers.get(m.from);const d=m.data;
    try{
      if(d.sdp){
        if(!p)p=await voicePeer(m.from,false);
        await p.pc.setRemoteDescription(d.sdp);
        if(d.sdp.type==='offer'){const a=await mkAnswer(p.pc);await setLocal(p.pc,a,48);wsSend({t:'vrtc',to:m.from,data:{sdp:p.pc.localDescription.toJSON()}});
          /* I'm showing my screen and this person joined later: send it to them too */
          if(VC.screen&&VC.screenTrack&&!p.ss)setTimeout(()=>{if(VC&&VC.screen&&!p.ss){p.ss=p.pc.addTrack(VC.screenTrack,VC.screenStream);voiceRenego(p)}},300)}
        for(const c of p.pending.splice(0))await p.pc.addIceCandidate(c).catch(()=>{});
      }else if(d.cand){if(!p)return;if(p.pc.remoteDescription)await p.pc.addIceCandidate(d.cand).catch(()=>{});else p.pending.push(d.cand)}else if(d.restart){if(p)peerRecover(p)}else if(d.pad)padHeard(m.from,d.pad);
    }catch(e){console.error(e)}
  }
}
/* who is speaking: measure each audio stream's loudness and light up their avatar */
function watchLevel(uid,stream){
  const a=ac();if(!a||!VC)return;
  try{
    const src=a.createMediaStreamSource(stream),an=a.createAnalyser();an.fftSize=512;src.connect(an);
    VC.meters=VC.meters||new Map();VC.meters.set(uid,an);
  }catch(e){return}
  if(VC.levelT)return;
  const buf=new Uint8Array(256);
  VC.levelT=setInterval(()=>{
    if(!VC)return;let changed=false;
    VC.meters.forEach((an,id)=>{
      an.getByteTimeDomainData(buf);let sum=0;for(let i=0;i<buf.length;i++){const v=(buf[i]-128)/128;sum+=v*v}
      const loud=Math.sqrt(sum/buf.length)>.04&&!(id===S.me.id&&VC.mute);
      if(loud!==VC.speaking.has(id)){changed=true;loud?VC.speaking.add(id):VC.speaking.delete(id)}
    });
    if(changed)document.querySelectorAll('[data-vu]').forEach(e=>e.classList.toggle('speaking',VC.speaking.has(e.dataset.vu)));
  },150);
}
/* screen sharing in a voice channel */
async function voiceRenego(p){try{const o=await mkOffer(p.pc);await setLocal(p.pc,o,48);wsSend({t:'vrtc',to:p.uid,data:{sdp:p.pc.localDescription.toJSON()}})}catch(e){console.error(e)}}
async function voiceScreen(){
  if(!VC)return;
  if(VC.screen){
    VC.screen=false;VC.screenStream&&VC.screenStream.getTracks().forEach(t=>t.stop());VC.screenStream=VC.screenTrack=null;
    VC.peers.forEach(p=>{if(p.ss){try{p.pc.removeTrack(p.ss)}catch(e){}p.ss=null;voiceRenego(p)}});
    if(VW&&VW.uid===S.me.id)voiceWatch(null);
  }else{
    const s=await captureScreen();if(!s||!VC){s&&s.getTracks().forEach(t=>t.stop());return}
    VC.screenStream=s;VC.screenTrack=s.getVideoTracks()[0];VC.screen=true;
    VC.screenTrack.onended=()=>{if(VC&&VC.screen)voiceScreen()};
    VC.peers.forEach(p=>{p.ss=p.pc.addTrack(VC.screenTrack,VC.screenStream);voiceRenego(p)});
  }
  wsSend({t:'vstate',mute:VC.mute,deaf:VC.deaf,screen:!!VC.screen});renderSide();
}
/* watching someone's screen: a big window that can be made full screen */
let VW=null;
function voiceWatch(uid){
  let el=$('#vwatch');
  if(!uid){VW=null;if(el)el.remove();return}
  VW={uid};
  if(!el){el=document.createElement('div');el.id='vwatch';el.className='vwatch';document.body.appendChild(el)}
  const u=S.users[uid]||{name:'?'};
  el.innerHTML=`<div class="vw-top"><span class="live">В ЭФИРЕ</span><b>${esc(uid===S.me.id?'Ваш экран':nm(u))}</b><span class="mid"></span><button class="gbtn ic" data-act="vwfull" aria-label="Во весь экран">${ic('min')}</button><button class="gbtn ic" data-act="vwclose" aria-label="Закрыть">${ic('x')}</button></div><video autoplay playsinline muted></video><div class="vw-wait">Ждём картинку…</div>`;
  voiceWatchRefresh();
}
function voiceWatchRefresh(){
  if(!VW)return;const el=$('#vwatch');if(!el)return;const v=el.querySelector('video');
  const src=VW.uid===S.me.id?(VC&&VC.screenStream):(VC&&VC.peers.get(VW.uid)&&VC.peers.get(VW.uid).video);
  const live=!!src&&src.getVideoTracks().some(t=>t.readyState==='live'&&!t.muted);
  if(src&&v.srcObject!==src){v.srcObject=src;v.play().catch(()=>{})}
  el.classList.toggle('waiting',!live);
}
function voiceMute(){if(!VC)return;VC.mute=!VC.mute;if(VC.local)VC.local.getAudioTracks().forEach(t=>t.enabled=!VC.mute);wsSend({t:'vstate',mute:VC.mute,deaf:VC.deaf,screen:!!VC.screen});renderSide()}
function voiceDeaf(){if(!VC)return;VC.deaf=!VC.deaf;VC.peers.forEach(p=>{if(p.audio)p.audio.muted=VC.deaf});if(VC.deaf&&!VC.mute)voiceMute();else{wsSend({t:'vstate',mute:VC.mute,deaf:VC.deaf,screen:!!VC.screen});renderSide()}}
addEventListener('pagehide',()=>{if(VC)wsSend({t:'vleave'})});

/* =================================================================== STORIES
   A photo that lives 24 hours. Seen by the people you chat with and your contacts.
   Made with the camera (with masks and filters) or taken from the gallery. */
async function loadStories(){
  try{const r=await api('/api/stories');r.users.forEach(u=>S.users[u.id]=Object.assign(S.users[u.id]||{},u));S.stories=r.stories;renderSide()}catch(e){}
}
function storyGroups(){
  const t=Date.now(),by=new Map();
  S.stories.filter(x=>x.exp>t).sort((a,b)=>a.ts-b.ts).forEach(x=>{if(!by.has(x.user))by.set(x.user,[]);by.get(x.user).push(x)});
  const others=[...by.keys()].filter(u=>u!==S.me.id).map(u=>({u,list:by.get(u),unseen:by.get(u).some(x=>!x.seen),last:by.get(u).slice(-1)[0].ts}))
    .sort((a,b)=>(b.unseen-a.unseen)||(b.last-a.last));
  return {mine:by.get(S.me.id)||[],others};
}
function storiesRowHTML(){
  if(S.q.trim())return '';
  const {mine,others}=storyGroups();
  return `<div class="stories" role="list">
    <button class="story-b" data-act="${mine.length?'story-open':'story-add'}" data-id="${S.me.id}" role="listitem"><span class="ring ${mine.length?'seen':'none'}">${avatar(S.me,'',false)}<span class="plus" data-act="story-add" aria-label="Новая история">${ic('plus')}</span></span><small>Ваша история</small></button>
    ${others.map(g=>{const u=S.users[g.u];return `<button class="story-b" data-act="story-open" data-id="${g.u}" role="listitem"><span class="ring ${g.unseen?'':'seen'}">${avatar(u,'',false)}</span><small>${esc(nm(u))}</small></button>`}).join('')}
  </div>`;
}
/* ---------- viewer ---------- */
let SV=null;const STORY_MS=6000;
function openStories(uid){
  const {mine,others}=storyGroups();
  const order=uid===S.me.id?[S.me.id]:others.map(g=>g.u);
  const groups=new Map(others.map(g=>[g.u,g.list]));groups.set(S.me.id,mine);
  if(!(groups.get(uid)||[]).length)return;
  const list=groups.get(uid);
  SV={order,groups,ui:order.indexOf(uid),si:Math.max(0,uid===S.me.id?0:list.findIndex(x=>!x.seen)),paused:false,start:0,el:null,done:0};
  if(SV.si<0)SV.si=0;
  const el=SV.el=document.createElement('div');el.className='sv';el.id='sv';document.body.appendChild(el);
  svBind(el);svShow();
}
function svList(){return SV?SV.groups.get(SV.order[SV.ui])||[]:[]}
function svShow(){
  if(!SV)return;const l=svList(),st=l[SV.si];if(!st){svClose();return}
  SV.cur=st;const u=S.users[st.user]||{},mine=st.user===S.me.id;
  SV.el.innerHTML=`<div class="sv-bg" style="background-image:url('${esc(st.img)}')"></div><img decoding="async" class="sv-img" src="${esc(st.img)}" alt="История">
    <div class="sv-top"><div class="sv-bars">${l.map((x,i)=>`<i><b style="width:${i<SV.si?100:0}%"></b></i>`).join('')}</div>
      <div class="sv-head">${avatar(u,'s',false)}<b>${esc(mine?'Ваша история':nm(u))}</b><small>${agoText(st.ts)}</small><span style="flex:1"></span>
      ${mine?`<button class="sv-x" data-sv="del" aria-label="Удалить историю">${ic('trash')}</button>`:''}<button class="sv-x" data-sv="close" aria-label="Закрыть">${ic('x')}</button></div></div>
    <div class="sv-tap"><span data-sv="prev"></span><span data-sv="next"></span></div>
    <div class="sv-bottom">${mine?`<button class="sv-views" data-sv="views">${ic('eye')}<span id="sv-views">${st.views||0}</span> просмотр(ов)</button>`
      :`<div class="sv-react">${['❤️','🔥','😂','😮','😢','👏'].map(e=>`<button data-sv="react" data-e="${e}">${e}</button>`).join('')}</div>
        <form class="sv-reply" id="svf"><input class="input" id="svr" placeholder="Ответить ${esc(nm(u))}…" maxlength="500" autocomplete="off" enterkeyhint="send"><button class="sendb" aria-label="Отправить">${ic('send')}</button></form>`}</div>`;
  SV.start=0;SV.done=0;
  const img=SV.el.querySelector('.sv-img'),go=()=>{if(SV&&SV.cur===st&&!SV.start){SV.start=performance.now();svTick()}};
  if(img.complete)go();else{img.onload=go;img.onerror=go}
  if(!mine&&!st.seen){st.seen=true;api('/api/stories/view',{id:st.id}).catch(()=>{});renderSide()}
}
function svTick(){
  if(!SV)return;cancelAnimationFrame(SV.raf);
  const step=()=>{
    if(!SV)return;
    if(!SV.paused){const k=Math.min(1,(SV.done+performance.now()-SV.start)/STORY_MS);const b=SV.el.querySelectorAll('.sv-bars b')[SV.si];if(b)b.style.width=k*100+'%';if(k>=1){svNext();return}}
    SV.raf=requestAnimationFrame(step);
  };SV.raf=requestAnimationFrame(step);
}
function svPause(on){if(!SV||SV.paused===on)return;if(on){SV.done+=performance.now()-SV.start;SV.paused=true}else{SV.start=performance.now();SV.paused=false}}
function svNext(){if(!SV)return;cancelAnimationFrame(SV.raf);if(SV.si<svList().length-1){SV.si++;svShow()}else if(SV.ui<SV.order.length-1){SV.ui++;SV.si=0;const l=svList();const f=l.findIndex(x=>!x.seen);SV.si=f<0?0:f;svShow()}else svClose()}
function svPrev(){if(!SV)return;cancelAnimationFrame(SV.raf);if(SV.si>0){SV.si--;svShow()}else if(SV.ui>0){SV.ui--;SV.si=0;svShow()}else{SV.si=0;svShow()}}
function svNextUser(){if(!SV)return;cancelAnimationFrame(SV.raf);if(SV.ui<SV.order.length-1){SV.ui++;const f=svList().findIndex(x=>!x.seen);SV.si=f<0?0:f;svShow()}else svClose()}
function svPrevUser(){if(!SV)return;cancelAnimationFrame(SV.raf);if(SV.ui>0){SV.ui--;SV.si=0;svShow()}else{SV.si=0;svShow()}}
function svClose(){if(!SV)return;cancelAnimationFrame(SV.raf);SV.el.remove();SV=null;renderSide()}
function agoText(ts){const m=Math.round((Date.now()-ts)/60e3);return m<1?'только что':m<60?m+' мин':Math.floor(m/60)+' ч'}
function svBind(el){
  let downT=0,sy=0,held=false,ht;
  el.addEventListener('pointerdown',e=>{if(e.target.closest('input,form,button,.sv-bottom'))return;downT=Date.now();sy=e.clientY;SV.sx0=e.clientX;held=false;ht=setTimeout(()=>{held=true;svPause(true)},220)});
  el.addEventListener('pointerup',e=>{
    clearTimeout(ht);if(!downT)return;const dy=e.clientY-sy;downT=0;
    if(held){svPause(false);return}
    const dx=e.clientX-SV.sx0;
    if(dy>90&&Math.abs(dy)>Math.abs(dx)){svClose();return}
    if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)){dx<0?svNextUser():svPrevUser();return}
    const z=e.target.closest('[data-sv]');if(z&&z.dataset.sv==='prev')svPrev();else if(z&&z.dataset.sv==='next')svNext();
  });
  el.addEventListener('pointercancel',()=>{clearTimeout(ht);if(held)svPause(false);downT=0});
  el.addEventListener('click',async e=>{
    const b=e.target.closest('button[data-sv]');if(!b)return;const a=b.dataset.sv;
    if(a==='close')svClose();
    else if(a==='react'){const st=SV.cur;try{await api('/api/stories/reply',{id:st.id,text:b.dataset.e});b.classList.add('sent');toast('Отправлено '+b.dataset.e)}catch(err){toast(err.message)}}
    else if(a==='del'){if(!b.dataset.sure){b.dataset.sure=1;svPause(true);toast('Нажми ещё раз, чтобы удалить');return}try{await api('/api/stories/delete',{id:SV.cur.id});const id=SV.cur.id;S.stories=S.stories.filter(x=>x.id!==id);const l=svList();l.splice(SV.si,1);if(!l.length)svClose();else{SV.si=Math.min(SV.si,l.length-1);svShow()}}catch(err){toast(err.message)}}
    else if(a==='views'){svPause(true);try{const r=await api('/api/stories/viewers?id='+SV.cur.id);r.users.forEach(u=>S.users[u.id]=Object.assign(S.users[u.id]||{},u));
      sheet(`<h2>Просмотры · ${r.viewers.length}</h2>${r.viewers.length?r.viewers.map(v=>{const u=S.users[v.id];return `<div class="row">${avatar(u,'s',false)}<span class="mid"><span class="nm">${esc(nm(u))}</span><span class="sub"><span class="lm">${agoText(v.ts)} назад</span></span></span></div>`}).join(''):'<div class="empty">Пока никто не посмотрел</div>'}`);
      $('#layer .scrim').addEventListener('click',()=>svPause(false))}catch(err){toast(err.message);svPause(false)}}
  });
  el.addEventListener('focusin',()=>svPause(true));el.addEventListener('focusout',()=>svPause(false));
  el.addEventListener('submit',async e=>{e.preventDefault();const i=$('#svr'),t=i.value.trim();if(!t)return;try{await api('/api/stories/reply',{id:SV.cur.id,text:t});i.value='';i.blur();toast('Ответ отправлен в личные сообщения')}catch(err){toast(err.message)}});
}
addEventListener('keydown',e=>{if(!SV||e.target.id==='svr')return;if(e.key==='ArrowRight')svNext();if(e.key==='ArrowLeft')svPrev();if(e.key==='Escape')svClose()});

/* ---------- camera and editor ---------- */
let SC=null;
async function storyCamera(){
  closeLayer();if(SC)return;
  const el=document.createElement('div');el.className='scam';el.id='scam';document.body.appendChild(el);
  SC={el,facing:'user',st:fxState(),fx:null,stream:null};
  el.innerHTML=`<div class="scam-view" id="scview"><div class="scam-msg">Включаем камеру…</div></div>
    <div class="scam-top"><button class="sv-x" data-sc="close" aria-label="Закрыть">${ic('x')}</button><b>Новая история</b><span style="flex:1"></span></div>
    <div class="scam-bottom"><div id="scfx"></div>
      <div class="scam-ctrl"><button class="sc-side" data-sc="gallery" aria-label="Из галереи">${ic('image')}</button><button class="shutter" data-sc="shot" aria-label="Сфотографировать"></button><button class="sc-side" data-sc="flip" aria-label="Сменить камеру">${ic('flip')}</button></div></div>`;
  el.addEventListener('click',scClick);
  let M;try{M=await loadFxLib()}catch(e){toast(e.message)}
  if(!SC)return;SC.M=M;fxNoteFor={st:SC.st,fx:()=>SC&&SC.fx};scFxRow();
  if(M)M.loadTracker().catch(()=>{}); /* start loading face tracking right away, so masks are ready when chosen */
  await scStart();
}
async function scStart(){
  if(!SC)return;
  if(SC.fx){SC.fx.stop();SC.fx=null}if(SC.stream)SC.stream.getTracks().forEach(t=>t.stop());SC.stream=null;
  const view=$('#scview');
  try{
    const lite=isLite();
    SC.stream=await openCam(SC.facing,{width:{ideal:lite?960:1280},height:{ideal:lite?540:720}},null,SC.prevCam);
    const f=camFacing(SC.stream.getVideoTracks()[0]);if(f)SC.facing=f;SC.prevCam=curCamId(SC.stream);
  }catch(e){SC.stream=null;view.innerHTML=`<div class="scam-msg">Камера недоступна${e.name==='NotAllowedError'?' — разреши её в настройках браузера':''}.<br><br><button class="gbtn primary" data-sc="gallery">${ic('image')}Выбрать из галереи</button></div>`;return}
  if(!SC){SC&&0;return}
  const t=SC.stream.getVideoTracks()[0];
  if(SC.M){
    SC.fx=new SC.M.FX(t,{mirror:SC.facing==='user',max:isLite()?960:1280,fps:isLite()?24:30,noStream:true});scApply();
    view.innerHTML='';SC.fx.cv.className='scam-canvas';view.appendChild(SC.fx.cv);
  }else{
    view.innerHTML='<video class="scam-canvas" autoplay playsinline muted></video>';const v=view.firstChild;v.srcObject=SC.stream;v.play().catch(()=>{});
  }
}
function scFxRow(){const el=$('#scfx'),M=SC&&SC.M;if(el&&M)fxRedraw(el,fxStripHTML(M,SC.st,'data-sc'))}
function scApply(){const st=SC.st;if(!SC.fx)return;SC.fx.set(st.mask,st.filter,st.bg==='photo'?null:st.bg,st.beauty);if(st.bg==='photo'&&SC.bgImg)SC.fx.setBgImage(SC.bgImg)}
function scClose(){if(!SC)return;if(SC.fx)SC.fx.stop();if(SC.stream)SC.stream.getTracks().forEach(t=>t.stop());SC.el.remove();SC=null}
async function scClick(e){
  const b=e.target.closest('[data-sc]');if(!b||!SC)return;const a=b.dataset.sc;
  if(a==='close')scClose();
  else if(a==='tab'){SC.st.tab=b.dataset.v;scFxRow()}
  else if(a==='fx'){const ph=fxTap(SC.st,b);if(ph){const img=await ph;if(!img||!SC)return;SC.bgImg=img}scApply();scFxRow()}
  else if(a==='flip'){const was=SC.facing;SC.facing=was==='user'?'environment':'user';await scStart();if(SC&&!SC.stream){toast('Не удалось переключить камеру');SC.facing=was;scStart()}}
  else if(a==='shot'){
    let cv;
    if(SC.fx)cv=SC.fx.snap();
    else{const v=$('#scview video');if(!v||!v.videoWidth)return;cv=document.createElement('canvas');cv.width=v.videoWidth;cv.height=v.videoHeight;cv.getContext('2d').drawImage(v,0,0)}
    b.classList.add('flash');setTimeout(()=>b.classList.remove('flash'),200);
    storyEditor(cv,false);
  }
  else if(a==='gallery')pickImage(async f=>{try{const img=await loadImg(f),k=Math.min(1,1920/Math.max(img.naturalWidth,img.naturalHeight));const cv=document.createElement('canvas');cv.width=Math.round(img.naturalWidth*k);cv.height=Math.round(img.naturalHeight*k);cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);storyEditor(cv,true)}catch(err){toast(err.message)}});
}
/* editor: the photo in a 9:16 frame, optional masks for gallery photos, a caption you can drag */
let SE=null;
function storyEditor(photo,fromGallery){
  if(SC&&SC.fx)SC.fx.pause(true); /* the camera picture rests while editing */
  const el=document.createElement('div');el.className='sed';el.id='sed';document.body.appendChild(el);
  SE={el,photo,base:photo,fromGallery,text:'',color:0,tx:.5,ty:.42,st:fxState()};if(fromGallery)fxNoteFor={st:SE.st,fx:()=>null};
  el.innerHTML=`<canvas id="sedc" class="sed-canvas"></canvas>
    <div class="scam-top"><button class="sv-x" data-se="back" aria-label="Назад">${ic('back')}</button><span style="flex:1"></span><button class="sv-x" data-se="text" aria-label="Текст">${ic('text')}</button></div>
    <div class="scam-bottom">${fromGallery&&SC&&SC.M?'<div id="sefx"></div>':''}
      <div class="sed-text" id="sedt" hidden><input class="input" id="sedi" maxlength="80" placeholder="Текст на истории" autocomplete="off"><div class="sed-cols">${TXTC.map((c,i)=>`<button data-se="col" data-v="${i}" style="background:${c[0]}" aria-label="Цвет"></button>`).join('')}</div></div>
      <div class="sed-act"><button class="gbtn" data-se="back">Переснять</button><button class="gbtn primary" data-se="post">${ic('send')}Опубликовать</button></div></div>`;
  el.addEventListener('click',seClick);
  $('#sedi').addEventListener('input',e=>{SE.text=e.target.value;seDraw()});
  /* drag the caption */
  const cv=$('#sedc');let drag=false;
  cv.addEventListener('pointerdown',e=>{if(!SE.text)return;drag=true;cv.setPointerCapture(e.pointerId)});
  cv.addEventListener('pointermove',e=>{if(!drag)return;const r=cv.getBoundingClientRect();SE.tx=Math.max(.1,Math.min(.9,(e.clientX-r.left)/r.width));SE.ty=Math.max(.08,Math.min(.92,(e.clientY-r.top)/r.height));seDraw()});
  cv.addEventListener('pointerup',()=>{drag=false});
  seFxRow();seDraw();
}
const TXTC=[['#ffffff','rgba(0,0,0,.45)'],['#111111','rgba(255,255,255,.85)'],['#ffd84a','rgba(0,0,0,.45)'],['#ff4f8b','rgba(255,255,255,.9)'],['#5bd1ff','rgba(0,0,0,.5)'],['#2bd47d','rgba(0,0,0,.5)']];
function seFxRow(){const el=$('#sefx'),M=SC&&SC.M;if(el&&M)fxRedraw(el,fxStripHTML(M,SE.st,'data-se'))}
/* the final picture: 9:16, the photo in the middle on a blurred copy of itself, plus the caption */
function seCompose(cv,W,H){
  const x=cv.getContext('2d'),p=SE.photo;cv.width=W;cv.height=H;
  x.fillStyle='#0d1420';x.fillRect(0,0,W,H);
  const cover=Math.max(W/p.width,H/p.height),fit=Math.min(W/p.width,H/p.height);
  const near=Math.abs(p.width/p.height-W/H)<.12; /* almost 9:16 already: fill the whole frame */
  if(!near){
    x.save();try{x.filter='blur(28px) brightness(.6)'}catch(e){}
    x.drawImage(p,(W-p.width*cover)/2,(H-p.height*cover)/2,p.width*cover,p.height*cover);x.restore();x.filter='none';
    if(!('filter' in x)){x.fillStyle='rgba(8,12,20,.55)';x.fillRect(0,0,W,H)}
  }
  const k=near?cover:fit;x.drawImage(p,(W-p.width*k)/2,(H-p.height*k)/2,p.width*k,p.height*k);
  if(SE.text){
    const [fg,bg]=TXTC[SE.color],fs=Math.round(W*.065);x.font=`800 ${fs}px ${getComputedStyle(document.body).fontFamily}`;x.textAlign='center';x.textBaseline='middle';
    const tw=x.measureText(SE.text).width,px=SE.tx*W,py=SE.ty*H,pw=Math.min(W*.94,tw+fs*1.1),ph=fs*1.6;
    x.fillStyle=bg;x.beginPath();x.roundRect?x.roundRect(px-pw/2,py-ph/2,pw,ph,ph/2):x.rect(px-pw/2,py-ph/2,pw,ph);x.fill();
    x.fillStyle=fg;x.fillText(SE.text,px,py,W*.9);
  }
}
function seDraw(){if(SE)seCompose($('#sedc'),540,960)}
async function seClick(e){
  const b=e.target.closest('[data-se]');if(!b||!SE)return;const a=b.dataset.se;
  if(a==='back'){SE.el.remove();SE=null;if(SC){fxNoteFor={st:SC.st,fx:()=>SC&&SC.fx};if(SC.fx)SC.fx.pause(false)}return}
  else if(a==='text'){const t=$('#sedt');t.hidden=!t.hidden;if(!t.hidden)$('#sedi').focus()}
  else if(a==='col'){SE.color=+b.dataset.v;seDraw()}
  else if(a==='tab'){SE.st.tab=b.dataset.v;seFxRow()}
  else if(a==='fx'){
    const ph=fxTap(SE.st,b);if(ph){const img=await ph;if(!img||!SE)return;SE.bgImg=img}seFxRow();
    const st=SE.st,n=SE.n=(SE.n||0)+1;
    try{const out=await SC.M.onPhoto(SE.base,st.mask,st.filter,st.bg==='photo'?'none':st.bg,st.beauty,st.bg==='photo'?SE.bgImg:null);if(SE&&SE.n===n){SE.photo=out;seDraw()}}catch(err){console.warn(err)}
  }
  else if(a==='post'){
    b.disabled=true;
    try{
      const W=isLite()?720:1080,H=W*16/9,cv=document.createElement('canvas');seCompose(cv,W,H);
      let q=.85,d=cv.toDataURL('image/jpeg',q);while(d.length>1.3e6&&q>.45){q-=.1;d=cv.toDataURL('image/jpeg',q)}
      const r=await api('/api/stories',{img:d});
      if(!S.stories.some(x=>x.id===r.story.id))S.stories.push(r.story);
      SE.el.remove();SE=null;scClose();renderSide();toast('История опубликована на 24 часа ✨');
    }catch(err){toast(err.message);b.disabled=false}
  }
}

/* =================================================================== PHOTOS: picker, editor, stickers, wallpapers */
function pickImage(cb){const f=document.createElement('input');f.type='file';f.accept='image/*';f.onchange=()=>{if(f.files[0])cb(f.files[0])};f.click()}
function loadImg(file){return new Promise((ok,bad)=>{if(!/^image\//.test(file.type))return bad(new Error('Это не картинка'));const u=URL.createObjectURL(file),i=new Image();i.onload=()=>ok(i);i.onerror=()=>bad(new Error('Не удалось открыть картинку'));i.src=u})}

/* editor: drag to move, pinch or slider to zoom; stickers also get a shape and a caption */
let ED=null;
async function imageEditor(file,mode){
  let img;try{img=await loadImg(file)}catch(e){toast(e.message);return}
  ED={img,mode,zoom:1,x:0,y:0,shape:mode==='avatar'?'circle':'round',text:''};
  const st=mode==='sticker';
  sheet(`<h2>${st?'Новый стикер':'Аватарка'}</h2><p class="sub">${st?'Двигай фото пальцем, увеличивай ползунком':'Выбери, какая часть фото будет видна'}</p>
    <div class="ed-wrap ${st?'chk':''}"><canvas id="edc" width="600" height="600" aria-label="Предпросмотр"></canvas></div>
    <label class="field" style="margin-top:12px"><span>Масштаб</span><input type="range" id="edz" min="1" max="4" step="0.01" value="1"></label>
    ${st?`<div class="seg" style="margin-bottom:12px">${[['round','Скруглённый'],['circle','Круг'],['square','Квадрат'],['full','Целиком']].map(([k,n])=>`<button class="${k==='round'?'on':''}" data-act="ed-shape" data-v="${k}">${n}</button>`).join('')}</div>
      <label class="field"><span>Подпись на стикере (необязательно)</span><input class="input" id="edt" maxlength="30" placeholder="Например: ну и ну 😄"></label>`:''}
    <div class="btns"><button class="gbtn" data-act="closemenu">Отмена</button><button class="gbtn primary" data-act="ed-save" id="edsave">${st?'Сохранить стикер':'Поставить'}</button></div>`);
  const cv=$('#edc');
  $('#edz').oninput=e=>{ED.zoom=+e.target.value;edDraw()};
  if(st)$('#edt').oninput=e=>{ED.text=e.target.value;edDraw()};
  const pts=new Map();let base=null;
  cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);pts.set(e.pointerId,{x:e.clientX,y:e.clientY});base={x:ED.x,y:ED.y,zoom:ED.zoom,pts:new Map([...pts].map(([k,v])=>[k,{...v}]))}});
  cv.addEventListener('pointermove',e=>{
    if(!pts.has(e.pointerId))return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    const k=cv.width/cv.getBoundingClientRect().width,P=[...pts.values()],B=[...base.pts.values()];
    if(P.length===1&&B.length>=1){ED.x=base.x+(P[0].x-B[0].x)*k;ED.y=base.y+(P[0].y-B[0].y)*k}
    if(P.length>=2&&B.length>=2){const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);ED.zoom=Math.max(1,Math.min(4,base.zoom*d(P[0],P[1])/Math.max(1,d(B[0],B[1]))));$('#edz').value=ED.zoom}
    edDraw();
  });
  const up=e=>{pts.delete(e.pointerId);base={x:ED.x,y:ED.y,zoom:ED.zoom,pts:new Map([...pts].map(([k,v])=>[k,{...v}]))}};
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  cv.addEventListener('wheel',e=>{e.preventDefault();ED.zoom=Math.max(1,Math.min(4,ED.zoom*(e.deltaY<0?1.08:.93)));$('#edz').value=ED.zoom;edDraw()},{passive:false});
  edDraw();
}
function edPaint(ctx,size){
  const {img,zoom,shape,text}=ED,k=size/600;
  ctx.clearRect(0,0,size,size);ctx.save();
  const r=size*.18;
  if(shape==='circle'){ctx.beginPath();ctx.arc(size/2,size/2,size/2,0,Math.PI*2);ctx.clip()}
  else if(shape==='round'){ctx.beginPath();ctx.roundRect?ctx.roundRect(0,0,size,size,r):ctx.rect(0,0,size,size);ctx.clip()}
  const fit=shape==='full'?Math.min(size/img.naturalWidth,size/img.naturalHeight):Math.max(size/img.naturalWidth,size/img.naturalHeight);
  const w=img.naturalWidth*fit*zoom,h=img.naturalHeight*fit*zoom;
  ctx.drawImage(img,(size-w)/2+ED.x*k,(size-h)/2+ED.y*k,w,h);
  ctx.restore();
  if(text&&ED.mode==='sticker'){
    let fs=size*.13;ctx.font=`900 ${fs}px ${getComputedStyle(document.body).fontFamily}`;
    while(ctx.measureText(text).width>size*.9&&fs>size*.06){fs-=2;ctx.font=`900 ${fs}px ${getComputedStyle(document.body).fontFamily}`}
    ctx.textAlign='center';ctx.textBaseline='bottom';ctx.lineJoin='round';ctx.lineWidth=fs*.2;ctx.strokeStyle='rgba(10,16,26,.92)';
    ctx.strokeText(text,size/2,size*.95);ctx.fillStyle='#fff';ctx.fillText(text,size/2,size*.95);
  }
}
function edDraw(){const cv=$('#edc');if(cv&&ED)edPaint(cv.getContext('2d'),600)}
async function edSave(){
  const b=$('#edsave');if(b)b.disabled=true;
  try{
    if(ED.mode==='avatar'){
      const cv=document.createElement('canvas');cv.width=cv.height=320;const x=cv.getContext('2d');x.fillStyle='#2b3a50';x.fillRect(0,0,320,320);ED.shape='square';edPaint(x,320);
      const img=cv.toDataURL('image/jpeg',.88),tg=S.avaTarget;S.avaTarget=null;
      if(tg&&tg.chat){const r=await api('/api/chats/avatar',{chat:tg.chat,img});S.chats[r.chat.id]=Object.assign(S.chats[r.chat.id]||{},r.chat);closeLayer();renderSide();renderMain();toast('Фото группы обновлено');return}
      if(tg&&tg.server){const r=await api('/api/servers/update',{server:tg.server,avatar:img});S.servers[r.server.id]=r.server;closeLayer();renderSide();toast('Фото сервера обновлено');return}
      const r=await api('/api/profile',{avatar:cv.toDataURL('image/jpeg',.88)});S.me=S.users[S.me.id]=Object.assign(S.users[S.me.id],r.me);closeLayer();renderSide();toast('Аватарка обновлена');return;
    }
    /* stickers keep a transparent background: WebP where the browser can make it, otherwise PNG, kept under ~250 KB */
    let d='';for(const size of [512,384,300]){
      const cv=document.createElement('canvas');cv.width=cv.height=size;edPaint(cv.getContext('2d'),size);
      d=cv.toDataURL('image/webp',.86);if(!d.startsWith('data:image/webp'))d=cv.toDataURL('image/png');
      if(d.length<330e3)break;
    }
    const pk=await ownPack();
    const r=await api('/api/packs/add',{pack:pk,img:d});S.packs=r.packs;S.pk=pk;closeLayer();S.stk=true;renderStickers();toast('Стикер готов — он в наборе 😊');
  }catch(e){toast(e.message);if(b)b.disabled=false}
}
/* ---------- sticker packs ---------- */
const curPack=()=>S.packs.find(p=>p.id===S.pk)||S.packs[0]||null;
/* the pack new stickers go into: the open one if it is yours, otherwise your first, otherwise a new one */
async function ownPack(){
  const c=curPack();if(c&&c.mine)return c.id;
  const o=S.packs.find(p=>p.mine);if(o)return o.id;
  const r=await api('/api/packs',{name:'Мои стикеры'});S.packs=r.packs;return r.pack.id;
}
function renderStickers(){
  const el=$('#stkp');if(!el)return;queueSync();
  document.querySelectorAll('.stkbtn').forEach(b=>b.classList.toggle('on',S.stk));
  if(!S.stk){el.innerHTML='';return}
  /* the first tab is emoji (default), then sticker packs */
  if(S.pk==='emoji'||!S.packs.length){
    const cat=S.emoCat||'Недавние',rec=store.get('recentEmo',[]);
    const cats=['Недавние'].concat(Object.keys(EMO));
    const list=cat==='Недавние'?(rec.length?rec:emoList(EMO['Смайлы']).slice(0,40)):emoList(EMO[cat]);
    el.innerHTML=`<div class="stk-panel glass"><div class="emo-cats">${cats.map(k=>`<button class="${k===cat?'on':''}" data-act="emocat" data-v="${esc(k)}">${{'Недавние':'🕘','Смайлы':'😀','Жесты':'👋','Сердечки':'❤️','Праздник':'🎉','Еда':'🍔','Животные':'🐶','Флаги':'🏳️'}[k]||'•'}</button>`).join('')}</div>
      <div class="emo-grid">${list.map(e=>`<button data-act="emoins" data-e="${esc(e)}">${e}</button>`).join('')}</div>
      <div class="stk-tabs"><button class="on" data-act="pktab" data-id="emoji" title="Эмодзи">😀</button>${S.packs.map(x=>`<button data-act="pktab" data-id="${x.id}" title="${esc(x.name)}">${x.stickers[0]?`<img decoding="async" src="${esc(x.stickers[0].img)}" alt="" loading="lazy">`:`<span>${esc(initials(x.name))}</span>`}</button>`).join('')}<button data-act="newpack" title="Новый набор" aria-label="Новый набор">${ic('plus')}</button></div></div>`;
    return;
  }
  const p=curPack();
  const grid=!p?`<div class="stk-empty"><b>Своих стикеров пока нет</b><span>Сделай набор из фото в галерее и делись им с друзьями</span><button class="gbtn primary" data-act="newpack">${ic('plus')}Создать набор</button></div>`
    :`<div class="stk-grid">${p.mine?`<button class="stk-add" data-act="stknew" title="Сделать стикер из фото">${ic('plus')}<small>Из фото</small></button>`:''}
      ${p.stickers.map(x=>`<button class="stk-it" data-act="stksend" data-id="${x.id}" data-pack="${p.id}" data-stk="${x.id}" title="Отправить"><img decoding="async" src="${esc(x.img)}" alt="Стикер" loading="lazy" decoding="async"></button>`).join('')}
      ${!p.stickers.length&&!p.mine?'<div class="stk-empty"><span>В наборе пока пусто</span></div>':''}</div>`;
  el.innerHTML=`<div class="stk-panel glass">${grid}
    <div class="stk-tabs"><button data-act="pktab" data-id="emoji" title="Эмодзи">😀</button>${S.packs.map(x=>`<button class="${p&&x.id===p.id?'on':''}" data-act="pktab" data-id="${x.id}" title="${esc(x.name)}">${x.stickers[0]?`<img decoding="async" src="${esc(x.stickers[0].img)}" alt="" loading="lazy">`:`<span>${esc(initials(x.name))}</span>`}</button>`).join('')}
      <button data-act="newpack" title="Новый набор" aria-label="Новый набор">${ic('plus')}</button>${p?`<button data-act="pkset" data-id="${p.id}" title="Настройки набора" aria-label="Настройки набора">${ic('gear')}</button>`:''}</div></div>`;
}
function sendSticker(pack,id){
  const c=S.chats[S.cur];if(!c)return;
  if(!wsSend({t:'send',chat:c.id,sticker:{pack,id},reply:S.reply&&S.reply.m.id,cid:'s'+Date.now()})){toast('Нет связи. Переподключаемся…');return}
  S.reply=null;renderCtx();if(mobile()){S.stk=false;renderStickers()}
}
function stickerMenu(id,x,y){
  const p=curPack();if(!p)return;
  openMenu(`<button class="it" data-act="stksend" data-pack="${p.id}" data-id="${id}">${ic('send')}Отправить</button>${p.mine?`<button class="it bad" data-act="stkdel" data-pack="${p.id}" data-id="${id}">${ic('trash')}Удалить из набора</button>`:''}`,x,y);
}
function newPackSheet(){
  sheet(`<h2>Новый набор стикеров</h2><p class="sub">Назови набор, потом добавь стикеры из фото. Набором можно поделиться ссылкой.</p>
    <label class="field"><span>Название</span><input class="input" id="pkname" maxlength="40" placeholder="Например, Мои котики"></label>
    <div class="btns"><button class="gbtn" data-act="closemenu">Отмена</button><button class="gbtn primary" data-act="mkpack">Создать</button></div>`);
  setTimeout(()=>{const i=$('#pkname');if(i&&!touch)i.focus()},50);
}
const packLink=id=>`${location.origin}/#pack/${id}`;
function packSettings(id){
  const p=S.packs.find(x=>x.id===id);if(!p)return;
  sheet(`<h2>${esc(p.name)}</h2><p class="sub">${p.stickers.length} стикер(ов)${p.mine?' · твой набор':' · автор: '+esc(p.ownerName)}</p>
    ${p.mine?`<label class="field"><span>Название</span><input class="input" id="pkren" maxlength="40" value="${esc(p.name)}"></label>`:''}
    <div class="invite"><input class="input" readonly value="${esc(packLink(p.id))}" id="pklink"><button class="gbtn" data-act="copypk">${ic('copy')}</button></div>
    <p class="sub" style="margin-top:8px">Отправь ссылку другу — он добавит набор себе одним нажатием.</p>
    <div class="btns">${p.mine?`<button class="gbtn danger" data-act="pkdel" data-id="${p.id}" data-all="1">Удалить набор</button><button class="gbtn" data-act="stknew">${ic('image')}Добавить фото</button><button class="gbtn primary" data-act="pkrename" data-id="${p.id}">Сохранить</button>`
      :`<button class="gbtn danger" data-act="pkdel" data-id="${p.id}">Убрать набор</button><button class="gbtn primary" data-act="closemenu">Готово</button>`}</div>`);
}
async function packPreview(id){
  try{
    const r=await api('/api/packs/get?id='+encodeURIComponent(id)),p=r.pack;
    sheet(`<h2>${esc(p.name)}</h2><p class="sub">Набор стикеров · ${p.stickers.length} шт. · автор: ${esc(p.ownerName)}</p>
      <div class="stk-grid prev">${p.stickers.map(x=>`<span class="stk-it"><img decoding="async" src="${esc(x.img)}" alt="" loading="lazy"></span>`).join('')||'<div class="empty">Пока пусто</div>'}</div>
      <div class="btns">${r.have?`<button class="gbtn" data-act="closemenu">У тебя уже есть этот набор</button>`:`<button class="gbtn" data-act="closemenu">Закрыть</button><button class="gbtn primary" data-act="pkinstall" data-id="${p.id}">${ic('plus')}Добавить набор</button>`}</div>`);
  }catch(e){toast(e.message)}
}
function saveStickerSheet(msgId){
  const own=S.packs.filter(p=>p.mine);
  sheet(`<h2>В какой набор?</h2><p class="sub">Стикер появится в выбранном наборе</p>
    ${own.map(p=>`<button class="row" data-act="stkto" data-pack="${p.id}" data-id="${msgId}"><span class="ava s" style="--c:#4f74a3">${p.stickers[0]?`<img decoding="async" src="${esc(p.stickers[0].img)}" alt="">`:esc(initials(p.name))}</span><span class="mid"><span class="nm">${esc(p.name)}</span><span class="sub"><span class="lm">${p.stickers.length} шт.</span></span></span></button>`).join('')}
    <button class="row" data-act="stkto" data-pack="" data-id="${msgId}"><span class="ava s add">${ic('plus')}</span><span class="mid"><span class="nm">Новый набор «Мои стикеры»</span></span></button>`);
}

/* wallpapers from the gallery are kept on this device (IndexedDB), not uploaded */
const IDB={
  db:null,
  open(){return this.db||(this.db=new Promise((ok,bad)=>{const r=indexedDB.open('manasenger',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>ok(r.result);r.onerror=()=>bad(r.error)}))},
  async run(mode,fn){const db=await this.open();return new Promise((ok,bad)=>{const t=db.transaction('kv',mode),q=fn(t.objectStore('kv'));t.oncomplete=()=>ok(q&&q.result);t.onerror=()=>bad(t.error)})},
  get(k){return this.run('readonly',s=>s.get(k)).catch(()=>null)},
  set(k,v){return this.run('readwrite',s=>s.put(v,k))},
  del(k){return this.run('readwrite',s=>s.delete(k)).catch(()=>{})}
};
async function toWallBlob(file){
  const img=await loadImg(file),k=Math.min(1,1800/Math.max(img.naturalWidth,img.naturalHeight));
  const cv=document.createElement('canvas');cv.width=Math.round(img.naturalWidth*k);cv.height=Math.round(img.naturalHeight*k);cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);
  return new Promise(ok=>cv.toBlob(ok,'image/jpeg',.82));
}
const URLS={};
function blobUrl(key,b){if(URLS[key])URL.revokeObjectURL(URLS[key]);URLS[key]=b?URL.createObjectURL(b):'';return URLS[key]}
async function applyAppWall(){
  const b=await IDB.get('wall:app'),w=$('.wall');S.appWall=b?blobUrl('app',b):'';
  w.classList.toggle('custom',!!b);w.style.backgroundImage=b?`url("${S.appWall}")`:'';
}
const CWALLS={none:'',dusk:'linear-gradient(160deg,#2c3e5c,#1b2433 60%,#3a4f6e)',sky:'linear-gradient(160deg,#5d86b5,#2e4766)',sea:'linear-gradient(160deg,#2e6f86,#17303d)',paper:'linear-gradient(160deg,#c9d6e4,#9fb2c8)'};
async function applyChatWall(cid){
  const bg=$('#chatbg');if(!bg||S.cur!==cid)return;
  const v=await IDB.get('wall:'+cid);if(S.cur!==cid)return;
  if(v instanceof Blob){bg.style.backgroundImage=`url("${blobUrl('c',v)}")`;bg.className='chat-bg on'}
  else if(typeof v==='string'&&CWALLS[v]){bg.style.backgroundImage=CWALLS[v];bg.className='chat-bg on'}
  else{bg.style.backgroundImage='';bg.className='chat-bg'}
}
async function setChatWall(v){if(v==='none')await IDB.del('wall:'+S.cur);else await IDB.set('wall:'+S.cur,v);closeLayer();applyChatWall(S.cur)}
function chatWallSheet(){
  sheet(`<h2>Обои чата</h2><p class="sub">Видны только тебе, на этом устройстве</p>
    <div class="walls cw">${Object.entries(CWALLS).map(([k,g])=>`<button data-act="cwall" data-v="${k}" style="${g?`background:${g}`:''}" aria-label="${k}">${k==='none'?'Нет':''}</button>`).join('')}
    <button class="wall-pick" data-act="cwallpick" aria-label="Из галереи">${ic('image')}</button></div>
    <div class="btns"><button class="gbtn" data-act="closemenu">Готово</button></div>`);
}

/* =================================================================== GESTURES AND "BACK"
   The phone's back button / back gesture closes whatever is on top, one step at a time:
   photo editor → camera → story → window or menu → stickers → call (goes small) → chat → server → chat list.
   Only from the chat list does "back" leave the app. */
function topLayer(){
  if(SE)return 'editor';if(SC)return 'camera';if(SV)return 'story';
  if($('#layer')&&$('#layer').innerHTML)return 'layer';
  if(MAPV)return 'map';
  if(CALL&&!CALL.min&&CALL.state!=='ringing'&&$('#callEl'))return 'call';
  if(S.cur&&S.stk)return 'stickers';
  if(S.cur&&mobile())return 'chat';
  if(mobile()&&S.view!=='home'&&S.servers[S.view])return 'server';
  return null;
}
function goBack(){
  switch(topLayer()){
    case 'editor':SE.el.remove();SE=null;if(SC){fxNoteFor={st:SC.st,fx:()=>SC&&SC.fx};if(SC.fx)SC.fx.pause(false)}return true;
    case 'camera':scClose();return true;
    case 'story':svClose();return true;
    case 'layer':if(SV&&SV.paused)svPause(false);closeLayer();return true;
    case 'call':CALL.min=true;renderCall();return true;
    case 'stickers':S.stk=false;renderStickers();return true;
    case 'chat':closeChat();return true;
    case 'map':closeMap();return true;
    case 'server':S.view='home';renderSide();return true;
  }
  return false;
}
/* one spare history entry is kept while something is open, so the system "back" comes to us instead of leaving the site */
let backSkip=false;
function queueSync(){clearTimeout(syncBack.t);syncBack.t=setTimeout(syncBack,80)}
function syncBack(){
  if(backSkip)return; /* a step back is already on its way */
  const deep=!!topLayer(),guard=history.state&&history.state.mn;
  if(deep&&!guard)history.pushState({mn:1},'',location.href);
  else if(!deep&&guard){backSkip=true;history.back()}
}
addEventListener('popstate',()=>{
  if(backSkip){backSkip=false;queueSync();return}
  if(goBack()&&navigator.vibrate)navigator.vibrate(5);
  setTimeout(syncBack,0);
});
/* after every tap, and when things open from the server (an incoming story, a window), keep the history entry in step */
document.addEventListener('click',()=>setTimeout(syncBack,60));
new MutationObserver(queueSync).observe(document.body,{childList:true});
new MutationObserver(queueSync).observe($('#layer'),{childList:true});

/* swipes */
(function(){
  let sx=0,sy=0,st=0,mode=null,el=null,dx=0,dy=0,bub=null,lastTap={id:null,t:0},swipeX=0,rafId=0,side=null;
  /* the chat follows the finger, drawn once per screen frame; the list underneath slides in a little slower, like in Telegram */
  const paint=()=>{rafId=0;if(mode!=='edge'||!el)return;const w=W(),k=Math.min(1,swipeX/w);
    el.style.transform=`translate3d(${swipeX}px,0,0)`;if(side)side.style.transform=`translate3d(${(k-1)*w*.28}px,0,0)`};
  const EASE='cubic-bezier(.32,.72,0,1)';
  const unside=()=>{if(side){side.style.transition=`transform .26s ${EASE}`;side.style.transform='';const s2=side;setTimeout(()=>{s2.style.transition=''},280);side=null}};
  const W=()=>innerWidth;
  const ignore=t=>t.closest('.mapview,input,textarea,[type=range],.ed-wrap,.sed-canvas,.fx-row,.stk-tabs,.stories,.local,.sv,.scam,.sed,.pet-hero,.pet-float,.pet-tabs');
  document.addEventListener('touchstart',e=>{
    if(e.touches.length>1){mode=null;return}
    const t=e.touches[0],tg=e.target;sx=t.clientX;sy=t.clientY;st=Date.now();dx=dy=0;mode=null;el=null;bub=null;
    if(!mobile()&&!touch)return;
    const lay=$('#layer');
    /* bottom windows and full photos: pull down to close */
    const sh=tg.closest('.sheet,.lightbox');
    if(sh&&!ignore(tg)&&(sh.classList.contains('lightbox')||sh.scrollTop<=0)){mode='sheet';el=sh;return}
    if(lay&&lay.innerHTML)return;
    if(tg.closest('.mapview'))return;
    /* call screen: pull down to make it small */
    if(tg.closest('#callEl')&&!tg.closest('.bar,.local,.fx-panel')&&CALL&&CALL.state==='active'){mode='call';el=$('#callEl');return}
    if(tg.closest('#callEl,.sv,.scam,.sed'))return;
    /* from the left edge: back, the screen follows the finger */
    if(sx<32&&mobile()&&!tg.closest('.pet-float')&&(S.cur||(S.view!=='home'&&S.servers[S.view]))){mode='edge';el=S.cur?$('#main'):$('#side');return}
    if(S.cur){bub=tg.closest('.m');if(bub&&!bub.querySelector('[data-act="msg"]'))bub=null;
      /* the direction is decided after the first few pixels: right — back to the list (from anywhere, like Telegram), left on a message — reply */
      mode=mobile()&&!ignore(tg)&&!tg.closest('.composer,.stk-panel,.recb,.chat-h')?'maybe':(bub?'bubble':null);return}
    /* chat list: swipe sideways to switch Chats / Contacts / Calls */
    if(tg.closest('#side .list')&&S.view==='home'&&!ignore(tg))mode='tabs';
  },{passive:true});
  document.addEventListener('touchmove',e=>{
    if(!mode)return;const t=e.touches[0];dx=t.clientX-sx;dy=t.clientY-sy;
    if(mode==='maybe'){
      if(Math.abs(dx)<10&&Math.abs(dy)<10)return;
      if(dx>0&&Math.abs(dx)>Math.abs(dy)*1.4){mode='edge';el=$('#main');clearTimeout(lpT);sx+=10;dx-=10}
      else if(dx<0&&bub&&Math.abs(dx)>Math.abs(dy)){mode='bubble'}
      else{mode=null;return}
    }
    if(mode==='edge'){
      if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dx)<12){mode=null;return}
      if(S.cur&&!$('#app').classList.contains('peek')){$('#app').classList.add('peek');side=$('#side');if(side)side.style.transition='none'}
      el.style.transition='none';swipeX=Math.max(0,dx);if(!rafId)rafId=requestAnimationFrame(paint);return;
    }
    if(mode==='sheet'||mode==='call'){
      if(dy<0||Math.abs(dx)>Math.abs(dy)*1.2){if(Math.abs(dx)>20)mode=null;return}
      el.style.transition='none';
      el.style.transform=el.classList.contains('sheet')&&mobile()?`translate3d(0,${dy}px,0)`:el.classList.contains('sheet')?`translate(-50%,calc(-50% + ${dy}px))`:`translateY(${dy}px)`;
      if(el.classList.contains('sheet')){const sc=document.querySelector('#layer .scrim');if(sc){sc.style.transition='none';sc.style.opacity=String(Math.max(0,1-dy/(el.offsetHeight||500)))}}
      if(mode==='call'||el.classList.contains('lightbox'))el.style.opacity=String(Math.max(.4,1-dy/600));
      return;
    }
    if(mode==='bubble'){
      if(Math.abs(dy)>Math.abs(dx)){if(bub)bub.style.transform='';mode=null;return}
      if(dx<0){bub.style.transform=`translateX(${Math.max(-70,dx)}px)`;clearTimeout(lpT)}
    }
  },{passive:true});
  const settle=(node,ok,done)=>{node.style.transition='transform .22s ease, opacity .22s';
    if(ok){done()}else{node.style.transform='';node.style.opacity='';setTimeout(()=>{node.style.transition=''},240)}};
  document.addEventListener('touchend',e=>{
    const v=Math.abs(dx)/Math.max(1,Date.now()-st),vy=dy/Math.max(1,Date.now()-st);
    if(mode==='maybe')mode=bub?'bubble':null;
    if(mode==='edge'&&el){
      if(rafId){cancelAnimationFrame(rafId);rafId=0}
      const node=el,go=dx>W()*.3||(dx>30&&v>.35);
      node.style.transition=`transform .26s ${EASE}`;
      if(go){node.style.transform=`translate3d(${W()}px,0,0)`;if(side){side.style.transition=`transform .26s ${EASE}`;side.style.transform='translate3d(0,0,0)'}
        setTimeout(()=>{node.style.transition='';node.style.transform='';if(side){side.style.transition='';side.style.transform='';side=null}$('#app').classList.remove('peek');goBack();syncBack()},260);
        if(navigator.vibrate)navigator.vibrate(8)}
      else{node.style.transform='';unside();setTimeout(()=>{node.style.transition='';$('#app').classList.remove('peek')},270)}
    }
    else if(mode==='sheet'&&el){const node=el,go=dy>110||(dy>30&&vy>.6),sc=document.querySelector('#layer .scrim');
      if(go){const ms=Math.round(Math.max(160,Math.min(320,(innerHeight-dy)/Math.max(.8,vy)))),L=$('#layer');
        node.style.transition=`transform ${ms}ms cubic-bezier(.2,.8,.3,1)`;node.style.transform=node.classList.contains('sheet')&&mobile()?'translate3d(0,110%,0)':node.style.transform+' translateY(100vh)';
        if(sc){sc.style.transition=`opacity ${ms}ms`;sc.style.opacity='0'}document.body.classList.remove('sheet-on');
        setTimeout(()=>{if(L&&L.contains(node))L.innerHTML='';if(SV&&SV.paused)svPause(false);syncBack()},ms)}
      else{node.style.transition='transform .42s cubic-bezier(.32,.72,0,1)';node.style.transform='';if(sc){sc.style.transition='opacity .3s';sc.style.opacity=''}setTimeout(()=>{node.style.transition=''},440)}}
    else if(mode==='call'&&el){const node=el,go=dy>120||(dy>40&&vy>.6);settle(node,go,()=>{setTimeout(()=>{node.style.transform='';node.style.opacity='';node.style.transition='';if(CALL){CALL.min=true;renderCall()}syncBack()},10)})}
    else if(mode==='bubble'&&bub){
      const id=bub.dataset.id;bub.style.transition='transform .2s';bub.style.transform='';const b=bub;setTimeout(()=>{b.style.transition=''},220);
      if(dx<-60){const m=(S.msgs[S.cur]||[]).find(x=>x.id===id);if(m&&!m.del&&!m.pending&&!m.call){S.edit=null;S.reply={m};renderCtx();navigator.vibrate&&navigator.vibrate(10)}}
      /* double tap on a message: ❤️ */
      else if(Math.abs(dx)<10&&Math.abs(dy)<10&&Date.now()-st<250&&!e.target.closest('a,img.pic,[data-act="jump"],.reacts')){
        const now=Date.now();
        if(lastTap.id===id&&now-lastTap.t<320){lastTap={id:null,t:0};clearTimeout(lpT);const m=(S.msgs[S.cur]||[]).find(x=>x.id===id);
          if(m&&!m.del&&!m.pending&&!m.call&&!m.sys){wsSend({t:'react',chat:S.cur,id,emoji:'❤️'});navigator.vibrate&&navigator.vibrate(10);
            const h=document.createElement('span');h.className='dbl-heart';h.textContent='❤️';b.appendChild(h);setTimeout(()=>h.remove(),700)}}
        else lastTap={id,t:now};
      }
    }
    else if(mode==='tabs'&&Math.abs(dx)>80&&Math.abs(dx)>Math.abs(dy)*2){
      const tabs=IOS?['chats','contacts','calls']:['chats','contacts','calls','ai'],i=tabs.indexOf(S.tab),j=i+(dx<0?1:-1);
      if(i>=0&&j>=0&&j<tabs.length){S.tab=tabs[j];S.q='';if(S.tab==='calls')S.calls=null;renderSide();navigator.vibrate&&navigator.vibrate(5)}
    }
    mode=null;el=null;bub=null;
  },{passive:true});
  document.addEventListener('touchcancel',()=>{if(rafId){cancelAnimationFrame(rafId);rafId=0}unside();if(el){el.style.transform='';el.style.opacity='';el.style.transition=''}if(bub)bub.style.transform='';$('#app')&&$('#app').classList.remove('peek');mode=null;el=null;bub=null},{passive:true});
})();

/* =================================================================== EVENTS */
let lpT=null,lpFired=false,downEl=null,downAt=0;
/* on phones the keyboard closes when you tap a button and the page jumps, so the tap can land on the dim background:
   remember what was under the finger when it touched the screen and act on that */
document.addEventListener('pointerdown',e=>{downEl=e.target.closest('[data-act]');downAt=Date.now()},true);
document.addEventListener('click',async e=>{
  if(lpFired){lpFired=false;e.preventDefault();return}
  let el=e.target.closest('[data-act]');
  if(downEl&&downEl!==el&&Date.now()-downAt<1500&&document.contains(downEl)&&(!el||el.dataset.act==='closemenu'))el=downEl;
  downEl=null;
  if(!el)return;
  if(el.dataset.act==='closemenu'&&el.classList.contains('scrim')&&e.target!==el)return;
  const a=el.dataset.act,id=el.dataset.id;
  switch(a){
    case 'amode':authMode=el.dataset.m;viewAuth();break;
    case 'view':S.view=el.dataset.v;S.q='';if(!mobile()){const g=S.servers[S.view];if(g){const first=g.channels.find(c=>c.type==='text');if(first&&S.chats[first.id]&&(!S.cur||(S.chats[S.cur]||{}).server!==g.id)){openChat(first.id);break}}else if(S.cur&&(S.chats[S.cur]||{}).server)closeChat()}renderSide();break;
    case 'addserver':addServerSheet();break;
    case 'mkserver':try{const r=await api('/api/servers',{name:$('#sname').value});S.servers[r.server.id]=r.server;closeLayer();S.view=r.server.id;renderSide();toast('Сервер создан. Пригласи друзей кнопкой со ссылкой')}catch(err){toast(err.message)}break;
    case 'joincode':{const v=$('#scode').value.trim(),m=/([\w-]{4,20})\s*$/.exec(v.replace(/^.*#join\//,''));if(!m){toast('Вставь ссылку-приглашение');break}closeLayer();joinSheet(m[1]);break}
    case 'dojoin':try{const r=await api('/api/servers/join',{code:el.dataset.code});S.servers[r.server.id]=r.server;closeLayer();S.view=r.server.id;
      const me=await api('/api/me');me.chats.forEach(c=>S.chats[c.id]=c);me.users.forEach(u=>S.users[u.id]=Object.assign(S.users[u.id]||{},u));
      const first=r.server.channels.find(c=>c.type==='text');if(first&&S.chats[first.id])openChat(first.id);else renderSide()}catch(err){toast(err.message)}break;
    case 'invite':inviteSheet(S.servers[S.view]);break;
    case 'copyinv':try{await navigator.clipboard.writeText($('#inv').value);toast('Ссылка скопирована')}catch(err){$('#inv').select()}break;
    case 'shareinv':try{await navigator.share({title:'Manasenger',text:'Заходи на мой сервер в Manasenger',url:$('#inv').value})}catch(err){}break;
    case 'srvmenu':serverSheet(S.servers[S.view]);break;
    case 'newch':newChannelSheet(el.dataset.k);break;
    case 'mkch':try{await api('/api/servers/channel',{server:S.view,type:el.dataset.k,name:$('#chname').value});closeLayer()}catch(err){toast(err.message)}break;
    case 'delch':{if(!el.dataset.sure){el.dataset.sure=1;el.innerHTML='Удалить?';el.classList.add('danger');el.style.width='auto';el.style.padding='0 12px';return}try{await api('/api/servers/channel/delete',{server:S.view,channel:id});el.closest('.set-row').remove()}catch(err){toast(err.message)}break}
    case 'savesrv':try{await api('/api/servers/update',{server:S.view,name:$('#srvname').value});closeLayer();toast('Сохранено')}catch(err){toast(err.message)}break;
    case 'newinv':try{const r=await api('/api/servers/update',{server:S.view,newInvite:true});S.servers[r.server.id]=r.server;inviteSheet(r.server);toast('Старая ссылка больше не работает')}catch(err){toast(err.message)}break;
    case 'delsrv':{if(!el.dataset.sure){el.dataset.sure=1;el.textContent='Удалить навсегда?';return}try{await api('/api/servers/delete',{server:S.view});closeLayer()}catch(err){toast(err.message)}break}
    case 'leavesrv':{if(!el.dataset.sure){el.dataset.sure=1;el.textContent='Точно покинуть?';return}try{const sid=S.view;await api('/api/servers/leave',{server:sid});closeLayer()}catch(err){toast(err.message)}break}
    case 'vjoin':voiceJoin(el.dataset.s,id);break;
    case 'vleave':voiceLeave();break;
    case 'vmute':voiceMute();break;
    case 'vdeaf':voiceDeaf();break;
    case 'map':if(!IOS)openMap();break;
    case 'mapclose':closeMap();break;
    case 'maptr':trToggle();break;
    case 'troff':trClose();break;
    case 'trroute':trRoute(el.dataset.i);break;
    case 'trback':trLineClear();mapBottom();break;
    case 'mapadd':mapAddSheet();break;
    case 'mapdesel':mapSel=null;mapDraw();break;
    case 'maproute':mapRoute(id,el.dataset.mode);break;
    case 'busopt':if(ROUTE&&ROUTE.bus){ROUTE.bus.sel=+el.dataset.i;busDraw();mapBottom()}break;
    case 'maprouteoff':routeClear();ROUTE=null;mapBottom();break;
    case 'mapgo':mapFocus(id);break;
    case 'mapmsg':closeMap();startDM(id);break;
    case 'mapinv':case 'mapacc':{try{MAPD=await api(a==='mapacc'?'/api/map/accept':'/api/map/invite',{userId:id});toast(a==='mapacc'?'Теперь вы видите друг друга на карте':'Приглашение отправлено');mapAddSheet();mapDraw();renderSide()}catch(err){toast(err.message)}break}
    case 'mapdel':{if(!el.dataset.sure){el.dataset.sure=1;el.textContent='Точно?';return}try{MAPD=await api('/api/map/remove',{userId:id});mapSel=null;if($('#layer').innerHTML)mapAddSheet();mapDraw();renderSide()}catch(err){toast(err.message)}break}
    case 'mapfind':{const v=($('#mapq')||{}).value||'';if(!v.trim())break;try{const r=await api('/api/users/find?u='+encodeURIComponent(v.trim()));S.users[r.user.id]=Object.assign(S.users[r.user.id]||{},r.user);MAPD=await api('/api/map/invite',{userId:r.user.id});toast('Приглашение отправлено @'+r.user.username);mapAddSheet();mapDraw()}catch(err){toast(err.message)}break}
    case 'mapshare':if(GEO.watch!=null&&MAPD.sharing){geoStop()}else shareSheet();break;
    case 'mapshareon':closeLayer();if(geoStart()){store.set('geoShare',true);MAPD.sharing=true;toast('Геопозиция включена — её видят только друзья на карте');mapDraw()}break;
    case 'mapme':{const go=c=>{GEO.last=c;mapDraw();if(MAP)MAP.flyTo({center:[c.longitude,c.latitude],zoom:Math.max(MAP.getZoom(),15),speed:1.6,essential:true})};
      if(GEO.last)go(GEO.last);else if(navigator.geolocation){store.set('geoAsked',true);navigator.geolocation.getCurrentPosition(p=>go(p.coords),()=>toast('Не удалось определить, где вы. Разрешите доступ к геопозиции'),{enableHighAccuracy:true,timeout:15e3,maximumAge:30e3})}break}
    case 'mapstyle':{const ks=Object.keys(MAP_STYLES),cur=store.get('mapStyle','liberty'),nx=ks[(ks.indexOf(cur)+1)%ks.length];store.set('mapStyle',nx);if(MAP)MAP.setStyle(MAP_STYLES[nx][1]);toast('Карта: '+MAP_STYLES[nx][0],1500);break}
    case 'map3d':{if(!MAP)break;const up=MAP.getPitch()<20;MAP.easeTo({pitch:up?60:0,bearing:up?-20:0,zoom:up?Math.max(MAP.getZoom(),16):MAP.getZoom(),duration:700});el.classList.toggle('on',up);break}
    case 'tab':S.tab=IOS&&el.dataset.t==='ai'?'chats':el.dataset.t;S.q='';if(S.tab==='calls')S.calls=null;renderSide();break;
    case 'open':closeLayer();openChat(id);break;
    case 'back':closeChat(true);break;
    case 'dm':closeLayer();startDM(id);break;
    case 'newchat':newChatSheet(false);break;
    case 'newgroup':newChatSheet(true);break;
    case 'settings':settingsSheet();checkVersion();break;
    case 'appupdate':try{sessionStorage.removeItem('mn.upd')}catch(x){}updateNow();break;
    case 'info':infoSheet();break;
    case 'closemenu':closeLayer();break;
    case 'send':sendMsg();$('#txt')&&!touch&&$('#txt').focus();break;
    case 'attach':$('#file').click();break;
    case 'older':loadOlder();break;
    case 'msg':if(!touch&&e.detail>=2)break;if(e.target.closest('a,[data-act="zoom"],[data-act="jump"],.reacts,[data-act="onceopen"]'))break;msgMenu(id,e.clientX,e.clientY);break;
    case 'zoom':{const L=$('#layer');L.innerHTML=`<div class="lightbox" data-act="closemenu"><img decoding="async" src="${esc(el.src)}" alt=""></div>`;break}
    case 'jump':{const t=document.querySelector(`.m[data-id="${CSS.escape(id)}"]`);if(t){t.scrollIntoView({block:'center',behavior:'smooth'});t.classList.add('hl');setTimeout(()=>t.classList.remove('hl'),1300)}break}
    case 'react':wsSend({t:'react',chat:S.cur,id,emoji:el.dataset.e});useRe(el.dataset.e);closeLayer();navigator.vibrate&&navigator.vibrate(8);break;
    case 'remore':reactSheet(id);break;
    case 'retab':reactSheet(id,el.dataset.v);break;
    case 'mm-reply':{const m=S.msgs[S.cur].find(x=>x.id===id);S.edit=null;S.reply={m};renderCtx();closeLayer();if(!touch)$('#txt').focus();break}
    case 'mm-savestk':saveStickerSheet(id);break;
    case 'stkto':{const msg=id;let pk=el.dataset.pack;try{if(!pk){const r0=await api('/api/packs',{name:'Мои стикеры'});pk=r0.pack.id}const r=await api('/api/packs/add',{pack:pk,chat:S.cur,fromMsg:msg});S.packs=r.packs;closeLayer();toast('Стикер сохранён в набор')}catch(err){toast(err.message)}break}
    case 'mm-pack':{const m=S.msgs[S.cur].find(x=>x.id===id);closeLayer();if(m&&m.pack)packPreview(m.pack);break}
    case 'stk':S.stk=!S.stk;renderStickers();break;
    case 'stksend':sendSticker(el.dataset.pack,id);closeLayer();break;
    case 'stknew':closeLayer();pickImage(f=>imageEditor(f,'sticker'));break;
    case 'stkdel':{try{const r=await api('/api/packs/del',{pack:el.dataset.pack,id});S.packs=r.packs;closeLayer();renderStickers()}catch(err){toast(err.message)}break}
    case 'pktab':S.pk=id;renderStickers();break;
    case 'newpack':newPackSheet();break;
    case 'mkpack':try{const r=await api('/api/packs',{name:$('#pkname').value});S.packs=r.packs;S.pk=r.pack.id;closeLayer();S.stk=true;renderStickers();toast('Набор создан. Добавь стикеры кнопкой «Из фото»')}catch(err){toast(err.message)}break;
    case 'pkset':packSettings(id);break;
    case 'pkrename':try{const r=await api('/api/packs/rename',{pack:id,name:$('#pkren').value});S.packs=r.packs;closeLayer();renderStickers();toast('Сохранено')}catch(err){toast(err.message)}break;
    case 'pkdel':{if(!el.dataset.sure){el.dataset.sure=1;el.textContent=el.dataset.all?'Удалить у всех?':'Точно убрать?';return}try{const r=await api('/api/packs/remove',{pack:id,everywhere:!!el.dataset.all});S.packs=r.packs;S.pk=S.packs[0]?S.packs[0].id:null;closeLayer();renderStickers()}catch(err){toast(err.message)}break}
    case 'pkinstall':try{const r=await api('/api/packs/install',{pack:id});S.packs=r.packs;S.pk=id;closeLayer();toast('Набор добавлен 🎉');if(S.cur){S.stk=true;renderStickers()}}catch(err){toast(err.message)}break;
    case 'copypk':try{await navigator.clipboard.writeText($('#pklink').value);toast('Ссылка скопирована')}catch(err){$('#pklink').select()}break;
    case 'ed-shape':ED.shape=el.dataset.v;document.querySelectorAll('[data-act="ed-shape"]').forEach(b=>b.classList.toggle('on',b===el));edDraw();break;
    case 'ed-save':edSave();break;
    case 'chatwall':chatWallSheet();break;
    case 'cwall':setChatWall(el.dataset.v);break;
    case 'cwallpick':pickImage(async f=>{try{const b=await toWallBlob(f);await IDB.set('wall:'+S.cur,b);closeLayer();applyChatWall(S.cur);toast('Обои чата установлены')}catch(err){toast(err.message)}});break;
    case 'appwall':pickImage(async f=>{try{const b=await toWallBlob(f);await IDB.set('wall:app',b);await applyAppWall();settingsSheet();toast('Обои установлены')}catch(err){toast(err.message)}});break;
    case 'appwalldel':await IDB.del('wall:app');await applyAppWall();settingsSheet();break;
    case 'avadel':try{const r=await api('/api/profile',{avatar:''});S.me=S.users[S.me.id]=Object.assign(S.users[S.me.id],r.me);settingsSheet();renderSide()}catch(err){toast(err.message)}break;
    case 'pklinkmsg':e.preventDefault();packPreview(id);break;
    case 'vplay':voicePlay(id);break;
    case 'vspeed':VP.rate=VP.rate===1?1.5:VP.rate===1.5?2:1;VP.a.playbackRate=VP.rate;el.textContent=VP.rate+'×';break;
    case 'vseek':{if(VP.id!==id){voicePlay(id);break}const r=el.getBoundingClientRect();if(VP.a.duration)VP.a.currentTime=VP.a.duration*Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));break}
    case 'rnd':roundTap(el);break;
    case 'playvid':{const m=(S.msgs[S.cur]||[]).find(x=>x.id===id);if(!m||m.pending)break;const L=$('#layer');L.innerHTML=`<div class="lightbox vbox"><button class="sv-x vclose" data-act="closemenu" aria-label="Закрыть">${ic('x')}</button><video src="${esc(m.media.url)}" controls autoplay playsinline></video></div>`;break}
    case 'rec-send':REC.stop(true);break;
    case 'rec-cancel':REC.stop(false);break;
    case 'pet':petSheet();break;
    case 'petadd':try{const r=await api('/api/pet/enable',{chat:S.cur});Object.assign(S.chats[S.cur],r.chat);closeLayer();renderMain();setTimeout(()=>petSheet(),250)}catch(err){toast(err.message)}break;
    case 'pettab':petSheet(el.dataset.v);break;
    case 'petset':{if(el.classList.contains('lock')){toast('Откроется на '+el.title.replace(/\D+/g,'')+'-й день серии 🔥');break}const b={chat:S.cur};b[el.dataset.k]=el.dataset.v;try{const r=await api('/api/pet',b);Object.assign(S.chats[S.cur],r.chat);petSheet();refreshPetBtn()}catch(err){toast(err.message)}break}
    case 'petname':try{const r=await api('/api/pet',{chat:S.cur,name:$('#petName').value});Object.assign(S.chats[S.cur],r.chat);toast('Имя сохранено');refreshPetBtn()}catch(err){toast(err.message)}break;
    case 'petpat':petPat(true);wsSend({t:'pat',chat:S.cur});break;
    case 'petfloat':{const on=store.get('petfloat','on')!=='on';store.set('petfloat',on?'on':'off');el.classList.toggle('on',on);el.setAttribute('aria-checked',on);petFloat();break}
    case 'petrand':{const c=S.chats[S.cur];if(!c||!c.pet||!window.PET)break;const best=c.pet.best||0,b={chat:S.cur};
      [['color',PET.COLORS],['style',PET.STYLES],['hat',PET.HATS],['eyes',PET.EYES],['neck',PET.NECK],['fx',PET.FX]].forEach(([k,T])=>{const ok=Object.keys(T).filter(x=>(T[x].need||0)<=best);b[k]=ok[Math.floor(Math.random()*ok.length)]});
      try{const r=await api('/api/pet',b);Object.assign(S.chats[S.cur],r.chat);petSheet();refreshPetBtn();const sv=document.querySelector('#petHero svg');if(sv)sv.classList.add('patted')}catch(err){toast(err.message)}break}
    case 'gadd':newChatSheet(true,S.cur);break;
    case 'gmember':memberSheet(S.cur,id);break;
    case 'gtitle':try{const r=await api('/api/chats/title',{chat:S.cur,userId:id,title:$('#mtitle').value});Object.assign(S.chats[S.cur],r.chat);infoSheet();renderMsgs();toast('Подписано')}catch(err){toast(err.message)}break;
    case 'gkick':{if(!el.dataset.sure){el.dataset.sure=1;el.textContent='Точно удалить?';return}try{await api('/api/chats/remove',{chat:S.cur,userId:id});closeLayer()}catch(err){toast(err.message)}break}
    case 'grsave':try{const n=$('#grname').value.trim();if(n&&n!==S.chats[S.cur].name){const r=await api('/api/chats/rename',{chat:S.cur,name:n});Object.assign(S.chats[S.cur],r.chat);renderMain();renderSide()}closeLayer()}catch(err){toast(err.message)}break;
    case 'readers':readersSheet(el.dataset.chat||S.cur,id);break;
    case 'mm-readers':readersSheet(S.cur,id);break;
    case 'mm-star':wsSend({t:'star',chat:S.cur,id});closeLayer();break;
    case 'mm-fwd':forwardSheet(id);break;
    case 'mm-saved':{const to=selfId();closeLayer();if(to&&wsSend({t:'fwd',chat:S.cur,id,to}))toast('Сохранено в Избранное ⭐');break}
    case 'dofwd':wsSend({t:'fwd',chat:el.dataset.from,id,to:el.dataset.to});closeLayer();toast('Переслано');break;
    case 'starred':starredSheet();break;
    case 'gostar':{closeLayer();const ch=el.dataset.chat;if(S.cur!==ch)await openChat(ch);setTimeout(()=>{const t=document.querySelector(`.m[data-id="${CSS.escape(id)}"]`);if(t){t.scrollIntoView({block:'center'});t.classList.add('hl');setTimeout(()=>t.classList.remove('hl'),1300)}},350);break}
    case 'addcontact':addContactSheet(null);break;
    case 'editcontact':addContactSheet(S.users[id]);break;
    case 'savecontact':saveContact(id);break;
    case 'delcontact':{if(!el.dataset.sure){el.dataset.sure=1;el.textContent='Точно удалить?';return}try{const r=await api('/api/contacts/delete',{userId:id});S.contacts=r.contacts;closeLayer();renderSide();if(S.cur)renderMain()}catch(err){toast(err.message)}break}
    case 'contact':contactSheet(id);break;
    case 'callid':{closeLayer();try{const r=await api('/api/chats/dm',{userId:id});r.users.forEach(u=>S.users[u.id]=Object.assign(S.users[u.id]||{},u));S.chats[r.chat.id]=Object.assign(S.chats[r.chat.id]||{},r.chat);startCall(r.chat.id,el.dataset.k)}catch(err){toast(err.message)}break}
    case 'c-fx':callFxSheet();break;
    case 'cfx':if(el.dataset.x==='tab'){CALL.fxs.tab=el.dataset.v;S.fxDraw&&S.fxDraw();break}await setCallFx(el);S.fxDraw&&S.fxDraw();break;
    case 'lite':store.set('lite',el.dataset.v);toast('Применяем…');setTimeout(()=>location.reload(),400);break;
    case 'story-add':storyCamera();break;
    case 'story-open':openStories(id);break;
    case 'mm-copy':{const m=S.msgs[S.cur].find(x=>x.id===id);try{await navigator.clipboard.writeText(m.text);toast('Скопировано')}catch(err){toast('Не удалось скопировать')}closeLayer();break}
    case 'mm-edit':{const m=S.msgs[S.cur].find(x=>x.id===id);S.reply=null;S.edit={m};const t=$('#txt');t.value=m.text;autosize(t);renderCtx();closeLayer();t.focus();break}
    case 'mm-del':{if(!el.dataset.sure){el.dataset.sure=1;el.lastChild.textContent='Точно удалить?';return}wsSend({t:'del',chat:S.cur,id});closeLayer();break}
    case 'ctxx':S.reply=S.edit=null;if($('#txt'))$('#txt').value=S.draft[S.cur]||'';renderCtx();break;
    case 'chatmenu':{const c=S.chats[S.cur];const r=el.getBoundingClientRect();
      openMenu(`<button class="it" data-act="info">${ic('users')}${c.type==='dm'?'Профиль':'Участники'}</button><button class="it" data-act="chatwall">${ic('image')}Обои чата</button>${c.type!=='self'?`<button class="it" data-act="mute">${ic('bell')}${c.muted?'Включить уведомления':'Без звука'}</button>`:''}${(c.type==='group'||c.type==='channel')&&!c.petOn?`<button class="it" data-act="petadd">🥚 Добавить Серийчика</button>`:''}${c.pet&&(c.type==='dm'||c.petOn)?`<button class="it" data-act="pet">🐣 ${esc(c.pet.name||'Серийчик')}</button>`:''}${c.type==='group'?`<button class="it bad" data-act="leave">${ic('x')}Выйти из группы</button>`:''}`,r.left+r.width/2-100,r.bottom);break}
    case 'leave':{if(!el.dataset.sure){el.dataset.sure=1;el.lastChild.textContent='Точно выйти?';return}try{await api('/api/chats/leave',{chat:S.cur});const id2=S.cur;closeLayer();delete S.chats[id2];closeChat()}catch(err){toast(err.message)}break}
    case 'call':startCall(S.cur,el.dataset.k);break;
    case 'gcall':gcStart(S.cur,el.dataset.k);break;
    case 'gc-mic':gcMic();break;case 'gc-cam':gcCam();break;case 'gc-flip':gcFlip();break;case 'gc-screen':gcScreen();break;
    case 'gc-end':gcLeave();break;case 'gc-min':if(GC){GC.min=true;gcRender()}break;case 'gc-max':if(GC){GC.min=false;gcRender()}break;
    case 'gr-yes':if(GR){const g=GR;gcRingClose();if(S.chats[g.chat]&&S.cur!==g.chat){if(S.chats[g.chat].server)S.view=S.chats[g.chat].server;openChat(g.chat)}gcStart(g.chat,g.kind)}break;
    case 'gr-no':gcRingClose();break;
    case 'callu':startCall(el.dataset.chat,el.dataset.k);break;
    case 'c-accept':micCtx();acceptCall();break;
    case 'c-reject':hangup();break;
    case 'c-end':hangup();break;
    case 'c-mic':toggleMic();break;
    case 'c-cam':toggleCam();break;
    case 'c-flip':flipCam();break;
    case 'c-spk':speakerSheet();break;
    case 'spk-out':SPK.sink=el.dataset.id;applySpeaker();soundSheet();break;
    case 'spk-loud':SPK.loud=!SPK.loud;store.set('loud',SPK.loud);applySpeaker();spkLevels();soundSheet();if(CALL)renderCall();if(GC)gcRender();break;
    case 'soundsheet':soundSheet();break;
    case 'c-pad':PAD.edit=false;padSheet();break;
    case 'pad-play':padPlay(id);navigator.vibrate&&navigator.vibrate(8);{const k=el;k.classList.remove('hit');void k.offsetWidth;k.classList.add('hit')}break;
    case 'pad-add':padAdd();break;
    case 'pad-editmode':PAD.edit=!PAD.edit;padSheet();break;
    case 'pad-edit':padEditSheet(id);break;
    case 'pad-save':{const s=PAD.own.find(x=>x.id===id);if(s){s.name=($('#padNm').value.trim()||s.name).slice(0,24);s.e=[...($('#padEm').value.trim()||s.e)].slice(0,2).join('');padSaveOwn()}padSheet();break}
    case 'pad-del':{if(!el.dataset.sure){el.dataset.sure=1;el.textContent='Точно удалить?';return}PAD.own=PAD.own.filter(x=>x.id!==id);padSaveOwn();delete PAD.bufs[id];IDB.del('pad:'+id);if(!PAD.own.length)PAD.edit=false;padSheet();break}
    case 'pad-me':PAD.me=!PAD.me;store.set('padMe',PAD.me);padSheet();break;
    case 'pad-stop':padStop();break;
    case 'mic-ns':MIC.ns=el.dataset.v;micSave();micRecon();soundSheet();break;
    case 'mic-tog':{const k=el.dataset.k;MIC[k]=!MIC[k];micSave();if(k==='ec'||k==='agc')micRecon();soundSheet();break}
    case 'mic-dev':MIC.dev=el.dataset.id;micSave();micReopen();soundSheet();break;
    case 'mic-test':micTest(!MICT.st);break;
    case 'mic-reset':Object.assign(MIC,MIC_DEF);micSave();micReopen();SPK.vol=1;store.set('spkVol',1);applySpeaker();spkLevels();soundSheet();break;
    case 'c-screen':toggleScreen();break;
    case 'c-min':CALL.min=true;renderCall();break;
    case 'c-pop':callPop(false);break;
    case 'c-max':CALL.min=false;renderCall();break;
    case 'theme':store.set('theme',el.dataset.v);applyTheme();settingsSheet();break;
    case 'wall':store.set('wall',el.dataset.w);await IDB.del('wall:app');await applyAppWall();applyTheme();settingsSheet();break;
    case 'notif':if(Notification.permission==='granted')await pushTest();else await pushEnable();settingsSheet();break;
    case 'pushon':await pushEnable();break;
    case 'notifretry':closeLayer();await pushEnable();break;
    case 'aisend':AIbusy?aiStop():aiSend();break;
    case 'airegen':aiSend(true);break;
    case 'aisug':{const q=$('#aiq');if(q){q.value=el.textContent;aiSend()}break}
    case 'aicopy':{const m=aiList()[+el.dataset.i];if(m&&navigator.clipboard)navigator.clipboard.writeText(m.t).then(()=>toast('Скопировано'),()=>{});break}
    case 'aipic':$('#aifile').click();break;
    case 'aiunpic':AIimg=null;aiRe();break;
    case 'aiclear':aiStop();AI=[];store.set('ai',[]);renderSide();break;
    case 'pushno':store.set('pushNo',Date.now());$('#pushask')&&$('#pushask').remove();break;
    case 'bubbles':S.bdraft=null;bubbleSheet();break;
    case 'bstyle':S.bdraft.s=el.dataset.v;bubbleSheet();break;
    case 'bframe':S.bdraft.f=el.dataset.v;bubbleSheet();break;
    case 'bcancel':S.bdraft=null;closeLayer();break;
    case 'bsave':try{const r=await api('/api/me/bubble',S.bdraft);S.me=Object.assign(S.me,r.me);S.users[S.me.id]=S.me;S.bdraft=null;closeLayer();renderMsgs();toast('Стиль сохранён ✨')}catch(err){toast(err.message)}break;
    case 'once':S.once=!S.once;renderOnceBtn();toast(S.once?'🔥 Следующее фото, видео, голосовое или кружок можно будет посмотреть только 1 раз':'Обычная отправка',S.once?4500:1500);break;
    case 'onceopen':onceOpen(el.dataset.id);break;
    case 'onceclose':onceClose();break;
    case 'srcpick':if(S.srcPick)S.srcPick(el.dataset.id);break;
    case 'srccancel':if(S.srcPick)S.srcPick(null);else closeLayer();break;
    case 'vscreen':voiceScreen();break;
    case 'vwatch':voiceWatch(el.dataset.id);break;
    case 'vwclose':voiceWatch(null);break;
    case 'vwfull':{const v=document.querySelector('#vwatch video');if(v){if(document.fullscreenElement)document.exitFullscreen();else (v.requestFullscreen||v.webkitEnterFullscreen||(()=>{})).call(v)}break}
    case 'emocat':S.emoCat=el.dataset.v;renderStickers();break;
    case 'emoins':{const t=$('#txt');if(!t)break;const e=el.dataset.e,a=t.selectionStart??t.value.length,b=t.selectionEnd??a;t.value=t.value.slice(0,a)+e+t.value.slice(b);const p2=a+e.length;if(!touch){t.focus();t.setSelectionRange(p2,p2)}autosize(t);compState&&compState();
      const r=store.get('recentEmo',[]).filter(x=>x!==e);r.unshift(e);store.set('recentEmo',r.slice(0,40));break}
    case 'mute':{const c=S.chats[S.cur];if(!c)break;const r=await api('/api/chats/mute',{chat:c.id,on:!c.muted});S.chats[c.id]=r.chat;toast(r.chat.muted?'Уведомления чата выключены 🔕':'Уведомления чата включены 🔔');closeLayer();renderSide();break}
    case 'install':installSheet();break;
    case 'doinstall':if(deferredInstall){deferredInstall.prompt();deferredInstall=null}closeLayer();break;
    case 'copyname':try{await navigator.clipboard.writeText('@'+S.me.username);toast('Логин скопирован')}catch(err){}break;
    case 'ava':S.avaTarget=null;pickImage(f=>imageEditor(f,'avatar'));break;
    case 'grava':S.avaTarget={chat:S.cur};pickImage(f=>imageEditor(f,'avatar'));break;
    case 'gravadel':try{const r=await api('/api/chats/avatar',{chat:S.cur,img:''});S.chats[r.chat.id]=Object.assign(S.chats[r.chat.id],r.chat);delete S.chats[r.chat.id].avatar;closeLayer();renderSide();renderMain()}catch(err){toast(err.message)}break;
    case 'srvava':S.avaTarget={server:id};pickImage(f=>imageEditor(f,'avatar'));break;
    case 'srvavadel':try{const r=await api('/api/servers/update',{server:id,avatar:''});S.servers[r.server.id]=r.server;closeLayer();renderSide()}catch(err){toast(err.message)}break;
    case 'block':{const uid=el.dataset.id,on=!(S.me.blocked||[]).includes(uid);
      if(on&&!el.dataset.sure){el.dataset.sure=1;el.innerHTML=ic('x')+'Точно заблокировать?';return}
      try{const r=await api('/api/block',{userId:uid,on});S.me.blocked=r.blocked;toast(on?'Заблокировано: этот человек больше не сможет вам писать и звонить':'Разблокировано');closeLayer();renderMain();renderSide()}catch(err){toast(err.message)}break}
    case 'blocklist':blockedSheet();break;
    case 'admin':adminSheet();break;
    case 'adm-q':break;
    case 'adm-ban':{const uid=el.dataset.id,on=el.dataset.on==='1';if(on&&!el.dataset.sure){el.dataset.sure=1;const n=el.querySelector('.nm');if(n)n.textContent='Точно заблокировать?';else el.textContent='Точно?';return}
      try{await api('/api/admin/ban',{userId:uid,on});toast(on?'Аккаунт заблокирован':'Аккаунт разблокирован');await adminSheet(true);adminUser(uid)}catch(err){toast(err.message)}break}
    case 'adm-user':adminUser(el.dataset.id);break;
    case 'admin-back':adminSheet(true);break;
    case 'adm-f':S.admF=el.dataset.v;el.parentNode.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===el));admList();break;
    case 'adm-s':S.admS=el.dataset.v;el.parentNode.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===el));admList();break;
    case 'adm-ann':{const t=$('#admann').value.trim();if(!t){toast('Напишите текст объявления');break}
      if(!el.dataset.sure){el.dataset.sure=1;el.textContent='Точно отправить всем?';return}
      try{const r=await api('/api/admin/announce',{text:t});toast('Объявление отправлено всем');showAnn(r.ann);adminSheet()}catch(err){toast(err.message)}break}
    case 'adm-annoff':try{await api('/api/admin/announce',{text:''});showAnn(null);toast('Объявление убрано');adminSheet()}catch(err){toast(err.message)}break;
    case 'adm-reg':{const open=!el.classList.contains('on');try{const r=await api('/api/admin/reg',{open});el.classList.toggle('on',!r.regClosed);el.setAttribute('aria-checked',!r.regClosed);toast(r.regClosed?'Регистрация закрыта':'Регистрация открыта');S.adm.regClosed=r.regClosed;const sm=el.parentNode.querySelector('small');if(sm)sm.textContent=r.regClosed?'Закрыта — войти могут только те, у кого уже есть аккаунт':'Открыта — любой может создать аккаунт'}catch(err){toast(err.message)}break}
    case 'adm-dm':closeLayer();startDM(el.dataset.id);break;
    case 'adm-copy':try{await navigator.clipboard.writeText(el.dataset.v);toast('Скопировано: '+el.dataset.v)}catch(e){toast(el.dataset.v)}break;
    case 'adm-out':{const n=el.querySelector('.nm');if(!el.dataset.sure){el.dataset.sure=1;n.textContent='Точно завершить все сеансы?';return}
      try{await api('/api/admin/logout',{userId:el.dataset.id});toast('Готово: человек вышел на всех устройствах');n.textContent='Сеансы завершены';delete el.dataset.sure}catch(err){toast(err.message)}break}
    case 'adm-pass':{const n=el.querySelector('.nm');if(!el.dataset.sure){el.dataset.sure=1;n.textContent='Точно сбросить пароль?';return}
      try{const r=await api('/api/admin/resetpass',{userId:el.dataset.id});delete el.dataset.sure;n.textContent='Сбросить пароль';
        $('#admRes').innerHTML=`<div class="adm-ann"><b>Временный пароль:</b> <code class="adm-pw">${esc(r.password)}</code><small>Передайте его человеку — пусть войдёт и сменит пароль в настройках</small><div class="btns" style="margin-top:8px"><button class="gbtn" data-act="adm-copy" data-v="${esc(r.password)}">📋 Скопировать</button></div></div>`}catch(err){toast(err.message)}break}
    case 'annclose':store.set('annSeen',el.dataset.id);{const b=$('#annBar');if(b){b.classList.add('out');setTimeout(()=>b.remove(),300)}}break;
    case 'saveprof':{
      const b={name:$('#pname').value,bio:$('#pbio').value};
      if($('#nwp').value){b.password=$('#op').value;b.newPassword=$('#nwp').value}
      try{const r=await api('/api/profile',b);S.me=S.users[S.me.id]=Object.assign(S.users[S.me.id],r.me);closeLayer();toast('Сохранено');renderSide()}catch(err){toast(err.message)}break}
    case 'logout':if(!el.dataset.sure){el.dataset.sure=1;el.textContent='Точно выйти?';return}await api('/api/logout',{token:store.get('tok','')}).catch(()=>{});store.set('tok','');try{const sub=PUSH_OK&&await (await navigator.serviceWorker.ready).pushManager.getSubscription();if(sub)await api('/api/push/unsub',{endpoint:sub.endpoint})}catch(e){}location.reload();break;
  }
});
document.addEventListener('focusin',e=>{if(e.target.id==='txt'&&mobile()){S.stk=false;renderStickers();setTimeout(()=>{const b=$('#msgs');if(b)b.scrollTop=b.scrollHeight},300)}});
document.addEventListener('submit',e=>{if(e.target.id==='authForm'){e.preventDefault();authSubmit(e.target)}});
document.addEventListener('input',e=>{
  if(e.target.id==='q'){S.q=e.target.value;if(S.tab==='contacts'){$('#list').innerHTML=contactsHTML();return}$('#list').innerHTML=storiesRowHTML()+chatListHTML();clearTimeout(qT);qT=setTimeout(searchUsers,250);return}
  if(e.target.id==='txt'){autosize(e.target);const now=Date.now();if(S.cur&&e.target.value&&(!S.lastTyping||now-S.lastTyping>2500)){S.lastTyping=now;wsSend({t:'typing',chat:S.cur})}}
});
document.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&e.target.matches('.sheet input:not([type=checkbox])')&&!e.isComposing){const b=e.target.closest('.sheet').querySelector('.gbtn.primary');if(b){e.preventDefault();b.click()}return}
  if(e.target.id==='aiq'&&e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();aiSend();return}
  if(e.target.id==='txt'&&e.key==='Enter'&&!e.shiftKey&&!touch&&!e.isComposing){e.preventDefault();sendMsg()}
  if(e.key==='Escape'&&!SV){if($('#layer').innerHTML)closeLayer();else if(S.reply||S.edit){S.reply=S.edit=null;renderCtx()}else if(SE||SC)goBack()}
  if(e.target.id==='txt'&&e.key==='ArrowUp'&&!e.target.value){const l=S.msgs[S.cur]||[];const m=[...l].reverse().find(x=>x.from===S.me.id&&x.text&&!x.del&&!x.pending);if(m){e.preventDefault();S.edit={m};e.target.value=m.text;renderCtx()}}
});
document.addEventListener('change',async e=>{
  if(e.target.id==='aifile'){aiFile(e.target.files[0]);e.target.value='';return}
  if(e.target.id==='file'&&e.target.files[0]){const f=e.target.files[0];e.target.value='';if(/^video\//.test(f.type)){sendVideoFile(f);return}try{const d=await shrink(f);sendMsg(d)}catch(err){toast(err.message)}}
});
/* paste a picture straight into the message box */
document.addEventListener('paste',async e=>{
  if(e.target.id!=='txt')return;const f=[...(e.clipboardData||{}).files||[]].find(x=>x.type.startsWith('image/'));
  if(f){e.preventDefault();try{sendMsg(await shrink(f))}catch(err){toast(err.message)}}
});
/* right click on desktop, long press on phones: message menu */
document.addEventListener('contextmenu',e=>{const sk=e.target.closest('[data-stk]');if(sk){e.preventDefault();stickerMenu(sk.dataset.stk,e.clientX,e.clientY);return}const b=e.target.closest('[data-act="msg"]');if(b&&!e.target.closest('a')){e.preventDefault();msgMenu(b.dataset.id,e.clientX,e.clientY)}});
document.addEventListener('touchstart',e=>{const sk=e.target.closest('[data-stk]');if(sk){const t=e.touches[0];lpFired=false;lpT=setTimeout(()=>{lpFired=true;navigator.vibrate&&navigator.vibrate(12);stickerMenu(sk.dataset.stk,t.clientX,t.clientY)},450);return}const b=e.target.closest('[data-act="msg"]');if(!b)return;const t=e.touches[0];lpFired=false;
  lpT=setTimeout(()=>{lpFired=true;navigator.vibrate&&navigator.vibrate(12);msgMenu(b.dataset.id,t.clientX,t.clientY)},420)},{passive:true});
['touchend','touchmove','touchcancel'].forEach(ev=>document.addEventListener(ev,()=>clearTimeout(lpT),{passive:true}));
/* on phones a short tap on a bubble does nothing; the menu is on long press */
if(touch)document.addEventListener('click',e=>{if(e.target.closest('[data-act="msg"]')&&!e.target.closest('a,[data-act="zoom"],[data-act="jump"],.reacts,[data-act="react"],[data-act="vplay"],[data-act="vseek"],[data-act="vspeed"],[data-act="rnd"],[data-act="playvid"],[data-act="onceopen"]'))e.stopImmediatePropagation()},true);
document.addEventListener('input',e=>{const t=e.target;if(!t.dataset)return;
  if(t.dataset.mic){MIC[t.dataset.mic]=+t.value;store.set('mic',MIC);MICX.live.forEach(ch=>ch.apply());const v=t.parentNode.querySelector('.mv');if(v)v.textContent=t.dataset.mic==='vol'?Math.round(t.value*100)+'%':t.value+' дБ'}
  if(t.dataset.pad){PAD.vol=+t.value;store.set('padVol',PAD.vol);const v=t.parentNode.querySelector('.mv');if(v)v.textContent=Math.round(PAD.vol*100)+'%'}
  if(t.dataset.spk){SPK.vol=+t.value;store.set('spkVol',SPK.vol);applySpeaker();spkLevels();const v=t.parentNode.querySelector('.mv');if(v)v.textContent=Math.round(SPK.vol*100)+'%'}});
document.addEventListener('input',e=>{if(e.target.id==='admq'){const q=e.target.value.toLowerCase();document.querySelectorAll('.adm-row').forEach(x=>x.style.display=x.dataset.q.includes(q)?'':'none')}});
addEventListener('hashchange',()=>{if(hashTab())return;const jm=/^#join\/([\w-]{4,20})$/.exec(location.hash);if(jm&&S.me){history.replaceState(null,'',location.pathname);joinSheet(jm[1])}
  const pm=/^#pack\/(p[\w-]{4,20})$/.exec(location.hash);if(pm&&S.me){history.replaceState(null,'',location.pathname);packPreview(pm[1])}});
addEventListener('resize',()=>{if(S.me)$('#app').classList.toggle('open',!!S.cur)});
setInterval(()=>{if(S.cur)renderStatus()},60e3);

/* the composer stays at the very bottom: the app fills the whole screen, and only while the keyboard covers part of it
   (iPhone: the page itself does not shrink) the app is fitted into the part above the keyboard */
(function(){
  const vv=window.visualViewport,root=document.documentElement;let raf=0;
  const typing=()=>{const a=document.activeElement;return !!a&&(a.tagName==='TEXTAREA'||(a.tagName==='INPUT'&&!/^(checkbox|radio|range|button|file|color)$/.test(a.type))||a.isContentEditable)};
  const set=()=>{raf=0;if(!vv)return;
    const kb=touch&&typing()&&innerHeight-vv.height>120;
    root.classList.toggle('kb',kb);
    if(kb){root.style.setProperty('--app-h',Math.round(vv.height)+'px');root.style.setProperty('--vv-top',Math.round(vv.offsetTop)+'px')}
    else{root.style.setProperty('--app-h',innerHeight+'px');root.style.removeProperty('--vv-top');if(scrollY)scrollTo(0,0)}};
  const q=()=>{if(!raf)raf=requestAnimationFrame(set)};
  set();
  if(vv){vv.addEventListener('resize',q);vv.addEventListener('scroll',q)}
  addEventListener('resize',q);addEventListener('orientationchange',()=>setTimeout(set,300));
  addEventListener('pageshow',q);document.addEventListener('visibilitychange',q);
  document.addEventListener('focusin',q);document.addEventListener('focusout',()=>{q();setTimeout(set,120);setTimeout(set,450)});
  [100,500,1500].forEach(t=>setTimeout(set,t));
})();
/* service worker: lets the site be installed as an app */
if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'}).then(r=>r.update()).catch(()=>{}));
/* the files this page was built from carry a fingerprint; if the server has newer ones,
   drop every saved copy and reload once, so an update always shows up */
/* this script's own version comes from its address (?v=…), which the server sets */
const MY_V=(()=>{try{return new URL(document.currentScript.src).searchParams.get('v')||''}catch(e){return ''}})();
let SERVER_V='';
async function checkVersion(){
  try{
    const {v}=await (await fetch('/api/version',{cache:'no-store'})).json();SERVER_V=v;
    if(v&&v!=='dev'&&MY_V&&v!==MY_V){
      let last=0;try{last=+sessionStorage.getItem('mn.upd')||0}catch(e){}
      if(Date.now()-last>60e3)updateNow(); /* at most once a minute, so it can never loop */
    }
  }catch(e){}
}
async function updateNow(){
  try{sessionStorage.setItem('mn.upd',String(Date.now()))}catch(e){}
  try{const ks=await caches.keys();await Promise.all(ks.filter(k=>k!=='mn-img').map(k=>caches.delete(k)))}catch(e){}
  try{const rs=await navigator.serviceWorker.getRegistrations();await Promise.all(rs.map(r=>r.update()))}catch(e){}
  if(CALL||VC){toast('Вышло обновление Manasenger — оно применится после звонка');return}
  location.reload();
}
checkVersion();setInterval(checkVersion,5*60e3);document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkVersion()});
boot();
/* while a list is scrolling, decorative animations rest so every frame goes to the scroll itself */
(function(){let t=0;const root=document.documentElement;
  let box=null;
  document.addEventListener('scroll',e=>{const b=e.target&&e.target.classList?e.target:root;
    if(b!==box){if(box)box.classList.remove('scrolling');box=b;b.classList.add('scrolling')}
    clearTimeout(t);t=setTimeout(()=>{if(box)box.classList.remove('scrolling');box=null},140)},{capture:true,passive:true});
})();

