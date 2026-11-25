/* Manasenger — messenger client: chats, calls, video calls, screen sharing */
'use strict';
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store={get(k,d){try{const v=localStorage.getItem('glint.'+k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem('glint.'+k,JSON.stringify(v))}catch(e){}}};
const touch=matchMedia('(pointer:coarse)').matches;
const mobile=()=>innerWidth<=760;

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
  home:'<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-4-.9L3 20l1.1-4A8.4 8.4 0 1 1 21 11.5Z"/>'
};
const ic=(n,cls='ico')=>`<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;
const TICK1='<svg viewBox="0 0 16 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m1.5 6.5 3.2 3L11 2.5"/></svg>';
const TICK2='<svg viewBox="0 0 16 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m1 6.5 3.2 3L10.5 2.5M7.5 9.2 14.5 2.5"/></svg>';

/* ---------- state ---------- */
const S={me:null,chats:{},users:{},msgs:{},more:{},cur:null,tab:'chats',q:'',found:[],typing:{},reply:null,edit:null,calls:null,draft:{},servers:{},view:'home',win:{},stickers:[],stk:false};
const WIN=120; /* messages kept on screen at once; older ones appear on demand */

/* ---------- helpers ---------- */
async function api(path,body){
  const r=await fetch(path,body===undefined?{credentials:'same-origin'}:{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  let j=null;try{j=await r.json()}catch(e){}
  if(!r.ok)throw new Error((j&&j.error)||'Нет связи с сервером');
  return j;
}
let tt;function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>e.classList.remove('on'),2800)}
const initials=n=>String(n||'?').trim().split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase()||'?';
function avatar(u,size='',dot=true){
  if(!u)return `<span class="ava ${size}">?</span>`;
  return `<span class="ava ${size}" style="--c:${esc(u.color||'#5b8cff')}">${u.avatar?`<img src="${esc(u.avatar)}" alt="">`:esc(initials(u.name))}${dot&&u.online?'<i class="dot"></i>':''}</span>`;
}
function chatAvatar(c,size){
  if(c.type==='dm')return avatar(peerOf(c),size);
  if(c.type==='channel'){const g=S.servers[c.server]||{};return `<span class="ava ${size}" style="--c:${esc(g.color||'#5f8cc0')}">#</span>`}
  return `<span class="ava ${size}" style="--c:${esc(c.color||'#9b6bff')}">${esc(initials(c.name))}</span>`;
}
const peerOf=c=>S.users[c.members.find(m=>m!==S.me.id)]||{name:'Удалённый аккаунт',color:'#777'};
const chatName=c=>c.type==='dm'?peerOf(c).name:c.type==='channel'?'# '+c.name:c.name;
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
  if(m.call)return (m.call.kind==='video'?'📹 ':'📞 ')+(m.call.missed?'Пропущенный звонок':'Звонок, '+durText(m.call.dur));
  const who=m.from===S.me.id?'Вы: ':'';if(m.sticker)return who+'Стикер';return who+(m.img&&!m.text?'📷 Фото':(m.img?'📷 ':'')+m.text);
}
const sortedChats=()=>Object.values(S.chats).filter(c=>c.type!=='channel').sort((a,b)=>((b.last&&b.last.ts)||b.created)-((a.last&&a.last.ts)||a.created));

