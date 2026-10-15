/* Clothing is an independent layer over the opaque simulator suit. */
const WardrobeSystem = (() => {
  const definitions = [
    ['toes','Toes','Reinforced toe caps','Flexible toe socks','movement'],
    ['feet','Feet','Trail shoes','Light trainers','movement'],
    ['ankles','Ankles','Padded ankle gaiters','Sport ankle socks','movement'],
    ['lower-leg','Lower leg','Canvas gaiters','Track leg warmers','movement'],
    ['knees','Knees','Padded knee sleeves','Stretch knee sleeves','evasion'],
    ['upper-leg','Upper leg','Quilted trouser panels','Running trouser panels','movement'],
    ['waist','Waist','Utility belt','Light sash','evasion'],
    ['chest','Chest','Field jacket','Training jersey','recovery'],
    ['shoulders','Shoulders','Padded shoulder cape','Light shoulder shawl','dexterity'],
    ['arms','Arms','Canvas oversleeves','Sport sleeves','dexterity'],
    ['elbows','Elbows','Padded elbow sleeves','Stretch elbow sleeves','dexterity'],
    ['wrists','Wrists','Wrist guards','Sweatbands','dexterity'],
    ['hands','Hands','Work gloves','Running gloves','dexterity'],
    ['fingers','Fingers','Reinforced glove liners','Light glove liners','dexterity'],
    ['neck','Neck','High-neck scarf','Light neck scarf','focus'],
    ['face','Face','Trail goggles','Sport glasses','focus'],
    ['mouth','Mouth','Weather mask','Fabric face covering','communication'],
    ['head','Head','Padded trail cap','Knit beanie','focus'],
    ['pelvis','Pelvic coverage','Field overshorts','Training overshorts','movement'],
    ['pelvis-front','Front coverage','Utility apron panel','Light front overskirt','evasion'],
    ['pelvis-rear','Rear coverage','Rear rain panel','Light rear overskirt','evasion']
  ];
  const slots=definitions.map(([id,label])=>({id,label}));
  const catalog=definitions.flatMap(([slot,label,guarded,light,attribute])=>[
    {id:`${slot}-guarded`,name:guarded,slot,slots:[slot],style:'guarded',protection:6,effects:{[attribute]:3},reward:0,color:'#6d8091',description:'Reinforced coverage makes application harder, with a small performance cost.'},
    {id:`${slot}-trial`,name:light,slot,slots:[slot],style:'trial',protection:-5,effects:{[attribute]:-2},reward:3,color:'#ad8c6c',description:'Light coverage improves performance but makes application easier. Adds a trial reward bonus.'}
  ]);
  for(const item of catalog)item.protectionSlots=item.slot.startsWith('pelvis')?['waist','upper-leg']:[...item.slots];
  const getItem=id=>catalog.find(item=>item.id===id);
  function sanitize(entries){
    const occupied=new Set(), result=[];
    for(const id of Array.isArray(entries)?entries:[]){const item=getItem(id);if(!item||item.slots.some(slot=>occupied.has(slot)))continue;result.push(id);item.slots.forEach(slot=>occupied.add(slot));}
    return result;
  }
  function modifiers(character){
    const items=sanitize(character.clothing).map(getItem), effects={};
    for(const item of items)for(const [key,value] of Object.entries(item.effects))effects[key]=(effects[key]||0)+value;
    for(const key of Object.keys(effects))effects[key]=Math.max(-20,Math.min(40,effects[key]));
    return {effects,reward:Math.min(30,items.reduce((sum,item)=>sum+item.reward,0))};
  }
  function protection(character,coveredSlots){
    return Math.max(-25,Math.min(25,sanitize(character.clothing).map(getItem).filter(item=>item.protectionSlots.some(slot=>coveredSlots.includes(slot))).reduce((sum,item)=>sum+item.protection,0)));
  }
  function equip(character,id){const item=getItem(id);if(!item)return sanitize(character.clothing);return [...sanitize(character.clothing).filter(existing=>!getItem(existing).slots.some(slot=>item.slots.includes(slot))),id];}
  return {slots,catalog,getItem,sanitize,modifiers,protection,equip};
})();
if(typeof module!=='undefined')module.exports=WardrobeSystem;
