/* Front-facing illustration compositor. Generated PNGs remain unmodified. */
const IllustratedAvatar = (() => {
  const R = typeof RestraintSystem !== 'undefined' ? RestraintSystem : require('./restraints');
  const F = typeof FittedEquipment !== 'undefined' ? FittedEquipment : require('./fitted-equipment');
  const options = {
    skin: { porcelain:'Porcelain', sand:'Sand', bronze:'Bronze', umber:'Umber' },
    style: { bob:'Soft bob', ponytail:'Ponytail' },
    hair: { midnight:'Midnight', chestnut:'Chestnut', silver:'Silver', copper:'Copper', violet:'Violet' },
    outfit: { streetwear:'Streetwear', swimsuit:'Athletic swimsuit', catsuit:'Latex catsuit' }
  };
  const slots = [...R.slots];
  const catalog = F.catalog;
  const defaults = () => [
    {skin:'porcelain',style:'bob',hair:'midnight',outfit:'streetwear',restraints:[]},
    {skin:'bronze',style:'ponytail',hair:'chestnut',outfit:'catsuit',restraints:[]}
  ];
  function sanitize(value, index=0) {
    const result=defaults()[index === 1 ? 1 : 0];
    if (!value || typeof value !== 'object') return result;
    for(const key of Object.keys(options)) if(Object.hasOwn(options[key],value[key])) result[key]=value[key];
    result.restraints=F.sanitize(value.restraints);
    return result;
  }
  function equip(value,itemId,methodId) {
    const result=sanitize(value),item=catalog.find(i=>i.id===itemId);
    if(!item || !F.profile(itemId,methodId)) return result;
    result.restraints=F.equip(result.restraints,itemId,methodId);
    return result;
  }
  function randomEquipment(random=Math.random) {
    return F.randomLoadout(random);
  }
  const assets=['foundation','swimsuit','streetwear','catsuit','hair-bob','hair-ponytail',...F.assets];
  const path=name=>`assets/illustrated/${name}.png`;
  const pic=(name,extra='')=>`<image href="${path(name)}" width="1036" height="1518" ${extra}/>`;
  const skin={porcelain:[1,1,1],sand:[.88,.76,.68],bronze:[.68,.49,.38],umber:[.45,.31,.25]};
  const colors={midnight:[[.025,.035,.05],[.34,.41,.46],[.8,.85,.9]],chestnut:[[.07,.035,.025],[.6,.36,.22],[.9,.75,.6]],silver:[[.22,.25,.3],[.88,.91,.94],[1,1,1]],copper:[[.13,.055,.025],[.82,.43,.22],[1,.87,.7]],violet:[[.09,.05,.15],[.6,.43,.75],[.9,.83,.96]]};
  function render(value,index=0,detail=false) {
    const c=sanitize(value,index),id=`art${index === 1 ? 1 : 0}`,swim=c.outfit==='swimsuit';
    const behind=c.restraints.some(e=>F.getItem(e.itemId).family==='armbinder');
    const sheaths=c.restraints.some(e=>F.getItem(e.itemId).family==='sheaths');
    const head='<path d="M418 0H600V174L563 212L510 238L454 207L418 173Z"/>';
    const hands='<rect x="245" y="705" width="110" height="145"/><rect x="675" y="705" width="110" height="145"/>';
    const swimClip='<path d="M478 233H539V255L640 270H1036V1518H0V270H374L478 255Z"/>';
    const tint=skin[c.skin],hair=colors[c.hair];
    const body=behind?pic('behind-'+c.outfit+'-v2',`clip-path="url(#${id}-posebody)"`):swim ? pic('swimsuit',`clip-path="url(#${id}-swim)"`) : '';
    const base=pic('foundation',`clip-path="url(#${id}-parts)"`);
    const hairTransform=c.style==='bob'?'translate(213 4) scale(.58)':'translate(239 4) scale(.53 .43)';
    const garment=swim||behind?'':pic(c.outfit,`transform="${c.outfit==='streetwear'?'translate(51 99) scale(.90 .93)':'translate(25 119) scale(.93 .92)'}"`);
    const order={sheaths:0,'lower-leg':1,'upper-leg':2,ankles:3,waist:4,chest:5,armbinder:6,wrists:7,silence:8};
    const depth=item=>item.family==='gear'?({feet:0.2,toes:0.3,knees:1.5,shoulders:5.5,arms:5.6,elbows:5.7,hands:7.1,fingers:7.2,neck:7.3,head:7.4,face:7.5}[item.slot]):order[item.family];
    const frontEntries=[...c.restraints].sort((a,b)=>depth(F.getItem(a.itemId))-depth(F.getItem(b.itemId)));
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${detail?'220 0 590 870':'155 0 730 1518'}" role="img" aria-labelledby="${id}-title"><title id="${id}-title">${index===1?'Vesper':'Nova'}, adult age 20, ${options.outfit[c.outfit]}, ${options.style[c.style]}, ${options.skin[c.skin]} skin, ${options.hair[c.hair]} hair. ${c.restraints.length} equipment pieces. Front ${behind?'arms behind':'standing'} view${sheaths?', legs cinched together':''}.</title><defs>
      <clipPath id="${id}-parts">${head}${swim||behind?'':hands}</clipPath><clipPath id="${id}-swim">${swimClip}</clipPath>
      <clipPath id="${id}-posebody"><path d="M455 233H565V260H1036V1518H0V260H455Z"/></clipPath>
      <clipPath id="${id}-under-sheaths"><rect width="1036" height="740"/>${behind?'':'<rect x="245" y="705" width="90" height="145"/><rect x="685" y="705" width="90" height="145"/>'}</clipPath>
      <filter id="${id}-clean" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncA type="linear" slope="1.18" intercept="-.18"/></feComponentTransfer></filter>
      <filter id="${id}-contact" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB"><feDropShadow dx="0" dy="2" stdDeviation="1.4" flood-color="#19151b" flood-opacity=".35"/></filter>
      <filter id="${id}-warm" color-interpolation-filters="sRGB"><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 20 0 -20 0 -.2"/><feComposite in2="SourceAlpha" operator="in"/></filter>
      <filter id="${id}-skin" color-interpolation-filters="sRGB"><feComponentTransfer>${['R','G','B'].map((ch,n)=>`<feFunc${ch} type="linear" slope="${tint[n]}"/>`).join('')}</feComponentTransfer></filter>
      <filter id="${id}-hair" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/><feComponentTransfer>${['R','G','B'].map((ch,n)=>`<feFunc${ch} type="table" tableValues="${hair.map(row=>row[n]).join(' ')}"/>`).join('')}</feComponentTransfer></filter>
      <mask id="${id}-skinmask" maskUnits="userSpaceOnUse" x="0" y="0" width="1036" height="1518"><g filter="url(#${id}-warm)">${body}${base}</g></mask>
      </defs><ellipse cx="515" cy="1482" rx="167" ry="18" fill="#b3a8ae" opacity=".25"/>
      <g filter="url(#${id}-clean)">${c.restraints.map(e=>F.render(e,c,'rear',id)).join('')}<g data-avatar-body="true" ${sheaths?`clip-path="url(#${id}-under-sheaths)"`:''}>${body}${base}<g mask="url(#${id}-skinmask)" filter="url(#${id}-skin)">${body}${base}</g>${garment}</g><g filter="url(#${id}-hair)">${pic('hair-'+c.style,`transform="${hairTransform}"`)}</g>${frontEntries.map(e=>F.render(e,c,'front',id)).join('')}</g></svg>`;
  }
  return {options,slots,catalog,defaults,sanitize,equip,randomEquipment,assets,path,render};
})();
if(typeof module!=='undefined') module.exports=IllustratedAvatar;
