/* Manasenger — camera effects like in Instagram, Snapchat and TikTok: masks, face paint, face distortion,
   beauty, colour filters and backgrounds. Used in video calls and stories.

   How it works
   - Face tracking runs in a background thread (fxw.js, MediaPipe Face Landmarker): 478 face points,
     52 expression scores (open mouth, raised brows, blink, kiss…) and the head position in 3D.
     The camera picture never waits for it, so it stays smooth.
   - Everything is drawn on the graphics chip (WebGL): the picture with a colour filter, the face mesh
     (paint that sits on the skin and moves with it, distortion, skin smoothing), 3D accessories that
     turn with the head, and particles that react to the face.
   - The points are smoothed (One Euro filter), so masks stick to the face without trembling. */
'use strict';
(function(){
const LITE=document.documentElement.classList.contains('lite');
const G=window.FACEGEO,NV=468,TRI=new Uint16Array(G.FACES);
const EMO='"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
/* face regions (MediaPipe face mesh point numbers) */
const R={
  oval:[10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109],
  lipsO:[61,146,91,181,84,17,314,405,321,375,291,409,270,269,267,0,37,39,40,185],
  lipsI:[78,95,88,178,87,14,317,402,318,324,308,415,310,311,312,13,82,81,80,191],
  eyeR:[33,7,163,144,145,153,154,155,133,173,157,158,159,160,161,246],
  eyeL:[263,249,390,373,374,380,381,382,362,398,384,385,386,387,388,466],
  browR:[70,63,105,66,107,55,65,52,53,46],browL:[300,293,334,296,336,285,295,282,283,276]
};
/* expression scores the tracker reports, in this order */
/* all 52 expression scores of the tracker, in its own order (the worker sends them like this) */
const BS=['_neutral','browDownLeft','browDownRight','browInnerUp','browOuterUpLeft','browOuterUpRight','cheekPuff','cheekSquintLeft','cheekSquintRight','eyeBlinkLeft','eyeBlinkRight','eyeLookDownLeft','eyeLookDownRight','eyeLookInLeft','eyeLookInRight','eyeLookOutLeft','eyeLookOutRight','eyeLookUpLeft','eyeLookUpRight','eyeSquintLeft','eyeSquintRight','eyeWideLeft','eyeWideRight','jawForward','jawLeft','jawOpen','jawRight','mouthClose','mouthDimpleLeft','mouthDimpleRight','mouthFrownLeft','mouthFrownRight','mouthFunnel','mouthLeft','mouthLowerDownLeft','mouthLowerDownRight','mouthPressLeft','mouthPressRight','mouthPucker','mouthRight','mouthRollLower','mouthRollUpper','mouthShrugLower','mouthShrugUpper','mouthSmileLeft','mouthSmileRight','mouthStretchLeft','mouthStretchRight','mouthUpperUpLeft','mouthUpperUpRight','noseSneerLeft','noseSneerRight'];
const B=Object.fromEntries(BS.map((n,i)=>[n,i]));

/* =============================================================== tracker (shared, loaded once) */
const T={state:'idle',w:null,ready:null,cbs:new Set(),busy:false,mode:null,mainFL:null,
  status(s){this.state=s;this.cbs.forEach(f=>{try{f(s)}catch(e){}})}};
let lastTs=0;const nextTs=()=>{const t=Math.max(performance.now(),lastTs+1);lastTs=t;return t};
function loadTracker(){
  if(T.ready)return T.ready;
  T.status('loading');
  T.ready=new Promise((ok,bad)=>{
    let w;
    try{w=new Worker('/fxw.js',{type:'module'})}catch(e){w=null}
    if(!w){mainThread().then(ok,bad);return}
    const to=setTimeout(()=>{w.terminate();mainThread().then(ok,bad)},40000);
    w.onmessage=e=>{
      const m=e.data;
      if(m.t==='ready'){clearTimeout(to);T.w=w;T.mode='worker';T.delegate=m.delegate;w.onmessage=onRes;w.onerror=null;T.status('ready');ok()}
      else if(m.t==='error'){clearTimeout(to);w.terminate();mainThread().then(ok,bad)}
    };
    w.onerror=()=>{clearTimeout(to);w.terminate();mainThread().then(ok,bad)};
    w.postMessage({t:'init',cpu:false});
  }).catch(e=>{T.status('error');T.ready=null;throw e});
  return T.ready;
}
/* old browsers without module workers: track on the page itself */
async function mainThread(){
  const v=await import('/vendor/mp/vision_bundle.mjs');
  const files=await v.FilesetResolver.forVisionTasks('/vendor/mp',true);
  const opt=d=>({baseOptions:{modelAssetPath:'/vendor/mp/face_landmarker.task',delegate:d},runningMode:'VIDEO',numFaces:1,outputFaceBlendshapes:true,outputFacialTransformationMatrixes:true});
  try{T.mainFL=await v.FaceLandmarker.createFromOptions(files,opt('GPU'))}catch(e){T.mainFL=await v.FaceLandmarker.createFromOptions(files,opt('CPU'))}
  T.mode='main';T.status('ready');
}
let pending=null;
function onRes(e){const m=e.data;
  if(m.t==='slow'){restartCPU();return}
  if(m.t==='res'||m.t==='error'){T.busy=false;const p=pending;pending=null;if(p)p(m.t==='res'?m:null)}}
/* the graphics chip is slow on this phone: a fresh tracker on the processor; the old one keeps working until it is ready */
function restartCPU(){
  let w;try{w=new Worker('/fxw.js',{type:'module'})}catch(e){return}
  w.onmessage=e=>{if(e.data.t!=='ready'){w.terminate();return}
    const old=T.w;T.w=w;w.onmessage=onRes;T.delegate='CPU';
    if(pending){const p=pending;pending=null;T.busy=false;p(null)}T.busy=false;setTimeout(()=>old&&old.terminate(),50)};
  w.postMessage({t:'init',cpu:true});
}
/* person/background separation: its own background thread, started only when a background effect is chosen */
const SG={w:null,ready:null,busy:false,cb:null,state:'idle'};
const segStatus=s=>{SG.state=s;T.cbs.forEach(f=>{try{f(s)}catch(e){}})};
function loadSeg(){
  if(SG.ready)return SG.ready;segStatus('loading');
  SG.ready=new Promise((ok,bad)=>{let w;try{w=new Worker('/fxs.js',{type:'module'})}catch(e){bad(e);return}
    w.onmessage=e=>{if(e.data.t==='ready'){SG.w=w;w.onmessage=ev=>{SG.busy=false;const c=SG.cb;SG.cb=null;if(c)c(ev.data.t==='res'?ev.data:null)};ok()}else{w.terminate();bad(new Error(e.data.error))}};
    w.onerror=e=>{w.terminate();bad(e)};w.postMessage({t:'init'})}).then(()=>segStatus('ready'),e=>{SG.ready=null;segStatus('error');throw e});
  return SG.ready;
}
function segment(src,w,h){
  return new Promise(async ok=>{
    if(!SG.w||SG.busy){ok(undefined);return}SG.busy=true;
    try{const bmp=await createImageBitmap(src,{resizeWidth:w,resizeHeight:h,resizeQuality:'low'});SG.cb=ok;SG.w.postMessage({t:'frame',bmp,ts:nextTs()},[bmp])}catch(e){SG.busy=false;ok(null)}
  });
}
function track(src,w,h){
  return new Promise(async ok=>{
    if(T.state!=='ready'||T.busy){ok(undefined);return}
    T.busy=true;const ts=nextTs();
    try{
      if(T.mode==='worker'){
        const bmp=await createImageBitmap(src,{resizeWidth:w,resizeHeight:h,resizeQuality:'low'});
        pending=ok;T.w.postMessage({t:'frame',bmp,ts},[bmp]);
      }else{
        const r=T.mainFL.detectForVideo(src,ts);T.busy=false;
        if(!r.faceLandmarks||!r.faceLandmarks[0]){ok({});return}
        const L=r.faceLandmarks[0],lm=new Float32Array(L.length*3);for(let i=0;i<L.length;i++){lm[i*3]=L[i].x;lm[i*3+1]=L[i].y;lm[i*3+2]=L[i].z}
        const bs=new Float32Array(BS.length),c=r.faceBlendshapes&&r.faceBlendshapes[0];if(c)c.categories.forEach(k=>{const i=B[k.categoryName];if(i!=null)bs[i]=k.score});
        ok({lm,bs,mat:r.facialTransformationMatrixes&&r.facialTransformationMatrixes[0]?new Float32Array(r.facialTransformationMatrixes[0].data):null});
      }
    }catch(e){T.busy=false;pending=null;ok(null)}
  });
}

/* =============================================================== smoothing */
/* One Euro filter: steady when the face is still, quick when it moves */
class Smooth{
  constructor(n,minCut,beta){this.n=n;this.min=minCut;this.beta=beta;this.x=null;this.dx=new Float32Array(n);this.t=0}
  run(v,t){
    if(!this.x||t-this.t>500){this.x=Float32Array.from(v);this.dx.fill(0);this.t=t;return this.x}
    const dt=Math.max(1e-3,(t-this.t)/1000);this.t=t;
    const a=c=>{const r=1/(2*Math.PI*c);return 1/(1+r/dt)},ad=a(1);
    for(let i=0;i<this.n;i++){
      const dx=(v[i]-this.x[i])/dt;this.dx[i]+=ad*(dx-this.dx[i]);
      const k=a(this.min+this.beta*Math.abs(this.dx[i]));this.x[i]+=k*(v[i]-this.x[i]);
    }
    return this.x;
  }
}

/* =============================================================== drawing helpers for textures */
function cnv(w,h){const c=document.createElement('canvas');c.width=w;c.height=h||w;return c}
function emoji(x,ch,px,py,size){x.font=`${Math.round(size)}px ${EMO}`;x.textAlign='center';x.textBaseline='middle';x.fillText(ch,px,py)}
function emojiTex(ch,s=128){const c=cnv(s),x=c.getContext('2d');emoji(x,ch,s/2,s/2+s*.04,s*.82);return c}
function heartPath(x,cx,cy,s){x.beginPath();x.moveTo(cx,cy+.35*s);x.bezierCurveTo(cx-.9*s,cy-.25*s,cx-.45*s,cy-.95*s,cx,cy-.45*s);x.bezierCurveTo(cx+.45*s,cy-.95*s,cx+.9*s,cy-.25*s,cx,cy+.35*s)}
/* a feathered shape: drawn as a blurred shadow, which every browser can do */
function soft(x,blur,draw,color){x.save();x.shadowColor=color;x.shadowBlur=blur;x.shadowOffsetX=10000;x.translate(-10000,0);x.fillStyle=color;draw();x.fill();x.restore()}

/* paint textures are drawn in the face texture layout (UV): (0,0) top-left of the unwrapped face */
const PS=LITE?512:1024;
const up=i=>[G.UVS[2*i]*PS,G.UVS[2*i+1]*PS];
function poly(x,list){x.beginPath();list.forEach((i,k)=>{const [a,b]=up(i);k?x.lineTo(a,b):x.moveTo(a,b)});x.closePath()}
function centre(list){let a=0,b=0;list.forEach(i=>{const p=up(i);a+=p[0];b+=p[1]});return [a/list.length,b/list.length]}
function grow(list,k){const c=centre(list);return list.map(i=>{const p=up(i);return [c[0]+(p[0]-c[0])*k,c[1]+(p[1]-c[1])*k]})}
function polyP(x,pts){x.beginPath();pts.forEach((p,k)=>k?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.closePath()}
function holes(x,blur){ /* clear eyes and the inside of the mouth so paint never covers them */
  x.save();x.globalCompositeOperation='destination-out';
  for(const e of [R.eyeR,R.eyeL]){soft(x,blur||PS*.006,()=>polyP(x,grow(e,1.12)),'#000')}
  soft(x,PS*.004,()=>poly(x,R.lipsI),'#000');x.restore();
}
function ovalFill(x,col,blur){soft(x,blur,()=>poly(x,R.oval),col)}

/* =============================================================== effects */
/* props: things in 3D around the head, in centimetres of the standard face (x right, y up, z towards the camera)
   lm props: stuck to a face point on screen (s: size in face widths)
   fx: particles; on(bs) tells when they flow */
const tex={};
const sprite=(key,s,draw)=>()=>tex[key]||(tex[key]=(()=>{const c=cnv(s),x=c.getContext('2d');draw(x,s);return c})());
const SP={
  catEar:sprite('catEar',256,(x,s)=>{x.beginPath();x.moveTo(s*.08,s*.95);x.quadraticCurveTo(s*.32,s*.02,s*.5,s*.04);x.quadraticCurveTo(s*.7,s*.02,s*.92,s*.95);x.closePath();x.fillStyle='#3b3b46';x.fill();
    x.beginPath();x.moveTo(s*.26,s*.9);x.quadraticCurveTo(s*.45,s*.22,s*.5,s*.22);x.quadraticCurveTo(s*.56,s*.22,s*.74,s*.9);x.closePath();x.fillStyle='#f3a6c0';x.fill()}),
  foxEar:sprite('foxEar',256,(x,s)=>{x.beginPath();x.moveTo(s*.08,s*.95);x.quadraticCurveTo(s*.32,s*.02,s*.5,s*.04);x.quadraticCurveTo(s*.7,s*.02,s*.92,s*.95);x.closePath();x.fillStyle='#e07a2a';x.fill();
    x.beginPath();x.moveTo(s*.26,s*.9);x.quadraticCurveTo(s*.45,s*.22,s*.5,s*.22);x.quadraticCurveTo(s*.56,s*.22,s*.74,s*.9);x.closePath();x.fillStyle='#fff3e6';x.fill()}),
  dogEar:sprite('dogEar',256,(x,s)=>{const g=x.createLinearGradient(0,0,0,s);g.addColorStop(0,'#9a6a40');g.addColorStop(1,'#6b4426');x.fillStyle=g;x.beginPath();x.ellipse(s*.5,s*.55,s*.3,s*.44,0,0,Math.PI*2);x.fill()}),
  dogNose:sprite('dogNose',128,(x,s)=>{const g=x.createRadialGradient(s*.4,s*.35,s*.05,s*.5,s*.5,s*.45);g.addColorStop(0,'#555');g.addColorStop(1,'#111');x.fillStyle=g;x.beginPath();x.ellipse(s*.5,s*.5,s*.46,s*.34,0,0,Math.PI*2);x.fill()}),
  tongue:sprite('tongue',128,(x,s)=>{x.fillStyle='#ef6f8a';x.beginPath();x.moveTo(s*.2,s*.05);x.lineTo(s*.8,s*.05);x.quadraticCurveTo(s*.85,s*.95,s*.5,s*.95);x.quadraticCurveTo(s*.15,s*.95,s*.2,s*.05);x.fill();x.strokeStyle='#c94d68';x.lineWidth=s*.04;x.beginPath();x.moveTo(s*.5,s*.1);x.lineTo(s*.5,s*.6);x.stroke()}),
  bunnyEar:sprite('bunnyEar',256,(x,s)=>{x.fillStyle='#f4f1f6';x.beginPath();x.ellipse(s*.5,s*.5,s*.24,s*.48,0,0,Math.PI*2);x.fill();x.fillStyle='#f3b2c8';x.beginPath();x.ellipse(s*.5,s*.54,s*.12,s*.38,0,0,Math.PI*2);x.fill()}),
  teeth:sprite('teeth',128,(x,s)=>{x.fillStyle='#fff';x.strokeStyle='#bbb';x.lineWidth=2;x.fillRect(s*.12,s*.1,s*.37,s*.8);x.strokeRect(s*.12,s*.1,s*.37,s*.8);x.fillRect(s*.51,s*.1,s*.37,s*.8);x.strokeRect(s*.51,s*.1,s*.37,s*.8)}),
  crown:sprite('crown',256,(x,s)=>{const W=s*.92,H=s*.62,ox=s*.04,oy=s*.3;x.beginPath();x.moveTo(ox,oy+H);x.lineTo(ox,oy+H*.25);x.lineTo(ox+W*.25,oy+H*.6);x.lineTo(ox+W*.5,oy);x.lineTo(ox+W*.75,oy+H*.6);x.lineTo(ox+W,oy+H*.25);x.lineTo(ox+W,oy+H);x.closePath();
    const g=x.createLinearGradient(0,oy,0,oy+H);g.addColorStop(0,'#ffe98f');g.addColorStop(1,'#d39518');x.fillStyle=g;x.fill();x.strokeStyle='#a8700e';x.lineWidth=s*.02;x.stroke();
    [['#e23b5a',.25],['#2f8cff',.5],['#2bd47d',.75]].forEach(([c,k])=>{x.beginPath();x.arc(ox+W*k,oy+H*.8,s*.05,0,Math.PI*2);x.fillStyle=c;x.fill()})}),
  horn:sprite('horn',256,(x,s)=>{x.beginPath();x.moveTo(s*.25,s);x.quadraticCurveTo(s*.3,s*.35,s*.8,s*.05);x.quadraticCurveTo(s*.55,s*.5,s*.75,s);x.closePath();const g=x.createLinearGradient(0,0,0,s);g.addColorStop(0,'#ff6a3c');g.addColorStop(1,'#9c0f1c');x.fillStyle=g;x.fill()}),
  halo:sprite('halo',256,(x,s)=>{x.shadowColor='#fff3a0';x.shadowBlur=s*.08;x.strokeStyle='#ffd84a';x.lineWidth=s*.07;x.beginPath();x.ellipse(s*.5,s*.5,s*.4,s*.13,0,0,Math.PI*2);x.stroke()}),
  shades:sprite('shades',512,(x,s)=>{const r=s*.19,y=s*.5;for(const cx of [s*.27,s*.73]){const g=x.createLinearGradient(0,y-r,0,y+r);g.addColorStop(0,'#2d3340');g.addColorStop(1,'#05060a');x.fillStyle=g;x.beginPath();x.ellipse(cx,y,r,r*.78,0,0,Math.PI*2);x.fill();
      x.fillStyle='rgba(255,255,255,.3)';x.beginPath();x.ellipse(cx-r*.35,y-r*.3,r*.25,r*.1,-.5,0,Math.PI*2);x.fill()}
    x.strokeStyle='#05060a';x.lineWidth=s*.035;x.beginPath();x.moveTo(s*.45,y-r*.2);x.quadraticCurveTo(s*.5,y-r*.5,s*.55,y-r*.2);x.stroke();x.beginPath();x.moveTo(s*.08,y-r*.3);x.lineTo(0,y-r*.45);x.moveTo(s*.92,y-r*.3);x.lineTo(s,y-r*.45);x.stroke()}),
  heartGlasses:sprite('heartGlasses',512,(x,s)=>{for(const cx of [s*.27,s*.73]){heartPath(x,cx,s*.55,s*.24);x.fillStyle='rgba(255,45,110,.85)';x.fill();x.lineWidth=s*.025;x.strokeStyle='#c4004c';x.stroke()}
    x.strokeStyle='#c4004c';x.lineWidth=s*.03;x.beginPath();x.moveTo(s*.45,s*.45);x.quadraticCurveTo(s*.5,s*.38,s*.55,s*.45);x.stroke()}),
  clownNose:sprite('clownNose',128,(x,s)=>{const g=x.createRadialGradient(s*.38,s*.35,s*.04,s*.5,s*.5,s*.48);g.addColorStop(0,'#ff9a9a');g.addColorStop(1,'#c40c1c');x.fillStyle=g;x.beginPath();x.arc(s*.5,s*.5,s*.47,0,Math.PI*2);x.fill()}),
  partyHat:sprite('partyHat',256,(x,s)=>{x.save();x.beginPath();x.moveTo(s*.18,s);x.lineTo(s*.5,s*.1);x.lineTo(s*.82,s);x.closePath();x.fillStyle='#7b5cff';x.fill();x.clip();for(let i=0;i<7;i++){x.fillStyle=i%2?'#ffd84a':'#ff4f8b';x.fillRect(0,s*(.95-i*.13),s,s*.05)}x.restore();emoji(x,'⭐',s*.5,s*.1,s*.2)}),
  santa:sprite('santa',512,(x,s)=>{x.fillStyle='#d9242f';x.beginPath();x.moveTo(s*.08,s*.78);x.quadraticCurveTo(s*.35,s*.05,s*.8,s*.22);x.quadraticCurveTo(s*.92,s*.3,s*.9,s*.55);x.lineTo(s*.92,s*.78);x.closePath();x.fill();
    x.fillStyle='#fff';x.beginPath();x.roundRect?x.roundRect(s*.02,s*.7,s*.96,s*.18,s*.09):x.rect(s*.02,s*.7,s*.96,s*.18);x.fill();x.beginPath();x.arc(s*.88,s*.55,s*.09,0,Math.PI*2);x.fill()}),
  cowboy:sprite('cowboy',512,(x,s)=>{x.fillStyle='#8b5a2b';x.beginPath();x.ellipse(s*.5,s*.72,s*.49,s*.12,0,0,Math.PI*2);x.fill();x.fillStyle='#a06a35';x.beginPath();x.moveTo(s*.24,s*.72);x.quadraticCurveTo(s*.2,s*.25,s*.38,s*.25);x.quadraticCurveTo(s*.5,s*.35,s*.62,s*.25);x.quadraticCurveTo(s*.8,s*.25,s*.76,s*.72);x.closePath();x.fill();x.fillStyle='#4a2c12';x.fillRect(s*.24,s*.6,s*.52,s*.07)}),
  pirateHat:sprite('pirateHat',512,(x,s)=>{x.fillStyle='#16161c';x.beginPath();x.moveTo(s*.02,s*.75);x.quadraticCurveTo(s*.5,-s*.1,s*.98,s*.75);x.quadraticCurveTo(s*.5,s*.5,s*.02,s*.75);x.fill();emoji(x,'☠️',s*.5,s*.42,s*.2)}),
  bubble:sprite('bubble',128,(x,s)=>{const g=x.createRadialGradient(s*.35,s*.35,s*.05,s*.5,s*.5,s*.48);g.addColorStop(0,'rgba(255,255,255,.7)');g.addColorStop(.7,'rgba(180,220,255,.12)');g.addColorStop(1,'rgba(200,170,255,.6)');x.fillStyle=g;x.beginPath();x.arc(s*.5,s*.5,s*.46,0,Math.PI*2);x.fill()}),
  dot:sprite('dot',64,(x,s)=>{const g=x.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,s,s)}),
  band:sprite('band',64,(x,s)=>{x.fillStyle='#fff';x.beginPath();x.arc(s/2,s/2,s*.46,0,Math.PI*2);x.fill()}),
  /* cartoon parts that follow your face: blink, open mouth */
  toonEye:sprite('toonEye',256,(x,s)=>{x.fillStyle='#fff';x.strokeStyle='#1d1a24';x.lineWidth=s*.035;x.beginPath();x.ellipse(s*.5,s*.52,s*.44,s*.42,0,0,Math.PI*2);x.fill();x.stroke();
    x.fillStyle='#2a2140';x.beginPath();x.arc(s*.52,s*.58,s*.22,0,Math.PI*2);x.fill();x.fillStyle='#fff';x.beginPath();x.arc(s*.6,s*.5,s*.07,0,Math.PI*2);x.fill();x.beginPath();x.arc(s*.45,s*.66,s*.035,0,Math.PI*2);x.fill();
    x.lineCap='round';x.lineWidth=s*.04;for(const [a,b,c,d] of [[.22,.2,.12,.06],[.4,.1,.36,-.02],[.6,.1,.66,-.02]]){x.beginPath();x.moveTo(a*s,b*s);x.lineTo(c*s,d*s+s*.04);x.stroke()}}),
  toonMouthOpen:sprite('toonMouthOpen',256,(x,s)=>{x.fillStyle='#5a1020';x.strokeStyle='#1d1a24';x.lineWidth=s*.035;x.beginPath();x.moveTo(s*.06,s*.3);x.quadraticCurveTo(s*.5,s*.36,s*.94,s*.3);x.quadraticCurveTo(s*.9,s*.95,s*.5,s*.95);x.quadraticCurveTo(s*.1,s*.95,s*.06,s*.3);x.closePath();x.fill();
    x.save();x.clip();x.fillStyle='#fff';x.fillRect(s*.1,s*.28,s*.8,s*.14);x.fillStyle='#ff6f8a';x.beginPath();x.ellipse(s*.5,s*.92,s*.28,s*.2,0,0,Math.PI*2);x.fill();x.restore();x.stroke()}),
  toonMouth:sprite('toonMouth',256,(x,s)=>{x.strokeStyle='#1d1a24';x.lineWidth=s*.07;x.lineCap='round';x.beginPath();x.moveTo(s*.1,s*.4);x.quadraticCurveTo(s*.5,s*.8,s*.9,s*.4);x.stroke()}),
  animeEye:sprite('animeEye',256,(x,s)=>{x.fillStyle='#fff';x.beginPath();x.ellipse(s*.5,s*.55,s*.34,s*.42,0,0,Math.PI*2);x.fill();
    const g=x.createLinearGradient(0,s*.2,0,s*.95);g.addColorStop(0,'#2a1a5e');g.addColorStop(.6,'#6a4cff');g.addColorStop(1,'#c7b6ff');x.fillStyle=g;x.beginPath();x.ellipse(s*.5,s*.58,s*.28,s*.37,0,0,Math.PI*2);x.fill();
    x.fillStyle='#fff';x.beginPath();x.ellipse(s*.6,s*.4,s*.1,s*.13,-.3,0,Math.PI*2);x.fill();x.beginPath();x.arc(s*.38,s*.72,s*.05,0,Math.PI*2);x.fill();
    x.strokeStyle='#120a20';x.lineWidth=s*.06;x.lineCap='round';x.beginPath();x.moveTo(s*.1,s*.3);x.quadraticCurveTo(s*.5,s*.02,s*.92,s*.26);x.stroke()}),
  angryBrow:sprite('angryBrow',256,(x,s)=>{x.fillStyle='#16121a';x.save();x.translate(s/2,s/2);x.rotate(.35);x.beginPath();x.roundRect?x.roundRect(-s*.45,-s*.1,s*.9,s*.2,s*.1):x.rect(-s*.45,-s*.1,s*.9,s*.2);x.fill();x.restore()}),
  fangs:sprite('fangs',256,(x,s)=>{x.fillStyle='#fff';x.strokeStyle='#ccc';x.lineWidth=3;for(const c of [.3,.7]){x.beginPath();x.moveTo(s*(c-.1),s*.1);x.lineTo(s*(c+.1),s*.1);x.lineTo(s*c,s*.75);x.closePath();x.fill();x.stroke()}x.fillStyle='rgba(200,0,30,.8)';x.beginPath();x.arc(s*.7,s*.85,s*.04,0,Math.PI*2);x.fill()}),
  buckTeeth:sprite('buckTeeth',256,(x,s)=>{x.fillStyle='#fffdf5';x.strokeStyle='#bba';x.lineWidth=s*.02;for(const c of [.31,.69]){x.beginPath();x.roundRect?x.roundRect(s*(c-.18),s*.05,s*.36,s*.85,s*.08):x.rect(s*(c-.18),s*.05,s*.36,s*.85);x.fill();x.stroke()}}),
  roundGlasses:sprite('roundGlasses',512,(x,s)=>{x.strokeStyle='#2a2230';x.lineWidth=s*.035;for(const c of [.27,.73]){x.fillStyle='rgba(200,230,255,.22)';x.beginPath();x.arc(s*c,s*.5,s*.19,0,Math.PI*2);x.fill();x.stroke()}x.beginPath();x.moveTo(s*.46,s*.48);x.quadraticCurveTo(s*.5,s*.43,s*.54,s*.48);x.stroke()}),
  moustache:sprite('moustache',256,(x,s)=>{x.fillStyle='#2a1c12';for(const k of [-1,1]){x.save();x.translate(s/2,s/2);x.scale(k,1);x.beginPath();x.moveTo(0,-s*.06);x.bezierCurveTo(s*.16,-s*.22,s*.4,-s*.14,s*.46,s*.04);x.bezierCurveTo(s*.4,-s*.02,s*.3,s*.12,s*.16,s*.1);x.bezierCurveTo(s*.08,s*.1,s*.02,s*.06,0,s*.06);x.closePath();x.fill();x.restore()}}),
  tear:sprite('tear',64,(x,s)=>{x.fillStyle='rgba(110,180,255,.9)';x.beginPath();x.moveTo(s*.5,s*.05);x.quadraticCurveTo(s*.9,s*.6,s*.5,s*.95);x.quadraticCurveTo(s*.1,s*.6,s*.5,s*.05);x.fill()}),
};
const IMGS={};
function imgTex(name){let i=IMGS[name];if(!i){i=IMGS[name]=new Image();i.src='/vendor/masks/'+name}return i.complete&&i.naturalWidth?i:blank()}
const E=ch=>()=>tex['e'+ch]||(tex['e'+ch]=emojiTex(ch));

const MASKS=[
  {id:'none',e:'🚫',n:'Без маски'},
  /* ---- whole animated 3D heads (Jeeliz Weboji, Apache 2.0): they smile, blink, open the mouth and raise brows with you ---- */
  {id:'h_raccoon',e:'🦝',n:'Енот 3D',hint:'Улыбнись, подмигни, открой рот',m3:[{mdl:'w_raccoon',flipV:true,morph:true,s:.16,t:[0,-8.5,-6]}],noOcc:true},
  {id:'h_dino',e:'🦕',n:'Динозаврик 3D',hint:'Открой рот',m3:[{mdl:'w_dino',flipV:true,morph:true,s:.135,t:[0,-9,-7]}],noOcc:true},
  {id:'h_turtle',e:'🐢',n:'Черепаха 3D',hint:'Подмигни',m3:[{mdl:'w_turtle',flipV:true,morph:true,s:.15,t:[0,-4,-6]}],noOcc:true},
  /* ---- real 3D masks from open-source face filters ---- */
  {id:'dog3d',e:'🐶',n:'Пёсик',hint:'Открой рот',
    m3:[{mdl:'dog_ears',flipV:true,s:.3,t:[0,-6.5,-2.5]},{mdl:'dog_nose',flipV:true,s:.22,t:[0,-3.2,6.1]}],
    props:[{t:SP.tongue,lm:14,dy:.1,s:.2,show:b=>b[B.jawOpen]>.25}]},
  {id:'tiger3d',e:'🐅',n:'Тигр 3D',m3:[{mdl:'tiger',flipV:true,s:[12.6,18.9,12.6],t:[0,-.215,-1.05]}],noOcc:true},
  {id:'cloud',e:'🌧️',n:'Тучка',m3:[{mdl:'cloud',flipV:true,s:[3.5,2,3.5],t:[0,9.5,-2]},{mdl:'cloud',flipV:true,s:[2.4,1.8,2.4],t:[6,10.5,-3]},{mdl:'cloud',flipV:true,s:[2.6,2.2,2.6],t:[-5.5,9,-1]}],
    fx:{kind:'rain',from:'cloud',on:()=>true,rate:22}},
  {id:'thug',e:'🕶️',n:'Thug Life',m3:[{mdl:'glasses_thug',s:.108,t:[0,2.2,3.6],drop:true}]},
  {id:'clownhat',e:'🎪',n:'Колпак',m3:[{mdl:'clown_hat',s:4.3,t:[0,19.5,-2.5]}]},
  {id:'earrings',e:'💎',n:'Серьги',m3:[{mdl:'earring',s:.85,t:[8.1,-4.2,-1.8]},{mdl:'earring',s:.85,t:[-8.1,-4.2,-1.8]}]},
  /* ---- TikTok / Snapchat beauty looks: smooth skin, bigger eyes, a finer nose and soft makeup ---- */
  {id:'glow',e:'✨',n:'Бьюти',beauty:true,warp:'glow',hint:'Как в TikTok',
    paint(x){for(const i of [205,425]){const [a,b]=up(i);soft(x,PS*.06,()=>{x.beginPath();x.ellipse(a,b-PS*.01,PS*.07,PS*.045,0,0,Math.PI*2)},'rgba(255,120,140,.28)')}
      x.fillStyle='rgba(210,60,90,.32)';x.beginPath();R.lipsO.forEach((i,k)=>{const p=up(i);k?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1])});x.closePath();x.fill();
      soft(x,PS*.025,()=>{const [a,b]=up(6);x.beginPath();x.ellipse(a,b+PS*.04,PS*.012,PS*.08,0,0,Math.PI*2)},'rgba(255,255,255,.22)');
      for(const i of [50,280]){const [a,b]=up(i);soft(x,PS*.03,()=>{x.beginPath();x.ellipse(a,b-PS*.03,PS*.035,PS*.018,0,0,Math.PI*2)},'rgba(255,250,240,.2)')}
      holes(x,PS*.003)}},
  {id:'glam2',e:'💋',n:'Гламур',beauty:true,warp:'glow',hint:'Моргни',
    paint(x){
      for(const e of [R.eyeR,R.eyeL]){soft(x,PS*.025,()=>polyP(x,grow(e,1.7)),'rgba(120,60,50,.38)');x.strokeStyle='rgba(15,10,12,.85)';x.lineWidth=PS*.006;x.beginPath();e.slice(8).concat([e[0]]).forEach((i,k)=>{const p=up(i);k?x.lineTo(p[0],p[1]-PS*.002):x.moveTo(p[0],p[1]-PS*.002)});x.stroke()}
      for(const i of [205,425]){const [a,b]=up(i);soft(x,PS*.06,()=>{x.beginPath();x.ellipse(a+(i===205?-1:1)*PS*.02,b+PS*.01,PS*.06,PS*.03,i===205?.4:-.4,0,Math.PI*2)},'rgba(120,60,40,.22)')}
      x.fillStyle='rgba(170,20,50,.6)';x.beginPath();R.lipsO.forEach((i,k)=>{const p=up(i);k?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1])});x.closePath();x.fill();
      soft(x,PS*.01,()=>{const [a,b]=up(14);x.beginPath();x.ellipse(a,b+PS*.012,PS*.02,PS*.006,0,0,Math.PI*2)},'rgba(255,255,255,.45)');
      soft(x,PS*.025,()=>{const [a,b]=up(6);x.beginPath();x.ellipse(a,b+PS*.04,PS*.01,PS*.08,0,0,Math.PI*2)},'rgba(255,255,255,.28)');
      holes(x,PS*.003)},
    fx:{kind:'sparkle',from:'cheeks',on:b=>b[B.eyeBlinkLeft]>.5||b[B.eyeBlinkRight]>.5}},
  {id:'gems',e:'💎',n:'Стразы',beauty:true,
    paint(x){let seed=5;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
      for(const e of [R.eyeR,R.eyeL]){const lo=e.slice(0,9).map(up);lo.forEach((p,k)=>{if(k%2)return;const r=PS*(.007+rnd()*.006),cx=p[0],cy=p[1]+PS*.035+k*PS*.002;
        const g=x.createRadialGradient(cx-r*.3,cy-r*.3,r*.1,cx,cy,r);g.addColorStop(0,'#fff');g.addColorStop(.5,['#9fe8ff','#ffb3f0','#d7c4ff'][k%3]);g.addColorStop(1,'rgba(120,120,200,.8)');x.fillStyle=g;x.beginPath();x.arc(cx,cy,r,0,Math.PI*2);x.fill()})}
      for(const e of [R.eyeR,R.eyeL])soft(x,PS*.02,()=>polyP(x,grow(e,1.5)),'rgba(190,140,255,.25)');holes(x,PS*.003)},
    fx:{kind:'sparkle',from:'eyes',on:()=>true,rate:4}},
  {id:'butterflies',e:'🦋',n:'Бабочки',beauty:true,props:[{t:E('🦋'),at:[-6,9.5,1],w:4.5,h:4.5,r:.35},{t:E('🦋'),at:[5.5,11,0],w:3.6,h:3.6,r:-.3},{t:E('🦋'),at:[1,13,-.5],w:3,h:3,r:.1}],
    fx:{kind:'butterfly',from:'head',on:()=>true,rate:2.5}},
  {id:'sakura',e:'🌸',n:'Сакура',beauty:true,warp:'glow',paint(x){for(const i of [205,425]){const [a,b]=up(i);soft(x,PS*.05,()=>{x.beginPath();x.arc(a,b,PS*.05,0,Math.PI*2)},'rgba(255,140,170,.35)')}},
    props:['🌸','🌸','🌷','🌸','🌸'].map((ch,i)=>({t:E(ch),at:[(i-2)*2.6+(i===2?0:.4),10.2-Math.pow(i-2,2)*.3,1-Math.abs(i-2)*.5],w:3.2,h:3.2})),fx:{kind:'petals',from:'screen',on:()=>true,rate:5}},
  /* ---- animals ---- */
  {id:'cat',e:'🐱',n:'Котик',
    paint(x){const [nx,ny]=up(4);x.fillStyle='#f08aa8';x.beginPath();x.moveTo(nx-PS*.03,ny-PS*.015);x.lineTo(nx+PS*.03,ny-PS*.015);x.lineTo(nx,ny+PS*.02);x.closePath();x.fill();
      x.strokeStyle='rgba(25,25,35,.85)';x.lineWidth=PS*.005;x.lineCap='round';for(const s of [-1,1])for(const k of [-1,0,1]){x.beginPath();x.moveTo(nx+s*PS*.06,ny+PS*.03);x.lineTo(nx+s*PS*.27,ny+PS*(.02+k*.035));x.stroke()}
      for(const i of [205,425]){const [a,b]=up(i);soft(x,PS*.03,()=>{x.beginPath();x.arc(a,b,PS*.035,0,Math.PI*2)},'rgba(255,120,150,.35)')}},
    props:[{t:SP.catEar,at:[-5,10,-.5],w:5.5,h:6.5,r:.3},{t:SP.catEar,at:[5,10,-.5],w:5.5,h:6.5,r:-.3}]},
  {id:'bunny',e:'🐰',n:'Зайка',
    paint(x){const [nx,ny]=up(4);x.fillStyle='#f08aa8';x.beginPath();x.ellipse(nx,ny,PS*.025,PS*.017,0,0,Math.PI*2);x.fill()},
    props:[{t:SP.bunnyEar,at:[-2.8,15.5,-1],w:5,h:11,r:.12},{t:SP.bunnyEar,at:[2.8,15.5,-1],w:5,h:11,r:-.12},{t:SP.teeth,lm:13,dy:.03,s:.12}]},
  {id:'tigerpaint',e:'🐯',n:'Тигр-грим',
    paint(x){ovalFill(x,'rgba(240,140,40,.62)',PS*.04);
      x.save();poly(x,R.oval);x.clip();x.strokeStyle='rgba(20,14,10,.82)';x.lineCap='round';
      const st=[[.12,.25,.3,.3],[.1,.4,.28,.42],[.12,.55,.26,.55],[.88,.25,.7,.3],[.9,.4,.72,.42],[.88,.55,.74,.55],[.42,.06,.46,.2],[.58,.06,.54,.2],[.5,.04,.5,.16]];
      st.forEach(([a,b,c,d])=>{x.lineWidth=PS*.028;x.beginPath();x.moveTo(a*PS,b*PS);x.quadraticCurveTo((a+c)/2*PS,(b+d)/2*PS-PS*.03,c*PS,d*PS);x.stroke()});x.restore();
      soft(x,PS*.03,()=>{const [a,b]=up(0);x.beginPath();x.ellipse(a,b+PS*.02,PS*.16,PS*.11,0,0,Math.PI*2)},'rgba(255,250,240,.85)');
      const [nx,ny]=up(4);x.fillStyle='#1a1410';x.beginPath();x.moveTo(nx-PS*.035,ny-PS*.02);x.lineTo(nx+PS*.035,ny-PS*.02);x.lineTo(nx,ny+PS*.025);x.closePath();x.fill();holes(x)},
    props:[{t:SP.catEar,at:[-5.5,9.5,-1],w:4.5,h:4.5,r:.4},{t:SP.catEar,at:[5.5,9.5,-1],w:4.5,h:4.5,r:-.4}]},
  {id:'fox',e:'🦊',n:'Лиса',
    paint(x){soft(x,PS*.05,()=>{poly(x,R.oval)},'rgba(230,110,30,.5)');soft(x,PS*.04,()=>{const [a,b]=up(17);x.beginPath();x.ellipse(a,b-PS*.06,PS*.2,PS*.14,0,0,Math.PI*2)},'rgba(255,250,245,.8)');
      const [nx,ny]=up(4);x.fillStyle='#111';x.beginPath();x.ellipse(nx,ny,PS*.03,PS*.022,0,0,Math.PI*2);x.fill();holes(x)},
    props:[{t:SP.foxEar,at:[-5.5,10,-1],w:5,h:7,r:.25},{t:SP.foxEar,at:[5.5,10,-1],w:5,h:7,r:-.25}]},
  /* ---- face paint and makeup ---- */
  {id:'glam',e:'💄',n:'Макияж',beauty:true,hint:'Моргни',
    paint(x){
      x.fillStyle='rgba(200,20,60,.62)';x.beginPath();R.lipsO.forEach((i,k)=>{const p=up(i);k?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1])});x.closePath();R.lipsI.slice().reverse().forEach((i,k)=>{const p=up(i);k?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1])});x.closePath();x.fill('evenodd');
      for(const e of [R.eyeR,R.eyeL]){soft(x,PS*.02,()=>polyP(x,grow(e,1.55)),'rgba(150,80,160,.38)')}
      for(const i of [205,425]){const [a,b]=up(i);soft(x,PS*.05,()=>{x.beginPath();x.arc(a,b,PS*.05,0,Math.PI*2)},'rgba(255,110,140,.35)')}
      soft(x,PS*.02,()=>{const [a,b]=up(6);x.beginPath();x.ellipse(a,b+PS*.03,PS*.012,PS*.07,0,0,Math.PI*2)},'rgba(255,255,255,.25)');
      holes(x,PS*.003)},
    fx:{kind:'sparkle',from:'cheeks',on:b=>b[B.eyeBlinkLeft]>.5||b[B.eyeBlinkRight]>.5}},
  {id:'freckles',e:'🌸',n:'Веснушки',beauty:true,
    paint(x){let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
      for(const c of [[205,1],[425,1],[4,.6]]){const [a,b]=up(c[0]);for(let i=0;i<40*c[1];i++){const r=rnd()*PS*.09,t=rnd()*Math.PI*2;x.fillStyle=`rgba(140,80,50,${.25+rnd()*.3})`;x.beginPath();x.arc(a+Math.cos(t)*r,b+Math.sin(t)*r*.6,PS*(.003+rnd()*.004),0,Math.PI*2);x.fill()}}
      for(const i of [205,425]){const [a,b]=up(i);soft(x,PS*.05,()=>{x.beginPath();x.arc(a,b,PS*.05,0,Math.PI*2)},'rgba(255,120,140,.3)')}}},
  {id:'skull',e:'💀',n:'Череп',
    paint(x){ovalFill(x,'rgba(245,245,240,.88)',PS*.03);
      for(const e of [R.eyeR,R.eyeL]){x.fillStyle='rgba(10,10,12,.92)';polyP(x,grow(e,2.1));x.fill()}
      const [nx,ny]=up(4);x.fillStyle='#0b0b0d';x.beginPath();x.moveTo(nx,ny-PS*.06);x.lineTo(nx-PS*.035,ny+PS*.02);x.lineTo(nx+PS*.035,ny+PS*.02);x.closePath();x.fill();
      x.strokeStyle='#0b0b0d';x.lineWidth=PS*.006;const a=up(61),b=up(291);x.beginPath();x.moveTo(a[0],a[1]);x.lineTo(b[0],b[1]);x.stroke();
      for(let i=0;i<=8;i++){const t=i/8,px=a[0]+(b[0]-a[0])*t,py=a[1]+(b[1]-a[1])*t;x.beginPath();x.moveTo(px,py-PS*.02);x.lineTo(px,py+PS*.02);x.stroke()}
      for(const i of [50,280]){const [c,d]=up(i);soft(x,PS*.04,()=>{x.beginPath();x.ellipse(c,d+PS*.03,PS*.05,PS*.08,0,0,Math.PI*2)},'rgba(60,60,70,.45)')}}},
  {id:'clown',e:'🤡',n:'Клоун',
    paint(x){ovalFill(x,'rgba(250,250,250,.8)',PS*.03);
      for(const e of [R.eyeR,R.eyeL]){const c=centre(e);x.fillStyle='rgba(40,110,230,.85)';x.beginPath();x.moveTo(c[0],c[1]-PS*.1);x.lineTo(c[0]+PS*.05,c[1]);x.lineTo(c[0],c[1]+PS*.1);x.lineTo(c[0]-PS*.05,c[1]);x.closePath();x.fill()}
      x.fillStyle='rgba(225,20,40,.85)';polyP(x,grow(R.lipsO,1.35));x.fill();holes(x)},
    props:[{t:SP.clownNose,at:[0,-1,8.4],w:3.4,h:3.4}]},
  {id:'hero',e:'🦸',n:'Супергерой',
    paint(x){const a=up(127),b=up(356),r=up(33),l=up(263);x.fillStyle='rgba(15,20,35,.92)';x.beginPath();x.moveTo(a[0],a[1]-PS*.05);x.quadraticCurveTo(PS*.5,r[1]-PS*.14,b[0],b[1]-PS*.05);x.lineTo(b[0],b[1]+PS*.05);x.quadraticCurveTo(PS*.5,l[1]+PS*.12,a[0],a[1]+PS*.05);x.closePath();x.fill();holes(x)}},
  {id:'rainbowpaint',e:'🎨',n:'Раскраска',
    paint(x){['#ff3b3b','#ff9f1a','#ffe21a','#2bd47d','#2f8cff','#8a5bff'].forEach((c,k)=>{for(const s of [-1,1]){const [a,b]=up(s<0?50:280);x.strokeStyle=c;x.globalAlpha=.75;x.lineWidth=PS*.012;x.beginPath();x.moveTo(a-PS*.06,b-PS*.03+k*PS*.014);x.lineTo(a+PS*.06,b-PS*.03+k*PS*.014);x.stroke()}});x.globalAlpha=1}},
  {id:'alien',e:'👽',n:'Пришелец',warp:'alien',
    paint(x){ovalFill(x,'rgba(90,220,120,.55)',PS*.05);holes(x)}},
  {id:'devil',e:'😈',n:'Дьявол',paint(x){ovalFill(x,'rgba(230,30,40,.38)',PS*.06);holes(x)},
    props:[{t:SP.horn,at:[-4,10.5,1],w:3.6,h:5.5,r:.15,flip:true},{t:SP.horn,at:[4,10.5,1],w:3.6,h:5.5,r:-.15}]},
  {id:'zombie',e:'🧟',n:'Зомби',paint(x){ovalFill(x,'rgba(120,160,110,.6)',PS*.05);for(const e of [R.eyeR,R.eyeL])soft(x,PS*.03,()=>polyP(x,grow(e,1.8)),'rgba(60,20,40,.55)');holes(x)}},
  /* ---- accessories ---- */
  {id:'shades',e:'😎',n:'Очки',props:[{t:SP.shades,at:[0,2.6,6.2],w:14,h:14}]},
  {id:'heartglasses',e:'😍',n:'Сердечки',hint:'Улыбнись',props:[{t:SP.heartGlasses,at:[0,2.6,6.2],w:14,h:14}],fx:{kind:'hearts',from:'head',on:b=>b[B.mouthSmileLeft]+b[B.mouthSmileRight]>.9}},
  {id:'crown',e:'👑',n:'Корона',props:[{t:SP.crown,at:[0,12,1],w:11,h:11}]},
  {id:'angel',e:'😇',n:'Ангел',props:[{t:SP.halo,at:[0,15,0],w:12,h:12}],fx:{kind:'sparkle',from:'head',on:()=>true,rate:4}},
  {id:'party',e:'🥳',n:'Праздник',props:[{t:SP.partyHat,at:[2,15,0],w:7,h:9,r:.25}],fx:{kind:'confetti',from:'top',on:()=>true,rate:18}},
  {id:'santa',e:'🎅',n:'Дед Мороз',props:[{t:SP.santa,at:[0,12.5,0],w:20,h:20,r:-.05}],paint(x){ /* a fluffy beard along the jaw and a moustache, the lips stay free */
      const jaw=[132,58,172,136,150,149,176,148,152,377,400,378,379,365,397,288,361].map(up),m=up(17),l=up(61),r=up(291);
      let seed=3;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
      x.fillStyle='#f4f4f4';x.beginPath();x.moveTo(jaw[0][0],jaw[0][1]);jaw.forEach(p=>x.lineTo(p[0],p[1]+PS*.03));x.lineTo(r[0]+PS*.02,r[1]);x.quadraticCurveTo(m[0],m[1]+PS*.05,l[0]-PS*.02,l[1]);x.closePath();x.fill();
      for(let i=0;i<70;i++){const p=jaw[(rnd()*jaw.length)|0];x.fillStyle=rnd()<.5?'#ffffff':'#e6e6e6';x.beginPath();x.arc(p[0]+(rnd()-.5)*PS*.05,p[1]+PS*.02+(rnd()-.3)*PS*.05,PS*(.018+rnd()*.02),0,Math.PI*2);x.fill()}
      const n=up(2);for(const s2 of [-1,1]){x.fillStyle='#f7f7f7';x.beginPath();x.ellipse(n[0]+s2*PS*.07,n[1]+PS*.035,PS*.085,PS*.03,s2*.25,0,Math.PI*2);x.fill()}
      x.globalCompositeOperation='destination-out';polyP(x,grow(R.lipsO,1.05));x.fill();x.globalCompositeOperation='source-over'},fx:{kind:'snow',from:'screen',on:()=>true,rate:14}},
  {id:'cowboy',e:'🤠',n:'Ковбой',props:[{t:SP.cowboy,at:[0,11.5,0],w:24,h:24}]},
  {id:'pirate',e:'🏴‍☠️',n:'Пират',props:[{t:SP.pirateHat,at:[0,12,0],w:20,h:20}],paint(x){const c=centre(R.eyeL);x.fillStyle='#111';x.beginPath();x.ellipse(c[0],c[1],PS*.075,PS*.06,0,0,Math.PI*2);x.fill();x.strokeStyle='#111';x.lineWidth=PS*.012;x.beginPath();x.moveTo(c[0]-PS*.5,c[1]-PS*.25);x.lineTo(c[0]+PS*.2,c[1]+PS*.05);x.stroke()}},
  {id:'flowers',e:'💐',n:'Венок',props:['🌺','🌼','🌸','🌷','🌸','🌼','🌺'].map((ch,i)=>({t:E(ch),at:[(i-3)*2.4,9.8-Math.pow(i-3,2)*.22,1.2-Math.abs(i-3)*.5],w:3.6,h:3.6}))},
  /* ---- reacting to the face ---- */
  {id:'dragon',e:'🐉',n:'Дракон',hint:'Открой рот',props:[{t:SP.horn,at:[-3.5,10.5,0],w:3,h:5,r:.4,flip:true},{t:SP.horn,at:[3.5,10.5,0],w:3,h:5,r:-.4}],fx:{kind:'fire',from:'mouth',on:b=>b[B.jawOpen]>.3}},
  {id:'rainbow',e:'🌈',n:'Радуга',hint:'Открой рот',fx:{kind:'rainbow',from:'mouth',on:b=>b[B.jawOpen]>.3}},
  {id:'kiss',e:'😘',n:'Поцелуй',hint:'Губы трубочкой',fx:{kind:'hearts',from:'mouth',on:b=>b[B.mouthPucker]>.5}},
  {id:'bubbles',e:'🫧',n:'Пузыри',hint:'Открой рот',fx:{kind:'bubbles',from:'mouth',on:b=>b[B.jawOpen]>.25}},
  {id:'wow',e:'🤩',n:'Вау',hint:'Подними брови',fx:{kind:'stars',from:'head',on:b=>b[B.browInnerUp]>.45||(b[B.browOuterUpLeft]+b[B.browOuterUpRight])>.9}},
  {id:'cry',e:'😭',n:'Слёзы',fx:{kind:'tears',from:'eyes',on:()=>true,rate:10}},
  {id:'money',e:'💸',n:'Деньги',fx:{kind:'money',from:'screen',on:()=>true,rate:8}},
  /* ---- face changers: the cartoon parts move with your blinks and your mouth ---- */
  {id:'toon',e:'🤪',n:'Мультяшка',hint:'Моргни и открой рот',
    paint(x){for(const i of [205,425]){const [a,b]=up(i);soft(x,PS*.04,()=>{x.beginPath();x.arc(a,b,PS*.05,0,Math.PI*2)},'rgba(255,90,120,.45)')}},
    props:[{t:SP.toonEye,lm:R.eyeR,s:.34,sy:b=>Math.max(.08,1-b[B.eyeBlinkLeft]*1.05)},{t:SP.toonEye,lm:R.eyeL,s:.34,flip:true,sy:b=>Math.max(.08,1-b[B.eyeBlinkRight]*1.05)},
      {t:SP.toonMouthOpen,lm:[13,14],s:.56,dy:.01,sy:b=>.35+b[B.jawOpen]*1.3,show:b=>b[B.jawOpen]>.12},{t:SP.toonMouth,lm:[13,14],s:.56,show:b=>b[B.jawOpen]<=.12}]},
  {id:'anime',e:'🌸',n:'Аниме',beauty:true,hint:'Моргни',
    paint(x){for(const i of [205,425]){const [a,b]=up(i);soft(x,PS*.04,()=>{x.beginPath();x.ellipse(a,b,PS*.06,PS*.03,0,0,Math.PI*2)},'rgba(255,110,150,.5)')}},
    props:[{t:SP.animeEye,lm:R.eyeR,s:.3,ar:1.2,dy:-.02,sy:b=>Math.max(.06,1-b[B.eyeBlinkLeft]*1.05)},{t:SP.animeEye,lm:R.eyeL,s:.3,ar:1.2,dy:-.02,flip:true,sy:b=>Math.max(.06,1-b[B.eyeBlinkRight]*1.05)}],
    fx:{kind:'sparkle',from:'head',on:()=>true,rate:3}},
  {id:'upside',e:'🙃',n:'Вверх ногами',warp:'flip'},
  {id:'longface',e:'🥒',n:'Длинное лицо',warp:'long'},
  {id:'wideface',e:'🍔',n:'Толстячок',warp:'wide'},
  {id:'angry',e:'😡',n:'Злюка',paint(x){ovalFill(x,'rgba(255,40,40,.32)',PS*.06);holes(x)},
    props:[{t:SP.angryBrow,lm:R.browR,s:.32,ar:.5,dy:-.01,flip:true},{t:SP.angryBrow,lm:R.browL,s:.32,ar:.5,dy:-.01}],fx:{kind:'angry',from:'head',on:()=>true,rate:3}},
  {id:'vampire',e:'🧛',n:'Вампир',hint:'Приоткрой рот',paint(x){ovalFill(x,'rgba(235,235,250,.55)',PS*.05);for(const e of [R.eyeR,R.eyeL])soft(x,PS*.03,()=>polyP(x,grow(e,1.6)),'rgba(90,20,60,.45)');x.fillStyle='rgba(120,0,30,.75)';polyP(x,grow(R.lipsO,1.02));x.fill();holes(x)},
    props:[{t:SP.fangs,lm:13,s:.26,dy:.04,show:b=>b[B.jawOpen]>.06}]},
  {id:'nerd',e:'🤓',n:'Ботан',props:[{t:SP.roundGlasses,at:[0,2.6,6.2],w:14,h:14},{t:SP.buckTeeth,lm:13,s:.16,dy:.045,ar:1.1}],
    paint(x){let seed=11;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};for(const c of [205,425]){const [a,b]=up(c);for(let i=0;i<30;i++){const r=rnd()*PS*.08,t=rnd()*Math.PI*2;x.fillStyle='rgba(140,80,50,.45)';x.beginPath();x.arc(a+Math.cos(t)*r,b+Math.sin(t)*r*.6,PS*.004,0,Math.PI*2);x.fill()}}}},
  {id:'moustache',e:'🥸',n:'Усач',props:[{t:SP.moustache,lm:[2,0],s:.6,ar:.5,dy:.005}]},
  /* ---- face distortion ---- */
  {id:'bigeyes',e:'👀',n:'Глазки',warp:'bigeyes'},
  {id:'baby',e:'👶',n:'Малыш',warp:'baby',beauty:true},
  {id:'hamster',e:'🐹',n:'Хомяк',warp:'hamster'},
  {id:'bignose',e:'👃',n:'Нос',warp:'bignose'},
  {id:'smile',e:'😁',n:'Улыбка',warp:'smile'},
  /* ---- whole-face emoji, turning with the head ---- */
  ...[['frog','🐸','Лягушка'],['monkey','🐵','Обезьянка'],['panda','🐼','Панда'],['robot','🤖','Робот'],['pumpkin','🎃','Тыква'],['ghost','👻','Привидение']]
    .map(([id,e,n])=>({id,e,n,props:[{t:E(e),at:[0,-.5,7],w:22,h:22}]}))
];
const FILTERS=[ /* colour matrix rows (r,g,b,+offset); v vignette; g grain; sat/c/b saturation, contrast, brightness */
  {id:'none',n:'Обычный'},
  {id:'bw',n:'Ч/Б',m:[.3,.59,.11,0,.3,.59,.11,0,.3,.59,.11,0]},
  {id:'noir',n:'Нуар',m:[.45,.88,.17,-.25,.45,.88,.17,-.25,.45,.88,.17,-.25],v:.5},
  {id:'warm',n:'Тёплый',m:[1.1,.05,0,.02,0,1.02,0,.01,0,0,.88,0]},
  {id:'cold',n:'Холодный',m:[.9,0,0,0,0,1.0,.04,.01,0,.06,1.12,.03]},
  {id:'vivid',n:'Яркий',sat:1.6,c:1.1},
  {id:'vintage',n:'Винтаж',m:[.6,.45,.15,.05,.35,.65,.12,.04,.27,.42,.3,.03],v:.45,g:.06},
  {id:'soft',n:'Нежный',sat:1.1,c:.88,b:.06},
  {id:'film',n:'Плёнка',m:[1.02,.05,0,.02,.02,.98,.04,.02,.05,.08,.82,.06],v:.35,g:.08},
  {id:'night',n:'Ночь',m:[.2,.25,.45,0,.2,.35,.55,0,.3,.45,.8,.05],v:.4},
  {id:'pop',n:'Поп-арт',sat:2.6,c:1.35},
  {id:'retro',n:'Ретро',m:[.75,.55,.2,.05,.4,.6,.12,0,.2,.3,.2,0],v:.3},
  {id:'invert',n:'Негатив',m:[-1,0,0,1,0,-1,0,1,0,0,-1,1]}
];
let rnd=1;const R01=()=>{rnd=(rnd*16807)%2147483647;return rnd/2147483647};
const BGS=[
  {id:'none',n:'Без фона',e:'🚫'},{id:'blur',n:'Размытие',e:'💧'},
  {id:'space',n:'Космос',e:'🌌',draw(x,w,h){const g=x.createRadialGradient(w*.7,h*.3,0,w*.5,h*.5,Math.max(w,h));g.addColorStop(0,'#3a2a7a');g.addColorStop(1,'#05040f');x.fillStyle=g;x.fillRect(0,0,w,h);for(let i=0;i<300;i++){x.fillStyle=`rgba(255,255,255,${R01()})`;x.fillRect(R01()*w,R01()*h,1.5,1.5)}emoji(x,'🪐',w*.2,h*.25,Math.min(w,h)*.18)}},
  {id:'beach',n:'Пляж',e:'🏖️',draw(x,w,h){let g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#6ec6ff');g.addColorStop(.55,'#bfe8ff');g.addColorStop(.56,'#1ea0c8');g.addColorStop(.72,'#3fc2d8');g.addColorStop(.73,'#f3d9a4');g.addColorStop(1,'#e6c38a');x.fillStyle=g;x.fillRect(0,0,w,h);emoji(x,'☀️',w*.82,h*.15,Math.min(w,h)*.16);emoji(x,'🌴',w*.12,h*.6,Math.min(w,h)*.32)}},
  {id:'sunset',n:'Закат',e:'🌅',draw(x,w,h){const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#2b1d5c');g.addColorStop(.5,'#e8577a');g.addColorStop(1,'#ffb35c');x.fillStyle=g;x.fillRect(0,0,w,h)}},
  {id:'city',n:'Неон',e:'🌃',draw(x,w,h){x.fillStyle='#0b0820';x.fillRect(0,0,w,h);for(let i=0;i<18;i++){const bw=w*(.05+R01()*.07),bh=h*(.2+R01()*.45),bx=R01()*w;x.fillStyle=`hsl(${240+R01()*60},40%,${12+R01()*10}%)`;x.fillRect(bx,h-bh,bw,bh);for(let k=0;k<20;k++){x.fillStyle=R01()<.5?'#ff3ea5':'#3ef2ff';x.globalAlpha=.7;x.fillRect(bx+R01()*bw,h-bh+R01()*bh,3,3)}x.globalAlpha=1}}},
  {id:'studio',n:'Студия',e:'🎞️',draw(x,w,h){const g=x.createRadialGradient(w/2,h*.4,0,w/2,h/2,Math.max(w,h)*.7);g.addColorStop(0,'#e9eef5');g.addColorStop(1,'#8796ab');x.fillStyle=g;x.fillRect(0,0,w,h)}}
];

/* =============================================================== WebGL */
const VS_Q=`attribute vec2 p;varying vec2 v;uniform float mir;void main(){v=vec2((p.x+1.)*.5,(1.-p.y)*.5);gl_Position=vec4(p.x*mir,p.y,0.,1.);}`;
const FS_FRAME=`precision mediump float;varying vec2 v;uniform sampler2D vid,small,mask,bgi;uniform int bg;uniform vec2 sp;uniform mat4 cm;uniform vec4 co;uniform float vig,gr,tm,sat,con,bri;
float rnd(vec2 c){return fract(sin(dot(c,vec2(12.9898,78.233))+tm)*43758.5453);}
void main(){vec3 c=texture2D(vid,v).rgb;
 if(bg>0){float m=smoothstep(.3,.7,texture2D(mask,v).r);vec3 b;
  if(bg==1){vec2 s=vec2(v.x,1.-v.y);b=texture2D(small,s).rgb*.2;
   b+=(texture2D(small,s+vec2(sp.x,0.)).rgb+texture2D(small,s-vec2(sp.x,0.)).rgb+texture2D(small,s+vec2(0.,sp.y)).rgb+texture2D(small,s-vec2(0.,sp.y)).rgb)*.12;
   b+=(texture2D(small,s+sp*1.6).rgb+texture2D(small,s-sp*1.6).rgb+texture2D(small,s+vec2(sp.x,-sp.y)*1.6).rgb+texture2D(small,s+vec2(-sp.x,sp.y)*1.6).rgb)*.08;}
  else b=texture2D(bgi,v).rgb;
  c=mix(b,c,m);}
 c=(cm*vec4(c,1.)).rgb+co.rgb;
 float l=dot(c,vec3(.3,.59,.11));c=mix(vec3(l),c,sat);c=(c-.5)*con+.5+bri;
 if(vig>0.){vec2 d=v-.5;c*=1.-vig*dot(d,d)*1.6;}
 if(gr>0.)c+=(rnd(v*731.)-.5)*gr;
 gl_FragColor=vec4(clamp(c,0.,1.),1.);}`;
const FS_COPY=`precision mediump float;varying vec2 v;uniform sampler2D t;uniform float fy;void main(){gl_FragColor=texture2D(t,vec2(v.x,fy>0.?1.-v.y:v.y));}`;
const VS_M=`attribute vec2 pos,tc,uv;varying vec2 vt,vu;uniform float mir;void main(){vt=tc;vu=uv;gl_Position=vec4((pos.x*2.-1.)*mir,1.-pos.y*2.,0.,1.);}`;
const FS_PAINT=`precision mediump float;varying vec2 vt,vu;uniform sampler2D t;void main(){gl_FragColor=texture2D(t,vu);}`;
const FS_WARP=`precision mediump float;varying vec2 vt,vu;uniform sampler2D f;void main(){gl_FragColor=vec4(texture2D(f,vec2(vt.x,1.-vt.y)).rgb,1.);}`;
const FS_BEAUTY=`precision mediump float;varying vec2 vt,vu;uniform sampler2D f,mk;uniform vec2 px;
void main(){vec2 s=vec2(vt.x,1.-vt.y);vec3 c=texture2D(f,s).rgb;vec3 acc=c;float wsum=1.;
 for(int i=0;i<12;i++){float a=float(i)*.5236;vec2 o=vec2(cos(a),sin(a))*px*(mod(float(i),2.)>.5?3.:6.);vec3 q=texture2D(f,s+o).rgb;vec3 d=q-c;float w=exp(-dot(d,d)*40.);acc+=q*w;wsum+=w;}
 vec3 sm=acc/wsum;float m=texture2D(mk,vu).a;vec3 o2=mix(c,sm,m*.75)+m*.025;gl_FragColor=vec4(o2,m);}`;
/* 3D models: perspective like the face tracker's camera, simple light; depth so the head hides what is behind it */
const VS_3=`attribute vec3 p,n;attribute vec2 uv;uniform mat4 mv;uniform vec3 pr;uniform float fv;varying vec2 vu;varying vec3 vn;
void main(){vec4 v=mv*vec4(p,1.);vu=vec2(uv.x,fv>0.?1.-uv.y:uv.y);vn=(mv*vec4(n,0.)).xyz;gl_Position=vec4(pr.z*pr.x*v.x,pr.y*v.y,-1.002*v.z-2.002,-v.z);}`;
const FS_3=`precision mediump float;varying vec2 vu;varying vec3 vn;uniform sampler2D t;uniform vec4 col;uniform float useT,lit,al;
void main(){vec4 c=col;if(useT>0.)c*=texture2D(t,vu);c.a*=al;if(c.a<.03)discard;float l=1.;if(lit>0.){vec3 N=normalize(vn);l=.5+.6*max(dot(N,normalize(vec3(.3,.5,1.))),0.)+.25*pow(max(dot(N,normalize(vec3(-.2,.6,1.))),0.),12.);}gl_FragColor=vec4(c.rgb*l,c.a);}`;
const VS_S=`attribute vec4 p;attribute vec3 ta;varying vec2 vt;varying float va;void main(){vt=ta.xy;va=ta.z;gl_Position=p;}`;
const FS_S=`precision mediump float;varying vec2 vt;varying float va;uniform sampler2D t;uniform vec3 tint;uniform float useTint;void main(){vec4 c=texture2D(t,vt);if(useTint>0.)c.rgb*=tint;gl_FragColor=vec4(c.rgb,c.a*va);}`;

function Renderer(canvas){
  const gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:true,premultipliedAlpha:false,preserveDrawingBuffer:false})||canvas.getContext('experimental-webgl');
  if(!gl)return null;
  gl.getExtension('OES_element_index_uint');
  try{
  const prog=(vs,fs)=>{const p=gl.createProgram();for(const [t,s] of [[gl.VERTEX_SHADER,vs],[gl.FRAGMENT_SHADER,fs]]){const sh=gl.createShader(t);gl.shaderSource(sh,s);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(sh));gl.attachShader(p,sh)}
    gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));const u={},a={};
    const nu=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);for(let i=0;i<nu;i++){const n=gl.getActiveUniform(p,i).name;u[n]=gl.getUniformLocation(p,n)}
    const na=gl.getProgramParameter(p,gl.ACTIVE_ATTRIBUTES);for(let i=0;i<na;i++){const n=gl.getActiveAttrib(p,i).name;a[n]=gl.getAttribLocation(p,n)}return {p,u,a}};
  const P={m3:prog(VS_3,FS_3),frame:prog(VS_Q,FS_FRAME),copy:prog(VS_Q,FS_COPY),paint:prog(VS_M,FS_PAINT),warp:prog(VS_M,FS_WARP),beauty:prog(VS_M,FS_BEAUTY),spr:prog(VS_S,FS_S)};
  const buf=d=>{const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,d,gl.STATIC_DRAW);return b};
  const quad=buf(new Float32Array([-1,-1,1,-1,-1,1,1,1]));
  const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,TRI,gl.STATIC_DRAW);
  const uvb=buf(new Float32Array(G.UVS));
  const posb=gl.createBuffer(),tcb=gl.createBuffer(),sprb=gl.createBuffer();
  const mkTex=()=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);for(const [k,v] of [[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]])gl.texParameteri(gl.TEXTURE_2D,k,v);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,0]));return t};
  const fbo=(w,h)=>{const t=mkTex();gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);const f=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,f);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);gl.bindFramebuffer(gl.FRAMEBUFFER,null);return {t,f,w,h}};
  let W=canvas.width,H=canvas.height;
  const T={vid:mkTex(),mask:mkTex(),bgi:mkTex()};const F={frame:fbo(W,H),small:fbo(Math.max(16,W>>3),Math.max(16,H>>3))};
  const texCache=new Map();
  const texOf=src=>{let t=texCache.get(src);if(t)return t;t=mkTex();gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,src);texCache.set(src,t);return t};
  function bindQuad(pr){gl.bindBuffer(gl.ARRAY_BUFFER,quad);gl.enableVertexAttribArray(pr.a.p);gl.vertexAttribPointer(pr.a.p,2,gl.FLOAT,false,0,0)}
  function unit(i,t,loc){gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,t);gl.uniform1i(loc,i)}
  return {gl,W,H,
    /* the camera turned (portrait ↔ landscape) or changed its size: new frame buffers of the right shape */
    resize(w,h){if(w===W&&h===H)return;W=w;H=h;this.W=w;this.H=h;
      for(const k of ['frame','small']){gl.deleteTexture(F[k].t);gl.deleteFramebuffer(F[k].f)}
      F.frame=fbo(W,H);F.small=fbo(Math.max(16,W>>3),Math.max(16,H>>3))},
    video(src){gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,T.vid);try{gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,src);return true}catch(e){return false}},
    mask(m){gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,T.mask);gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);gl.texImage2D(gl.TEXTURE_2D,0,gl.LUMINANCE,m.w,m.h,0,gl.LUMINANCE,gl.UNSIGNED_BYTE,m.d);gl.pixelStorei(gl.UNPACK_ALIGNMENT,4)},
    bgImage(c){gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,T.bgi);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c)},
    /* 1) the picture with filter and background into an offscreen frame */
    frame(o){
      gl.disable(gl.BLEND);
      if(o.bg===1){gl.bindFramebuffer(gl.FRAMEBUFFER,F.small.f);gl.viewport(0,0,F.small.w,F.small.h);const p=P.copy;gl.useProgram(p.p);bindQuad(p);gl.uniform1f(p.u.mir,1);gl.uniform1f(p.u.fy,0);unit(0,T.vid,p.u.t);gl.drawArrays(gl.TRIANGLE_STRIP,0,4)}
      gl.bindFramebuffer(gl.FRAMEBUFFER,F.frame.f);gl.viewport(0,0,W,H);const p=P.frame;gl.useProgram(p.p);bindQuad(p);gl.uniform1f(p.u.mir,1);
      unit(0,T.vid,p.u.vid);unit(1,F.small.t,p.u.small);unit(2,T.mask,p.u.mask);unit(3,T.bgi,p.u.bgi);gl.uniform1i(p.u.bg,o.bg||0);gl.uniform2f(p.u.sp,1.6/F.small.w,1.6/F.small.h);
      const m=o.f.m||[1,0,0,0,0,1,0,0,0,0,1,0];
      gl.uniformMatrix4fv(p.u.cm,false,[m[0],m[4],m[8],0, m[1],m[5],m[9],0, m[2],m[6],m[10],0, 0,0,0,1]);gl.uniform4f(p.u.co,m[3],m[7],m[11],0);
      gl.uniform1f(p.u.vig,o.f.v||0);gl.uniform1f(p.u.gr,o.f.g||0);gl.uniform1f(p.u.tm,(performance.now()%1000)/1000);gl.uniform1f(p.u.sat,o.f.sat||1);gl.uniform1f(p.u.con,o.f.c||1);gl.uniform1f(p.u.bri,o.f.b||0);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    },
    /* 2) the frame onto the screen */
    out(mir){gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,W,H);gl.disable(gl.BLEND);const p=P.copy;gl.useProgram(p.p);bindQuad(p);gl.uniform1f(p.u.mir,mir);gl.uniform1f(p.u.fy,1);unit(0,F.frame.t,p.u.t);gl.drawArrays(gl.TRIANGLE_STRIP,0,4)},
    /* 3) the face mesh: distorted picture, smoothed skin, or paint */
    mesh(kind,pos,tc,mir,paintSrc,maskSrc){
      const p=P[kind];gl.useProgram(p.p);
      gl.bindBuffer(gl.ARRAY_BUFFER,posb);gl.bufferData(gl.ARRAY_BUFFER,pos,gl.DYNAMIC_DRAW);gl.enableVertexAttribArray(p.a.pos);gl.vertexAttribPointer(p.a.pos,2,gl.FLOAT,false,0,0);
      const hasTc=p.a.tc!=null&&p.a.tc>=0,hasUv=p.a.uv!=null&&p.a.uv>=0;
      if(hasTc){gl.bindBuffer(gl.ARRAY_BUFFER,tcb);gl.bufferData(gl.ARRAY_BUFFER,tc,gl.DYNAMIC_DRAW);gl.enableVertexAttribArray(p.a.tc);gl.vertexAttribPointer(p.a.tc,2,gl.FLOAT,false,0,0)}
      if(hasUv){gl.bindBuffer(gl.ARRAY_BUFFER,uvb);gl.enableVertexAttribArray(p.a.uv);gl.vertexAttribPointer(p.a.uv,2,gl.FLOAT,false,0,0)}
      gl.uniform1f(p.u.mir,mir);
      if(kind==='paint'){unit(0,texOf(paintSrc),p.u.t);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA)}
      else if(kind==='warp'){unit(0,F.frame.t,p.u.f);gl.disable(gl.BLEND)}
      else{unit(0,F.frame.t,p.u.f);unit(1,texOf(maskSrc),p.u.mk);gl.uniform2f(p.u.px,1/W,1/H);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA)}
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.drawElements(gl.TRIANGLES,TRI.length,gl.UNSIGNED_SHORT,0);
      gl.disableVertexAttribArray(p.a.pos);if(hasTc)gl.disableVertexAttribArray(p.a.tc);if(hasUv)gl.disableVertexAttribArray(p.a.uv);
    },
    /* 4) flat pictures (accessories, particles): list of {src, v: Float32Array(n*7), tint} */
    sprites(list){
      if(!list.length)return;const p=P.spr;gl.useProgram(p.p);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
      gl.bindBuffer(gl.ARRAY_BUFFER,sprb);gl.enableVertexAttribArray(p.a.p);gl.enableVertexAttribArray(p.a.ta);
      for(const s of list){gl.bufferData(gl.ARRAY_BUFFER,s.v,gl.DYNAMIC_DRAW);gl.vertexAttribPointer(p.a.p,4,gl.FLOAT,false,28,0);gl.vertexAttribPointer(p.a.ta,3,gl.FLOAT,false,28,16);
        unit(0,texOf(s.src),p.u.t);gl.uniform1f(p.u.useTint,s.tint?1:0);if(s.tint)gl.uniform3f(p.u.tint,s.tint[0],s.tint[1],s.tint[2]);gl.drawArrays(gl.TRIANGLES,0,s.v.length/7)}
      gl.disableVertexAttribArray(p.a.p);gl.disableVertexAttribArray(p.a.ta);gl.disable(gl.BLEND);
    },
    /* 5) 3D models. list: [{mdl, mv(Float32Array 16), alpha}], occ: head shape that only fills depth */
    models(list,occ,mir,asp){
      if(!list.length)return;const p=P.m3;gl.useProgram(p.p);
      gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.clear(gl.DEPTH_BUFFER_BIT);gl.uniform3f(p.u.pr,FOV/asp,FOV,mir);
      const draw=(g,part,mv,al,depthOnly)=>{
        gl.uniformMatrix4fv(p.u.mv,false,mv);
        gl.bindBuffer(gl.ARRAY_BUFFER,part.vb);gl.enableVertexAttribArray(p.a.p);gl.vertexAttribPointer(p.a.p,3,gl.FLOAT,false,0,0);
        if(p.a.n>=0){gl.bindBuffer(gl.ARRAY_BUFFER,part.nb);gl.enableVertexAttribArray(p.a.n);gl.vertexAttribPointer(p.a.n,3,gl.FLOAT,false,0,0)}
        if(p.a.uv>=0){gl.bindBuffer(gl.ARRAY_BUFFER,part.ub);gl.enableVertexAttribArray(p.a.uv);gl.vertexAttribPointer(p.a.uv,2,gl.FLOAT,false,0,0)}
        const tx=!depthOnly&&part.img&&part.img.complete!==false?texOf(part.img):null;
        unit(0,tx||texOf(blank()),p.u.t);gl.uniform1f(p.u.useT,tx?1:0);gl.uniform4f(p.u.col,...part.color);gl.uniform1f(p.u.lit,part.lit?1:0);gl.uniform1f(p.u.al,al);gl.uniform1f(p.u.fv,g.flipV?1:0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,part.ib);gl.drawElements(gl.TRIANGLES,part.n,part.i32?gl.UNSIGNED_INT:gl.UNSIGNED_SHORT,0);
      };
      if(occ){gl.colorMask(false,false,false,false);for(const part of occ.mdl.gl(gl).parts)draw(occ.mdl,part,occ.mv,1,true);gl.colorMask(true,true,true,true)}
      gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
      for(const it of list){const g=it.mdl.gl(gl);if(!g)continue;for(const part of g.parts){if(it.w&&part.src.morphs)morphTo(gl,part,it.w);draw(it.mdl,part,it.mv,it.alpha==null?1:it.alpha)}}
      [p.a.p,p.a.n,p.a.uv].forEach(a=>{if(a>=0)gl.disableVertexAttribArray(a)});gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);
    },
    destroy(){try{const e=gl.getExtension('WEBGL_lose_context');e&&e.loseContext()}catch(e){}}
  };
  }catch(e){console.warn('[fx] WebGL',e);return null}
}

