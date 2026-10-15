/* Front-facing illustration compositor. Generated PNGs remain unmodified. */
const IllustratedAvatar = (() => {
  const R = typeof RestraintSystem !== 'undefined' ? RestraintSystem : require('./restraints');
  const options = {
    skin: { porcelain:'Porcelain', sand:'Sand', bronze:'Bronze', umber:'Umber' },
    style: { bob:'Soft bob', ponytail:'Ponytail' },
    hair: { midnight:'Midnight', chestnut:'Chestnut', silver:'Silver', copper:'Copper', violet:'Violet' },
    outfit: { streetwear:'Streetwear', swimsuit:'Athletic swimsuit', catsuit:'Latex catsuit' }
  };
  const slots = ['wrists','ankles','arms','lower-leg','waist','chest'];
  const catalog = R.catalog.filter(i => i.slots.length === 1 && slots.includes(i.slot));
  const defaults = () => [
    {skin:'porcelain',style:'bob',hair:'midnight',outfit:'streetwear',restraints:[]},
    {skin:'bronze',style:'ponytail',hair:'chestnut',outfit:'catsuit',restraints:[]}
  ];
  function sanitize(value, index=0) {
    const result=defaults()[index === 1 ? 1 : 0];
    if (!value || typeof value !== 'object') return result;
    for(const key of Object.keys(options)) if(Object.hasOwn(options[key],value[key])) result[key]=value[key];
    result.restraints=R.sanitize(value.restraints).filter(e=>catalog.some(i=>i.id===e.itemId));
    return result;
  }
  function equip(value,itemId,methodId) {
    const result=sanitize(value),item=catalog.find(i=>i.id===itemId);
    if(!item || !R.profile(itemId,methodId)) return result;
    result.restraints=result.restraints.filter(e=>R.getItem(e.itemId).slot!==item.slot);
    result.restraints.push({itemId,methodId});
    return result;
  }
  function randomEquipment(random=Math.random) {
    const pick=list=>list[Math.min(list.length-1,Math.floor(random()*list.length))];
    const remaining=[...slots],result=[];
    for(let n=0;n<3;n++) {const slot=pick(remaining);remaining.splice(remaining.indexOf(slot),1);const item=pick(catalog.filter(i=>i.slot===slot));result.push({itemId:item.id,methodId:pick(R.methodsFor(item))[0]});}
    return result;
  }
  const assets=['foundation','swimsuit','streetwear','catsuit','hair-bob','hair-ponytail','rope-band','leather-band','steel-band'];
  const path=name=>`assets/illustrated/${name}.png`;
  const pic=(name,extra='')=>`<image href="${path(name)}" width="1036" height="1518" ${extra}/>`;
  const skin={porcelain:[1,1,1],sand:[.88,.76,.68],bronze:[.68,.49,.38],umber:[.45,.31,.25]};
  const colors={midnight:[[.025,.035,.05],[.34,.41,.46],[.8,.85,.9]],chestnut:[[.07,.035,.025],[.6,.36,.22],[.9,.75,.6]],silver:[[.22,.25,.3],[.88,.91,.94],[1,1,1]],copper:[[.13,.055,.025],[.82,.43,.22],[1,.87,.7]],violet:[[.09,.05,.15],[.6,.43,.75],[.9,.83,.96]]};
  function render(value,index=0,detail=false) {
    const c=sanitize(value,index),id=`art${index === 1 ? 1 : 0}`,swim=c.outfit==='swimsuit';
    const head='<path d="M418 0H600V174L563 212L510 238L454 207L418 173Z"/>';
    const hands='<rect x="245" y="705" width="110" height="145"/><rect x="675" y="705" width="110" height="145"/>';
    const swimClip='<path d="M478 233H539V255L640 270H1036V1518H0V270H374L478 255Z"/>';
    const tint=skin[c.skin],hair=colors[c.hair];
    const body=swim ? pic('swimsuit',`clip-path="url(#${id}-swim)"`) : '';
    const base=pic('foundation',`clip-path="url(#${id}-parts)"`);
    const hairTransform=c.style==='bob'?'translate(213 4) scale(.58)':'translate(239 4) scale(.53 .43)';
    const garment=swim?'':pic(c.outfit,`transform="${c.outfit==='streetwear'?'translate(51 99) scale(.90 .93)':'translate(25 119) scale(.93 .92)'}"`);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${detail?'220 0 590 870':'155 0 730 1518'}" role="img" aria-labelledby="${id}-title"><title id="${id}-title">${index===1?'Vesper':'Nova'}, adult age 20, ${options.outfit[c.outfit]}, ${options.style[c.style]}, ${options.skin[c.skin]} skin, ${options.hair[c.hair]} hair. ${c.restraints.length} equipment pieces. Front standing view.</title><defs>
      <clipPath id="${id}-parts">${head}${swim?'':hands}</clipPath><clipPath id="${id}-swim">${swimClip}</clipPath>
      <filter id="${id}-clean" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncA type="linear" slope="1.18" intercept="-.18"/></feComponentTransfer></filter>
      <filter id="${id}-warm" color-interpolation-filters="sRGB"><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 20 0 -20 0 -.2"/><feComposite in2="SourceAlpha" operator="in"/></filter>
      <filter id="${id}-skin" color-interpolation-filters="sRGB"><feComponentTransfer>${['R','G','B'].map((ch,n)=>`<feFunc${ch} type="linear" slope="${tint[n]}"/>`).join('')}</feComponentTransfer></filter>
      <filter id="${id}-hair" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/><feComponentTransfer>${['R','G','B'].map((ch,n)=>`<feFunc${ch} type="table" tableValues="${hair.map(row=>row[n]).join(' ')}"/>`).join('')}</feComponentTransfer></filter>
      <mask id="${id}-skinmask" maskUnits="userSpaceOnUse" x="0" y="0" width="1036" height="1518"><g filter="url(#${id}-warm)">${body}${base}</g></mask>
      </defs><ellipse cx="515" cy="1482" rx="167" ry="18" fill="#b3a8ae" opacity=".25"/>
      <g filter="url(#${id}-clean)">${body}${base}<g mask="url(#${id}-skinmask)" filter="url(#${id}-skin)">${body}${base}</g>${garment}<g filter="url(#${id}-hair)">${pic('hair-'+c.style,`transform="${hairTransform}"`)}</g>${c.restraints.map(e=>equipment(e,swim)).join('')}</g></svg>`;
  }
  function equipment(entry,swim) {
    const item=R.getItem(entry.itemId),material=item.material.toLowerCase();
    const anchors={wrists:[[300,724],[718,724],swim?52:66,24],ankles:[[414,1365],[592,1365],swim?54:78,27],arms:[[swim?366:351,403],[swim?650:664,403],swim?68:98,32],'lower-leg':[[419,1125],[594,1125],swim?82:105,34],waist:[[510,532],null,230,52],chest:[[510,393],null,252,53]};
    const [a,b,width,height]=anchors[item.slot],box={rope:'276 229 1222 460',leather:'178 219 1419 459',steel:'143 176 1491 551'}[material];
    const band=([x,y])=>`<svg x="${x-width/2}" y="${y-height/2}" width="${width}" height="${height}" viewBox="${box}" preserveAspectRatio="none"><image href="${path(material+'-band')}" width="1774" height="887"/></svg>`;
    let tether='';
    if(b && ['wrists','ankles'].includes(item.slot)) {
      const d=`M${a[0]} ${a[1]+5} Q510 ${a[1]+95} ${b[0]} ${b[1]+5}`;
      tether=`<path d="${d}" fill="none" stroke="${material==='rope'?'#705231':material==='leather'?'#32251f':'#515962'}" stroke-width="7"/><path d="${d}" fill="none" stroke="${material==='rope'?'#d4b282':material==='leather'?'#80664d':'#d4dbe1'}" stroke-width="3" stroke-dasharray="${material==='leather'?'0':'5 4'}"/>`;
    }
    const lock=['padlock','double'].includes(entry.methodId)?`<g transform="translate(${a[0]+width*.24} ${a[1]+height*.3})"><path d="M-6 0V-5a6 6 0 0 1 12 0V0" fill="none" stroke="#d5dce2" stroke-width="3"/><rect x="-9" y="0" width="18" height="16" rx="3" fill="${entry.methodId==='double'?'#c2a46a':'#aeb8c4'}" stroke="#343b46" stroke-width="2"/><circle cy="7" r="2" fill="#343b46"/></g>`:'';
    return `<g data-item="${item.id}">${tether}${band(a)}${b?band(b):''}${lock}</g>`;
  }
  return {options,slots,catalog,defaults,sanitize,equip,randomEquipment,assets,path,render};
})();
if(typeof module!=='undefined') module.exports=IllustratedAvatar;
