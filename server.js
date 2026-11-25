/* Manasenger — messenger server: accounts, chats, real-time messages, WebRTC call signaling.
   Storage: Postgres (DATABASE_URL) or data/db.json for local runs. */
'use strict';
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto'),zlib=require('zlib');
const GZ=new Map();
/* version of the app files; the browser compares it with its own copy and reloads when they differ */
const APP_VERSION=(()=>{try{return require('crypto').createHash('sha1').update(['app.js','pet.js','fx.js','fxw.js','style.css','index.html','sw.js'].map(f=>fs.readFileSync(path.join(__dirname,'public',f))).join('')).digest('hex').slice(0,10)}catch(e){return 'dev'}})();
const {WebSocketServer}=require('ws');

/* ---------- config (.env for local runs, Environment in Render) ---------- */
(function loadEnv(){
  let t='';try{t=fs.readFileSync(path.join(__dirname,'.env'),'utf8')}catch(e){return}
  for(const line of t.split(/\r?\n/)){
    const m=/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);if(!m)continue;
    let v=m[2];if(/^(["']).*\1$/.test(v))v=v.slice(1,-1);
    if(process.env[m[1]]===undefined)process.env[m[1]]=v;
  }
})();
const PORT=+process.env.PORT||3000;
/* Render gives the public address in RENDER_EXTERNAL_URL, so BASE_URL is optional there */
const BASE=(process.env.BASE_URL||process.env.RENDER_EXTERNAL_URL||'http://localhost:'+PORT).replace(/\/+$/,'');
const PUB=path.join(__dirname,'public');
const MAX_TEXT=4000,MAX_IMG=1.2e6,PAGE=60,KEEP_MSGS=3000;

/* ---------- storage ----------
   Everything lives in memory and is written back in the background:
   one row per user (u:), per chat (c:) and per chat history (m:), plus sessions. */
let DB={users:{},chats:{},msgs:{},sessions:{},servers:{},imgs:{},packs:{},stories:{}};
/* one letter per table in the key-value store */
const TB={u:'users',c:'chats',m:'msgs',g:'servers',i:'imgs',p:'packs',t:'stories'};
let pool=null;const DIRTY=new Set();
const DATA_FILE=path.join(__dirname,'data','db.json');
async function load(){
  if(process.env.DATABASE_URL){
    const {Pool}=require('pg');
    pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:/localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL)?false:{rejectUnauthorized:false},max:4});
    await pool.query('CREATE TABLE IF NOT EXISTS glint_kv(k text PRIMARY KEY, v text NOT NULL)');
    const r=await pool.query('SELECT k,v FROM glint_kv');
    for(const {k,v} of r.rows){
      const o=JSON.parse(v),id=k.slice(2);
      if(k==='s:all')DB.sessions=o;else if(TB[k[0]])DB[TB[k[0]]][id]=o;
    }
    return 'Postgres';
  }
  try{DB=Object.assign(DB,JSON.parse(fs.readFileSync(DATA_FILE,'utf8')))}catch(e){}
  for(const t of Object.values(TB))DB[t]=DB[t]||{};
  return 'файл data/db.json';
}
const mark=k=>{DIRTY.add(k)};
let flushing=Promise.resolve();
async function flushNow(){
  if(!DIRTY.size)return;
  const keys=[...DIRTY];DIRTY.clear();
  if(!pool){fs.mkdirSync(path.dirname(DATA_FILE),{recursive:true});fs.writeFileSync(DATA_FILE+'.tmp',JSON.stringify(DB));fs.renameSync(DATA_FILE+'.tmp',DATA_FILE);return}
  for(const k of keys){
    const id=k.slice(2),v=k==='s:all'?DB.sessions:DB[TB[k[0]]][id];
    if(v===undefined)await pool.query('DELETE FROM glint_kv WHERE k=$1',[k]);
    else await pool.query('INSERT INTO glint_kv(k,v) VALUES($1,$2) ON CONFLICT(k) DO UPDATE SET v=EXCLUDED.v',[k,JSON.stringify(v)]);
  }
}
function flush(){flushing=flushing.then(flushNow).catch(e=>console.error('[db]',e.message));return flushing}
setInterval(flush,1500).unref();
for(const s of ['SIGINT','SIGTERM'])process.on(s,()=>flush().finally(()=>process.exit(0)));

/* ---------- helpers ---------- */
const now=()=>Date.now();
const rid=(n=9)=>crypto.randomBytes(n).toString('base64url');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const E=(code,msg)=>Object.assign(new Error(msg),{code});
const COLORS=['#5b8cff','#a35bff','#ff5b9c','#ff8f3d','#26c6a6','#3dbbff','#f2c94c','#ff6b6b'];
function hashPass(p,salt=crypto.randomBytes(16).toString('hex')){return {salt,hash:crypto.scryptSync(p,salt,64).toString('hex')}}
function checkPass(p,rec){const h=crypto.scryptSync(p,rec.salt,64);return crypto.timingSafeEqual(h,Buffer.from(rec.hash,'hex'))}
const pubUser=u=>u&&({id:u.id,username:u.username,name:u.name,color:u.color,avatar:u.avatar||'',bio:u.bio||'',online:ONLINE.has(u.id),lastSeen:u.lastSeen||0});
function chatFor(c,uid){
  const ms=DB.msgs[c.id]||[],last=ms[ms.length-1]||null;
  const unread=ms.reduce((n,m)=>n+(m.from!==uid&&!m.del&&m.ts>((c.read||{})[uid]||0)?1:0),0);
  const o={id:c.id,type:c.type,name:c.name||'',members:c.members,admin:c.admin||'',created:c.created,last:last&&msgOut(last),unread,read:c.read||{},color:c.color||'',titles:c.titles||{}};
  if(c.server)o.server=c.server;
  const st=streakOut(c);if(st)o.streak=st;
  /* chats that already had a streak before the pet existed get one right away */
  if(!c.pet&&c.type==='dm'&&c.st&&c.st.n>=1){c.pet={name:'Серийчик',best:c.st.n};mark('c:'+c.id)}
  if(c.pet)o.pet=c.pet;
  return o;
}
const msgOut=m=>m.del?{id:m.id,from:m.from,ts:m.ts,del:true}:m;
const member=(c,uid)=>c&&c.members.includes(uid);

/* ---------- fire streaks: both people write in a private chat every day; from 3 days in a row a fire appears ---------- */
const TZ=+(process.env.STREAK_TZ||5); /* days are counted by this time zone (Almaty by default) */
const dayKey=ts=>Math.floor((ts+TZ*3600e3)/864e5);
function bumpStreak(c,uid,ts){
  if(c.type!=='dm')return 0;
  const d=dayKey(ts),s=c.st=c.st||{n:0,last:0,d:0,u:[]};
  if(s.d!==d){s.d=d;s.u=[]}
  if(!s.u.includes(uid))s.u.push(uid);
  if(s.last!==d&&c.members.every(m=>s.u.includes(m))){s.n=s.last===d-1?s.n+1:1;s.last=d;c.pet=c.pet||{name:'Серийчик'};c.pet.best=Math.max(c.pet.best||0,s.n);return s.n}
  return 0;
}
function streakOut(c){
  const s=c.st;if(!s||!s.n)return null;const d=dayKey(now());
  if(s.last<d-1)return null; /* a day was missed: the streak is gone */
  return {n:s.n,today:s.last===d,me:s.d===d?s.u:[]};
}

/* ---------- rate limits ---------- */
const HITS=new Map();
function limit(key,n,ms){
  const t=now(),a=(HITS.get(key)||[]).filter(x=>t-x<ms);
  if(a.length>=n)return false;a.push(t);HITS.set(key,a);return true;
}
setInterval(()=>{const t=now();for(const [k,a] of HITS)if(!a.some(x=>t-x<3600e3))HITS.delete(k)},600e3).unref();