/* =============================================================== 3D models from open-source face filters
   (Jeeliz FaceFilter, Apache 2.0; MindAR examples, CC-BY 4.0 — authors in /vendor/masks/CREDITS.txt),
   converted to a small binary format: header JSON + vertex arrays. */
let BLANK=null;const blank=()=>BLANK||(BLANK=(()=>{const c=cnv(2);const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,2,2);return c})());
const MODELS={};
class Model{
  constructor(name,flipV){this.name=name;this.flipV=!!flipV;this.ready=false;this.parts=[];this.per=new WeakMap();
    if(name)this.loading=fetch('/vendor/masks/'+name+'.mdl').then(r=>{if(!r.ok)throw new Error(r.status);return r.arrayBuffer()}).then(b=>this.parse(b)).catch(e=>{console.warn('[fx] model',name,e)})}
  parse(buf){
    const hl=new DataView(buf).getUint32(0,true),h=JSON.parse(new TextDecoder().decode(new Uint8Array(buf,4,hl))),o=4+hl;
    this.bbox=h.bbox;
    this.parts=h.parts.map(q=>{const P={v:q.v,n:q.i,i32:q.i32,color:q.color,lit:q.lit!==false,
      pos:new Float32Array(buf,o+q.pos,q.v*3),nrm:new Float32Array(buf,o+q.nrm,q.v*3),uv:new Float32Array(buf,o+q.uv,q.v*2),idx:q.i32?new Uint32Array(buf,o+q.idx,q.i):new Uint16Array(buf,o+q.idx,q.i)};
      if(q.tex){P.img=new Image();P.img.src='/vendor/masks/'+q.tex}
      if(q.morphs){P.morphs=q.morphs.map(m=>new Float32Array(buf,o+m,q.v*3));P.dyn=new Float32Array(q.v*3);P.lastW=''}
      return P});
    this.ready=true;
  }
  static of(name,flipV){return MODELS[name]||(MODELS[name]=new Model(name,flipV))}
  /* buffers on the graphics chip, made once per drawing surface */
  gl(gl){
    if(!this.ready)return null;let g=this.per.get(gl);if(g)return g;
    const buf=(t,d)=>{const b=gl.createBuffer();gl.bindBuffer(t,b);gl.bufferData(t,d,gl.STATIC_DRAW);return b};
    g={parts:this.parts.map(q=>({src:q,vb:buf(gl.ARRAY_BUFFER,q.pos),nb:buf(gl.ARRAY_BUFFER,q.nrm),ub:buf(gl.ARRAY_BUFFER,q.uv),ib:buf(gl.ELEMENT_ARRAY_BUFFER,q.idx),n:q.n,i32:q.i32,color:q.color,lit:q.lit,img:q.img}))};
    this.per.set(gl,g);return g;
  }
}
/* animated heads: the expression shapes are mixed by how much you smile, open your mouth, blink… */
function morphTo(gl,part,w){
  const q=part.src,key=w.map(x=>(x*50|0)).join(',');if(key===q.lastW)return;q.lastW=key;
  const d=q.dyn;d.set(q.pos);
  for(let k=0;k<q.morphs.length;k++){const a=w[k];if(a<.02)continue;const m=q.morphs[k];for(let i=0;i<d.length;i++)d[i]+=a*m[i]}
  gl.bindBuffer(gl.ARRAY_BUFFER,part.vb);gl.bufferData(gl.ARRAY_BUFFER,d,gl.DYNAMIC_DRAW);
}
/* MediaPipe expression scores → the 11 shapes of the Jeeliz Weboji heads
   (smile R/L, brow down L/R, brow up L/R, mouth open, mouth round, eye close R/L, teeth) */
