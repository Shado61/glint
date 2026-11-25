/* Manasenger service worker: installable app; always takes fresh app files from the server, the saved copy only when offline.
   Pictures (/img/…) and the mask library never change, so they are kept and shown instantly — less data and faster chats. */
const V='manasenger-v5',IMG='mn-img';
self.addEventListener('install',e=>{self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V&&k!==IMG).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
async function trim(){const c=await caches.open(IMG),ks=await c.keys();if(ks.length>600)for(const k of ks.slice(0,ks.length-500))await c.delete(k)}
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin||u.pathname.startsWith('/api/')||u.pathname==='/ws')return;
  if(u.pathname.startsWith('/img/')||u.pathname.startsWith('/vendor/')){
    e.respondWith(caches.open(IMG).then(c=>c.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{if(r.ok){c.put(e.request,r.clone());if(Math.random()<.05)trim()}return r}))));
    return;
  }
  e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{if(r.ok){const c=r.clone();caches.open(V).then(x=>x.put(e.request,c))}return r})
    .catch(()=>caches.match(e.request).then(r=>r||caches.match('/'))));
});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(self.clients.matchAll({type:'window'}).then(l=>l.length?l[0].focus():self.clients.openWindow('/')))});
