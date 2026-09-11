// Local, versioned four-layer session format. No remote storage or executable content.
const MAGIC='TAPE0001',LIMIT=64*1024*1024;
const number=(n,min,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
const validSettings=s=>({takeBeats:[0,4,8,16].includes(s?.takeBeats)?s.takeBeats:8,countIn:!!s?.countIn,click:!!s?.click,inputGain:number(s?.inputGain,0,2)?s.inputGain:1,selected:Number.isInteger(s?.selected)&&s.selected>=0&&s.selected<4?s.selected:0});
export function encodeProject(state,settings={}){
 const meta={sampleRate:state.sampleRate,bpm:state.bpm,master:state.master,settings:validSettings(settings),tracks:state.tracks.map(t=>({frames:t.samples?.length||0,source:t.source,beats:t.beats,level:t.level,muted:t.muted,reverse:t.reverse,filter:t.filter}))};
 const header=new TextEncoder().encode(JSON.stringify(meta)),size=12+header.length+meta.tracks.reduce((n,t)=>n+t.frames*4,0);
 if(size>LIMIT)throw Error('This session is too large to save.');
 const bytes=new Uint8Array(size),view=new DataView(bytes.buffer);bytes.set(new TextEncoder().encode(MAGIC));view.setUint32(8,header.length,true);bytes.set(header,12);let at=12+header.length;
 for(const t of state.tracks)if(t.samples)for(const sample of t.samples){view.setFloat32(at,sample,true);at+=4;}return bytes;
}
export function decodeProject(buffer,targetRate){
 const bytes=new Uint8Array(buffer);if(bytes.length<12||bytes.length>LIMIT||new TextDecoder().decode(bytes.subarray(0,8))!==MAGIC)throw Error('Choose a valid .tape session file.');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),length=view.getUint32(8,true);if(length>16384||12+length>bytes.length)throw Error('The session header is invalid.');
 let meta;try{meta=JSON.parse(new TextDecoder().decode(bytes.subarray(12,12+length)));}catch{throw Error('The session header is invalid.');}
 if(!number(meta.sampleRate,8000,192000)||!number(targetRate,8000,192000)||!number(meta.bpm,40,240)||!number(meta.master,0,1)||!Array.isArray(meta.tracks)||meta.tracks.length!==4)throw Error('The session settings are invalid.');
 let at=12+length;
 const tracks=meta.tracks.map(t=>{
  if(!Number.isInteger(t.frames)||t.frames<0||t.frames>meta.sampleRate*60||!number(t.beats,1e-6,240)||!number(t.level,0,1)||!number(t.filter,0,1)||typeof t.muted!=='boolean'||typeof t.reverse!=='boolean'||at+t.frames*4>bytes.length)throw Error('The session audio is invalid.');
  let samples=null;
  if(t.frames){const raw=new Float32Array(t.frames);for(let n=0;n<t.frames;n++){const value=view.getFloat32(at,true);at+=4;if(!number(value,-1,1))throw Error('The session contains invalid samples.');raw[n]=value;}
   if(meta.sampleRate===targetRate)samples=raw;else{samples=new Float32Array(Math.max(1,Math.round(raw.length*targetRate/meta.sampleRate)));for(let n=0;n<samples.length;n++){const p=n*raw.length/samples.length,i=Math.floor(p),f=p-i;samples[n]=raw[i]*(1-f)+raw[(i+1)%raw.length]*f;}}
  }return {samples,source:samples?(['dust','pulse','half','warm'].includes(t.source)?t.source:'custom'):null,beats:t.beats,level:t.level,muted:t.muted,reverse:t.reverse,filter:t.filter};
 });
 if(at!==bytes.length)throw Error('The session file has unexpected data.');
 return {state:{sampleRate:targetRate,bpm:meta.bpm,master:meta.master,tracks},settings:validSettings(meta.settings)};
}