const cl=x=>x<0?0:x>1?1:x;
function webojiW(b){if(!b)return null;return [cl(b[B.mouthSmileRight]*1.3),cl(b[B.mouthSmileLeft]*1.3),cl(b[B.browDownLeft]*1.4),cl(b[B.browDownRight]*1.4),cl(Math.max(b[B.browOuterUpLeft],b[B.browInnerUp]*.8)*1.5),cl(Math.max(b[B.browOuterUpRight],b[B.browInnerUp]*.8)*1.5),cl(b[B.jawOpen]*1.5),cl(Math.max(b[B.mouthPucker],b[B.mouthFunnel])*1.3),cl(b[B.eyeBlinkRight]*1.15),cl(b[B.eyeBlinkLeft]*1.15),cl((b[B.mouthUpperUpLeft]+b[B.mouthUpperUpRight])*.7)]}
/* the head as a shape that hides things behind it: the face surface plus a rounded back of the head */
function headOccluder(){
  if(MODELS._head)return MODELS._head;
  const pos=[],idx=[];
  for(let i=0;i<NV;i++)pos.push(G.CANONICAL[i*3],G.CANONICAL[i*3+1],G.CANONICAL[i*3+2]-.3);
  for(const t of G.FACES)idx.push(t);
  const base=pos.length/3,SEG=18,RING=12,c=[0,1.5,-3.2],rad=[7.4,10.5,8.6];
  for(let a=0;a<=RING;a++)for(let b=0;b<=SEG;b++){const th=a/RING*Math.PI,ph=b/SEG*Math.PI*2;pos.push(c[0]+rad[0]*Math.sin(th)*Math.cos(ph),c[1]+rad[1]*Math.cos(th),c[2]+rad[2]*Math.sin(th)*Math.sin(ph))}
  for(let a=0;a<RING;a++)for(let b=0;b<SEG;b++){const i=base+a*(SEG+1)+b;idx.push(i,i+SEG+1,i+1,i+1,i+SEG+1,i+SEG+2)}
  const m=new Model(null);m.parts=[{v:pos.length/3,n:idx.length,i32:false,color:[0,0,0,1],lit:false,pos:new Float32Array(pos),nrm:new Float32Array(pos.length),uv:new Float32Array(pos.length/3*2),idx:new Uint16Array(idx)}];m.ready=true;
  return MODELS._head=m;
}
/* column-major 4x4: M = T·Rz·Ry·Rx·S */
function local(t,r,sc){
  const d=Math.PI/180,[ax,ay,az]=(r||[0,0,0]).map(v=>v*d),s=Array.isArray(sc)?sc:[sc,sc,sc];
  const cx=Math.cos(ax),sx=Math.sin(ax),cy=Math.cos(ay),sy=Math.sin(ay),cz=Math.cos(az),sz=Math.sin(az);
  const R=[cz*cy, sz*cy, -sy, cz*sy*sx-sz*cx, sz*sy*sx+cz*cx, cy*sx, cz*sy*cx+sz*sx, sz*sy*cx-cz*sx, cy*cx];
  return new Float32Array([R[0]*s[0],R[1]*s[0],R[2]*s[0],0, R[3]*s[1],R[4]*s[1],R[5]*s[1],0, R[6]*s[2],R[7]*s[2],R[8]*s[2],0, t[0],t[1],t[2],1]);
}
function mul(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){let v=0;for(let k=0;k<4;k++)v+=a[k*4+r]*b[c*4+k];o[c*4+r]=v}return o}

