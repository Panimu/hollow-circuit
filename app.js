const PALETTES = {
  skin: [{name:'Porcelain',value:'#ebc6af'},{name:'Sand',value:'#c99976'},{name:'Bronze',value:'#a66f50'},{name:'Umber',value:'#704831'}],
  hairColor: [{name:'Midnight',value:'#242b32'},{name:'Chestnut',value:'#624135'},{name:'Silver',value:'#d1d5ce'},{name:'Copper',value:'#b56743'},{name:'Violet',value:'#78658f'}],
  accent: [{name:'Citron',value:'#d4f789'},{name:'Glacier',value:'#8cdbdf'},{name:'Orchid',value:'#c2a5ec'},{name:'Ember',value:'#f1a375'},{name:'Rose',value:'#e99fb9'}]
};
const defaults = [
  {name:'Nova',role:'Player',age:26,skin:1,hairColor:2,accent:0,hair:'Ponytail',outfit:'Scout',gear:'Bracers',restraints:[],clothing:[],posePreference:'auto',view:'front'},
  {name:'Vesper',role:'Enemy',age:28,skin:0,hairColor:0,accent:2,hair:'Bob',outfit:'Sentinel',gear:'Pauldrons',restraints:[],clothing:[],posePreference:'auto',view:'front'}
];
let characters = structuredClone(defaults), selected = 0, tab = 'appearance';
const allowed={hair:['Ponytail','Bob','Crop'],outfit:['Scout','Sentinel','Runner'],gear:['Bracers','Pauldrons','None']};
const R = RestraintSystem, W = WardrobeSystem;
let clothingSlot='feet';
let material = 'Rope', selectedItem = 'rope-toes', selectedMethod = 'knot', condition = 'alert', actionPoints = 6;
let regionFilter = 'All', slotFilter = 'all';
let trialLog = [];
try {const data=JSON.parse(localStorage.getItem('hollow-circuit-roster'));const saved=Array.isArray(data)?data:data?.characters;if(Array.isArray(saved)&&saved.length===2) characters=defaults.map((base,i)=>{const c={...base};for(const key of Object.keys(PALETTES))if(Number.isInteger(saved[i]?.[key])&&PALETTES[key][saved[i][key]])c[key]=saved[i][key];for(const key of Object.keys(allowed))if(allowed[key].includes(saved[i]?.[key]))c[key]=saved[i][key];c.restraints=R.migrate(saved[i]);c.clothing=W.sanitize(saved[i]?.clothing);if(Object.hasOwn(AvatarSystem.poses,saved[i]?.posePreference))c.posePreference=saved[i].posePreference;if(['front','rear'].includes(saved[i]?.view))c.view=saved[i].view;return c;});}catch{}
function doll(c,id){return AvatarSystem.render(c,id,PALETTES,R,W);}
function stats(c){const base={Scout:[2,5],Sentinel:[5,2],Runner:[1,6]}[c.outfit];return {guard:base[0]+(c.gear==='Pauldrons'?2:c.gear==='Bracers'?1:0),speed:Number((base[1]*(1-R.penalties(c).movement/100)).toFixed(1))};}
function render(){
 document.querySelector('#roster').innerHTML=characters.map((c,i)=>{const s=stats(c);return `<div class="character-panel"><button class="avatar-card ${i===selected?'selected':''} ${i===1?'enemy':''}" data-character="${i}" aria-pressed="${i===selected}" aria-label="Edit ${c.name}, ${c.role}"><div class="card-top"><span class="tag">${i===0?'01 / PLAYER':'02 / ENEMY'}</span><span class="selection-dot">${i===selected?'✓':''}</span></div><div class="state-label">${c.restraints.length?`◇ ${R.occupiedSlots(c).length} / ${R.slots.length} SLOTS RESTRAINED`:'● READY'}</div><div class="doll-wrap">${doll(c,i)}</div><div class="card-bottom"><div class="card-name"><h3>${c.name}</h3><span>LVL 01</span></div><p class="class-name">${c.outfit} class · ${c.age} years</p><div class="stats"><span>GUARD <b>${s.guard}</b></span><span>SPEED <b>${s.speed}</b></span><span>RECOVERY <b>${100-R.penalties(c).recovery}%</b></span></div></div></button><div class="avatar-quick-actions"><button class="quick-random" data-random-restraints="${i}" aria-label="Random restraints for ${c.name}">↻ Random restraints</button><button class="quick-clear" data-clear-restraints="${i}" aria-label="Clear restraints from ${c.name}" ${c.restraints.length?'':'disabled'}>Clear</button></div><p class="avatar-pose-caption">${AvatarSystem.resolvePose(c).name} · ${c.view==='rear'?'Rear':'Front'} view</p></div>`;}).join('');
 const c=characters[selected];document.querySelector('#editor-title').textContent=c.name;document.querySelector('#editor-role').textContent=`${c.role} avatar / ${c.outfit} class`;
 document.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===tab);b.setAttribute('aria-selected',b.dataset.tab===tab);});
 const choice=(key,label)=>`<div class="control"><div class="control-label">${label}</div><div class="choices">${allowed[key].map(v=>`<button class="choice ${c[key]===v?'active':''}" data-key="${key}" data-value="${v}" aria-pressed="${c[key]===v}">${v}</button>`).join('')}</div></div>`;
 const swatches=(key,label)=>`<div class="control"><div class="control-label">${label}<small>${PALETTES[key][c[key]].name}</small></div><div class="swatches">${PALETTES[key].map((p,i)=>`<button class="swatch ${c[key]===i?'active':''}" style="--color:${p.value}" data-key="${key}" data-value="${i}" aria-label="${label}: ${p.name}" title="${p.name}" aria-pressed="${c[key]===i}"></button>`).join('')}</div></div>`;
 document.querySelector('#controls').innerHTML=tab==='appearance'?swatches('skin','Skin tone')+choice('hair','Hair style')+swatches('hairColor','Hair color')+swatches('accent','Accent color'):tab==='equipment'?choice('outfit','Suit class')+choice('gear','Equipment')+'<p class="helper">Scout balances defense and movement. Sentinel favors armor; Runner favors speed. Pauldrons add 2 guard, bracers add 1.</p>':`<div class="control-label">Current performance <small>${R.occupiedSlots(c).length} / ${R.slots.length} slots</small></div>${performance(c)}<p class="helper">Open the restraint lab below to apply equipment, inspect debuffs, or attempt an escape. Penalties add together, capped at 85% per attribute.</p><a class="lab-link" href="#restraint-lab">Open restraint lab ↓</a>`;
 renderLab();
 renderWardrobe();
}
document.querySelector('#roster').addEventListener('click',e=>{
 const random=e.target.closest('[data-random-restraints]'),clear=e.target.closest('[data-clear-restraints]');
 if(random||clear){
  selected=Number(random?random.dataset.randomRestraints:clear.dataset.clearRestraints);
  const c=characters[selected];c.restraints=random?R.randomLoadout():[];c.posePreference='auto';
  logTrial(`${random?'Random preview':'Cleared restraints'} for ${c.name}: ${c.restraints.length} items. No AP spent.`);
  changed();return;
 }
 const b=e.target.closest('[data-character]');if(b){selected=Number(b.dataset.character);render();}
});
document.querySelector('.tabs').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b){tab=b.dataset.tab;render();}});
function changed(){document.querySelector('#save-status').textContent='Unsaved changes · Preview updated.';render();}
document.querySelector('#controls').addEventListener('click',e=>{const b=e.target.closest('[data-key]');if(b){characters[selected][b.dataset.key]=PALETTES[b.dataset.key]?Number(b.dataset.value):b.dataset.value;changed();}});
document.querySelector('#randomize').addEventListener('click',()=>{const c=characters[selected];for(const key of Object.keys(PALETTES))c[key]=Math.floor(Math.random()*PALETTES[key].length);c.hair=allowed.hair[Math.floor(Math.random()*allowed.hair.length)];changed();});
document.querySelector('#save').addEventListener('click',()=>{try{localStorage.setItem('hollow-circuit-roster',JSON.stringify({version:5,characters}));document.querySelector('#save-status').textContent='Roster and restraints saved on this browser.';}catch{document.querySelector('#save-status').textContent='Storage unavailable. Your preview still works.';}});
function effectsList(effects) {
 return Object.entries(effects).filter(([,value])=>value>0).map(([key,value])=>`<span class="debuff">−${value}% ${R.attributes[key]}</span>`).join('');
}
function performance(c) {
 return `<div class="performance">${Object.entries(R.penalties(c)).map(([key,value])=>`<div class="performance-row"><div><span>${R.attributes[key]}</span><b>${100-value}%</b></div><div class="meter"><span style="width:${Math.min(100,100-value)}%" class="${value>0?'reduced':''}"></span></div></div>`).join('')}</div>`;
}
function coveragePanel(target,item) {
 const occupied=new Set(R.occupiedSlots(target));
 return `<div class="coverage-panel"><div class="control-label">Occupies ${item.slots.length} ${item.slots.length===1?'slot':'slots'}</div><div class="coverage-chips">${item.slots.map(slot=>`<span class="coverage-chip ${occupied.has(slot)?'blocked':''}">${R.getSlot(slot).label} · ${occupied.has(slot)?'occupied':'free'}</span>`).join('')}</div>${item.slots.length>1?'<p class="helper">One item, one application roll. Modifiers apply once; escape or release frees every covered slot.</p>':''}</div>`;
}
function renderLab() {
 const target=characters[selected],actor=characters[1-selected],p=R.profile(selectedItem,selectedMethod);
 const blocked=R.conflicts(target,p.item.id), occupied=blocked.length>0;
 const chance=R.applyChance(actor,selectedItem,selectedMethod,condition,target);
 const disabled=occupied||actionPoints<p.cost;
 document.querySelector('#lab-targets').innerHTML=characters.map((c,i)=>`<button class="choice ${selected===i?'active':''}" data-target="${i}" aria-pressed="${selected===i}">${c.name} · ${c.role}</button>`).join('');
 document.querySelector('#material-tabs').innerHTML=R.materials.map(value=>`<button class="material-tab ${material===value?'active':''}" data-material="${value}" aria-pressed="${material===value}"><span class="material-dot ${value.toLowerCase()}"></span>${value}<small>${R.catalog.filter(item=>item.material===value).length}</small></button>`).join('');
 document.querySelector('#region-filters').innerHTML=['All',...R.regions].map(region=>`<button class="choice ${regionFilter===region?'active':''}" data-region="${region}" aria-pressed="${regionFilter===region}">${region==='All'?'All regions':region}</button>`).join('');
 const visibleSlots=R.slotDefinitions.filter(slot=>regionFilter==='All'||slot.region===regionFilter);
 document.querySelector('#slot-filter').innerHTML='<option value="all">All slots in region</option>'+visibleSlots.map(slot=>`<option value="${slot.id}">${slot.label}</option>`).join('');
 document.querySelector('#slot-filter').value=slotFilter;
 const items=filteredCatalog();
 document.querySelector('#catalog-count').textContent=`${items.length} of ${R.catalog.length} items · ${R.slots.length} body slots`;
 document.querySelector('#restraint-catalog').innerHTML=items.map(item=>`<button class="restraint-card ${selectedItem===item.id?'active':''}" data-item="${item.id}" aria-pressed="${selectedItem===item.id}"><span class="catalog-slot">${item.slots.length>1?`${item.slots.length} slots`:R.getSlot(item.slot).label} <span>${item.cost} AP</span></span><strong>${item.name}</strong><p>${item.description}</p><div class="coverage-summary">${item.slots.map(slot=>R.getSlot(slot).label).join(" · ")}</div><div class="debuff-list">${effectsList(item.effects)}</div><div class="catalog-rating"><span>Apply <b>${item.difficulty}</b></span><span>Escape <b>${item.escape}</b></span><span>/ 100</span></div></button>`).join('');
 document.querySelector('#restraint-detail').innerHTML=`<div class="eyebrow">${p.item.material.toUpperCase()} / ${p.item.slots.length>1?`${p.item.slots.length} SLOTS`:R.getSlot(p.item.slot).label.toUpperCase()}</div><h3>${p.item.name}</h3>${coveragePanel(target,p.item)}<p class="clothing-impact">Clothing: ${W.protection(target,p.item.slots)>0?"−":"+"}${Math.abs(W.protection(target,p.item.slots))} points to application chance</p><div class="control"><div class="control-label">Securing method</div><div class="choices">${R.methodsFor(p.item).map(([id,m])=>`<button class="choice ${selectedMethod===id?'active':''}" data-method="${id}" aria-pressed="${selectedMethod===id}">${m.name}</button>`).join('')}</div><p class="helper">${p.method.description}</p></div><div class="debuff-list">${effectsList(p.effects)}</div><div class="detail-ratings"><div><strong>${p.difficulty}</strong><span>Apply difficulty</span></div><div><strong>${p.escape}</strong><span>Escape difficulty</span></div><div><strong>${p.cost} <small>AP</small></strong><span>Attempt cost</span></div></div><div class="control"><div class="control-label">Target condition <small>Trial modifier</small></div><div class="choices">${Object.entries(R.conditions).map(([id,c])=>`<button class="choice ${condition===id?'active':''}" data-condition="${id}" aria-pressed="${condition===id}">${c.name}</button>`).join('')}</div></div><div class="odds"><span>${actor.name} → ${target.name}<small>Application success</small></span><strong>${chance}%</strong></div><button class="primary apply-button" data-action="apply" ${disabled?'disabled':''}>${occupied?'Overlapping equipment':`Attempt application · ${p.cost} AP`}</button><p class="helper action-help">${occupied?`Release ${blocked.map(entry=>`${entry.name} (${entry.slots.map(slot=>R.getSlot(slot).label).join(', ')})`).join('; ')} first. No AP spent on conflicts.`:actionPoints<p.cost?'Refill action points to try this item.':`Both success and failure spend ${p.cost} AP. ${actor.name}'s dexterity and focus affect these odds.`}</p>`;
 document.querySelector('#trial-budget').textContent=`${actionPoints} / 6 AP`;
 document.querySelector('#loadout-title').textContent=`${target.name}'s loadout · ${target.restraints.length} ${target.restraints.length===1?'item':'items'} · ${R.occupiedSlots(target).length} / ${R.slots.length} slots`;
 document.querySelector('#active-restraints').innerHTML=R.slots.map(slot=>{
  const entry=target.restraints.find(value=>R.getItem(value.itemId).slots.includes(slot));
  if(!entry)return `<div class="loadout-slot empty"><span class="catalog-slot">${R.getSlot(slot).label}</span><span>Unrestrained</span><button class="release-button" data-browse-slot="${slot}">Browse equipment</button></div>`;
  const current=R.profile(entry.itemId,entry.methodId);
  return `<div class="loadout-slot"><span class="catalog-slot">${R.getSlot(slot).label} <span class="material-dot ${current.item.material.toLowerCase()}"></span></span><strong>${current.item.name}</strong>${current.item.slots.length>1?`<span class="linked-note">Linked ${current.item.slots.length}-slot item · modifiers counted once</span>`:""}<small>${current.method.name} · Escape difficulty ${current.escape}/100</small><div class="debuff-list">${effectsList(current.effects)}</div><div class="loadout-actions"><button class="choice" data-escape="${entry.itemId}" ${actionPoints<2?'disabled':''}>Escape${current.item.slots.length>1?" item":""} ${R.escapeChance(target,entry)}% · 2 AP</button><button class="release-button" data-release="${entry.itemId}" aria-label="Lab release ${current.item.name} from all covered slots">${current.item.slots.length>1?"Release item":"Release"}</button></div></div>`;
 }).join('');
 document.querySelector('#aggregate-effects').innerHTML=performance(target);
 document.querySelector('#release-all').disabled=!characters.some(c=>c.restraints.length);
 document.querySelector('#trial-log').innerHTML=trialLog.length?trialLog.map(entry=>`<li class="${entry.kind}">${entry.text}</li>`).join(''):'<li class="muted">Choose a target, restraint and securing method, then attempt application.</li>';
}
function logTrial(text,kind='neutral') {trialLog.unshift({text,kind});trialLog=trialLog.slice(0,6);}
function filteredCatalog(){return R.catalog.filter(item=>item.material===material&&(regionFilter==='All'||item.slots.some(slot=>R.getSlot(slot).region===regionFilter))&&(slotFilter==='all'||item.slots.includes(slotFilter)));}
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
 if(d.material){const family=selectedItem.replace(/^(rope|leather|steel)-/,'');material=d.material;selectedItem=`${material.toLowerCase()}-${family}`;syncCatalogSelection();renderLab();return;}
 if(d.region){regionFilter=d.region;slotFilter='all';syncCatalogSelection();renderLab();return;}
 if(d.browseSlot){slotFilter=d.browseSlot;regionFilter=R.getSlot(slotFilter).region;syncCatalogSelection();renderLab();document.querySelector('#catalog-filters').scrollIntoView({block:'start'});return;}
 if(d.item){selectedItem=d.item;renderLab();return;}
 if(d.method){selectedMethod=d.method;renderLab();return;}
 if(d.condition){condition=d.condition;renderLab();return;}
 if(d.action==='refill'){actionPoints=6;logTrial('Trial budget refilled to 6 AP. Equipped restraints stay in place.');renderLab();return;}
 if(d.action==='release-all'){characters.forEach(c=>c.restraints=[]);logTrial('Lab override: all restraints released from both avatars.');changed();return;}
 if(d.release){target.restraints=target.restraints.filter(entry=>entry.itemId!==d.release);logTrial(`Lab override: ${R.getItem(d.release).name} released from ${target.name} across all its covered slots.`);changed();return;}
 if(d.action==='apply'||d.escape){
  const result=d.escape?R.attemptEscape({target,itemId:d.escape,ap:actionPoints}):R.attemptApply({target,actor,itemId:selectedItem,methodId:selectedMethod,condition,ap:actionPoints});
  if(!result.accepted){logTrial(result.reason,'failure');renderLab();return;}
  target.restraints=result.restraints;actionPoints=result.ap;
  const item=R.getItem(d.escape||selectedItem);
  const outcome=d.escape?`${target.name} ${result.success?'escaped':'failed to escape'} ${item.name}`:`${actor.name} ${result.success?'applied':'failed to apply'} ${item.name} to ${target.name} (${R.methods[selectedMethod].name})`;
  logTrial(`${outcome}. Roll ${result.roll} / needed ≤ ${result.chance}.`,result.success?'success':'failure');changed();
 }
});
function renderWardrobe(){
 const c=characters[selected],pose=AvatarSystem.resolvePose(c),mod=W.modifiers(c);
 document.querySelector('#pose-controls').innerHTML=`<div class="control-label">Pose <small>${pose.manual?'Manual preview':'Equipment driven'} · ${pose.name}</small></div><div class="choices">${Object.entries(AvatarSystem.poses).map(([id,name])=>`<button class="choice ${c.posePreference===id?'active':''}" data-pose="${id}" aria-pressed="${c.posePreference===id}">${name}</button>`).join('')}</div><div class="view-controls"><span>View</span>${['front','rear'].map(view=>`<button class="choice ${c.view===view?'active':''}" data-view="${view}" aria-pressed="${c.view===view}">${view==='front'?'Front':'Rear'}</button>`).join('')}</div><p class="helper">Automatic: boots bring legs together, arm sleeves place arms behind, and training frames set a kneeling pose. Manual poses are visual previews only.</p>`;
 document.querySelector('#wardrobe-targets').innerHTML=characters.map((c,i)=>`<button class="choice ${selected===i?'active':''}" data-wear-target="${i}" aria-pressed="${selected===i}">${c.name} · ${c.role}</button>`).join('');
 document.querySelector('#clothing-slot').innerHTML=W.slots.map(slot=>`<option value="${slot.id}">${slot.label}</option>`).join('');
 document.querySelector('#clothing-slot').value=clothingSlot;
 document.querySelector('#wardrobe-summary').textContent=`${c.name} · ${c.clothing.length} garments · Potential clear reward ${100+mod.reward} credits (100 base)`;
 document.querySelector('#clothing-catalog').innerHTML=W.catalog.filter(item=>item.slots.includes(clothingSlot)).map(item=>{
  const worn=c.clothing.includes(item.id),effect=Object.entries(item.effects).map(([key,value])=>`${value>0?'−':'+'}${Math.abs(value)}% ${R.attributes[key]}`).join(' · ');
  return `<article class="wear-card ${worn?'equipped':''}"><div class="catalog-slot">${W.slots.find(slot=>slot.id===item.slot).label}<span>${item.style==='trial'?'TRIAL BONUS':'REINFORCED'}</span></div><h3>${item.name}</h3><p>${item.description}</p><p class="helper">Protection applies to: ${item.protectionSlots.map(slot=>R.getSlot(slot).label).join(", ")}</p><div class="wear-stats"><span>Application chance <b>${item.protection>0?'−':'+'}${Math.abs(item.protection)} pts</b></span><span>${effect}</span><span>Potential reward <b>+${item.reward}%</b></span></div><button class="${worn?'secondary':'primary'}" ${worn?`data-unwear="${item.id}"`:`data-wear="${item.id}"`}>${worn?'Remove garment':'Wear garment'}</button></article>`;
 }).join('');
 document.querySelector('#clothing-loadout').innerHTML=c.clothing.length?`<div class="control-label">${c.name}'s clothing <small>Click a garment to remove</small></div><div class="choices">${c.clothing.map(id=>`<button class="choice" data-unwear="${id}">${W.getItem(id).name} ×</button>`).join('')}</div>`:'<p class="helper">Base simulator suit equipped. Add garments above.</p>';
}
document.querySelector('#pose-controls').addEventListener('click',e=>{
 const button=e.target.closest('button');if(!button)return;
 if(button.dataset.pose)characters[selected].posePreference=button.dataset.pose;
 if(button.dataset.view)characters[selected].view=button.dataset.view;
 changed();
});
document.querySelector('#clothing-slot').addEventListener('change',e=>{clothingSlot=e.target.value;renderWardrobe();});
document.querySelector('#wardrobe').addEventListener('click',e=>{
 const button=e.target.closest('button');if(!button)return;
 const d=button.dataset,c=characters[selected];
 if(d.wearTarget!==undefined){selected=Number(d.wearTarget);render();return;}
 if(d.wear)c.clothing=W.equip(c,d.wear);
 if(d.unwear)c.clothing=c.clothing.filter(id=>id!==d.unwear);
 if(d.wear||d.unwear)changed();
});
render();