/* ---------- sessions ---------- */
function cookies(req){const o={};(req.headers.cookie||'').split(';').forEach(p=>{const i=p.indexOf('=');if(i>0)o[p.slice(0,i).trim()]=decodeURIComponent(p.slice(i+1).trim())});return o}
function userOf(req){
  const t=cookies(req).glint;if(!t)return null;
  const s=DB.sessions[sha(t)];if(!s||s.exp<now())return null;
  return DB.users[s.uid]||null;
}
function newSession(res,uid){
  const t=rid(32);DB.sessions[sha(t)]={uid,exp:now()+90*864e5};mark('s:all');
  res.setHeader('Set-Cookie',`glint=${t}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${90*86400}${BASE.startsWith('https')?'; Secure':''}`);
}

/* ---------- validation ---------- */
const USERNAME=/^[a-z0-9_]{3,20}$/;
function cleanName(v){return String(v||'').replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,40)}
function cleanImg(v){
  if(!v)return '';
  const s=String(v);
  if(s.length>MAX_IMG*1.37)throw E(413,'Картинка слишком большая (до 1 МБ)');
  if(!/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(s))throw E(400,'Это не картинка');
  return s;
}

/* ---------- pictures: kept once, sent by link ----------
   Photos, stickers, avatars and stories are stored separately and messages carry only a short /img/… link.
   The phone downloads each picture once and keeps it, so chats open fast even on weak phones. */
const IMGBUF=new Map();
function putImg(dataUrl){
  const m=/^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl||''));if(!m)return '';
  const h=sha(m[2]).slice(0,24);
  if(!DB.imgs[h]){DB.imgs[h]={t:m[1],d:m[2]};mark('i:'+h)}
  return '/img/'+h;
}
function dropImg(url){const h=String(url||'').slice(5);if(DB.imgs[h]){delete DB.imgs[h];IMGBUF.delete(h);mark('i:'+h)}}
function imgBuf(h){
  let b=IMGBUF.get(h);if(b)return b;const r=DB.imgs[h];if(!r)return null;
  b={t:r.t,b:Buffer.from(r.d,'base64')};IMGBUF.set(h,b);if(IMGBUF.size>400)IMGBUF.delete(IMGBUF.keys().next().value);return b;
}
/* older data kept pictures inside messages; move them out once */
function migrate(){
  let n=0;
  for(const u of Object.values(DB.users)){
    if(u.avatar&&u.avatar.startsWith('data:')){u.avatar=putImg(u.avatar);mark('u:'+u.id);n++}
    if(u.stickers&&u.stickers.length){ /* personal stickers become the first sticker pack */
      const p={id:'p'+rid(6),name:'Мои стикеры',owner:u.id,created:now(),stickers:u.stickers.map(x=>({id:x.id,img:x.img.startsWith('data:')?putImg(x.img):x.img}))};
      DB.packs[p.id]=p;mark('p:'+p.id);u.packs=[p.id].concat(u.packs||[]);n++;
    }
    if(u.stickers){delete u.stickers;mark('u:'+u.id)}
  }
  for(const [cid,ms] of Object.entries(DB.msgs)){
    let ch=false;
    for(const m of ms){
      if(m.img&&m.img.startsWith('data:')){m.img=putImg(m.img);ch=true}
      if(m.sticker&&m.sticker.startsWith('data:')){m.sticker=putImg(m.sticker);ch=true}
    }
    if(ch){mark('m:'+cid);n++}
  }
  if(n)console.log('  Картинки перенесены в отдельное хранилище:',n);
}