/* =============================================================== warps: points moved on screen, the picture follows */
function bulge(P,n,cx,cy,r,k){const r2=r*r;for(let i=0;i<n;i++){const dx=P[i*2]-cx,dy=P[i*2+1]-cy,d2=dx*dx+dy*dy;if(d2<r2){const f=1+k*Math.pow(1-d2/r2,2);P[i*2]=cx+dx*f;P[i*2+1]=cy+dy*f}}}
function warpPoints(kind,P){ /* P: pixel coordinates, changed in place */
  const pt=i=>[P[i*2],P[i*2+1]],avg=l=>{let a=0,b=0;l.forEach(i=>{a+=P[i*2];b+=P[i*2+1]});return [a/l.length,b/l.length]};
  const fw=Math.hypot(P[454*2]-P[234*2],P[454*2+1]-P[234*2+1]);
  const eyes=k=>{for(const e of [R.eyeR,R.eyeL]){const c=avg(e);bulge(P,NV,c[0],c[1],fw*.24,k)}};
  if(kind==='bigeyes')eyes(.85);
  else if(kind==='glow'){eyes(.32);const n=pt(4);bulge(P,NV,n[0],n[1],fw*.13,-.22);const m=avg(R.lipsO);bulge(P,NV,m[0],m[1],fw*.15,.08)}
  else if(kind==='baby'){eyes(.8);const n=pt(4);bulge(P,NV,n[0],n[1],fw*.15,-.3);const m=avg(R.lipsO);bulge(P,NV,m[0],m[1],fw*.17,-.28)}
  else if(kind==='hamster'){for(const i of [205,425]){const c=pt(i);bulge(P,NV,c[0],c[1],fw*.3,.55)}}
  else if(kind==='bignose'){const n=pt(4);bulge(P,NV,n[0],n[1],fw*.26,1.1)}
  else if(kind==='smile'){const m=avg(R.lipsO),r=fw*.3;for(let i=0;i<NV;i++){const dx=P[i*2]-m[0],dy=P[i*2+1]-m[1],d=Math.hypot(dx,dy);if(d<r){const f=.55*Math.pow(1-d/r,2);P[i*2]+=dx*f;P[i*2+1]-=Math.abs(dx)/r*fw*.05*(1-d/r)}}}
  else if(kind==='flip'){const o=avg(R.oval);for(let i=0;i<NV;i++)P[i*2+1]=2*o[1]-P[i*2+1]}
  else if(kind==='long'){const ey=avg(R.eyeR.concat(R.eyeL)),ch=pt(152),h=Math.max(1,ch[1]-ey[1]);for(let i=0;i<NV;i++){const d=P[i*2+1]-ey[1];if(d>0){const k=d/h;P[i*2+1]+=d*.55*k;P[i*2]=ey[0]+(P[i*2]-ey[0])*(1-.12*k)}}}
  else if(kind==='wide'){const o=avg(R.oval),fh=Math.hypot(P[10*2]-P[152*2],P[10*2+1]-P[152*2+1]);for(let i=0;i<NV;i++){const k=Math.max(0,1-Math.abs(P[i*2+1]-o[1]-fh*.12)/(fh*.6));P[i*2]=o[0]+(P[i*2]-o[0])*(1+.38*k*k)}const c=pt(205),c2=pt(425);bulge(P,NV,c[0],c[1],fw*.3,.3);bulge(P,NV,c2[0],c2[1],fw*.3,.3)}
  else if(kind==='alien'){eyes(.7);const ey=avg(R.eyeR.concat(R.eyeL)),ch=pt(152);
    for(let i=0;i<NV;i++){const y=P[i*2+1],x=P[i*2];if(y<ey[1]){const k=(ey[1]-y)/fw;P[i*2+1]-=k*fw*.45;P[i*2]=ey[0]+(x-ey[0])*(1+k*.35)}else{const k=Math.min(1,(y-ey[1])/Math.max(1,ch[1]-ey[1]));P[i*2]=ey[0]+(x-ey[0])*(1-k*.32)}}}
}

