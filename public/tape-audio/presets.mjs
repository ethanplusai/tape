// Original deterministic synthesis, distributed with the source. No licensed samples or network audio.
export const presets=[{id:'dust',label:'DUST',description:'Soft kick, dry snare, swung hats'},{id:'pulse',label:'PULSE',description:'Four-on-the-floor rhythm'},{id:'half',label:'HALF',description:'Spacious half-time beat'},{id:'warm',label:'WARM',description:'A gentle four-note pulse'}];
export function presetLoop(id,sampleRate,bpm=96){
 if(!presets.some(p=>p.id===id))throw Error('Unknown base sound');
 const beats=8,length=Math.round(beats*60/bpm*sampleRate),out=new Float32Array(length);let seed=19373;const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1;};
 function hit(beat,type,level=1){const at=Math.round(beat*60/bpm*sampleRate),duration=type==='hat'?.085:type==='snare'?.17:.45;for(let n=0;n<duration*sampleRate&&at+n<length;n++){const t=n/sampleRate;let value;if(type==='kick')value=Math.sin(2*Math.PI*(47*t+5*(1-Math.exp(-35*t))))*Math.exp(-t*17)*.6;else if(type==='snare')value=(noise()*.33+Math.sin(2*Math.PI*180*t)*.11)*Math.exp(-t*24);else value=noise()*.11*Math.exp(-t*75);out[at+n]+=value*level;}}
 if(id==='warm'){const notes=[110,130.8128,164.8138,146.8324];for(let n=0;n<length;n++){const beat=n/sampleRate*bpm/60,q=beat%2,t=q*60/bpm,f=notes[Math.floor(beat/2)%4];out[n]=(Math.sin(2*Math.PI*f*t)+Math.sin(2*Math.PI*f*2*t)*.18)*.2*Math.min(1,t*90)*Math.exp(-t*2.3);}}
 else{for(let beat=0;beat<8;beat++){if(id==='pulse'||(id==='half'?beat%4===0:beat%2===0))hit(beat,'kick',1);if(id==='half'?beat%4===2:beat%2===1)hit(beat,'snare',id==='dust'?.8:1);hit(beat,'hat',.6);hit(beat+(id==='dust'?.58:.5),'hat',id==='pulse'?1:.5);}if(id==='dust'){hit(3.5,'kick',.5);hit(6.75,'kick',.6);}if(id==='half')hit(5.5,'kick',.6);}
 const ramp=Math.round(sampleRate*.003);for(let i=0;i<length;i++)out[i]=Math.tanh(out[i])*Math.min(1,i/ramp,(length-1-i)/ramp);return {samples:out,beats,source:id};
}
