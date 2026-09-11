import test from 'node:test';import assert from 'node:assert/strict';
import {sounds,groups,libraryLoop} from '../public/tape-audio/library.mjs';
import {TapeCore} from '../public/tape-audio/core.mjs';
import {encodeProject,decodeProject} from '../public/tape-audio/project.mjs';
const rms=a=>Math.sqrt(a.reduce((s,v)=>s+v*v,0)/a.length);
test('twelve distinct original loops share one native phrase and bounded useful levels',()=>{
 const fingerprints=new Set();assert.equal(sounds.length,12);assert.equal(groups.length,4);
 for(const s of sounds){const a=libraryLoop(s.id,8000),b=libraryLoop(s.id,8000);assert.deepEqual(a,b);assert.equal(a.beats,8);assert.equal(a.samples.length,40000);assert.ok(a.samples.every(v=>Number.isFinite(v)&&Math.abs(v)<.8));assert.ok(rms(a.samples)>.025);assert.ok(rms(a.samples)<.15);fingerprints.add(Buffer.from(a.samples.buffer).toString('base64'));}
 assert.equal(fingerprints.size,12);assert.throws(()=>libraryLoop('missing',8000));
});
test('a sound change waits for the sample-clock bar, affects only its layer, and crossfades',()=>{
 const c=new TapeCore(8000);c.bpm=120;c.load(0,new Float32Array(32000).fill(.3),8,'old');c.load(1,new Float32Array(32000).fill(.1),8,'custom');const other=c.tracks[1].samples;c.playing=true;c.beat=3.99;
 c.command({type:'queue-load',index:0,samples:new Float32Array(32000).fill(-.3),beats:8,source:'room-dust'});assert.equal(c.tracks[0].source,'old');assert.equal(c.snapshot().tracks[0].queuedSource,'room-dust');
 c.process(null,new Float32Array(39));assert.equal(c.tracks[0].source,'old');c.process(null,new Float32Array(3));assert.equal(c.tracks[0].source,'room-dust');assert.equal(c.snapshot().tracks[0].queuedSource,null);assert.equal(c.tracks[1].samples,other);assert.ok(c.tracks[0].swap?.left>0);
 const out=new Float32Array(200);c.process(null,out);assert.equal(c.tracks[0].swap,null);assert.ok(out.every(Number.isFinite));assert.ok(out.every((v,i)=>!i||Math.abs(v-out[i-1])<.02));
 c.undo(0);assert.equal(c.tracks[0].source,'old');c.redo(0);assert.equal(c.tracks[0].source,'room-dust');
});
test('queued sounds cancel with undo, latest choice wins, pause applies, and recording is protected',()=>{
 const c=new TapeCore(8000),a=libraryLoop('room-felt',8000),b=libraryLoop('room-haze',8000);c.playing=true;c.beat=1;
 c.command({type:'queue-load',index:2,...a});c.command({type:'queue-load',index:2,...b});assert.equal(c.pendingLoads[2].source,'room-haze');c.undo(2);assert.equal(c.pendingLoads[2],null);assert.ok(!c.tracks[2].samples);
 c.command({type:'queue-load',index:2,...a});c.startRecord(1,8);assert.equal(c.recording,null);c.command({type:'play',value:false});assert.equal(c.tracks[2].source,'room-felt');assert.equal(c.pendingLoads[2],null);
 c.startRecord(1,8);c.command({type:'queue-load',index:2,...b});assert.equal(c.pendingLoads[2],null);assert.equal(c.tracks[2].source,'room-felt');c.finishRecord(true);
 c.command({type:'queue-load',index:2,samples:null,beats:8,source:null});c.command({type:'play',value:false});assert.ok(!c.tracks[2].samples);c.undo(2);assert.equal(c.tracks[2].source,'room-felt');
});
test('all library sources survive save/load and share varispeed after tempo changes',()=>{
 const c=new TapeCore(8000);['room-dust','room-round','room-felt','room-glass'].forEach((id,i)=>{const p=libraryLoop(id,8000);c.load(i,p.samples,p.beats,p.source);});c.bpm=144;c.playing=true;
 const out=new Float32Array(24000);c.process(null,out);assert.ok(rms(out)>.035);assert.ok(Math.max(...out)<.8);assert.ok(c.tracks.every(t=>t.samples.length===40000&&t.beats===8));
 const {state}=decodeProject(encodeProject(c.exportState()).buffer,16000);assert.equal(state.bpm,144);state.tracks.forEach((t,i)=>{assert.equal(t.source,c.tracks[i].source);assert.equal(t.samples.length,80000);});
});