/* =============================================================== particles */
const PK={
  fire:{t:()=>E('🔥')(),life:.7,size:.2,speed:1.6,spread:.5,grow:1.6},
  rainbow:{t:SP.band,life:.9,size:.09,speed:1.2,spread:.08,colors:[[1,.23,.23],[1,.62,.1],[1,.89,.1],[.17,.83,.49],[.18,.55,1],[.54,.36,1]]},
  hearts:{t:()=>E('❤️')(),life:1.4,size:.12,speed:.7,spread:.9,up:true},
  bubbles:{t:SP.bubble,life:1.8,size:.11,speed:.6,spread:.8,up:true,wobble:true},
  stars:{t:()=>E('⭐')(),life:1,size:.11,speed:1.1,spread:2.4,up:true,spin:true},
  sparkle:{t:()=>E('✨')(),life:.8,size:.09,speed:.25,spread:3.1,spin:true},
  tears:{t:SP.tear,life:1,size:.05,speed:.5,spread:.05,fall:true},
  confetti:{t:SP.band,life:2.2,size:.035,speed:.35,spread:2,fall:true,spin:true,colors:[[1,.31,.55],[1,.85,.29],[.17,.83,.49],[.18,.55,1]]},
  snow:{t:SP.dot,life:4,size:.035,speed:.25,fall:true,screen:true},
  rain:{t:()=>imgTex('drop.png'),life:1.1,size:.05,speed:1.5,spread:.1,fall:true},
  angry:{t:()=>E('💢')(),life:.8,size:.16,speed:.15,spread:2.4,up:true,grow:.4},
  money:{t:()=>E('💸')(),life:3,size:.1,speed:.35,fall:true,screen:true,spin:true},
  butterfly:{t:()=>E('🦋')(),life:2.6,size:.13,speed:.45,spread:2.6,up:true,wobble:true},
  petals:{t:()=>E('🌸')(),life:3.5,size:.07,speed:.3,fall:true,screen:true,spin:true}
};
class Particles{
  constructor(){this.list=[];this.acc=0;this.rb=0}
  emit(kind,x,y,dirx,diry,fw,W,H,dt,rate){
    const k=PK[kind];if(!k)return;this.acc+=dt*(rate||(kind==='rainbow'?60:kind==='fire'?45:14));
    const max=LITE?60:140;
    while(this.acc>=1&&this.list.length<max){this.acc--;
      const a=Math.atan2(diry,dirx)+(Math.random()-.5)*(k.spread||0),sp=k.speed*fw*(.8+Math.random()*.4);
      let px=x,py=y,vx=Math.cos(a)*sp,vy=Math.sin(a)*sp;
      if(k.screen){px=Math.random()*W;py=-20;vx=(Math.random()-.5)*fw*.2;vy=sp}
      else if(k.up){vy=-Math.abs(vy)}
      if(kind==='rainbow'){const i=++this.rb;this.list.push({k,x:px,y:py,vx,vy,age:0,size:k.size*fw,rot:0,c:k.colors[i%6],off:(i%6-2.5)*k.size*fw*.6,ang:a});continue}
      this.list.push({k,x:px,y:py,vx,vy,age:0,size:k.size*fw*(.7+Math.random()*.6),rot:Math.random()*6,vr:(Math.random()-.5)*4,c:k.colors?k.colors[(Math.random()*k.colors.length)|0]:null,ph:Math.random()*6});
    }
    if(this.acc>3)this.acc=0;
  }
  step(dt,fw){
    this.list=this.list.filter(p=>(p.age+=dt)<p.k.life);
    for(const p of this.list){p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.k.fall&&!p.k.screen)p.vy+=fw*1.5*dt;if(p.k.spin)p.rot+=p.vr*dt;if(p.k.wobble)p.x+=Math.sin(p.age*5+p.ph)*fw*.15*dt}
  }
}

