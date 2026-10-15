/* Playable rules view. Artwork fitting keeps its own saved roster. */
(()=>{
 const R=RestraintSystem,key='hollow-circuit-restraint-trial-v1',names=['Nova','Vesper'];
 let roster=[{restraints:[]},{restraints:[]}],targetIndex=1,ap=6,slot='wrists',selected='rope-wrists',method='knot',condition='alert',action='tool',history=[];
 try{const saved=JSON.parse(localStorage.getItem(key));if(saved?.version===1&&Array.isArray(saved.roster))roster=roster.map((_,i)=>({restraints:R.sanitize(saved.roster[i]?.restraints)}));}catch{}
 const $=id=>document.getElementById(id),target=()=>roster[targetIndex],actor=()=>roster[1-targetIndex];
 const chips=effects=>Object.entries(effects).filter(([,n])=>n).map(([key,n])=>`<span>${R.attributes[key]} −${n}%</span>`).join('');
 const counters=item=>item.slots.map(s=>R.slotRules[s].label).join(' · ');
 const option=(id,label,current)=>`<option value="${id}"${id===current?' selected':''}>${label}</option>`;
 function log(text,kind='neutral'){history.unshift({text,kind});history=history.slice(0,8);}
 function choose(id){selected=id;const item=R.getItem(id);slot=item.slot;if(!R.methodsFor(item).some(([id])=>id===method))method=R.methodsFor(item)[0][0];render();}
 function render(){
  $('targets').innerHTML=names.map((name,i)=>`<button data-target="${i}" aria-pressed="${i===targetIndex}"><strong>${name}</strong><small>${R.occupiedSlots(roster[i]).length} / 18 slots restrained${i===targetIndex?' · TARGET':' · APPLYING'}</small></button>`).join('');
  $('ap').textContent=`${ap} / 6 AP`;
  const occupied=new Set(R.occupiedSlots(target()));
  $('slots').innerHTML=R.regions.map(region=>`<p class="slot-region">${region}</p><div class="slot-row">${R.slotDefinitions.filter(s=>s.region===region).map(s=>`<button class="slot-button" data-slot="${s.id}" data-occupied="${occupied.has(s.id)}" aria-pressed="${slot===s.id}">${s.label}<small>${occupied.has(s.id)?'RESTRAINED':'3 OPTIONS'}</small></button>`).join('')}</div>`).join('');
  $('slot-title').textContent=R.getSlot(slot).label;
  $('slot-state').textContent=occupied.has(slot)?'Occupied · escape or release first':'Unrestrained';
  $('catalog').innerHTML=R.catalog.filter(item=>item.slot===slot&&item.slots.length===1).map(item=>`<button class="item-card" data-item="${item.id}" aria-pressed="${selected===item.id}"><strong>${item.name}</strong><span>${item.material} · ${item.cost} AP</span><small>Apply ${item.difficulty} / Escape ${item.escape} · Counters ${counters(item).toLowerCase()}</small></button>`).join('');
  $('assembly').innerHTML=option('','Choose an assembly',selected)+R.catalog.filter(item=>item.slots.length>1).map(item=>option(item.id,`${item.name} · ${item.slots.length} slots`,selected)).join('');
  const p=R.profile(selected,method),conflicts=R.conflicts(target(),selected),chance=R.applyChance(actor(),selected,method,condition,target());
  $('detail').innerHTML=`<p class="eyebrow">${p.item.material.toUpperCase()} / SELECTED RESTRAINT</p><h3>${p.item.name}</h3><p>${p.item.description}</p><p>Covers ${p.item.slots.map(s=>R.getSlot(s).label).join(', ')}.</p><div class="counter">Counters: ${counters(p.item)}</div><div class="debuffs">${chips(p.effects)}</div><div class="fields"><label>Securing method<select id="method">${R.methodsFor(p.item).map(([id,m])=>option(id,m.name,method)).join('')}</select></label><label>Target condition<select id="condition">${Object.entries(R.conditions).map(([id,c])=>option(id,c.name,condition)).join('')}</select></label></div><p class="method-help">${p.method.description} Escape difficulty ${p.escape}/100.</p><div class="odds"><span>${names[1-targetIndex]} → ${names[targetIndex]}<br>Application success · ${p.cost} AP</span><strong>${chance}%</strong></div><button class="primary" id="apply"${conflicts.length||ap<p.cost?' disabled':''}>${conflicts.length?'Location already occupied':`Attempt application · ${p.cost} AP`}</button><p class="help">${conflicts.length?`Release ${conflicts.map(c=>c.name).join(', ')} first. Overlap never spends AP.`:`Both success and failure spend ${p.cost} AP. Stronger closures can also be added after application.`}</p>`;
  $('loadout-title').textContent=`${names[targetIndex]} · ${target().restraints.length} active ${target().restraints.length===1?'restraint':'restraints'}`;
  const penalties=R.penalties(target());
  $('performance').innerHTML=Object.entries(R.attributes).map(([id,label])=>`<div><span>${label}</span><strong>${100-penalties[id]}%</strong></div>`).join('');
  $('loadout').innerHTML=target().restraints.length?target().restraints.map(entry=>{
   const current=R.profile(entry.itemId,entry.methodId),upgrades=R.securingOptions(target(),entry.itemId);
   return `<article data-active="${entry.itemId}"><h3>${current.item.name}</h3><p class="location">${current.item.slots.map(s=>R.getSlot(s).label).join(' · ')} / ${current.method.name}</p><div class="counter">Blocked: ${counters(current.item)}</div><div class="debuffs">${chips(current.effects)}</div><div class="controls"><button data-escape="${entry.itemId}"${ap<2?' disabled':''}>Escape ${R.escapeChance(target(),entry)}% · 2 AP</button><button class="quiet" data-release="${entry.itemId}">Lab release</button></div>${upgrades.length?`<div class="upgrade"><p>Strengthen this restraint</p>${upgrades.map(([id,m])=>{const secure=R.secureProfile(actor(),target(),entry.itemId,id,condition);return `<button data-secure="${entry.itemId}" data-method="${id}"${ap<secure.cost?' disabled':''}>${m.name} · ${secure.chance}% · ${secure.cost} AP</button>`;}).join('')}</div>`:'<p class="help">Strongest compatible closure fitted.</p>'}</article>`;
  }).join(''):'<p class="empty">No active restraints. Choose a location and attempt application. Each occupied slot will counter a specific action.</p>';
  $('clear').disabled=!target().restraints.length;
  $('action').innerHTML=R.actions.map(a=>option(a.id,`${a.label}${R.actionStatus(target(),a.id).allowed?'':' · blocked'}`,action)).join('');
  const state=R.actionStatus(target(),action);
  $('action-status').textContent=state.reason;$('action-status').dataset.blocked=String(!state.allowed);
  $('attempt-action').disabled=!state.allowed||ap<state.action.cost;
  $('attempt-action').textContent=state.allowed?`Attempt ${state.action.label.toLowerCase()} · ${state.action.cost} AP`:'Action blocked';
  $('log').innerHTML=history.length?history.map(h=>`<li data-kind="${h.kind}">${h.text}</li>`).join(''):'<li>Choose a target, a location and a securing method to begin.</li>';
 }
 function resolve(result,text){
  if(!result.accepted){log(result.reason,'failure');render();return;}
  ap=result.ap;if(result.restraints)target().restraints=result.restraints;
  log(`${text}: ${result.success?'success':'failed'} · rolled ${result.roll} against ${result.chance}%. ${ap} AP left.`,result.success?'success':'failure');
  render();$('status').textContent='Trial updated. Save loadouts to keep both characters on this browser.';
 }
 document.addEventListener('change',event=>{
  const el=event.target;
  if(el.id==='method'){method=el.value;render();}
  if(el.id==='condition'){condition=el.value;render();}
  if(el.id==='action'){action=el.value;render();}
  if(el.id==='assembly'&&el.value)choose(el.value);
 });
 document.addEventListener('click',event=>{
  const el=event.target.closest('button');if(!el)return;const d=el.dataset;
  if(d.target!==undefined){targetIndex=Number(d.target);render();return;}
  if(d.slot){choose(`rope-${d.slot}`);return;}
  if(d.item){choose(d.item);return;}
  if(d.escape){resolve(R.attemptEscape({target:target(),itemId:d.escape,ap}),`${names[targetIndex]} escaping ${R.getItem(d.escape).name}`);return;}
  if(d.secure){resolve(R.attemptSecure({actor:actor(),target:target(),itemId:d.secure,methodId:d.method,condition,ap}),`${names[1-targetIndex]} adding ${R.methods[d.method].name} to ${R.getItem(d.secure).name}`);return;}
  if(d.release){target().restraints=target().restraints.filter(e=>e.itemId!==d.release);log(`Lab release: ${R.getItem(d.release).name} removed from ${names[targetIndex]}. No AP spent.`);render();return;}
  switch(el.id){
   case 'apply':resolve(R.attemptApply({actor:actor(),target:target(),itemId:selected,methodId:method,condition,ap}),`${names[1-targetIndex]} applying ${R.getItem(selected).name} to ${names[targetIndex]}`);break;
   case 'attempt-action':resolve(R.attemptAction({target:target(),actionId:action,ap}),`${names[targetIndex]} attempting ${R.actions.find(a=>a.id===action).label}`);break;
   case 'refill':ap=6;log('Trial budget refilled. Both loadouts remain equipped.');render();break;
   case 'clear':target().restraints=[];log(`Lab release: all restraints removed from ${names[targetIndex]}. No AP spent.`);render();break;
   case 'save':try{localStorage.setItem(key,JSON.stringify({version:1,roster}));$('status').textContent='Both restraint loadouts saved on this browser.';}catch{$('status').textContent='This browser could not save. Keep this tab open to retain the loadouts.';}break;
  }
 });
 render();$('status').textContent='Ready. Select a slot to compare its rope, leather and steel restraints.';
})();
