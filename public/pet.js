/* Manasenger — «Серийчик», the streak pet of a private chat.
   An original character: a round fluffy creature with a little flame on its head.
   It hatches from an egg when two people chat several days in a row, grows with the streak,
   shows a mood (happy / waiting / sleepy) and can be dressed up: colour, hat, glasses, neckwear.
   Drawn as vector (SVG); the same drawing is in the Figma design file. */
'use strict';
(function(){
const COLORS={
  ember:{n:'Огонёк',body:'#ff9d4d',belly:'#ffd8a8',flame:['#ffe066','#ff6b3d']},
  rose:{n:'Роза',body:'#ff8fb3',belly:'#ffd6e4',flame:['#fff0a0','#ff4f8b']},
  sky:{n:'Небо',body:'#6fb6ff',belly:'#d3ebff',flame:['#c8f3ff','#3d8bff']},
  mint:{n:'Мята',body:'#5fd6a5',belly:'#d0f6e6',flame:['#f1ffb0','#22b07a']},
  grape:{n:'Виноград',body:'#a487ff',belly:'#e4dbff',flame:['#ffd6ff','#7b5cff']},
  gold:{n:'Золото',body:'#ffc94a',belly:'#fff0c0',flame:['#fffbe0','#ff9a1a'],need:30},
  night:{n:'Ночь',body:'#3f4a6b',belly:'#8e9bc0',flame:['#a6f0ff','#5b6bff'],need:14}
};
/* stage by streak days: egg → baby → kid → legend */
const STAGES=[{from:0,n:'Яйцо'},{from:3,n:'Малыш'},{from:7,n:'Подросток'},{from:30,n:'Легенда'}];
const stageOf=d=>d>=30?3:d>=7?2:d>=3?1:0;
const HATS={
  none:{n:'Без шапки'},
  cap:{n:'Кепка',svg:()=>`<path d="M58 70c4-26 80-26 84 0z" fill="#ff4f6b"/><path d="M60 70h78c0 5-4 7-10 7H70c-6 0-10-2-10-7z" fill="#e23b55"/><path d="M128 70c14 0 28 3 30 9H124z" fill="#c9213d"/><circle cx="100" cy="48" r="4" fill="#ffd0d8"/>`},
  beanie:{n:'Шапка',svg:()=>`<path d="M60 74c0-34 80-34 80 0z" fill="#5b8fd0"/><rect x="56" y="68" width="88" height="14" rx="7" fill="#e9eef7"/><path d="M68 56h64M66 64h68" stroke="#4573ae" stroke-width="3" stroke-dasharray="4 5"/><circle cx="100" cy="38" r="10" fill="#e9eef7"/>`},
  bow:{n:'Бантик',svg:()=>`<path d="M100 60l-24-14c-6-3-10 2-8 8l4 14c2 6 8 6 12 3z" fill="#ff5d9e"/><path d="M100 60l24-14c6-3 10 2 8 8l-4 14c-2 6-8 6-12 3z" fill="#ff5d9e"/><circle cx="100" cy="62" r="7" fill="#e03a80"/>`},
  flower:{n:'Цветок',svg:()=>[0,72,144,216,288].map(a=>`<ellipse cx="128" cy="58" rx="7" ry="11" fill="#fff" transform="rotate(${a} 128 64) translate(0 -2)"/>`).join('')+`<circle cx="128" cy="64" r="6" fill="#ffc94a"/>`},
  headphones:{n:'Наушники',need:7,svg:()=>`<path d="M52 104c-4-48 100-48 96 0" fill="none" stroke="#2f3646" stroke-width="7"/><rect x="40" y="96" width="18" height="30" rx="8" fill="#ff5d6b"/><rect x="142" y="96" width="18" height="30" rx="8" fill="#ff5d6b"/>`},
  witch:{n:'Шляпа ведьмы',need:7,svg:()=>`<path d="M100 8l-26 62h52z" fill="#5a3d9a"/><path d="M100 8c10 10 22 14 34 12l-8 18z" fill="#5a3d9a"/><ellipse cx="100" cy="72" rx="52" ry="9" fill="#46307c"/><rect x="76" y="58" width="48" height="8" fill="#ffc94a"/>`},
  tophat:{n:'Цилиндр',need:14,svg:()=>`<rect x="72" y="22" width="56" height="46" rx="4" fill="#1d2230"/><rect x="72" y="54" width="56" height="8" fill="#e23b55"/><ellipse cx="100" cy="70" rx="44" ry="8" fill="#1d2230"/>`},
  crown:{n:'Корона',need:30,svg:()=>`<path d="M66 72V40l17 16 17-26 17 26 17-16v32z" fill="#ffd04a" stroke="#d19a12" stroke-width="3" stroke-linejoin="round"/><circle cx="100" cy="58" r="5" fill="#2f8cff"/><circle cx="80" cy="64" r="4" fill="#e23b5a"/><circle cx="120" cy="64" r="4" fill="#2bd47d"/>`}
};
const EYES={
  none:{n:'Без очков'},
  round:{n:'Круглые',svg:()=>`<circle cx="80" cy="108" r="16" fill="rgba(255,255,255,.18)" stroke="#2f3646" stroke-width="4"/><circle cx="120" cy="108" r="16" fill="rgba(255,255,255,.18)" stroke="#2f3646" stroke-width="4"/><path d="M96 106q4-4 8 0" stroke="#2f3646" stroke-width="4" fill="none"/>`},
  sun:{n:'Солнечные',svg:()=>`<path d="M60 98h80v8c0 14-8 20-18 20-8 0-14-6-16-14h-12c-2 8-8 14-16 14-10 0-18-6-18-20z" fill="#14161d"/><path d="M68 102l10 8M110 102l10 8" stroke="#fff" stroke-width="3" opacity=".5"/>`},
  hearts:{n:'Сердечки',svg:()=>[80,120].map(x=>`<path d="M${x} 122c-14-9-20-16-18-23 2-6 10-8 18 0 8-8 16-6 18 0 2 7-4 14-18 23z" fill="#ff3b78" stroke="#c4004c" stroke-width="2"/>`).join('')+`<path d="M96 104q4-4 8 0" stroke="#c4004c" stroke-width="3" fill="none"/>`},
  star:{n:'Звёзды',need:7,svg:()=>[80,120].map(x=>`<path d="M${x} 92l5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2z" fill="#ffd04a" stroke="#e09a12" stroke-width="2"/>`).join('')}
};
const NECK={
  none:{n:'Ничего'},
  scarf:{n:'Шарф',svg:()=>`<path d="M58 140c26 12 58 12 84 0v12c-26 12-58 12-84 0z" fill="#e23b55"/><path d="M122 148l8 26h-14l-6-24z" fill="#c9213d"/><path d="M66 146v8M78 149v8M90 151v8" stroke="#ffb3c0" stroke-width="3"/>`},
  bowtie:{n:'Бабочка',svg:()=>`<path d="M100 146l-18-10v20zM100 146l18-10v20z" fill="#2f3646"/><circle cx="100" cy="146" r="5" fill="#1d2230"/>`},
  beads:{n:'Бусы',svg:()=>Array.from({length:9},(_,i)=>{const a=Math.PI*(.15+.7*i/8),x=100-Math.cos(a)*40,y=136+Math.sin(a)*14;return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5" fill="${['#ff5d9e','#ffd04a','#5bd1ff'][i%3]}"/>`}).join('')},
  bandana:{n:'Бандана',need:7,svg:()=>`<path d="M60 138c24 8 56 8 80 0l-40 30z" fill="#2f8cff"/><circle cx="84" cy="146" r="2" fill="#fff"/><circle cx="100" cy="152" r="2" fill="#fff"/><circle cx="116" cy="146" r="2" fill="#fff"/>`},
  medal:{n:'Медаль',need:30,svg:()=>`<path d="M86 132l14 22 14-22" fill="none" stroke="#2f8cff" stroke-width="6"/><circle cx="100" cy="160" r="10" fill="#ffd04a" stroke="#d19a12" stroke-width="3"/><path d="M100 154l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1z" fill="#fff"/>`}
};
let uid=0;
/* mood: 'happy' both wrote today, 'wait' one wrote, 'sleep' nobody yet today */
function petSVG(o={}){
  const c=COLORS[o.color]||COLORS.ember,st=o.stage!=null?o.stage:stageOf(o.days||0),mood=o.mood||'happy',id='pt'+(++uid);
  const hat=HATS[o.hat]&&HATS[o.hat].svg?HATS[o.hat].svg():'',eye=EYES[o.eyes]&&EYES[o.eyes].svg?EYES[o.eyes].svg():'',neck=NECK[o.neck]&&NECK[o.neck].svg?NECK[o.neck].svg():'';
  const defs=`<defs><radialGradient id="${id}b" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".45" stop-color="${c.body}" stop-opacity="0"/></radialGradient>
    <linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.flame[0]}"/><stop offset="1" stop-color="${c.flame[1]}"/></linearGradient>
    <radialGradient id="${id}g" cx=".5" cy=".5" r=".5"><stop offset=".55" stop-color="${c.flame[0]}" stop-opacity=".55"/><stop offset="1" stop-color="${c.flame[0]}" stop-opacity="0"/></radialGradient></defs>`;
  if(st===0){ /* an egg with the little flame already showing; it wobbles while waiting */
    return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="pet-svg egg ${mood}">${defs}
      <ellipse cx="100" cy="182" rx="40" ry="7" fill="rgba(0,0,0,.18)"/>
      <g class="pet-wob"><path d="M100 34c30 0 52 50 52 86 0 34-24 58-52 58s-52-24-52-58c0-36 22-86 52-86z" fill="#fff6ea" stroke="${c.body}" stroke-width="4"/>
      <circle cx="80" cy="96" r="9" fill="${c.body}" opacity=".55"/><circle cx="122" cy="128" r="12" fill="${c.body}" opacity=".5"/><circle cx="92" cy="150" r="7" fill="${c.body}" opacity=".45"/>
      <path d="M58 116l14-8 12 10 14-10 14 10 12-8 16 8" fill="none" stroke="${c.body}" stroke-width="3" stroke-linejoin="round" opacity=".8"/>
      <path class="pet-flame" d="M100 10c6 10 16 14 14 26-1 8-7 12-14 12s-13-4-14-12c-1-9 8-14 14-26z" fill="url(#${id}f)"/></g></svg>`;
  }
  const s=st===1?.8:st===3?1.04:1,tx=100-100*s,ty=184-184*s;
  const eyesFace=mood==='sleep'
    ?`<path d="M70 110q10 8 20 0M110 110q10 8 20 0" stroke="#2a2230" stroke-width="5" fill="none" stroke-linecap="round"/>`
    :mood==='happy'
    ?`<path d="M70 112q10-14 20 0M110 112q10-14 20 0" stroke="#2a2230" stroke-width="5.5" fill="none" stroke-linecap="round"/>`
    :`<ellipse cx="80" cy="106" rx="9" ry="12" fill="#2a2230"/><ellipse cx="120" cy="106" rx="9" ry="12" fill="#2a2230"/><circle cx="${mood==='wait'?84:83}" cy="101" r="3.5" fill="#fff"/><circle cx="${mood==='wait'?124:123}" cy="101" r="3.5" fill="#fff"/>`;
  const mouth=mood==='sleep'?`<ellipse cx="100" cy="130" rx="5" ry="4" fill="#7a3a4a"/>`:mood==='happy'?`<path d="M88 124q12 14 24 0z" fill="#7a3a4a"/><path d="M93 128q7 5 14 0" fill="#ff8a9e"/>`:`<path d="M92 126q8 7 16 0" stroke="#7a3a4a" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  const fl=st===1?'M100 46c5 8 12 11 11 20-1 6-5 9-11 9s-10-3-11-9c-1-7 6-11 11-20z':st===3?'M100 14c10 14 26 20 24 40-2 14-12 20-24 20s-22-6-24-20c-2-14 8-18 12-28 2 8 6 10 8 10-2-8 0-14 4-22z':'M100 28c8 12 20 17 18 32-1 10-9 15-18 15s-17-5-18-15c-2-12 10-17 18-32z';
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="pet-svg ${mood} st${st}">${defs}
    ${st===3?`<circle cx="100" cy="112" r="96" fill="url(#${id}g)" class="pet-aura"/>`:''}
    <ellipse cx="100" cy="186" rx="${46*s}" ry="7" fill="rgba(0,0,0,.18)"/>
    <g transform="translate(${tx} ${ty}) scale(${s})"><g class="pet-bob">
      <path class="pet-flame" d="${fl}" fill="url(#${id}f)"/>
      <ellipse cx="76" cy="176" rx="14" ry="9" fill="${c.body}"/><ellipse cx="124" cy="176" rx="14" ry="9" fill="${c.body}"/>
      <path d="M100 62c40 0 64 30 64 62 0 34-28 54-64 54s-64-20-64-54c0-32 24-62 64-62z" fill="${c.body}"/>
      <path d="M100 62c40 0 64 30 64 62 0 34-28 54-64 54s-64-20-64-54c0-32 24-62 64-62z" fill="url(#${id}b)"/>
      <ellipse cx="100" cy="148" rx="36" ry="26" fill="${c.belly}"/>
      <ellipse cx="40" cy="134" rx="9" ry="14" fill="${c.body}" transform="rotate(${mood==='happy'?-30:15} 40 134)"/><ellipse cx="160" cy="134" rx="9" ry="14" fill="${c.body}" transform="rotate(${mood==='happy'?30:-15} 160 134)"/>
      ${neck}
      ${eyesFace}<ellipse cx="66" cy="124" rx="9" ry="6" fill="#ff7a9a" opacity=".55"/><ellipse cx="134" cy="124" rx="9" ry="6" fill="#ff7a9a" opacity=".55"/>${mouth}
      ${eye}${hat}
      ${mood==='sleep'?`<text x="146" y="70" font-size="22" font-weight="800" fill="#9fb4d6" font-family="sans-serif">z</text><text x="160" y="52" font-size="16" font-weight="800" fill="#9fb4d6" font-family="sans-serif">z</text>`:''}
    </g></g>
    ${st===3?`<path d="M30 60l3 7 7 3-7 3-3 7-3-7-7-3 7-3zM172 90l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="${c.flame[0]}" class="pet-spark"/>`:''}</svg>`;
}
window.PET={COLORS,HATS,EYES,NECK,STAGES,stageOf,petSVG};
})();