/* =============================================================== the effect pipeline */
const PAINT=new Map();let BEAUTYMASK=null;
function paintOf(m){if(!m.paint)return null;let c=PAINT.get(m.id);if(!c){c=cnv(PS);m.paint(c.getContext('2d'));PAINT.set(m.id,c)}return c}
function beautyMask(){
  if(BEAUTYMASK)return BEAUTYMASK;const c=cnv(PS),x=c.getContext('2d');
  soft(x,PS*.05,()=>polyP(x,grow(R.oval,.93)),'#fff');
  x.globalCompositeOperation='destination-out';
  for(const l of [R.eyeR,R.eyeL])soft(x,PS*.02,()=>polyP(x,grow(l,1.5)),'#000');
  for(const l of [R.browR,R.browL])soft(x,PS*.02,()=>polyP(x,grow(l,1.3)),'#000');
  soft(x,PS*.015,()=>polyP(x,grow(R.lipsO,1.1)),'#000');
  return BEAUTYMASK=c;
}
const FOV=1/Math.tan(63/2*Math.PI/180); /* the camera model the face tracker uses */

class FX{
  /* src: a camera video track, or a still picture (canvas) for gallery photos
     opts: mirror (front camera in stories), max (longest side of the picture), fps */
  constructor(src,opts={}){
    this.mask=MASKS[0];this.filter=FILTERS[0];this.bg=BGS[0];this.beauty=false;this.mirror=!!opts.mirror;this.alive=true;
    this.still=!(src&&src.kind==='video');
    if(this.still){this.v=src;this.vw=src.width||src.naturalWidth;this.vh=src.height||src.naturalHeight}
    else{
      this.track=src;this.src=new MediaStream([src]);
      const v=this.v=document.createElement('video');v.muted=true;v.playsInline=true;v.autoplay=true;v.setAttribute('playsinline','');v.srcObject=this.src;
      v.style.cssText='position:fixed;width:2px;height:2px;opacity:0;pointer-events:none;left:0;top:0';document.body.appendChild(v);v.play().catch(()=>{});
      const s=src.getSettings?src.getSettings():{};this.vw=s.width||640;this.vh=s.height||480;
    }
    const maxSide=opts.max||(LITE?640:960),k=Math.min(1,maxSide/Math.max(this.vw,this.vh));
    this.cv=cnv(Math.round(this.vw*k)&~1,Math.round(this.vh*k)&~1);
    this.r=Renderer(this.cv);
    if(!this.r)this.x2=this.cv.getContext('2d');
    this.fps=opts.fps||(LITE?20:30);
    this.maxSide=maxSide;
    this.out=!this.still&&!opts.noStream&&this.cv.captureStream?this.cv.captureStream(this.fps):null;
    this.sm=new Smooth(NV*2,LITE?1.2:1.6,8);this.face=null;this.parts=new Particles();this.last=performance.now();
    this.loop=this.loop.bind(this);
    if(!this.still){
      if(this.v.requestVideoFrameCallback)this.v.requestVideoFrameCallback(this.loop);else this.timer=setTimeout(this.loop,0);
      /* keeps going if the browser stops reporting new frames for a while */
      this.watch=setInterval(()=>{if(this.alive&&!this.paused&&performance.now()-this.last>400){this.tick()}},250);
    }
  }
  get outTrack(){return this.out?this.out.getVideoTracks()[0]:null}
  get active(){return this.mask.id!=='none'||this.filter.id!=='none'||this.bg.id!=='none'||this.beauty}
  get ok(){return !!this.r}
  needFace(){return this.mask.id!=='none'||this.beauty}
  set(maskId,filterId,bgId,beauty){
    if(maskId!=null){const m=MASKS.find(x=>x.id===maskId)||MASKS[0];if(m!==this.mask){this.mask=m;this.parts.list=[];this.maskT=performance.now();if(m.m3)m.m3.forEach(d=>Model.of(d.mdl,d.flipV))}}
    if(filterId!=null)this.filter=FILTERS.find(f=>f.id===filterId)||FILTERS[0];
    if(bgId!=null&&bgId!=='photo'){const b=BGS.find(x=>x.id===bgId)||BGS[0];if(b!==this.bg){this.bg=b;this.bgDrawn=false;this.bgPhoto=null}}
    if(beauty!=null)this.beauty=!!beauty;
    if(this.needFace())loadTracker().catch(()=>{});
    if(this.bg.id!=='none')this.loadBg();
  }
  loadBg(){loadSeg().catch(()=>{})}
  setBgImage(img){this.bgPhoto=img;this.bg={id:'photo',n:'Фото'};this.bgDrawn=false;this.loadBg()}
  pause(on){this.paused=on;if(!on&&!this.still){this.last=performance.now();if(this.v.requestVideoFrameCallback)this.v.requestVideoFrameCallback(this.loop);else this.loop()}}
  /* the newest frame goes to the tracker; its answer is used whenever it comes */
  async feed(){
    const k=Math.min(1,(LITE?320:448)/Math.max(this.vw,this.vh)),w=Math.max(2,Math.round(this.vw*k)),h=Math.max(2,Math.round(this.vh*k));
    if(this.bg.id!=='none'&&!this.segging&&SG.w){this.segging=true;segment(this.v,w,h).then(r=>{this.segging=false;if(r&&r.mask&&this.alive)this.mask0=r.mask})}
    if(this.feeding||!this.needFace())return;
    this.feeding=true;const t0=performance.now();
    const r=await track(this.v,w,h);
    this.feeding=false;if(!this.alive||r===undefined)return;
    if(r&&r.lm){const t=performance.now(),xy=new Float32Array(NV*2);for(let i=0;i<NV;i++){xy[i*2]=r.lm[i*3];xy[i*2+1]=r.lm[i*3+1]}
      const mat=r.mat?this.smoothMat(r.mat):null;this.lat=this.lat==null?t-t0:this.lat*.8+(t-t0)*.2;this.face={xy:this.sm.run(xy,t),dx:this.sm.dx,bs:r.bs,mat,t}}
    else if(r&&this.face&&performance.now()-this.face.t>350)this.face=null;
  }
  smoothMat(m){if(!this.mat||!this.face){this.mat=Float32Array.from(m);return this.mat}for(let i=0;i<16;i++)this.mat[i]+=(m[i]-this.mat[i])*.55;return this.mat}
  loop(){
    if(!this.alive||this.paused)return;
    if(this.v.requestVideoFrameCallback)this.v.requestVideoFrameCallback(this.loop);else this.timer=setTimeout(this.loop,1000/this.fps);
    this.tick();
  }
  /* phones often say "1280×720" while the camera actually gives a portrait 720×1280 picture,
     and the picture turns when the phone turns: the canvas always takes the real shape, so nothing is stretched */
  fit(){
    const vw=this.v.videoWidth,vh=this.v.videoHeight;if(!vw||!vh)return;
    if(vw===this.vw&&vh===this.vh&&this.fitted)return;this.fitted=true;
    const W=this.cv.width,H=this.cv.height;this.vw=vw;this.vh=vh;
    if(Math.abs(vw/vh-W/H)<.01&&Math.max(W,H)>=Math.min(this.maxSide,Math.max(vw,vh))*.98)return;
    const k=Math.min(1,this.maxSide/Math.max(vw,vh)),w=Math.round(vw*k)&~1,h=Math.round(vh*k)&~1;
    this.cv.width=w;this.cv.height=h;if(this.r)this.r.resize(w,h);this.bgDrawn=false;this.mask0=null;
  }
  tick(){
    const now=performance.now(),dt=Math.min(.1,(now-this.last)/1000);this.last=now;
    if(this.v.readyState<2)return;
    if(!this.still)this.fit();
    this.feed();this.draw(dt);
  }
  draw(dt){
    const W=this.cv.width,H=this.cv.height,mir=this.mirror?-1:1;
    if(!this.r){const x=this.x2;x.save();if(this.mirror){x.translate(W,0);x.scale(-1,1)}x.drawImage(this.v,0,0,W,H);x.restore();return}
    const r=this.r;if(!r.video(this.v))return;
    let bg=0;
    if(this.bg.id!=='none'&&this.mask0){r.mask(this.mask0);bg=this.bg.id==='blur'?1:2;
      if(bg===2&&!this.bgDrawn){const c=cnv(W,H),x=c.getContext('2d');
        if(this.bgPhoto){const p=this.bgPhoto,s=Math.max(W/p.width,H/p.height);x.drawImage(p,(W-p.width*s)/2,(H-p.height*s)/2,p.width*s,p.height*s)}else this.bg.draw(x,W,H);
        /* a mirrored camera shows the background mirrored too, so it is drawn reversed to read the right way */
        if(this.mirror){const c2=cnv(W,H),x2=c2.getContext('2d');x2.translate(W,0);x2.scale(-1,1);x2.drawImage(c,0,0);r.bgImage(c2)}else r.bgImage(c);this.bgDrawn=true}}
    r.frame({f:this.filter,bg});
    r.out(mir);
    const f=this.face,m=this.mask;
    if(f){
      /* the tracker answers a few frames late: the points are moved ahead along the face's own motion,
         so masks stay glued to the face even when you turn quickly (like in Snapchat) */
      const ahead=this.still?0:Math.min(.07,((this.lat||0)+performance.now()-f.t)/1000),tc=new Float32Array(NV*2);
      for(let i=0;i<NV*2;i++){const d=f.dx?f.dx[i]*ahead:0;tc[i]=f.xy[i]+(d>.03?.03:d<-.03?-.03:d)}
      const P=new Float32Array(NV*2);for(let i=0;i<NV*2;i+=2){P[i]=tc[i]*W;P[i+1]=tc[i+1]*H}
      const fw=Math.hypot(P[454*2]-P[234*2],P[454*2+1]-P[234*2+1]);
      if(m.warp){const Q=P.slice();warpPoints(m.warp,Q);for(let i=0;i<NV*2;i+=2){Q[i]/=W;Q[i+1]/=H}r.mesh('warp',Q,tc,mir)}
      if(this.beauty||m.beauty)r.mesh('beauty',tc,tc,mir,null,beautyMask());
      const pc=paintOf(m);if(pc)r.mesh('paint',tc,tc,mir,pc);
      if(m.m3&&f.mat){const list=[],now=performance.now(),age=(now-(this.maskT||now))/1000;
        for(const d of m.m3){if(d.show&&!(f.bs&&d.show(f.bs)))continue;const md=Model.of(d.mdl,d.flipV);if(!md.ready)continue;
          let t=d.t;if(d.drop&&age<1){const k=1-Math.pow(1-age,3);t=[t[0],t[1]+(1-k)*22,t[2]]} /* falls into place, like the "deal with it" glasses */
          list.push({mdl:md,mv:mul(f.mat,local(t,d.r,d.s)),alpha:d.alpha,w:d.morph?webojiW(f.bs):null})}
        r.models(list,m.noOcc?null:{mdl:headOccluder(),mv:f.mat},mir,W/H)}
      const spr=[];
      if(m.props)for(const p of m.props){if(p.show&&!(f.bs&&p.show(f.bs)))continue;const v=p.lm!=null?this.flat(p,P,fw,W,H,mir,f.bs):f.mat?this.prop3d(p,f.mat,W,H,mir):null;if(v)spr.push({src:p.t(),v,z:v.z||0})}
      spr.sort((a,b)=>b.z-a.z);
      if(m.fx&&f.bs&&m.fx.on(f.bs))this.emit(m.fx,P,fw,W,H,dt);
      this.parts.step(dt,fw);
      r.sprites(spr.concat(this.partSprites(W,H,mir)));
    }else if(this.parts.list.length){this.parts.step(dt,100);r.sprites(this.partSprites(W,H,mir))}
  }
  /* a picture standing in 3D by the face, turned the way the head is turned */
  prop3d(p,M,W,H,mir){
    const asp=W/H,[cx,cy,cz]=p.at,hw=p.w/2,hh=p.h/2,c=Math.cos(p.r||0),s=Math.sin(p.r||0);
    const corner=(dx,dy)=>{const x=cx+dx*c-dy*s,y=cy+dx*s+dy*c,z=cz;
      const X=M[0]*x+M[4]*y+M[8]*z+M[12],Y=M[1]*x+M[5]*y+M[9]*z+M[13],Z=M[2]*x+M[6]*y+M[10]*z+M[14];
      return [FOV/asp*X*mir,FOV*Y,0,-Z]};
    const fl=p.flip?1:0,u0=fl,u1=1-fl,a=corner(-hw,hh),b=corner(hw,hh),d=corner(-hw,-hh),e=corner(hw,-hh);
    const v=new Float32Array([...a,u0,0,1,...b,u1,0,1,...d,u0,1,1,...b,u1,0,1,...e,u1,1,1,...d,u0,1,1]);v.z=(a[3]+e[3])/2;return v;
  }
  /* a picture stuck to one face point on screen, tilted with the head */
  flat(p,P,fw,W,H,mir,bs){
    const ang=Math.atan2(P[263*2+1]-P[33*2+1],P[263*2]-P[33*2]),L=Array.isArray(p.lm)?p.lm:[p.lm];
    let x=0,y=0;for(const i of L){x+=P[i*2];y+=P[i*2+1]}x/=L.length;y/=L.length;
    const dy=(p.dy||0)*fw;x-=Math.sin(ang)*dy;y+=Math.cos(ang)*dy;
    const sx=(p.s||.2)*fw/2,sy=sx*(p.ar||1)*(p.sy&&bs?p.sy(bs):1);
    const pt=(ex,ey)=>{const X=x+ex*Math.cos(ang)-ey*Math.sin(ang),Y=y+ex*Math.sin(ang)+ey*Math.cos(ang);return [(X/W*2-1)*mir,1-Y/H*2,0,1]};
    const u0=p.flip?1:0,u1=1-u0,a=pt(-sx,-sy),b=pt(sx,-sy),d=pt(-sx,sy),e=pt(sx,sy);
    return new Float32Array([...a,u0,0,1,...b,u1,0,1,...d,u0,1,1,...b,u1,0,1,...e,u1,1,1,...d,u0,1,1]);
  }
  emit(fx,P,fw,W,H,dt){
    const avg=l=>{let a=0,b=0;l.forEach(i=>{a+=P[i*2];b+=P[i*2+1]});return [a/l.length,b/l.length]};
    const dx=P[152*2]-P[168*2],dy=P[152*2+1]-P[168*2+1],dl=Math.hypot(dx,dy)||1,dn=[dx/dl,dy/dl];
    if(fx.from==='mouth'){const m=avg([13,14]);this.parts.emit(fx.kind,m[0],m[1],dn[0],dn[1],fw,W,H,dt,fx.rate)}
    else if(fx.from==='eyes'){for(const e of [R.eyeR,R.eyeL]){const c=avg(e);this.parts.emit(fx.kind,c[0],c[1]+fw*.04,dn[0],dn[1],fw,W,H,dt,(fx.rate||10)/2)}}
    else if(fx.from==='cloud'){const t=[P[10*2]-dn[0]*fw*.85,P[10*2+1]-dn[1]*fw*.85];for(let k=0;k<2;k++)this.parts.emit(fx.kind,t[0]+(Math.random()-.5)*fw*.9,t[1],dn[0],dn[1],fw,W,H,dt,fx.rate/2)}
    else if(fx.from==='cheeks'){for(const i of [205,425])this.parts.emit(fx.kind,P[i*2],P[i*2+1],-dn[0],-dn[1],fw,W,H,dt,fx.rate||10)}
    else if(fx.from==='top'||fx.from==='head'){this.parts.emit(fx.kind,P[10*2]-dn[0]*fw*.3,P[10*2+1]-dn[1]*fw*.3,-dn[0],-dn[1],fw,W,H,dt,fx.rate)}
    else this.parts.emit(fx.kind,0,0,0,1,fw,W,H,dt,fx.rate);
  }
  partSprites(W,H,mir){
    const by=new Map();
    for(const p of this.parts.list){
      const k=p.k,src=k.t(),life=p.age/k.life,a=life<.15?life/.15:1-Math.max(0,(life-.6)/.4);
      const s=p.size*(1+(k.grow||0)*life)/2,cs=Math.cos(p.rot||0),sn=Math.sin(p.rot||0);
      let x=p.x,y=p.y;if(p.off){const pa=(p.ang||0)+Math.PI/2;x+=Math.cos(pa)*p.off;y+=Math.sin(pa)*p.off}
      const pt=(ex,ey)=>[((x+ex*cs-ey*sn)/W*2-1)*mir,1-(y+ex*sn+ey*cs)/H*2,0,1];
      let g=by.get(src);if(!g){g=new Map();by.set(src,g)}const key=p.c?p.c.join():'';let arr=g.get(key);if(!arr){arr=[];arr.tint=p.c;g.set(key,arr)}
      const A=pt(-s,-s),Bp=pt(s,-s),C=pt(-s,s),D=pt(s,s);arr.push(...A,0,0,a,...Bp,1,0,a,...C,0,1,a,...Bp,1,0,a,...D,1,1,a,...C,0,1,a);
    }
    const out=[];by.forEach((g,src)=>g.forEach(arr=>out.push({src,tint:arr.tint,v:new Float32Array(arr)})));return out;
  }
  /* a still copy of the current picture (for stories) */
  snap(){if(this.r)this.draw(0);const c=cnv(this.cv.width,this.cv.height);c.getContext('2d').drawImage(this.cv,0,0);return c}
  stop(){this.alive=false;clearTimeout(this.timer);clearInterval(this.watch);if(this.out)this.out.getTracks().forEach(t=>t.stop());if(!this.still){this.v.srcObject=null;this.v.remove()}if(this.r)this.r.destroy()}
}

