/* Slot-specific armor and simulator modules. Geometry is authored per slot/variant. */
const DungeonEquipment = (() => {
  const G=typeof GeneratedEquipment!=='undefined'?GeneratedEquipment:require('./generated-equipment');
  const methods={
    dock:{name:'Dock module',difficulty:0,escape:0,cost:0,effects:{}},
    calibrate:{name:'Calibrate module',difficulty:10,escape:15,cost:1,effects:{focus:3}}
  };
  const specs=[
    ['toes',['Trail toe guards','Split sabaton tips','Prism toe shields'],['Low curved caps protect the boot tips.','Three overlapping plates follow each boot tip.','Faceted energy shields project above the toes.'],{movement:6,evasion:4},24,18],
    ['feet',['Instep guards','Ridge sabatons','Vector foot modules'],['Narrow instep plates leave the toes and ankles free.','Segmented armor follows the top of each foot.','Raised navigation modules add simulated movement drag.'],{movement:12,recovery:3},30,24],
    ['knees',['Scout knee pads','Articulated poleyns','Vector knee shields'],['Rounded impact pads sit over each kneecap.','Three hinged sections follow the front of each knee.','Angular projection shields interfere with dodge timing.'],{evasion:15,movement:5},34,28],
    ['shoulders',['Scout shoulder caps','Layered pauldrons','Prism shoulder fins'],['Compact caps follow the shoulder curve.','Overlapping armor plates extend across each shoulder.','Twin fins project a simulator interference field.'],{dexterity:8,recovery:5},36,30],
    ['arms',['Scout arm plates','Ridge rerebraces','Vector arm modules'],['Tapered upper-arm plates leave elbows free.','Segmented upper-arm shells track the sleeve contour.','Angular modules add simulated arm-action latency.'],{dexterity:12,recovery:5},34,28],
    ['elbows',['Scout elbow pads','Winged couters','Pivot elbow modules'],['Oval pads sit on the elbow joints.','Winged plates leave the upper arms and wrists free.','Circular pivot modules add precision-action interference.'],{dexterity:10,evasion:5},32,26],
    ['hands',['Scout hand shields','Knuckle plates','Prism hand plates'],['Contoured composite plates follow the backs of the hands.','Overlapping metal plates cover the knuckles without covering fingers.','Shaped hand armor with inset crystals adds gesture latency.'],{dexterity:14,focus:3},30,22],
    ['fingers',['Digit sensor tabs','Articulated digit plates','Rune fingertip nodes'],['Individual narrow tabs track finger motion.','Separate joint plates follow each visible finger.','Small rune nodes interfere with fine gesture timing.'],{dexterity:12,focus:4},38,20],
    ['neck',['Scout gorget','Split plate gorget','Prism throat ward'],['A shallow armor plate rests at the base of the neck.','Two sculpted plates guard the sides of the throat.','A hovering ward adds concentration interference; it does not silence spells.'],{focus:8,recovery:3},34,28],
    ['face',['Scout eye visor','Split lens visor','Prism targeting visor'],['A narrow translucent visor spans the eyes.','Two separate lenses add targeting interference.','An angular projection disrupts visual targeting; spoken spells remain available.'],{focus:14,evasion:6},40,32],
    ['head',['Scout brow guard','Ridge crown guard','Prism halo array'],['A curved brow plate follows the hairline.','A raised crest and side plates protect the crown.','A floating sensor array adds concentration interference.'],{focus:12,recovery:5},42,34]
  ];
  const catalog=specs.flatMap(([slot,names,descriptions,effects,difficulty,escape])=>names.map((name,variant)=>({
    id:`gear-${slot}-${variant+1}`,name,slot,slots:[slot],family:'gear',material:['Composite','Alloy','Prism'][variant],variant,
    description:descriptions[variant],difficulty:difficulty+variant*8,escape:escape+variant*10,cost:2+(variant===2?1:0),
    effects:Object.fromEntries(Object.entries(effects).map(([key,value],n)=>[key,value+(n===0?variant*4:variant*2)]))
  })));
  const getItem=id=>catalog.find(item=>item.id===id);
  const P=d=>`<path d="${d}"/>`;
  const L=d=>`<path d="${d}" fill="none" class="seam"/>`;
  function shape(slot,v){
    switch(slot){
      case 'toes':return [
        P('M7 45Q50 20 93 45L97 79Q50 102 3 79Z')+L('M12 60Q50 42 88 60'),
        P('M12 32Q50 18 88 32L92 51Q50 65 8 51Z M8 52Q50 38 92 52L96 72Q50 86 4 72Z M4 74Q50 61 96 74L94 91Q50 105 6 91Z'),
        P('M50 15L92 39L98 75L50 97L2 75L8 39Z')+L('M50 15V97M8 39L50 62L92 39')
      ][v];
      case 'feet':return [
        P('M30 8Q50 0 70 8L87 74Q50 98 13 74Z')+L('M38 18L28 68M62 18L72 68'),
        P('M28 3H72L78 28Q50 42 22 28Z M22 30Q50 19 78 30L84 57Q50 74 16 57Z M16 60Q50 45 84 60L92 85Q50 105 8 85Z'),
        P('M50 0L75 18L88 76L50 100L12 76L25 18Z')+L('M50 10V89M25 30L50 48L75 30M20 65L50 82L80 65')
      ][v];
      case 'shoulders':return [
        P('M5 36Q25 0 68 9Q91 19 98 60L75 82L12 70Z')+L('M15 38Q39 13 70 24'),
        P('M5 24Q40 -5 76 16L94 43L76 59L8 47Z M8 48L76 38L100 65L77 84L14 72Z M15 73L77 65L94 89L73 100L21 91Z'),
        P('M0 34L40 2L81 16L100 58L72 76L16 62Z M17 67L73 82L67 98L27 89Z')+L('M40 2L48 47L81 16M0 34L48 47L100 58')
      ][v];
      case 'arms':return [
        P('M16 5Q50 -3 84 5L73 91Q50 104 27 91Z')+L('M27 14L36 86M73 14L64 86'),
        P('M12 3H88L84 33Q50 47 16 33Z M16 35Q50 22 84 35L79 64Q50 79 21 64Z M21 67Q50 53 79 67L72 94Q50 105 28 94Z'),
        P('M50 0L88 20L72 89L50 100L28 89L12 20Z')+L('M50 10V89M12 20L50 40L88 20M28 70L50 85L72 70')
      ][v];
      case 'elbows':return [
        '<ellipse cx="50" cy="50" rx="36" ry="44"/>'+L('M31 20Q50 8 69 20M31 80Q50 92 69 80'),
        P('M50 6L78 28L100 44L81 65L50 94L19 65L0 44L22 28Z')+L('M22 28L50 50L78 28M19 65L50 50L81 65'),
        P('M24 6H76L94 30V70L76 94H24L6 70V30Z')+'<circle cx="50" cy="50" r="28"/><circle cx="50" cy="50" r="13" class="node"/>'
      ][v];
      case 'fingers':return Array.from({length:4},(_,n)=>{
        const x=13+n*21,y=[16,0,7,27][n];
        return `<g transform="translate(${x} ${y})">${v===0?'<rect x="-6" width="12" height="45" rx="5"/>':v===1?'<rect x="-7" width="14" height="19" rx="4"/><rect x="-6" y="23" width="12" height="18" rx="4"/><rect x="-5" y="45" width="10" height="15" rx="4"/>':P('M0 0L8 10L0 20L-8 10Z')+L('M0 22V52')+'<circle cy="57" r="5" class="node"/>'}</g>`;
      }).join('');
      case 'neck':return [
        P('M7 18Q50 41 93 18L88 66Q50 98 12 66Z')+L('M17 33Q50 53 83 33M20 64Q50 83 80 64'),
        P('M4 7L42 34L45 92L14 69Z M96 7L58 34L55 92L86 69Z')+L('M15 25L32 40L34 73M85 25L68 40L66 73'),
        P('M50 10L82 43L50 92L18 43Z')+L('M50 24L68 45L50 73L32 45Z M5 24L12 65M95 24L88 65')
      ][v];
      case 'face':return [
        P('M0 17Q50 0 100 17L92 62Q50 85 8 62Z')+L('M7 25Q50 10 93 25'),
        P('M1 18L41 8L44 57L8 70Z M99 18L59 8L56 57L92 70Z')+L('M44 28Q50 20 56 28M8 27L35 19M65 19L92 27'),
        P('M0 28L22 3L50 20L78 3L100 28L85 66L50 52L15 66Z')+L('M10 28L28 19L42 31M58 31L72 19L90 28')
      ][v];
      case 'head':return [
        P('M5 48Q50 4 95 48L90 68Q50 31 10 68Z')+L('M13 47Q50 15 87 47'),
        P('M6 48L35 25L50 0L65 25L94 48L87 77L63 52L50 69L37 52L13 77Z')+L('M50 10V56M16 50L33 40M67 40L84 50'),
        P('M50 0L63 20L50 40L37 20Z M5 40L20 23L29 42L15 62Z M95 40L80 23L71 42L85 62Z')+L('M20 23Q50 -6 80 23M15 62L10 83M85 62L90 83')
      ][v];
      default:return '';
    }
  }
  function targets(slot,c){
    if(['hands','knees'].includes(slot))return G.targets(slot,c);
    const swim=c.outfit==='swimsuit';
    return {
      toes:swim?[[379,1437,77,45],[561,1437,77,45]]:[[364,1435,108,43],[550,1435,108,43]],
      feet:swim?[[386,1370,67,68],[565,1370,67,68]]:[[379,1370,81,68],[561,1370,81,68]],
      knees:[[368,991,119,122],[538,991,119,122]],
      shoulders:[[332,278,119,98],[574,278,119,98]],
      arms:swim?[[325,385,67,142],[633,385,67,142]]:[[310,385,90,156],[625,385,90,156]],
      elbows:swim?[[301,554,61,72],[663,554,61,72]]:[[285,554,90,85],[650,554,90,85]],
      hands:[[278,749,48,61],[697,749,48,61]],
      fingers:[[273,793,44,43],[707,793,44,43]],
      neck:[[471,227,80,45]],face:[[447,137,128,45]],head:[[413,32,196,86]]
    }[slot];
  }
  function render(item,c,depth='front',prefix='gear'){
    if(G.supports(item.id))return G.render(item,c,depth,prefix);
    const places=targets(item.slot,c),v=item.variant,key=`${prefix}-${item.id}-${depth}`;
    const palette=[['#b9c1c9','#424f5d','#202a35','#a6d5d2'],['#ebdcc4','#7b7168','#33353b','#e6bf7b'],['#c7e5f9','#466782','#172c49','#8eeaff']][v];
    const defs=`<defs><linearGradient id="${key}-metal" x1="0" y1="0" x2="1" y2=".6"><stop stop-color="${palette[0]}"/><stop offset=".38" stop-color="${palette[1]}"/><stop offset=".7" stop-color="${palette[2]}"/><stop offset="1" stop-color="${palette[1]}"/></linearGradient><filter id="${key}-shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1.5" stdDeviation="1.3" flood-color="#18202b" flood-opacity=".4"/></filter><clipPath id="${key}"><rect x="-3" y="-3" width="106" height="109"/></clipPath></defs>`;
    const art=places.map(([x,y,w,h],n)=>{
      const mirrored=n===1&&['shoulders','hands','fingers'].includes(item.slot);
      // These are front-docked plates/projections, with no floating wrap straps.
      return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 100 100" preserveAspectRatio="none" overflow="visible"><g ${mirrored?'transform="translate(100 0) scale(-1 1)"':''}>${depth==='front'?`<g filter="url(#${key}-shadow)"><g clip-path="url(#${key})">${shape(item.slot,v)}</g></g>`:''}</g></svg>`;
    }).join('');
    return `<g ${depth==='front'?`data-item="${item.id}"`:''} data-equipment-depth="${depth}" data-family="gear" data-slot="${item.slot}" fill="${depth==='front'?`url(#${key}-metal)`:'#283441'}" ${item.slot==='face'?'fill-opacity=".52"':''} stroke="${palette[2]}" stroke-width="1.6" stroke-linejoin="round">${defs}<style>#${key}-art .seam{stroke:${palette[0]};stroke-width:1.3;opacity:.85}#${key}-art .node{fill:${palette[3]}}</style><g id="${key}-art">${art}</g></g>`;
  }
  function detail(item,instance='inspect'){
    if(G.supports(item.id))return G.detail(item);
    const c={outfit:'streetwear'},places=targets(item.slot,c),[x,y,w,h]=places[0],prefix=instance+'-'+item.id;
    return `<svg class="gear-detail" viewBox="${x-10} ${y-10} ${w+20} ${h+20}" role="img" aria-label="${item.name} shape detail">${render(item,c,'front',prefix)}</svg><p>${item.description} ${places.length===2?'One side shown; the equipped pair fits both sides.':'Single central module.'} Front-docked plates and projections follow this slot's shape.</p>`;
  }
  return {catalog,methods,getItem,shape,targets,render,detail};
})();
if(typeof module!=='undefined')module.exports=DungeonEquipment;
