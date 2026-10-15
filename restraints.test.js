const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const R = require('./restraints');
const W = require('./wardrobe');
const A = require('./avatar');
const free = () => ({ restraints: [] });

test('all 69 items cover every material/slot and compatible methods work', () => {
  assert.equal(R.catalog.length, 69);
  assert.equal(new Set(R.catalog.map(item => item.id)).size, 69);
  for (const material of R.materials) assert.deepEqual(R.catalog.filter(item => item.material === material && item.slots.length===1).map(item => item.slot), R.slots);
  for (const item of R.catalog) for (const [methodId] of R.methodsFor(item)) {
    const p = R.profile(item.id, methodId);
    assert.ok(p.cost >= 2 && p.cost <= 6);
    const target = free(), args = { target, actor: free(), itemId: item.id, methodId, ap: 6 };
    const success = R.attemptApply(args, () => 0), failure = R.attemptApply(args, () => 0.9999);
    assert.equal(success.success, true);
    assert.equal(failure.success, false);
    assert.equal(success.ap, 6 - p.cost);
    assert.equal(failure.ap, success.ap);
    assert.equal(success.restraints.length, 1);
    assert.equal(failure.restraints.length, 0);
    assert.deepEqual(target, free(), 'engine does not mutate inputs');
    const equipped = { restraints: success.restraints };
    assert.deepEqual(R.penalties(equipped), p.effects);
    const escaped = R.attemptEscape({ target: equipped, itemId: item.id, ap: 2 }, () => 0);
    assert.equal(escaped.restraints.length, 0);
    assert.equal(escaped.ap, 0);
    const stuck = R.attemptEscape({ target: equipped, itemId: item.id, ap: 2 }, () => 0.9999);
    assert.equal(stuck.restraints.length, 1);
    assert.equal(stuck.ap, 0);
  }
});

test('slot collisions, invalid methods and insufficient AP cannot alter a loadout', () => {
  const target = { restraints: [{ itemId: 'rope-wrists', methodId: 'knot' }] };
  const args = { target, actor: free(), itemId: 'steel-wrists', methodId: 'latch', ap: 6 };
  assert.equal(R.attemptApply(args).accepted, false);
  assert.equal(R.attemptApply({ ...args, target: free(), ap: 2 }).accepted, false);
  assert.equal(R.attemptApply({ ...args, target: free(), methodId: 'knot' }).accepted, false);
  assert.equal(R.attemptApply({ ...args, target: free(), condition: 'missing' }).accepted, false);
  assert.equal(R.attemptApply({ ...args, target: free(), ap: NaN }).accepted, false);
  assert.equal(R.attemptEscape({ target, itemId: 'rope-wrists', ap: 1 }).accepted, false);
  assert.equal(R.attemptEscape({ target, itemId: 'rope-ankles', ap: 6 }).accepted, false);
});

test('penalty cap, method tradeoffs, conditions and restrained operator affect checks', () => {
  const target = { restraints: R.catalog.filter(item => item.material === 'Steel' && item.slots.length===1 && ['wrists','ankles','arms','lower-leg'].includes(item.slot)).map(item => ({ itemId: item.id, methodId: 'double' })) };
  assert.deepEqual(R.penalties(target), { movement: 85, dexterity: 80, evasion: 85, recovery: 30, focus: 0, communication: 0 });
  const base = R.profile('leather-wrists', 'buckle'), locked = R.profile('leather-wrists', 'padlock');
  assert.equal(locked.escape - base.escape, 20);
  assert.equal(locked.difficulty - base.difficulty, 8);
  assert.equal(locked.cost - base.cost, 1);
  assert.equal(R.applyChance(free(), 'steel-legs', 'double', 'alert'), 23);
  assert.equal(R.applyChance(free(), 'steel-legs', 'double', 'staggered'), 53);
  assert.equal(R.applyChance(target, 'steel-legs', 'double', 'alert'), 5);
  assert.equal(R.applyChance(free(), 'rope-wrists', 'knot', 'staggered'), 95);
  assert.equal(R.escapeChance(target, target.restraints.find(e => e.itemId === 'steel-lower-leg')), 5);
});