/* ---------- REST API ---------- */
const API={};
API['POST /api/register']=(req,res,b)=>{
  if(!limit('reg:'+ip(req),5,3600e3))throw E(429,'Слишком много регистраций. Попробуй позже.');
  const username=String(b.username||'').toLowerCase().trim(),name=cleanName(b.name)||username,pass=String(b.password||'');
  if(!USERNAME.test(username))throw E(400,'Логин: 3–20 символов, латиница, цифры и _');
  if(pass.length<6||pass.length>200)throw E(400,'Пароль — минимум 6 символов');
  if(Object.values(DB.users).some(u=>u.username===username))throw E(409,'Этот логин уже занят');
  const u={id:'u'+rid(6),username,name,pass:hashPass(pass),color:COLORS[crypto.randomInt(COLORS.length)],created:now(),lastSeen:now()};
  DB.users[u.id]=u;mark('u:'+u.id);newSession(res,u.id);
  return {me:pubUser(u)};
};
API['POST /api/login']=(req,res,b)=>{
  const username=String(b.username||'').toLowerCase().trim();
  if(!limit('login:'+ip(req),10,600e3)||!limit('login:'+username,10,600e3))throw E(429,'Слишком много попыток. Подожди 10 минут.');
  const u=Object.values(DB.users).find(x=>x.username===username);
  if(!u||!checkPass(String(b.password||''),u.pass))throw E(401,'Неверный логин или пароль');
  newSession(res,u.id);return {me:pubUser(u)};
};
API['POST /api/logout']=(req,res)=>{
  const t=cookies(req).glint;if(t){delete DB.sessions[sha(t)];mark('s:all')}
  res.setHeader('Set-Cookie','glint=; Path=/; Max-Age=0');return {ok:true};
};
API['GET /api/version']=()=>({v:APP_VERSION});
API['GET /api/me']=(req,res,b,u)=>{
  if(!u)return {me:null};
  selfChat(u);
  const chats=Object.values(DB.chats).filter(c=>member(c,u.id)).map(c=>chatFor(c,u.id));
  const ids=new Set();chats.forEach(c=>c.members.forEach(m=>ids.add(m)));
  const servers=Object.values(DB.servers).filter(g=>g.members.includes(u.id));
  servers.forEach(g=>g.members.forEach(m=>ids.add(m)));
  Object.keys(u.contacts||{}).forEach(i=>ids.add(i));
  return {me:pubUser(u),chats,servers:servers.map(g=>serverOut(g,u.id)),packs:userPacks(u),contacts:u.contacts||{},stars:u.stars||[],tz:TZ,
    users:[...ids].map(i=>pubUser(DB.users[i])).filter(Boolean)};
};
API['POST /api/profile']=(req,res,b,u)=>{
  need(u);
  if(b.name!==undefined)u.name=cleanName(b.name)||u.username;
  if(b.bio!==undefined)u.bio=String(b.bio||'').slice(0,140);
  if(b.avatar!==undefined){const a=cleanImg(b.avatar);if(a.length>300e3)throw E(413,'Аватар слишком большой');u.avatar=a?putImg(a):''}
  if(b.newPassword){
    if(!checkPass(String(b.password||''),u.pass))throw E(401,'Текущий пароль неверный');
    if(String(b.newPassword).length<6)throw E(400,'Новый пароль — минимум 6 символов');
    u.pass=hashPass(String(b.newPassword));
  }
  mark('u:'+u.id);broadcastUser(u);return {me:pubUser(u)};
};
API['GET /api/users/search']=(req,res,b,u,q)=>{
  need(u);const s=String(q.get('q')||'').toLowerCase().replace(/^@/,'').trim();if(s.length<2)return {users:[]};
  return {users:Object.values(DB.users).filter(x=>x.id!==u.id&&(x.username.includes(s)||x.name.toLowerCase().includes(s))).slice(0,20).map(pubUser)};
};
API['POST /api/chats/dm']=(req,res,b,u)=>{
  need(u);const o=DB.users[String(b.userId||'')];if(!o||o.id===u.id)throw E(404,'Пользователь не найден');
  let c=Object.values(DB.chats).find(x=>x.type==='dm'&&member(x,u.id)&&member(x,o.id));
  if(!c){c={id:'c'+rid(6),type:'dm',members:[u.id,o.id],created:now(),read:{}};DB.chats[c.id]=c;DB.msgs[c.id]=[];mark('c:'+c.id);mark('m:'+c.id);pushChat(c)}
  return {chat:chatFor(c,u.id),users:[pubUser(o)]};
};
API['POST /api/chats/group']=(req,res,b,u)=>{
  need(u);const name=cleanName(b.name);if(!name)throw E(400,'Назови группу');
  const ids=[...new Set([u.id].concat((b.members||[]).map(String)))].filter(i=>DB.users[i]).slice(0,50);
  if(ids.length<2)throw E(400,'Добавь хотя бы одного участника');
  const c={id:'c'+rid(6),type:'group',name,members:ids,admin:u.id,created:now(),read:{},color:COLORS[crypto.randomInt(COLORS.length)]};
  DB.chats[c.id]=c;DB.msgs[c.id]=[];mark('c:'+c.id);mark('m:'+c.id);
  addMsg(c,{id:'m'+rid(8),from:u.id,ts:now(),sys:`${u.name} создал(а) группу «${name}»`});
  pushChat(c);return {chat:chatFor(c,u.id),users:ids.map(i=>pubUser(DB.users[i]))};
};
API['POST /api/chats/leave']=(req,res,b,u)=>{
  need(u);const c=DB.chats[String(b.chat||'')];if(!member(c,u.id)||c.type!=='group')throw E(404,'Группа не найдена');
  c.members=c.members.filter(i=>i!==u.id);mark('c:'+c.id);
  addMsg(c,{id:'m'+rid(8),from:u.id,ts:now(),sys:`${u.name} вышел(а) из группы`});pushChat(c);return {ok:true};
};
/* groups: anyone in the group can add people; the creator can sign members (a title next to the name), rename and remove */
function groupOf(id,u,admin){
  const c=DB.chats[String(id||'')];if(!member(c,u.id)||c.type!=='group')throw E(404,'Группа не найдена');
  if(admin&&c.admin!==u.id)throw E(403,'Это может только создатель группы');return c;
}
API['POST /api/chats/add']=(req,res,b,u)=>{
  need(u);const c=groupOf(b.chat,u);if(!limit('gadd:'+u.id,30,600e3))throw E(429,'Слишком часто');
  const ids=[...new Set((b.members||[]).map(String))].filter(i=>DB.users[i]&&!c.members.includes(i));
  if(!ids.length)throw E(400,'Выбери, кого добавить');
  if(c.members.length+ids.length>200)throw E(400,'В группе максимум 200 человек');
  c.members.push(...ids);mark('c:'+c.id);
  addMsg(c,{id:'m'+rid(8),from:u.id,ts:now(),sys:`${u.name} добавил(а) ${ids.map(i=>DB.users[i].name).join(', ')}`});
  pushChat(c);return {chat:chatFor(c,u.id),users:c.members.map(i=>pubUser(DB.users[i])).filter(Boolean)};
};
API['POST /api/chats/remove']=(req,res,b,u)=>{
  need(u);const c=groupOf(b.chat,u,true);const id=String(b.userId||'');
  if(id===u.id||!c.members.includes(id))throw E(400,'Нельзя');
  const gone=DB.users[id];addMsg(c,{id:'m'+rid(8),from:u.id,ts:now(),sys:`${u.name} удалил(а) ${gone?gone.name:'участника'}`});
  c.members=c.members.filter(i=>i!==id);if(c.titles)delete c.titles[id];mark('c:'+c.id);
  sendTo(id,{t:'chat',chat:Object.assign(chatFor(c,id),{members:c.members}),users:[]});pushChat(c);return {ok:true};
};
API['POST /api/chats/title']=(req,res,b,u)=>{
  need(u);const c=groupOf(b.chat,u,true);const id=String(b.userId||'');if(!c.members.includes(id))throw E(404,'Нет такого участника');
  const t=cleanName(b.title).slice(0,24);c.titles=c.titles||{};if(t)c.titles[id]=t;else delete c.titles[id];
  mark('c:'+c.id);pushChat(c);return {chat:chatFor(c,u.id)};
};
API['POST /api/chats/rename']=(req,res,b,u)=>{
  need(u);const c=groupOf(b.chat,u,true);const n=cleanName(b.name);if(!n)throw E(400,'Пустое название');
  c.name=n;mark('c:'+c.id);addMsg(c,{id:'m'+rid(8),from:u.id,ts:now(),sys:`${u.name} переименовал(а) группу в «${n}»`});pushChat(c);return {chat:chatFor(c,u.id)};
};
API['GET /api/messages']=(req,res,b,u,q)=>{
  need(u);const c=DB.chats[String(q.get('chat')||'')];if(!member(c,u.id))throw E(404,'Чат не найден');
  const before=+q.get('before')||Infinity,ms=DB.msgs[c.id]||[];
  const list=ms.filter(m=>m.ts<before);
  return {messages:list.slice(-PAGE).map(msgOut),more:list.length>PAGE};
};
API['GET /api/calls']=(req,res,b,u)=>{
  need(u);const out=[];
  for(const c of Object.values(DB.chats)){
    if(!member(c,u.id)||c.type!=='dm')continue;
    const other=c.members.find(x=>x!==u.id);
    for(const m of DB.msgs[c.id]||[])if(m.call)out.push({chat:c.id,user:other,ts:m.ts,out:m.from===u.id,kind:m.call.kind,dur:m.call.dur,missed:m.call.missed});
  }
  out.sort((a,b)=>b.ts-a.ts);
  const list=out.slice(0,60);
  return {calls:list,users:[...new Set(list.map(x=>x.user))].map(i=>pubUser(DB.users[i])).filter(Boolean)};
};

/* ---------- sticker packs: anyone can make packs from photos and share them; friends add a pack with one tap ---------- */
const MAX_STICKER=260e3,PACK_MAX=120,OWN_PACKS=30,HAVE_PACKS=60;
function cleanSticker(v){
  const s=String(v||'');
  if(s.length>MAX_STICKER*1.37)throw E(413,'Стикер слишком большой');
  if(!/^data:image\/(png|webp|jpeg);base64,[A-Za-z0-9+/=]+$/.test(s))throw E(400,'Это не картинка');
  return s;
}
const packOut=(p,uid)=>({id:p.id,name:p.name,owner:p.owner,ownerName:(DB.users[p.owner]||{}).name||'',stickers:p.stickers,mine:p.owner===uid});
function userPacks(u){
  const l=(u.packs||[]).filter(id=>DB.packs[id]);
  if(u.packs&&l.length!==u.packs.length){u.packs=l;mark('u:'+u.id)}
  return l.map(id=>packOut(DB.packs[id],u.id));
}
function packOf(id,u,own){
  const p=DB.packs[String(id||'')];if(!p)throw E(404,'Набор не найден');
  if(own&&p.owner!==u.id)throw E(403,'Менять набор может только его автор');
  return p;
}
function pushPack(p){for(const x of Object.values(DB.users))if((x.packs||[]).includes(p.id))sendTo(x.id,{t:'pack',pack:packOut(p,x.id)})}
API['POST /api/packs']=(req,res,b,u)=>{
  need(u);if(!limit('pk:'+u.id,20,3600e3))throw E(429,'Слишком много наборов за час');
  const name=cleanName(b.name);if(!name)throw E(400,'Назови набор');
  if(Object.values(DB.packs).filter(p=>p.owner===u.id).length>=OWN_PACKS)throw E(400,`Не больше ${OWN_PACKS} своих наборов`);
  const p={id:'p'+rid(6),name,owner:u.id,stickers:[],created:now()};DB.packs[p.id]=p;mark('p:'+p.id);
  u.packs=[p.id].concat(u.packs||[]);mark('u:'+u.id);
  return {pack:packOut(p,u.id),packs:userPacks(u)};
};
API['GET /api/packs/get']=(req,res,b,u,q)=>{need(u);const p=packOf(q.get('id'),u);return {pack:packOut(p,u.id),have:(u.packs||[]).includes(p.id)}};
API['POST /api/packs/install']=(req,res,b,u)=>{
  need(u);const p=packOf(b.pack,u);u.packs=u.packs||[];
  if(!u.packs.includes(p.id)){if(u.packs.length>=HAVE_PACKS)throw E(400,`Не больше ${HAVE_PACKS} наборов`);u.packs.push(p.id);mark('u:'+u.id)}
  return {packs:userPacks(u)};
};
API['POST /api/packs/remove']=(req,res,b,u)=>{
  need(u);const p=packOf(b.pack,u);
  if(p.owner===u.id&&b.everywhere){delete DB.packs[p.id];mark('p:'+p.id)} /* the author deletes it for everyone */
  u.packs=(u.packs||[]).filter(i=>i!==p.id);mark('u:'+u.id);return {packs:userPacks(u)};
};
API['POST /api/packs/rename']=(req,res,b,u)=>{
  need(u);const p=packOf(b.pack,u,true);const n=cleanName(b.name);if(!n)throw E(400,'Пустое название');
  p.name=n;mark('p:'+p.id);pushPack(p);return {packs:userPacks(u)};
};
API['POST /api/packs/add']=(req,res,b,u)=>{
  need(u);if(!limit('stk:'+u.id,60,600e3))throw E(429,'Слишком много стикеров подряд');
  const p=packOf(b.pack,u,true);
  if(p.stickers.length>=PACK_MAX)throw E(400,`В наборе максимум ${PACK_MAX} стикеров`);
  let img;
  if(b.fromMsg){ /* save a sticker someone sent into your own pack */
    const c=DB.chats[String(b.chat||'')];if(!member(c,u.id))throw E(404,'Чат не найден');
    const m=(DB.msgs[c.id]||[]).find(x=>x.id===String(b.fromMsg));if(!m||!(m.sticker||m.img))throw E(404,'Стикер не найден');
    img=m.sticker||m.img;
  }else img=putImg(cleanSticker(b.img));
  if(p.stickers.some(x=>x.img===img))throw E(409,'Этот стикер уже есть в наборе');
  p.stickers.push({id:'s'+rid(6),img});mark('p:'+p.id);pushPack(p);
  return {packs:userPacks(u)};
};
API['POST /api/packs/del']=(req,res,b,u)=>{
  need(u);const p=packOf(b.pack,u,true);p.stickers=p.stickers.filter(x=>x.id!==String(b.id||''));mark('p:'+p.id);pushPack(p);return {packs:userPacks(u)};
};

