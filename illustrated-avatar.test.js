const test=require('node:test');
const assert=require('node:assert/strict');
const A=require('./illustrated-avatar');
const R=require('./restraints');
const F=require('./fitted-equipment');
test('save validation discards hostile appearance and unsupported equipment',()=>{
 const v=A.sanitize({skin:'<script>',hair:'__proto__',outfit:'constructor',style:'bad',restraints:[{itemId:'steel-leg-frame',methodId:'latch'},{itemId:'rope-wrists',methodId:'knot'}]});
 assert.equal(v.skin,'porcelain');assert.equal(v.hair,'midnight');assert.equal(v.outfit,'streetwear');
 assert.deepEqual(v.restraints,[{itemId:'rope-wrists',methodId:'knot'}]);assert.deepEqual(A.sanitize(null,1),A.defaults()[1]);
});
test('fitting replaces a location, rejects invalid methods, and preserves original state',()=>{
 const original=A.defaults()[0],first=A.equip(original,'rope-wrists','knot'),second=A.equip(first,'steel-wrists','padlock');
 assert.equal(original.restraints.length,0);assert.equal(first.restraints[0].itemId,'rope-wrists');
 assert.deepEqual(second.restraints,[{itemId:'steel-wrists',methodId:'padlock'}]);assert.deepEqual(A.equip(second,'steel-wrists','knot'),second);
 assert.deepEqual(A.sanitize(JSON.parse(JSON.stringify(second))),second);
});
test('all 120 appearance combinations render finite geometry with independent SVG ids',()=>{
 let count=0;
 for(const skin of Object.keys(A.options.skin))for(const style of Object.keys(A.options.style))for(const hair of Object.keys(A.options.hair))for(const outfit of Object.keys(A.options.outfit)){
  const v={skin,style,hair,outfit,restraints:A.randomEquipment()};
  for(const i of [0,1]){const svg=A.render(v,i,count%2===0);assert.doesNotMatch(svg,/NaN|undefined|Infinity/);assert.match(svg,new RegExp(`id="art${i}-title"`));assert.doesNotMatch(svg,new RegExp(`id="art${1-i}-`));assert.match(svg,new RegExp(`hair-${style}.png`));}count++;
 }
 assert.equal(count,120);
});
test('equipment methods render and random fittings never overlap or need unsupported poses',()=>{
 assert.equal(A.catalog.length,20);
 for(const item of A.catalog)for(const [methodId] of R.methodsFor(item)){const c=A.equip(A.defaults()[0],item.id,methodId);assert.match(A.render(c),new RegExp(`data-item="${item.id}"`));}
 for(let n=0;n<200;n++){const e=A.randomEquipment();assert.equal(e.length,3);assert.deepEqual(F.sanitize(e),e);const covered=e.flatMap(x=>F.getItem(x.itemId).slots);assert.equal(new Set(covered).size,covered.length);assert.ok(e.every(x=>A.catalog.some(i=>i.id===x.itemId)));}
});
test('whole garments replace all overlapping pieces, restore pose and preserve other character',()=>{
 let c=A.equip(A.defaults()[0],'steel-wrists','latch');c=A.equip(c,'leather-chest','buckle');
 const other=A.defaults()[1],untouched=JSON.stringify(other);
 c=A.equip(c,'leather-arm-sleeve','padlock');assert.equal(c.restraints.length,1);assert.match(A.render(c),/behind-streetwear-v2/);assert.match(A.render(c),/arms behind view/);
 c=A.equip(c,'rope-wrists','knot');assert.equal(c.restraints.length,1);assert.doesNotMatch(A.render(c),/behind-streetwear-v2/);
 c=A.equip(c,'leather-upper-leg','buckle');c=A.equip(c,'steel-ankles','latch');c=A.equip(c,'rope-lower-leg','knot');
  c=A.equip(c,'leather-boot-wrap','buckle');assert.deepEqual(c.restraints.map(e=>e.itemId),['rope-wrists','leather-boot-wrap']);assert.match(A.render(c),/cinched-leg-sheath-v3/);
  assert.match(A.render(c),/<rect x="245" y="705" width="90" height="145"\/>/);
 c=A.equip(c,'leather-upper-leg','buckle');assert.ok(!c.restraints.some(e=>e.itemId==='leather-boot-wrap'));assert.equal(JSON.stringify(other),untouched);
});
test('old arm bands migrate safely, supported methods retain ratings, generated family art replaces generic bands',()=>{
 const c=A.sanitize({restraints:[{itemId:'steel-arms',methodId:'double'}]});assert.deepEqual(c.restraints,[{itemId:'leather-arm-sleeve',methodId:'buckle'}]);
 for(const outfit of Object.keys(A.options.outfit))for(const item of F.catalog){
  const e={itemId:item.id,methodId:F.methodsFor(item)[0][0]},v={...A.defaults()[0],outfit,restraints:[e]},svg=A.render(v);
  assert.doesNotMatch(svg,/(rope|leather|steel)-band.png/);assert.match(svg,new RegExp(`data-family="${item.family}"`));
  const effects=F.profile(e.itemId,e.methodId).effects;assert.deepEqual(effects,R.profile(e.itemId,e.methodId).effects);
 }
});
test('rear equipment is occluded by the body; front faces have independent clip paths',()=>{
 for(const outfit of Object.keys(A.options.outfit))for(const item of F.catalog){
  const c={...A.defaults()[0],outfit,restraints:[{itemId:item.id,methodId:F.methodsFor(item)[0][0]}]},svg=A.render(c);
  const rear=svg.indexOf('data-equipment-depth="rear"'),body=svg.indexOf('data-avatar-body="true"'),front=svg.indexOf('data-equipment-depth="front"');
  assert.ok(rear>0&&rear<body&&body<front,`${outfit}/${item.id}: rear → body → front`);
  assert.match(svg,/clip-path="url\(#art0-.*-front/);
  assert.match(svg,/id="art0-contact"/);
 }
 const combined=A.render(A.equip(A.defaults()[0],'leather-boot-wrap','buckle'),0)+A.render(A.equip(A.defaults()[1],'leather-boot-wrap','buckle'),1);
 const ids=[...combined.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
 assert.match(combined,/legs cinched together/);assert.doesNotMatch(combined,/leg-sheaths-v2/);
});
