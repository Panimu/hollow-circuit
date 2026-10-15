const test=require('node:test');
const assert=require('node:assert/strict');
const S=require('./spellcasting');
const F=require('./fitted-equipment');
const A=require('./illustrated-avatar');

test('silence blocks spoken spells, permits nonverbal, persists and releases immediately',()=>{
  for(const item of S.catalog)for(const [methodId] of F.methodsFor(item)){
    const original=A.defaults()[0],equipped=A.equip(original,item.id,methodId);
    for(const spell of S.spells){
      assert.equal(S.check(original,spell.id).allowed,true);
      assert.equal(S.check(equipped,spell.id).allowed,!spell.verbal);
    }
    assert.match(S.check(equipped,'ember-word').reason,new RegExp(item.name));
    const reloaded=A.sanitize(JSON.parse(JSON.stringify(equipped)));
    assert.equal(S.check(reloaded,'ward-chant').allowed,false);
    reloaded.restraints=[];
    assert.equal(S.check(reloaded,'ward-chant').allowed,true);
    assert.equal(S.check(A.defaults()[1],'ward-chant').allowed,true);
  }
});
test('invalid equipment cannot activate silence, unknown spells fail closed',()=>{
  for(const methodId of ['padlock','__proto__','constructor',null]){
    const character={restraints:[{itemId:'arcane-whisper-seal',methodId}]};
    assert.equal(S.check(character,'ember-word').allowed,true);
    assert.deepEqual(F.sanitize(character.restraints),[]);
  }
  assert.equal(S.check(null,'ember-word').allowed,true);
  assert.equal(S.check({restraints:[null,{}]},'ember-word').allowed,true);
  assert.equal(S.check({},'bad-spell').allowed,false);
});
test('replacement preserves unrelated equipment; designs and activation have different ratings',()=>{
  let c=A.equip(A.defaults()[0],'steel-waist','latch');
  for(const item of S.catalog){
    c=A.equip(c,item.id,'attune');
    assert.deepEqual(c.restraints.map(e=>e.itemId),['steel-waist',item.id]);
    assert.equal(S.validSources(c).length,1);
    const normal=F.profile(item.id,'attune'),strong=F.profile(item.id,'reinforce');
    assert.equal(strong.difficulty,normal.difficulty+12);
    assert.equal(strong.escape,normal.escape+18);
    assert.equal(strong.cost,normal.cost+1);
    assert.equal(strong.effects.focus,normal.effects.focus+5);
  }
  assert.equal(new Set(S.catalog.map(i=>i.difficulty)).size,3);
  assert.equal(new Set(S.catalog.map(i=>i.escape)).size,3);
  assert.deepEqual(F.getItem('arcane-null-visor').slots,['mouth','face']);
});
