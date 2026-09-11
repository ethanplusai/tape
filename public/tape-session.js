import {presets} from './tape-audio/presets.mjs';
import {TapeEngine} from './tape-audio/engine.js';
const deck=document.querySelector('[data-tape-deck]');
if(deck){
 const engine=new TapeEngine(),all=s=>[...deck.querySelectorAll(s)],one=s=>deck.querySelector(s),root=document.documentElement,media=matchMedia('(prefers-reduced-motion: reduce)');
 const state={selected:1,bpm:96,beat:0,playing:false,recording:null,tracks:Array.from({length:4},()=>({hasAudio:false,level:.75,filter:0,muted:false,reverse:false,canUndo:false,canRedo:false,takes:0,beats:8}))};
 let idleSpin=true,baseChoice='dust';
 let master=.7,inputGain=1,takeBeats=8,countIn=false,click=false,power=true,permission=false,busy=false,hydrated=false,mic=false,recordRequest=0;
 let actual=0,angle=0,last=0,frame=0,held=false,discDrag,keyboardRelease,flash=null,flashTimer,menu=null;
 const rotor=one('.tp-vinyl-rotor'),main=one('[data-session-bpm]'),display=one('[data-session-display]'),disc=one('[data-session-disc]');
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),track=()=>state.tracks[state.selected],locked=()=>permission||!!state.recording||busy;
 const send=(type,value,index=state.selected)=>engine.send({type,value,index});
 function announce(text,short,sub=''){one('[data-session-status]').textContent=text;if(short){clearTimeout(flashTimer);flash={main:short,sub};flashTimer=setTimeout(()=>{flash=null;renderDisplay();},1700);}renderDisplay();}
 function failure(e){permission=false;busy=false;const notice=document.querySelector('[data-audio-notice]');if(notice){notice.hidden=false;notice.textContent=e.message||'Tap Play again to start audio.';}announce(e.message||'Audio could not start. Please retry.','RETRY','CHECK BROWSER');render();}
 async function ready(){const prefs={bpm:state.bpm,base:baseChoice,tracks:state.tracks.map(t=>({...t}))};await engine.init();const notice=document.querySelector('[data-audio-notice]');if(notice)notice.hidden=true;if(!hydrated){hydrated=true;if(prefs.base!=='off')await engine.base(prefs.base,prefs.bpm);send('tempo',prefs.bpm);send('master',master);send('input',inputGain);send('click',click);prefs.tracks.forEach((t,index)=>{for(const type of ['level','filter','mute','reverse'])send(type,type==='mute'?t.muted:t[type],index);});}}
 function press(el){el.classList.add('is-pressed');setTimeout(()=>el.classList.remove('is-pressed'),140);}
 function renderDisplay(){
  const t=track(),r=state.recording;let context='',text=String(state.bpm).padStart(3,'0'),sub=`L${state.selected+1} / ${t.muted?'MUTE':t.reverse?'REV':t.hasAudio?(state.playing?'PLAY':'PAUSE'):'EMPTY'}`;
  if(!power){text='';sub='STANDBY';}else if(permission){text='MIC?';sub='ALLOW / CANCEL';}else if(r){text=r.phase==='armed'?String(Math.ceil(r.remaining)):r.free?`${r.seconds.toFixed(1)}s`:'REC';sub=`L${r.index+1} / ${r.phase==='armed'?'COUNT IN':'RECORDING'}`;}else if(menu){const m=menuView();text=m.main;sub=m.sub;context=menu.kind==='list'?`${menu.id} ${menu.index+1}/${menu.items.length}`:menu.kind==='value'?'TURN TO CHANGE':'PLEASE CONFIRM';}else if(flash){text=flash.main;sub=flash.sub;}else if(!state.tracks.some(t=>t.hasAudio)&&!state.playing)sub='PRESS PLAY';
  display.classList.toggle('is-menu',!/^\d{3}$/.test(text));one('[data-session-display-context]').textContent=context;one('[data-session-display-main]').textContent=text;one('[data-session-display-sub]').textContent=sub;
  display.setAttribute('aria-label',`Deck: ${text}, ${sub}`);display.title=one('[data-session-status]').textContent;
  one('[data-session-progress]').style.width=`${r?.phase==='recording'?r.progress*100:state.playing?((state.beat%t.beats+t.beats)%t.beats)/t.beats*100:0}%`;
  deck.dataset.menu=menu?.id||'closed';deck.dataset.menuItem=menu?(menu.kind==='list'?menu.items[menu.index].label:menu.kind==='value'?menu.label:menu.kind):'';
 }
 function render(){
  const t=track(),recording=permission||!!state.recording;
  deck.classList.toggle('is-playing',state.playing);deck.classList.toggle('is-recording',recording);deck.classList.toggle('is-off',!power);
  Object.assign(deck.dataset,{selectedLayer:state.selected+1,filter:Math.round(t.filter*100),bpm:state.bpm,playing:String(state.playing),recording:permission?'permission':state.recording?.phase||'idle',outputRms:(state.outputRms||0).toFixed(5),inputRms:(state.inputRms||0).toFixed(5),mic:String(mic),tracks:state.tracks.map(t=>t.hasAudio?'1':'0').join(''),takeBeats,baseSound:baseChoice,muted:String(t.muted),reverse:String(t.reverse),master});
  all('[data-session-record],[data-session-play],[data-session-undo]').forEach(b=>b.disabled=!power||busy||(b.hasAttribute('data-session-undo')&&locked()));
  one('[data-session-play]').setAttribute('aria-pressed',String(state.playing));one('[data-session-play]').setAttribute('aria-label',state.playing?'Pause; hold to stop and rewind':'Play the selected base sound and your recorded layers');
  one('[data-session-record]').setAttribute('aria-pressed',String(recording));one('[data-session-record]').setAttribute('aria-label',permission?'Cancel microphone request':state.recording?'Finish this take':'Record microphone into selected layer');
  all('[data-session-level]').forEach(el=>{const i=Number(el.dataset.sessionLevel),t=state.tracks[i],value=Math.round(t.level*100);el.style.setProperty('--dial-angle',`${(value-75)*2.5}deg`);el.setAttribute('aria-valuenow',value);el.setAttribute('aria-valuetext',`${value} percent, ${i===state.selected?'selected, ':''}${t.muted?'muted, ':''}${t.hasAudio?'recorded':'empty'}`);el.dataset.selected=String(i===state.selected);el.setAttribute('aria-disabled',String(!power));});
  main.style.setProperty('--dial-angle',`${menu?menu.turn||0:(state.bpm-96)*1.5}deg`);main.setAttribute('aria-disabled',String(!power||locked()));main.setAttribute('aria-valuenow',menu?menu.kind==='list'?menu.index:menu.kind==='value'?menu.value:0:state.bpm);main.setAttribute('aria-valuemin',menu?0:40);main.setAttribute('aria-valuemax',menu?menu.kind==='list'?menu.items.length-1:menu.max||100:240);main.setAttribute('aria-valuetext',menu?`${menuView().main}, ${menuView().sub}`:`${state.bpm} BPM; press for settings`);
  const filter=Math.round(t.filter*100);one('[data-session-arm]').setAttribute('aria-valuenow',filter);one('[data-session-arm]').setAttribute('aria-valuetext',filter?`${filter} percent filter, layer ${state.selected+1}`:'Filter bypassed');one('[data-session-arm-body]').setAttribute('transform',`rotate(${filter*.18} 1043 216)`);
  one('[data-session-master]').setAttribute('aria-valuenow',Math.round(master*100));one('[data-session-power]').setAttribute('aria-pressed',String(power));renderDisplay();
 }
 deck.addEventListener('pointerdown',()=>deck.classList.add('is-pointer-input'),true);
 deck.addEventListener('keydown',()=>deck.classList.remove('is-pointer-input'),true);
 // The menu is rendered only in the physical amber display.
 const item=(label,action,sub='PRESS TO OPEN')=>({label,action,sub});
 function list(id,items,parent=null){menu={kind:'list',id,items,index:0,parent,turn:0};flash=null;render();announce(`${id} menu. Turn the main dial to browse; press to choose. Hold or press Escape to go back.`);}
 function value(label,current,min,max,set,format=v=>String(v),step=1){menu={kind:'value',id:label,label,value:current,min,max,set,format,step,parent:menu,turn:0};render();}
 function confirm(label,action){menu={kind:'confirm',id:label,label,index:0,action,parent:menu,turn:0};render();}
 function back(){menu=menu?.parent||null;render();}
 function closeMenu(){menu=null;flash=null;render();}
 function menuView(){if(menu.kind==='list')return {main:menu.items[menu.index].label,sub:menu.items[menu.index].sub};if(menu.kind==='value')return {main:menu.format(menu.value),sub:menu.label};return {main:menu.index?'CONFIRM':'CANCEL',sub:menu.label};}
 function moveMenu(delta){if(!menu)return;menu.turn=(menu.turn||0)+delta*12;if(menu.kind==='list')menu.index=(menu.index+delta%menu.items.length+menu.items.length)%menu.items.length;else if(menu.kind==='value'){menu.value=clamp(menu.value+delta*menu.step,menu.min,menu.max);menu.set(menu.value);}else menu.index=delta>0?1:0;render();}
 async function task(fn,message,short){if(locked())return;busy=true;render();try{await ready();await fn();closeMenu();announce(message,short);}catch(e){failure(e);}finally{busy=false;render();}}
 function soundMenu(){const parent=menu;list('SOUND',[...presets.map(p=>item(p.label,()=>changeBase(p.id),({dust:'SWUNG RHYTHM',pulse:'FOUR ON FLOOR',half:'HALF-TIME',warm:'SOFT NOTES'})[p.id])),item('OFF',()=>changeBase('off'),'NO BASE SOUND'),item('BACK',back)],parent);}
 function changeBase(id){const apply=()=>task(async()=>{await engine.base(id,state.bpm);baseChoice=id;},id==='off'?'Base sound off. Your other layers are unchanged.':`Layer 1: ${id}. Your other layers are unchanged.`,id==='off'?'BASE OFF':id.toUpperCase());if(state.tracks[0].hasAudio&&state.tracks[0].source==='custom')confirm('REPLACE L1',apply);else apply();}
 function openMenu(){if(!power||locked())return;if(menu){if(menu.kind==='list')menu.items[menu.index].action();else if(menu.kind==='value')back();else{const m=menu;back();if(m.index)m.action();}return;}
  list('MAIN',[
   item('SOUND',soundMenu,'LAYER 1 BASE'),
   item('LOOP',()=>{const parent=menu;list('LOOP',[
    item('LENGTH',()=>{if(track().hasAudio){closeMenu();announce('An existing layer keeps its recorded length. Clear it or select an empty layer to choose a new length.','FIXED','RECORDED LOOP');return;}const options=[0,4,8,16];value('TAKE LENGTH',options.indexOf(takeBeats),0,3,v=>{takeBeats=options[v];},v=>v===0?'FREE':`${options[v]/4} BAR${v>1?'S':''}`);}),
    item('COUNT IN',()=>value('COUNT IN',Number(countIn),0,1,v=>{countIn=!!v;},v=>v?'ON':'OFF')),
    item('CLICK',()=>value('METRONOME',Number(click),0,1,v=>{click=!!v;send('click',click);},v=>v?'ON':'OFF')),
    item('REVERSE',()=>value('LAYER DIRECTION',Number(track().reverse),0,1,v=>{track().reverse=!!v;send('reverse',!!v);},v=>v?'REVERSE':'FORWARD')),
    item('BACK',back)
   ],parent);}),
   item('INPUT',()=>value('MIC GAIN',Math.round(inputGain*100),0,200,v=>{inputGain=v/100;send('input',inputGain);},v=>`${v}%`,5),'PRESS FOR GAIN'),
   item('SESSION',()=>{const parent=menu;list('SESSION',[
    item('SAVE',()=>task(()=>engine.saveProject({takeBeats,countIn,click,inputGain,selected:state.selected}),'Editable four-layer project saved to your device.','SAVED'),'EDITABLE .TAPE'),
    item('LOAD',()=>confirm('REPLACE SESSION',()=>one('[data-session-project-file]').click()),'OPEN .TAPE FILE'),
    item('EXPORT',()=>task(()=>engine.download(),'Your mix was downloaded as a WAV file.','EXPORTED'),'MIXED WAV FILE'),
    item('CLEAR',()=>confirm(`CLEAR L${state.selected+1}`,()=>{engine.send({type:'clear',index:state.selected});closeMenu();announce('Layer cleared. Undo restores it.','CLEARED',`LAYER ${state.selected+1}`);}),'SELECTED LAYER'),
    item('NEW',()=>confirm('NEW SESSION',()=>{engine.pause();engine.send({type:'new'});state.tracks.forEach(t=>Object.assign(t,{hasAudio:false,level:.75,filter:0,muted:false,reverse:false}));state.playing=false;state.selected=0;baseChoice='off';closeMenu();announce('New empty session. Choose a base sound from the main dial or record your own.','NEW','EMPTY SESSION');}),'CLEAR ALL FOUR'),
    item('BACK',back)
   ],parent);}),
   item('HELP',()=>{const parent=menu;list('HELP',[
    item('LAYER',()=>{},'PRESS TO SELECT'),item('LEVEL',()=>{},'TURN LAYER DIAL'),item('MUTE',()=>{},'HOLD LAYER DIAL'),item('TEMPO',()=>{},'TURN MAIN DIAL'),item('MENU',()=>{},'PRESS MAIN DIAL'),item('BACK',()=>{},'HOLD MAIN DIAL'),item('REDO',()=>{},'HOLD UNDO KEY'),item('STOP',()=>{},'HOLD PLAY KEY'),item('VOLUME',()=>{},'RIGHT SIDE WHEEL'),item('FREE',()=>{},'RECORD TO CLOSE'),item('CLOSE',back)
   ],parent);}),item('EXIT',closeMenu)
  ]);
 }
 function setTempo(v){if(locked()||!power)return;state.bpm=Math.round(clamp(v,40,240));send('tempo',state.bpm);render();announce(`Tempo ${state.bpm} BPM.`);}
 function setLevel(index,v){if(!power)return;const value=Math.round(clamp(v,0,100));state.tracks[index].level=value/100;send('level',value/100,index);render();announce(`Layer ${index+1}, volume ${value} percent.`,`L${index+1} ${value}%`,'LAYER LEVEL');}
 function select(index){if(locked()||held||!power)return;state.selected=index;render();announce(`Layer ${index+1} selected. Disc and arm now control this layer.`,`LAYER ${index+1}`,track().hasAudio?'READY TO OVERDUB':'EMPTY');}
 function mute(index){if(!power)return;const t=state.tracks[index];t.muted=!t.muted;send('mute',t.muted,index);render();announce(`Layer ${index+1} ${t.muted?'muted':'unmuted'}.`,`L${index+1} ${t.muted?'MUTE':'ON'}`,'LAYER LEVEL');}
 function setFilter(v){if(!power)return;const value=Math.round(clamp(v,0,100));track().filter=value/100;send('filter',value/100);render();announce(`Layer ${state.selected+1}, filter ${value} percent.`,'FILTER',`${value}% / L${state.selected+1}`);}
 function setMaster(v){master=clamp(Math.round(v),0,100)/100;send('master',master);render();announce(`Output ${Math.round(master*100)} percent.`,'OUTPUT',`${Math.round(master*100)}%`);}
 // Single gesture recognizer distinguishes push, hold and turn without firing a click after a drag.
 function gesture(el,{tap=()=>{},hold=()=>{},drag=null,start=()=>0,allowed=()=>power}){
  let g,suppressClick=false;
  el.addEventListener('pointerdown',e=>{if(e.button!==0||!allowed())return;e.preventDefault();el.focus({preventScroll:true});suppressClick=false;g={x:e.clientX,y:e.clientY,value:start(),moved:false,held:false};el.setPointerCapture(e.pointerId);g.timer=setTimeout(()=>{if(g&&!g.moved){g.held=true;press(el);hold();}},600);});
  el.addEventListener('pointermove',e=>{if(!g||g.held)return;const distance=Math.hypot(e.clientX-g.x,e.clientY-g.y),d=g.y-e.clientY+e.clientX-g.x;if(distance>8){g.moved=true;clearTimeout(g.timer);}if(g.moved&&drag){el.classList.add('is-dragging');drag(d-Math.sign(d)*8,g.value);}});
  const end=e=>{if(!g)return;clearTimeout(g.timer);suppressClick=g.moved||g.held||e.type!=='pointerup';g=null;el.classList.remove('is-dragging');};
  ['pointerup','pointercancel','lostpointercapture'].forEach(t=>el.addEventListener(t,end));
  el.addEventListener('click',()=>{if(suppressClick){suppressClick=false;return;}if(allowed()){press(el);tap();}});
  el.addEventListener('keydown',e=>{if(!['Enter',' '].includes(e.key))return;if(el.tagName!=='BUTTON'||e.shiftKey){e.preventDefault();if(!e.repeat&&allowed()){suppressClick=false;if(e.shiftKey){press(el);hold();}else el.click();}}else suppressClick=false;});
 }
 function keys(e,current,set,min=0,max=100){const d={ArrowUp:1,ArrowRight:1,ArrowDown:-1,ArrowLeft:-1,PageUp:10,PageDown:-10}[e.key];if(d!==undefined){e.preventDefault();set(current+d*(e.shiftKey?10:1));}else if(e.key==='Home'||e.key==='End'){e.preventDefault();set(e.key==='Home'?min:max);}}
 all('[data-session-level]').forEach(el=>{const index=Number(el.dataset.sessionLevel);gesture(el,{tap:()=>select(index),hold:()=>mute(index),start:()=>state.tracks[index].level*100,drag:(d,v)=>setLevel(index,v+d*.4)});el.addEventListener('keydown',e=>keys(e,state.tracks[index].level*100,v=>setLevel(index,v)));});
 let menuSteps=0;gesture(main,{tap:openMenu,hold:back,allowed:()=>power&&!locked(),start:()=>{menuSteps=0;return state.bpm;},drag:(d,v)=>{if(menu){const next=Math.trunc(d/12);moveMenu(next-menuSteps);menuSteps=next;}else setTempo(v+d*.4);}});
 main.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();back();}else if(menu){const d={ArrowUp:1,ArrowRight:1,ArrowDown:-1,ArrowLeft:-1}[e.key];if(d!==undefined){e.preventDefault();moveMenu(d);}}else keys(e,state.bpm,setTempo,40,240);});
 const masterEl=one('[data-session-master]');gesture(masterEl,{start:()=>master*100,drag:(d,v)=>setMaster(v+d*.4),tap:()=>announce('Turn the right-edge wheel to adjust output.','OUTPUT',`${Math.round(master*100)}%`)});masterEl.addEventListener('keydown',e=>keys(e,master*100,setMaster));
 async function play(){if(!power||busy)return;idleSpin=false;if(permission){recordRequest++;permission=false;engine.finish(true);}releaseDisc();try{await ready();const next=!state.playing;send('play',next);announce(next?'Playing. Press a layer dial to select it, then Record to add your sound.':'Session paused.',next?'PLAY':'PAUSE',`LAYER ${state.selected+1}`);}catch(e){failure(e);}}
 gesture(one('[data-session-play]'),{tap:play,hold:()=>{idleSpin=false;recordRequest++;permission=false;releaseDisc();engine.pause();send('rewind');state.playing=false;angle=0;rotor.style.transform='rotate(0deg)';render();announce('Stopped at the start.','STOP','START OF LOOP');}});
 gesture(one('[data-session-undo]'),{allowed:()=>power&&!locked(),tap:()=>{engine.send({type:'undo',index:state.selected});announce(track().canUndo?'Latest layer change undone.':'Nothing to undo.',track().canUndo?'UNDONE':'NO UNDO',`LAYER ${state.selected+1}`);},hold:()=>{engine.send({type:'redo',index:state.selected});announce(track().canRedo?'Layer change restored.':'Nothing to redo.',track().canRedo?'REDONE':'NO REDO',`LAYER ${state.selected+1}`);}});
 one('[data-session-record]').addEventListener('click',async e=>{
  if(!power||busy)return;idleSpin=false;press(e.currentTarget);releaseDisc();closeMenu();if(permission||state.recording){recordRequest++;const cancel=permission;permission=false;engine.finish(cancel);render();if(cancel)announce('Microphone request cancelled.','CANCELLED','MIC OFF');return;}
  permission=true;const request=++recordRequest;render();announce('Allow your microphone to record. No audio is uploaded.');
  try{await ready();if(request!==recordRequest)return;await engine.record(state.selected,takeBeats,countIn);}catch(e){if(request===recordRequest)failure(e);}
 });
 one('[data-session-project-file]').addEventListener('change',async e=>{const file=e.target.files?.[0];e.target.value='';if(!file||locked())return;await task(async()=>{const settings=await engine.loadProject(file);({master,inputGain,takeBeats,countIn,click}=settings);state.selected=settings.selected;state.bpm=settings.bpm;send('input',inputGain);send('click',click);},'Four-layer session loaded. Press Play to listen.','LOADED');});
 engine.addEventListener('state',({detail})=>{if(!hydrated)return;Object.assign(state,detail);baseChoice=detail.tracks[0].source||'off';render();});engine.addEventListener('mic',({detail})=>{mic=detail;render();});
 engine.addEventListener('armed',()=>{permission=false;announce('Take armed. Capture starts on the loop boundary.');});engine.addEventListener('recording',()=>{permission=false;announce(`Recording layer ${state.selected+1}. Press Record to finish.`);});
 engine.addEventListener('record-end',({detail})=>{permission=false;announce(detail.cancelled?'Take cancelled. Existing audio is safe.':`Layer ${detail.index+1} recorded. Select another layer to add a sound.`,detail.cancelled?'CANCELLED':'CAPTURED',`LAYER ${detail.index+1}`);});
 engine.addEventListener('error',({detail})=>{engine.pause();state.playing=false;state.recording=null;failure(detail);});engine.addEventListener('interrupted',()=>{state.playing=false;state.recording=null;permission=false;render();announce('Audio paused by the browser. Press Play to resume.','PAUSED','PRESS PLAY');});
 const arm=one('[data-session-arm]');let armDrag=false;
 arm.addEventListener('pointerdown',e=>{if(e.button!==0||!power)return;e.preventDefault();arm.focus({preventScroll:true});armDrag=true;arm.setPointerCapture(e.pointerId);deck.classList.add('is-sweeping');});
 arm.addEventListener('pointermove',e=>{if(!armDrag)return;const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(arm.ownerSVGElement.getScreenCTM().inverse());const degrees=(Math.atan2(p.y-216,p.x-1043)-Math.atan2(374,-223))*180/Math.PI;setFilter(degrees/.18);});
 ['pointerup','pointercancel','lostpointercapture'].forEach(t=>arm.addEventListener(t,()=>{armDrag=false;deck.classList.remove('is-sweeping');}));arm.addEventListener('keydown',e=>keys(e,track().filter*100,setFilter));
 function holdDisc(){if(!power||locked())return false;held=true;actual=0;disc.setAttribute('aria-pressed','true');engine.send({type:'scrub-start',index:state.selected});if(engine.context?.state==='suspended')engine.context.resume().catch(failure);return true;}
 function moveDisc(degrees){angle+=degrees;rotor.style.transform=`rotate(${angle}deg)`;engine.send({type:'scrub-move',index:state.selected,delta:degrees/360*8});}
 function releaseDisc(){if(!held)return;clearTimeout(keyboardRelease);held=false;discDrag=null;disc.setAttribute('aria-pressed','false');engine.send({type:'scrub-end',index:state.selected});}
 function discAngle(e){const r=one('.tp-product-visual').getBoundingClientRect(),x=(e.clientX-r.x)/r.width*1448,y=(e.clientY-r.y)/r.height*1086,dy=y-411,q=-.03634,v=dy/(316-q*dy),u=(x-615)*(1+q*v)/355;return Math.atan2(v,u);}
 disc.addEventListener('pointerdown',e=>{if(e.button!==0||!holdDisc())return;e.preventDefault();disc.focus({preventScroll:true});disc.setPointerCapture(e.pointerId);discDrag={last:discAngle(e)};});disc.addEventListener('pointermove',e=>{if(!discDrag)return;const next=discAngle(e);let delta=next-discDrag.last;if(delta>Math.PI)delta-=2*Math.PI;if(delta<-Math.PI)delta+=2*Math.PI;moveDisc(delta*180/Math.PI);discDrag.last=next;});
 ['pointerup','pointercancel','lostpointercapture'].forEach(t=>disc.addEventListener(t,releaseDisc));disc.addEventListener('keydown',e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();if(!held)holdDisc();}else if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();if(!held&&!holdDisc())return;moveDisc(e.key==='ArrowLeft'?-20:20);clearTimeout(keyboardRelease);keyboardRelease=setTimeout(releaseDisc,180);}});disc.addEventListener('keyup',e=>{if([' ','Enter'].includes(e.key))releaseDisc();});disc.addEventListener('blur',releaseDisc);
 function inspect(id,on=true){
  if(id==='full')on=false;
  deck.dataset.inspect=on?id:'';deck.classList.toggle('is-close',on);
  all('[data-tape-inspect]').forEach(b=>b.setAttribute('aria-pressed',String(on&&b.dataset.tapeInspect===id)));
  if(on&&innerWidth<=700)setTimeout(()=>{if(deck.dataset.inspect===id)one('.tp-viewfinder').scrollIntoView({block:'center',behavior:media.matches?'instant':'smooth'});},100);
 }
 all('[data-tape-inspect]').forEach(el=>el.addEventListener('click',()=>inspect(el.dataset.tapeInspect,deck.dataset.inspect!==el.dataset.tapeInspect||!deck.classList.contains('is-close'))));
 document.addEventListener('tape:guide',({detail})=>{
  if(locked()){deck.scrollIntoView({block:'center',behavior:media.matches?'instant':'smooth'});announce('Finish the current take before changing the view or settings.');return;}
  closeMenu();inspect(detail.inspect);if(detail.menu&&power){openMenu();menu?.items?.find(item=>item.label===detail.menu)?.action();}
  const selectors={layers:`[data-session-level="${state.selected}"]`,disc:'[data-session-disc]',arm:'[data-session-arm]',record:'[data-session-record]',play:'[data-session-play]'};
  const target=one(selectors[detail.id]||'[data-session-bpm]');
  deck.classList.toggle('is-pointer-input',!detail.keyboard);
  deck.scrollIntoView({block:'center',behavior:media.matches?'instant':'smooth'});
  setTimeout(()=>target?.focus({preventScroll:true}),media.matches?0:650);
 });

 function pauseForPage(){idleSpin=false;recordRequest++;permission=false;releaseDisc();engine.pause();state.playing=false;state.recording=null;actual=0;render();}
 one('[data-session-power]').addEventListener('click',()=>{power=!power;if(!power){pauseForPage();closeMenu();}render();announce(power?'Deck ready. Press Play or Record.':'Standby. Audio stopped and microphone released.');});
 function resizeProjection(){const w=one('.ts-disc-plane').offsetWidth;one('.ts-disc-projector').style.transform=`matrix3d(1,0,0,0,0,.89014,0,${-.07268/Math.max(1,w)},0,0,1,0,0,0,0,1)`;}
 new ResizeObserver(resizeProjection).observe(one('.tp-product-visual'));resizeProjection();
 function tick(t){frame=requestAnimationFrame(tick);const dt=last?Math.min((t-last)/1000,.05):0;last=t;const target=(state.playing||idleSpin)&&power&&!held&&!root.classList.contains('motion-paused')&&!media.matches?state.bpm/8*(track().reverse?-1:1):0;actual+=(target-actual)*(1-Math.exp(-dt*10));if(Math.abs(actual-target)<.02)actual=target;if(held||media.matches||root.classList.contains('motion-paused'))actual=0;if(actual){angle=(angle+actual*6*dt)%360;rotor.style.transform=`rotate(${angle}deg)`;}deck.dataset.actualRpm=actual.toFixed(2);}
 document.addEventListener('visibilitychange',()=>{if(document.hidden){pauseForPage();announce('Session paused while this tab was away. Press Play to continue.','PAUSED','PRESS PLAY');}});window.addEventListener('pagehide',()=>{pauseForPage();cancelAnimationFrame(frame);clearTimeout(flashTimer);});window.addEventListener('pageshow',e=>{if(e.persisted){last=0;frame=requestAnimationFrame(tick);}});
 render();frame=requestAnimationFrame(tick);
}
