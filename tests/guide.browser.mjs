import {chromium} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {features} from '../public/guide-data.mjs';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1813,height:960}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{const Original=window.AudioContext;window.audioStarts=0;window.AudioContext=class extends Original{constructor(...args){super(...args);window.audioStarts++;if(window.delayWorklet){const add=this.audioWorklet.addModule.bind(this.audioWorklet);this.audioWorklet.addModule=async(...args)=>{window.workletDelayed=true;await new Promise(r=>setTimeout(r,1400));return add(...args);};}}};});
 await page.goto(process.env.TAPE_URL||'http://127.0.0.1:4293');await page.evaluate(()=>document.fonts.ready);await fs.mkdir('test-results',{recursive:true});
 const h=await page.locator('.tp-hero-heading').boundingBox();assert.ok(h.x>100&&h.x<170,'Deliberate wide-screen hero inset');
 assert.equal(await page.locator('.tp-product-caption>span,.ts-use-note').count(),0);assert.equal(await page.locator('.p-nav-cta').textContent(),'Learn the controls');
 await page.screenshot({path:'test-results/refined-hero.png'});
 for(const f of features){
  await page.locator(`[data-guide-tab="${f.id}"]`).click();assert.equal(await page.locator('[data-guide-title]').textContent(),f.title);await page.waitForTimeout(760);
  if(['play','layers','arm','save'].includes(f.id)){await page.locator('#experience').scrollIntoViewIfNeeded();await page.screenshot({path:`test-results/guide-${f.id}.png`});}
  await page.locator('[data-guide-try]').click();await page.waitForTimeout(800);assert.equal(await page.locator('[data-tape-deck]').getAttribute('data-inspect'),f.inspect);
  if(f.menu)assert.equal(await page.locator('[data-tape-deck]').getAttribute('data-menu'),f.menu);
  if(['disc','arm'].includes(f.id)){const control=page.locator(`[data-session-${f.id}]`);const box=await control.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=1813,'Focused control remains in viewport');}
  assert.equal(await page.evaluate(()=>window.audioStarts),0,'Learning never starts audio or requests the mic');
 }
 await page.locator('#setup').scrollIntoViewIfNeeded();await page.waitForTimeout(300);assert.equal(await page.locator('.tw-panel').evaluate(e=>e.classList.contains('in-view')),true);await page.screenshot({path:'test-results/loop-visual.png'});
 await page.locator('[data-motion-toggle]').click();assert.equal(await page.locator('.tw-playhead i').evaluate(e=>getComputedStyle(e).animationPlayState),'paused');await page.locator('[data-motion-toggle]').click();
 for(const width of [320,390,768]){
  await page.setViewportSize({width,height:844});await page.goto(process.env.TAPE_URL||'http://127.0.0.1:4293');await page.evaluate(()=>document.fonts.ready);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No mobile overflow');
  const built=page.locator('.built-by');assert.equal(await built.evaluate(e=>getComputedStyle(e).whiteSpace),'nowrap');assert.ok((await built.boundingBox()).height<20,'Credit stays on one line');
  const nav=await page.locator('.p-nav-cta').boundingBox();assert.ok(nav.x+nav.width<=width,'Header action fits');
  await page.screenshot({path:`test-results/refined-mobile-${width}.png`});
  await page.locator('[data-guide-tab="layers"]').click();await page.waitForTimeout(800);await page.locator('#guide-panel').scrollIntoViewIfNeeded();await page.screenshot({path:`test-results/guide-mobile-${width}.png`});
  await page.locator('[data-guide-tab="sounds"]').click();await page.locator('[data-guide-try]').click();await page.waitForTimeout(900);assert.equal(await page.locator('[data-tape-deck]').getAttribute('data-menu'),'SOUND');
  await page.locator('[data-tape-inspect="full"]').click();assert.equal(await page.locator('[data-tape-deck]').getAttribute('data-inspect'),'');
  await page.locator('#setup').scrollIntoViewIfNeeded();await page.screenshot({path:`test-results/waves-mobile-${width}.png`});
 }
 // Loading over a slow network still resumes synchronously in the tap that starts playback.
 await page.setViewportSize({width:390,height:844});await page.goto(process.env.TAPE_URL||'http://127.0.0.1:4293');
 await page.evaluate(()=>window.delayWorklet=true);
 await page.locator('[data-start-deck]').click();await page.waitForFunction(()=>Number(document.querySelector('[data-tape-deck]').dataset.outputRms)>.001,null,{timeout:10000});assert.ok(await page.evaluate(()=>window.workletDelayed));assert.equal(await page.locator('[data-tape-deck]').getAttribute('data-tracks'),'1000');assert.deepEqual(errors,[]);
 console.log('PASS: all nine guide features, safe hero links, balanced gutters, mobile credit, wave animation/reduced motion control, delayed audio startup.');
}finally{await browser.close();}
