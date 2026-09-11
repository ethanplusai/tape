import test from 'node:test';import assert from 'node:assert/strict';import {TapeEngine} from '../public/tape-audio/engine.js';
function rig(){
 let active=true,unlocked=false,mode='auto',resolveMic;const calls=[],modes=[];
 const originals=new Map(['window','document','navigator','AudioWorkletNode'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 class Context{
  constructor(){this.state='suspended';this.sampleRate=48000;this.destination={};this.audioWorklet={addModule:async()=>{calls.push('load-start');await new Promise(r=>setTimeout(r,15));calls.push('load-end');}};}
  resume(){calls.push('resume');if(!active&&!unlocked)return Promise.reject(Error('NotAllowedError: user activation lost'));unlocked=true;this.state='running';return Promise.resolve();}
  createBuffer(){return {};}
  createBufferSource(){return {connect(){},disconnect(){},start(){calls.push('prime');}};}
  createMediaStreamSource(){return {connect(){},disconnect(){}};}
  async close(){this.state='closed';}
 }
 class Worklet{constructor(){this.port={postMessage:m=>calls.push(m.type)};}connect(){calls.push('connected');}}
 const session={get type(){return mode;},set type(v){mode=v;modes.push(v);}};
 const values={window:{isSecureContext:true,AudioContext:Context},document:{hidden:false},navigator:{audioSession:session,mediaDevices:{getUserMedia:()=>new Promise(r=>{resolveMic=r;})}},AudioWorkletNode:Worklet};
 for(const [key,value]of Object.entries(values))Object.defineProperty(globalThis,key,{value,configurable:true});
 return {calls,modes,gesture(v){active=v;},interrupt(engine){unlocked=false;engine.context.state='interrupted';},resolveMic(stream){resolveMic(stream);},restore(){for(const [key,desc]of originals)if(desc)Object.defineProperty(globalThis,key,desc);else delete globalThis[key];}};
}
test('first tap resumes and primes before slow worklet loading consumes user activation',async()=>{const r=rig();try{const e=new TapeEngine(),ready=e.init();r.gesture(false);await ready;assert.equal(e.context.state,'running');assert.ok(r.calls.indexOf('resume')<r.calls.indexOf('load-start'));assert.ok(r.calls.indexOf('prime')<r.calls.indexOf('load-end'));assert.equal(r.calls.filter(c=>c==='connected').length,1);assert.deepEqual(r.modes,['playback']);}finally{r.restore();}});
test('a fresh tap resumes an interrupted existing context before awaiting its initialized worklet',async()=>{const r=rig();try{const e=new TapeEngine();await e.init();r.interrupt(e);r.gesture(true);const resumed=e.init();r.gesture(false);await resumed;assert.equal(e.context.state,'running');assert.equal(r.calls.filter(c=>c==='connected').length,1);}finally{r.restore();}});
test('cancelled mic permission restores playback session and stops a late stream',async()=>{const r=rig();try{const e=new TapeEngine();await e.init();const pending=e.record(1,8,false);await new Promise(resolve=>setTimeout(resolve,0));assert.equal(r.modes.at(-1),'play-and-record');e.finish(true);let stopped=false;r.resolveMic({getTracks:()=>[{stop(){stopped=true;}}]});await pending;assert.ok(stopped);assert.equal(e.stream,null);assert.equal(r.modes.at(-1),'playback');assert.ok(!r.calls.includes('record'));}finally{r.restore();}});
