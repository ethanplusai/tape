// ROOM 01: twelve original, deterministic loops. No recordings, model or network requests.
// All parts share an eight-beat Am9 / Fmaj9 phrase at 96 BPM. Render at the native
// tempo even when the deck is faster: every library part then varispeeds together.
export const collection={id:'room',name:'ROOM 01',bpm:96,key:'A MINOR',beats:8};
export const groups=[
 {id:'drums',label:'DRUMS',sounds:[['dust','DUST','SWUNG / DRY'],['pulse','PULSE','FOUR / STEADY'],['break','BREAK','BROKEN / LIGHT']]},
 {id:'bass',label:'BASS',sounds:[['round','ROUND','WARM / SPARSE'],['walk','WALK','MOVING / SOFT'],['sub','SUB','LOW / HELD']]},
 {id:'chords',label:'CHORDS',sounds:[['felt','FELT','SOFT / KEYS'],['haze','HAZE','SLOW / PAD'],['chop','CHOP','SHORT / SYNC']]},
 {id:'texture',label:'TEXTURE',sounds:[['glass','GLASS','BELL / PHRASE'],['shaker','SHAKER','LIGHT / SWING'],['spark','SPARK','PLUCK / ARP']]}
];
export const sounds=groups.flatMap(g=>g.sounds.map(([id,label,description])=>({id:`room-${id}`,label,description,group:g.id})));
export const defaultSound='room-dust';
export const findSound=id=>sounds.find(s=>s.id===id);
export const isLibrarySound=id=>!!findSound(id);
const hz=note=>440*2**((note-69)/12),TAU=Math.PI*2;
export function libraryLoop(id,sampleRate){
 const sound=findSound(id);if(!sound)throw Error('Unknown library sound.');
 if(!Number.isFinite(sampleRate)||sampleRate<8000||sampleRate>192000)throw Error('Unsupported sample rate.');
 const secondsPerBeat=60/collection.bpm,length=Math.round(collection.beats*secondsPerBeat*sampleRate),out=new Float32Array(length);
 let seed=Array.from(id).reduce((a,c)=>Math.imul(a,31)+c.charCodeAt(0),1977)>>>0;
 const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1;};
 function voice(beat,seconds,fn){const at=Math.round(beat*secondsPerBeat*sampleRate),frames=Math.round(seconds*sampleRate);for(let n=0;n<frames;n++){const t=n/sampleRate;out[(at+n)%length]+=fn(t,n,seconds);}}
 const attack=(t,s=.005)=>Math.min(1,t/s);
 function drum(beat,type,level=1){let low=0,last=0;
  voice(beat,type==='kick'?.55:type==='snare'?.23:type==='rim'?.08:.13,(t)=>{
   let v=0;
   if(type==='kick'){const phase=TAU*(48*t+4.7*(1-Math.exp(-42*t)));v=(Math.sin(phase)+.14*Math.sin(phase*2))*Math.exp(-t*15)+noise()*.05*Math.exp(-t*180);}
   else if(type==='snare'){low+=.24*(noise()-low);v=(low*.85+Math.sin(TAU*183*t)*.2)*Math.exp(-t*22);}
   else if(type==='rim')v=(Math.sin(TAU*820*t)+.5*Math.sin(TAU*1260*t))*Math.exp(-t*95)*.23;
   else{const x=noise(),high=x-last*.92;last=x;v=high*.13*Math.exp(-t*(type==='shaker'?48:85));}
   return v*attack(t,.001)*level;
  });
 }
 if(sound.group==='drums'){
  const pattern=id.slice(5);
  const kicks=pattern==='pulse'?[0,1,2,3,4,5,6,7]:pattern==='break'?[0,1.75,3.5,4,6.5]:[0,2,3.5,4,6,6.75];
  kicks.forEach((b,i)=>drum(b,'kick',i%3===2?.38:.65));
  [1,3,5,7].forEach(b=>drum(b,pattern==='break'?'rim':'snare',.7));
  for(let b=0;b<8;b++){drum(b,'hat',.38);drum(b+.58,'hat',.65);}
  if(pattern==='break'){drum(2.75,'snare',.16);drum(6.75,'snare',.18);}
 }else if(sound.group==='bass'){
  const pattern=id==='room-sub'?[[0,45,3.55],[4,41,3.55]]:id==='room-walk'?[[0,45,.65],[1.5,52,.38],[2.5,55,.35],[3.5,52,.3],[4,41,.7],[5.5,48,.4],[6.5,52,.5],[7.5,43,.35]]:[[0,45,1.25],[1.75,45,.5],[3,52,.5],[4,41,1.3],[5.75,41,.5],[7,48,.5]];
  pattern.forEach(([beat,note,d])=>{const f=hz(note),duration=d*secondsPerBeat;voice(beat,duration,(t,n,total)=>{
   const env=attack(t,.012)*Math.min(1,(total-t)/.055)*Math.exp(-t*(id==='room-sub'?.35:1.6));
   return (Math.sin(TAU*f*t)+.28*Math.sin(TAU*f*2*t)+.09*Math.sin(TAU*f*3*t))*env*.34;
  });});
 }else if(sound.group==='chords'){
  const voicings=[[57,60,64,67,71],[53,57,60,64,67]];
  for(let bar=0;bar<2;bar++){
   const hits=id==='room-chop'?[.5,1.75,3]:[0];
   hits.forEach(offset=>voicings[bar].forEach((note,j)=>{const f=hz(note),pad=id==='room-haze',duration=pad?3:id==='room-chop'?.48:2.4;
    voice(bar*4+offset+j*.014,duration,(t,n,total)=>{
     const env=attack(t,pad?.24:.006)*Math.min(1,(total-t)/.2)*Math.exp(-t*(pad?.55:1.9));
     const fm=Math.sin(TAU*f*t+Math.sin(TAU*f*2*t)*.65*Math.exp(-t*7));
     const body=pad?(Math.sin(TAU*f*t)+.25*Math.sin(TAU*f*1.002*t)):(fm+.16*Math.sin(TAU*f*3*t)*Math.exp(-t*5));
     return body*env*.065;
    });
   }));
  }
 }else if(id==='room-shaker'){
  for(let b=0;b<8;b++){drum(b+.25,'shaker',.4);drum(b+.58,'shaker',.8);drum(b+.85,'shaker',.26);}
 }else{
  const glass=id==='room-glass',notes=[[76,71,72,67],[76,72,69,67]];
  for(let bar=0;bar<2;bar++)for(let j=0;j<(glass?3:8);j++){
   const f=hz(notes[bar][j%4]),beat=bar*4+(glass?[.5,2,3.5][j]:j*.5),duration=glass?1.5:.7;
   voice(beat,duration,(t,n,total)=>{const env=attack(t,.004)*Math.min(1,(total-t)/.07)*Math.exp(-t*(glass?3:7));return (Math.sin(TAU*f*t)+.28*Math.sin(TAU*f*(glass?2.76:2)*t)*Math.exp(-t*7))*env*(glass?.15:.12);});
  }
 }
 // Tempo-locked, wraparound room echoes: their tails continue across the loop seam.
 if(['chords','texture'].includes(sound.group)&&id!=='room-shaker'){
  const dry=out.slice();for(const [beats,gain]of [[.75,.19],[1.5,.075],[2.25,.03]]){const offset=Math.round(beats*secondsPerBeat*sampleRate);for(let n=0;n<length;n++)out[(n+offset)%length]+=dry[n]*gain;}
 }
 let energy=0,peak=0,mean=0;for(const v of out)mean+=v;mean/=length;
 for(let n=0;n<length;n++){out[n]-=mean;energy+=out[n]*out[n];peak=Math.max(peak,Math.abs(out[n]));}
 const target=({drums:.115,bass:.135,chords:.085,texture:.042})[sound.group];
 const gain=Math.min(target/Math.max(.0001,Math.sqrt(energy/length)),.78/Math.max(.0001,peak));
 for(let n=0;n<length;n++)out[n]*=gain;
 return {samples:out,beats:collection.beats,source:id};
}
