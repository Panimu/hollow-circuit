/* Generated PNG sprites only. SVG is used for placement and body occlusion. */
const GeneratedEquipment=(()=>{
  const sheets={
    'hands-scout-v1':[[43,279,560,696],[651,280,560,695]],
    'hands-alloy-v1':[[40,242,524,758],[690,242,524,758]],
    'hands-prism-v1':[[21,228,544,785],[690,228,545,786]],
    'knees-scout-v1':[[38,222,556,812],[660,222,556,812]],
    'knees-alloy-v1':[[54,216,493,812],[707,216,493,812]],
    'knees-prism-v1':[[47,227,526,788],[681,227,526,789]],
    'thighs-woven-v1':[[24,141,555,979],[675,140,555,980]],
    'thighs-leather-v1':[[65,155,510,932],[679,154,511,933]],
    'thighs-steel-v1':[[64,171,507,908],[684,170,507,909]],
    'shins-woven-v1':[[144,93,371,1057],[739,93,371,1057]],
    'shins-leather-v1':[[108,59,430,1130],[716,58,430,1131]],
    'shins-steel-v1':[[113,60,403,1098],[739,60,402,1098]]
  };
  const mapping={};
  ['scout','alloy','prism'].forEach((variant,i)=>{
    mapping[`gear-hands-${i+1}`]={asset:`hands-${variant}-v1`,slot:'hands'};
    mapping[`gear-knees-${i+1}`]={asset:`knees-${variant}-v1`,slot:'knees'};
  });
  ['rope','leather','steel'].forEach((material,i)=>{
    const variant=['woven','leather','steel'][i];
    mapping[`${material}-upper-leg`]={asset:`thighs-${variant}-v1`,slot:'upper-leg'};
    mapping[`${material}-lower-leg`]={asset:`shins-${variant}-v1`,slot:'lower-leg'};
  });
  const assets=Object.keys(sheets),path=name=>`assets/illustrated/${name}.png`;
  const supports=id=>Object.hasOwn(mapping,id);
  function targets(slot,c){
    const swim=c.outfit==='swimsuit';
    return {
      hands:[[280,742,43,60],[697,742,43,60]],
      knees:[[383,994,82,112],[557,994,82,112]],
      'upper-leg':swim?[[371,775,112,198],[542,775,112,198]]:[[364,775,125,210],[536,775,125,210]],
      'lower-leg':swim?[[383,1095,80,240],[559,1095,80,240]]:[[379,1095,88,240],[555,1095,88,240]]
    }[slot];
  }
  function surface(spec,side){
    if(spec.slot==='upper-leg')return side?'M0 18Q75 20 100 0V100H0Z':'M0 0Q25 20 100 18V100H0Z';
    if(spec.asset==='shins-leather-v1')return 'M0 3Q50 22 100 3V100H0Z';
    if(spec.asset==='shins-steel-v1')return side?'M0 4Q20 13 45 6Q80 13 100 0V100H0Z':'M0 0Q20 13 55 6Q80 13 100 4V100H0Z';
    return 'M0 0H100V100H0Z';
  }
  function render(item,c,depth='front',prefix='generated'){
    const spec=mapping[item.id];if(!spec)return '';
    const front=depth==='front',wraps=['upper-leg','lower-leg'].includes(spec.slot);
    const art=!front&&!wraps?'':targets(spec.slot,c).map(([x,y,w,h],side)=>{
      const key=`${prefix}-${item.id}-${depth}-${side}`,[bx,by,bw,bh]=sheets[spec.asset][side];
      const image=`<svg width="100" height="100" viewBox="${bx-3} ${by-3} ${bw+6} ${bh+6}" preserveAspectRatio="none"><image href="${path(spec.asset)}" width="1254" height="1254"/></svg>`;
      const angle=spec.slot==='hands'?(side?-9:9):0;
      return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 100 100" preserveAspectRatio="none" overflow="visible"${angle?` transform="rotate(${angle} ${x+w/2} ${y+h/2})"`:''}>${front?`<defs><clipPath id="${key}"><path d="${surface(spec,side)}"/></clipPath></defs><g clip-path="url(#${key})">${image}</g>`:image}</svg>`;
    }).join('');
    return `<g ${front?`data-item="${item.id}"`:''} data-equipment-depth="${depth}" data-family="${item.family}" data-slot="${spec.slot}" data-renderer="generated">${art}</g>`;
  }
  function detail(item){
    const spec=mapping[item.id];return spec?`<img src="${path(spec.asset)}" alt="${item.name}: matching left and right pieces"><p>${item.description}</p>`:'';
  }
  return {sheets,mapping,assets,path,supports,targets,render,detail};
})();
if(typeof module!=='undefined')module.exports=GeneratedEquipment;