/* ---------- contacts: save people under your own names ---------- */
API['POST /api/contacts']=(req,res,b,u)=>{
  need(u);const o=DB.users[String(b.userId||'')];if(!o||o.id===u.id)throw E(404,'Пользователь не найден');
  u.contacts=u.contacts||{};
  if(!u.contacts[o.id]&&Object.keys(u.contacts).length>=1000)throw E(400,'Слишком много контактов');
  u.contacts[o.id]=cleanName(b.name)||o.name;mark('u:'+u.id);
  return {contacts:u.contacts,user:pubUser(o)};
};
API['POST /api/contacts/delete']=(req,res,b,u)=>{need(u);if(u.contacts){delete u.contacts[String(b.userId||'')];mark('u:'+u.id)}return {contacts:u.contacts||{}}};
API['GET /api/users/find']=(req,res,b,u,q)=>{ /* exact login, for "add contact" */
  need(u);const s=String(q.get('u')||'').toLowerCase().replace(/^@/,'').trim();
  const o=Object.values(DB.users).find(x=>x.username===s);if(!o)throw E(404,'Нет пользователя с логином @'+s);return {user:pubUser(o)};
};

/* ---------- Saved Messages: a chat with yourself; stars mark important messages in any chat ---------- */
function selfChat(u){
  let c=Object.values(DB.chats).find(x=>x.type==='self'&&x.members[0]===u.id);
  if(!c){c={id:'c'+rid(6),type:'self',members:[u.id],created:now(),read:{}};DB.chats[c.id]=c;DB.msgs[c.id]=[];mark('c:'+c.id);mark('m:'+c.id)}
  return c;
}
API['GET /api/starred']=(req,res,b,u)=>{
  need(u);const out=[],ids=new Set();
  for(const k of (u.stars||[]).slice().reverse()){
    const [cid,mid]=k.split(':'),c=DB.chats[cid];if(!member(c,u.id))continue;
    const m=(DB.msgs[cid]||[]).find(x=>x.id===mid);if(!m||m.del)continue;
    out.push({chat:cid,msg:m});ids.add(m.from);
  }
  return {items:out,users:[...ids].map(i=>pubUser(DB.users[i])).filter(Boolean)};
};

/* ---------- stories: a photo for 24 hours, seen by the people you chat with and your contacts ---------- */
const STORY_TTL=24*3600e3;
function partners(uid){ /* people in private chats and groups with this user, and anyone who saved them as a contact */
  const s=new Set();
  for(const c of Object.values(DB.chats))if((c.type==='dm'||c.type==='group')&&member(c,uid))c.members.forEach(m=>s.add(m));
  const u=DB.users[uid];if(u&&u.contacts)Object.keys(u.contacts).forEach(i=>s.add(i));
  s.delete(uid);return s;
}
const canSeeStory=(s,uid)=>s.user===uid||partners(s.user).has(uid);
const storyOut=(s,uid)=>({id:s.id,user:s.user,img:s.img,ts:s.ts,exp:s.exp,seen:!!(s.views||{})[uid],views:s.user===uid?Object.keys(s.views||{}).length:undefined});
API['GET /api/stories']=(req,res,b,u)=>{
  need(u);const t=now(),list=[],ids=new Set();
  const P=new Map(); /* author -> can this person see their stories */
  for(const s of Object.values(DB.stories)){
    if(s.exp<t)continue;
    if(s.user!==u.id){if(!P.has(s.user))P.set(s.user,partners(s.user).has(u.id));if(!P.get(s.user))continue}
    list.push(storyOut(s,u.id));ids.add(s.user);
  }
  list.sort((a,b)=>a.ts-b.ts);
  return {stories:list,users:[...ids].map(i=>pubUser(DB.users[i])).filter(Boolean)};
};
API['POST /api/stories']=(req,res,b,u)=>{
  need(u);if(!limit('story:'+u.id,30,864e5))throw E(429,'Слишком много историй за день');
  const d=cleanImg(b.img);if(!d)throw E(400,'Нет картинки');
  const s={id:'t'+rid(7),user:u.id,img:putImg(d),ts:now(),exp:now()+STORY_TTL,views:{}};
  DB.stories[s.id]=s;mark('t:'+s.id);
  const out=storyOut(s,null);
  partners(u.id).forEach(i=>sendTo(i,{t:'story',story:out,user:pubUser(u)}));
  sendTo(u.id,{t:'story',story:storyOut(s,u.id),user:pubUser(u)});
  return {story:storyOut(s,u.id)};
};
API['POST /api/stories/view']=(req,res,b,u)=>{
  need(u);const s=DB.stories[String(b.id||'')];if(!s||!canSeeStory(s,u.id))throw E(404,'История недоступна');
  if(s.user!==u.id&&!(s.views||{})[u.id]){s.views=s.views||{};s.views[u.id]=now();mark('t:'+s.id);sendTo(s.user,{t:'story-views',id:s.id,views:Object.keys(s.views).length})}
  return {ok:true};
};
API['GET /api/stories/viewers']=(req,res,b,u,q)=>{
  need(u);const s=DB.stories[String(q.get('id')||'')];if(!s||s.user!==u.id)throw E(404,'История недоступна');
  const l=Object.entries(s.views||{}).sort((a,b)=>b[1]-a[1]);
  return {viewers:l.map(([id,ts])=>({id,ts})),users:l.map(([id])=>pubUser(DB.users[id])).filter(Boolean)};
};
API['POST /api/stories/delete']=(req,res,b,u)=>{
  need(u);const s=DB.stories[String(b.id||'')];if(!s||s.user!==u.id)throw E(404,'История не найдена');
  dropStory(s);return {ok:true};
};
API['POST /api/stories/reply']=(req,res,b,u)=>{ /* answer a story: the message goes to the author's private chat with a small picture of the story */
  need(u);if(!limit('msg:'+u.id,30,10e3))throw E(429,'Слишком быстро');
  const s=DB.stories[String(b.id||'')];if(!s||s.exp<now()||!canSeeStory(s,u.id)||s.user===u.id)throw E(404,'История недоступна');
  const text=String(b.text||'').slice(0,MAX_TEXT).trim();if(!text)throw E(400,'Пустое сообщение');
  const o=DB.users[s.user];let c=Object.values(DB.chats).find(x=>x.type==='dm'&&member(x,u.id)&&member(x,o.id));
  if(!c){c={id:'c'+rid(6),type:'dm',members:[u.id,o.id],created:now(),read:{}};DB.chats[c.id]=c;DB.msgs[c.id]=[];mark('c:'+c.id);mark('m:'+c.id);pushChat(c)}
  const msg={id:'m'+rid(8),from:u.id,ts:now(),text,story:{id:s.id,img:s.img}};
  if(!s.replied){s.replied=true;mark('t:'+s.id)}
  sendMsgTo(c,u,msg);return {chat:c.id};
};
function dropStory(s){delete DB.stories[s.id];mark('t:'+s.id);
  if(!s.replied)dropImg(s.img); /* keep the picture if a reply in a chat still shows it */
  sendTo(s.user,{t:'story-gone',id:s.id});partners(s.user).forEach(i=>sendTo(i,{t:'story-gone',id:s.id}))}