test('exact success boundary is inclusive for application and escape', () => {
  const args = { target: free(), actor: free(), itemId: 'rope-wrists', methodId: 'knot', ap: 6 };
  assert.equal(R.attemptApply(args, () => 0.75).success, true); // 76 / 76
  assert.equal(R.attemptApply(args, () => 0.76).success, false); // 77 / 76
  const target = { restraints: [{ itemId: 'rope-wrists', methodId: 'knot' }] };
  const chance = R.escapeChance(target, target.restraints[0]);
  assert.equal(R.attemptEscape({ target, itemId: 'rope-wrists', ap: 2 }, () => (chance - 1) / 100).success, true);
  assert.equal(R.attemptEscape({ target, itemId: 'rope-wrists', ap: 2 }, () => chance / 100).success, false);
});

test('save validation removes invalid entries, duplicates and legacy state migrates', () => {
  assert.deepEqual(R.sanitize([null, {itemId:'unknown',methodId:'knot'}, {itemId:'rope-wrists',methodId:'padlock'}, {itemId:'rope-wrists',methodId:'knot'}, {itemId:'steel-wrists',methodId:'latch'}]), [{itemId:'rope-wrists',methodId:'knot'}]);
  assert.equal(R.migrate({restraint:'Stasis'}).length, 4);
  assert.equal(R.migrate({restraint:'Ankle lock'})[0].itemId, 'steel-ankles');
  assert.equal(R.migrate({restraint:'Wrist lock'})[0].itemId, 'steel-wrists');
  assert.deepEqual(R.migrate({restraint:'Free'}), []);
  assert.deepEqual(R.migrate({restraints:[],restraint:'Stasis'}), []);
});

function appHarness(saved) {
  const elements = new Map();
  function element(id) { if (!elements.has(id)) elements.set(id, { innerHTML:'', textContent:'', events:{}, scrollIntoView() {}, addEventListener(type, fn) { this.events[type] = fn; } }); return elements.get(id); }
  const memory = new Map(saved ? [['hollow-circuit-roster', saved]] : []);
  const context = vm.createContext({ structuredClone, Math: Object.assign(Object.create(Math), { random: () => 0 }), document: { querySelector: element, querySelectorAll: () => [] }, localStorage: { getItem: key => memory.get(key), setItem: (key,value) => memory.set(key,value) } });
  vm.runInContext(fs.readFileSync('wardrobe.js','utf8'),context);
  vm.runInContext(fs.readFileSync('restraints.js','utf8'),context);
  vm.runInContext(fs.readFileSync('avatar.js','utf8'),context);
  vm.runInContext(fs.readFileSync('app.js','utf8'),context);
  return { context, element, memory, value: expression => JSON.parse(JSON.stringify(vm.runInContext(expression,context))), click: (id,dataset) => element(id).events.click({ target: { closest: () => ({ dataset }) } }) };
}
test('UI integration: targeting, stacking, release, save/reload and reset behavior', () => {
  const app = appHarness();
  app.click('#restraint-lab',{item:'rope-wrists'});
  app.click('#restraint-lab',{action:'apply'});
  assert.equal(app.value('characters[0].restraints.length'),1);
  assert.equal(app.value('characters[1].restraints.length'),0);
  assert.match(app.element('#roster').innerHTML,/data-restraint="rope-wrists"/);
  app.click('#restraint-lab',{item:'rope-ankles'});
  app.click('#restraint-lab',{action:'apply'});
  assert.equal(app.value('stats(characters[0]).speed'),3.5);
  app.click('#restraint-lab',{target:'1'});
  app.click('#restraint-lab',{action:'apply'});
  assert.equal(app.value('characters[1].restraints.length'),1);
  assert.equal(app.value('actionPoints'),0);
  app.element('#save').events.click();
  const loaded = appHarness(app.memory.get('hollow-circuit-roster'));
  assert.deepEqual(loaded.value('characters'),app.value('characters'));
  assert.equal(loaded.value('actionPoints'),6);
  loaded.click('#restraint-lab',{release:'rope-wrists'});
  assert.equal(loaded.value('characters[0].restraints.length'),1);
  loaded.click('#restraint-lab',{action:'release-all'});
  assert.deepEqual(loaded.value('characters.map(c=>c.restraints.length)'),[0,0]);
});
test('app accepts old, malformed and hostile saves without rendering saved markup', () => {
  const legacy = appHarness(JSON.stringify([{restraint:'Stasis',name:'<script>bad</script>'},{restraint:'Free'}]));
  assert.equal(legacy.value('characters[0].restraints.length'),4);
  assert.equal(legacy.value('characters[0].name'),'Nova');
  assert.equal(appHarness('{broken').value('characters[0].restraints.length'),0);
  assert.equal(appHarness('[null,null]').value('characters[0].restraints.length'),0);
});

