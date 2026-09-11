import {presetLoop} from './presets.mjs';
import {encodeProject,decodeProject} from './project.mjs';
import {renderMix,wav} from './files.mjs';
export class TapeEngine extends EventTarget{
 constructor(){super();this.context=null;this.node=null;this.stream=null;this.source=null;this.pending=0;this.requestId=0;this.exports=new Map();this.initializing=null;this.closed=false;}
 emit(type,detail){this.dispatchEvent(new CustomEvent(type,{detail}));}
 async init(){
  if(this.closed)throw Error('Reload the page to restart audio.');
  if(!this.initializing){this.initializing=(async()=>{if(!window.isSecureContext)throw Error('Audio needs HTTPS or localhost.');const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error('This browser does not support Web Audio.');this.context=new Audio({latencyHint:'interactive'});if(!this.context.audioWorklet)throw Error('This browser needs an update to run the looper.');await this.context.audioWorklet.addModule('/tape-audio/processor.js');this.node=new AudioWorkletNode(this.context,'tape-session',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[2]});this.node.port.onmessage=({data})=>{if(data.type==='state'){this.state=data.state;this.emit('state',data.state);}else if(data.type==='record-end'){this.releaseMic();this.emit('record-end',data);}else if(data.type==='export'){this.exports.get(data.id)?.(data.state);this.exports.delete(data.id);}else this.emit(data.type,data);};this.node.onprocessorerror=()=>{this.releaseMic();this.emit('error',new Error('The audio engine stopped. Reload to restart it.'));};this.node.connect(this.context.destination);this.context.onstatechange=()=>{if(this.context.state==='interrupted'||this.context.state==='suspended'){this.releaseMic();this.send({type:'finish',cancel:true});this.send({type:'play',value:false});this.emit('interrupted');}};})().catch(async error=>{await this.context?.close().catch(()=>{});this.context=null;this.node=null;this.initializing=null;throw error;});}
  await this.initializing;await this.context.resume();
 }
 send(message){this.node?.port.postMessage(message);}
 releaseMic(){this.pending++;this.source?.disconnect();this.source=null;this.stream?.getTracks().forEach(t=>t.stop());this.stream=null;this.emit('mic',false);}
 async record(index,beats,countIn){
  const token=++this.pending;await this.init();if(token!==this.pending)return;this.emit('permission');let stream;
  try{if(!navigator.mediaDevices?.getUserMedia)throw Error('Microphone access is unavailable in this browser.');stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false,channelCount:1},video:false});if(token!==this.pending||this.closed){stream.getTracks().forEach(t=>t.stop());return;}this.stream=stream;this.source=this.context.createMediaStreamSource(stream);this.source.connect(this.node);for(const track of stream.getTracks())track.addEventListener('ended',()=>{if(this.stream===stream){this.send({type:'finish',cancel:true});this.releaseMic();this.emit('error',new Error('The microphone disconnected. Select it again and retry Record.'));}});this.emit('mic',true);this.send({type:'record',index,beats,countIn});}
  catch(error){stream?.getTracks().forEach(t=>t.stop());if(token!==this.pending)return;this.releaseMic();const messages={NotAllowedError:'Microphone access was declined. Allow it in your browser, then retry Record. You can still try the demo.',NotFoundError:'No microphone was found. Connect one and retry, or try the demo.',NotReadableError:'Your microphone is busy or unavailable. Close the other app using it and retry.'};throw Error(messages[error.name]||error.message);}
 }
 finish(cancel=false){this.send({type:'finish',cancel});this.releaseMic();}
 async base(id,bpm){await this.init();if(id==='off'){this.send({type:'clear',index:0});return;}this.send({type:'load',index:0,...presetLoop(id,this.context.sampleRate,bpm)});}
 async exportState(){await this.init();const id=++this.requestId;const state=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{this.exports.delete(id);reject(Error('Export timed out. Please retry.'));},5000);this.exports.set(id,data=>{clearTimeout(timer);resolve(data);});this.send({type:'export',id});});return state;}
 saveFile(bytes,name,type){const url=URL.createObjectURL(new Blob([bytes],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
 async download(){const state=await this.exportState();this.saveFile(wav(renderMix(state),state.sampleRate),`TAPE-session-${state.bpm}bpm.wav`,'audio/wav');}
 async saveProject(settings){const state=await this.exportState();this.saveFile(encodeProject(state,settings),`TAPE-session-${state.bpm}bpm.tape`,'application/octet-stream');}
 async loadProject(file){if(file.size>64*1024*1024)throw Error('Choose a session smaller than 64 MB.');await this.init();const result=decodeProject(await file.arrayBuffer(),this.context.sampleRate);this.pause();this.send({type:'restore',state:result.state});return {...result.settings,bpm:result.state.bpm,master:result.state.master};}
 pause(){this.finish(true);this.send({type:'play',value:false});for(let index=0;index<4;index++)this.send({type:'scrub-end',index});}
}
