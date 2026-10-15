const test=require('node:test');
const assert=require('node:assert/strict');
const A=require('./illustrated-avatar');
const R=require('./restraints');
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
 assert.equal(A.catalog.length,18);
 for(const item of A.catalog)for(const [methodId] of R.methodsFor(item)){const c=A.equip(A.defaults()[0],item.id,methodId);assert.match(A.render(c),new RegExp(`data-item="${item.id}"`));}
 for(let n=0;n<200;n++){const e=A.randomEquipment();assert.equal(e.length,3);assert.deepEqual(R.sanitize(e),e);assert.equal(new Set(e.map(x=>R.getItem(x.itemId).slot)).size,3);assert.ok(e.every(x=>A.catalog.some(i=>i.id===x.itemId)));}
});
