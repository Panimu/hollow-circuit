/* Fictional simulator balance. Percentages are game attributes, not physical guidance. */
const RestraintSystem = (() => {
  const Wear=typeof WardrobeSystem!=='undefined'?WardrobeSystem:require('./wardrobe');
  const materials = ['Rope', 'Leather', 'Steel'];
  const slotDefinitions = [
    { id: 'toes', label: 'Toes', region: 'Lower body', pair: [121,179,406], width: 17 },
    { id: 'feet', label: 'Feet', region: 'Lower body', pair: [122,178,394], width: 24 },
    { id: 'ankles', label: 'Ankles', region: 'Lower body', pair: [125,175,378], width: 24 },
    { id: 'lower-leg', label: 'Lower leg', region: 'Lower body', pair: [126,174,351], width: 23 },
    { id: 'knees', label: 'Knees', region: 'Lower body', pair: [132,168,324], width: 23 },
    { id: 'upper-leg', label: 'Upper leg', region: 'Lower body', pair: [134,166,280], width: 25 },
    { id: 'waist', label: 'Waist', region: 'Upper body', center: [150,222], width: 58 },
    { id: 'chest', label: 'Chest', region: 'Upper body', center: [150,177], width: 56 },
    { id: 'shoulders', label: 'Shoulders', region: 'Upper body', pair: [113,187,153], width: 25 },
    { id: 'arms', label: 'Arms', region: 'Upper body', pair: [103,197,187], width: 24 },
    { id: 'elbows', label: 'Elbows', region: 'Upper body', pair: [97,203,213], width: 23 },
    { id: 'wrists', label: 'Wrists', region: 'Upper body', pair: [87,213,249], width: 24 },
    { id: 'hands', label: 'Hands', region: 'Upper body', pair: [84,216,263], width: 20 },
    { id: 'fingers', label: 'Fingers', region: 'Upper body', pair: [82,218,274], width: 14 },
    { id: 'neck', label: 'Neck', region: 'Head & neck', center: [150,140], width: 28 },
    { id: 'face', label: 'Face', region: 'Head & neck', center: [150,112], width: 43 },
    { id: 'mouth', label: 'Mouth', region: 'Head & neck', center: [150,128], width: 24 },
    { id: 'head', label: 'Head', region: 'Head & neck', center: [150,88], width: 52 }
  ];
  const slots = slotDefinitions.map(slot => slot.id);
  const regions = [...new Set(slotDefinitions.map(slot => slot.region))];
  const getSlot = id => slotDefinitions.find(slot => slot.id === id);
  const attributes = { movement: 'Movement', dexterity: 'Dexterity', evasion: 'Evasion', recovery: 'Energy recovery', focus: 'Focus', communication: 'Communication' };
  const methods = {
    knot: { name: 'Knot', materials: ['Rope'], difficulty: 0, escape: 0, cost: 0, effects: {}, description: 'Quick setup with the standard escape rating.' },
    cinch: { name: 'Tightening', materials: ['Rope', 'Leather'], difficulty: 10, escape: 12, cost: 1, effects: { movement: 5, dexterity: 5 }, description: 'Adds control at the cost of one extra action point.' },
    buckle: { name: 'Buckle', materials: ['Leather'], difficulty: 0, escape: 0, cost: 0, effects: {}, description: 'Fast fastening with the standard escape rating.' },
    padlock: { name: 'Padlock', materials: ['Leather', 'Steel'], difficulty: 8, escape: 20, cost: 1, effects: {}, description: 'Higher escape difficulty; adds one action point to application.' },
    latch: { name: 'Latch', materials: ['Steel'], difficulty: 0, escape: 0, cost: 0, effects: {}, description: 'Fast closure with the standard escape rating.' },
    double: { name: 'Double lock', materials: ['Steel'], difficulty: 15, escape: 28, cost: 2, effects: { evasion: 5 }, description: 'Strongest security, but slower and harder to apply.' }
  };
  const catalog = [
    { id: 'rope-wrists', name: 'Cord wrist bind', material: 'Rope', slot: 'wrists', difficulty: 24, escape: 22, cost: 2, effects: { dexterity: 25, evasion: 5 }, description: 'Light control that disrupts equipment handling.' },
    { id: 'rope-ankles', name: 'Trail snare', material: 'Rope', slot: 'ankles', difficulty: 32, escape: 28, cost: 2, effects: { movement: 30, evasion: 15 }, description: 'A mobility snare that limits quick repositioning.' },
    { id: 'rope-arms', name: 'Woven arm tether', material: 'Rope', slot: 'arms', difficulty: 42, escape: 36, cost: 3, effects: { dexterity: 30, recovery: 10 }, description: 'Slower to establish, with sustained handling pressure.' },
    { id: 'rope-lower-leg', name: 'Ranger calf weave', material: 'Rope', slot: 'lower-leg', difficulty: 46, escape: 40, cost: 3, effects: { movement: 25, evasion: 20, recovery: 5 }, description: 'Lower-leg control with a small recovery penalty.' },
    { id: 'leather-wrists', name: 'Padded wrist cuffs', material: 'Leather', slot: 'wrists', difficulty: 30, escape: 34, cost: 2, effects: { dexterity: 30, recovery: 5 }, description: 'Reliable handling suppression with flexible security.' },
    { id: 'leather-ankles', name: 'Stride straps', material: 'Leather', slot: 'ankles', difficulty: 38, escape: 40, cost: 2, effects: { movement: 35, evasion: 10 }, description: 'A stronger movement penalty with moderate setup time.' },
    { id: 'leather-arms', name: 'Warden arm bands', material: 'Leather', slot: 'arms', difficulty: 48, escape: 46, cost: 3, effects: { dexterity: 35, evasion: 10, recovery: 10 }, description: 'Balanced control across three combat attributes.' },
    { id: 'leather-lower-leg', name: 'Tracker calf straps', material: 'Leather', slot: 'lower-leg', difficulty: 44, escape: 44, cost: 3, effects: { movement: 30, evasion: 25 }, description: 'Lower-leg straps designed to counter evasive opponents.' },
    { id: 'steel-wrists', name: 'Linked steel cuffs', material: 'Steel', slot: 'wrists', difficulty: 40, escape: 48, cost: 3, effects: { dexterity: 40, evasion: 10 }, description: 'Heavy handling control with a demanding escape check.' },
    { id: 'steel-ankles', name: 'Chain ankle irons', material: 'Steel', slot: 'ankles', difficulty: 48, escape: 52, cost: 3, effects: { movement: 45, evasion: 15, recovery: 5 }, description: 'Heavy mobility control that also taxes recovery.' },
    { id: 'steel-arms', name: 'Sentinel arm clamps', material: 'Steel', slot: 'arms', difficulty: 58, escape: 58, cost: 4, effects: { dexterity: 40, evasion: 15, recovery: 15 }, description: 'High commitment control for a staggered target.' },
    { id: 'steel-lower-leg', name: 'Bastion calf braces', material: 'Steel', slot: 'lower-leg', difficulty: 62, escape: 62, cost: 4, effects: { movement: 40, evasion: 30, recovery: 10 }, description: 'Heavy lower-leg equipment with powerful movement and dodge penalties.' }
  ];
  // One independently equipable attachment per material and body slot.
  // Head attachments affect simulated focus/communications, never physical injury.
  const additions = [
    { slot: 'toes', names: ['Toe cord loops','Toe-cap straps','Toe-cap clasps'], difficulty: 28, escape: 20, cost: 2, effects: { movement: 10, evasion: 15 }, description: 'Boot-tip control that disrupts balance and footwork.' },
    { slot: 'feet', names: ['Foot cord lattice','Foot restraint wraps','Foot anchor plates'], difficulty: 32, escape: 26, cost: 2, effects: { movement: 20, recovery: 5 }, description: 'Foot control that slows travel and energy recovery.' },
    { slot: 'knees', names: ['Knee cord bands','Knee control straps','Knee limiter braces'], difficulty: 40, escape: 32, cost: 3, effects: { evasion: 25, movement: 10 }, description: 'Knee control that reduces dodging more than travel speed.' },
    { slot: 'upper-leg', names: ['Upper-leg cord weave','Upper-leg restraint straps','Upper-leg control braces'], difficulty: 44, escape: 36, cost: 3, effects: { movement: 20, evasion: 15, recovery: 5 }, description: 'Upper-leg control, separate from knees and lower legs.' },
    { slot: 'waist', names: ['Waist cord tether','Waist control belt','Waist anchor belt'], difficulty: 35, escape: 28, cost: 2, effects: { evasion: 20, movement: 10 }, description: 'Limits simulated turning and repositioning.' },
    { slot: 'chest', names: ['Chest cord lattice','Chest control harness','Chest restraint frame'], difficulty: 46, escape: 35, cost: 3, effects: { recovery: 20, evasion: 10 }, description: 'Torso equipment that taxes recovery and dodge actions.' },
    { slot: 'shoulders', names: ['Shoulder cord yoke','Shoulder restraint straps','Shoulder control frame'], difficulty: 42, escape: 34, cost: 3, effects: { dexterity: 15, recovery: 10, evasion: 5 }, description: 'Shoulder control with broad action penalties.' },
    { slot: 'elbows', names: ['Elbow cord loops','Elbow restraint bands','Elbow limiter braces'], difficulty: 38, escape: 30, cost: 2, effects: { dexterity: 20, evasion: 10 }, description: 'Elbow control independent of arms and wrists.' },
    { slot: 'hands', names: ['Hand cord lattice','Hand restraint mitts','Hand control shells'], difficulty: 34, escape: 27, cost: 2, effects: { dexterity: 25, focus: 5 }, description: 'Hand coverage disrupts item use and precise actions.' },
    { slot: 'fingers', names: ['Finger cord loops','Finger restraint tabs','Finger control clasps'], difficulty: 40, escape: 23, cost: 2, effects: { dexterity: 20, focus: 10 }, description: 'Fine-control suppression with a demanding setup check.' },
    { slot: 'neck', names: ['Woven tracking collar','Leather tracking collar','Steel tracking collar'], difficulty: 44, escape: 32, cost: 3, effects: { focus: 15, evasion: 10 }, description: 'A VR tracking attachment that disrupts focus and evasive timing.' },
    { slot: 'face', names: ['Woven interference visor','Leather interference visor','Steel interference visor'], difficulty: 48, escape: 34, cost: 3, effects: { focus: 25, evasion: 15 }, description: 'A visor that interferes with targeting and spatial cues.' },
    { slot: 'mouth', names: ['Woven voice suppressor','Leather voice suppressor','Steel voice suppressor'], difficulty: 46, escape: 33, cost: 3, effects: { communication: 45, focus: 5 }, description: 'An external VR module that weakens voice-command abilities.' },
    { slot: 'head', names: ['Woven control circlet','Leather control headband','Steel control circlet'], difficulty: 50, escape: 38, cost: 3, effects: { focus: 20, recovery: 10 }, description: 'Head equipment that disrupts concentration and energy recovery.' }
  ];
  for (const spec of additions) materials.forEach((material,index) => {
    catalog.push({ id: `${material.toLowerCase()}-${spec.slot}`, name: spec.names[index], material, slot: spec.slot,
      difficulty: spec.difficulty + [0,6,16][index], escape: spec.escape + [0,12,26][index], cost: spec.cost + (index === 2 ? 1 : 0),
      effects: Object.fromEntries(Object.entries(spec.effects).map(([key,value],i) => [key, value + (i === 0 ? index * 5 : 0)])), description: spec.description });
  });
  for (const item of catalog) item.slots = [item.slot];
  const combined = [
    { key: 'boot-wrap', names: ['Ranger boot lattice','Warden restraint boots','Bastion restraint boots'], slots: ['toes','feet','ankles','lower-leg'], difficulty: 48, escape: 38, cost: 3, effects: { movement: 45, evasion: 25, recovery: 10 }, description: 'One boot assembly covers toes, feet, ankles and lower legs.' },
    { key: 'arm-sleeve', names: ['Woven arm sleeves','Warden arm sleeves','Sentinel arm assembly'], slots: ['arms','elbows','wrists','hands','fingers'], difficulty: 52, escape: 42, cost: 3, effects: { dexterity: 50, evasion: 15, focus: 10 }, description: 'A connected sleeve controls five arm and hand slots together.' },
    { key: 'torso-rig', names: ['Woven torso rig','Tracker torso harness','Sentinel torso frame'], slots: ['shoulders','chest','waist'], difficulty: 46, escape: 36, cost: 3, effects: { recovery: 30, evasion: 25, dexterity: 10 }, description: 'A shared torso frame spans the shoulders, chest and waist.' },
    { key: 'sensor-helmet', names: ['Woven sensor hood','Leather sensor hood','Steel sensor helmet'], slots: ['head','face','neck'], difficulty: 50, escape: 40, cost: 3, effects: { focus: 40, evasion: 20, recovery: 10 }, description: 'A simulator interference assembly covers head, face and neck.' },
    { key: 'leg-frame', names: ['Woven training frame','Padded training frame','Steel training frame'], slots: ['lower-leg','knees','upper-leg'], difficulty: 54, escape: 44, cost: 3, effects: { movement: 50, evasion: 25, recovery: 10 }, description: 'A simulator training frame sets a supported kneeling pose.' }
  ];
  for (const spec of combined) materials.forEach((material,index) => {
    catalog.push({ id: `${material.toLowerCase()}-${spec.key}`, name: spec.names[index], material, slot: spec.slots[0], slots: [...spec.slots],
      difficulty: spec.difficulty + [0,6,16][index], escape: spec.escape + [0,12,26][index], cost: spec.cost + (index===2?1:0),
      effects: Object.fromEntries(Object.entries(spec.effects).map(([key,value],i)=>[key,value+(i===0?index*5:0)])), description: spec.description });
  });
  catalog.sort((a,b) => materials.indexOf(a.material)-materials.indexOf(b.material) || slots.indexOf(a.slot)-slots.indexOf(b.slot) || a.slots.length-b.slots.length);
  const conditions = { alert: { name: 'Alert', bonus: 0 }, distracted: { name: 'Distracted', bonus: 15 }, staggered: { name: 'Staggered', bonus: 30 } };
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const getItem = id => catalog.find(item => item.id === (typeof id === 'string' ? id.replace(/^(rope|leather|steel)-legs$/, '$1-lower-leg') : id));
  const methodsFor = item => ({ Rope: ['knot', 'cinch'], Leather: ['buckle', 'cinch', 'padlock'], Steel: ['latch', 'padlock', 'double'] }[item.material] || []).map(id => [id, methods[id]]);
  function sanitize(entries) {
    const result = [], occupied = new Set();
    for (const entry of Array.isArray(entries) ? entries : []) {
      const item = getItem(entry?.itemId), method = methods[entry?.methodId];
      if (!item || !method?.materials?.includes(item.material) || item.slots.some(slot=>occupied.has(slot))) continue;
      item.slots.forEach(slot=>occupied.add(slot));
      result.push({ itemId: item.id, methodId: entry.methodId });
    }
    return result;
  }
  function migrate(character) {
    if (Array.isArray(character?.restraints)) return sanitize(character.restraints);
    const old = character?.restraint;
    const ids = old === 'Stasis' ? ['steel-wrists', 'steel-ankles', 'steel-arms', 'steel-legs'] : old === 'Wrist lock' ? ['steel-wrists'] : old === 'Ankle lock' ? ['steel-ankles'] : [];
    return sanitize(ids.map(itemId => ({ itemId, methodId: 'latch' })));
  }
  function occupiedSlots(character) {
    return [...new Set(sanitize(character.restraints).flatMap(entry=>getItem(entry.itemId).slots))];
  }
  function conflicts(character, itemId) {
    const item=getItem(itemId);
    if(!item)return [];
    return sanitize(character.restraints).flatMap(entry=>{
      const existing=getItem(entry.itemId), overlap=item.slots.filter(slot=>existing.slots.includes(slot));
      return overlap.length?[{ itemId: existing.id, name: existing.name, slots: overlap }]:[];
    });
  }
  function profile(itemId, methodId) {
    const item = getItem(itemId), method = methods[methodId];
    if (!item || !method?.materials?.includes(item.material)) return null;
    const effects = {};
    for (const key of Object.keys(attributes)) effects[key] = (item.effects[key] || 0) + (method.effects[key] || 0);
    return { item, method, difficulty: item.difficulty + method.difficulty, escape: item.escape + method.escape, cost: item.cost + method.cost, effects };
  }
  function penalties(character) {
    const total = Object.fromEntries(Object.keys(attributes).map(key => [key, 0]));
    for (const entry of sanitize(character.restraints)) {
      const current = profile(entry.itemId, entry.methodId);
      for (const key of Object.keys(total)) total[key] += current.effects[key];
    }
    const clothing=Wear.modifiers(character).effects;
    for (const key of Object.keys(total)) total[key] = Math.max(-20,Math.min(85,total[key]+(clothing[key]||0)));
    return total;
  }
  function applyChance(actor, itemId, methodId, condition = 'alert', target = {}) {
    const current = profile(itemId, methodId);
    if (!current || !conditions[condition]) return 0;
    const penalty = penalties(actor);
    return clamp(Math.round(100 - current.difficulty + conditions[condition].bonus - penalty.dexterity * 0.4 - penalty.focus * 0.2 - Wear.protection(target,current.item.slots)), 5, 95);
  }
  function escapeChance(target, entry) {
    const current = profile(entry.itemId, entry.methodId);
    if (!current) return 0;
    const penalty = penalties(target);
    return clamp(Math.round(100 - current.escape - penalty.dexterity * 0.25 - penalty.focus * 0.15), 5, 90);
  }
  function attemptApply({ target, actor, itemId, methodId, condition = 'alert', ap }, random = Math.random) {
    const current = profile(itemId, methodId);
    if (!current || !conditions[condition]) return { accepted: false, reason: 'Choose a valid restraint and securing method.' };
    const entries = sanitize(target.restraints);
    const blocked=conflicts(target,current.item.id);
    if (blocked.length) return { accepted: false, reason: `Occupied: ${blocked.map(conflict=>`${conflict.slots.map(slot=>getSlot(slot).label).join(', ')} (${conflict.name})`).join('; ')}. Release overlapping equipment first.` };
    if (!Number.isFinite(ap) || ap < current.cost) return { accepted: false, reason: 'Not enough action points. Refill the trial budget.' };
    const chance = applyChance(actor, itemId, methodId, condition, target), roll = Math.floor(random() * 100) + 1, success = roll <= chance;
    return { accepted: true, success, roll, chance, ap: ap - current.cost, restraints: success ? [...entries, { itemId: current.item.id, methodId }] : entries };
  }
  function attemptEscape({ target, itemId, ap }, random = Math.random) {
    const entries = sanitize(target.restraints), entry = entries.find(value => value.itemId === itemId);
    if (!entry) return { accepted: false, reason: 'That restraint is no longer equipped.' };
    if (!Number.isFinite(ap) || ap < 2) return { accepted: false, reason: 'Escape needs 2 action points. Refill the trial budget.' };
    const chance = escapeChance(target, entry), roll = Math.floor(random() * 100) + 1, success = roll <= chance;
    return { accepted: true, success, roll, chance, ap: ap - 2, restraints: success ? entries.filter(value => value.itemId !== itemId) : entries };
  }
  function randomLoadout(random = Math.random) {
    const pick=list=>list[Math.min(list.length-1,Math.floor(random()*list.length))];
    const preset=pick([[],['boot-wrap'],['arm-sleeve'],['leg-frame'],['leg-frame','arm-sleeve']]);
    const result=[];
    const add=item=>result.push({itemId:item.id,methodId:pick(methodsFor(item))[0]});
    for(const family of preset)add(getItem(`${pick(materials).toLowerCase()}-${family}`));
    const count=3+Math.floor(random()*3);
    const candidates=catalog.filter(item=>!['boot-wrap','arm-sleeve','leg-frame'].some(family=>item.id.endsWith(`-${family}`)));
    while(result.length<count){
      const available=candidates.filter(item=>!conflicts({restraints:result},item.id).length);
      if(!available.length)break;
      add(pick(available));
    }
    return result;
  }
  // Each location counters a particular action; ordinary fallback actions and
  // escape remain available even when many locations are occupied.
  const slotRules = {
    toes: { state:'Balance disrupted', action:'precision-step', label:'Precision step', attribute:'evasion' },
    feet: { state:'Footwork anchored', action:'sprint', label:'Sprint', attribute:'movement' },
    ankles: { state:'Jump restricted', action:'jump', label:'Jump', attribute:'movement' },
    'lower-leg': { state:'Dash restricted', action:'dash', label:'Dash', attribute:'movement' },
    knees: { state:'Dodge restricted', action:'dodge', label:'Dodge roll', attribute:'evasion' },
    'upper-leg': { state:'Stride restricted', action:'lunge', label:'Lunge', attribute:'movement' },
    waist: { state:'Turning restricted', action:'pivot', label:'Quick pivot', attribute:'evasion' },
    chest: { state:'Recovery disrupted', action:'recover', label:'Recovery burst', attribute:'recovery' },
    shoulders: { state:'Overhead reach restricted', action:'overhead', label:'Overhead cast', attribute:'dexterity' },
    arms: { state:'Reach restricted', action:'reach', label:'Reach distant switch', attribute:'dexterity' },
    elbows: { state:'Parry restricted', action:'parry', label:'Weapon parry', attribute:'dexterity' },
    wrists: { state:'Tool control restricted', action:'tool', label:'Use two-handed tool', attribute:'dexterity' },
    hands: { state:'Item handling restricted', action:'item', label:'Use held item', attribute:'dexterity' },
    fingers: { state:'Gestures restricted', action:'gesture', label:'Gesture spell', attribute:'focus' },
    neck: { state:'Tracking disrupted', action:'scan', label:'Tracking scan', attribute:'focus' },
    face: { state:'Targeting disrupted', action:'aim', label:'Precision aim', attribute:'focus' },
    mouth: { state:'Spoken spells disabled', action:'spoken', label:'Spoken spell', attribute:'communication' },
    head: { state:'Channeling disrupted', action:'channel', label:'Channel spell', attribute:'focus' }
  };
  const actions = [
    ...slots.map(slot=>({id:slotRules[slot].action,label:slotRules[slot].label,attribute:slotRules[slot].attribute,slot,cost:1})),
    {id:'step',label:'Short step',attribute:'movement',cost:1},
    {id:'pulse',label:'Nonverbal pulse',attribute:'focus',cost:1},
    {id:'observe',label:'Observe surroundings',attribute:'focus',cost:1}
  ];
  function restrictions(character){
    return sanitize(character?.restraints).flatMap(entry=>{
      const item=getItem(entry.itemId);
      return item.slots.map(slot=>({slot,itemId:item.id,itemName:item.name,...slotRules[slot]}));
    });
  }
  function actionStatus(character,actionId){
    const action=actions.find(a=>a.id===actionId);
    if(!action)return {allowed:false,chance:0,reason:'Choose a valid action.'};
    const blockers=restrictions(character).filter(r=>r.slot===action.slot);
    if(blockers.length)return {allowed:false,chance:0,action,blockers,reason:`${action.label} blocked by ${blockers.map(r=>r.itemName).join(', ')}.`};
    const chance=clamp(Math.round(95-penalties(character)[action.attribute]*0.6),5,95);
    return {allowed:true,chance,action,blockers:[],reason:`${action.label} available. ${chance}% success; ${action.cost} AP.`};
  }
  function attemptAction({target,actionId,ap},random=Math.random){
    const status=actionStatus(target,actionId);
    if(!status.allowed)return {accepted:false,...status};
    if(!Number.isFinite(ap)||ap<status.action.cost)return {accepted:false,reason:'Not enough action points.'};
    const roll=Math.floor(random()*100)+1;
    return {accepted:true,success:roll<=status.chance,roll,chance:status.chance,ap:ap-status.action.cost};
  }
  function securingOptions(target,itemId){
    const entry=sanitize(target?.restraints).find(e=>e.itemId===itemId);
    if(!entry)return [];
    const current=profile(entry.itemId,entry.methodId);
    return methodsFor(current.item).filter(([id])=>profile(itemId,id).escape>current.escape);
  }
  function secureProfile(actor,target,itemId,methodId,condition='alert'){
    if(!conditions[condition]||!securingOptions(target,itemId).some(([id])=>id===methodId))return null;
    const entry=sanitize(target.restraints).find(e=>e.itemId===itemId),before=profile(itemId,entry.methodId),after=profile(itemId,methodId);
    const penalty=penalties(actor),difficulty=Math.round(after.item.difficulty/2)+20+after.method.difficulty;
    return {before,after,cost:Math.max(1,after.cost-before.cost),chance:clamp(Math.round(100-difficulty+conditions[condition].bonus-penalty.dexterity*.4-penalty.focus*.2),5,95)};
  }
  function attemptSecure({actor,target,itemId,methodId,condition='alert',ap},random=Math.random){
    const current=secureProfile(actor,target,itemId,methodId,condition);
    if(!current)return {accepted:false,reason:'Choose a stronger compatible securing method for an equipped restraint.'};
    if(!Number.isFinite(ap)||ap<current.cost)return {accepted:false,reason:'Not enough action points.'};
    const roll=Math.floor(random()*100)+1,success=roll<=current.chance;
    return {accepted:true,success,roll,chance:current.chance,ap:ap-current.cost,restraints:sanitize(target.restraints).map(e=>success&&e.itemId===itemId?{...e,methodId}:e)};
  }
  return { materials, slots, slotDefinitions, regions, getSlot, attributes, methods, catalog, conditions, getItem, methodsFor, sanitize, migrate, occupiedSlots, conflicts, profile, penalties, applyChance, escapeChance, attemptApply, attemptEscape, randomLoadout, slotRules, actions, restrictions, actionStatus, attemptAction, securingOptions, secureProfile, attemptSecure };
})();
if (typeof module !== 'undefined') module.exports = RestraintSystem;