/* ---------- theme ---------- */
function applyTheme(){
  const t=store.get('theme','auto'),light=t==='light'||(t==='auto'&&matchMedia('(prefers-color-scheme: light)').matches);
  document.documentElement.classList.toggle('light',light);
  $('.wall').dataset.w=store.get('wall','slate');
  document.querySelector('meta[name=theme-color]').content=light?'#e4eaf1':'#18202b';
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
function notify(title,body,tag){
  if(!('Notification' in window)||Notification.permission!=='granted'||!document.hidden)return;
  try{const n=new Notification(title,{body,tag,icon:'/icon-192.png'});n.onclick=()=>{focus();n.close()}}catch(e){}
}
function updateTitle(){const n=Object.values(S.chats).reduce((a,c)=>a+(c.unread||0),0);document.title=n?`(${n}) Manasenger`:'Manasenger'}

/* =================================================================== AUTH */
let authMode='login';
function viewAuth(){
  $('#app').className='auth';
  $('#app').innerHTML=`<form class="card glass" id="authForm" autocomplete="on">
    <img class="logo" src="/icon-192.png" alt="">
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
  try{await api(authMode==='reg'?'/api/register':'/api/login',d);await boot()}
  catch(e){$('#authErr').textContent=e.message;b.disabled=false}
}

/* =================================================================== BOOT */
async function boot(){
  let r;try{r=await api('/api/me')}catch(e){$('#app').innerHTML=`<div class="auth"><div class="card glass empty"><b>Нет связи</b>Проверь интернет и обнови страницу.</div></div>`;return}
  if(!r.me){viewAuth();return}
  S.me=r.me;S.chats={};r.chats.forEach(c=>S.chats[c.id]=c);r.users.forEach(u=>S.users[u.id]=u);S.users[S.me.id]=S.me;
  S.servers={};(r.servers||[]).forEach(g=>S.servers[g.id]=g);S.stickers=r.stickers||[];
  $('#app').className='app';applyAppWall();
  renderShell();connect();updateTitle();
  const h=location.hash.slice(1),jm=/^join\/([\w-]{4,20})$/.exec(h);
  if(jm){history.replaceState(null,'',location.pathname);joinSheet(jm[1]);return}
  if(h&&S.chats[h]){if(S.chats[h].server)S.view=S.chats[h].server;openChat(h)}
}
function renderShell(){
  $('#app').innerHTML=`<nav class="rail glass" id="rail" aria-label="Серверы"></nav><aside class="side glass" id="side"></aside><main class="main glass" id="main"></main>`;
  renderRail();renderSide();renderMain();
}

/* =================================================================== SIDEBAR */
let sideQ=0;
function renderSide(){if(sideQ)return;sideQ=requestAnimationFrame(()=>{sideQ=0;renderSideNow();renderRail()})}
function renderSideNow(){
  const el=$('#side');if(!el)return;
  el.classList.toggle('has-voice',!!VC);
  if(S.view!=='home'&&S.servers[S.view]){el.innerHTML=serverSideHTML(S.servers[S.view])+voicePanelHTML();return}
  S.view='home';
  const keep=document.activeElement&&document.activeElement.id==='q';
  const head=S.tab==='calls'?'Звонки':'Чаты';
  el.innerHTML=`<div class="side-h"><h1>${head}</h1>
      <button class="gbtn ic" data-act="newgroup" title="Новая группа" aria-label="Новая группа">${ic('users')}</button>
      <button class="gbtn ic" data-act="newchat" title="Новый чат" aria-label="Новый чат">${ic('edit')}</button></div>
    ${S.tab==='chats'?`<label class="search">${ic('search')}<input id="q" placeholder="Поиск или @логин" value="${esc(S.q)}" autocomplete="off" spellcheck="false"></label>`:''}
    <div class="list" id="list">${S.tab==='chats'?chatListHTML():callsHTML()}</div>
    <nav class="tabbar glass pill">
      <button class="${S.tab==='chats'?'on':''}" data-act="tab" data-t="chats">${ic('chats')}Чаты</button>
      <button class="${S.tab==='calls'?'on':''}" data-act="tab" data-t="calls">${ic('calls')}Звонки</button>
      <button data-act="settings">${S.me.avatar?avatar(S.me,'xs',false):ic('gear')}Настройки</button></nav>${voicePanelHTML()}`;
  if(keep){const i=$('#q');i.focus();i.setSelectionRange(i.value.length,i.value.length)}
}
function chatListHTML(){
  const q=S.q.trim().toLowerCase().replace(/^@/,'');
  let list=sortedChats();
  if(q)list=list.filter(c=>chatName(c).toLowerCase().includes(q)||(c.type==='dm'&&peerOf(c).username.includes(q)));
  let h=list.map(c=>{
    const typ=S.typing[c.id]&&Object.keys(S.typing[c.id]).length;
    return `<button class="row ${S.cur===c.id?'on':''}" data-act="open" data-id="${c.id}">${chatAvatar(c)}
      <span class="mid"><span class="top"><span class="nm">${esc(chatName(c))}</span><span class="tm">${c.last?shortWhen(c.last.ts):''}</span></span>
      <span class="sub"><span class="lm">${typ?'<i style="color:#9fbaff">печатает…</i>':esc(lastText(c.last))}</span>${c.unread?`<span class="badge">${c.unread>99?'99+':c.unread}</span>`:''}</span></span></button>`}).join('');
  if(q.length>=2){
    const known=new Set(list.filter(c=>c.type==='dm').map(c=>peerOf(c).id));
    const ppl=S.found.filter(u=>!known.has(u.id));
    if(ppl.length)h+=`<div class="section-t">Люди</div>`+ppl.map(u=>`<button class="row" data-act="dm" data-id="${u.id}">${avatar(u)}<span class="mid"><span class="top"><span class="nm">${esc(u.name)}</span></span><span class="sub"><span class="lm">@${esc(u.username)}</span></span></span></button>`).join('');
  }
  if(!h)h=q?`<div class="empty">Никого не нашли по «${esc(S.q)}»</div>`:`<div class="empty"><b>Пока пусто</b>Найди друга по логину в поиске или нажми ${ic('edit')} вверху.<br><br>Твой логин: <b style="display:inline">@${esc(S.me.username)}</b></div>`;
  return h;
}
function callsHTML(){
  if(!S.calls){loadCalls();return '<div class="empty">Загружаем…</div>'}
  if(!S.calls.length)return `<div class="empty"><b>Звонков ещё не было</b>Открой чат и нажми ${ic('phone')} или ${ic('video')}</div>`;
  return S.calls.map(c=>{const u=S.users[c.user];if(!u)return '';
    return `<div class="row"><span style="display:contents">${avatar(u)}</span>
      <button class="mid" style="text-align:left" data-act="open" data-id="${c.chat}"><span class="top"><span class="nm" style="${c.missed&&!c.out?'color:#ff8a94':''}">${esc(u.name)}</span><span class="tm">${shortWhen(c.ts)}</span></span>
      <span class="sub"><span class="lm">${c.out?'↗ Исходящий':'↙ Входящий'} ${c.kind==='video'?'видеозвонок':'звонок'}${c.missed?' · без ответа':' · '+durText(c.dur)}</span></span></button>
      <button class="gbtn ic" data-act="callu" data-chat="${c.chat}" data-k="${c.kind}" aria-label="Позвонить">${ic(c.kind==='video'?'video':'phone')}</button></div>`}).join('');
}
async function loadCalls(){try{const r=await api('/api/calls');r.users.forEach(u=>S.users[u.id]=Object.assign(S.users[u.id]||{},u));S.calls=r.calls}catch(e){S.calls=[]}if(S.tab==='calls')renderSide()}
let qT;async function searchUsers(){
  const q=S.q.trim();if(q.replace(/^@/,'').length<2){S.found=[];return}
  try{const r=await api('/api/users/search?q='+encodeURIComponent(q));if(q===S.q.trim()){S.found=r.users;$('#list').innerHTML=chatListHTML()}}catch(e){}
}

/* =================================================================== CHAT */
function renderMain(){
  const el=$('#main');if(!el)return;
  const c=S.chats[S.cur];
  $('#app').classList.toggle('open',!!c);
  if(!c){el.innerHTML=`<div class="nochat">${avatar(S.me,'l',false)}<b style="font-size:20px;display:block;margin-bottom:6px">Привет, ${esc(S.me.name)}!</b>Выбери чат слева или найди друга по логину.<br>Твой логин: <b>@${esc(S.me.username)}</b></div>`;return}
  el.innerHTML=`<div class="chat-bg" id="chatbg"></div><header class="chat-h glass pill">
      <button class="gbtn ic back" data-act="back" aria-label="Назад">${ic('back')}</button>
      <button class="who" data-act="info">${chatAvatar(c,'s')}<span style="min-width:0"><b>${esc(chatName(c))}</b><small id="status"></small></span></button>
      ${c.type==='dm'?`<button class="gbtn ic" data-act="call" data-k="audio" title="Аудиозвонок" aria-label="Аудиозвонок">${ic('phone')}</button><button class="gbtn ic" data-act="call" data-k="video" title="Видеозвонок" aria-label="Видеозвонок">${ic('video')}</button>`:''}
      <button class="gbtn ic" data-act="chatmenu" aria-label="Ещё">${ic('more')}</button></header>
    <div class="msgs" id="msgs"></div>
    <div class="composer">
      <div id="stkp"></div>
      <div id="ctx"></div>
      <div class="comp-row">
        <button class="gbtn ic glass cbig" data-act="attach" title="Фото" aria-label="Прикрепить фото">${ic('clip')}</button>
        <div class="comp-in glass pill"><textarea id="txt" rows="1" placeholder="Сообщение" maxlength="4000" aria-label="Сообщение" enterkeyhint="send"></textarea>
          <button class="gbtn ic stkbtn" data-act="stk" title="Стикеры" aria-label="Стикеры">${ic('smile')}</button>
          <button class="sendb" data-act="send" aria-label="Отправить">${ic('send')}</button></div>
      </div></div>
    <input type="file" id="file" accept="image/*" hidden>`;
  const t=$('#txt');t.value=S.draft[c.id]||'';autosize(t);
  renderStatus();renderCtx();renderMsgs(true);applyChatWall(c.id);S.stk=false;
  if(!mobile())t.focus();
}
function renderStatus(){
  const el=$('#status'),c=S.chats[S.cur];if(!el||!c)return;
  const ty=Object.keys(S.typing[c.id]||{});
  if(ty.length){el.className='typing';el.textContent=c.type==='dm'?'печатает…':`${ty.map(i=>(S.users[i]||{}).name).join(', ')} печатает…`;return}
  if(c.type==='channel'){el.className='';const g=S.servers[c.server];el.textContent=g?g.name+' · '+g.members.filter(i=>(S.users[i]||{}).online).length+' в сети':'';return}
  el.className='';el.textContent=c.type==='dm'?seen(peerOf(c)):`${c.members.length} участник${c.members.length%10===1&&c.members.length!==11?'':c.members.length%10>=2&&c.members.length%10<=4&&(c.members.length<12||c.members.length>14)?'а':'ов'}`;
}
async function openChat(id){
  if(S.chats[id]&&S.chats[id].server)S.view=S.chats[id].server;else if(S.chats[id])S.view='home';
  if(S.cur&&$('#txt'))S.draft[S.cur]=$('#txt').value;
  S.cur=id;S.reply=S.edit=null;
  history.replaceState(null,'','#'+id);
  renderSide();renderMain();
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
function closeChat(){if(S.cur&&$('#txt'))S.draft[S.cur]=$('#txt').value;S.cur=null;history.replaceState(null,'',location.pathname);renderSide();renderMain()}

function isRead(c,m){
  const r=c.read||{};
  return c.members.some(u=>u!==S.me.id&&(r[u]||0)>=m.ts);
}
function msgHTML(c,m,prev,next){
  if(m.sys)return `<div class="sys glass pill">${esc(m.sys)}</div>`;
  const me=m.from===S.me.id,u=S.users[m.from]||{name:'?'};
  const tail=!next||next.from!==m.from||next.sys||next.ts-m.ts>300e3||new Date(next.ts).toDateString()!==new Date(m.ts).toDateString();
  const head=!prev||prev.from!==m.from||prev.sys||m.ts-prev.ts>300e3;
  const ticks=me&&!m.pending?`<span class="${isRead(c,m)?'rd':''}">${isRead(c,m)?TICK2:TICK1}</span>`:me?'<span>🕓</span>':'';
  const meta=`<span class="meta">${m.edited?'изм. ':''}${tm(m.ts)}${ticks}</span>`;
  let inner;
  if(m.del)inner=`<span class="del">Сообщение удалено</span>${meta}`;
  else if(m.sticker){
    const re2=m.react&&Object.keys(m.react).length?`<div class="reacts">${Object.entries(m.react).map(([e,l])=>`<button class="${l.includes(S.me.id)?'mine':''}" data-act="react" data-id="${m.id}" data-e="${e}">${e} ${l.length>1?l.length:''}</button>`).join('')}</div>`:'';
    return `<div class="m ${me?'me':''} tail" data-id="${m.id}">${c.type!=='dm'&&!me?avatar(u,'xs',false):''}<div class="bub stkb" data-act="msg" data-id="${m.id}">${c.type!=='dm'&&!me&&head?`<div class="au" style="color:${esc(u.color)}">${esc(u.name)}</div>`:''}<img class="stk" src="${esc(m.sticker)}" alt="Стикер" loading="lazy">${meta}${re2}</div></div>`;
  }
  else if(m.call){
    const miss=m.call.missed,out=m.from===S.me.id;
    return `<div class="m ${me?'me':''} tail" data-id="${m.id}"><div class="bub callm ${miss?'miss':''}"><span class="ci">${ic(m.call.kind==='video'?'video':'phone')}</span>
      <span><b>${out?'Исходящий':'Входящий'} ${m.call.kind==='video'?'видеозвонок':'звонок'}</b><br><small style="opacity:.75">${miss?(out?'Без ответа':'Пропущенный'):durText(m.call.dur)} · ${tm(m.ts)}</small></span></div></div>`;
  }else{
    inner=(c.type!=='dm'&&!me&&head?`<div class="au" style="color:${esc(u.color)}">${esc(u.name)}</div>`:'')+
      (m.reply?`<button class="rq" data-act="jump" data-id="${esc(m.reply.id)}"><b>${esc((S.users[m.reply.from]||{}).name||'')}</b><span>${esc(m.reply.text)}</span></button>`:'')+
      (m.img?`<img class="pic" src="${esc(m.img)}" alt="Фото" data-act="zoom" loading="lazy">`:'')+
      (m.text?`<span class="tx">${linkify(m.text)}</span>`:'')+meta;
  }
  const re=m.react&&Object.keys(m.react).length?`<div class="reacts">${Object.entries(m.react).map(([e,l])=>`<button class="${l.includes(S.me.id)?'mine':''}" data-act="react" data-id="${m.id}" data-e="${e}">${e} ${l.length>1?l.length:''}</button>`).join('')}</div>`:'';
  return `<div class="m ${me?'me':''} ${tail?'tail':''}" data-id="${m.id}">${c.type!=='dm'&&!me?avatar(u,'xs',false):''}<div class="bub" data-act="msg" data-id="${m.id}">${inner}${re}</div></div>`;
}
function linkify(t){
  return esc(t).replace(/\bhttps?:\/\/[^\s<]+[^\s<.,:;"')\]!?]/g,u=>`<a href="${u}" target="_blank" rel="noopener noreferrer">${u}</a>`);
}
function renderMsgs(toBottom){
  const box=$('#msgs'),c=S.chats[S.cur];if(!box||!c)return;
  const list=S.msgs[c.id];
  if(!list){box.innerHTML='<div class="sys">Загружаем…</div>';return}
  const near=box.scrollHeight-box.scrollTop-box.clientHeight<140;
  const win=S.win[c.id]||WIN,from=Math.max(0,list.length-win),shown=list.slice(from);
  let h=(from>0||S.more[c.id])?`<button class="gbtn more" data-act="older">Показать раньше</button>`:'';
  if(!list.length)h+=`<div class="sys glass pill" style="margin-top:auto">${c.type==='channel'?'Это начало канала '+esc(chatName(c))+' 👋':'Напиши первое сообщение 👋'}</div>`;
  let day='';
  const fresh=S.fresh;S.fresh=null;
  shown.forEach((m,i)=>{const d=new Date(m.ts).toDateString();if(d!==day){day=d;h+=`<div class="day glass pill">${dayLabel(m.ts)}</div>`}let x=msgHTML(c,m,shown[i-1],shown[i+1]);if(fresh===m.id)x=x.replace('class="m ','class="m new ');h+=x});
  const prevH=box.scrollHeight,prevT=box.scrollTop;
  box.innerHTML=h;
  if(toBottom||near)box.scrollTop=box.scrollHeight;else if(toBottom===null)box.scrollTop=box.scrollHeight-prevH+prevT;
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
  el.innerHTML=`<div class="ctx-bar glass pill">${ic(S.edit?'edit':'reply')}<span class="mid"><b>${S.edit?'Редактирование':'Ответ '+esc((S.users[m.from]||{}).name||'')}</b><span>${esc(m.text||(m.img?'📷 Фото':''))}</span></span>
    <button class="gbtn ic" data-act="ctxx" aria-label="Отменить">${ic('x')}</button></div>`;
}
function autosize(t){t.style.height='auto';t.style.height=Math.min(140,t.scrollHeight)+'px'}
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
  wsSend({t:'send',chat:c.id,text,img,reply:S.reply&&S.reply.m.id,cid});
  S.reply=null;t.value='';S.draft[c.id]='';autosize(t);renderCtx();renderMsgs(true);
}
/* images are shrunk in the browser before sending: max 1600 px, JPEG */
function shrink(file,max=1600,q=.82){
  return new Promise((ok,bad)=>{
    if(!/^image\//.test(file.type))return bad(new Error('Это не картинка'));
    const img=new Image(),url=URL.createObjectURL(file);
    img.onload=()=>{
      let w=img.naturalWidth,h=img.naturalHeight;const k=Math.min(1,max/Math.max(w,h));w=Math.round(w*k);h=Math.round(h*k);
      const cv=document.createElement('canvas');cv.width=w;cv.height=h;cv.getContext('2d').drawImage(img,0,0,w,h);URL.revokeObjectURL(url);
      let d=cv.toDataURL('image/jpeg',q);
      while(d.length>1.25e6&&q>.4){q-=.12;d=cv.toDataURL('image/jpeg',q)}
      d.length>1.6e6?bad(new Error('Картинка слишком большая')):ok(d);
    };
    img.onerror=()=>bad(new Error('Не удалось открыть картинку'));img.src=url;
  });
}

/* ---------- message menu: the "click GUI" ---------- */
function msgMenu(id,x,y){
  const l=S.msgs[S.cur]||[],m=l.find(v=>v.id===id);if(!m||m.del||m.pending||m.sys)return;
  const me=m.from===S.me.id;
  const items=[['reply','reply','Ответить'],m.sticker&&!S.stickers.some(x=>x.img===m.sticker)?['savestk','save','Сохранить стикер']:null,m.text?['copy','copy','Копировать']:null,me&&m.text&&!m.call?['edit','edit','Изменить']:null,me&&!m.call?['del','trash','Удалить','bad']:null].filter(Boolean);
  if(m.call)return;
  openMenu(`<div class="emo">${['❤️','👍','😂','😮','😢','🔥'].map(e=>`<button data-act="react" data-id="${m.id}" data-e="${e}">${e}</button>`).join('')}</div>`+
    items.map(([a,i,t,cls])=>`<button class="it ${cls||''}" data-act="mm-${a}" data-id="${m.id}">${ic(i)}${t}</button>`).join(''),x,y);
}
function openMenu(html,x,y){
  const L=$('#layer');L.innerHTML=`<div class="scrim clear" data-act="closemenu"></div><div class="menu glass" id="menu" role="menu">${html}</div>`;
  const mn=$('#menu'),w=mn.offsetWidth,h=mn.offsetHeight;
  const left=Math.max(10,Math.min(x-w/2,innerWidth-w-10)),top=y+h+20>innerHeight?Math.max(10,y-h-10):y+10;
  mn.style.left=left+'px';mn.style.top=top+'px';mn.style.setProperty('--ox',(x-left)+'px');mn.style.setProperty('--oy',(y<top?0:h)+'px');
}
function closeLayer(){$('#layer').innerHTML=''}
function sheet(html){$('#layer').innerHTML=`<div class="scrim" data-act="closemenu"></div><div class="sheet glass" role="dialog" aria-modal="true">${html}</div>`}

/* ---------- new chat / new group / info / settings ---------- */
function newChatSheet(group){
  const sel=new Set();
  sheet(`<h2>${group?'Новая группа':'Новый чат'}</h2><p class="sub">${group?'Назови группу и отметь участников':'Найди человека по логину или имени'}</p>
    ${group?`<label class="field"><span>Название</span><input class="input" id="gname" maxlength="40" placeholder="Например, Семья"></label><div class="chips" id="chips"></div>`:''}
    <label class="search" style="margin:0 0 10px">${ic('search')}<input id="pq" placeholder="@логин или имя" autocomplete="off" spellcheck="false"></label>
    <div class="pick-list" id="pl"><div class="empty" style="padding:20px">Начни вводить — от 2 букв</div></div>
    ${group?`<div class="btns"><button class="gbtn" data-act="closemenu">Отмена</button><button class="gbtn primary" id="gcreate">Создать</button></div>`:''}`);
  const known=()=>{const s=new Map();Object.values(S.chats).forEach(c=>c.members.forEach(m=>{if(m!==S.me.id&&S.users[m])s.set(m,S.users[m])}));return [...s.values()]};
  const draw=list=>{
    $('#pl').innerHTML=list.length?list.map(u=>`<button class="row ${sel.has(u.id)?'sel':''}" data-pick="${u.id}">${avatar(u)}<span class="mid"><span class="top"><span class="nm">${esc(u.name)}</span></span><span class="sub"><span class="lm">@${esc(u.username)}</span></span></span>${group?`<span class="check">${sel.has(u.id)?ic('check'):''}</span>`:''}</button>`).join(''):'<div class="empty" style="padding:20px">Никого не нашли</div>';
    if(group)$('#chips').innerHTML=[...sel].map(i=>`<span class="chip">${avatar(S.users[i],'xs',false)}${esc(S.users[i].name)}</span>`).join('');
  };
  let last=[];
  const k=known();if(k.length){last=k;draw(k)}
  let t;$('#pq').addEventListener('input',e=>{clearTimeout(t);const q=e.target.value.trim();t=setTimeout(async()=>{
    if(q.replace(/^@/,'').length<2){last=k;draw(k);return}
    try{const r=await api('/api/users/search?q='+encodeURIComponent(q));r.users.forEach(u=>S.users[u.id]=Object.assign(S.users[u.id]||{},u));last=r.users;draw(r.users)}catch(err){}
  },250)});
  $('#pl').addEventListener('click',async e=>{
    const b=e.target.closest('[data-pick]');if(!b)return;const id=b.dataset.pick;
    if(!group){closeLayer();startDM(id);return}
    sel.has(id)?sel.delete(id):sel.add(id);draw(last);
  });
  if(group)$('#gcreate').onclick=async()=>{
    try{const r=await api('/api/chats/group',{name:$('#gname').value,members:[...sel]});r.users.forEach(u=>S.users[u.id]=u);S.chats[r.chat.id]=r.chat;closeLayer();openChat(r.chat.id)}catch(e){toast(e.message)}
  };
  setTimeout(()=>{const i=group?$('#gname'):$('#pq');if(i&&!touch)i.focus()},50);
}
async function startDM(uid){
  try{const r=await api('/api/chats/dm',{userId:uid});r.users.forEach(u=>S.users[u.id]=u);S.chats[r.chat.id]=Object.assign(S.chats[r.chat.id]||{},r.chat);S.q='';openChat(r.chat.id)}catch(e){toast(e.message)}
}
function infoSheet(){
  const c=S.chats[S.cur];if(!c)return;
  if(c.type==='channel'){const g=S.servers[c.server];if(g)serverSheet(g);return}
  if(c.type==='dm'){const u=peerOf(c);
    sheet(`<div class="prof">${avatar(u,'xl')}<h3>${esc(u.name)}</h3><small>@${esc(u.username)} · ${esc(seen(u))}</small>${u.bio?`<p style="margin:8px 0 0">${esc(u.bio)}</p>`:''}</div>
      <div class="btns" style="justify-content:center"><button class="gbtn" data-act="call" data-k="audio">${ic('phone')}Звонок</button><button class="gbtn" data-act="call" data-k="video">${ic('video')}Видео</button></div>`);return}
  sheet(`<div class="prof">${chatAvatar(c,'xl')}<h3>${esc(c.name)}</h3><small>${c.members.length} участников</small></div>
    <div class="section-t">Участники</div>${c.members.map(i=>S.users[i]).filter(Boolean).map(u=>`<div class="row">${avatar(u,'s')}<span class="mid"><span class="top"><span class="nm">${esc(u.name)}${u.id===c.admin?' <small style="color:var(--fg3)">админ</small>':''}</span></span><span class="sub"><span class="lm">${esc(seen(u))}</span></span></span></div>`).join('')}
    <div class="btns"><button class="gbtn danger" data-act="leave">Выйти из группы</button></div>`);
}
function settingsSheet(){
  const me=S.me,th=store.get('theme','auto'),w=store.get('wall','slate');
  const np='Notification' in window?Notification.permission:'unsupported';
  sheet(`<div class="prof"><button data-act="ava" title="Сменить аватарку" aria-label="Сменить аватарку">${avatar(me,'xl',false)}</button><div class="btns" style="justify-content:center;margin:4px 0 0"><button class="gbtn" data-act="ava">${ic('image')}Сменить аватарку</button>${me.avatar?`<button class="gbtn" data-act="avadel">Убрать</button>`:''}</div></div>
    <label class="field"><span>Имя</span><input class="input" id="pname" maxlength="40" value="${esc(me.name)}"></label>
    <label class="field"><span>О себе</span><input class="input" id="pbio" maxlength="140" value="${esc(me.bio||'')}" placeholder="Пара слов о себе"></label>
    <div class="set-row"><span class="mid"><b>Логин</b><small>@${esc(me.username)} — по нему тебя находят</small></span><button class="gbtn" data-act="copyname">${ic('copy')}</button></div>
    <div class="set-row"><span class="mid"><b>Тема</b></span><div class="seg" style="width:220px">${[['auto','Авто'],['light','Светлая'],['dark','Тёмная']].map(([k,n])=>`<button class="${th===k?'on':''}" data-act="theme" data-v="${k}">${n}</button>`).join('')}</div></div>
    <div class="set-row" style="display:block"><b>Обои</b><div class="walls" style="margin-top:8px">${[['slate','Сланец'],['steel','Сталь'],['mist','Туман'],['ocean','Море']].map(([k,n])=>`<button class="${w===k&&!S.appWall?'on':''}" data-act="wall" data-w="${k}" aria-label="${n}" title="${n}"></button>`).join('')}<button class="wall-pick ${S.appWall?'on':''}" data-act="appwall" title="Своё фото" aria-label="Обои из галереи" ${S.appWall?`style="background-image:url('${S.appWall}')"`:''}>${S.appWall?'':ic('image')}</button></div>${S.appWall?'<div class="btns" style="margin-top:8px"><button class="gbtn" data-act="appwalldel">Убрать своё фото</button></div>':''}</div>
    <div class="set-row"><span class="mid"><b>Уведомления</b><small>${np==='granted'?'включены':np==='denied'?'запрещены в браузере':np==='unsupported'?'не поддерживаются':'выключены'}</small></span>${np==='default'?'<button class="gbtn" data-act="notif">Включить</button>':''}</div>
    <div class="set-row"><span class="mid"><b>Приложение</b><small>Установи Manasenger на телефон или ПК · версия ${esc(SERVER_V||'—')}</small></span><button class="gbtn" data-act="install">Как?</button></div>
    <details class="set-row" style="display:block"><summary style="cursor:pointer;font-weight:600">Сменить пароль</summary>
      <label class="field" style="margin-top:10px"><span>Текущий пароль</span><input class="input" id="op" type="password" autocomplete="current-password"></label>
      <label class="field"><span>Новый пароль</span><input class="input" id="nwp" type="password" minlength="6" autocomplete="new-password"></label></details>
    <div class="btns"><button class="gbtn danger" data-act="logout">Выйти</button><button class="gbtn primary" data-act="saveprof">Сохранить</button></div>`);
}
function installSheet(){
  sheet(`<h2>Установить Manasenger</h2><p class="sub">Manasenger работает как приложение: своя иконка, отдельное окно, уведомления.</p>
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
      try{const r=await api('/api/me');if(!r.me)return location.reload();r.chats.forEach(c=>S.chats[c.id]=c);r.users.forEach(u=>S.users[u.id]=u);S.servers={};(r.servers||[]).forEach(g=>S.servers[g.id]=g);if(VC)voiceRejoin();
        if(S.cur){const m=await api('/api/messages?chat='+S.cur);S.msgs[S.cur]=m.messages;S.more[S.cur]=m.more}
        Object.keys(S.msgs).forEach(k=>{if(k!==S.cur)delete S.msgs[k]});renderSide();renderMsgs();renderStatus();markRead();updateTitle()}catch(e){}
    }
    wsTry=0;
  };
  WS.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch(x){return}onWS(m)};
  WS.onclose=()=>{wsTry++;wsTimer=setTimeout(connect,Math.min(15000,600*2**Math.min(wsTry,5)))};
}
function wsSend(o){if(WS&&WS.readyState===1){WS.send(JSON.stringify(o));return true}return false}
function onWS(m){
  switch(m.t){
    case 'msg':{
      const c=S.chats[m.chat];if(!c)return;
      const l=S.msgs[m.chat]||(S.cur===m.chat?(S.msgs[m.chat]=[]):null);
      if(l){if(!l.some(x=>x.id===m.msg.id)){
        if(m.msg.from===S.me.id){const i=l.findIndex(x=>x.pending&&x.text===m.msg.text&&!!x.img===!!m.msg.img);if(i>=0)l.splice(i,1)}
        l.push(m.msg)}}
      c.last=m.msg;
      if(S.typing[m.chat])delete S.typing[m.chat][m.msg.from];
      const mine=m.msg.from===S.me.id,here=S.cur===m.chat&&!document.hidden;
      S.fresh=m.msg.id;
      if(!mine&&!m.msg.sys&&!m.msg.call){
        if(!here){c.unread=(c.unread||0)+1;if(c.type!=='channel')beep([880,1320],.07,.03,.05)}
        if(c.type!=='channel'||(m.msg.text||'').includes('@'+S.me.username))notify(chatName(c),c.type!=='dm'?`${(S.users[m.msg.from]||{}).name}: ${lastText(m.msg)}`:lastText(m.msg),m.chat);
      }
      if(S.cur===m.chat){renderMsgs();renderStatus();markRead()}
      renderSide();updateTitle();
      if(S.tab==='calls'&&m.msg.call)S.calls=null;
      return;
    }
    case 'ack':return;
    case 'upd':{const l=S.msgs[m.chat];if(l){const i=l.findIndex(x=>x.id===m.msg.id);if(i>=0)l[i]=m.msg}const c=S.chats[m.chat];if(c&&c.last&&c.last.id===m.msg.id)c.last=m.msg;if(S.cur===m.chat)renderMsgs();renderSide();return}
    case 'read':{const c=S.chats[m.chat];if(!c)return;c.read=c.read||{};c.read[m.user]=m.ts;if(S.cur===m.chat)renderMsgs();return}
    case 'typing':{
      const t=S.typing[m.chat]=S.typing[m.chat]||{};clearTimeout(t[m.user]);
      t[m.user]=setTimeout(()=>{delete t[m.user];if(S.cur===m.chat)renderStatus();renderSide()},4000);
      if(S.cur===m.chat)renderStatus();renderSide();return;
    }
    case 'user':{S.users[m.user.id]=Object.assign(S.users[m.user.id]||{},m.user);if(m.user.id===S.me.id)S.me=S.users[m.user.id];renderSide();renderStatus();return}
    case 'chat':{m.users.forEach(u=>S.users[u.id]=Object.assign(S.users[u.id]||{},u));
      if(!m.chat.members.includes(S.me.id)){delete S.chats[m.chat.id];if(S.cur===m.chat.id)closeChat();else renderSide();return}
      S.chats[m.chat.id]=Object.assign(S.chats[m.chat.id]||{},m.chat);renderSide();if(S.cur===m.chat.id)renderStatus();return}
    case 'error':{
      if(m.cid){const l=S.msgs[S.cur];if(l){const i=l.findIndex(x=>x.id===m.cid);if(i>=0)l.splice(i,1);renderMsgs()}}
      toast(m.error);if(CALL&&CALL.state==='calling'&&!CALL.id)hangup(true);return;
    }
    case 'call-started':case 'call-incoming':case 'call-accepted':case 'call-end':case 'rtc':return onCallMsg(m);
    case 'server':{
      m.users.forEach(u=>S.users[u.id]=Object.assign(S.users[u.id]||{},u));S.servers[m.server.id]=m.server;
      if(m.removed&&S.cur===m.removed){delete S.chats[m.removed];closeChat()}
      if(m.removed&&VC&&VC.cid===m.removed)voiceLeave(true);
      renderSide();if(S.chats[S.cur]&&S.chats[S.cur].server===m.server.id)renderStatus();return;
    }
    case 'server-gone':{
      const g=S.servers[m.server];delete S.servers[m.server];
      if(g)g.channels.forEach(ch=>delete S.chats[ch.id]);
      if(VC&&VC.sid===m.server)voiceLeave(true);
      if(S.view===m.server)S.view='home';
      if(S.cur&&!S.chats[S.cur])closeChat();else renderSide();return;
    }
    case 'voice':{const g=S.servers[m.server];if(!g)return;const ch=g.channels.find(x=>x.id===m.channel);if(ch)ch.users=m.users;renderSide();return}
    case 'vjoined':case 'vrtc':case 'vpeer-left':case 'vkicked':return onVoiceMsg(m);
  }
}

