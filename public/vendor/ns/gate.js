/* Manasenger voice gate v2: lets the sound through only while YOU are speaking.
   - Learns how loud YOUR voice is at the microphone. A TV or people a metre away reach the microphone
     10–20 dB quieter (sound fades with distance), so anything clearly quieter than your voice is cut —
     even speech from the TV. Steady noise (fans, street) is followed as a background floor too.
   - A downward expander, not a hard switch: sound just above the floor is turned down a lot, your voice passes fully.
   - Opens in ~3 ms with a 30 ms look-back (no first syllable lost), closes softly after a short hold. */
class VoiceGate extends AudioWorkletProcessor{
  constructor(o){super();const p=(o&&o.processorOptions)||{};
    this.th=p.th!=null?p.th:-50;this.on=p.on!==false;this.adapt=p.adapt!==false;this.margin=p.margin!=null?p.margin:12;
    this.hold=p.hold||200;this.g=0;this.left=0;this.n=0;this.floor=-70;this.fast=-100;this.voice=p.voice!=null&&p.voice>-45&&p.voice<-5?p.voice:-28;this.base=this.voice;
    const la=Math.round(sampleRate*.03);this.la=la;this.ring=new Float32Array(la);this.ri=0;
    this.aA=1-Math.exp(-1/(.003*sampleRate));this.aR=1-Math.exp(-1/(.08*sampleRate));
    this.port.onmessage=e=>{const d=e.data||{};for(const k of ['th','on','adapt','margin'])if(d[k]!=null)this[k]=d[k]}}
  process(ins,outs){
    const i=ins[0],o=outs[0];if(!o||!o[0])return true;
    if(!i||!i[0]){for(const c of o)c.fill(0);return true}
    const x=i[0],n=x.length,bt=n/sampleRate;let s=0;for(let k=0;k<n;k++)s+=x[k]*x[k];
    const db=10*Math.log10(s/n+1e-12);
    /* short envelope (~15 ms) for decisions */
    this.fast+=(db-this.fast)*(1-Math.exp(-bt/.015));
    /* 1) background floor (fans, street, steady hum): follows quiet moments quickly, rises slowly */
    if(this.fast<this.floor)this.floor+=(this.fast-this.floor)*(1-Math.exp(-bt/.25));
    else this.floor+=(Math.min(this.fast,this.floor+10)-this.floor)*(1-Math.exp(-bt/(this.left>0?8:2.5)));
    if(this.floor<-90)this.floor=-90;
    /* 2) YOUR voice level: you speak right into the microphone, a TV or people a metre away arrive
       many times quieter. The level of your words is learned (only from sounds close to it, so the TV can't
       teach it), and everything clearly quieter than your voice is cut — even other voices */
    if(this.fast>this.voice-6&&this.fast>this.th+6){this.voice+=(this.fast-this.voice)*(1-Math.exp(-bt/(this.fast>this.voice?.4:6)))}
    else this.voice+=(this.base-this.voice)*(1-Math.exp(-bt/120)); /* long silence: slowly back to a normal speaking level */
    const need=Math.max(this.th,this.floor+8,this.adapt?this.voice-this.margin:-200);
    if(this.fast>need)this.left=Math.ceil(this.hold/1000/bt);else if(this.left>0)this.left--;
    /* expander: just below the line → turned down strongly; far below → silence */
    let tgt;if(!this.on||this.left>0)tgt=1;else{const under=need-this.fast;tgt=under<6?Math.pow(10,-(12+under*4)/20):0}
    if(++this.n%8===0)this.port.postMessage({lvl:this.fast,open:!this.on||this.left>0,floor:this.floor,cut:need,voice:this.voice});
    const out=o[0],R=this.ring,L=this.la;let g=this.g,ri=this.ri;
    for(let k=0;k<n;k++){const d=R[ri];R[ri]=x[k];ri=ri+1===L?0:ri+1;g+=(tgt-g)*(tgt>g?this.aA:this.aR);out[k]=d*g}
    this.g=g;this.ri=ri;for(let c=1;c<o.length;c++)o[c].set(out);
    return true;
  }
}
registerProcessor('mn-voice-gate',VoiceGate);
