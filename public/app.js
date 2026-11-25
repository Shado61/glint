/* Glint — messenger client: chats, calls, video calls, screen sharing */
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
  outcall:'<path d="M17 21l-5-5 5-5"/><path d="M12 16h7"/>'
};
const ic=(n,cls='ico')=>`<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;
const TICK1='<svg viewBox="0 0 16 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m1.5 6.5 3.2 3L11 2.5"/></svg>';
const TICK2='<svg viewBox="0 0 16 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m1 6.5 3.2 3L10.5 2.5M7.5 9.2 14.5 2.5"/></svg>';

/* ---------- state ---------- */
const S={me:null,chats:{},users:{},msgs:{},more:{},cur:null,tab:'chats',q:'',found:[],typing:{},reply:null,edit:null,calls:null,draft:{}};

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
  return `<span class="ava ${size}" style="--c:${esc(c.color||'#9b6bff')}">${esc(initials(c.name))}</span>`;
}
const peerOf=c=>S.users[c.members.find(m=>m!==S.me.id)]||{name:'Удалённый аккаунт',color:'#777'};
const chatName=c=>c.type==='dm'?peerOf(c).name:c.name;
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
  const who=m.from===S.me.id?'Вы: ':'';return who+(m.img&&!m.text?'📷 Фото':(m.img?'📷 ':'')+m.text);
}
const sortedChats=()=>Object.values(S.chats).sort((a,b)=>((b.last&&b.last.ts)||b.created)-((a.last&&a.last.ts)||a.created));

/* ---------- theme ---------- */
function applyTheme(){
  const t=store.get('theme','auto'),light=t==='light'||(t==='auto'&&matchMedia('(prefers-color-scheme: light)').matches);
  document.documentElement.classList.toggle('light',light);
  $('.wall').dataset.w=store.get('wall','aurora');
  document.querySelector('meta[name=theme-color]').content=light?'#e9ecff':'#0b1020';
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
function updateTitle(){const n=Object.values(S.chats).reduce((a,c)=>a+(c.unread||0),0);document.title=n?`(${n}) Glint`:'Glint'}

/* =================================================================== AUTH */
let authMode='login';
function viewAuth(){
  $('#app').className='auth';
  $('#app').innerHTML=`<form class="card glass" id="authForm" autocomplete="on">
    <img class="logo" src="/icon-192.png" alt="">
    <h1>Glint</h1><p>Сообщения, звонки и видео — в одном стекле</p>
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
  $('#app').className='app';
  renderShell();connect();updateTitle();
  const h=location.hash.slice(1);if(h&&S.chats[h])openChat(h);
}
function renderShell(){
  $('#app').innerHTML=`<aside class="side glass" id="side"></aside><main class="main glass" id="main"></main>`;
  renderSide();renderMain();
}

