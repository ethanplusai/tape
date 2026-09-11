import {TapeCore} from './core.mjs';
export function wav(samples,sampleRate){const data=new ArrayBuffer(44+samples.length*2),v=new DataView(data);const text=(at,s)=>{for(let n=0;n<s.length;n++)v.setUint8(at+n,s.charCodeAt(n));};text(0,'RIFF');v.setUint32(4,data.byteLength-8,true);text(8,'WAVEfmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,sampleRate,true);v.setUint32(28,sampleRate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);text(36,'data');v.setUint32(40,samples.length*2,true);for(let n=0;n<samples.length;n++){const s=Math.max(-1,Math.min(1,samples[n]));v.setInt16(44+n*2,s*(s<0?32768:32767),true);}return data;}
export function renderMix(state){const core=new TapeCore(state.sampleRate);core.bpm=state.bpm;core.master=state.master;state.tracks.forEach((t,i)=>Object.assign(core.tracks[i],t,{gain:t.muted?0:t.level}));const beats=Math.max(...state.tracks.filter(t=>t.samples).map(t=>t.beats),0)||4;const result=new Float32Array(Math.round(beats*60/state.bpm*state.sampleRate));core.playing=true;core.process(null,result);return result;}
// Original synthesized demo. No network samples, copyrighted recordings, or mic access.
export function demoLoops(sampleRate,bpm=96){
 const beats=8,len=Math.round(beats*60/bpm*sampleRate),loops=Array.from({length:4},()=>new Float32Array(len));let seed=198703;
 const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1;};
 for(let n=0;n<len;n++){const time=n/sampleRate,beat=time*bpm/60,q=beat%1,half=beat%.5;const kickTime=q*60/bpm,snareTime=(beat%2-1)*60/bpm;
  let drums=.6*Math.sin(2*Math.PI*(48*kickTime+7*(1-Math.exp(-kickTime*35))))*Math.exp(-kickTime*18);if(snareTime>=0)drums+=noise()*.25*Math.exp(-snareTime*23);drums+=noise()*.075*Math.exp(-half*60/bpm*85);loops[0][n]=drums;
  const note=[55,55,65.406,73.416][Math.floor(beat/2)%4],envelope=Math.min(1,q*20)*Math.exp(-q*3);loops[1][n]=.23*(Math.sin(2*Math.PI*note*time)+.25*Math.sin(4*Math.PI*note*time))*envelope;
  const chord=(Math.sin(2*Math.PI*220*time)+Math.sin(2*Math.PI*261.626*time)+Math.sin(2*Math.PI*329.628*time))/3;loops[2][n]=chord*.2*Math.min(1,beat*3,(8-beat)*3);
  const freq=[440,523.251,659.255,783.991][Math.floor(beat)%4],t=q*60/bpm;loops[3][n]=.15*Math.sin(2*Math.PI*freq*t)*Math.exp(-t*7)*Math.min(1,t*400);
 }
 return loops;
}