test('all expanded slots stack independently, render, and persist for either avatar', () => {
  const app = appHarness();
  for (const material of R.materials) {
    const entries = R.catalog.filter(item=>item.material===material&&item.slots.length===1).map(item=>({itemId:item.id,methodId:R.methodsFor(item)[0][0]}));
    const loaded = appHarness(JSON.stringify({version:3,characters:[{restraints:entries},{restraints:entries}]}));
    assert.equal(loaded.value('characters[0].restraints.length'),18);
    assert.equal(loaded.value('characters[1].restraints.length'),18);
    for(const slot of R.slots) assert.match(loaded.element('#roster').innerHTML,new RegExp(`data-slot="${slot}"`));
    assert.doesNotMatch(loaded.element('#roster').innerHTML,/undefined|NaN/);
    assert.equal((loaded.element('#active-restraints').innerHTML.match(/class="loadout-slot"/g)||[]).length,18);
    loaded.element('#save').events.click();
    const restored=appHarness(loaded.memory.get('hollow-circuit-roster'));
    assert.deepEqual(restored.value('characters'),loaded.value('characters'));
    assert.ok(Object.values(loaded.value('R.penalties(characters[0])')).every(value=>value<=85));
  }
  assert.equal(app.value('R.slots.length'),18);
});

test('region, slot and material filters retain a valid visible selection', () => {
  const app=appHarness();
  app.click('#restraint-lab',{region:'Head & neck'});
  assert.equal(app.value('filteredCatalog().length'),5);
  assert.ok(app.value('filteredCatalog().some(item=>item.id===selectedItem)'));
  app.element('#slot-filter').events.change({target:{value:'mouth'}});
  assert.equal(app.value('selectedItem'),'rope-mouth');
  app.click('#restraint-lab',{material:'Steel'});
  assert.equal(app.value('selectedItem'),'steel-mouth');
  assert.equal(app.value('selectedMethod'),'latch');
  app.click('#restraint-lab',{browseSlot:'upper-leg'});
  assert.ok(app.value('R.getItem(selectedItem).slots.includes("upper-leg")'));
  assert.equal(app.value('regionFilter'),'Lower body');
  assert.equal(app.value('filteredCatalog().length'),2);
  app.click('#restraint-lab',{region:'All'});
  assert.equal(app.value('filteredCatalog().length'),23);
});

test('old leg equipment migrates to lower legs, leaving upper legs independently usable', () => {
  for(const material of R.materials){
    const key=material.toLowerCase(), methodId=R.methodsFor(R.getItem(`${key}-lower-leg`))[0][0];
    const migrated=R.migrate({restraints:[{itemId:`${key}-legs`,methodId}]});
    assert.deepEqual(migrated,[{itemId:`${key}-lower-leg`,methodId}]);
    const result=R.attemptApply({target:{restraints:migrated},actor:free(),itemId:`${key}-upper-leg`,methodId,ap:6},()=>0);
    assert.equal(result.restraints.length,2);
  }
});

test('focus penalties affect both checks and mouth equipment reduces communication', () => {
  const target={restraints:[{itemId:'rope-face',methodId:'knot'}]};
  assert.equal(R.penalties(target).focus,25);
  assert.equal(R.applyChance(target,'rope-wrists','knot'),71);
  assert.equal(R.escapeChance(target,target.restraints[0]),62);
  assert.equal(R.penalties({restraints:[{itemId:'rope-mouth',methodId:'knot'}]}).communication,45);
});

