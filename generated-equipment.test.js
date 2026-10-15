const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const G=require('./generated-equipment');
const F=require('./fitted-equipment');
const A=require('./illustrated-avatar');
test('all twelve mapped designs have transparent PNG sources and valid paired crops',()=>{
 assert.equal(G.assets.length,12);assert.equal(Object.keys(G.mapping).length,12);
 for(const asset of G.assets){
  const png=fs.readFileSync(G.path(asset));
  assert.equal(png.toString('hex',0,8),'89504e470d0a1a0a');
  assert.equal(png.readUInt32BE(16),1254);assert.equal(png.readUInt32BE(20),1254);
  assert.equal(png[25],6,'RGBA source');
  for(const [x,y,w,h] of G.sheets[asset])assert.ok(x>=3&&y>=3&&x+w+3<=1254&&y+h+3<=1254);
 }
});
test('every method and outfit uses generated artwork with unique occlusion IDs and retains save identity',()=>{
 for(const [id,spec] of Object.entries(G.mapping)){
  const item=F.getItem(id);
  for(const [method] of F.methodsFor(item))for(const outfit of Object.keys(A.options.outfit)){
   const c=A.equip({...A.defaults()[0],outfit},id,method);
   assert.deepEqual(A.sanitize(JSON.parse(JSON.stringify(c))),c);
   const front=F.render(c.restraints[0],c,'front','test');
   assert.match(front,/data-renderer="generated"/);
   assert.ok(front.includes(G.path(spec.asset)));
   assert.doesNotMatch(front,/<linearGradient|<circle|<rect|NaN|undefined/);
   const svg=A.render(c,0)+A.render(c,1);
   const ids=[...svg.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
   assert.equal(new Set(ids).size,ids.length);
  }
 }
});
