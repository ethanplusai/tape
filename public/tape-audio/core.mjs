// Shared sample-clock looper. Used unchanged by the AudioWorklet and PCM tests.
export const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export const mod=(n,m)=>((n%m)+m)%m;
export function read(samples,position){
 const p=mod(position,samples.length),i=Math.floor(p),f=p-i;
 return samples[i]+(samples[(i+1)%samples.length]-samples[i])*f;
}
const emptyTrack=()=>({samples:null,source:null,beats:8,level:.75,gain:0,muted:false,reverse:false,filter:0,low:0,history:[],future:[],takes:0,scrub:null,release:null});
export class TapeCore{
 constructor(sampleRate=48000,onEvent=()=>{}){this.sampleRate=sampleRate;this.onEvent=onEvent;this.tracks=Array.from({length:4},emptyTrack);this.bpm=96;this.beat=0;this.playing=false;this.master=.7;this.inputGain=1;this.click=false;this.recording=null;this.smooth=1-Math.exp(-1/(sampleRate*.006));this.inputRms=0;this.outputRms=0;this.peak=0;}
 remember(t){t.future=[];t.history.push({samples:t.samples,source:t.source,beats:t.beats,takes:t.takes});if(t.history.length>3)t.history.shift();}
 load(index,samples,beats=8,source='custom'){const t=this.tracks[index];this.remember(t);t.samples=samples;t.source=source;t.beats=beats;t.takes=1;t.low=0;}
 undo(index){if(this.recording)return;const t=this.tracks[index],old=t.history.pop();if(old){t.future.push({samples:t.samples,source:t.source,beats:t.beats,takes:t.takes});Object.assign(t,old,{low:0,scrub:null,release:null});}}
 redo(index){if(this.recording)return;const t=this.tracks[index],next=t.future.pop();if(next){t.history.push({samples:t.samples,source:t.source,beats:t.beats,takes:t.takes});Object.assign(t,next,{low:0,scrub:null,release:null});}}
 clear(index){if(this.recording)return;const t=this.tracks[index];if(t.samples){this.remember(t);Object.assign(t,{samples:null,source:null,takes:0,low:0,scrub:null,release:null});}}
 startRecord(index,beats=8,countIn=false){
  if(this.recording)return;
  const t=this.tracks[index],reference=this.tracks.find(t=>t.samples);beats=t.samples?t.beats:beats===0&&reference?reference.beats:beats;
  const free=beats===0;
  const hasAudio=this.tracks.some(t=>t.samples);
  if(!hasAudio)this.beat=countIn?-4:0;
  let start=hasAudio?Math.ceil((this.beat+1e-6)/beats)*beats:0;
  if(countIn&&hasAudio)start=Math.ceil(Math.max(start,this.beat+4)/beats)*beats;
  t.reverse=false;
  // Take boundaries and buffer lengths live in this sample clock, never a UI timer.
  const frames=free?this.sampleRate*60:Math.round(beats*60/this.bpm*this.sampleRate);
  this.recording={index,beats,start,frames,at:0,samples:new Float32Array(frames),phase:'armed',countIn,free};
  this.playing=true;this.onEvent({type:'armed',index});
 }
 finishRecord(cancel=false){
  const r=this.recording;if(!r)return;this.recording=null;
  if(cancel||!r.at){this.onEvent({type:'record-end',cancelled:true,index:r.index});return;}
  const t=this.tracks[r.index];this.remember(t);
  if(r.free){r.samples=r.samples.slice(0,r.at);r.beats=r.at/this.sampleRate*this.bpm/60;}
  // Early finish keeps the chosen bar length; uncaptured tail is silence.
  if(t.samples){for(let n=0;n<r.samples.length;n++)r.samples[n]=clamp(r.samples[n]+read(t.samples,n*t.samples.length/r.samples.length),-1,1);}
  t.samples=r.samples;t.source='custom';t.beats=r.beats;t.takes++;t.low=0;
  this.onEvent({type:'record-end',cancelled:false,index:r.index});
 }
 beginScrub(index){if(this.recording)return;const t=this.tracks[index];if(!t.samples)return;const p=this.beat*(t.reverse?-1:1);t.scrub={position:p,target:p,rate:0};t.release=null;}
 moveScrub(index,deltaBeats){const s=this.tracks[index].scrub;if(s)s.target+=deltaBeats;}
 endScrub(index){const t=this.tracks[index];if(t.scrub)t.release={position:t.scrub.position,left:Math.round(this.sampleRate*.012),total:Math.round(this.sampleRate*.012)};t.scrub=null;}
 command(m){
  const t=this.tracks[m.index];
  switch(m.type){
   case 'play':if(!m.value&&this.recording)this.finishRecord();this.playing=!!m.value;break;
   case 'tempo':if(!this.recording)this.bpm=clamp(m.value,40,240);break;
   case 'level':if(t)t.level=clamp(m.value,0,1);break;
   case 'mute':if(t)t.muted=!!m.value;break;
   case 'reverse':if(t&&!this.recording)t.reverse=!!m.value;break;
   case 'filter':if(t)t.filter=clamp(m.value,0,1);break;
   case 'master':this.master=clamp(m.value,0,1);break;
   case 'input':this.inputGain=clamp(m.value,0,2);break;
   case 'click':this.click=!!m.value;break;
   case 'rewind':if(!this.recording)this.beat=0;break;
   case 'load':if(!this.recording)this.load(m.index,m.samples,m.beats,m.source);break;
   case 'record':this.startRecord(m.index,m.beats,m.countIn);break;
   case 'finish':this.finishRecord(m.cancel);break;
   case 'undo':this.undo(m.index);break;
   case 'redo':this.redo(m.index);break;
   case 'clear':this.clear(m.index);break;
   case 'new':if(!this.recording){this.tracks=Array.from({length:4},emptyTrack);this.beat=0;this.playing=false;}break;
   case 'restore':if(!this.recording){this.tracks=m.state.tracks.map(t=>Object.assign(emptyTrack(),t,{takes:t.samples?1:0}));this.bpm=m.state.bpm;this.master=m.state.master;this.playing=false;this.beat=0;}break;
   case 'scrub-start':this.beginScrub(m.index);break;
   case 'scrub-move':this.moveScrub(m.index,m.delta);break;
   case 'scrub-end':this.endScrub(m.index);break;
  }
 }
 sampleTrack(t,beat){
  const p=mod(beat,t.beats)/t.beats*t.samples.length;
  // A short de-click window keeps unedited microphone takes from snapping at seams.
  const edge=Math.min(1,p/(this.sampleRate*.003),(t.samples.length-p)/(this.sampleRate*.003));
  return read(t.samples,p)*Math.max(0,edge);
 }
 process(input,output){
  let inputEnergy=0,outputEnergy=0,peak=0;const step=this.bpm/60/this.sampleRate;
  // Filter coefficients are stable across this render quantum.
  const coefficients=this.tracks.map(t=>1-Math.exp(-2*Math.PI*(180*Math.pow(20000/180,1-t.filter))/this.sampleRate));
  for(let n=0;n<output.length;n++){
   const raw=Number.isFinite(input?.[n])?input[n]:0,x=clamp(raw*this.inputGain,-1,1);inputEnergy+=x*x;
   const r=this.recording;
   if(r&&this.beat+step*.5>=r.start){
    if(r.phase==='armed'){r.phase='recording';this.onEvent({type:'recording',index:r.index});}
    r.samples[r.at++]=x;if(r.at===r.frames)this.finishRecord();
   }
   let mix=0;
   for(let i=0;i<4;i++){
    const t=this.tracks[i],s=t.scrub;t.gain+=((t.muted?0:t.level)-t.gain)*this.smooth;
    if(!t.samples)continue;
    let signal=0;
    if(s){
     const target=clamp((s.target-s.position)*45,-step*this.sampleRate*8,step*this.sampleRate*8)/this.sampleRate;
     s.rate+=(target-s.rate)*this.smooth;s.position+=s.rate;
     signal=this.sampleTrack(t,s.position)*Math.min(1,Math.abs(s.rate)/step*2);
    }else if(this.playing){signal=this.sampleTrack(t,this.beat*(t.reverse?-1:1));}
    if(t.release){const f=t.release.left/t.release.total;signal=signal*(1-f)+this.sampleTrack(t,t.release.position)*f;if(--t.release.left<=0)t.release=null;}
    t.low+=coefficients[i]*(signal-t.low);signal=t.filter>0?t.low:signal;
    mix+=signal*t.gain;
   }
   if(this.playing&&(this.click||(this.recording?.countIn&&this.recording.phase==='armed'))){const sec=mod(this.beat,1)*60/this.bpm;if(sec<.032)mix+=Math.sin(sec*Math.PI*2*(Math.floor(this.beat)%4===0?1500:1000))*.17*Math.exp(-sec*140);}
   // Soft limiting; no hard clipping if several layers sum past full scale.
   const y=Math.tanh(mix*this.master);output[n]=y;outputEnergy+=y*y;peak=Math.max(peak,Math.abs(y));
   if(this.playing)this.beat+=step;
  }
  this.inputRms=Math.sqrt(inputEnergy/output.length);this.outputRms=Math.sqrt(outputEnergy/output.length);this.peak=peak;
 }
 snapshot(){return {bpm:this.bpm,beat:this.beat,playing:this.playing,inputRms:this.inputRms,outputRms:this.outputRms,peak:this.peak,recording:this.recording?{index:this.recording.index,phase:this.recording.phase,progress:this.recording.at/this.recording.frames,seconds:this.recording.at/this.sampleRate,free:this.recording.free,remaining:Math.max(0,this.recording.start-this.beat)}:null,tracks:this.tracks.map(t=>({hasAudio:!!t.samples,source:t.source,frames:t.samples?.length||0,beats:t.beats,level:t.level,muted:t.muted,reverse:t.reverse,filter:t.filter,takes:t.takes,canUndo:!!t.history.length,canRedo:!!t.future.length,scrubbing:!!t.scrub,scrubRate:t.scrub?.rate/this.bpm*60*this.sampleRate||0}))};}
 exportState(){return {sampleRate:this.sampleRate,bpm:this.bpm,master:this.master,tracks:this.tracks.map(({samples,source,beats,level,muted,reverse,filter})=>({samples,source,beats,level,muted,reverse,filter}))};}
}
