/* Manasenger — masks and filters for the camera (calls and stories).
   Loaded only when someone opens masks. The camera picture is redrawn on a canvas with the mask on top;
   the canvas becomes a new video track that goes into the call or the story.
   Face tracking: face-api (tiny face detector + 68 face points), loaded from /vendor on first use. */
'use strict';
(function(){
const EMO='"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
const LITE=document.documentElement.classList.contains('lite');

/* ---------- masks ---------- */
/* f: face geometry in canvas pixels — le/re eyes, nose, mouth, chin, top (forehead), c (centre), w (face width), a (tilt) */
function emoji(x,ch,px,py,size){x.font=`${Math.round(size)}px ${EMO}`;x.textAlign='center';x.textBaseline='middle';x.fillText(ch,px,py)}
function local(x,f,p,fn){x.save();x.translate(p.x,p.y);x.rotate(f.a);fn(f.w);x.restore()}
function ear(x,cx,cy,w,h,tilt,outer,inner){
  x.save();x.translate(cx,cy);x.rotate(tilt);
  x.beginPath();x.moveTo(-w/2,0);x.quadraticCurveTo(-w*.1,-h*1.05,0,-h);x.quadraticCurveTo(w*.1,-h*1.05,w/2,0);x.closePath();x.fillStyle=outer;x.fill();
  if(inner){x.beginPath();x.moveTo(-w*.28,-h*.08);x.quadraticCurveTo(0,-h*.95,w*.28,-h*.08);x.closePath();x.fillStyle=inner;x.fill()}
  x.restore();
}
function heart(x,cx,cy,s,col){x.save();x.translate(cx,cy);x.scale(s,s);x.beginPath();x.moveTo(0,.35);x.bezierCurveTo(-.9,-.25,-.45,-.95,0,-.45);x.bezierCurveTo(.45,-.95,.9,-.25,0,.35);x.fillStyle=col;x.fill();x.restore()}
function lens(x,p,r,col){x.beginPath();x.ellipse(p.x,p.y,r,r*.8,0,0,Math.PI*2);x.fillStyle=col;x.fill()}
const T=()=>performance.now()/1000;

const MASKS=[
  {id:'none',e:'🚫',n:'Без маски'},
  {id:'cat',e:'🐱',n:'Котик',draw(x,f){
    local(x,f,f.top,w=>{ear(x,-w*.33,w*.05,w*.36,w*.42,-.25,'#3b3b46','#f3a6c0');ear(x,w*.33,w*.05,w*.36,w*.42,.25,'#3b3b46','#f3a6c0')});
    local(x,f,f.nose,w=>{x.beginPath();x.moveTo(-w*.06,-w*.03);x.lineTo(w*.06,-w*.03);x.lineTo(0,w*.04);x.closePath();x.fillStyle='#f08aa8';x.fill();
      x.strokeStyle='rgba(30,30,40,.85)';x.lineWidth=Math.max(1.5,w*.012);x.lineCap='round';
      for(const s of [-1,1])for(const k of [-1,0,1]){x.beginPath();x.moveTo(s*w*.1,w*.03);x.lineTo(s*w*.42,w*(.0+k*.06));x.stroke()}});
  }},
  {id:'dog',e:'🐶',n:'Пёсик',draw(x,f){
    local(x,f,f.top,w=>{x.fillStyle='#8a5a36';for(const s of [-1,1]){x.save();x.translate(s*w*.45,w*.12);x.rotate(s*.35);x.beginPath();x.ellipse(0,w*.18,w*.14,w*.3,0,0,Math.PI*2);x.fill();x.restore()}});
    local(x,f,f.nose,w=>{x.beginPath();x.ellipse(0,-w*.01,w*.1,w*.07,0,0,Math.PI*2);x.fillStyle='#1b1b1f';x.fill();x.beginPath();x.ellipse(-w*.03,-w*.04,w*.03,w*.015,0,0,Math.PI*2);x.fillStyle='rgba(255,255,255,.6)';x.fill()});
    local(x,f,f.mouth,w=>{x.beginPath();x.ellipse(0,w*.1,w*.08,w*.12,0,0,Math.PI*2);x.fillStyle='#ef6f8a';x.fill();x.strokeStyle='#c94d68';x.lineWidth=w*.01;x.beginPath();x.moveTo(0,w*.02);x.lineTo(0,w*.16);x.stroke()});
  }},
  {id:'bunny',e:'🐰',n:'Зайка',draw(x,f){
    local(x,f,f.top,w=>{for(const s of [-1,1]){x.save();x.translate(s*w*.2,-w*.05);x.rotate(s*.18);x.beginPath();x.ellipse(0,-w*.35,w*.12,w*.42,0,0,Math.PI*2);x.fillStyle='#f4f1f6';x.fill();x.beginPath();x.ellipse(0,-w*.33,w*.06,w*.32,0,0,Math.PI*2);x.fillStyle='#f3b2c8';x.fill();x.restore()}});
    local(x,f,f.nose,w=>{x.beginPath();x.ellipse(0,0,w*.05,w*.035,0,0,Math.PI*2);x.fillStyle='#f08aa8';x.fill()});
    local(x,f,f.mouth,w=>{x.fillStyle='#fff';x.strokeStyle='#ccc';x.lineWidth=1;x.fillRect(-w*.05,-w*.02,w*.048,w*.08);x.fillRect(w*.002,-w*.02,w*.048,w*.08)});
  }},
  {id:'glasses',e:'😎',n:'Очки',draw(x,f){
    const r=f.w*.2;x.save();
    for(const p of [f.le,f.re]){const g=x.createLinearGradient(p.x,p.y-r,p.x,p.y+r);g.addColorStop(0,'#2a2f3a');g.addColorStop(1,'#07080c');lens(x,p,r,g)}
    x.strokeStyle='#07080c';x.lineWidth=f.w*.04;x.beginPath();x.moveTo(f.le.x+r*.8,f.le.y);x.quadraticCurveTo((f.le.x+f.re.x)/2,(f.le.y+f.re.y)/2-r*.4,f.re.x-r*.8,f.re.y);x.stroke();
    x.fillStyle='rgba(255,255,255,.35)';for(const p of [f.le,f.re]){x.beginPath();x.ellipse(p.x-r*.35,p.y-r*.3,r*.22,r*.1,-.5,0,Math.PI*2);x.fill()}
    x.restore();
  }},
  {id:'hearteyes',e:'😍',n:'Влюблён',draw(x,f){const t=T(),s=f.w*.16*(1+.12*Math.sin(t*6));heart(x,f.le.x,f.le.y,s,'#ff3b6b');heart(x,f.re.x,f.re.y,s,'#ff3b6b')}},
  {id:'crown',e:'👑',n:'Корона',draw(x,f){
    local(x,f,f.top,w=>{const W=w*.8,H=w*.35;x.beginPath();x.moveTo(-W/2,0);x.lineTo(-W/2,-H*.6);x.lineTo(-W/4,-H*.2);x.lineTo(0,-H);x.lineTo(W/4,-H*.2);x.lineTo(W/2,-H*.6);x.lineTo(W/2,0);x.closePath();
      const g=x.createLinearGradient(0,-H,0,0);g.addColorStop(0,'#ffe27a');g.addColorStop(1,'#d99a1e');x.fillStyle=g;x.fill();x.strokeStyle='#a8700e';x.lineWidth=w*.012;x.stroke();
      [['#e23b5a',-W/4],['#2f8cff',0],['#2bd47d',W/4]].forEach(([c,px])=>{x.beginPath();x.arc(px,-H*.15,w*.035,0,Math.PI*2);x.fillStyle=c;x.fill()})});
  }},
  {id:'devil',e:'😈',n:'Рожки',draw(x,f){
    local(x,f,f.top,w=>{for(const s of [-1,1]){x.save();x.translate(s*w*.28,w*.02);x.scale(s,1);x.beginPath();x.moveTo(-w*.09,0);x.quadraticCurveTo(-w*.05,-w*.25,w*.12,-w*.33);x.quadraticCurveTo(w*.02,-w*.18,w*.09,0);x.closePath();
      const g=x.createLinearGradient(0,-w*.3,0,0);g.addColorStop(0,'#ff5a3c');g.addColorStop(1,'#a3101c');x.fillStyle=g;x.fill();x.restore()}});
  }},
  {id:'angel',e:'😇',n:'Нимб',draw(x,f){
    local(x,f,f.top,w=>{const y=-w*.32+Math.sin(T()*2)*w*.02;x.lineWidth=w*.05;x.strokeStyle='#ffd84a';x.shadowColor='#fff3a0';x.shadowBlur=w*.15;x.beginPath();x.ellipse(0,y,w*.33,w*.08,0,0,Math.PI*2);x.stroke();x.shadowBlur=0});
  }},
  {id:'hearts',e:'💕',n:'Сердечки',draw(x,f){
    const t=T();local(x,f,f.top,w=>{for(let i=0;i<6;i++){const a=t*1.4+i*Math.PI/3,px=Math.cos(a)*w*.55,py=-w*.2+Math.sin(a)*w*.12;heart(x,px,py,w*(.07+.02*Math.sin(a)),i%2?'#ff5c8a':'#ff2d55')}});
  }},
  {id:'clown',e:'🤡',n:'Клоун',draw(x,f){
    local(x,f,f.nose,w=>{const g=x.createRadialGradient(-w*.03,-w*.03,w*.01,0,0,w*.1);g.addColorStop(0,'#ff8a8a');g.addColorStop(1,'#d40f20');x.beginPath();x.arc(0,-w*.01,w*.1,0,Math.PI*2);x.fillStyle=g;x.fill()});
    for(const p of [f.le,f.re])local(x,f,{x:p.x,y:p.y+f.w*.25},w=>{x.beginPath();x.arc(0,0,w*.09,0,Math.PI*2);x.fillStyle='rgba(255,80,110,.35)';x.fill()});
    local(x,f,f.top,w=>{['#ff3b3b','#ffb400','#2bd47d','#2f8cff','#a35bff'].forEach((c,i)=>{for(const s of [-1,1]){x.beginPath();x.arc(s*w*(.42+i*.03),w*(.05+i*.07),w*.1,0,Math.PI*2);x.fillStyle=c;x.fill()}})});
  }},
  {id:'mustache',e:'🥸',n:'Усы',draw(x,f){
    local(x,f,{x:(f.nose.x+f.mouth.x)/2,y:(f.nose.y*.45+f.mouth.y*.55)},w=>{x.fillStyle='#2a1c12';for(const s of [-1,1]){x.save();x.scale(s,1);x.beginPath();x.moveTo(0,-w*.02);x.bezierCurveTo(w*.1,-w*.09,w*.24,-w*.06,w*.27,w*.04);x.bezierCurveTo(w*.2,0,w*.1,w*.04,0,w*.03);x.closePath();x.fill();x.restore()}});
  }},
  {id:'pirate',e:'🏴‍☠️',n:'Пират',draw(x,f){
    local(x,f,f.re,w=>{x.strokeStyle='#111';x.lineWidth=w*.025;x.beginPath();x.moveTo(-w*.8,-w*.3);x.lineTo(0,0);x.lineTo(w*.32,w*.06);x.stroke()});
    local(x,f,f.re,w=>{x.beginPath();x.ellipse(0,0,w*.17,w*.14,0,0,Math.PI*2);x.fillStyle='#111';x.fill()});
    local(x,f,f.top,w=>{x.beginPath();x.moveTo(-w*.6,w*.02);x.quadraticCurveTo(0,-w*.65,w*.6,w*.02);x.quadraticCurveTo(0,-w*.15,-w*.6,w*.02);x.fillStyle='#16161c';x.fill();emoji(x,'☠️',0,-w*.25,w*.2)});
  }},
  {id:'blush',e:'☺️',n:'Румянец',draw(x,f){
    for(const p of [f.le,f.re]){const c={x:p.x,y:p.y+f.w*.22},g=x.createRadialGradient(c.x,c.y,0,c.x,c.y,f.w*.15);g.addColorStop(0,'rgba(255,110,140,.55)');g.addColorStop(1,'rgba(255,110,140,0)');x.fillStyle=g;x.fillRect(c.x-f.w*.15,c.y-f.w*.15,f.w*.3,f.w*.3)}
    const t=T();for(let i=0;i<5;i++){const a=i*1.3+t;emoji(x,'✨',f.c.x+Math.cos(a)*f.w*.7,f.c.y+Math.sin(a*1.3)*f.w*.6,f.w*.1*(1+.3*Math.sin(t*4+i)))}
  }},
  {id:'stars',e:'✨',n:'Звёзды',draw(x,f){const t=T();local(x,f,f.top,w=>{for(let i=0;i<7;i++){const k=Math.sin(t*3+i*1.7);emoji(x,i%2?'⭐':'✨',(i-3)*w*.17,-w*.1-Math.abs(i-3)*-w*.03+k*w*.03,w*(.12+.04*k))}})}},
  {id:'party',e:'🥳',n:'Праздник',draw(x,f){
    local(x,f,f.top,w=>{x.save();x.translate(w*.12,0);x.rotate(.25);x.beginPath();x.moveTo(-w*.17,0);x.lineTo(0,-w*.55);x.lineTo(w*.17,0);x.closePath();x.fillStyle='#7b5cff';x.fill();x.save();x.clip();
      for(let i=0;i<6;i++){x.fillStyle=i%2?'#ffd84a':'#ff4f8b';x.fillRect(-w*.3,-w*.1*i-w*.05,w*.6,w*.04)}x.restore();emoji(x,'⭐',0,-w*.58,w*.12);x.restore()});
    const t=T();for(let i=0;i<14;i++){const px=f.c.x+((i*97)%100/100-.5)*f.w*2,py=f.top.y-f.w*.4+((t*.35+i*.13)%1)*f.w*2;x.fillStyle=['#ff4f8b','#ffd84a','#2bd47d','#2f8cff'][i%4];x.fillRect(px,py,f.w*.03,f.w*.05)}
  }},
  {id:'unicorn',e:'🦄',n:'Единорог',draw(x,f){
    local(x,f,f.top,w=>{x.beginPath();x.moveTo(-w*.08,0);x.lineTo(0,-w*.5);x.lineTo(w*.08,0);x.closePath();const g=x.createLinearGradient(0,-w*.5,0,0);g.addColorStop(0,'#fff6b0');g.addColorStop(.5,'#ffb3e6');g.addColorStop(1,'#b48cff');x.fillStyle=g;x.fill();
      ['🌸','🌼','🌸','🌺','🌼'].forEach((e,i)=>emoji(x,e,(i-2)*w*.2,w*.04+Math.abs(i-2)*w*.04,w*.16))});
  }},
  {id:'flowers',e:'🌸',n:'Венок',draw(x,f){local(x,f,f.top,w=>{['🌺','🌼','🌸','🌷','🌸','🌼','🌺'].forEach((e,i)=>emoji(x,e,(i-3)*w*.15,w*.08+Math.pow(i-3,2)*w*.012,w*.17))})}},
  {id:'cry',e:'😭',n:'Слёзы',draw(x,f){const t=T();x.fillStyle='rgba(90,170,255,.8)';for(const p of [f.le,f.re])for(let i=0;i<3;i++){const k=(t*.8+i/3)%1;local(x,f,{x:p.x,y:p.y},w=>{x.beginPath();x.ellipse(0,w*(.1+k*.6),w*.035,w*.05,0,0,Math.PI*2);x.fill()})}}},
  {id:'beard',e:'🧔',n:'Борода',draw(x,f){
    local(x,f,f.mouth,w=>{x.beginPath();x.moveTo(-w*.45,-w*.25);x.quadraticCurveTo(-w*.45,w*.35,0,w*.42);x.quadraticCurveTo(w*.45,w*.35,w*.45,-w*.25);x.quadraticCurveTo(w*.3,w*.05,w*.12,-w*.02);x.quadraticCurveTo(0,-w*.12,-w*.12,-w*.02);x.quadraticCurveTo(-w*.3,w*.05,-w*.45,-w*.25);
      x.fillStyle='rgba(70,45,28,.92)';x.fill()});
  }},
  {id:'fire',e:'🔥',n:'Огонь',draw(x,f){const t=T();local(x,f,f.top,w=>{for(let i=0;i<7;i++){const k=Math.sin(t*8+i*2);emoji(x,'🔥',(i-3)*w*.16,-w*.05-Math.abs(Math.sin(i))*w*.08+k*w*.03,w*(.2+.04*k))}})}},
  {id:'snow',e:'❄️',n:'Снег',draw(x,f,W,H){const t=T();x.fillStyle='rgba(255,255,255,.9)';for(let i=0;i<40;i++){const px=((i*137)%W+Math.sin(t+i)*20+W)%W,py=((t*60*(1+i%3)+i*53)%H);x.beginPath();x.arc(px,py,1.5+i%3,0,Math.PI*2);x.fill()}local(x,f,f.top,w=>emoji(x,'🎅',0,-w*.12,w*.5))}},
  {id:'alien_ant',e:'👾',n:'Антенны',draw(x,f){local(x,f,f.top,w=>{x.strokeStyle='#2bd47d';x.lineWidth=w*.025;for(const s of [-1,1]){x.beginPath();x.moveTo(s*w*.15,0);x.quadraticCurveTo(s*w*.3,-w*.25,s*w*.25,-w*.45);x.stroke();x.beginPath();x.arc(s*w*.25,-w*.47,w*.06+Math.sin(T()*5)*w*.01,0,Math.PI*2);x.fillStyle='#7dffb4';x.fill()}})}},
  /* whole-face masks: a big emoji over the face */
  ...[['frog','🐸','Лягушка'],['monkey','🐵','Обезьянка'],['panda','🐼','Панда'],['robot','🤖','Робот'],['alien','👽','Пришелец'],['skull','💀','Череп'],['pumpkin','🎃','Тыква'],
      ['lion','🦁','Лев'],['fox','🦊','Лиса'],['pig','🐷','Хрюша'],['tiger','🐯','Тигр'],['koala','🐨','Коала'],['ghost','👻','Привидение'],['cool','🤠','Ковбой'],['zombie','🧟','Зомби']]
    .map(([id,e,n])=>({id,e,n,draw(x,f){local(x,f,f.c,w=>emoji(x,e,0,-w*.05,w*1.45))}}))
];
const FILTERS=[
  {id:'none',n:'Обычный',f:''},{id:'bw',n:'Ч/Б',f:'grayscale(1)'},{id:'noir',n:'Нуар',f:'grayscale(1) contrast(1.5) brightness(.95)'},
  {id:'warm',n:'Тёплый',f:'sepia(.28) saturate(1.35) brightness(1.04)'},{id:'cold',n:'Холодный',f:'saturate(1.1) hue-rotate(12deg) brightness(1.05) contrast(1.05)'},
  {id:'vivid',n:'Яркий',f:'saturate(1.7) contrast(1.12)'},{id:'vintage',n:'Винтаж',f:'sepia(.55) contrast(.92) brightness(1.08) saturate(.85)'},
  {id:'soft',n:'Нежный',f:'brightness(1.1) contrast(.9) saturate(1.15)'},{id:'night',n:'Ночь',f:'brightness(.85) contrast(1.25) hue-rotate(195deg) saturate(.7)'},
  {id:'pop',n:'Поп-арт',f:'saturate(2.6) contrast(1.4)'},{id:'retro',n:'Ретро',f:'sepia(.85) hue-rotate(-20deg) saturate(1.4)'},{id:'invert',n:'Негатив',f:'invert(1)'}
];
const canFilter=(()=>{try{const c=document.createElement('canvas').getContext('2d');return 'filter' in c}catch(e){return false}})();

/* ---------- face tracking ---------- */
let api=null,loading=null;
function loadFaceApi(){
  if(api)return Promise.resolve(api);
  if(loading)return loading;
  loading=new Promise((ok,bad)=>{
    const s=document.createElement('script');s.src='/vendor/face-api.js';s.async=true;
    s.onload=async()=>{try{const fa=window.faceapi;await fa.nets.tinyFaceDetector.loadFromUri('/vendor');await fa.nets.faceLandmark68TinyNet.loadFromUri('/vendor');api=fa;ok(fa)}catch(e){loading=null;bad(e)}};
    s.onerror=()=>{loading=null;bad(new Error('face-api'))};document.head.appendChild(s);
  });
  return loading;
}
const avg=(pts,a,b)=>{let x=0,y=0;for(let i=a;i<=b;i++){x+=pts[i].x;y+=pts[i].y}const n=b-a+1;return {x:x/n,y:y/n}};
function geometry(pts){
  const le=avg(pts,36,41),re=avg(pts,42,47),nose=pts[30],mouth=avg(pts,48,59),chin=pts[8];
  const w=Math.hypot(pts[16].x-pts[0].x,pts[16].y-pts[0].y),a=Math.atan2(re.y-le.y,re.x-le.x);
  const ec={x:(le.x+re.x)/2,y:(le.y+re.y)/2};
  const top={x:ec.x-(chin.x-ec.x)*.75,y:ec.y-(chin.y-ec.y)*.75};
  const c={x:(ec.x+chin.x)/2*.6+nose.x*.4,y:(ec.y+chin.y)/2};
  return {le,re,nose,mouth,chin,top,c,w,a};
}
function fallbackGeo(W,H){const w=Math.min(W,H)*.42,cx=W/2,cy=H*.48;return geometry68(cx,cy,w)}
function geometry68(cx,cy,w){
  const le={x:cx-w*.22,y:cy-w*.12},re={x:cx+w*.22,y:cy-w*.12},nose={x:cx,y:cy+w*.08},mouth={x:cx,y:cy+w*.3},chin={x:cx,y:cy+w*.6};
  return {le,re,nose,mouth,chin,top:{x:cx,y:cy-w*.68},c:{x:cx,y:cy+w*.1},w,a:0};
}
function lerpGeo(a,b,k){
  if(!a)return b;const o={};
  for(const key of ['le','re','nose','mouth','chin','top','c'])o[key]={x:a[key].x+(b[key].x-a[key].x)*k,y:a[key].y+(b[key].y-a[key].y)*k};
  o.w=a.w+(b.w-a.w)*k;o.a=a.a+(b.a-a.a)*k;return o;
}
function mirrorGeo(g,W){
  const m=p=>({x:W-p.x,y:p.y});
  return {le:m(g.re),re:m(g.le),nose:m(g.nose),mouth:m(g.mouth),chin:m(g.chin),top:m(g.top),c:m(g.c),w:g.w,a:-g.a};
}

/* ---------- the effect pipeline ---------- */
class FX{
  /* track: camera video track; opts.mirror draws the picture mirrored (front camera in stories) */
  constructor(track,opts={}){
    this.mask=MASKS[0];this.filter=FILTERS[0];this.mirror=!!opts.mirror;this.fps=opts.fps||(LITE?18:24);
    this.src=new MediaStream([track]);this.track=track;
    const v=this.v=document.createElement('video');v.muted=true;v.playsInline=true;v.autoplay=true;v.srcObject=this.src;
    v.setAttribute('playsinline','');v.style.cssText='position:fixed;width:2px;height:2px;opacity:0;pointer-events:none;left:0;top:0';document.body.appendChild(v);
    v.play().catch(()=>{});
    const s=track.getSettings?track.getSettings():{};
    const maxSide=opts.max||(LITE?640:960);
    let W=s.width||640,H=s.height||480;const k=Math.min(1,maxSide/Math.max(W,H));W=Math.round(W*k)&~1;H=Math.round(H*k)&~1;
    this.cv=document.createElement('canvas');this.cv.width=W;this.cv.height=H;this.x=this.cv.getContext('2d',{alpha:false,desynchronized:true});
    this.out=this.cv.captureStream?this.cv.captureStream(this.fps):null;
    this.geo=null;this.raw=null;this.lastSeen=0;this.busy=false;this.alive=true;this.lastDet=0;
    this.loop=this.loop.bind(this);this.timer=setTimeout(this.loop,0);
  }
  get outTrack(){return this.out?this.out.getVideoTracks()[0]:null}
  set(maskId,filterId){
    if(maskId!==undefined)this.mask=MASKS.find(m=>m.id===maskId)||MASKS[0];
    if(filterId!==undefined)this.filter=FILTERS.find(f=>f.id===filterId)||FILTERS[0];
    if(this.mask.draw)loadFaceApi().catch(()=>{this.noTrack=true});
  }
  get active(){return this.mask.id!=='none'||this.filter.id!=='none'}
  async detect(){
    if(this.busy||!api||!this.mask.draw||this.v.readyState<2)return;
    this.busy=true;
    try{
      const r=await api.detectSingleFace(this.v,new api.TinyFaceDetectorOptions({inputSize:LITE?128:160,scoreThreshold:.4})).withFaceLandmarks(true);
      if(r){
        const vw=this.v.videoWidth,k=this.cv.width/vw;
        const pts=r.landmarks.positions.map(p=>({x:p.x*k,y:p.y*k}));
        let g=geometry(pts);if(this.mirror)g=mirrorGeo(g,this.cv.width);
        this.raw=g;this.lastSeen=performance.now();
      }
    }catch(e){}
    this.busy=false;
  }
  loop(){
    if(!this.alive)return;
    const t0=performance.now(),{x,cv,v}=this,W=cv.width,H=cv.height;
    if(v.readyState>=2){
      x.save();
      if(canFilter)x.filter=this.filter.f||'none';
      if(this.mirror){x.translate(W,0);x.scale(-1,1)}
      x.drawImage(v,0,0,W,H);
      x.restore();
      if(this.mask.draw){
        if(t0-this.lastDet>(LITE?220:110)){this.lastDet=t0;this.detect()}
        const target=this.raw&&t0-this.lastSeen<1500?this.raw:(this.geo||fallbackGeo(W,H));
        this.geo=lerpGeo(this.geo,target,.45);
        try{x.save();this.mask.draw(x,this.geo,W,H);x.restore()}catch(e){x.restore()}
      }
    }
    this.timer=setTimeout(this.loop,Math.max(4,1000/this.fps-(performance.now()-t0)));
  }
  /* a still picture of the current frame (stories) */
  snap(){const c=document.createElement('canvas');c.width=this.cv.width;c.height=this.cv.height;c.getContext('2d').drawImage(this.cv,0,0);return c}
  stop(){this.alive=false;clearTimeout(this.timer);if(this.out)this.out.getTracks().forEach(t=>t.stop());this.v.srcObject=null;this.v.remove()}
}
/* masks on a still photo from the gallery */
async function onPhoto(canvas,maskId,filterId){
  const f=FILTERS.find(x=>x.id===filterId)||FILTERS[0],m=MASKS.find(x=>x.id===maskId)||MASKS[0];
  const out=document.createElement('canvas');out.width=canvas.width;out.height=canvas.height;const x=out.getContext('2d');
  if(canFilter)x.filter=f.f||'none';x.drawImage(canvas,0,0);x.filter='none';
  if(m.draw){
    let geos=[];
    try{const fa=await loadFaceApi();const rs=await fa.detectAllFaces(canvas,new fa.TinyFaceDetectorOptions({inputSize:416,scoreThreshold:.4})).withFaceLandmarks(true);geos=rs.map(r=>geometry(r.landmarks.positions))}catch(e){}
    if(!geos.length)geos=[fallbackGeo(out.width,out.height)];
    for(const g of geos){x.save();m.draw(x,g,out.width,out.height);x.restore()}
  }
  return out;
}
window.MFX={MASKS,FILTERS,FX,canFilter,loadFaceApi,onPhoto};
})();
