const test=require('node:test'),assert=require('node:assert/strict');
const H=require('./head-equipment'),F=require('./fitted-equipment'),A=require('./illustrated-avatar'),S=require('./spellcasting');
test('head assemblies cover four slots, hide hair and restore the selected hairstyle after removal',()=>{
 for(const item of H.catalog.filter(i=>i.hidesHair))for(const style of ['bob','ponytail'])for(const outfit of Object.keys(A.options.outfit)){
  const original={...A.defaults()[0],style,hair:'violet',outfit};
  const c=A.equip(original,item.id,'mount'),svg=A.render(c,0,'head');
  assert.deepEqual(item.slots,['head','face','mouth','neck']);
  assert.doesNotMatch(svg,/data-avatar-hair|hair-(bob|ponytail)\.png/);
  assert.match(svg,/viewBox="370 -10 285 320"/);
  assert.ok(svg.includes(H.eyePath(item)));
  assert.equal(c.style,style);assert.equal(c.hair,'violet');
  c.restraints=[];assert.match(A.render(c),new RegExp(`hair-${style}.png`));
 }
});
test('enclosed equipment replaces all overlapping parts; removing any covered slot restores hair',()=>{
 for(const item of H.catalog.filter(i=>i.hidesHair)){
  let c=A.defaults()[0];
  for(const slot of ['head','face','neck'])c=A.equip(c,`gear-${slot}-1`,'dock');
  c=A.equip(c,'arcane-whisper-seal','attune');c=A.equip(c,'steel-waist','latch');
  c=A.equip(c,item.id,'sync');assert.deepEqual(c.restraints.map(e=>e.itemId),['steel-waist',item.id]);
  for(const replacement of [['gear-head-1','dock'],['gear-face-1','dock'],['gear-neck-1','dock'],['head-resonance-plate','mount']]){
   const next=A.equip(c,...replacement);assert.equal(next.restraints.length,2);assert.match(A.render(next),/data-avatar-hair/);
  }
 }
});
test('only ward-equipped headgear blocks spoken spells; coverage alone does not trigger silence',()=>{
 for(const item of H.catalog)for(const method of Object.keys(H.methods)){
  const c=A.equip(A.defaults()[0],item.id,method);
  assert.equal(S.check(c,'ember-word').allowed,!item.blocksVerbal,item.id);
  assert.equal(S.check(c,'focus-pulse').allowed,true);
  assert.equal(S.check(A.sanitize(JSON.parse(JSON.stringify(c))),'ward-chant').allowed,!item.blocksVerbal);
  for(const invalid of ['attune','dock','__proto__',null])assert.equal(S.check({restraints:[{itemId:item.id,methodId:invalid}]},'ember-word').allowed,true);
  if(item.kind==='plate')assert.match(A.render(c),/data-avatar-hair/);
 }
});
test('new items have distinct geometry, valid methods and unique IDs across avatars and detail views',()=>{
 const shapes=[];
 for(const item of H.catalog){
  const c=A.equip(A.defaults()[0],item.id,'mount');
  const markup=A.render(c,0)+A.render(c,1)+F.detail(c.restraints[0],'detail0')+F.detail(c.restraints[0],'detail1');
  assert.doesNotMatch(markup,/NaN|undefined|Infinity/);
  const ids=[...markup.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
  assert.equal(F.profile(item.id,'sync').effects.focus,F.profile(item.id,'mount').effects.focus+4);
  shapes.push(H.render({itemId:item.id},{},'front','test'));
 }
 assert.equal(new Set(shapes).size,9);
});
