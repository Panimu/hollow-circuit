const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const R = require('./restraints');
const free = () => ({ restraints: [] });

test('all 54 items cover every material/slot and compatible methods work', () => {
  assert.equal(R.catalog.length, 54);
  assert.equal(new Set(R.catalog.map(item => item.id)).size, 54);
  for (const material of R.materials) assert.deepEqual(R.catalog.filter(item => item.material === material).map(item => item.slot), R.slots);
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
  const target = { restraints: R.catalog.filter(item => item.material === 'Steel' && ['wrists','ankles','arms','lower-leg'].includes(item.slot)).map(item => ({ itemId: item.id, methodId: 'double' })) };
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
  vm.runInContext(fs.readFileSync('restraints.js','utf8'),context);
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
    const entries = R.catalog.filter(item=>item.material===material).map(item=>({itemId:item.id,methodId:R.methodsFor(item)[0][0]}));
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
  assert.equal(app.value('filteredCatalog().length'),4);
  assert.ok(app.value('filteredCatalog().some(item=>item.id===selectedItem)'));
  app.element('#slot-filter').events.change({target:{value:'mouth'}});
  assert.equal(app.value('selectedItem'),'rope-mouth');
  app.click('#restraint-lab',{material:'Steel'});
  assert.equal(app.value('selectedItem'),'steel-mouth');
  assert.equal(app.value('selectedMethod'),'latch');
  app.click('#restraint-lab',{browseSlot:'upper-leg'});
  assert.equal(app.value('selectedItem'),'steel-upper-leg');
  assert.equal(app.value('regionFilter'),'Lower body');
  assert.equal(app.value('filteredCatalog().length'),1);
  app.click('#restraint-lab',{region:'All'});
  assert.equal(app.value('filteredCatalog().length'),18);
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