/* =================================================================== CALLS
   One-to-one WebRTC. Both sides always open one audio and one video channel,
   so turning the camera on, off or switching to screen sharing is a track swap, no renegotiation. */
let CALL=null,ICE=null;
async function iceServers(){if(!ICE){try{ICE=(await api('/api/ice')).iceServers}catch(e){ICE=[{urls:'stun:stun.l.google.com:19302'}]}}return ICE}
async function getMedia(video){
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)throw new Error('Браузер не даёт доступ к микрофону. Открой сайт по https.');
  try{
    return await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:video?{facingMode:'user',width:{ideal:1280},height:{ideal:720}}:false});
  }catch(e){
    if(video){try{return await navigator.mediaDevices.getUserMedia({audio:true})}catch(e2){}}
    throw new Error(e.name==='NotAllowedError'?'Нет доступа к микрофону/камере. Разреши его в настройках браузера.':'Не удалось включить микрофон: '+e.message);
  }
}
async function startCall(chatId,kind){
  if(CALL){toast('Ты уже в звонке');return}
  if(VC){toast('Сначала выйди из голосового канала');return}
  const c=S.chats[chatId];if(!c||c.type!=='dm')return;
  closeLayer();
  const peer=peerOf(c);
  CALL={id:null,chat:chatId,peer,kind,dir:'out',state:'calling',mic:true,cam:kind==='video',screen:false,remote:new MediaStream(),pending:[],rs:{cam:false,screen:false,mic:true}};
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
  const pc=CALL.pc=new RTCPeerConnection({iceServers:await iceServers()});
  pc.onicecandidate=e=>{if(e.candidate&&CALL)wsSend({t:'rtc',callId:CALL.id,data:{cand:e.candidate.toJSON()}})};
  pc.ontrack=e=>{if(!CALL)return;CALL.remote.addTrack(e.track);attachRemote()};
  pc.onconnectionstatechange=()=>{
    if(!CALL)return;const s=pc.connectionState;
    if(s==='connected'&&CALL.state!=='active'){CALL.state='active';CALL.started=Date.now();sendState();renderCall();startTimer()}
    if(s==='failed'){toast('Не удалось соединиться. Сеть блокирует прямое соединение.');hangup()}
    if(s==='disconnected'){CALL.discT=setTimeout(()=>{if(CALL&&CALL.pc&&CALL.pc.connectionState!=='connected'){try{CALL.pc.restartIce()}catch(e){}}},3000)}
  };
  return pc;
}
/* put our microphone and camera into the two channels (caller creates them, callee finds them in the offer) */
function attachLocal(){
  const pc=CALL.pc,a=CALL.local.getAudioTracks()[0]||null,v=CALL.local.getVideoTracks()[0]||null;
  let ta=pc.getTransceivers().find(t=>t.receiver.track.kind==='audio'),tv=pc.getTransceivers().find(t=>t.receiver.track.kind==='video');
  if(!ta)ta=pc.addTransceiver('audio',{direction:'sendrecv',streams:[CALL.local]});
  if(!tv)tv=pc.addTransceiver('video',{direction:'sendrecv',streams:[CALL.local]});
  ta.direction='sendrecv';tv.direction='sendrecv';
  ta.sender.replaceTrack(a);tv.sender.replaceTrack(CALL.screen?CALL.screenTrack:v);
  CALL.va=ta;CALL.vv=tv;
}
async function onCallMsg(m){
  if(m.t==='call-incoming'){
    if(CALL||VC){wsSend({t:'call-reject',callId:m.callId});return}
    S.users[m.from.id]=Object.assign(S.users[m.from.id]||{},m.from);
    CALL={id:m.callId,chat:m.chat,peer:S.users[m.from.id],kind:m.kind,dir:'in',state:'ringing',mic:true,cam:false,screen:false,remote:new MediaStream(),pending:[],rs:{cam:m.kind==='video',screen:false,mic:true}};
    renderCall();ring('in');
    notify(m.from.name,m.kind==='video'?'Входящий видеозвонок':'Входящий звонок','call');
    return;
  }
  if(!CALL)return;
  if(m.t==='call-started'){if(CALL.dir==='out'&&!CALL.id&&m.chat===CALL.chat){CALL.id=m.callId;renderCall()}return}
  if(m.callId!==CALL.id)return;
  if(m.t==='call-accepted'){
    stopRing();CALL.state='connecting';renderCall();
    await makePC();attachLocal();
    const offer=await CALL.pc.createOffer();await CALL.pc.setLocalDescription(offer);
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
        if(d.sdp.type==='offer'){attachLocal();const ans=await pc.createAnswer();await pc.setLocalDescription(ans);wsSend({t:'rtc',callId:CALL.id,data:{sdp:pc.localDescription.toJSON()}})}
        for(const c of CALL.pending.splice(0))await pc.addIceCandidate(c).catch(()=>{});
      }else if(d.cand){
        if(pc.remoteDescription)await pc.addIceCandidate(d.cand).catch(()=>{});else CALL.pending.push(d.cand);
      }else if(d.state){CALL.rs=Object.assign(CALL.rs,d.state);renderCall()}
    }catch(e){console.error(e)}
  }
}
function sendState(){if(CALL&&CALL.id)wsSend({t:'rtc',callId:CALL.id,data:{state:{cam:CALL.cam,screen:CALL.screen,mic:CALL.mic}}})}
function hangup(silent){
  if(!CALL)return;
  if(CALL.id)wsSend({t:CALL.state==='ringing'?'call-reject':'call-end',callId:CALL.id});
  cleanupCall();
}
function cleanupCall(){
  stopRing();
  if(!CALL)return;
  clearInterval(CALL.timer);clearTimeout(CALL.discT);clearTimeout(CALL.idleT);
  try{CALL.pc&&CALL.pc.close()}catch(e){}
  [CALL.local,CALL.screenStream].forEach(s=>s&&s.getTracks().forEach(t=>t.stop()));
  CALL=null;const el=$('#callEl');if(el)el.remove();const mc=$('#miniCall');if(mc)mc.remove();
  if(S.tab==='calls'){S.calls=null;renderSide()}
}
function startTimer(){clearInterval(CALL.timer);CALL.timer=setInterval(()=>{if(CALL&&CALL.started){const s=Math.floor((Date.now()-CALL.started)/1000),t=`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;document.querySelectorAll('.ctime').forEach(e=>e.textContent=t)}},1000)}
function toggleMic(){if(!CALL||!CALL.local)return;CALL.mic=!CALL.mic;CALL.local.getAudioTracks().forEach(t=>t.enabled=CALL.mic);sendState();renderCall()}
async function toggleCam(){
  if(!CALL||!CALL.local)return;
  if(CALL.cam){CALL.local.getVideoTracks().forEach(t=>{t.stop();CALL.local.removeTrack(t)});CALL.cam=false;if(!CALL.screen&&CALL.vv)CALL.vv.sender.replaceTrack(null)}
  else{
    try{const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:CALL.facing||'user',width:{ideal:1280},height:{ideal:720}}});const t=s.getVideoTracks()[0];CALL.local.addTrack(t);CALL.cam=true;if(!CALL.screen&&CALL.vv)CALL.vv.sender.replaceTrack(t)}
    catch(e){toast('Не удалось включить камеру');return}
  }
  sendState();renderCall();
}
async function flipCam(){
  if(!CALL||!CALL.cam)return;CALL.facing=CALL.facing==='environment'?'user':'environment';
  try{const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:{exact:CALL.facing}}});const t=s.getVideoTracks()[0];
    CALL.local.getVideoTracks().forEach(o=>{o.stop();CALL.local.removeTrack(o)});CALL.local.addTrack(t);if(!CALL.screen&&CALL.vv)CALL.vv.sender.replaceTrack(t);renderCall()}
  catch(e){toast('Вторая камера недоступна')}
}
const canShare=()=>!!(navigator.mediaDevices&&navigator.mediaDevices.getDisplayMedia)&&!touch;
async function toggleScreen(){
  if(!CALL||!CALL.vv)return;
  if(CALL.screen){stopScreen();return}
  try{
    const s=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:{ideal:30},width:{max:1920},height:{max:1080}},audio:false});
    const t=s.getVideoTracks()[0];if('contentHint' in t)t.contentHint='detail';
    CALL.screenStream=s;CALL.screenTrack=t;CALL.screen=true;
    await CALL.vv.sender.replaceTrack(t);
    t.onended=()=>stopScreen();
    sendState();renderCall();
  }catch(e){if(e.name!=='NotAllowedError')toast('Демонстрация экрана недоступна')}
}
function stopScreen(){
  if(!CALL||!CALL.screen)return;
  CALL.screenStream.getTracks().forEach(t=>t.stop());CALL.screen=false;CALL.screenStream=CALL.screenTrack=null;
  if(CALL.vv)CALL.vv.sender.replaceTrack(CALL.local.getVideoTracks()[0]||null);
  sendState();renderCall();
}
function attachRemote(){
  const v=$('#rv'),a=$('#ra');
  if(a&&a.srcObject!==CALL.remote){a.srcObject=CALL.remote;a.play().catch(()=>{})}
  if(v&&v.srcObject!==CALL.remote){v.srcObject=CALL.remote;v.play().catch(()=>{})}
}
function renderCall(){
  if(!CALL)return;
  let el=$('#callEl');
  if(CALL.min){if(el)el.style.display='none';renderMini();return}
  const mc=$('#miniCall');if(mc)mc.remove();
  if(!el){el=document.createElement('div');el.id='callEl';el.className='call';document.body.appendChild(el);
    el.addEventListener('pointermove',wake);el.addEventListener('pointerdown',wake)}
  el.style.display='';
  const p=CALL.peer||{},st=CALL.state,remoteVid=st==='active'&&(CALL.rs.cam||CALL.rs.screen);
  const label={calling:CALL.id?'Вызов…':'Подключаемся…',ringing:CALL.kind==='video'?'Входящий видеозвонок':'Входящий звонок',connecting:'Соединение…',active:''}[st];
  el.classList.toggle('incoming',st==='ringing');
  const btn=(act,icon,cls,lb,title)=>`<button class="cbtn ${cls||''}" data-act="${act}" aria-label="${title||lb}" title="${title||lb}">${ic(icon)}${lb?`<span class="lb">${lb}</span>`:''}</button>`;
  const controls=st==='ringing'
    ?btn('c-reject','end','end','Отклонить')+btn('c-accept',CALL.kind==='video'?'video':'phone','acc','Принять')
    :btn('c-mic',CALL.mic?'mic':'micOff',CALL.mic?'':'off','',CALL.mic?'Выключить микрофон':'Включить микрофон')+
     btn('c-cam',CALL.cam?'video':'videoOff',CALL.cam?'':'off','',CALL.cam?'Выключить камеру':'Включить камеру')+
     (touch&&CALL.cam?btn('c-flip','flip','','','Сменить камеру'):'')+
     (canShare()?btn('c-screen','screen',CALL.screen?'on':'','',CALL.screen?'Остановить демонстрацию':'Демонстрация экрана'):'')+
     btn('c-min','min','','','Свернуть')+
     btn('c-end','end','end','','Завершить');
  /* keep the <video> elements alive between renders so the picture does not blink */
  if(!$('#rv')){el.innerHTML=`<div class="bg grad" id="cbg"></div><video id="rv" class="remote" autoplay playsinline muted></video><audio id="ra" autoplay></audio>
      <div class="local" id="lv"><video autoplay playsinline muted></video></div><div id="cui"></div>`;
    dragPiP($('#lv'))}
  const rv=$('#rv');rv.style.display=remoteVid?'':'none';rv.classList.toggle('cover',!CALL.rs.screen);
  attachRemote();
  const lv=$('#lv'),showLocal=(CALL.cam||CALL.screen)&&CALL.local;
  lv.style.display=showLocal?'':'none';lv.classList.toggle('screen',CALL.screen);lv.classList.toggle('wide',CALL.screen);
  const lvv=lv.querySelector('video'),src=CALL.screen?CALL.screenStream:CALL.local;
  if(showLocal&&lvv.srcObject!==src){lvv.srcObject=src;lvv.play().catch(()=>{})}
  const bg=$('#cbg');if(p.avatar){bg.className='bg';bg.style.backgroundImage=`url("${p.avatar}")`}
  $('#cui').innerHTML=`${st==='active'?`<div class="top glass pill">${avatar(p,'xs',false)}<b>${esc(p.name)}</b><span class="ctime">00:00</span>${CALL.rs.mic?'':ic('micOff')}</div>`:''}
    ${CALL.rs.screen&&st==='active'?`<div class="tag-screen glass pill">${ic('screen')} ${esc(p.name)} показывает экран</div>`:''}
    ${CALL.screen?`<div class="tag-screen glass pill" style="top:auto;bottom:calc(120px + var(--safe-b))">${ic('screen')} Вы показываете экран</div>`:''}
    ${!remoteVid?`<div class="center ${st!=='active'?'ring':''}">${avatar(p,'xl',false)}<h2>${esc(p.name)}</h2><div class="st">${label||(st==='active'?'<span class="ctime">00:00</span>':'')}</div></div>`:''}
    <div class="bar glass pill">${controls}</div>`;
  if(st==='active')startTimer();
  el.classList.remove('idle');idle();
}
function wake(){const el=$('#callEl');if(el){el.classList.remove('idle');idle()}}
function idle(){if(!CALL)return;clearTimeout(CALL.idleT);CALL.idleT=setTimeout(()=>{const el=$('#callEl');if(el&&CALL&&CALL.state==='active'&&(CALL.rs.cam||CALL.rs.screen))el.classList.add('idle')},4000)}
function renderMini(){
  let mc=$('#miniCall');
  if(!mc){mc=document.createElement('button');mc.id='miniCall';mc.className='mini-call glass pill';mc.dataset.act='c-max';document.body.appendChild(mc)}
  mc.innerHTML=`${avatar(CALL.peer,'s',false)}<span style="text-align:left"><b>${esc(CALL.peer.name)}</b><br><small class="ctime" style="color:var(--good)">в звонке</small></span>`;
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
      return `<button class="rbtn ${S.view===g.id?'on':''} ${u?'unread':''}" style="--c:${esc(g.color)}" data-act="view" data-v="${g.id}" title="${esc(g.name)}" aria-label="${esc(g.name)}">${esc(initials(g.name))}${inV?`<span class="vdot">${ic('vol')}</span>`:''}</button>`}).join('')}
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
      ${text.map(ch=>{const c=S.chats[ch.id]||{};return `<button class="ch ${S.cur===ch.id?'on':''} ${c.unread?'unread':''}" data-act="open" data-id="${ch.id}"><span class="hash">#</span><span class="nm">${esc(ch.name)}</span>${c.unread?`<span class="badge">${c.unread>99?'99+':c.unread}</span>`:''}</button>`}).join('')}
      <div class="ch-group"><span>Голосовые каналы</span>${own?`<button data-act="newch" data-k="voice" title="Создать голосовой канал" aria-label="Создать голосовой канал">${ic('plus')}</button>`:''}</div>
      ${voice.map(ch=>`<button class="ch ${VC&&VC.cid===ch.id?'on':''}" data-act="vjoin" data-id="${ch.id}" data-s="${g.id}">${ic('vol')}<span class="nm">${esc(ch.name)}</span>${ch.users&&ch.users.length?`<small style="color:var(--fg3)">${ch.users.length}</small>`:''}</button>
        ${ch.users&&ch.users.length?`<div class="vusers">${ch.users.map(v=>{const u=S.users[v.id]||{name:'?'};return `<div class="vu ${VC&&VC.speaking&&VC.speaking.has(v.id)?'speaking':''}" data-vu="${v.id}">${avatar(u,'xs',false)}<span>${esc(u.name)}</span><span class="st">${v.mute?ic('micOff'):''}${v.deaf?ic('deafOff'):''}</span></div>`}).join('')}</div>`:''}`).join('')}
    </div>`;
}
function voicePanelHTML(){
  if(!VC)return '';
  const g=S.servers[VC.sid],ch=g&&g.channels.find(x=>x.id===VC.cid);
  return `<div class="vpanel glass"><span class="mid"><b>${VC.state==='on'?'Голосовая связь':'Подключение…'}</b><small>${esc(ch?ch.name:'')} · ${esc(g?g.name:'')}</small></span>
    <button class="gbtn ic ${VC.mute?'off':''}" data-act="vmute" title="${VC.mute?'Включить микрофон':'Выключить микрофон'}" aria-label="Микрофон">${ic(VC.mute?'micOff':'mic')}</button>
    <button class="gbtn ic ${VC.deaf?'off':''}" data-act="vdeaf" title="${VC.deaf?'Включить звук':'Выключить звук'}" aria-label="Звук">${ic(VC.deaf?'deafOff':'deaf')}</button>
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
  sheet(`<div class="join-card"><div class="rbtn" style="--c:${esc(g.color)}">${esc(initials(g.name))}</div></div>
    ${own?`<label class="field"><span>Название</span><input class="input" id="srvname" maxlength="40" value="${esc(g.name)}"></label>`:`<h2 style="text-align:center">${esc(g.name)}</h2>`}
    ${own?`<div class="section-t" style="padding-left:4px">Каналы</div>${g.channels.map(ch=>`<div class="set-row"><span class="mid">${ch.type==='voice'?'🔊 ':'# '}${esc(ch.name)}</span><button class="gbtn ic" data-act="delch" data-id="${ch.id}" title="Удалить канал" aria-label="Удалить канал">${ic('trash')}</button></div>`).join('')}`:''}
    <div class="section-t" style="padding-left:4px">Участники · ${g.members.length}</div>
    <div>${g.members.map(i=>S.users[i]).filter(Boolean).map(u=>`<div class="row">${avatar(u,'s')}<span class="mid"><span class="top"><span class="nm">${esc(u.name)}${u.id===g.owner?' <small style="color:var(--fg3)">создатель</small>':''}</span></span><span class="sub"><span class="lm">${esc(seen(u))}</span></span></span>${u.id!==S.me.id?`<button class="gbtn ic" data-act="dm" data-id="${u.id}" title="Написать" aria-label="Написать">${ic('chats')}</button>`:''}</div>`).join('')}</div>
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
let VC=null;
async function voiceJoin(sid,cid){
  if(CALL){toast('Сначала заверши звонок');return}
  if(VC&&VC.cid===cid)return;
  if(VC)voiceLeave();
  VC={sid,cid,state:'connecting',mute:false,deaf:false,peers:new Map(),speaking:new Set()};
  renderSide();
  try{VC.local=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}})}
  catch(e){toast(e.name==='NotAllowedError'?'Нет доступа к микрофону. Разреши его в настройках браузера.':'Не удалось включить микрофон');VC=null;renderSide();return}
  if(!VC||VC.cid!==cid){return}
  watchLevel(S.me.id,VC.local);
  if(!wsSend({t:'vjoin',channel:cid})){toast('Нет связи с сервером');voiceLeave(true);return}
  beep([523,784],.09,.02,.05);
}
function voiceRejoin(){if(VC){const {sid,cid}=VC;VC.peers.forEach(p=>closePeer(p));VC.peers.clear();wsSend({t:'vjoin',channel:cid,mute:VC.mute,deaf:VC.deaf})}}
function voiceLeave(silent){
  if(!VC)return;
  if(!silent)wsSend({t:'vleave'});
  VC.peers.forEach(p=>closePeer(p));
  VC.local&&VC.local.getTracks().forEach(t=>t.stop());
  clearInterval(VC.levelT);
  VC=null;beep([784,523],.09,.02,.05);renderSide();
}
function closePeer(p){try{p.pc.close()}catch(e){}if(p.audio){p.audio.srcObject=null;p.audio.remove()}}
async function voicePeer(uid,offer){
  const pc=new RTCPeerConnection({iceServers:await iceServers()});
  const p={pc,uid,pending:[],audio:null};VC.peers.set(uid,p);
  VC.local.getTracks().forEach(t=>pc.addTrack(t,VC.local));
  pc.onicecandidate=e=>{if(e.candidate)wsSend({t:'vrtc',to:uid,data:{cand:e.candidate.toJSON()}})};
  pc.ontrack=e=>{
    if(!p.audio){p.audio=document.createElement('audio');p.audio.autoplay=true;p.audio.playsInline=true;document.body.appendChild(p.audio)}
    const st=e.streams[0]||new MediaStream([e.track]);p.audio.srcObject=st;p.audio.muted=VC.deaf;p.audio.play().catch(()=>{});
    watchLevel(uid,st);
  };
  pc.onconnectionstatechange=()=>{if(pc.connectionState==='connected'&&VC&&VC.state!=='on'){VC.state='on';renderSide()}if(pc.connectionState==='failed'){try{pc.restartIce()}catch(e){}}};
  if(offer){const o=await pc.createOffer();await pc.setLocalDescription(o);wsSend({t:'vrtc',to:uid,data:{sdp:pc.localDescription.toJSON()}})}
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
        if(d.sdp.type==='offer'){const a=await p.pc.createAnswer();await p.pc.setLocalDescription(a);wsSend({t:'vrtc',to:m.from,data:{sdp:p.pc.localDescription.toJSON()}})}
        for(const c of p.pending.splice(0))await p.pc.addIceCandidate(c).catch(()=>{});
      }else if(d.cand){if(!p)return;if(p.pc.remoteDescription)await p.pc.addIceCandidate(d.cand).catch(()=>{});else p.pending.push(d.cand)}
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
function voiceMute(){if(!VC)return;VC.mute=!VC.mute;if(VC.local)VC.local.getAudioTracks().forEach(t=>t.enabled=!VC.mute);wsSend({t:'vstate',mute:VC.mute,deaf:VC.deaf});renderSide()}
function voiceDeaf(){if(!VC)return;VC.deaf=!VC.deaf;VC.peers.forEach(p=>{if(p.audio)p.audio.muted=VC.deaf});if(VC.deaf&&!VC.mute)voiceMute();else{wsSend({t:'vstate',mute:VC.mute,deaf:VC.deaf});renderSide()}}
addEventListener('pagehide',()=>{if(VC)wsSend({t:'vleave'})});

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
      const r=await api('/api/profile',{avatar:cv.toDataURL('image/jpeg',.88)});S.me=S.users[S.me.id]=Object.assign(S.users[S.me.id],r.me);closeLayer();renderSide();toast('Аватарка обновлена');return;
    }
    /* stickers keep a transparent background: WebP where the browser can make it, otherwise PNG, kept under ~250 KB */
    let d='';for(const size of [512,384,300]){
      const cv=document.createElement('canvas');cv.width=cv.height=size;edPaint(cv.getContext('2d'),size);
      d=cv.toDataURL('image/webp',.86);if(!d.startsWith('data:image/webp'))d=cv.toDataURL('image/png');
      if(d.length<330e3)break;
    }
    const r=await api('/api/stickers',{img:d});S.stickers=r.stickers;closeLayer();S.stk=true;renderStickers();toast('Стикер готов — он в наборе 😊');
  }catch(e){toast(e.message);if(b)b.disabled=false}
}
function renderStickers(){
  const el=$('#stkp');if(!el)return;
  document.querySelectorAll('.stkbtn').forEach(b=>b.classList.toggle('on',S.stk));
  if(!S.stk){el.innerHTML='';return}
  el.innerHTML=`<div class="stk-panel glass"><div class="stk-grid">
    <button class="stk-add" data-act="stknew" title="Сделать стикер из фото">${ic('plus')}<small>Из фото</small></button>
    ${S.stickers.map(x=>`<button class="stk-it" data-act="stksend" data-id="${x.id}" data-stk="${x.id}" title="Отправить"><img src="${esc(x.img)}" alt="Стикер" loading="lazy"></button>`).join('')}
  </div>${S.stickers.length?'<small class="stk-hint">Нажми — отправить · удерживай — удалить</small>':'<small class="stk-hint">Сделай свой первый стикер из фото в галерее</small>'}</div>`;
}
function sendSticker(id){
  const c=S.chats[S.cur];if(!c)return;
  if(!wsSend({t:'send',chat:c.id,sticker:id,reply:S.reply&&S.reply.m.id,cid:'s'+Date.now()})){toast('Нет связи. Переподключаемся…');return}
  S.reply=null;renderCtx();if(mobile()){S.stk=false;renderStickers()}
}
function stickerMenu(id,x,y){openMenu(`<button class="it" data-act="stksend" data-id="${id}">${ic('send')}Отправить</button><button class="it bad" data-act="stkdel" data-id="${id}">${ic('trash')}Удалить из набора</button>`,x,y)}

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

/* swipes on phones: from the left edge — back; a message to the left — reply */
(function(){
  let sx=0,sy=0,el=null,edge=false,bub=null,dx=0;
  document.addEventListener('touchstart',e=>{
    if(!S.cur||e.touches.length>1)return;const t=e.touches[0];sx=t.clientX;sy=t.clientY;dx=0;
    edge=sx<28&&mobile();bub=e.target.closest('.m:not(.sys)');if(bub&&!bub.querySelector('[data-act="msg"]'))bub=null;
  },{passive:true});
  document.addEventListener('touchmove',e=>{
    if(!S.cur)return;const t=e.touches[0];dx=t.clientX-sx;const dy=t.clientY-sy;
    if(Math.abs(dy)>Math.abs(dx)){if(bub){bub.style.transform='';bub=null}return}
    if(bub&&dx<0){bub.style.transform=`translateX(${Math.max(-70,dx)}px)`;clearTimeout(lpT)}
  },{passive:true});
  document.addEventListener('touchend',()=>{
    if(edge&&dx>90){closeChat()}
    if(bub){const id=bub.dataset.id;bub.style.transition='transform .2s';bub.style.transform='';setTimeout(()=>{if(bub)bub.style.transition=''},220);
      if(dx<-60){const m=(S.msgs[S.cur]||[]).find(x=>x.id===id);if(m&&!m.del&&!m.pending&&!m.call){S.edit=null;S.reply={m};renderCtx();navigator.vibrate&&navigator.vibrate(10)}}}
    edge=false;bub=null;
  },{passive:true});
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
    case 'tab':S.tab=el.dataset.t;if(S.tab==='calls')S.calls=null;renderSide();break;
    case 'open':closeLayer();openChat(id);break;
    case 'back':closeChat();break;
    case 'dm':startDM(id);break;
    case 'newchat':newChatSheet(false);break;
    case 'newgroup':newChatSheet(true);break;
    case 'settings':settingsSheet();break;
    case 'info':infoSheet();break;
    case 'closemenu':closeLayer();break;
    case 'send':sendMsg();$('#txt')&&!touch&&$('#txt').focus();break;
    case 'attach':$('#file').click();break;
    case 'older':loadOlder();break;
    case 'msg':if(!touch&&e.detail>=2)break;if(e.target.closest('a,[data-act="zoom"],[data-act="jump"],.reacts'))break;msgMenu(id,e.clientX,e.clientY);break;
    case 'zoom':{const L=$('#layer');L.innerHTML=`<div class="lightbox" data-act="closemenu"><img src="${esc(el.src)}" alt=""></div>`;break}
    case 'jump':{const t=document.querySelector(`.m[data-id="${CSS.escape(id)}"]`);if(t){t.scrollIntoView({block:'center',behavior:'smooth'});t.classList.add('hl');setTimeout(()=>t.classList.remove('hl'),1300)}break}
    case 'react':wsSend({t:'react',chat:S.cur,id,emoji:el.dataset.e});closeLayer();break;
    case 'mm-reply':{const m=S.msgs[S.cur].find(x=>x.id===id);S.edit=null;S.reply={m};renderCtx();closeLayer();if(!touch)$('#txt').focus();break}
    case 'mm-savestk':{const m=S.msgs[S.cur].find(x=>x.id===id);closeLayer();try{const r=await api('/api/stickers',{chat:S.cur,fromMsg:m.id});S.stickers=r.stickers;toast('Стикер сохранён')}catch(err){toast(err.message)}break}
    case 'stk':S.stk=!S.stk;renderStickers();break;
    case 'stksend':sendSticker(id);break;
    case 'stknew':pickImage(f=>imageEditor(f,'sticker'));break;
    case 'stkdel':{try{const r=await api('/api/stickers/delete',{id});S.stickers=r.stickers;closeLayer();renderStickers()}catch(err){toast(err.message)}break}
    case 'ed-shape':ED.shape=el.dataset.v;document.querySelectorAll('[data-act="ed-shape"]').forEach(b=>b.classList.toggle('on',b===el));edDraw();break;
    case 'ed-save':edSave();break;
    case 'chatwall':chatWallSheet();break;
    case 'cwall':setChatWall(el.dataset.v);break;
    case 'cwallpick':pickImage(async f=>{try{const b=await toWallBlob(f);await IDB.set('wall:'+S.cur,b);closeLayer();applyChatWall(S.cur);toast('Обои чата установлены')}catch(err){toast(err.message)}});break;
    case 'appwall':pickImage(async f=>{try{const b=await toWallBlob(f);await IDB.set('wall:app',b);await applyAppWall();settingsSheet();toast('Обои установлены')}catch(err){toast(err.message)}});break;
    case 'appwalldel':await IDB.del('wall:app');await applyAppWall();settingsSheet();break;
    case 'avadel':try{const r=await api('/api/profile',{avatar:''});S.me=S.users[S.me.id]=Object.assign(S.users[S.me.id],r.me);settingsSheet();renderSide()}catch(err){toast(err.message)}break;
    case 'mm-copy':{const m=S.msgs[S.cur].find(x=>x.id===id);try{await navigator.clipboard.writeText(m.text);toast('Скопировано')}catch(err){toast('Не удалось скопировать')}closeLayer();break}
    case 'mm-edit':{const m=S.msgs[S.cur].find(x=>x.id===id);S.reply=null;S.edit={m};const t=$('#txt');t.value=m.text;autosize(t);renderCtx();closeLayer();t.focus();break}
    case 'mm-del':{if(!el.dataset.sure){el.dataset.sure=1;el.lastChild.textContent='Точно удалить?';return}wsSend({t:'del',chat:S.cur,id});closeLayer();break}
    case 'ctxx':S.reply=S.edit=null;if($('#txt'))$('#txt').value=S.draft[S.cur]||'';renderCtx();break;
    case 'chatmenu':{const c=S.chats[S.cur];const r=el.getBoundingClientRect();
      openMenu(`<button class="it" data-act="info">${ic('users')}${c.type==='dm'?'Профиль':'Участники'}</button><button class="it" data-act="chatwall">${ic('image')}Обои чата</button>${c.type==='group'?`<button class="it bad" data-act="leave">${ic('x')}Выйти из группы</button>`:''}`,r.left+r.width/2-100,r.bottom);break}
    case 'leave':{if(!el.dataset.sure){el.dataset.sure=1;el.lastChild.textContent='Точно выйти?';return}try{await api('/api/chats/leave',{chat:S.cur});const id2=S.cur;closeLayer();delete S.chats[id2];closeChat()}catch(err){toast(err.message)}break}
    case 'call':startCall(S.cur,el.dataset.k);break;
    case 'callu':startCall(el.dataset.chat,el.dataset.k);break;
    case 'c-accept':acceptCall();break;
    case 'c-reject':hangup();break;
    case 'c-end':hangup();break;
    case 'c-mic':toggleMic();break;
    case 'c-cam':toggleCam();break;
    case 'c-flip':flipCam();break;
    case 'c-screen':toggleScreen();break;
    case 'c-min':CALL.min=true;renderCall();break;
    case 'c-max':CALL.min=false;renderCall();break;
    case 'theme':store.set('theme',el.dataset.v);applyTheme();settingsSheet();break;
    case 'wall':store.set('wall',el.dataset.w);await IDB.del('wall:app');await applyAppWall();applyTheme();settingsSheet();break;
    case 'notif':try{await Notification.requestPermission()}catch(err){}settingsSheet();break;
    case 'install':installSheet();break;
    case 'doinstall':if(deferredInstall){deferredInstall.prompt();deferredInstall=null}closeLayer();break;
    case 'copyname':try{await navigator.clipboard.writeText('@'+S.me.username);toast('Логин скопирован')}catch(err){}break;
    case 'ava':pickImage(f=>imageEditor(f,'avatar'));break;
    case 'saveprof':{
      const b={name:$('#pname').value,bio:$('#pbio').value};
      if($('#nwp').value){b.password=$('#op').value;b.newPassword=$('#nwp').value}
      try{const r=await api('/api/profile',b);S.me=S.users[S.me.id]=Object.assign(S.users[S.me.id],r.me);closeLayer();toast('Сохранено');renderSide()}catch(err){toast(err.message)}break}
    case 'logout':if(!el.dataset.sure){el.dataset.sure=1;el.textContent='Точно выйти?';return}await api('/api/logout',{}).catch(()=>{});location.reload();break;
  }
});
document.addEventListener('focusin',e=>{if(e.target.id==='txt'&&mobile()){S.stk=false;renderStickers();setTimeout(()=>{const b=$('#msgs');if(b)b.scrollTop=b.scrollHeight},300)}});
document.addEventListener('submit',e=>{if(e.target.id==='authForm'){e.preventDefault();authSubmit(e.target)}});
document.addEventListener('input',e=>{
  if(e.target.id==='q'){S.q=e.target.value;$('#list').innerHTML=chatListHTML();clearTimeout(qT);qT=setTimeout(searchUsers,250);return}
  if(e.target.id==='txt'){autosize(e.target);const now=Date.now();if(S.cur&&e.target.value&&(!S.lastTyping||now-S.lastTyping>2500)){S.lastTyping=now;wsSend({t:'typing',chat:S.cur})}}
});
document.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&e.target.matches('.sheet input:not([type=checkbox])')&&!e.isComposing){const b=e.target.closest('.sheet').querySelector('.gbtn.primary');if(b){e.preventDefault();b.click()}return}
  if(e.target.id==='txt'&&e.key==='Enter'&&!e.shiftKey&&!touch&&!e.isComposing){e.preventDefault();sendMsg()}
  if(e.key==='Escape'){if($('#layer').innerHTML)closeLayer();else if(S.reply||S.edit){S.reply=S.edit=null;renderCtx()}}
  if(e.target.id==='txt'&&e.key==='ArrowUp'&&!e.target.value){const l=S.msgs[S.cur]||[];const m=[...l].reverse().find(x=>x.from===S.me.id&&x.text&&!x.del&&!x.pending);if(m){e.preventDefault();S.edit={m};e.target.value=m.text;renderCtx()}}
});
document.addEventListener('change',async e=>{
  if(e.target.id==='file'&&e.target.files[0]){try{const d=await shrink(e.target.files[0]);sendMsg(d)}catch(err){toast(err.message)}e.target.value=''}
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
if(touch)document.addEventListener('click',e=>{if(e.target.closest('[data-act="msg"]')&&!e.target.closest('a,[data-act="zoom"],[data-act="jump"],.reacts,[data-act="react"]'))e.stopImmediatePropagation()},true);
addEventListener('popstate',()=>{if(mobile()&&S.cur&&!location.hash)closeChat()});
addEventListener('hashchange',()=>{const jm=/^#join\/([\w-]{4,20})$/.exec(location.hash);if(jm&&S.me){history.replaceState(null,'',location.pathname);joinSheet(jm[1])}});
addEventListener('resize',()=>{if(S.me)$('#app').classList.toggle('open',!!S.cur)});
setInterval(()=>{if(S.cur)renderStatus()},60e3);

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
  try{const ks=await caches.keys();await Promise.all(ks.map(k=>caches.delete(k)))}catch(e){}
  try{const rs=await navigator.serviceWorker.getRegistrations();await Promise.all(rs.map(r=>r.update()))}catch(e){}
  if(CALL||VC){toast('Вышло обновление Manasenger — оно применится после звонка');return}
  location.reload();
}
checkVersion();setInterval(checkVersion,5*60e3);document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkVersion()});
boot();
