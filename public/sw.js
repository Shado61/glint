/* Manasenger service worker.
   - App files carry their version in the link (?v=…), so they are kept and opened instantly; a new version gets a new link.
   - The page itself is always asked from the server first (that is how a new version arrives), the saved copy only offline.
   - Pictures (/img/…) and the mask library never change: kept and shown instantly.
   - Push: message and call notifications even when Manasenger is closed. */
const V='manasenger-v8',APP='mn-app',IMG='mn-img';
self.addEventListener('install',e=>{self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>![V,APP,IMG].includes(k)).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
async function trim(name,max){const c=await caches.open(name),ks=await c.keys();if(ks.length>max)for(const k of ks.slice(0,ks.length-Math.round(max*.8)))await c.delete(k)}
const keep=(name,max)=>req=>caches.open(name).then(c=>c.match(req).then(hit=>hit||fetch(req).then(r=>{if(r.ok&&r.status===200){c.put(req,r.clone());if(Math.random()<.05)trim(name,max)}return r})));
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin||u.pathname.startsWith('/api/')||u.pathname.startsWith('/media/')||u.pathname.startsWith('/once/')||u.pathname==='/ws'||r.headers.has('range'))return;
  if(u.pathname.startsWith('/img/')||u.pathname.startsWith('/vendor/'))return e.respondWith(keep(IMG,600)(r));
  if(u.searchParams.has('v'))return e.respondWith(keep(APP,40)(r));
  e.respondWith(fetch(r,{cache:'no-store'}).then(res=>{if(res.ok){const c=res.clone();caches.open(V).then(x=>x.put(r,c))}return res})
    .catch(()=>caches.match(r).then(x=>x||caches.match('/'))));
});

/* ---------- notifications ---------- */
const windows=()=>self.clients.matchAll({type:'window',includeUncontrolled:true});
self.addEventListener('push',e=>{
  let d={};try{d=e.data.json()}catch(x){d={title:'Manasenger',body:e.data?e.data.text():''}}
  e.waitUntil((async()=>{
    if(d.type==='call-end'){(await self.registration.getNotifications({tag:d.tag})).forEach(n=>n.close());return}
    const ws=await windows();
    /* a window with this chat is open on screen: it shows the message itself */
    if(d.type==='msg'&&ws.some(w=>w.visibilityState==='visible'&&w.focused))return;
    const call=d.type==='call'||d.type==='gcall';
    const opts={body:d.body||'',tag:d.tag||'mn',icon:d.icon||'/icon-192.png',badge:'/icon-192.png',renotify:true,
      data:d,timestamp:Date.now(),vibrate:call?[400,200,400,200,400,200,400]:[120,60,120]};
    if(call){opts.requireInteraction=true;opts.actions=[{action:'answer',title:d.type==='gcall'?'✅ Войти':'✅ Ответить'},{action:'decline',title:'❌ Отклонить'}]}
    else{
      /* several messages from one chat stack into one notification */
      const old=(await self.registration.getNotifications({tag:opts.tag}))[0];
      const n=old&&old.data&&old.data.n?old.data.n+1:1;
      if(n>1){opts.body=d.body+`\n+ ещё ${n-1}`;opts.data=Object.assign({},d,{n})}else opts.data=Object.assign({},d,{n:1});
    }
    await self.registration.showNotification(d.title||'Manasenger',opts);
  })());
});
self.addEventListener('notificationclick',e=>{
  const d=e.notification.data||{},act=e.action;e.notification.close();
  e.waitUntil((async()=>{
    /* the "call is going on" notification: back to the call, or hang up */
    if(d.type==='live'){const ws=await windows();const w=ws[0];
      if(act==='hangup'){if(w)w.postMessage({t:'live-hangup'});return}
      if(w){try{await w.focus()}catch(x){}return}await self.clients.openWindow('/');return}
    if(d.type==='gcall'&&act==='decline')return;
    if(d.type==='call'&&act==='decline'){
      await fetch('/api/call/reject',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({callId:d.callId})}).catch(()=>{});
      return;
    }
    const msg=d.type==='call'?{t:'notif-call',callId:d.callId,answer:act==='answer'}:d.type==='gcall'?{t:'notif-gcall',chat:d.chat,answer:act==='answer'}:{t:'notif-chat',chat:d.chat};
    const url=d.type==='call'?`/#call=${d.callId}${act==='answer'?'&a=1':''}`:d.type==='gcall'?`/#gcall=${d.chat}${act==='answer'?'&a=1':''}`:(d.chat?`/#chat=${d.chat}`:'/');
    const ws=await windows();
    const w=ws.find(x=>x.visibilityState==='visible')||ws[0];
    if(w){try{await w.focus()}catch(x){}w.postMessage(msg);return}
    await self.clients.openWindow(url);
  })());
});
self.addEventListener('pushsubscriptionchange',e=>{
  e.waitUntil(fetch('/api/push/key').then(r=>r.json()).then(k=>self.registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:k.key}))
    .then(sub=>fetch('/api/push/sub',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({sub})})).catch(()=>{}));
});
