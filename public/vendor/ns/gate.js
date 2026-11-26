/* Manasenger voice gate: lets the sound through only while you are speaking.
   Quiet sounds below the threshold (far-away voices, TV, keyboard, the room) are cut to silence.
   Opens in ~3 ms (no first syllable lost: a 30 ms look-back), closes softly after a short hold so words are not chopped. */
class VoiceGate extends AudioWorkletProcessor{
  constructor(o){super();const p=(o&&o.processorOptions)||{};
    this.th=p.th!=null?p.th:-45;this.on=p.on!==false;this.hold=p.hold||220;this.g=0;this.left=0;this.lvl=-100;this.n=0;
    const la=Math.round(sampleRate*.03);this.la=la;this.ring=new Float32Array(la);this.ri=0;
    this.aA=1-Math.exp(-1/(.003*sampleRate));this.aR=1-Math.exp(-1/(.09*sampleRate));
    this.port.onmessage=e=>{const d=e.data||{};if(d.th!=null)this.th=d.th;if(d.on!=null)this.on=d.on}}
  process(ins,outs){
    const i=ins[0],o=outs[0];if(!o||!o[0])return true;
    if(!i||!i[0]){for(const c of o)c.fill(0);return true}
    const x=i[0],n=x.length;let s=0;for(let k=0;k<n;k++)s+=x[k]*x[k];
    const db=10*Math.log10(s/n+1e-12);
    if(++this.n%8===0){this.port.postMessage({lvl:db,open:this.left>0||!this.on})}
    if(db>this.th)this.left=Math.ceil(this.hold/1000*sampleRate/n);else if(this.left>0)this.left--;
    const tgt=!this.on||this.left>0?1:0,out=o[0],R=this.ring,L=this.la;let g=this.g,ri=this.ri;
    for(let k=0;k<n;k++){const d=R[ri];R[ri]=x[k];ri=ri+1===L?0:ri+1;g+=(tgt-g)*(tgt>g?this.aA:this.aR);out[k]=d*g}
    this.g=g;this.ri=ri;for(let c=1;c<o.length;c++)o[c].set(out);
    return true;
  }
}
registerProcessor('mn-voice-gate',VoiceGate);
