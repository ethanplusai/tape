import {chromium} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
import {decodeProject} from '../public/tape-audio/project.mjs';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.micRequests=0;const get=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=(...args)=>{window.micRequests++;return get(...args);};});
 await page.goto(process.env.TAPE_URL||'http://127.0.0.1:4293');await page.evaluate(()=>document.fonts.ready);
 const deck=page.locator('[data-tape-deck]'),dial=page.locator('[data-session-bpm]');
 async function choose(label){for(let i=0;i<8;i++){if(await deck.getAttribute('data-menu-item')===label){await dial.click();return;}await dial.press('ArrowUp');}throw Error(`Missing menu item ${label}`);}
 async function sound(layer,group,name){await page.locator(`[data-session-level="${layer}"]`).click();await dial.click();await choose('SOUND');await choose(group);await choose(name);}
 async function source(layer,id){await page.waitForFunction(({layer,id})=>document.querySelector('[data-tape-deck]').dataset.sources.split(',')[layer]===id,{layer,id},{timeout:7000});}
 await page.locator('[data-session-play]').click();await source(0,'room-dust');
 await sound(1,'BASS','ROUND');await source(1,'room-round');
 await sound(2,'CHORDS','FELT');await source(2,'room-felt');
 await sound(3,'TEXTURE','GLASS');await source(3,'room-glass');
 assert.equal(await deck.getAttribute('data-tracks'),'1111');assert.equal(await deck.getAttribute('data-mic'),'false');assert.equal(await page.evaluate(()=>window.micRequests),0);
 await page.waitForFunction(()=>Number(document.querySelector('[data-tape-deck]').dataset.outputRms)>.02);
 // Browse without changing sound; the only browser is the physical amber display.
 await page.locator('[data-tape-inspect="controls"]').click();await dial.click();await choose('SOUND');await choose('TEXTURE');await dial.press('ArrowUp');
 assert.equal(await deck.getAttribute('data-menu-item'),'SHAKER');assert.equal((await deck.getAttribute('data-sources')).split(',')[3],'room-glass');
 assert.equal(await page.locator('[data-session-display]').evaluate(e=>!!e.closest('[data-tape-deck]')),true);
 await fs.mkdir('test-results',{recursive:true});await page.screenshot({path:'test-results/library-screen-desktop.png'});
 await dial.click();await source(3,'room-shaker');await page.locator('[data-session-undo]').click();await source(3,'room-glass');
 // OFF affects the selected layer; undo restores it.
 await dial.click();await choose('SOUND');await choose('OFF');await source(3,'off');assert.equal(await deck.getAttribute('data-tracks'),'1110');await page.locator('[data-session-undo]').click();await source(3,'room-glass');
 // Pitch and length of all library parts use the same native tempo, even when loaded later.
 await dial.press('ArrowUp');await sound(2,'CHORDS','HAZE');await source(2,'room-haze');assert.equal(await deck.getAttribute('data-bpm'),'97');
 await dial.click();await choose('SESSION');const downloadEvent=page.waitForEvent('download');await choose('SAVE');const file=await downloadEvent;await file.saveAs('test-results/library.tape');
 const bytes=await fs.readFile('test-results/library.tape'),saved=decodeProject(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),48000);
 assert.deepEqual(saved.state.tracks.map(t=>t.source),['room-dust','room-round','room-haze','room-glass']);assert.ok(saved.state.tracks.every(t=>t.samples.length===240000));
 // Exact gestures also work on a narrow touch screen, without a separate sound picker.
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await mobile.goto(process.env.TAPE_URL||'http://127.0.0.1:4293');await mobile.locator('[data-tape-inspect="controls"]').tap();await mobile.waitForTimeout(900);
 const md=mobile.locator('[data-session-bpm]');await md.tap();await md.tap();assert.equal(await mobile.locator('[data-tape-deck]').getAttribute('data-menu-item'),'BASS');await md.tap();
 assert.equal(await mobile.locator('[data-tape-deck]').getAttribute('data-menu'),'BASS');await mobile.screenshot({path:'test-results/library-screen-mobile.png'});await md.tap();
 await mobile.waitForFunction(()=>document.querySelector('[data-tape-deck]').dataset.sources==='room-dust,room-round,off,off');
 assert.equal(await mobile.locator('[data-tape-deck]').getAttribute('data-playing'),'false');await mobile.locator('[data-session-play]').tap();await mobile.waitForFunction(()=>Number(document.querySelector('[data-tape-deck]').dataset.outputRms)>.001);
 assert.deepEqual(errors,[]);await mobile.close();
 console.log('PASS: four-layer library through hardware controls, browse/press semantics, bar changes, off/undo, native tempo, saved source identity, no microphone, mobile touch.');
}finally{await browser.close();}
