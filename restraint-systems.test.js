const test=require('node:test'),assert=require('node:assert/strict');
const R=require('./restraints');
const free=()=>({restraints:[]});
test('all 18 slots have three dedicated restraints and a distinct action counter',()=>{
 assert.deepEqual(Object.keys(R.slotRules),R.slots);
 assert.equal(new Set(Object.values(R.slotRules).map(r=>r.action)).size,18);
 for(const slot of R.slots){
  const items=R.catalog.filter(item=>item.slots.length===1&&item.slot===slot);
  assert.deepEqual(items.map(i=>i.material),R.materials);
  for(const item of items){
   const target={restraints:[{itemId:item.id,methodId:R.methodsFor(item)[0][0]}]};
   const blocked=R.actionStatus(target,R.slotRules[slot].action);
   assert.equal(blocked.allowed,false);assert.equal(blocked.blockers[0].itemId,item.id);
   assert.equal(R.restrictions(target).length,1);
   assert.equal(R.actionStatus(free(),R.slotRules[slot].action).allowed,true);
   for(const action of ['step','pulse','observe'])assert.equal(R.actionStatus(target,action).allowed,true);
  }
 }
});
test('assemblies block every covered action and escape restores every covered action at once',()=>{
 for(const item of R.catalog.filter(i=>i.slots.length>1)){
  const target={restraints:[{itemId:item.id,methodId:R.methodsFor(item)[0][0]}]};
  assert.equal(R.restrictions(target).length,item.slots.length);
  for(const slot of item.slots)assert.equal(R.actionStatus(target,R.slotRules[slot].action).allowed,false);
  const result=R.attemptEscape({target,itemId:item.id,ap:2},()=>0);
  for(const slot of item.slots)assert.equal(R.actionStatus(result,R.slotRules[slot].action).allowed,true);
 }
});
test('securing upgrades preserve other slots, charge successes and failures, and reject downgrade exploits',()=>{
 for(const item of R.catalog){
  for(const [methodId] of R.methodsFor(item)){
   const target={restraints:[{itemId:item.id,methodId}]};
   const before=structuredClone(target);
   for(const [upgrade] of R.securingOptions(target,item.id)){
    const args={actor:free(),target,itemId:item.id,methodId:upgrade,ap:6};
    const profile=R.secureProfile(args.actor,target,item.id,upgrade);
    assert.ok(profile.after.escape>profile.before.escape);
    const success=R.attemptSecure(args,()=>0),failed=R.attemptSecure(args,()=>.99999);
    assert.equal(success.success,true);assert.equal(failed.success,false);
    assert.equal(success.ap,6-profile.cost);assert.equal(failed.ap,success.ap);
    assert.equal(success.restraints[0].methodId,upgrade);assert.deepEqual(failed.restraints,target.restraints);
    assert.deepEqual(target,before);
    assert.equal(R.attemptSecure({...args,ap:profile.cost-1}).accepted,false);
    assert.equal(R.attemptSecure({...args,ap:NaN}).accepted,false);
    assert.equal(R.attemptSecure({...args,condition:'missing'}).accepted,false);
    assert.equal(R.attemptSecure({...args,methodId, target:success}).accepted,false);
    assert.equal(R.attemptSecure(args,()=>(profile.chance-1)/100).success,true);
    assert.equal(R.attemptSecure(args,()=>(profile.chance+.1)/100).success,false);
   }
   assert.equal(R.attemptSecure({actor:free(),target,itemId:item.id,methodId,ap:6}).accepted,false);
  }
 }
 const target={restraints:[{itemId:'leather-wrists',methodId:'buckle'},{itemId:'rope-ankles',methodId:'knot'}]};
 const result=R.attemptSecure({actor:free(),target,itemId:'leather-wrists',methodId:'padlock',ap:6},()=>0);
 assert.deepEqual(result.restraints[1],target.restraints[1]);
 assert.equal(R.attemptSecure({actor:free(),target,itemId:'leather-wrists',methodId:'double',ap:6}).accepted,false);
 assert.equal(R.attemptSecure({actor:free(),target:free(),itemId:'leather-wrists',methodId:'padlock',ap:6}).accepted,false);
});
test('blocked actions consume no AP; fallback checks use penalties, costs and inclusive success boundary',()=>{
 const target={restraints:R.catalog.filter(i=>i.material==='Steel'&&i.slots.length===1).map(i=>({itemId:i.id,methodId:'double'}))};
 for(const slot of R.slots){const r=R.attemptAction({target,actionId:R.slotRules[slot].action,ap:6});assert.equal(r.accepted,false);assert.equal(r.ap,undefined);}
 for(const actionId of ['step','pulse','observe']){
  const state=R.actionStatus(target,actionId);assert.equal(state.allowed,true);assert.ok(state.chance<R.actionStatus(free(),actionId).chance);
  const result=R.attemptAction({target,actionId,ap:1},()=>(state.chance-1)/100);assert.equal(result.success,true);assert.equal(result.ap,0);
  assert.equal(R.attemptAction({target,actionId,ap:1},()=>(state.chance+.1)/100).success,false);
  assert.equal(R.attemptAction({target,actionId,ap:0}).accepted,false);
 }
 assert.equal(R.actionStatus(target,'bad').allowed,false);
 assert.equal(R.attemptAction({target:free(),actionId:'step',ap:NaN}).accepted,false);
 for(const entry of target.restraints)assert.ok(R.escapeChance(target,entry)>=5);
});
