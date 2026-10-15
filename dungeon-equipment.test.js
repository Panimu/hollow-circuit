const test=require('node:test');
const assert=require('node:assert/strict');
const R=require('./restraints');
const F=require('./fitted-equipment');
const E=require('./dungeon-equipment');
const A=require('./illustrated-avatar');
const S=require('./spellcasting');

test('all 18 slots have three dedicated designs, without relying on multi-slot garments',()=>{
  assert.deepEqual(A.slots,R.slots);
  assert.equal(new Set(F.catalog.map(i=>i.id)).size,F.catalog.length);
  for(const slot of R.slots){
    const dedicated=F.catalog.filter(i=>i.slot===slot&&i.family!=='armbinder'&&i.family!=='sheaths');
    assert.ok(dedicated.length>=3,slot);
    assert.equal(new Set(dedicated.map(i=>i.name)).size,dedicated.length);
  }
  const shapes=E.catalog.filter(i=>!['hands','knees'].includes(i.slot)).map(i=>E.shape(i.slot,i.variant));
  assert.equal(new Set(shapes).size,27,'27 remaining procedural silhouettes; hands and knees use generated art');
});
test('each new design replaces its slot, restores from saves, and affects the intended stats',()=>{
  for(const item of E.catalog){
    let c=A.equip(A.defaults()[0],'arcane-whisper-seal','attune');
    c=A.equip(c,item.id,'dock');
    assert.equal(c.restraints.length,2);
    assert.ok(F.penalties(c).focus>=5);
    const calibrated=A.equip(c,item.id,'calibrate');
    assert.equal(calibrated.restraints.length,2);
    assert.equal(F.penalties(calibrated).focus,F.penalties(c).focus+3);
    assert.deepEqual(A.sanitize(JSON.parse(JSON.stringify(calibrated))),calibrated);
    assert.deepEqual(A.equip(calibrated,item.id,'padlock'),calibrated);
    assert.equal(S.check(c,'ember-word').allowed,false);
    assert.equal(S.check(A.equip(A.defaults()[0],item.id,'dock'),'ember-word').allowed,true);
  }
});
test('slot coverage displaces whole garments atomically; face gear displaces a combined voice visor',()=>{
  for(const slot of ['shoulders','arms','elbows','hands','fingers']){
    const c=A.equip(A.equip(A.defaults()[0],'leather-arm-sleeve','buckle'),`gear-${slot}-1`,'dock');
    assert.equal(c.restraints.length,1);assert.doesNotMatch(A.render(c),/behind-streetwear/);
  }
  for(const slot of ['toes','feet','knees']){
    const c=A.equip(A.equip(A.defaults()[0],'leather-boot-wrap','buckle'),`gear-${slot}-1`,'dock');
    assert.equal(c.restraints.length,1);assert.doesNotMatch(A.render(c),/cinched-leg-sheath/);
  }
  const c=A.equip(A.equip(A.defaults()[0],'arcane-null-visor','attune'),'gear-face-1','dock');
  assert.equal(c.restraints.length,1);assert.equal(S.check(c,'ember-word').allowed,true);
});
test('all new geometry and detail IDs remain finite and independent for both characters',()=>{
  for(const item of E.catalog){
    for(const outfit of Object.keys(A.options.outfit)){
      const c=A.equip({...A.defaults()[0],outfit},item.id,'dock');
      const svg=A.render(c,0)+A.render(c,1)+F.detail(c.restraints[0],'inspect0')+F.detail(c.restraints[0],'inspect1');
      assert.doesNotMatch(svg,/NaN|undefined|Infinity/);
      const ids=[...svg.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
      assert.equal(E.targets(item.slot,c).length,['neck','face','head'].includes(item.slot)?1:2);
    }
  }
});
