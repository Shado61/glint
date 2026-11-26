/* Manasenger — «Серийчик», the streak pet of a chat.
   An original character: a round creature with a little flame on its head.
   It hatches from an egg when people chat several days in a row, grows with the streak,
   shows a mood (happy / waiting / sleepy) and can be dressed up.
   Drawn as vector (SVG) with 3D-like lighting: a key light from the top left, soft shade and
   ambient occlusion at the bottom, a rim light and glossy eyes. Materials («стили») change the look:
   glossy, plush, clay, glass, neon, metal, cartoon. Its eyes follow the finger (CSS vars --lx/--ly). */
'use strict';
(function(){
/* ---------- colour helpers ---------- */
const hx=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const mix=(a,b,t)=>{const A=hx(a),B=hx(b);return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('')};
const lt=(c,t)=>mix(c,'#ffffff',t),dk=(c,t)=>mix(c,'#000000',t);

const COLORS={
  ember:{n:'Огонёк',body:'#ff9d4d',belly:'#ffd8a8',flame:['#ffe066','#ff6b3d']},
  rose:{n:'Роза',body:'#ff8fb3',belly:'#ffd6e4',flame:['#fff0a0','#ff4f8b']},
  sky:{n:'Небо',body:'#6fb6ff',belly:'#d3ebff',flame:['#c8f3ff','#3d8bff']},
  mint:{n:'Мята',body:'#5fd6a5',belly:'#d0f6e6',flame:['#f1ffb0','#22b07a']},
  grape:{n:'Виноград',body:'#a487ff',belly:'#e4dbff',flame:['#ffd6ff','#7b5cff']},
  cherry:{n:'Вишня',body:'#ff5d6b',belly:'#ffd0d4',flame:['#fff3a0','#ff2b4a']},
  cloud:{n:'Облако',body:'#e4ebf5',belly:'#ffffff',flame:['#d8f6ff','#6f9dff']},
  cocoa:{n:'Какао',body:'#b07a52',belly:'#f1d6ba',flame:['#ffe9a6','#ff8a3d']},
  lava:{n:'Лава',body:'#ff6a2b',belly:'#ffc28a',flame:['#fff27a','#ff2d00'],need:7},
  night:{n:'Ночь',body:'#3f4a6b',belly:'#8e9bc0',flame:['#a6f0ff','#5b6bff'],need:14},
  ice:{n:'Лёд',body:'#8fdcff',belly:'#ecfaff',flame:['#ffffff','#38c8ff'],need:14},
  gold:{n:'Золото',body:'#ffc94a',belly:'#fff0c0',flame:['#fffbe0','#ff9a1a'],need:30},
  galaxy:{n:'Галактика',body:'#3a2b7a',belly:'#9d8cff',flame:['#ff9cf5','#6a5cff'],need:30}
};
/* materials — how the pet is lit and what it seems to be made of */
const STYLES={
  gloss:{n:'Глянец 3D'},
  clay:{n:'Пластилин'},
  plush:{n:'Плюш'},
  glass:{n:'Стекло'},
  toon:{n:'Мульт'},
  neon:{n:'Неон',need:7},
  metal:{n:'Металл',need:14}
};
/* stage by streak days: egg → baby → kid → legend */
const STAGES=[{from:0,n:'Яйцо'},{from:3,n:'Малыш'},{from:7,n:'Подросток'},{from:30,n:'Легенда'}];
const stageOf=d=>d>=30?3:d>=7?2:d>=3?1:0;
/* flat:1 — drawn with lines only, it gets no 3D shine */
const HATS={
  none:{n:'Без шапки'},
  cap:{n:'Кепка',svg:()=>`<path d="M58 70c4-26 80-26 84 0z" fill="#ff4f6b"/><path d="M60 70h78c0 5-4 7-10 7H70c-6 0-10-2-10-7z" fill="#e23b55"/><path d="M128 70c14 0 28 3 30 9H124z" fill="#c9213d"/><circle cx="100" cy="48" r="4" fill="#ffd0d8"/>`},
  beanie:{n:'Шапка',svg:()=>`<path d="M60 74c0-34 80-34 80 0z" fill="#5b8fd0"/><rect x="56" y="68" width="88" height="14" rx="7" fill="#e9eef7"/><path d="M68 56h64M66 64h68" stroke="#4573ae" stroke-width="3" stroke-dasharray="4 5"/><circle cx="100" cy="38" r="10" fill="#e9eef7"/>`},
  bow:{n:'Бантик',svg:()=>`<path d="M100 60l-24-14c-6-3-10 2-8 8l4 14c2 6 8 6 12 3z" fill="#ff5d9e"/><path d="M100 60l24-14c6-3 10 2 8 8l-4 14c-2 6-8 6-12 3z" fill="#ff5d9e"/><circle cx="100" cy="62" r="7" fill="#e03a80"/>`},
  flower:{n:'Цветок',svg:()=>[0,72,144,216,288].map(a=>`<ellipse cx="128" cy="58" rx="7" ry="11" fill="#fff" transform="rotate(${a} 128 64) translate(0 -2)"/>`).join('')+`<circle cx="128" cy="64" r="6" fill="#ffc94a"/>`},
  cat:{n:'Ушки',svg:c=>`<path d="M54 92l4-48 36 26z" fill="${c.body}"/><path d="M146 92l-4-48-36 26z" fill="${c.body}"/><path d="M62 82l3-28 21 15z" fill="#ff9fb8"/><path d="M138 82l-3-28-21 15z" fill="#ff9fb8"/>`},
  party:{n:'Праздник',svg:()=>`<path d="M100 12l-22 60h44z" fill="#5bd1ff"/><path d="M90 40l18 7M84 58l28 10" stroke="#fff" stroke-width="5" stroke-linecap="round"/><circle cx="100" cy="12" r="7" fill="#ffd04a"/>`},
  santa:{n:'Колпак',svg:()=>`<path d="M62 74C66 40 96 26 126 34c14 4 24 18 30 34l-14 4c-4-10-10-18-18-22l8 24z" fill="#e2333f"/><rect x="56" y="66" width="92" height="15" rx="7.5" fill="#fff"/><circle cx="152" cy="74" r="9" fill="#fff"/>`},
  headphones:{n:'Наушники',need:7,svg:()=>`<path d="M52 104c-4-48 100-48 96 0" fill="none" stroke="#2f3646" stroke-width="7"/><rect x="40" y="96" width="18" height="30" rx="8" fill="#ff5d6b"/><rect x="142" y="96" width="18" height="30" rx="8" fill="#ff5d6b"/>`,flat:1},
  witch:{n:'Ведьма',need:7,svg:()=>`<path d="M100 8l-26 62h52z" fill="#5a3d9a"/><path d="M100 8c10 10 22 14 34 12l-8 18z" fill="#5a3d9a"/><ellipse cx="100" cy="72" rx="52" ry="9" fill="#46307c"/><rect x="76" y="58" width="48" height="8" fill="#ffc94a"/>`},
  halo:{n:'Нимб',need:7,svg:()=>`<ellipse cx="100" cy="40" rx="32" ry="9" fill="none" stroke="#fff3b0" stroke-width="10" opacity=".35"/><ellipse cx="100" cy="40" rx="32" ry="9" fill="none" stroke="#ffe27a" stroke-width="5"/>`,flat:1},
  tophat:{n:'Цилиндр',need:14,svg:()=>`<rect x="72" y="22" width="56" height="46" rx="4" fill="#1d2230"/><rect x="72" y="54" width="56" height="8" fill="#e23b55"/><ellipse cx="100" cy="70" rx="44" ry="8" fill="#1d2230"/>`},
  horns:{n:'Рожки',need:14,svg:()=>`<path d="M72 72c-12-10-14-28-5-40 1 13 9 22 18 28z" fill="#e23b55"/><path d="M128 72c12-10 14-28 5-40-1 13-9 22-18 28z" fill="#e23b55"/>`},
  crown:{n:'Корона',need:30,svg:()=>`<path d="M66 72V40l17 16 17-26 17 26 17-16v32z" fill="#ffd04a" stroke="#d19a12" stroke-width="3" stroke-linejoin="round"/><circle cx="100" cy="58" r="5" fill="#2f8cff"/><circle cx="80" cy="64" r="4" fill="#e23b5a"/><circle cx="120" cy="64" r="4" fill="#2bd47d"/>`}
};
const EYES={
  none:{n:'Без очков'},
  round:{n:'Круглые',svg:()=>`<circle cx="80" cy="108" r="16" fill="rgba(255,255,255,.18)" stroke="#2f3646" stroke-width="4"/><circle cx="120" cy="108" r="16" fill="rgba(255,255,255,.18)" stroke="#2f3646" stroke-width="4"/><path d="M96 106q4-4 8 0" stroke="#2f3646" stroke-width="4" fill="none"/>`},
  nerd:{n:'Квадратные',svg:()=>`<rect x="62" y="96" width="34" height="26" rx="7" fill="rgba(255,255,255,.16)" stroke="#2f3646" stroke-width="4"/><rect x="104" y="96" width="34" height="26" rx="7" fill="rgba(255,255,255,.16)" stroke="#2f3646" stroke-width="4"/><path d="M96 106q4-4 8 0" stroke="#2f3646" stroke-width="4" fill="none"/>`},
  sun:{n:'Солнечные',svg:()=>`<path d="M60 98h80v8c0 14-8 20-18 20-8 0-14-6-16-14h-12c-2 8-8 14-16 14-10 0-18-6-18-20z" fill="#14161d"/><path d="M68 102l10 8M110 102l10 8" stroke="#fff" stroke-width="3" opacity=".5"/>`},
  hearts:{n:'Сердечки',svg:()=>[80,120].map(x=>`<path d="M${x} 122c-14-9-20-16-18-23 2-6 10-8 18 0 8-8 16-6 18 0 2 7-4 14-18 23z" fill="#ff3b78" stroke="#c4004c" stroke-width="2"/>`).join('')+`<path d="M96 104q4-4 8 0" stroke="#c4004c" stroke-width="3" fill="none"/>`},
  mask:{n:'Маска героя',svg:()=>`<path fill-rule="evenodd" d="M54 102c14-14 32-12 46-4 14-8 32-10 46 4-2 20-20 26-32 20-6-3-10-8-14-8s-8 5-14 8c-12 6-30 0-32-20zM70 107a10 9 0 1 0 20 0a10 9 0 1 0-20 0zM110 107a10 9 0 1 0 20 0a10 9 0 1 0-20 0z" fill="#e23b55"/>`},
  star:{n:'Звёзды',need:7,svg:()=>[80,120].map(x=>`<path d="M${x} 92l5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2z" fill="#ffd04a" stroke="#e09a12" stroke-width="2"/>`).join('')},
  monocle:{n:'Монокль',need:14,svg:()=>`<circle cx="120" cy="108" r="16" fill="rgba(255,255,255,.2)" stroke="#d19a12" stroke-width="4"/><path d="M135 116q9 20 0 42" fill="none" stroke="#d19a12" stroke-width="2"/>`},
  visor:{n:'Кибер-визор',need:30,svg:()=>`<rect x="52" y="94" width="96" height="26" rx="13" fill="#38e1ff" opacity=".85"/><rect x="52" y="94" width="96" height="26" rx="13" fill="none" stroke="#1b6f8a" stroke-width="3"/><path d="M62 101h50" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>`}
};
const NECK={
  none:{n:'Ничего'},
  scarf:{n:'Шарф',svg:()=>`<path d="M58 140c26 12 58 12 84 0v12c-26 12-58 12-84 0z" fill="#e23b55"/><path d="M122 148l8 26h-14l-6-24z" fill="#c9213d"/><path d="M66 146v8M78 149v8M90 151v8" stroke="#ffb3c0" stroke-width="3"/>`},
  bowtie:{n:'Бабочка',svg:()=>`<path d="M100 146l-18-10v20zM100 146l18-10v20z" fill="#2f3646"/><circle cx="100" cy="146" r="5" fill="#1d2230"/>`},
  tie:{n:'Галстук',svg:()=>`<path d="M93 140h14l-3 7 8 28-12 11-12-11 8-28z" fill="#2f8cff"/><path d="M93 140h14l-3 7h-8z" fill="#1f6fd8"/>`},
  bell:{n:'Колокольчик',svg:()=>`<path d="M60 138c26 10 54 10 80 0v8c-26 10-54 10-80 0z" fill="#e23b55"/><circle cx="100" cy="155" r="8" fill="#ffd04a"/><path d="M95 157h10" stroke="#a5740c" stroke-width="2"/>`},
  beads:{n:'Бусы',svg:()=>Array.from({length:9},(_,i)=>{const a=Math.PI*(.15+.7*i/8),x=100-Math.cos(a)*40,y=136+Math.sin(a)*14;return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5" fill="${['#ff5d9e','#ffd04a','#5bd1ff'][i%3]}"/>`}).join('')},
  locket:{n:'Кулон',svg:()=>`<path d="M80 134q20 20 40 0" fill="none" stroke="#c0c6d4" stroke-width="2.5"/><path d="M100 162c-9-6-13-10-12-15 1-4 7-5 12 0 5-5 11-4 12 0 1 5-3 9-12 15z" fill="#ff3b78"/>`,flat:1},
  bandana:{n:'Бандана',need:7,svg:()=>`<path d="M60 138c24 8 56 8 80 0l-40 30z" fill="#2f8cff"/><circle cx="84" cy="146" r="2" fill="#fff"/><circle cx="100" cy="152" r="2" fill="#fff"/><circle cx="116" cy="146" r="2" fill="#fff"/>`},
  chain:{n:'Цепь',need:14,svg:()=>Array.from({length:11},(_,i)=>{const a=Math.PI*(.12+.76*i/10),x=100-Math.cos(a)*42,y=136+Math.sin(a)*16;return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="4.5" ry="3.2" fill="none" stroke="#ffcf3a" stroke-width="2.6" transform="rotate(${(i%2?40:-40)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`}).join(''),flat:1},
  medal:{n:'Медаль',need:30,svg:()=>`<path d="M86 132l14 22 14-22" fill="none" stroke="#2f8cff" stroke-width="6"/><circle cx="100" cy="160" r="10" fill="#ffd04a" stroke="#d19a12" stroke-width="3"/><path d="M100 154l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1z" fill="#fff"/>`,flat:1}
};
/* effects around the pet (big views only) */
const sparkle=(x,y,r,f)=>`<path d="M${x} ${y-r}l${r*.28} ${r*.72} ${r*.72} ${r*.28}-${r*.72} ${r*.28}-${r*.28} ${r*.72}-${r*.28}-${r*.72}-${r*.72}-${r*.28} ${r*.72}-${r*.28}z" fill="${f}"/>`;
const heart=(x,y,s,f)=>`<path transform="translate(${x} ${y}) scale(${s})" d="M0 8c-8-5-11-9-10-13 1-3 6-4 10 0 4-4 9-3 10 0 1 4-2 8-10 13z" fill="${f}"/>`;
const FX={
  none:{n:'Без эффекта'},
  sparkles:{n:'Искры',svg:c=>[[34,60,9],[170,84,7],[160,30,6],[28,140,6],[176,150,8]].map(([x,y,r],i)=>`<g style="animation-delay:${i*.35}s">${sparkle(x,y,r,c.flame[0])}</g>`).join('')},
  hearts:{n:'Сердечки',svg:()=>[[40,150,1],[160,140,.8],[30,90,.7],[170,96,1],[100,40,.6]].map(([x,y,s],i)=>`<g class="fly" style="animation-delay:${i*.5}s">${heart(x,y,s,i%2?'#ff5d9e':'#ff3b78')}</g>`).join('')},
  bubbles:{n:'Пузыри',svg:()=>[[34,150,8],[170,130,6],[44,90,5],[164,70,9],[150,170,4]].map(([x,y,r],i)=>`<g class="fly" style="animation-delay:${i*.6}s"><circle cx="${x}" cy="${y}" r="${r}" fill="rgba(180,225,255,.22)" stroke="rgba(255,255,255,.75)" stroke-width="1.6"/><circle cx="${x-r*.35}" cy="${y-r*.35}" r="${r*.25}" fill="#fff" opacity=".8"/></g>`).join('')},
  notes:{n:'Музыка',svg:c=>[[36,90],[166,70],[156,150]].map(([x,y],i)=>`<g class="fly" style="animation-delay:${i*.7}s"><path d="M${x} ${y}v-16l12-3v16" fill="none" stroke="${dk(c.body,.35)}" stroke-width="2.6"/><ellipse cx="${x-3}" cy="${y}" rx="4" ry="3" fill="${dk(c.body,.35)}"/><ellipse cx="${x+9}" cy="${y-3}" rx="4" ry="3" fill="${dk(c.body,.35)}"/></g>`).join('')},
  snow:{n:'Снег',need:7,svg:()=>Array.from({length:12},(_,i)=>`<g class="fall" style="animation-delay:${(i*.37%2.6).toFixed(2)}s;animation-duration:${(2.6+i%4*.5).toFixed(1)}s"><circle cx="${14+i*15.5}" cy="${(i*37)%60}" r="${1.6+i%3}" fill="#fff" opacity=".9"/></g>`).join('')},
  aura:{n:'Аура',need:14,back:1,svg:(c,id)=>`<circle cx="100" cy="114" r="94" fill="url(#${id}g)" class="pet-aura"/>`},
  rainbow:{n:'Радуга',need:30,back:1,svg:()=>['#ff5d6b','#ffb14a','#ffe066','#5fd6a5','#6fb6ff','#a487ff'].map((f,i)=>`<path d="M${14+i*6} 150a${86-i*6} ${86-i*6} 0 0 1 ${172-i*12} 0" fill="none" stroke="${f}" stroke-width="6" opacity=".55"/>`).join('')}
};

let uid=0;
/* the lighting of each material, around one base colour */
function material(st,c,id){
  const b=c.body,f=c.flame;
  const g=(stops,attrs)=>`<radialGradient id="${id}B" ${attrs||'cx=".34" cy=".26" r=".9" fx=".3" fy=".2"'}>${stops.map(([o,col,a])=>`<stop offset="${o}" stop-color="${col}"${a!=null?` stop-opacity="${a}"`:''}/>`).join('')}</radialGradient>`;
  switch(st){
    case 'clay':return {grad:g([[0,lt(b,.32)],[.5,b],[1,dk(b,.2)]]),spec:.28,dot:0,ao:.25};
    case 'plush':return {grad:g([[0,lt(b,.25)],[.6,b],[1,dk(b,.16)]]),spec:.18,dot:0,ao:.22,fuzz:1};
    case 'glass':return {grad:g([[0,lt(b,.7),.55],[.45,b,.5],[.85,dk(b,.1),.75],[1,dk(b,.3),.9]]),spec:.95,dot:1,ao:.12,glass:1};
    case 'toon':return {grad:g([[0,b],[1,b]]),spec:.55,dot:0,ao:0,toon:1};
    case 'neon':return {grad:g([[0,dk(b,.45)],[.7,dk(b,.7)],[1,dk(b,.82)]]),spec:.35,dot:1,ao:0,neon:f[1]};
    case 'metal':return {grad:`<linearGradient id="${id}B" x1="0" y1="0" x2=".25" y2="1"><stop offset="0" stop-color="${lt(b,.75)}"/><stop offset=".3" stop-color="${b}"/><stop offset=".48" stop-color="${dk(b,.4)}"/><stop offset=".56" stop-color="${lt(b,.35)}"/><stop offset=".8" stop-color="${b}"/><stop offset="1" stop-color="${dk(b,.35)}"/></linearGradient>`,spec:1,dot:1,ao:.3};
    default:return {grad:g([[0,lt(b,.6)],[.28,lt(b,.12)],[.62,b],[.9,dk(b,.22)],[1,dk(b,.34)]]),spec:.9,dot:1,ao:.35};
  }
}
/* o: {days|stage, color, style, hat, eyes, neck, fx, mood, mini} — mini: tiny badge, no effects */
function petSVG(o={}){
  const c=COLORS[o.color]||COLORS.ember,st=o.stage!=null?o.stage:stageOf(o.days||0),mood=o.mood||'happy',id='pt'+(++uid);
  const sty=STYLES[o.style]?o.style:'gloss',M=material(sty,c,id);
  const acc=(T,k,shine)=>{const it=T[k];if(!it||!it.svg)return '';const s=it.svg(c,id);
    return shine&&!it.flat&&sty!=='toon'&&!o.mini?`<g>${s}</g><clipPath id="${id}${shine}">${s}</clipPath><rect x="0" y="0" width="200" height="200" fill="url(#${id}s)" clip-path="url(#${id}${shine})"/>`:s};
  const fxIt=!o.mini&&FX[o.fx]&&FX[o.fx].svg?FX[o.fx]:null,fxs=fxIt?fxIt.svg(c,id):'';
  const back=fxIt&&fxIt.back?`<g class="pet-fx">${fxs}</g>`:'',front=fxIt&&!fxIt.back?`<g class="pet-fx">${fxs}</g>`:'';
  const defs=`<defs>${M.grad}
    <linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${lt(c.flame[0],.3)}"/><stop offset=".55" stop-color="${c.flame[0]}"/><stop offset="1" stop-color="${c.flame[1]}"/></linearGradient>
    <radialGradient id="${id}g" cx=".5" cy=".5" r=".5"><stop offset=".5" stop-color="${c.flame[0]}" stop-opacity=".55"/><stop offset="1" stop-color="${c.flame[0]}" stop-opacity="0"/></radialGradient>
    <radialGradient id="${id}sh" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".38"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <radialGradient id="${id}be" cx=".42" cy=".3" r=".8"><stop offset="0" stop-color="${lt(c.belly,.5)}"/><stop offset=".7" stop-color="${c.belly}"/><stop offset="1" stop-color="${dk(c.belly,.1)}"/></radialGradient>
    <radialGradient id="${id}ao" cx=".5" cy="1" r=".7"><stop offset="0" stop-color="${dk(c.body,.6)}" stop-opacity="${M.ao}"/><stop offset="1" stop-color="${dk(c.body,.6)}" stop-opacity="0"/></radialGradient>
    <radialGradient id="${id}rim" cx=".85" cy=".75" r=".55"><stop offset=".6" stop-color="${lt(c.flame[0],.4)}" stop-opacity="0"/><stop offset="1" stop-color="${lt(c.flame[0],.4)}" stop-opacity="${M.neon||M.toon?0:.55}"/></radialGradient>
    <linearGradient id="${id}sp" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="${M.spec}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <linearGradient id="${id}s" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".4"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></linearGradient>
    <radialGradient id="${id}e" cx=".4" cy=".3" r=".75"><stop offset="0" stop-color="${M.neon?lt(M.neon,.5):'#5a4a66'}"/><stop offset=".6" stop-color="${M.neon||'#241a2c'}"/><stop offset="1" stop-color="${M.neon?dk(M.neon,.4):'#0e0a12'}"/></radialGradient>
    <radialGradient id="${id}ck" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff6f92" stop-opacity=".6"/><stop offset="1" stop-color="#ff6f92" stop-opacity="0"/></radialGradient></defs>`;
  const ground=r=>`<ellipse cx="100" cy="186" rx="${r}" ry="8" fill="url(#${id}sh)"/>`;
  if(st===0){ /* an egg with the little flame already showing; it wobbles while waiting */
    const egg='M100 34c30 0 52 50 52 86 0 34-24 58-52 58s-52-24-52-58c0-36 22-86 52-86z';
    return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="pet-svg egg ${mood} s-${sty}">${defs}
      <radialGradient id="${id}eg" cx=".36" cy=".28" r=".85"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#fff3e2"/><stop offset="1" stop-color="${mix('#f2dcc0',c.body,.25)}"/></radialGradient>
      ${back}${ground(38)}
      <g class="pet-wob"><path d="${egg}" fill="url(#${id}eg)"/>
      <circle cx="80" cy="96" r="9" fill="${c.body}" opacity=".6"/><circle cx="122" cy="128" r="12" fill="${c.body}" opacity=".55"/><circle cx="92" cy="152" r="7" fill="${c.body}" opacity=".5"/>
      <path d="M56 116l14-8 12 10 14-10 14 10 12-8 18 8" fill="none" stroke="${dk(c.body,.1)}" stroke-width="3" stroke-linejoin="round" opacity=".75"/>
      <path d="${egg}" fill="url(#${id}ao)"/><path d="${egg}" fill="url(#${id}rim)"/>
      <ellipse cx="80" cy="70" rx="12" ry="20" transform="rotate(25 80 70)" fill="url(#${id}sp)"/><circle cx="72" cy="60" r="3.5" fill="#fff" opacity=".9"/>
      <g class="pet-flame"><path d="M100 10c6 10 16 14 14 26-1 8-7 12-14 12s-13-4-14-12c-1-9 8-14 14-26z" fill="url(#${id}f)"/><path d="M100 24c3 5 7 7 6 13 0 4-3 6-6 6s-6-2-6-6c0-4 4-7 6-13z" fill="#fff" opacity=".55"/></g></g>${front}</svg>`;
  }
  const s=st===1?.8:st===3?1.04:1,tx=100-100*s,ty=184-184*s;
  const body='M100 62c40 0 64 30 64 62 0 34-28 54-64 54s-64-20-64-54c0-32 24-62 64-62z';
  const eyeGlint=(x,y)=>`<circle cx="${x+3.5}" cy="${y-5}" r="3.6" fill="#fff"/><circle cx="${x-3}" cy="${y+4}" r="1.6" fill="#fff" opacity=".8"/>`;
  const eyesFace=mood==='sleep'
    ?`<path d="M70 110q10 8 20 0M110 110q10 8 20 0" stroke="#2a2230" stroke-width="5" fill="none" stroke-linecap="round"/>`
    :mood==='happy'
    ?`<path d="M70 112q10-14 20 0M110 112q10-14 20 0" stroke="${M.neon||'#2a2230'}" stroke-width="5.5" fill="none" stroke-linecap="round"/>`
    :`<ellipse cx="80" cy="106" rx="9.5" ry="12.5" fill="url(#${id}e)"/><ellipse cx="120" cy="106" rx="9.5" ry="12.5" fill="url(#${id}e)"/>${eyeGlint(80,106)}${eyeGlint(120,106)}`;
  const mouth=mood==='sleep'?`<ellipse cx="100" cy="130" rx="5" ry="4" fill="#7a3a4a"/>`:mood==='happy'?`<path d="M88 124q12 14 24 0z" fill="#7a3a4a"/><path d="M93 128q7 5 14 0" fill="#ff8a9e"/>`:`<path d="M92 126q8 7 16 0" stroke="#7a3a4a" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  const fl=st===1?'M100 46c5 8 12 11 11 20-1 6-5 9-11 9s-10-3-11-9c-1-7 6-11 11-20z':st===3?'M100 14c10 14 26 20 24 40-2 14-12 20-24 20s-22-6-24-20c-2-14 8-18 12-28 2 8 6 10 8 10-2-8 0-14 4-22z':'M100 28c8 12 20 17 18 32-1 10-9 15-18 15s-17-5-18-15c-2-12 10-17 18-32z';
  const core=st===1?'M100 58c2 4 5 6 5 10 0 3-2 5-5 5s-5-2-5-5c0-4 3-6 5-10z':st===3?'M100 36c5 8 11 12 10 22-1 7-5 10-10 10s-9-3-10-10c-1-9 5-14 10-22z':'M100 44c4 6 8 9 8 16 0 5-3 8-8 8s-8-3-8-8c0-6 4-10 8-16z';
  const outline=M.toon?` stroke="#2a2230" stroke-width="3.5"`:M.neon?` stroke="${M.neon}" stroke-width="3"`:'';
  const limb=(cx,cy,rx,ry,rot)=>`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"${rot!=null?` transform="rotate(${rot} ${cx} ${cy})"`:''} fill="url(#${id}B)"${outline}/>`;
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="pet-svg ${mood} st${st} s-${sty}">${defs}
    ${st===3&&!(o.fx==='aura')?`<circle cx="100" cy="112" r="96" fill="url(#${id}g)" class="pet-aura"/>`:''}${back}
    ${ground(46*s)}
    <g transform="translate(${tx} ${ty}) scale(${s})"><g class="pet-bob">
      <g class="pet-flame"><path d="${fl}" fill="url(#${id}f)"${M.toon?' stroke="#2a2230" stroke-width="3"':''}/><path d="${core}" fill="#fff" opacity=".6"/></g>
      ${limb(76,176,14,9)}${limb(124,176,14,9)}
      ${M.neon?`<path d="${body}" fill="none" stroke="${M.neon}" stroke-width="10" opacity=".28"/>`:''}
      <path d="${body}" fill="url(#${id}B)"${outline}/>
      ${M.fuzz?`<path d="${body}" fill="none" stroke="${c.body}" stroke-width="7" stroke-dasharray="1 6" stroke-linecap="round"/>`:''}
      <path d="${body}" fill="url(#${id}ao)"/><path d="${body}" fill="url(#${id}rim)"/>
      <ellipse cx="100" cy="148" rx="36" ry="26" fill="url(#${id}be)" opacity="${M.glass?.55:M.neon?.25:1}"/>
      ${limb(40,134,9,14,mood==='happy'?-30:15)}${limb(160,134,9,14,mood==='happy'?30:-15)}
      ${acc(NECK,o.neck,'n')}
      <g class="pet-look">${eyesFace}</g><ellipse cx="66" cy="124" rx="11" ry="7" fill="url(#${id}ck)"/><ellipse cx="134" cy="124" rx="11" ry="7" fill="url(#${id}ck)"/>${mouth}
      ${M.spec?`<ellipse cx="72" cy="84" rx="20" ry="11" transform="rotate(-32 72 84)" fill="url(#${id}sp)" class="pet-spec"/>`:''}${M.dot?`<circle cx="62" cy="96" r="3.2" fill="#fff" opacity="${Math.min(1,M.spec)}" class="pet-spec"/>`:''}
      ${M.glass?`<path d="M58 150q42 30 84 0" fill="none" stroke="#fff" stroke-width="3" opacity=".45" stroke-linecap="round"/>`:''}
      <g class="pet-look">${acc(EYES,o.eyes)}</g>${acc(HATS,o.hat,'h')}
      ${mood==='sleep'?`<text x="146" y="70" font-size="22" font-weight="800" fill="#9fb4d6" font-family="sans-serif">z</text><text x="160" y="52" font-size="16" font-weight="800" fill="#9fb4d6" font-family="sans-serif">z</text>`:''}
    </g></g>
    ${st===3&&!o.mini?`<path d="M30 60l3 7 7 3-7 3-3 7-3-7-7-3 7-3zM172 90l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="${c.flame[0]}" class="pet-spark"/>`:''}${front}</svg>`;
}
window.PET={COLORS,STYLES,HATS,EYES,NECK,FX,STAGES,stageOf,petSVG};
})();