/* =================================================================== SIDEBAR */
function renderSide(){
  const el=$('#side');if(!el)return;
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
      <button data-act="settings">${S.me.avatar?avatar(S.me,'xs',false):ic('gear')}Настройки</button></nav>`;
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
  el.innerHTML=`<header class="chat-h glass pill">
      <button class="gbtn ic back" data-act="back" aria-label="Назад">${ic('back')}</button>
      <button class="who" data-act="info">${chatAvatar(c,'s')}<span style="min-width:0"><b>${esc(chatName(c))}</b><small id="status"></small></span></button>
      ${c.type==='dm'?`<button class="gbtn ic" data-act="call" data-k="audio" title="Аудиозвонок" aria-label="Аудиозвонок">${ic('phone')}</button><button class="gbtn ic" data-act="call" data-k="video" title="Видеозвонок" aria-label="Видеозвонок">${ic('video')}</button>`:''}
      <button class="gbtn ic" data-act="chatmenu" aria-label="Ещё">${ic('more')}</button></header>
    <div class="msgs" id="msgs"></div>
    <div class="composer">
      <div id="ctx"></div>
      <div class="comp-row">
        <button class="gbtn ic glass" style="width:50px;height:50px" data-act="attach" title="Фото" aria-label="Прикрепить фото">${ic('clip')}</button>
        <div class="comp-in glass pill"><textarea id="txt" rows="1" placeholder="Сообщение" maxlength="4000" aria-label="Сообщение"></textarea>
          <button class="sendb" data-act="send" aria-label="Отправить">${ic('send')}</button></div>
      </div></div>
    <input type="file" id="file" accept="image/*" hidden>`;
  const t=$('#txt');t.value=S.draft[c.id]||'';autosize(t);
  renderStatus();renderCtx();renderMsgs(true);
  if(!mobile())t.focus();
}
function renderStatus(){
  const el=$('#status'),c=S.chats[S.cur];if(!el||!c)return;
  const ty=Object.keys(S.typing[c.id]||{});
  if(ty.length){el.className='typing';el.textContent=c.type==='dm'?'печатает…':`${ty.map(i=>(S.users[i]||{}).name).join(', ')} печатает…`;return}
  el.className='';el.textContent=c.type==='dm'?seen(peerOf(c)):`${c.members.length} участник${c.members.length%10===1&&c.members.length!==11?'':c.members.length%10>=2&&c.members.length%10<=4&&(c.members.length<12||c.members.length>14)?'а':'ов'}`;
}
async function openChat(id){
  if(S.cur&&$('#txt'))S.draft[S.cur]=$('#txt').value;
  S.cur=id;S.reply=S.edit=null;
  history.replaceState(null,'','#'+id);
  renderSide();renderMain();
  if(!S.msgs[id]){
    try{const r=await api('/api/messages?chat='+id);S.msgs[id]=r.messages;S.more[id]=r.more}catch(e){toast(e.message);S.msgs[id]=[]}
    if(S.cur===id)renderMsgs(true);
  }
  markRead();
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
  else if(m.call){
    const miss=m.call.missed,out=m.from===S.me.id;
    return `<div class="m ${me?'me':''} tail" data-id="${m.id}"><div class="bub callm ${miss?'miss':''}"><span class="ci">${ic(m.call.kind==='video'?'video':'phone')}</span>
      <span><b>${out?'Исходящий':'Входящий'} ${m.call.kind==='video'?'видеозвонок':'звонок'}</b><br><small style="opacity:.75">${miss?(out?'Без ответа':'Пропущенный'):durText(m.call.dur)} · ${tm(m.ts)}</small></span></div></div>`;
  }else{
    inner=(c.type==='group'&&!me&&head?`<div class="au" style="color:${esc(u.color)}">${esc(u.name)}</div>`:'')+
      (m.reply?`<button class="rq" data-act="jump" data-id="${esc(m.reply.id)}"><b>${esc((S.users[m.reply.from]||{}).name||'')}</b><span>${esc(m.reply.text)}</span></button>`:'')+
      (m.img?`<img class="pic" src="${esc(m.img)}" alt="Фото" data-act="zoom" loading="lazy">`:'')+
      (m.text?`<span class="tx">${linkify(m.text)}</span>`:'')+meta;
  }
  const re=m.react&&Object.keys(m.react).length?`<div class="reacts">${Object.entries(m.react).map(([e,l])=>`<button class="${l.includes(S.me.id)?'mine':''}" data-act="react" data-id="${m.id}" data-e="${e}">${e} ${l.length>1?l.length:''}</button>`).join('')}</div>`:'';
  return `<div class="m ${me?'me':''} ${tail?'tail':''}" data-id="${m.id}">${c.type==='group'&&!me?avatar(u,'xs',false):''}<div class="bub" data-act="msg" data-id="${m.id}">${inner}${re}</div></div>`;
}
function linkify(t){
  return esc(t).replace(/\bhttps?:\/\/[^\s<]+[^\s<.,:;"')\]!?]/g,u=>`<a href="${u}" target="_blank" rel="noopener noreferrer">${u}</a>`);
}
function renderMsgs(toBottom){
  const box=$('#msgs'),c=S.chats[S.cur];if(!box||!c)return;
  const list=S.msgs[c.id];
  if(!list){box.innerHTML='<div class="sys">Загружаем…</div>';return}
  const near=box.scrollHeight-box.scrollTop-box.clientHeight<140;
  let h=S.more[c.id]?`<button class="gbtn more" data-act="older">Показать раньше</button>`:'';
  if(!list.length)h+=`<div class="sys glass pill" style="margin-top:auto">Напиши первое сообщение 👋</div>`;
  let day='';
  list.forEach((m,i)=>{const d=new Date(m.ts).toDateString();if(d!==day){day=d;h+=`<div class="day glass pill">${dayLabel(m.ts)}</div>`}h+=msgHTML(c,m,list[i-1],list[i+1])});
  const prevH=box.scrollHeight,prevT=box.scrollTop;
  box.innerHTML=h;
  if(toBottom||near)box.scrollTop=box.scrollHeight;else if(toBottom===null)box.scrollTop=box.scrollHeight-prevH+prevT;
}
async function loadOlder(){
  const c=S.cur,l=S.msgs[c];if(!l||!l.length)return;
  try{const r=await api(`/api/messages?chat=${c}&before=${l[0].ts}`);S.msgs[c]=r.messages.concat(l);S.more[c]=r.more;if(S.cur===c)renderMsgs(null)}catch(e){toast(e.message)}
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
  const items=[['reply','reply','Ответить'],m.text?['copy','copy','Копировать']:null,me&&m.text&&!m.call?['edit','edit','Изменить']:null,me&&!m.call?['del','trash','Удалить','bad']:null].filter(Boolean);
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
  setTimeout(()=>(group?$('#gname'):$('#pq')).focus(),50);
}
async function startDM(uid){
  try{const r=await api('/api/chats/dm',{userId:uid});r.users.forEach(u=>S.users[u.id]=u);S.chats[r.chat.id]=Object.assign(S.chats[r.chat.id]||{},r.chat);S.q='';openChat(r.chat.id)}catch(e){toast(e.message)}
}
function infoSheet(){
  const c=S.chats[S.cur];if(!c)return;
  if(c.type==='dm'){const u=peerOf(c);
    sheet(`<div class="prof">${avatar(u,'xl')}<h3>${esc(u.name)}</h3><small>@${esc(u.username)} · ${esc(seen(u))}</small>${u.bio?`<p style="margin:8px 0 0">${esc(u.bio)}</p>`:''}</div>
      <div class="btns" style="justify-content:center"><button class="gbtn" data-act="call" data-k="audio">${ic('phone')}Звонок</button><button class="gbtn" data-act="call" data-k="video">${ic('video')}Видео</button></div>`);return}
  sheet(`<div class="prof">${chatAvatar(c,'xl')}<h3>${esc(c.name)}</h3><small>${c.members.length} участников</small></div>
    <div class="section-t">Участники</div>${c.members.map(i=>S.users[i]).filter(Boolean).map(u=>`<div class="row">${avatar(u,'s')}<span class="mid"><span class="top"><span class="nm">${esc(u.name)}${u.id===c.admin?' <small style="color:var(--fg3)">админ</small>':''}</span></span><span class="sub"><span class="lm">${esc(seen(u))}</span></span></span></div>`).join('')}
    <div class="btns"><button class="gbtn danger" data-act="leave">Выйти из группы</button></div>`);
}
function settingsSheet(){
  const me=S.me,th=store.get('theme','auto'),w=store.get('wall','aurora');
  const np='Notification' in window?Notification.permission:'unsupported';
  sheet(`<div class="prof"><button data-act="ava" title="Сменить фото" aria-label="Сменить фото">${avatar(me,'xl',false)}</button><small>нажми на фото, чтобы сменить</small></div>
    <label class="field"><span>Имя</span><input class="input" id="pname" maxlength="40" value="${esc(me.name)}"></label>
    <label class="field"><span>О себе</span><input class="input" id="pbio" maxlength="140" value="${esc(me.bio||'')}" placeholder="Пара слов о себе"></label>
    <div class="set-row"><span class="mid"><b>Логин</b><small>@${esc(me.username)} — по нему тебя находят</small></span><button class="gbtn" data-act="copyname">${ic('copy')}</button></div>
    <div class="set-row"><span class="mid"><b>Тема</b></span><div class="seg" style="width:220px">${[['auto','Авто'],['light','Светлая'],['dark','Тёмная']].map(([k,n])=>`<button class="${th===k?'on':''}" data-act="theme" data-v="${k}">${n}</button>`).join('')}</div></div>
    <div class="set-row" style="display:block"><b>Обои</b><div class="walls" style="margin-top:8px">${['aurora','sunset','ocean','mono'].map(k=>`<button class="${w===k?'on':''}" data-act="wall" data-w="${k}" aria-label="${k}"></button>`).join('')}</div></div>
    <div class="set-row"><span class="mid"><b>Уведомления</b><small>${np==='granted'?'включены':np==='denied'?'запрещены в браузере':np==='unsupported'?'не поддерживаются':'выключены'}</small></span>${np==='default'?'<button class="gbtn" data-act="notif">Включить</button>':''}</div>
    <div class="set-row"><span class="mid"><b>Приложение</b><small>Установи Glint на телефон или ПК</small></span><button class="gbtn" data-act="install">Как?</button></div>
    <details class="set-row" style="display:block"><summary style="cursor:pointer;font-weight:600">Сменить пароль</summary>
      <label class="field" style="margin-top:10px"><span>Текущий пароль</span><input class="input" id="op" type="password" autocomplete="current-password"></label>
      <label class="field"><span>Новый пароль</span><input class="input" id="nwp" type="password" minlength="6" autocomplete="new-password"></label></details>
    <div class="btns"><button class="gbtn danger" data-act="logout">Выйти</button><button class="gbtn primary" data-act="saveprof">Сохранить</button></div>`);
}
function installSheet(){
  sheet(`<h2>Установить Glint</h2><p class="sub">Glint работает как приложение: своя иконка, отдельное окно, уведомления.</p>
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
      try{const r=await api('/api/me');if(!r.me)return location.reload();r.chats.forEach(c=>S.chats[c.id]=c);r.users.forEach(u=>S.users[u.id]=u);
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
      const l=S.msgs[m.chat];
      if(l){if(!l.some(x=>x.id===m.msg.id)){
        if(m.msg.from===S.me.id){const i=l.findIndex(x=>x.pending&&x.text===m.msg.text&&!!x.img===!!m.msg.img);if(i>=0)l.splice(i,1)}
        l.push(m.msg)}}
      c.last=m.msg;
      if(S.typing[m.chat])delete S.typing[m.chat][m.msg.from];
      const mine=m.msg.from===S.me.id,here=S.cur===m.chat&&!document.hidden;
      if(!mine&&!m.msg.sys&&!m.msg.call){
        if(!here){c.unread=(c.unread||0)+1;beep([880,1320],.07,.03,.05)}
        notify(chatName(c),c.type==='group'?`${(S.users[m.msg.from]||{}).name}: ${lastText(m.msg)}`:lastText(m.msg),m.chat);
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
    if(CALL){wsSend({t:'call-reject',callId:m.callId});return}
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

/* =================================================================== EVENTS */
let lpT=null,lpFired=false;
document.addEventListener('click',async e=>{
  if(lpFired){lpFired=false;e.preventDefault();return}
  const el=e.target.closest('[data-act]');if(!el)return;
  const a=el.dataset.act,id=el.dataset.id;
  switch(a){
    case 'amode':authMode=el.dataset.m;viewAuth();break;
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
    case 'mm-reply':{const m=S.msgs[S.cur].find(x=>x.id===id);S.edit=null;S.reply={m};renderCtx();closeLayer();$('#txt').focus();break}
    case 'mm-copy':{const m=S.msgs[S.cur].find(x=>x.id===id);try{await navigator.clipboard.writeText(m.text);toast('Скопировано')}catch(err){toast('Не удалось скопировать')}closeLayer();break}
    case 'mm-edit':{const m=S.msgs[S.cur].find(x=>x.id===id);S.reply=null;S.edit={m};const t=$('#txt');t.value=m.text;autosize(t);renderCtx();closeLayer();t.focus();break}
    case 'mm-del':{if(!el.dataset.sure){el.dataset.sure=1;el.lastChild.textContent='Точно удалить?';return}wsSend({t:'del',chat:S.cur,id});closeLayer();break}
    case 'ctxx':S.reply=S.edit=null;if($('#txt'))$('#txt').value=S.draft[S.cur]||'';renderCtx();break;
    case 'chatmenu':{const c=S.chats[S.cur];const r=el.getBoundingClientRect();
      openMenu(`<button class="it" data-act="info">${ic(c.type==='dm'?'users':'users')}${c.type==='dm'?'Профиль':'Участники'}</button>${c.type==='group'?`<button class="it bad" data-act="leave">${ic('x')}Выйти из группы</button>`:''}`,r.left+r.width/2-100,r.bottom);break}
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
    case 'wall':store.set('wall',el.dataset.w);applyTheme();settingsSheet();break;
    case 'notif':try{await Notification.requestPermission()}catch(err){}settingsSheet();break;
    case 'install':installSheet();break;
    case 'doinstall':if(deferredInstall){deferredInstall.prompt();deferredInstall=null}closeLayer();break;
    case 'copyname':try{await navigator.clipboard.writeText('@'+S.me.username);toast('Логин скопирован')}catch(err){}break;
    case 'ava':{const f=document.createElement('input');f.type='file';f.accept='image/*';f.onchange=async()=>{try{const d=await shrink(f.files[0],320,.85);const r=await api('/api/profile',{avatar:d});S.me=S.users[S.me.id]=Object.assign(S.users[S.me.id],r.me);settingsSheet();renderSide()}catch(err){toast(err.message)}};f.click();break}
    case 'saveprof':{
      const b={name:$('#pname').value,bio:$('#pbio').value};
      if($('#nwp').value){b.password=$('#op').value;b.newPassword=$('#nwp').value}
      try{const r=await api('/api/profile',b);S.me=S.users[S.me.id]=Object.assign(S.users[S.me.id],r.me);closeLayer();toast('Сохранено');renderSide()}catch(err){toast(err.message)}break}
    case 'logout':if(!el.dataset.sure){el.dataset.sure=1;el.textContent='Точно выйти?';return}await api('/api/logout',{}).catch(()=>{});location.reload();break;
  }
});
document.addEventListener('submit',e=>{if(e.target.id==='authForm'){e.preventDefault();authSubmit(e.target)}});
document.addEventListener('input',e=>{
  if(e.target.id==='q'){S.q=e.target.value;$('#list').innerHTML=chatListHTML();clearTimeout(qT);qT=setTimeout(searchUsers,250);return}
  if(e.target.id==='txt'){autosize(e.target);const now=Date.now();if(S.cur&&e.target.value&&(!S.lastTyping||now-S.lastTyping>2500)){S.lastTyping=now;wsSend({t:'typing',chat:S.cur})}}
});
document.addEventListener('keydown',e=>{
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
document.addEventListener('contextmenu',e=>{const b=e.target.closest('[data-act="msg"]');if(b&&!e.target.closest('a')){e.preventDefault();msgMenu(b.dataset.id,e.clientX,e.clientY)}});
document.addEventListener('touchstart',e=>{const b=e.target.closest('[data-act="msg"]');if(!b)return;const t=e.touches[0];lpFired=false;
  lpT=setTimeout(()=>{lpFired=true;navigator.vibrate&&navigator.vibrate(12);msgMenu(b.dataset.id,t.clientX,t.clientY)},420)},{passive:true});
['touchend','touchmove','touchcancel'].forEach(ev=>document.addEventListener(ev,()=>clearTimeout(lpT),{passive:true}));
/* on phones a short tap on a bubble does nothing; the menu is on long press */
if(touch)document.addEventListener('click',e=>{if(e.target.closest('[data-act="msg"]')&&!e.target.closest('a,[data-act="zoom"],[data-act="jump"],.reacts,[data-act="react"]'))e.stopImmediatePropagation()},true);
addEventListener('popstate',()=>{if(mobile()&&S.cur&&!location.hash)closeChat()});
addEventListener('resize',()=>{if(S.me)$('#app').classList.toggle('open',!!S.cur)});
setInterval(()=>{if(S.cur)renderStatus()},60e3);

/* service worker: lets the site be installed as an app */
if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
boot();
