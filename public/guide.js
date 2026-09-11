import {features} from './guide-data.mjs';
const tabs=[...document.querySelectorAll('[data-guide-tab]')],panel=document.querySelector('#guide-panel');
function choose(id,focus=false){const feature=features.find(f=>f.id===id);if(!feature)return;
 tabs.forEach(tab=>{const selected=tab.dataset.guideTab===id;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;if(selected&&focus)tab.focus();});
 panel.setAttribute('aria-labelledby',`guide-tab-${id}`);panel.dataset.feature=id;
 const image=panel.querySelector('[data-guide-image]');image.style.setProperty('--zoom',feature.scale);image.style.setProperty('--camera-x',feature.x+'%');image.style.setProperty('--camera-y',feature.y+'%');image.alt=`TAPE product photograph: ${feature.label.toLowerCase()}`;
 for(const [name,value]of [['tag',feature.tag],['title',feature.title],['description',feature.description],['photo-number',String(features.indexOf(feature)+1).padStart(2,'0')]])panel.querySelector(`[data-guide-${name}]`).textContent=value;
 const steps=panel.querySelector('[data-guide-steps]');steps.replaceChildren(...feature.steps.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));panel.querySelector('[data-guide-try]').dataset.guideTry=id;
}
for(const [index,tab]of tabs.entries()){
 tab.addEventListener('click',()=>choose(tab.dataset.guideTab));
 tab.addEventListener('keydown',e=>{let next;if(['ArrowRight','ArrowDown'].includes(e.key))next=(index+1)%tabs.length;if(['ArrowLeft','ArrowUp'].includes(e.key))next=(index+tabs.length-1)%tabs.length;if(e.key==='Home')next=0;if(e.key==='End')next=tabs.length-1;if(next!==undefined){e.preventDefault();choose(tabs[next].dataset.guideTab,true);}});
}
panel?.querySelector('[data-guide-try]').addEventListener('click',e=>{e.preventDefault();const feature=features.find(f=>f.id===e.currentTarget.dataset.guideTry);document.dispatchEvent(new CustomEvent('tape:guide',{detail:{inspect:feature.inspect,menu:feature.menu,id:feature.id,keyboard:e.detail===0}}));});
const visual=document.querySelector('[data-loop-visual]');if(visual)new IntersectionObserver(entries=>{for(const entry of entries)entry.target.classList.toggle('in-view',entry.isIntersecting);},{threshold:.1}).observe(visual);
