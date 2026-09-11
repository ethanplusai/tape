import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {decodeProject} from '../public/tape-audio/project.mjs';
const browser=await chromium.launch({headless:true,args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--autoplay-policy=no-user-gesture-required']});
const context=await browser.newContext({viewport:{width:1440,height:900},permissions:['microphone']});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await fs.mkdir('test-results',{recursive:true});
try{
 await page.goto(process.env.TAPE_URL||'http://127.0.0.1:4293/');await page.evaluate(()=>document.fonts.ready);
 const deck=page.locator('[data-tape-deck]'),dial=page.locator('[data-session-bpm]');
 await page.waitForFunction(()=>Number(document.querySelector('[data-tape-deck]').dataset.actualRpm)>5);
 assert.equal(await deck.getAttribute('data-playing'),'false');assert.equal(await deck.getAttribute('data-mic'),'false');
 await page.screenshot({path:'test-results/desktop.png'});
 await page.locator('[data-session-level="0"]').click();
 await dial.click();assert.equal(await deck.getAttribute('data-menu'),'MAIN');assert.equal(await deck.getAttribute('data-menu-item'),'SOUND');
 // A normal press with slight hand movement enters the highlighted item once.
 let b=await dial.boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2+3,b.y+b.height/2+2);await page.mouse.up();
 assert.equal(await deck.getAttribute('data-menu'),'SOUND');assert.equal(await deck.getAttribute('data-menu-item'),'DRUMS');await dial.click();assert.equal(await deck.getAttribute('data-menu'),'DRUMS');assert.equal(await deck.getAttribute('data-menu-item'),'DUST');
 // Turning only browses; release never activates the item.
 b=await dial.boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2+21,b.y+b.height/2,{steps:10});await page.mouse.up();
 assert.equal(await deck.getAttribute('data-menu'),'DRUMS');assert.equal(await deck.getAttribute('data-menu-item'),'PULSE');
 await dial.click();await page.waitForFunction(()=>document.querySelector('[data-tape-deck]').dataset.baseSound==='room-pulse');
 assert.equal(await deck.getAttribute('data-menu'),'closed');
 await page.locator('[data-session-play]').click();await page.waitForFunction(()=>document.querySelector('[data-tape-deck]').dataset.playing==='true');
 await page.waitForFunction(()=>Number(document.querySelector('[data-tape-deck]').dataset.outputRms)>.005);
 assert.equal(await deck.getAttribute('data-tracks'),'1000');await page.locator('[data-session-level="1"]').click();assert.equal(await deck.getAttribute('data-selected-layer'),'2');
 await page.locator('[data-session-record]').click();await page.waitForFunction(()=>document.querySelector('[data-tape-deck]').dataset.recording==='recording',null,{timeout:12000});
 await page.waitForTimeout(600);await page.locator('[data-session-record]').click();
 await page.waitForFunction(()=>document.querySelector('[data-tape-deck]').dataset.tracks==='1100');
 assert.equal(await deck.getAttribute('data-mic'),'false');
 await page.locator('[data-session-level="0"]').click();await dial.click();await dial.click();await dial.press('ArrowUp');await dial.press('ArrowUp');await dial.press('ArrowUp');await dial.press('ArrowUp');await dial.click();
 await page.waitForFunction(()=>document.querySelector('[data-tape-deck]').dataset.baseSound==='off'&&document.querySelector('[data-tape-deck]').dataset.tracks==='0100');assert.equal(await deck.getAttribute('data-tracks'),'0100');
 // Restore a base, then record into it: destructive base replacement asks first.
 await dial.click();await dial.click();await dial.click();await dial.click();await page.waitForFunction(()=>document.querySelector('[data-tape-deck]').dataset.baseSound==='room-dust');
 await page.locator('[data-session-level="0"]').click();await page.locator('[data-session-record]').click();await page.waitForFunction(()=>document.querySelector('[data-tape-deck]').dataset.recording==='recording',null,{timeout:12000});await page.waitForTimeout(300);await page.locator('[data-session-record]').click();
 await page.waitForFunction(()=>document.querySelector('[data-tape-deck]').dataset.baseSound==='custom');await dial.click();await dial.click();await dial.click();await dial.press('ArrowUp');await dial.click();assert.equal(await deck.getAttribute('data-menu'),'REPLACE L1');assert.equal(await deck.getAttribute('data-base-sound'),'custom');await dial.click();assert.equal(await deck.getAttribute('data-menu'),'DRUMS');assert.equal(await deck.getAttribute('data-base-sound'),'custom');
 await dial.press('Escape');await dial.press('Escape');await dial.press('Escape');
 // Round-trip a real download through the on-device session menu.
 const sessionMenu=async()=>{await dial.click();for(let i=0;i<3;i++)await dial.press('ArrowUp');await dial.click();assert.equal(await deck.getAttribute('data-menu'),'SESSION');};
 await sessionMenu();const downloadEvent=page.waitForEvent('download');await dial.click();const download=await downloadEvent;await download.saveAs('test-results/roundtrip.tape');const bytes=await fs.readFile('test-results/roundtrip.tape');const saved=decodeProject(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),48000);assert.equal(saved.state.tracks[0].source,'custom');assert.ok(saved.state.tracks[1].samples.length>0);
 await sessionMenu();for(let i=0;i<4;i++)await dial.press('ArrowUp');await dial.click();assert.equal(await deck.getAttribute('data-menu'),'NEW SESSION');await dial.press('ArrowUp');await dial.click();await page.waitForFunction(()=>document.querySelector('[data-tape-deck]').dataset.tracks==='0000');
 await sessionMenu();await dial.press('ArrowUp');await dial.click();await dial.press('ArrowUp');const chooseEvent=page.waitForEvent('filechooser');await dial.click();const choose=await chooseEvent;await choose.setFiles('test-results/roundtrip.tape');await page.waitForFunction(()=>document.querySelector('[data-tape-deck]').dataset.tracks==='1100');assert.equal(await deck.getAttribute('data-base-sound'),'custom');assert.equal(await deck.getAttribute('data-playing'),'false');
 // Resume before the pause/focus assertion below.
 await page.locator('[data-session-play]').click();await page.waitForFunction(()=>document.querySelector('[data-tape-deck]').dataset.playing==='true');
 // Keyboard tempo and pointer focus retain the designed controls without a red outline.
 await dial.press('ArrowUp');assert.equal(await deck.getAttribute('data-bpm'),'97');
 await page.locator('[data-session-play]').click();await page.waitForFunction(()=>document.querySelector('[data-tape-deck]').dataset.playing==='false');
 assert.equal(await page.locator('[data-session-play]').evaluate(e=>getComputedStyle(e).outlineStyle),'none');
 await page.locator('[data-tape-inspect="controls"]').click();await page.waitForTimeout(850);await dial.click();await page.screenshot({path:'test-results/controls-menu.png'});
 await page.locator('[data-tape-inspect="controls"]').click();await dial.press('Escape');
 await page.locator('#experience').scrollIntoViewIfNeeded();await page.waitForTimeout(300);assert.equal(Math.round((await page.locator('.p-nav').boundingBox()).y),0);await page.screenshot({path:'test-results/instructions.png'});
 for(const size of [{width:1280,height:720},{width:390,height:844},{width:768,height:1024}]){
  await page.setViewportSize(size);await page.goto(process.env.TAPE_URL||'http://127.0.0.1:4293/');await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:`test-results/viewport-${size.width}.png`});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal document overflow');
 }
 // Values set before the first audio gesture survive engine startup.
 await page.goto(process.env.TAPE_URL||'http://127.0.0.1:4293/');await dial.press('ArrowUp');await dial.press('ArrowUp');await page.locator('[data-session-level="0"]').press('ArrowDown');await page.locator('[data-session-play]').click();await page.waitForFunction(()=>document.querySelector('[data-tape-deck]').dataset.playing==='true');assert.equal(await deck.getAttribute('data-bpm'),'98');assert.equal(await page.locator('[data-session-level="0"]').getAttribute('aria-valuenow'),'74');
 // Touch clicks use the same push-to-enter semantics.
 const touch=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const mobile=await touch.newPage();await mobile.goto(process.env.TAPE_URL||'http://127.0.0.1:4293/');await mobile.locator('[data-tape-inspect="controls"]').tap();await mobile.waitForTimeout(1100);await mobile.locator('[data-session-bpm]').tap();assert.equal(await mobile.locator('[data-tape-deck]').getAttribute('data-menu'),'MAIN');await mobile.locator('[data-session-bpm]').tap();assert.equal(await mobile.locator('[data-tape-deck]').getAttribute('data-menu'),'SOUND');await mobile.screenshot({path:'test-results/mobile-menu.png'});await touch.close();
 assert.deepEqual(errors,[]);console.log('PASS: startup spin/silence, click/drag/touch menus, real audio, mic recording, per-layer library/off, replace confirmation, tempo, sticky nav, viewport overflow.');
}finally{await browser.close();}