test('multi-slot application is atomic and rejects overlap in either direction', () => {
  for(const item of R.catalog.filter(item=>item.slots.length>1)){
    const methodId=R.methodsFor(item)[0][0];
    const args={target:free(),actor:free(),itemId:item.id,methodId,ap:6};
    const success=R.attemptApply(args,()=>0);
    const equipped={restraints:success.restraints};
    assert.equal(success.restraints.length,1);
    assert.deepEqual(R.occupiedSlots(equipped),item.slots);
    assert.deepEqual(R.penalties(equipped),R.profile(item.id,methodId).effects);
    const failure=R.attemptApply(args,()=>0.9999);
    assert.deepEqual(failure.restraints,[]);
    for(const slot of item.slots){
      const single=R.catalog.find(candidate=>candidate.material===item.material&&candidate.slots.length===1&&candidate.slot===slot);
      const existing={restraints:[{itemId:single.id,methodId}]};
      const failRoll=()=>{throw new Error('Conflict must be checked before rolling');};
      assert.equal(R.attemptApply({...args,target:existing},failRoll).accepted,false);
      assert.equal(R.attemptApply({...args,target:equipped,itemId:single.id},failRoll).accepted,false);
      assert.deepEqual(R.conflicts(existing,item.id)[0].slots,[slot]);
    }
    const escaped=R.attemptEscape({target:equipped,itemId:item.id,ap:2},()=>0);
    assert.deepEqual(R.occupiedSlots({restraints:escaped.restraints}),[]);
    assert.equal(escaped.ap,0);
  }
});

test('save validation rejects an entire overlapping item, without reserving unused slots', () => {
  const boots={itemId:'leather-boot-wrap',methodId:'padlock'},feet={itemId:'rope-feet',methodId:'knot'},toes={itemId:'rope-toes',methodId:'knot'};
  assert.deepEqual(R.sanitize([boots,feet,boots]),[boots]);
  assert.deepEqual(R.sanitize([feet,boots,toes]),[feet,toes]);
  assert.deepEqual(R.sanitize([boots,{itemId:'rope-wrists',methodId:'knot'}]),[boots,{itemId:'rope-wrists',methodId:'knot'}]);
});

test('multi-slot UI shows covered feet, preserves material family, saves once and releases all', () => {
  const app=appHarness();
  app.element('#slot-filter').events.change({target:{value:'feet'}});
  assert.deepEqual(app.value('filteredCatalog().map(item=>item.id)'),['rope-boot-wrap','rope-feet']);
  app.click('#restraint-lab',{item:'rope-boot-wrap'});
  app.click('#restraint-lab',{material:'Leather'});
  assert.equal(app.value('selectedItem'),'leather-boot-wrap');
  app.click('#restraint-lab',{action:'apply'});
  assert.equal(app.value('characters[0].restraints.length'),1);
  assert.match(app.element('#loadout-title').textContent,/1 item · 4 \/ 18 slots/);
  assert.equal((app.element('#active-restraints').innerHTML.match(/Linked 4-slot item/g)||[]).length,4);
  for(const slot of ['toes','feet','ankles','lower-leg'])assert.match(app.element('#roster').innerHTML,new RegExp(`data-slot="${slot}"`));
  app.click('#restraint-lab',{item:'leather-feet'});
  assert.match(app.element('#restraint-detail').innerHTML,/Overlapping equipment/);
  assert.match(app.element('#restraint-detail').innerHTML,/Warden restraint boots \(Feet\)/);
  app.element('#save').events.click();
  const loaded=appHarness(app.memory.get('hollow-circuit-roster'));
  assert.equal(loaded.value('characters[0].restraints.length'),1);
  assert.equal(loaded.value('R.occupiedSlots(characters[0]).length'),4);
  loaded.click('#restraint-lab',{release:'leather-boot-wrap'});
  assert.equal(loaded.value('R.occupiedSlots(characters[0]).length'),0);
});