/* effects on a still photo from the gallery: track the face on it, then draw once */
async function onPhoto(canvas,maskId,filterId,bgId,beauty,bgImg){
  const fx=new FX(canvas,{max:1920});fx.set(maskId,filterId,bgId,beauty);if(bgImg)fx.setBgImage(bgImg);
  if(fx.needFace()){try{await loadTracker()}catch(e){}}
  if(fx.bg.id!=='none'){try{await loadSeg()}catch(e){}}
  for(let i=0;i<3&&(fx.needFace()||fx.bg.id!=='none');i++){await fx.feed();for(let k=0;k<40&&fx.segging;k++)await new Promise(r=>setTimeout(r,25))}
  if(fx.mask.fx&&fx.face){const W=fx.cv.width,H=fx.cv.height,P=new Float32Array(NV*2);for(let j=0;j<NV*2;j+=2){P[j]=fx.face.xy[j]*W;P[j+1]=fx.face.xy[j+1]*H}
    const fw=Math.hypot(P[454*2]-P[234*2],P[454*2+1]-P[234*2+1]);for(let i=0;i<15;i++){fx.emit(fx.mask.fx,P,fw,W,H,.05);fx.parts.step(.05,fw)}}
  const out=fx.snap();fx.stop();return out;
}
window.MFX={MASKS,FILTERS,BGS,FX,canFilter:true,onPhoto,loadTracker,status:()=>[T.state,SG.state].includes('loading')?'loading':[T.state,SG.state].includes('error')?'error':[T.state,SG.state].includes('ready')?'ready':'idle',onStatus:f=>{T.cbs.add(f);return ()=>T.cbs.delete(f)}};
})();
