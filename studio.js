/* Independent appearance studio; does not alter the simulation lab save. */
(() => {
  const A=IllustratedAvatar,R=RestraintSystem,key='hollow-circuit-studio-v1';
  let roster=A.defaults();
  try {const saved=JSON.parse(localStorage.getItem(key));if(saved?.version===1 && Array.isArray(saved.roster)) roster=roster.map((_,i)=>A.sanitize(saved.roster[i],i));} catch {}
  const names=['Nova','Vesper'],details=[false,false];
  const selection=[{item:'rope-wrists',method:'knot'},{item:'leather-ankles',method:'buckle'}];
  const status=document.querySelector('#status'),root=document.querySelector('#characters');
  const option=(value,label,current)=>`<option value="${value}"${value===current?' selected':''}>${label}</option>`;
  function card(i) {
    root.insertAdjacentHTML('beforeend',`<article class="character" id="character-${i}" aria-labelledby="name-${i}"><div class="card-head"><div><p>${i?'OPPONENT':'PLAYER'} / ADULT · 20</p><h2 id="name-${i}">${names[i]}</h2></div><span class="badge">ILLUSTRATED</span></div><div class="stage"><div class="art" id="art-${i}" style="width:100%;height:100%"></div><span class="stage-label">FRONT / STANDING</span><button class="zoom" data-action="zoom" data-index="${i}" aria-pressed="false">Face & torso</button></div><div class="preview-actions"><button data-action="equipment" data-index="${i}">↻ Random restraints</button><button data-action="clear" data-index="${i}">Clear</button></div><div class="editor"><fieldset><legend>01 / Appearance</legend><div class="controls">${Object.entries(A.options).map(([k,opts])=>`<label>${{skin:'Skin tone',style:'Hair style',hair:'Hair colour',outfit:'Outfit'}[k]}<select aria-label="${names[i]} ${k}" data-look="${k}" data-index="${i}">${Object.entries(opts).map(([v,l])=>option(v,l,roster[i][k])).join('')}</select></label>`).join('')}</div><div class="small-actions"><button data-action="look" data-index="${i}">Random look</button><button data-action="reset" data-index="${i}">Reset character</button></div></fieldset><details open><summary>02 / Equipment fitting</summary><div class="fit-row"><label>Equipment<select id="item-${i}" data-item="${i}">${A.catalog.map(item=>option(item.id,`${item.material} · ${R.getSlot(item.slot).label}`,selection[i].item)).join('')}</select></label><label>Securing method<select id="method-${i}" data-method="${i}"></select></label><label>Preview mode<select disabled aria-label="Fitting mode"><option>Free fitting</option></select></label></div><p class="rating" id="rating-${i}"></p><button class="fit-button" data-action="fit" data-index="${i}">Fit selected equipment</button><ul class="equipped" id="equipped-${i}"></ul><div class="stats" id="stats-${i}"></div><p class="helper">Fitting replaces the same location. Ratings use the existing rules; no AP is spent here. Outfits are cosmetic in this studio. Save to keep both characters on this browser.</p></details></div></article>`);
    methods(i);paint(i);
  }
  function methods(i) {
    const methods=R.methodsFor(R.getItem(selection[i].item));
    if(!methods.some(([id])=>id===selection[i].method))selection[i].method=methods[0][0];
    document.querySelector(`#method-${i}`).innerHTML=methods.map(([id,m])=>option(id,m.name,selection[i].method)).join('');rating(i);
  }
  function rating(i) {
    const p=R.profile(selection[i].item,selection[i].method);
    document.querySelector(`#rating-${i}`).textContent=`Application difficulty ${p.difficulty} · Escape difficulty ${p.escape} · ${p.cost} AP in simulation. ${Object.entries(p.effects).filter(([,v])=>v).map(([k,v])=>`${R.attributes[k]} −${v}%`).join(' · ')}`;
  }
  function paint(i) {
    document.querySelector(`#art-${i}`).innerHTML=A.render(roster[i],i,details[i]);
    document.querySelector(`#equipped-${i}`).innerHTML=roster[i].restraints.length?roster[i].restraints.map(e=>{const item=R.getItem(e.itemId);return `<li><div>${item.name}<small>${R.methods[e.methodId].name} · ${R.getSlot(item.slot).label}</small></div><button data-remove="${item.id}" data-index="${i}" aria-label="Remove ${item.name} from ${names[i]}">Remove</button></li>`;}).join(''):'<li class="empty">No equipment fitted.</li>';
    const penalties=R.penalties(roster[i]);
    document.querySelector(`#stats-${i}`).innerHTML=Object.entries(R.attributes).map(([k,label])=>`<div class="stat"><span>${label}</span><strong>${100-penalties[k]}%</strong></div>`).join('');
  }
  function sync(i){for(const k of Object.keys(A.options))document.querySelector(`[data-index="${i}"][data-look="${k}"]`).value=roster[i][k];paint(i);}
  root.addEventListener('change',event=>{
    const el=event.target;
    if(el.dataset.look){const i=Number(el.dataset.index);roster[i][el.dataset.look]=el.value;paint(i);status.textContent=`${names[i]} updated. Save both characters to keep this look.`;}
    if(el.dataset.item!==undefined){const i=Number(el.dataset.item);selection[i].item=el.value;methods(i);}
    if(el.dataset.method!==undefined){const i=Number(el.dataset.method);selection[i].method=el.value;rating(i);}
  });
  root.addEventListener('click',event=>{
    const el=event.target.closest('button');if(!el)return;const i=Number(el.dataset.index);
    if(el.dataset.remove){roster[i].restraints=roster[i].restraints.filter(e=>e.itemId!==el.dataset.remove);paint(i);document.querySelector(`#character-${i} [data-action="fit"]`).focus();}
    switch(el.dataset.action){
      case 'zoom':details[i]=!details[i];el.setAttribute('aria-pressed',String(details[i]));el.textContent=details[i]?'Full figure':'Face & torso';paint(i);return;
      case 'equipment':roster[i].restraints=A.randomEquipment();paint(i);break;
      case 'clear':roster[i].restraints=[];paint(i);break;
      case 'look':for(const k of Object.keys(A.options)){const values=Object.keys(A.options[k]);roster[i][k]=values[Math.floor(Math.random()*values.length)];}sync(i);break;
      case 'reset':roster[i]=A.defaults()[i];sync(i);break;
      case 'fit':roster[i]=A.equip(roster[i],selection[i].item,selection[i].method);paint(i);break;
    }
    status.textContent=`${names[i]} updated. Save both characters to keep your changes.`;
  });
  document.querySelector('#save').addEventListener('click',()=>{try{localStorage.setItem(key,JSON.stringify({version:1,roster}));status.textContent='Both characters saved on this browser.';}catch{status.textContent='This browser could not save. Keep this tab open to retain your current looks.';}});
  async function load(){
    const retry=document.querySelector('#retry');retry.hidden=true;status.textContent='Loading illustration layers…';
    try{await Promise.all(A.assets.map(name=>new Promise((resolve,reject)=>{const img=new Image();img.onload=resolve;img.onerror=reject;img.src=A.path(name);})));root.innerHTML='';card(0);card(1);document.querySelector('#save').disabled=false;status.textContent='Ready. Change either character independently; save to keep your looks.';}
    catch{status.textContent='Some artwork could not load. Check your connection and retry.';retry.hidden=false;}
  }
  document.querySelector('#retry').addEventListener('click',load);load();
})();
