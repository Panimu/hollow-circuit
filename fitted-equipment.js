/* Anatomical equipment families and SVG atlas placement for the illustrated studio. */
const FittedEquipment = (() => {
  const R=typeof RestraintSystem!=='undefined'?RestraintSystem:require('./restraints');
  const S=typeof Spellcasting!=='undefined'?Spellcasting:require('./spellcasting');
  const E=typeof DungeonEquipment!=='undefined'?DungeonEquipment:require('./dungeon-equipment');
  const methods={...R.methods,...S.methods,...E.methods};
  const slots=['wrists','ankles','upper-leg','lower-leg','waist','chest'];
  const familyNames={wrists:'wrist cuffs',ankles:'ankle restraints','upper-leg':'thigh straps','lower-leg':'calf sleeves',waist:'waist belt',chest:'torso harness'};
  const catalog=R.catalog.filter(i=>i.slots.length===1&&slots.includes(i.slot)).map(i=>({...i,name:`${i.material} ${familyNames[i.slot]}`,family:i.slot}));
  catalog.push({...R.getItem('leather-arm-sleeve'),name:'Monoglove armbinder',family:'armbinder',slots:['shoulders','chest','arms','elbows','wrists','hands','fingers'],description:'A single shaped sleeve encloses both arms and hands behind the back, supported by a shoulder harness.'});
  catalog.push({...R.getItem('leather-boot-wrap'),name:'Cinched leg sheath',family:'sheaths',slots:['upper-leg','knees','lower-leg','ankles','feet','toes'],description:'A joined casing and shared straps hold both legs together from upper thighs to enclosed feet.'});
  catalog.push(...S.catalog,...E.catalog);
  const getItem=id=>catalog.find(i=>i.id===id);
  const methodsFor=item=>item?.family==='silence'?Object.entries(S.methods):item?.family==='gear'?Object.entries(E.methods):R.methodsFor(item);
  function profile(id,methodId){
    const item=getItem(id);if(!item)return null;
    if(['silence','gear'].includes(item.family)){
      const supported=item.family==='silence'?S.methods:E.methods;
      if(!Object.hasOwn(supported,methodId))return null;
      const method=supported[methodId],effects=Object.fromEntries(Object.keys(R.attributes).map(k=>[k,(item.effects[k]||0)+(method.effects[k]||0)]));
      return {item,method,difficulty:item.difficulty+method.difficulty,escape:item.escape+method.escape,cost:item.cost+method.cost,effects};
    }
    const p=R.profile(id,methodId);return p?{...p,item}:null;
  }
  function sanitize(entries){
    if(!Array.isArray(entries))return [];
    const result=[],occupied=new Set();
    for(const raw of entries){
      let id=raw?.itemId,method=raw?.methodId;
      // Prior upper-arm bands become the complete supported arm garment.
      if(['rope-arms','leather-arms','steel-arms'].includes(id)){id='leather-arm-sleeve';if(!R.profile(id,method))method='buckle';}
      const item=getItem(id);if(!item||!profile(id,method)||item.slots.some(s=>occupied.has(s)))continue;
      item.slots.forEach(s=>occupied.add(s));result.push({itemId:id,methodId:method});
    }return result;
  }
  function equip(entries,id,method){
    const current=sanitize(entries),item=getItem(id);if(!item||!profile(id,method))return current;
    return [...current.filter(e=>!getItem(e.itemId).slots.some(s=>item.slots.includes(s))),{itemId:id,methodId:method}];
  }
  function penalties(character){
    const total=Object.fromEntries(Object.keys(R.attributes).map(k=>[k,0]));
    for(const e of sanitize(character.restraints)){const p=profile(e.itemId,e.methodId);for(const k of Object.keys(total))total[k]=Math.min(85,total[k]+p.effects[k]);}return total;
  }
  function randomLoadout(random=Math.random){
    const pick=list=>list[Math.min(list.length-1,Math.floor(random()*list.length))];
    let result=[];
    const major=pick(['armbinder','sheaths','upper-leg']);
    const first=pick(catalog.filter(i=>i.family===major));result=equip(result,first.id,pick(methodsFor(first))[0]);
    while(result.length<3){const choices=catalog.filter(i=>!result.some(e=>getItem(e.itemId).slots.some(s=>i.slots.includes(s))));if(!choices.length)break;const item=pick(choices);result=equip(result,item.id,pick(methodsFor(item))[0]);}return result;
  }
  const assets=['rope-fittings-v2','leather-fittings-v2','steel-fittings-v2','monoglove-v2','cinched-leg-sheath-v3','behind-streetwear-v2','behind-catsuit-v2','behind-swimsuit-v2'];
  const path=name=>`assets/illustrated/${name}.png`;
  // Atlas crop bounds are calibrated from each generated transparent sheet.
  const atlas={
    rope:{wrists:[[48,55,240,230],[350,55,250,230]],ankles:[[716,54,215,257],[960,54,217,257]],'upper-leg':[[46,370,261,292],[333,370,266,292]],'lower-leg':[[712,348,220,419],[967,348,224,419]],waist:[47,866,540,291],chest:[687,785,515,414]},
    leather:{wrists:[[32,48,224,231],[329,48,220,231]],ankles:[[672,17,230,283],[962,17,233,283]],'upper-leg':[[24,426,264,314],[316,426,265,314]],'lower-leg':[[713,372,173,430],[964,372,188,430]],waist:[24,895,588,346],chest:[693,827,486,419]},
    steel:{wrists:[[17,65,261,221],[294,65,274,221]],ankles:[[641,8,283,303],[935,8,279,303]],'upper-leg':[[23,348,255,441],[324,348,262,441]],'lower-leg':[[687,329,223,454],[950,329,225,454]],waist:[32,904,548,297],chest:[674,795,509,470]}
  };
  // Front-facing surfaces in normalized sprite coordinates. Rear rims and
  // return straps are drawn in the rear pass, where the avatar occludes them.
  function frontSurface(family,material,side=0){
    const sides='<path d="M0 0H12V100H0Z M88 0H100V100H88Z"/>';
    if(family==='upper-leg')return '<path fill-rule="evenodd" d="M0 10 Q50 31 100 10 V100H0Z M22 43H78V70Q50 85 22 70Z"/>';
    if(family==='wrists')return `<path d="M0 ${side?27:10} Q50 43 100 ${side?10:27} V100H0Z"/>`;
    if(family==='ankles')return '<path d="M0 32Q50 60 100 32V100H0Z"/>';
    if(family==='lower-leg')return '<path d="M0 5Q50 24 100 5V100H0Z"/>';
    if(family==='waist')return '<path d="M0 28Q50 66 100 28V100H0Z"/><ellipse cx="50" cy="49" rx="19" ry="24"/>'+sides;
    if(family==='chest'){
      const shoulder=material==='steel'?'<path d="M0 9Q50 28 100 9V68H0Z"/>':'<path d="M13 0H26L18 24L11 45H0L7 20Z M74 0H87L93 20L100 45H89L82 24Z M0 36H100V68H0Z"/>';
      return shoulder+'<path d="M0 68Q50 101 100 68V100H0Z M0 35H13V100H0Z M87 35H100V100H87Z"/>'+(material==='rope'?'<path d="M44 35H58V97H44Z"/>':material==='leather'?'<path d="M30 28H72V48H30Z"/>':'');
    }
    if(family==='sheaths')return '<path d="M0 0Q50 15 100 0V100H0Z"/>';
    return '<rect width="100" height="100"/>';
  }
  function sprite(name,box,target,front,id){
    const [x,y,w,h]=target;const size={'rope-fittings-v2':[1254,1254],'leather-fittings-v2':[1222,1287],'steel-fittings-v2':[1225,1284]}[name]||[1024,1536];
    const image=`<svg width="100" height="100" viewBox="${box.join(' ')}" preserveAspectRatio="none" overflow="hidden"><image href="${path(name)}" width="${size[0]}" height="${size[1]}"/></svg>`;
    return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 100 100" preserveAspectRatio="none" overflow="visible">${front?`<defs><clipPath id="${id}">${front}</clipPath></defs><g clip-path="url(#${id})">${image}</g>`:image}</svg>`;
  }
  function render(entry,c,depth='front',prefix='equipment'){
    const item=getItem(entry.itemId);if(!item)return '';
    if(item.family==='silence')return S.render(item,depth,prefix);
    if(item.family==='gear')return E.render(item,c,depth,prefix);
    const material=item.material.toLowerCase(),swim=c.outfit==='swimsuit',family=item.family;
    const front=depth==='front',key=`${prefix}-${item.id}-${depth}`;
    let art='';
    if(family==='sheaths'){
      art=sprite('cinched-leg-sheath-v3',[260,15,510,1495],[344,690,336,795],front?frontSurface('sheaths',material):null,key);
    }else{
      const f=family==='armbinder'?'chest':family;
      const row={wrists:0,ankles:0,'upper-leg':1,'lower-leg':1,waist:2,chest:2}[f],col=['ankles','lower-leg','chest'].includes(f)?1:0;
      const cell=atlas[material]?.[f]||[col*627,row*418,627,418];
      const targets={
        wrists:[[swim?276:272,690,swim?55:65,64],[swim?691:686,690,swim?55:65,64]],
        ankles:[[swim?386:375,1320,swim?60:84,88],[swim?566:552,1320,swim?60:84,88]],
        'upper-leg':[[350,758,153,130],[523,758,153,130]],
        'lower-leg':[[swim?372:366,1050,swim?102:116,245],[swim?546:540,1050,swim?102:116,245]],
        waist:[[385,493,251,97]],chest:[[363,262,294,257]]
      }[f];
      if(targets.length===2){
        const boxes=Array.isArray(cell[0])?cell:[[cell[0],cell[1],cell[2]/2,cell[3]],[cell[0]+cell[2]/2,cell[1],cell[2]/2,cell[3]]];
        art=targets.map((t,i)=>sprite(material+'-fittings-v2',boxes[i],t,front?frontSurface(f,material,i):null,key+'-'+i)).join('');
      }else art=sprite(material+'-fittings-v2',cell,targets[0],front?frontSurface(f,material):null,key);
    }
    if(!front)return `<g data-equipment-depth="rear" data-family="${family}">${art}</g>`;
    let connector='';
    if(['wrists','ankles'].includes(family)){
      const [left,right,y,sag]=family==='wrists'?[309,709,724,90]:[416,593,1367,42];
      if(material==='steel'){
        const count=Math.ceil((right-left)/13);
        connector=Array.from({length:count+1},(_,n)=>{const t=n/count,x=left+(right-left)*t,cy=y+4*sag*t*(1-t),angle=Math.atan2(4*sag*(1-2*t),right-left)*180/Math.PI;return `<ellipse cx="${x}" cy="${cy}" rx="8" ry="${n%2?2.7:5}" transform="rotate(${angle} ${x} ${cy})" fill="none" stroke="#41434b" stroke-width="4"/><ellipse cx="${x}" cy="${cy}" rx="8" ry="${n%2?2.7:5}" transform="rotate(${angle} ${x} ${cy})" fill="none" stroke="#bfc4cc" stroke-width="2"/>`;}).join('');
      }else{
        const d=`M${left} ${y}Q${(left+right)/2} ${y+2*sag} ${right} ${y}`;
        connector=`<path d="${d}" fill="none" stroke="${material==='rope'?'#765b3f':'#39313b'}" stroke-width="7"/><path d="${d}" fill="none" stroke="${material==='rope'?'#dac09a':'#9b8c97'}" stroke-width="2" stroke-dasharray="${material==='rope'?'3 2':'2 5'}"/>`;
      }
    }
    let hardware='';
    if(['padlock','double'].includes(entry.methodId)){
      const [x,y]={wrists:[319,716],ankles:[440,1360],'upper-leg':[490,792],'lower-leg':[468,1100],waist:[510,548],chest:[510,365],armbinder:[510,365],sheaths:[472,796]}[family];
      hardware=`<g data-securing="${entry.methodId}" transform="translate(${x} ${y})"><path d="M-6 0V-7a6 6 0 0 1 12 0V0" fill="none" stroke="#d9dce0" stroke-width="3"/><rect x="-10" width="20" height="18" rx="3" fill="${entry.methodId==='double'?'#bca16e':'#adb5c2'}" stroke="#30303b" stroke-width="2"/><circle cy="8" r="2.5" fill="#353541"/>${entry.methodId==='double'?'<path d="M-5 13H5" stroke="#353541" stroke-width="2"/>':''}</g>`;
    }
    return `<g data-item="${item.id}" data-equipment-depth="front" data-family="${family}">${connector}<g filter="url(#${prefix}-contact)">${art}</g>${hardware}</g>`;
  }
  function detail(entry,prefix='inspect'){
    const item=getItem(entry?.itemId);if(!item)return '';
    if(item.family==='gear')return E.detail(item,prefix);
    if(item.family==='armbinder')return `<img src="${path('monoglove-v2')}" alt="Back of the monoglove: one tapered sleeve, closed hand pocket, shoulder suspension and three fastening straps."><p>Rear equipment detail. The sleeve sits behind the character; its suspension straps are visible from the front.</p>`;
    if(item.family==='sheaths')return `<img src="${path('cinched-leg-sheath-v3')}" alt="Joined leg sheath with shared straps holding thighs, knees and ankles together."><p>A continuous sheath cinches both legs together, including the knees, ankles and enclosed feet.</p>`;
    return '';
  }
  return {catalog,getItem,methods,methodsFor,profile,sanitize,equip,penalties,randomLoadout,assets,path,render,detail};
})();
if(typeof module!=='undefined')module.exports=FittedEquipment;
