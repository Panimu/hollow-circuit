const PALETTES = {
  skin: [{name:'Porcelain',value:'#ebc6af'},{name:'Sand',value:'#c99976'},{name:'Bronze',value:'#a66f50'},{name:'Umber',value:'#704831'}],
  hairColor: [{name:'Midnight',value:'#242b32'},{name:'Chestnut',value:'#624135'},{name:'Silver',value:'#d1d5ce'},{name:'Copper',value:'#b56743'},{name:'Violet',value:'#78658f'}],
  accent: [{name:'Citron',value:'#d4f789'},{name:'Glacier',value:'#8cdbdf'},{name:'Orchid',value:'#c2a5ec'},{name:'Ember',value:'#f1a375'},{name:'Rose',value:'#e99fb9'}]
};
const defaults = [
  {name:'Nova',role:'Player',age:26,skin:1,hairColor:2,accent:0,hair:'Ponytail',outfit:'Scout',gear:'Bracers',restraints:[]},
  {name:'Vesper',role:'Enemy',age:28,skin:0,hairColor:0,accent:2,hair:'Bob',outfit:'Sentinel',gear:'Pauldrons',restraints:[]}
];
let characters = structuredClone(defaults), selected = 0, tab = 'appearance';
const allowed={hair:['Ponytail','Bob','Crop'],outfit:['Scout','Sentinel','Runner'],gear:['Bracers','Pauldrons','None']};
const R = RestraintSystem;
let material = 'Rope', selectedItem = 'rope-toes', selectedMethod = 'knot', condition = 'alert', actionPoints = 6;
let regionFilter = 'All', slotFilter = 'all';
let trialLog = [];
try {const data=JSON.parse(localStorage.getItem('hollow-circuit-roster'));const saved=Array.isArray(data)?data:data?.characters;if(Array.isArray(saved)&&saved.length===2) characters=defaults.map((base,i)=>{const c={...base};for(const key of Object.keys(PALETTES))if(Number.isInteger(saved[i]?.[key])&&PALETTES[key][saved[i][key]])c[key]=saved[i][key];for(const key of Object.keys(allowed))if(allowed[key].includes(saved[i]?.[key]))c[key]=saved[i][key];c.restraints=R.migrate(saved[i]);return c;});}catch{}
function restraintArt(c) {
 return c.restraints.map(entry => {
  const item=R.getItem(entry.itemId), color={Rope:'#d3b785',Leather:'#a7704e',Steel:'#b9cbd4'}[item.material];
  const slot=R.getSlot(item.slot), width=slot.width, height=['mouth','toes','fingers','head'].includes(item.slot)?8:12;
  const band=(x,y)=> item.material==='Rope'
   ? `<path d="M${x-width/2} ${y-height/2}q${width/2} 4 ${width} 0m${-width} ${height/2}q${width/2} 4 ${width} 0m${-width} ${height/2}q${width/2} 4 ${width} 0" fill="none" stroke="${color}" stroke-width="2.5"/>`
   : `<rect x="${x-width/2}" y="${y-height/2}" width="${width}" height="${height}" rx="${item.material==='Steel'?4:2}" fill="${color}" stroke="#293238" stroke-width="1.5"/><path d="M${x-3} ${y-3}h6v6h-6Z" fill="none" stroke="${item.material==='Steel'?'#effaff':'#e1c59c'}" stroke-width="1.5"/>`;
  const isLocked=['padlock','double'].includes(entry.methodId);
  let art, lockX, lockY;
  if(slot.pair){
   const [left,right,y]=slot.pair;lockX=150;lockY=Math.min(y+12,415);
   art=`${band(left,y)}${band(right,y)}<path d="M${left+width/2} ${y+3}Q150 ${lockY+4} ${right-width/2} ${y+3}" fill="none" stroke="${color}" stroke-width="2" ${item.material==='Steel'?'stroke-dasharray="4 3"':''}/>`;
  }else{
   const [x,y]=slot.center;lockX=x+width/2-4;lockY=y;
   art=band(x,y);
   if(['face','mouth'].includes(item.slot))art+=`<path d="M${x-7} ${y-2}v4m4-4v4m6-4v4m4-4v4" stroke="#20323a" stroke-width="1.5"/>`;
  }
  const lock=isLocked?`<g transform="translate(${lockX} ${lockY})"><path d="M-3 0v-3a3 3 0 0 1 6 0v3" fill="none" stroke="#f0d78c" stroke-width="1.5"/><rect x="-5" y="-1" width="10" height="8" rx="2" fill="#d7b667"/><circle cx="0" cy="3" r="1" fill="#453f2c"/></g>`:'';
  return `<g data-restraint="${item.id}" data-slot="${slot.id}"><title>${slot.label}: ${item.name} · ${R.methods[entry.methodId].name}</title>${art}${lock}</g>`;
 }).join('');
}
function doll(c, id) {
 const skin=PALETTES.skin[c.skin].value,hair=PALETTES.hairColor[c.hairColor].value,a=PALETTES.accent[c.accent].value;
 const armor=c.outfit==='Sentinel'?'#555b61':c.outfit==='Runner'?'#343e44':'#424b40';
 return `<svg viewBox="0 0 300 450" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${c.name}, adult ${c.outfit.toLowerCase()} avatar, ${c.restraints.length} restraints"><defs><linearGradient id="suit-${id}" x1="0" x2="1"><stop stop-color="#222c2d"/><stop offset=".5" stop-color="${armor}"/><stop offset="1" stop-color="#252d30"/></linearGradient></defs>
 <g data-layer="platform"><ellipse cx="150" cy="416" rx="95" ry="22" fill="#080d0d" opacity=".5"/><ellipse cx="150" cy="410" rx="91" ry="19" fill="none" stroke="${a}" opacity=".25"/><ellipse cx="150" cy="410" rx="72" ry="14" fill="none" stroke="${a}" opacity=".14"/><path d="M35 125v-15h15 M250 110h15v15 M35 340v15h15 M250 355h15v-15" fill="none" stroke="${a}" opacity=".25"/><path d="M150 70v330" stroke="${a}" stroke-dasharray="2 7" opacity=".1"/></g>
 <g data-layer="hair-back" fill="${hair}">${c.hair==='Ponytail'?'<path d="M165 91Q205 83 197 133L187 200 173 184Q191 137 169 119Z"/>':c.hair==='Bob'?'<path d="M120 87Q150 65 180 90L186 145Q149 160 114 142Z"/>':''}</g>
 <g data-layer="body" stroke="#172022" stroke-width="2" stroke-linejoin="round"><path d="M137 118v24l13 13 13-13v-24" fill="${skin}"/><path d="M123 228Q114 253 116 279L120 334 116 392 135 394 145 329 150 279 155 329 166 394 185 392 180 334 184 279Q187 251 176 228Z" fill="url(#suit-${id})"/><path d="M120 143Q102 143 98 164L91 207 80 250 94 258 111 214 121 185M180 143Q198 143 202 164L209 207 220 250 206 258 189 214 179 185" fill="url(#suit-${id})"/><path d="M80 246l-5 18 4 13 10 1 8-10-3-16M220 246l5 18-4 13-10 1-8-10 3-16" fill="${skin}"/><path d="M118 144l19-7 13 10 13-10 19 7-6 59 5 34q-31 17-62 0l5-34Z" fill="url(#suit-${id})"/><path d="M126 94Q127 75 150 75Q174 75 175 96l-3 25q-8 17-22 17t-22-17Z" fill="${skin}"/></g>
 <g data-layer="face"><path d="M133 108l10-1m14 0 10 1" stroke="${hair}" stroke-width="2" stroke-linecap="round"/><path d="M135 112h6m18 0h6" stroke="#293333" stroke-width="2.5"/><path d="M150 114l-2 7h4" fill="none" stroke="#754f40" opacity=".5"/><path d="M145 127q5 2 10-1" fill="none" stroke="#986656" stroke-width="1.5"/></g>
 <g data-layer="hair-front" fill="${hair}" stroke="#182023" stroke-width="1.5">${c.hair==='Bob'?'<path d="M121 116Q112 82 137 76Q174 64 181 96l-3 43-9-6 2-35q-22 7-34-7l-5 43-10 5Z"/>':c.hair==='Ponytail'?'<path d="M123 109Q115 75 144 72Q179 67 180 100l-7 15-3-22q-18 9-35-2l-6 23Z"/>':'<path d="M124 110Q114 85 133 76l4-9 8 5 11-7 5 8q22 3 18 29l-8 13-3-24-25 7-12-3-2 18Z"/>'}</g>
 <g data-layer="outfit" stroke-linejoin="round">${c.outfit==='Sentinel'?`<path d="M119 151l18-8 13 9 13-9 18 8-6 37-25 13-25-13Z" fill="#6b7375" stroke="#262f32" stroke-width="3"/><path d="M127 157l23 9 23-9-5 23-18 10-18-10Z" fill="${a}" opacity=".7"/><path d="M120 244l22 5-7 48-20-8m65-45-22 5 7 48 20-8" fill="#60686b" stroke="#252e31" stroke-width="3"/>`:c.outfit==='Scout'?`<path d="M121 149l16-5 7 51-19 8Z" fill="#717b62"/><path d="M165 143l13 5-49 76-8-13Z" fill="#1d2828" stroke="#738166"/><path d="M127 170h12m-13 8h13" stroke="${a}" stroke-width="3"/><path d="M174 249l10 4-2 33-15-3Z" fill="#717b62" stroke="#242e2b" stroke-width="2"/>`:`<path d="M125 149l12-5 13 43 13-43 12 5-16 54h-18Z" fill="${a}" opacity=".8"/><path d="M120 253l9 1 7 66-9 31m53-98-9 1-7 66 9 31" fill="none" stroke="${a}" stroke-width="4"/>`}
 <path d="M122 223q28 10 56 0l2 12q-30 10-60 0Z" fill="#1b2526" stroke="#76816c"/><rect x="143" y="226" width="14" height="11" rx="2" fill="${a}"/><path d="M119 335l18 2-4 54 5 14q-9 9-29 4l5-16Zm44 2 18-2 5 58 5 16q-20 5-29-4l5-14Z" fill="#202b2c" stroke="#748074" stroke-width="2"/><path d="M119 345l14 2m34 0 14-2" stroke="${a}" stroke-width="4"/></g>
 <g data-layer="equipment">${c.gear==='Bracers'?`<path d="M91 216l15 5-10 29-17-6Zm118 0-15 5 10 29 17-6Z" fill="#5b6866" stroke="#182427" stroke-width="3"/><path d="M94 224l-5 16m117-16 5 16" stroke="${a}" stroke-width="3"/>`:c.gear==='Pauldrons'?`<path d="M117 141q-19-2-23 24l20 8 11-26Zm66 0q19-2 23 24l-20 8-11-26Z" fill="#727b80" stroke="#283237" stroke-width="3"/><path d="M99 159l15 6m87-6-15 6" stroke="${a}" stroke-width="3"/>`:''}</g>
 <g data-layer="restraints">${restraintArt(c)}</g></svg>`;
}
function stats(c){const base={Scout:[2,5],Sentinel:[5,2],Runner:[1,6]}[c.outfit];return {guard:base[0]+(c.gear==='Pauldrons'?2:c.gear==='Bracers'?1:0),speed:Number((base[1]*(1-R.penalties(c).movement/100)).toFixed(1))};}
function render(){
 document.querySelector('#roster').innerHTML=characters.map((c,i)=>{const s=stats(c);return `<button class="avatar-card ${i===selected?'selected':''} ${i===1?'enemy':''}" data-character="${i}" aria-pressed="${i===selected}" aria-label="Edit ${c.name}, ${c.role}"><div class="card-top"><span class="tag">${i===0?'01 / PLAYER':'02 / ENEMY'}</span><span class="selection-dot">${i===selected?'✓':''}</span></div><div class="state-label">${c.restraints.length?`◇ ${c.restraints.length} / ${R.slots.length} SLOTS RESTRAINED`:'● READY'}</div><div class="doll-wrap">${doll(c,i)}</div><div class="card-bottom"><div class="card-name"><h3>${c.name}</h3><span>LVL 01</span></div><p class="class-name">${c.outfit} class · ${c.age} years</p><div class="stats"><span>GUARD <b>${s.guard}</b></span><span>SPEED <b>${s.speed}</b></span><span>RECOVERY <b>${100-R.penalties(c).recovery}%</b></span></div></div></button>`;}).join('');
 const c=characters[selected];document.querySelector('#editor-title').textContent=c.name;document.querySelector('#editor-role').textContent=`${c.role} avatar / ${c.outfit} class`;
 document.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===tab);b.setAttribute('aria-selected',b.dataset.tab===tab);});
 const choice=(key,label)=>`<div class="control"><div class="control-label">${label}</div><div class="choices">${allowed[key].map(v=>`<button class="choice ${c[key]===v?'active':''}" data-key="${key}" data-value="${v}" aria-pressed="${c[key]===v}">${v}</button>`).join('')}</div></div>`;
 const swatches=(key,label)=>`<div class="control"><div class="control-label">${label}<small>${PALETTES[key][c[key]].name}</small></div><div class="swatches">${PALETTES[key].map((p,i)=>`<button class="swatch ${c[key]===i?'active':''}" style="--color:${p.value}" data-key="${key}" data-value="${i}" aria-label="${label}: ${p.name}" title="${p.name}" aria-pressed="${c[key]===i}"></button>`).join('')}</div></div>`;
 document.querySelector('#controls').innerHTML=tab==='appearance'?swatches('skin','Skin tone')+choice('hair','Hair style')+swatches('hairColor','Hair color')+swatches('accent','Accent color'):tab==='equipment'?choice('outfit','Suit class')+choice('gear','Equipment')+'<p class="helper">Scout balances defense and movement. Sentinel favors armor; Runner favors speed. Pauldrons add 2 guard, bracers add 1.</p>':`<div class="control-label">Current performance <small>${c.restraints.length} / ${R.slots.length} slots</small></div>${performance(c)}<p class="helper">Open the restraint lab below to apply equipment, inspect debuffs, or attempt an escape. Penalties add together, capped at 85% per attribute.</p><a class="lab-link" href="#restraint-lab">Open restraint lab ↓</a>`;
 renderLab();
}
document.querySelector('#roster').addEventListener('click',e=>{const b=e.target.closest('[data-character]');if(b){selected=Number(b.dataset.character);render();}});
document.querySelector('.tabs').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b){tab=b.dataset.tab;render();}});
function changed(){document.querySelector('#save-status').textContent='Unsaved changes · Preview updated.';render();}
document.querySelector('#controls').addEventListener('click',e=>{const b=e.target.closest('[data-key]');if(b){characters[selected][b.dataset.key]=PALETTES[b.dataset.key]?Number(b.dataset.value):b.dataset.value;changed();}});
document.querySelector('#randomize').addEventListener('click',()=>{const c=characters[selected];for(const key of Object.keys(PALETTES))c[key]=Math.floor(Math.random()*PALETTES[key].length);c.hair=allowed.hair[Math.floor(Math.random()*allowed.hair.length)];changed();});
document.querySelector('#save').addEventListener('click',()=>{try{localStorage.setItem('hollow-circuit-roster',JSON.stringify({version:3,characters}));document.querySelector('#save-status').textContent='Roster and restraints saved on this browser.';}catch{document.querySelector('#save-status').textContent='Storage unavailable. Your preview still works.';}});
function effectsList(effects) {
 return Object.entries(effects).filter(([,value])=>value>0).map(([key,value])=>`<span class="debuff">−${value}% ${R.attributes[key]}</span>`).join('');
}
function performance(c) {
 return `<div class="performance">${Object.entries(R.penalties(c)).map(([key,value])=>`<div class="performance-row"><div><span>${R.attributes[key]}</span><b>${100-value}%</b></div><div class="meter"><span style="width:${100-value}%" class="${value?'reduced':''}"></span></div></div>`).join('')}</div>`;
}
function renderLab() {
 const target=characters[selected],actor=characters[1-selected],p=R.profile(selectedItem,selectedMethod);
 const occupied=target.restraints.some(entry=>R.getItem(entry.itemId).slot===p.item.slot);
 const chance=R.applyChance(actor,selectedItem,selectedMethod,condition);
 const disabled=occupied||actionPoints<p.cost;
 document.querySelector('#lab-targets').innerHTML=characters.map((c,i)=>`<button class="choice ${selected===i?'active':''}" data-target="${i}" aria-pressed="${selected===i}">${c.name} · ${c.role}</button>`).join('');
 document.querySelector('#material-tabs').innerHTML=R.materials.map(value=>`<button class="material-tab ${material===value?'active':''}" data-material="${value}" aria-pressed="${material===value}"><span class="material-dot ${value.toLowerCase()}"></span>${value}<small>${R.catalog.filter(item=>item.material===value).length}</small></button>`).join('');
 document.querySelector('#region-filters').innerHTML=['All',...R.regions].map(region=>`<button class="choice ${regionFilter===region?'active':''}" data-region="${region}" aria-pressed="${regionFilter===region}">${region==='All'?'All regions':region}</button>`).join('');
 const visibleSlots=R.slotDefinitions.filter(slot=>regionFilter==='All'||slot.region===regionFilter);
 document.querySelector('#slot-filter').innerHTML='<option value="all">All slots in region</option>'+visibleSlots.map(slot=>`<option value="${slot.id}">${slot.label}</option>`).join('');
 document.querySelector('#slot-filter').value=slotFilter;
 const items=filteredCatalog();
 document.querySelector('#catalog-count').textContent=`${items.length} of ${R.catalog.length} items · ${R.slots.length} body slots`;
 document.querySelector('#restraint-catalog').innerHTML=items.map(item=>`<button class="restraint-card ${selectedItem===item.id?'active':''}" data-item="${item.id}" aria-pressed="${selectedItem===item.id}"><span class="catalog-slot">${R.getSlot(item.slot).label} <span>${item.cost} AP</span></span><strong>${item.name}</strong><p>${item.description}</p><div class="debuff-list">${effectsList(item.effects)}</div><div class="catalog-rating"><span>Apply <b>${item.difficulty}</b></span><span>Escape <b>${item.escape}</b></span><span>/ 100</span></div></button>`).join('');
 document.querySelector('#restraint-detail').innerHTML=`<div class="eyebrow">${p.item.material.toUpperCase()} / ${R.getSlot(p.item.slot).label.toUpperCase()}</div><h3>${p.item.name}</h3><div class="control"><div class="control-label">Securing method</div><div class="choices">${R.methodsFor(p.item).map(([id,m])=>`<button class="choice ${selectedMethod===id?'active':''}" data-method="${id}" aria-pressed="${selectedMethod===id}">${m.name}</button>`).join('')}</div><p class="helper">${p.method.description}</p></div><div class="debuff-list">${effectsList(p.effects)}</div><div class="detail-ratings"><div><strong>${p.difficulty}</strong><span>Apply difficulty</span></div><div><strong>${p.escape}</strong><span>Escape difficulty</span></div><div><strong>${p.cost} <small>AP</small></strong><span>Attempt cost</span></div></div><div class="control"><div class="control-label">Target condition <small>Trial modifier</small></div><div class="choices">${Object.entries(R.conditions).map(([id,c])=>`<button class="choice ${condition===id?'active':''}" data-condition="${id}" aria-pressed="${condition===id}">${c.name}</button>`).join('')}</div></div><div class="odds"><span>${actor.name} → ${target.name}<small>Application success</small></span><strong>${chance}%</strong></div><button class="primary apply-button" data-action="apply" ${disabled?'disabled':''}>${occupied?'Slot already occupied':`Attempt application · ${p.cost} AP`}</button><p class="helper action-help">${occupied?`Release ${target.name}'s ${R.getSlot(p.item.slot).label.toLowerCase()} slot before applying this item.`:actionPoints<p.cost?'Refill action points to try this item.':`Both success and failure spend ${p.cost} AP. ${actor.name}'s dexterity and focus affect these odds.`}</p>`;
 document.querySelector('#trial-budget').textContent=`${actionPoints} / 6 AP`;
 document.querySelector('#loadout-title').textContent=`${target.name}'s loadout · ${target.restraints.length} / ${R.slots.length} slots`;
 document.querySelector('#active-restraints').innerHTML=R.slots.map(slot=>{
  const entry=target.restraints.find(value=>R.getItem(value.itemId).slot===slot);
  if(!entry)return `<div class="loadout-slot empty"><span class="catalog-slot">${R.getSlot(slot).label}</span><span>Unrestrained</span><button class="release-button" data-browse-slot="${slot}">Browse equipment</button></div>`;
  const current=R.profile(entry.itemId,entry.methodId);
  return `<div class="loadout-slot"><span class="catalog-slot">${R.getSlot(slot).label} <span class="material-dot ${current.item.material.toLowerCase()}"></span></span><strong>${current.item.name}</strong><small>${current.method.name} · Escape difficulty ${current.escape}/100</small><div class="debuff-list">${effectsList(current.effects)}</div><div class="loadout-actions"><button class="choice" data-escape="${entry.itemId}" ${actionPoints<2?'disabled':''}>Escape ${R.escapeChance(target,entry)}% · 2 AP</button><button class="release-button" data-release="${entry.itemId}" aria-label="Lab release ${current.item.name}">Release</button></div></div>`;
 }).join('');
 document.querySelector('#aggregate-effects').innerHTML=performance(target);
 document.querySelector('#release-all').disabled=!characters.some(c=>c.restraints.length);
 document.querySelector('#trial-log').innerHTML=trialLog.length?trialLog.map(entry=>`<li class="${entry.kind}">${entry.text}</li>`).join(''):'<li class="muted">Choose a target, restraint and securing method, then attempt application.</li>';
}
function logTrial(text,kind='neutral') {trialLog.unshift({text,kind});trialLog=trialLog.slice(0,6);}
function filteredCatalog(){return R.catalog.filter(item=>item.material===material&&(regionFilter==='All'||R.getSlot(item.slot).region===regionFilter)&&(slotFilter==='all'||item.slot===slotFilter));}
function syncCatalogSelection(){
 const items=filteredCatalog();
 if(!items.some(item=>item.id===selectedItem))selectedItem=items[0].id;
 if(!R.profile(selectedItem,selectedMethod))selectedMethod=R.methodsFor(R.getItem(selectedItem))[0][0];
}
document.querySelector('#slot-filter').addEventListener('change',e=>{slotFilter=e.target.value;syncCatalogSelection();renderLab();});
document.querySelector('#restraint-lab').addEventListener('click',e=>{
 const button=e.target.closest('button');if(!button||button.disabled)return;
 const d=button.dataset,target=characters[selected],actor=characters[1-selected];
 if(d.target!==undefined){selected=Number(d.target);render();return;}
 if(d.material){const previousSlot=R.getItem(selectedItem).slot;material=d.material;selectedItem=R.catalog.find(item=>item.material===material&&item.slot===previousSlot).id;syncCatalogSelection();renderLab();return;}
 if(d.region){regionFilter=d.region;slotFilter='all';syncCatalogSelection();renderLab();return;}
 if(d.browseSlot){slotFilter=d.browseSlot;regionFilter=R.getSlot(slotFilter).region;syncCatalogSelection();renderLab();document.querySelector('#catalog-filters').scrollIntoView({block:'start'});return;}
 if(d.item){selectedItem=d.item;renderLab();return;}
 if(d.method){selectedMethod=d.method;renderLab();return;}
 if(d.condition){condition=d.condition;renderLab();return;}
 if(d.action==='refill'){actionPoints=6;logTrial('Trial budget refilled to 6 AP. Equipped restraints stay in place.');renderLab();return;}
 if(d.action==='release-all'){characters.forEach(c=>c.restraints=[]);logTrial('Lab override: all restraints released from both avatars.');changed();return;}
 if(d.release){target.restraints=target.restraints.filter(entry=>entry.itemId!==d.release);logTrial(`Lab override: ${R.getItem(d.release).name} released from ${target.name}.`);changed();return;}
 if(d.action==='apply'||d.escape){
  const result=d.escape?R.attemptEscape({target,itemId:d.escape,ap:actionPoints}):R.attemptApply({target,actor,itemId:selectedItem,methodId:selectedMethod,condition,ap:actionPoints});
  if(!result.accepted){logTrial(result.reason,'failure');renderLab();return;}
  target.restraints=result.restraints;actionPoints=result.ap;
  const item=R.getItem(d.escape||selectedItem);
  const outcome=d.escape?`${target.name} ${result.success?'escaped':'failed to escape'} ${item.name}`:`${actor.name} ${result.success?'applied':'failed to apply'} ${item.name} to ${target.name} (${R.methods[selectedMethod].name})`;
  logTrial(`${outcome}. Roll ${result.roll} / needed ≤ ${result.chance}.`,result.success?'success':'failure');changed();
 }
});
render();