test('wardrobe provides two normal garments per zone, replacement, caps and matching protection',()=>{
  assert.equal(W.slots.length,21);assert.equal(W.catalog.length,42);
  for(const slot of W.slots)assert.equal(W.catalog.filter(item=>item.slot===slot.id).length,2);
  const guarded={clothing:['feet-guarded'],restraints:[]},trial={clothing:['feet-trial'],restraints:[]};
  assert.equal(R.applyChance(free(),'rope-feet','knot','alert',guarded),62);
  assert.equal(R.applyChance(free(),'rope-feet','knot','alert',trial),73);
  assert.equal(R.applyChance(free(),'rope-wrists','knot','alert',guarded),76);
  assert.equal(R.penalties(guarded).movement,3);
  assert.equal(R.penalties(trial).movement,-2);
  assert.deepEqual(W.equip(guarded,'feet-trial'),['feet-trial']);
  assert.deepEqual(W.sanitize(['feet-guarded','feet-trial','invalid']),['feet-guarded']);
  const all={clothing:W.catalog.filter(item=>item.style==='trial').map(item=>item.id)};
  assert.equal(W.modifiers(all).reward,30);
  assert.equal(W.protection({clothing:W.catalog.filter(item=>item.style==='guarded').map(item=>item.id)},R.slots),25);
  assert.equal(W.protection(all,R.slots),-25);
  assert.equal(W.protection({clothing:['pelvis-front-guarded']},['waist']),6);
});

test('clothing odds feed actual application rolls and do not change slot occupancy',()=>{
  const base={actor:free(),itemId:'rope-feet',methodId:'knot',ap:6};
  const guarded={restraints:[],clothing:['feet-guarded']},trial={restraints:[],clothing:['feet-trial']};
  const failed=R.attemptApply({...base,target:guarded},()=>.65);
  const passed=R.attemptApply({...base,target:trial},()=>.65);
  assert.equal(failed.success,false);assert.equal(passed.success,true);
  assert.equal(failed.chance,62);assert.equal(passed.chance,73);
  assert.deepEqual(R.occupiedSlots(guarded),[]);
});

test('automatic pose combines equipment constraints and resets after release',()=>{
  const c={restraints:[],posePreference:'auto'};
  assert.equal(A.resolvePose(c).key,'standing');
  c.restraints=[{itemId:'rope-boot-wrap',methodId:'knot'}];
  assert.equal(A.resolvePose(c).key,'together');
  c.restraints=[{itemId:'rope-arm-sleeve',methodId:'knot'},{itemId:'rope-leg-frame',methodId:'knot'}];
  assert.equal(A.resolvePose(c).key,'kneeling-behind');
  assert.equal(A.resolvePose({...c,posePreference:'standing'}).key,'standing');
  c.restraints=[];assert.equal(A.resolvePose(c).key,'standing');
  assert.ok(A.rig({posePreference:'kneeling'}).knee[0][1]>A.rig({posePreference:'kneeling'}).ankle[0][1]);
});

test('all poses and views render finite attachment coordinates and clothing layers',()=>{
  const app=appHarness();
  for(const pose of Object.keys(A.poses))for(const view of ['front','rear']){
    const markup=app.value(`doll({...characters[0],posePreference:'${pose}',view:'${view}',clothing:W.catalog.filter(item=>item.style==='guarded').map(item=>item.id),restraints:R.catalog.filter(item=>item.material==='Rope'&&item.slots.length===1).map(item=>({itemId:item.id,methodId:'knot'}))},0)`);
    assert.doesNotMatch(markup,/NaN|undefined|Infinity/);
    for(const slot of R.slots)assert.match(markup,new RegExp(`data-slot="${slot}"`));
    assert.match(markup,new RegExp(`data-clothing="pelvis-${view==='front'?'front':'rear'}-guarded"`));
    const points=Object.values(A.rig({posePreference:pose}).anchors).flat();
    assert.ok(points.every(([x,y])=>x>=0&&x<=320&&y>=0&&y<=520));
  }
});

test('wardrobe and pose UI persist and target each avatar independently',()=>{
  const app=appHarness();
  app.click('#wardrobe',{wear:'feet-trial'});
  app.click('#pose-controls',{pose:'kneeling',view:'rear'});
  assert.deepEqual(app.value('characters[0].clothing'),['feet-trial']);
  assert.deepEqual(app.value('characters[1].clothing'),[]);
  assert.match(app.element('#wardrobe-summary').textContent,/103 credits/);
  app.element('#save').events.click();
  const loaded=appHarness(app.memory.get('hollow-circuit-roster'));
  assert.deepEqual(loaded.value('characters'),app.value('characters'));
  loaded.click('#wardrobe',{unwear:'feet-trial'});
  assert.deepEqual(loaded.value('characters[0].clothing'),[]);
  assert.equal(loaded.value('characters[0].view'),'rear');
});