setInterval(()=>{const t=now();for(const s of Object.values(DB.stories))if(s.exp<t)dropStory(s)},60e3).unref();

/* STUN finds the public address; TURN relays the call when two networks cannot connect directly */
API['GET /api/ice']=(req,res,b,u)=>{
  need(u);const s=[{urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302']}];
  if(process.env.TURN_URL)s.push({urls:process.env.TURN_URL.split(','),username:process.env.TURN_USERNAME||'',credential:process.env.TURN_CREDENTIAL||''});
  return {iceServers:s};
};
function need(u){if(!u)throw E(401,'Войди в аккаунт')}
const ip=req=>String(req.headers['x-forwarded-for']||req.socket.remoteAddress||'').split(',')[0].trim();


/* ---------- servers: text channels (stored as chats) and voice channels ---------- */
const VOICE=new Map(); /* voice channel id -> Map(userId -> {mute,deaf,ws}) */
function serverOut(g,uid){
  return {id:g.id,name:g.name,color:g.color,owner:g.owner,members:g.members,invite:g.owner===uid?g.invite:'',
    channels:g.channels.map(ch=>ch.type==='voice'?{id:ch.id,type:'voice',name:ch.name,users:voiceUsers(ch.id)}:{id:ch.id,type:'text',name:ch.name})};
}
const voiceUsers=cid=>[...(VOICE.get(cid)||new Map()).entries()].map(([id,v])=>({id,mute:!!v.mute,deaf:!!v.deaf}));
function pushServer(g,extra){
  g.members.forEach(m=>sendTo(m,Object.assign({t:'server',server:serverOut(g,m),users:g.members.map(i=>pubUser(DB.users[i])).filter(Boolean)},extra||{})));
}
const cleanChan=v=>String(v||'').toLowerCase().replace(/[\u0000-\u001f\u007f]/g,'').trim().replace(/\s+/g,'-').slice(0,32);
function serverOf(id,u,owner){
  const g=DB.servers[String(id||'')];
  if(!g||!g.members.includes(u.id))throw E(404,'Сервер не найден');
  if(owner&&g.owner!==u.id)throw E(403,'Это может только создатель сервера');
  return g;
}
function addTextChannel(g,name){
  const c={id:'c'+rid(6),type:'channel',server:g.id,name,members:g.members.slice(),created:now(),read:{}};
  DB.chats[c.id]=c;DB.msgs[c.id]=[];mark('c:'+c.id);mark('m:'+c.id);
  g.channels.push({id:c.id,type:'text',name});return c;
}
function syncMembers(g){
  g.channels.forEach(ch=>{if(ch.type==='text'&&DB.chats[ch.id]){DB.chats[ch.id].members=g.members.slice();mark('c:'+ch.id)}});
  mark('g:'+g.id);
}
API['POST /api/servers']=(req,res,b,u)=>{
  need(u);if(!limit('srv:'+u.id,10,3600e3))throw E(429,'Слишком много серверов за час');
  const name=cleanName(b.name);if(!name)throw E(400,'Назови сервер');
  if(Object.values(DB.servers).filter(g=>g.owner===u.id).length>=20)throw E(400,'Не больше 20 своих серверов');
  const g={id:'g'+rid(6),name,owner:u.id,members:[u.id],color:COLORS[crypto.randomInt(COLORS.length)],invite:rid(6),channels:[],created:now()};
  DB.servers[g.id]=g;
  const c=addTextChannel(g,'общий');
  g.channels.push({id:'v'+rid(6),type:'voice',name:'Голосовой'});
  mark('g:'+g.id);
  addMsg(c,{id:'m'+rid(8),from:u.id,ts:now(),sys:`${u.name} создал(а) сервер «${name}»`});
  pushServer(g);pushChat(c);return {server:serverOut(g,u.id)};
};
API['GET /api/servers/preview']=(req,res,b,u,q)=>{
  need(u);const code=String(q.get('code')||'');
  const g=Object.values(DB.servers).find(x=>x.invite&&x.invite===code);if(!g)throw E(404,'Приглашение недействительно');
  return {id:g.id,name:g.name,color:g.color,members:g.members.length,joined:g.members.includes(u.id)};
};
API['POST /api/servers/join']=(req,res,b,u)=>{
  need(u);if(!limit('join:'+u.id,20,3600e3))throw E(429,'Слишком много попыток');
  const code=String(b.code||'');const g=Object.values(DB.servers).find(x=>x.invite&&x.invite===code);
  if(!g)throw E(404,'Приглашение недействительно');
  if(!g.members.includes(u.id)){
    if(g.members.length>=200)throw E(400,'Сервер заполнен');
    g.members.push(u.id);syncMembers(g);
    const first=g.channels.find(ch=>ch.type==='text');
    if(first&&DB.chats[first.id])addMsg(DB.chats[first.id],{id:'m'+rid(8),from:u.id,ts:now(),sys:`${u.name} присоединился(ась) к серверу`});
    pushServer(g);g.channels.forEach(ch=>{if(ch.type==='text'&&DB.chats[ch.id])pushChat(DB.chats[ch.id])});
  }
  return {server:serverOut(g,u.id)};
};
API['POST /api/servers/leave']=(req,res,b,u)=>{
  need(u);const g=serverOf(b.server,u);
  if(g.owner===u.id)throw E(400,'Создатель не может выйти. Удали сервер в его настройках.');
  leaveVoiceOf(u.id,g);
  const before=g.members.slice();
  g.members=g.members.filter(i=>i!==u.id);syncMembers(g);
  const first=g.channels.find(ch=>ch.type==='text');
  if(first&&DB.chats[first.id])addMsg(DB.chats[first.id],{id:'m'+rid(8),from:u.id,ts:now(),sys:`${u.name} покинул(а) сервер`});
  sendTo(u.id,{t:'server-gone',server:g.id});pushServer(g);return {ok:true};
};
API['POST /api/servers/update']=(req,res,b,u)=>{
  need(u);const g=serverOf(b.server,u,true);
  if(b.name!==undefined){const n=cleanName(b.name);if(!n)throw E(400,'Пустое название');g.name=n}
  if(b.newInvite)g.invite=rid(6);
  mark('g:'+g.id);pushServer(g);return {server:serverOut(g,u.id)};
};
API['POST /api/servers/delete']=(req,res,b,u)=>{
  need(u);const g=serverOf(b.server,u,true);
  g.channels.forEach(ch=>{
    if(ch.type==='text'){delete DB.chats[ch.id];delete DB.msgs[ch.id];mark('c:'+ch.id);mark('m:'+ch.id)}
    else closeVoice(ch.id);
  });
  const members=g.members.slice();delete DB.servers[g.id];mark('g:'+g.id);
  members.forEach(m=>sendTo(m,{t:'server-gone',server:g.id}));return {ok:true};
};
API['POST /api/servers/channel']=(req,res,b,u)=>{
  need(u);const g=serverOf(b.server,u,true);
  if(g.channels.length>=50)throw E(400,'Не больше 50 каналов');
  const type=b.type==='voice'?'voice':'text';
  const name=type==='voice'?cleanName(b.name):cleanChan(b.name);if(!name)throw E(400,'Назови канал');
  if(type==='text'){const c=addTextChannel(g,name);pushChat(c)}
  else g.channels.push({id:'v'+rid(6),type:'voice',name});
  mark('g:'+g.id);pushServer(g);return {server:serverOut(g,u.id)};
};
API['POST /api/servers/channel/delete']=(req,res,b,u)=>{
  need(u);const g=serverOf(b.server,u,true);
  const ch=g.channels.find(x=>x.id===String(b.channel||''));if(!ch)throw E(404,'Канал не найден');
  if(ch.type==='text'&&g.channels.filter(x=>x.type==='text').length<=1)throw E(400,'Должен остаться хотя бы один текстовый канал');
  g.channels=g.channels.filter(x=>x!==ch);
  if(ch.type==='text'){delete DB.chats[ch.id];delete DB.msgs[ch.id];mark('c:'+ch.id);mark('m:'+ch.id)}else closeVoice(ch.id);
  mark('g:'+g.id);pushServer(g,{removed:ch.id});return {ok:true};
};

/* voice: everyone in a channel connects to everyone (mesh); the server keeps the list and passes signals */
const VOICE_MAX=8;
function serverOfVoice(cid){return Object.values(DB.servers).find(g=>g.channels.some(ch=>ch.id===cid&&ch.type==='voice'))}
function voiceBroadcast(cid){const g=serverOfVoice(cid);if(g)g.members.forEach(m=>sendTo(m,{t:'voice',server:g.id,channel:cid,users:voiceUsers(cid)}))}
function voiceLeave(uid,cid,quiet){
  const room=VOICE.get(cid);if(!room||!room.has(uid))return;
  room.delete(uid);if(!room.size)VOICE.delete(cid);
  room.forEach((v,other)=>sendTo(other,{t:'vpeer-left',channel:cid,user:uid}));
  if(!quiet)voiceBroadcast(cid);
}
function voiceChannelOf(uid){for(const [cid,room] of VOICE)if(room.has(uid))return cid;return null}
function leaveVoiceOf(uid,g){g.channels.forEach(ch=>{if(ch.type==='voice'&&VOICE.get(ch.id)&&VOICE.get(ch.id).has(uid)){const r=VOICE.get(ch.id).get(uid);voiceLeave(uid,ch.id);if(r.ws&&r.ws.readyState===1)r.ws.send(JSON.stringify({t:'vkicked',channel:ch.id}))}})}
function closeVoice(cid){const room=VOICE.get(cid);if(!room)return;room.forEach(v=>{if(v.ws&&v.ws.readyState===1)v.ws.send(JSON.stringify({t:'vkicked',channel:cid}))});VOICE.delete(cid)}
/* ---------- the streak pet («Серийчик»): one per private chat; both people can name and dress it.
   Some things open only after a long streak (the best one this pair ever had). ---------- */
const PET_ITEMS={color:{ember:0,rose:0,sky:0,mint:0,grape:0,night:14,gold:30},hat:{none:0,cap:0,beanie:0,bow:0,flower:0,headphones:7,witch:7,tophat:14,crown:30},
  eyes:{none:0,round:0,sun:0,hearts:0,star:7},neck:{none:0,scarf:0,bowtie:0,beads:0,bandana:7,medal:30}};
API['POST /api/pet']=(req,res,b,u)=>{
  need(u);const c=DB.chats[String(b.chat||'')];if(!member(c,u.id)||c.type!=='dm')throw E(404,'Чат не найден');
  if(!c.pet)throw E(400,'Серийчик появится, когда вы напишете друг другу в один день');
  if(!limit('pet:'+u.id,60,60e3))throw E(429,'Слишком часто');
  const best=c.pet.best||0;
  for(const k of Object.keys(PET_ITEMS))if(b[k]!==undefined){
    const v=String(b[k]),need=PET_ITEMS[k][v];if(need===undefined)throw E(400,'Нет такой вещи');
    if(need>best)throw E(403,`Откроется на ${need}-й день серии`);c.pet[k]=v;
  }
  if(b.name!==undefined){const n=cleanName(b.name).slice(0,20);c.pet.name=n||'Серийчик'}
  mark('c:'+c.id);pushChat(c);return {chat:chatFor(c,u.id)};
};
/* ---------- messages ---------- */
const FIRE_DAYS=[3,7,10,30,50,100,365];
function sendMsgTo(c,u,msg){
  c.read=c.read||{};c.read[u.id]=msg.ts;
  addMsg(c,msg);
  const n=bumpStreak(c,u.id,msg.ts);
  if(n){
    if(FIRE_DAYS.includes(n))addMsg(c,{id:'m'+rid(8),from:u.id,ts:now(),sys:n===3?'🔥 Огонёк! Вы общаетесь 3 дня подряд':`🔥 ${n} дней подряд!`});
    mark('c:'+c.id);pushChat(c);
  }else if(c.type==='dm'&&c.st&&c.st.u.length===1&&c.st.d===dayKey(msg.ts))pushChat(c);
  return msg;
}
function addMsg(c,m){
  const ms=DB.msgs[c.id]=DB.msgs[c.id]||[];ms.push(m);
  if(ms.length>KEEP_MSGS)ms.splice(0,ms.length-KEEP_MSGS);
  c.lastAt=m.ts;mark('m:'+c.id);mark('c:'+c.id);
  toChat(c,{t:'msg',chat:c.id,msg:msgOut(m)});
}

/* ---------- live connections ---------- */
const SOCKS=new Map(); /* userId -> Set(ws) */
const ONLINE=new Set();
function sendTo(uid,o){const s=SOCKS.get(uid);if(!s)return 0;const j=JSON.stringify(o);s.forEach(w=>{if(w.readyState===1)w.send(j)});return s.size}
function toChat(c,o,except){c.members.forEach(m=>{if(m!==except)sendTo(m,o)})}
function pushChat(c){c.members.forEach(m=>sendTo(m,{t:'chat',chat:chatFor(c,m),users:c.members.map(i=>pubUser(DB.users[i])).filter(Boolean)}))}
function contactsOf(uid){const s=new Set();Object.values(DB.chats).forEach(c=>{if(member(c,uid))c.members.forEach(m=>s.add(m))});s.delete(uid);return s}
function broadcastUser(u){const p=pubUser(u);contactsOf(u.id).forEach(i=>sendTo(i,{t:'user',user:p}));sendTo(u.id,{t:'user',user:p})}

/* calls: one-to-one; the server only passes offers, answers and network candidates between the two sides */
const CALLS=new Map(); /* callId -> {id,a,b,chat,kind,state,ts} */
const inCall=uid=>[...CALLS.values()].some(c=>(c.a===uid||c.b===uid)&&c.state!=='ended');
function endCall(call,reason,by){
  if(!call||call.state==='ended')return;
  const was=call.state;call.state='ended';CALLS.delete(call.id);
  [call.a,call.b].forEach(x=>sendTo(x,{t:'call-end',callId:call.id,reason,by}));
  const c=DB.chats[call.chat];
  if(c){
    const dur=was==='active'?Math.round((now()-call.started)/1000):0;
    addMsg(c,{id:'m'+rid(8),from:call.a,ts:now(),call:{kind:call.kind,dur,missed:was!=='active'}});
  }
}

function onSocket(ws,u){
  if(!SOCKS.has(u.id))SOCKS.set(u.id,new Set());
  SOCKS.get(u.id).add(ws);
  if(!ONLINE.has(u.id)){ONLINE.add(u.id);broadcastUser(u)}
  ws.isAlive=true;ws.on('pong',()=>{ws.isAlive=true});
  ws.on('message',raw=>{
    if(raw.length>MAX_IMG*1.5)return;
    let m;try{m=JSON.parse(raw)}catch(e){return}
    try{handle(ws,u,m)}catch(e){ws.send(JSON.stringify({t:'error',error:e.code?e.message:'ошибка сервера',cid:m&&m.cid}));if(!e.code)console.error(e)}
  });
  ws.on('close',()=>{
    const s=SOCKS.get(u.id);if(s){s.delete(ws);if(!s.size){SOCKS.delete(u.id);ONLINE.delete(u.id);u.lastSeen=now();mark('u:'+u.id);broadcastUser(u)}}
    if(!SOCKS.has(u.id))for(const c of CALLS.values())if(c.a===u.id||c.b===u.id)endCall(c,'offline',u.id);
    const vc=voiceChannelOf(u.id);if(vc&&VOICE.get(vc).get(u.id).ws===ws)voiceLeave(u.id,vc);
  });
}
function handle(ws,u,m){
  const c=m.chat?DB.chats[String(m.chat)]:null;
  switch(m.t){
    case 'send':{
      if(!member(c,u.id))throw E(404,'Чат не найден');
      if(!limit('msg:'+u.id,30,10e3))throw E(429,'Слишком быстро');
      const text=String(m.text||'').slice(0,MAX_TEXT).trim(),img=cleanImg(m.img);
      let stk=null,pk=null;
      if(m.sticker&&typeof m.sticker==='object'){
        pk=DB.packs[String(m.sticker.pack||'')];
        if(pk&&(u.packs||[]).includes(pk.id))stk=pk.stickers.find(x=>x.id===String(m.sticker.id||''));
        if(!stk)throw E(404,'Стикер не найден');
      }
      if(!text&&!img&&!stk)return;
      const msg={id:'m'+rid(8),from:u.id,ts:now(),text:stk?'':text};
      if(stk){msg.sticker=stk.img;msg.pack=pk.id}else if(img)msg.img=putImg(img);
      if(m.reply){const r=(DB.msgs[c.id]||[]).find(x=>x.id===String(m.reply));if(r&&!r.del)msg.reply={id:r.id,from:r.from,text:(r.text||(r.img?'📷 Фото':r.sticker?'Стикер':'')).slice(0,120)}}
      sendMsgTo(c,u,msg);ws.send(JSON.stringify({t:'ack',cid:m.cid,id:msg.id}));
      return;
    }
    case 'fwd':{ /* forward a message to another chat (or to Saved Messages) */
      if(!member(c,u.id))throw E(404,'Чат не найден');
      if(!limit('msg:'+u.id,30,10e3))throw E(429,'Слишком быстро');
      const to=DB.chats[String(m.to||'')];if(!member(to,u.id))throw E(404,'Чат не найден');
      const src=(DB.msgs[c.id]||[]).find(x=>x.id===String(m.id));if(!src||src.del||src.sys||src.call)throw E(404,'Сообщение не найдено');
      const msg={id:'m'+rid(8),from:u.id,ts:now(),text:src.text||''};
      if(src.img)msg.img=src.img;if(src.sticker){msg.sticker=src.sticker;if(src.pack)msg.pack=src.pack}
      if(src.from!==u.id||src.fwd)msg.fwd=src.fwd||{from:src.from,name:(DB.users[src.from]||{}).name||''};
      sendMsgTo(to,u,msg);ws.send(JSON.stringify({t:'fwd-ok',to:to.id}));return;
    }
    case 'star':{
      if(!member(c,u.id))return;const k=c.id+':'+String(m.id||'');
      if(!(DB.msgs[c.id]||[]).some(x=>x.id===String(m.id)))return;
      u.stars=u.stars||[];const i=u.stars.indexOf(k);
      if(i>=0)u.stars.splice(i,1);else{u.stars.push(k);if(u.stars.length>1000)u.stars.shift()}
      mark('u:'+u.id);sendTo(u.id,{t:'stars',stars:u.stars});return;
    }
    case 'edit':case 'del':{
      if(!member(c,u.id))return;
      const msg=(DB.msgs[c.id]||[]).find(x=>x.id===String(m.id));
      if(!msg||msg.from!==u.id||msg.sys||msg.call)throw E(403,'Можно менять только свои сообщения');
      if(m.t==='edit'){const t=String(m.text||'').slice(0,MAX_TEXT).trim();if(!t)return;msg.text=t;msg.edited=now()}
      else{msg.del=true;delete msg.text;delete msg.img;delete msg.reply;delete msg.sticker}
      mark('m:'+c.id);toChat(c,{t:'upd',chat:c.id,msg:msgOut(msg)});return;
    }
    case 'react':{
      if(!member(c,u.id))return;
      const msg=(DB.msgs[c.id]||[]).find(x=>x.id===String(m.id));if(!msg||msg.del)return;
      const e=String(m.emoji||'');if(!['❤️','👍','😂','😮','😢','🔥'].includes(e))return;
      msg.react=msg.react||{};const list=msg.react[e]=msg.react[e]||[];
      const i=list.indexOf(u.id);if(i>=0)list.splice(i,1);else list.push(u.id);
      if(!list.length)delete msg.react[e];
      mark('m:'+c.id);toChat(c,{t:'upd',chat:c.id,msg:msgOut(msg)});return;
    }
    case 'pat':if(member(c,u.id)&&c.type==='dm'&&c.pet&&limit('pat:'+u.id,20,10e3))toChat(c,{t:'pat',chat:c.id,user:u.id},u.id);return;
    case 'typing':if(member(c,u.id)&&limit('typ:'+u.id,8,3e3))toChat(c,{t:'typing',chat:c.id,user:u.id},u.id);return;
    case 'read':{
      if(!member(c,u.id))return;const ts=Math.min(+m.ts||0,now());
      c.read=c.read||{};if(ts>(c.read[u.id]||0)){c.read[u.id]=ts;mark('c:'+c.id);toChat(c,{t:'read',chat:c.id,user:u.id,ts})}return;
    }
    /* ----- voice channels ----- */
    case 'vjoin':{
      const cid=String(m.channel||''),g=serverOfVoice(cid);
      if(!g||!g.members.includes(u.id))throw E(404,'Канал не найден');
      if(inCall(u.id))throw E(409,'Сначала заверши звонок');
      const prev=voiceChannelOf(u.id);if(prev===cid){const r=VOICE.get(cid).get(u.id);if(r.ws!==ws){voiceLeave(u.id,cid,true)}else return}else if(prev)voiceLeave(u.id,prev);
      const room=VOICE.get(cid)||new Map();
      if(room.size>=VOICE_MAX)throw E(400,`В голосовом канале максимум ${VOICE_MAX} человек`);
      const peers=[...room.keys()];
      room.set(u.id,{mute:!!m.mute,deaf:!!m.deaf,ws});VOICE.set(cid,room);
      ws.send(JSON.stringify({t:'vjoined',channel:cid,server:g.id,peers}));
      voiceBroadcast(cid);return;
    }
    case 'vleave':{const cid=voiceChannelOf(u.id);if(cid&&VOICE.get(cid).get(u.id).ws===ws)voiceLeave(u.id,cid);return}
    case 'vstate':{const cid=voiceChannelOf(u.id);if(!cid)return;const r=VOICE.get(cid).get(u.id);r.mute=!!m.mute;r.deaf=!!m.deaf;voiceBroadcast(cid);return}
    case 'vrtc':{
      const cid=voiceChannelOf(u.id),to=String(m.to||'');if(!cid)return;
      const room=VOICE.get(cid),peer=room&&room.get(to);if(!peer||!peer.ws||peer.ws.readyState!==1)return;
      const d=m.data;if(!d||typeof d!=='object'||JSON.stringify(d).length>60e3)return;
      peer.ws.send(JSON.stringify({t:'vrtc',channel:cid,from:u.id,data:d}));return;
    }
    /* ----- calls ----- */
    case 'call':{
      if(!member(c,u.id)||c.type!=='dm')throw E(400,'Звонить можно в личном чате');
      if(!limit('call:'+u.id,6,60e3))throw E(429,'Слишком много звонков подряд');
      const other=c.members.find(x=>x!==u.id);
      if(inCall(u.id))throw E(409,'Ты уже в звонке');
      if(voiceChannelOf(u.id))throw E(409,'Сначала выйди из голосового канала');
      const busy=inCall(other)||!!voiceChannelOf(other);
      const call={id:'k'+rid(8),a:u.id,b:other,chat:c.id,kind:m.kind==='video'?'video':'audio',state:'ringing',ts:now()};
      CALLS.set(call.id,call);
      ws.send(JSON.stringify({t:'call-started',callId:call.id,chat:c.id,to:other,kind:call.kind}));
      if(busy){endCall(call,'busy',other);return}
      if(!sendTo(other,{t:'call-incoming',callId:call.id,chat:c.id,from:pubUser(u),kind:call.kind})){endCall(call,'offline',other);return}
      setTimeout(()=>{if(call.state==='ringing')endCall(call,'timeout')},45e3);
      return;
    }
    case 'call-accept':case 'call-reject':case 'call-end':case 'rtc':{
      const call=CALLS.get(String(m.callId||''));if(!call||(call.a!==u.id&&call.b!==u.id))return;
      const peer=call.a===u.id?call.b:call.a;
      if(m.t==='call-accept'){if(call.b!==u.id||call.state!=='ringing')return;call.state='active';call.started=now();
        sendTo(call.a,{t:'call-accepted',callId:call.id});
        SOCKS.get(u.id).forEach(w=>{if(w!==ws&&w.readyState===1)w.send(JSON.stringify({t:'call-end',callId:call.id,reason:'elsewhere'}))});return}
      if(m.t==='call-reject'){endCall(call,u.id===call.b?'rejected':'cancelled',u.id);return}
      if(m.t==='call-end'){endCall(call,'hangup',u.id);return}
      /* rtc: offer / answer / ice candidate / media state, relayed as is to the other side only */
      const d=m.data;if(!d||typeof d!=='object'||JSON.stringify(d).length>60e3)return;
      sendTo(peer,{t:'rtc',callId:call.id,data:d});return;
    }
  }
}

/* ---------- HTTP ---------- */
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.mp3':'audio/mpeg','.bin':'application/octet-stream','.wasm':'application/wasm','.mjs':'text/javascript; charset=utf-8','.task':'application/octet-stream','.tflite':'application/octet-stream','.txt':'text/plain; charset=utf-8'};
const SEC={'X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','X-Frame-Options':'DENY',
  'Permissions-Policy':'camera=(self), microphone=(self), display-capture=(self)',
  'Content-Security-Policy':"default-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self' ws: wss:; style-src 'self' 'unsafe-inline'; script-src 'self' 'wasm-unsafe-eval'; font-src 'self' data:; frame-ancestors 'none'"};
function send(res,code,o){res.writeHead(code,Object.assign({'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'},SEC));res.end(JSON.stringify(o))}
function body(req){return new Promise((ok,bad)=>{const ch=[];let n=0;req.on('data',c=>{n+=c.length;if(n>2e6){bad(E(413,'Слишком много данных'));req.destroy();return}ch.push(c)});req.on('end',()=>{try{ok(ch.length?JSON.parse(Buffer.concat(ch).toString('utf8')):{})}catch(e){bad(E(400,'Неверный запрос'))}});req.on('error',bad)})}
const sameOrigin=req=>{const o=req.headers.origin;if(!o)return true;try{return new URL(o).host===req.headers.host}catch(e){return false}};

const server=http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://x'),p=decodeURIComponent(url.pathname);
    if(p.startsWith('/api/')){
      const fn=API[req.method+' '+p];if(!fn)return send(res,404,{error:'нет такого запроса'});
      if(req.method!=='GET'&&!sameOrigin(req))return send(res,403,{error:'запрос с чужого сайта'});
      const b=req.method==='POST'?await body(req):{};
      return send(res,200,await fn(req,res,b,userOf(req),url.searchParams));
    }
    if(p==='/healthz')return send(res,200,{ok:true});
    if(p.startsWith('/img/')){ /* pictures: only for signed-in people; a link never changes, so the phone keeps it */
      const h=p.slice(5);if(!/^[0-9a-f]{24}$/.test(h)||!userOf(req))return send(res,404,{error:'нет'});
      const im=imgBuf(h);if(!im)return send(res,404,{error:'картинка удалена'});
      const etag='"'+h+'"';
      if(req.headers['if-none-match']===etag){res.writeHead(304,{ETag:etag});return res.end()}
      res.writeHead(200,Object.assign({'Content-Type':im.t,'Content-Length':im.b.length,'Cache-Control':'private, max-age=31536000, immutable',ETag:etag},SEC));return res.end(im.b);
    }
    let f=path.normalize(path.join(PUB,p==='/'?'index.html':p));
    if(!f.startsWith(PUB))return send(res,403,{error:'нет'});
    fs.stat(f,(e,st)=>{
      if(e||!st.isFile()){f=path.join(PUB,'index.html');try{st=fs.statSync(f)}catch(x){st=null}}
      const ext=path.extname(f),etag='"'+APP_VERSION+'-'+Math.round(st?st.mtimeMs:0).toString(36)+'-'+(st?st.size:0)+'"';
      if(st&&req.headers['if-none-match']===etag){res.writeHead(304,{ETag:etag,'Cache-Control':'no-cache'});return res.end()}
      const h=Object.assign({ETag:etag,'Content-Type':MIME[ext]||'application/octet-stream','Cache-Control':f.includes(path.sep+'vendor'+path.sep)?'public, max-age=2592000':/\.(html|js|css|webmanifest)$/.test(ext)?'no-cache':'public, max-age=86400','Vary':'Accept-Encoding'},SEC);
      /* text files are sent compressed (about 4x smaller), compressed once and kept in memory */
      const isIndex=f.endsWith('index.html');
      const body=()=>{const b=fs.readFileSync(f);return isIndex?Buffer.from(b.toString('utf8').replace(/\?v=[\w-]+/g,'?v='+APP_VERSION)):b};
      if(isIndex&&!/\bgzip\b/.test(req.headers['accept-encoding']||'')){res.writeHead(200,h);return res.end(body())}
      /* the big mask engine files are compressed once in the background; until then they go out as they are */
      if(/\.(wasm|task|tflite)$/.test(f)&&/\bgzip\b/.test(req.headers['accept-encoding']||'')){
        const key=f+':'+(st&&st.mtimeMs),gz=GZ.get(key);
        if(gz&&gz!=='busy'){h['Content-Encoding']='gzip';h['Content-Length']=gz.length;res.writeHead(200,h);return res.end(gz)}
        if(!gz){GZ.set(key,'busy');zlib.gzip(fs.readFileSync(f),{level:6},(e,b)=>{if(e)GZ.delete(key);else GZ.set(key,b)})}
      }
      if(/\.(js|mjs|css|html|svg|webmanifest|json)$/.test(f)&&/\bgzip\b/.test(req.headers['accept-encoding']||'')){
        const key=f+':'+(st&&st.mtimeMs);let gz=GZ.get(key);
        if(!gz){gz=zlib.gzipSync(body(),{level:9});GZ.set(key,gz)}
        h['Content-Encoding']='gzip';h['Content-Length']=gz.length;res.writeHead(200,h);return res.end(gz);
      }
      res.writeHead(200,h);fs.createReadStream(f).pipe(res);
    });
  }catch(e){if(!e.code)console.error(e);send(res,e.code||500,{error:e.code?e.message:'ошибка сервера'})}
});

const wss=new WebSocketServer({noServer:true,maxPayload:2e6});
server.on('upgrade',(req,sock,head)=>{
  if(new URL(req.url,'http://x').pathname!=='/ws'||!sameOrigin(req)){sock.destroy();return}
  const u=userOf(req);if(!u){sock.write('HTTP/1.1 401 Unauthorized\r\n\r\n');sock.destroy();return}
  wss.handleUpgrade(req,sock,head,ws=>onSocket(ws,u));
});
setInterval(()=>{wss.clients.forEach(ws=>{if(!ws.isAlive)return ws.terminate();ws.isAlive=false;ws.ping()})},25e3).unref();

load().then(where=>{migrate();return where}).then(where=>server.listen(PORT,()=>{
  console.log(`\n  Manasenger работает: ${BASE}  (порт ${PORT})`);
  console.log(`  Данные: ${where} · пользователей ${Object.keys(DB.users).length}`);
  console.log(`  Звонки: ${process.env.TURN_URL?'STUN + TURN':'только STUN (TURN не задан)'}\n`);
})).catch(e=>{console.error('Не удалось запустить:',e);process.exit(1)});
