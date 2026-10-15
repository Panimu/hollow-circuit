/* Enclosed helmets, woven face masks and external spell-interference faceplates. */
const HeadEquipment=(()=>{
  const methods={
    mount:{name:'Fit assembly',difficulty:0,escape:0,cost:0,effects:{}},
    sync:{name:'Synchronize module',difficulty:10,escape:16,cost:1,effects:{focus:4}}
  };
  const full=['head','face','mouth','neck'];
  const catalog=[
    {id:'head-scout-helmet',name:'Scout enclosed helmet',kind:'helmet',variant:0,slots:full,difficulty:48,escape:36,cost:3,effects:{focus:8,evasion:5,communication:10},blocksVerbal:false,description:'A composite explorer shell with stitched leather edging, a hinged optical visor and voice relay. Spoken spells remain available.'},
    {id:'head-sentinel-helmet',name:'Sentinel ward helmet',kind:'helmet',variant:1,slots:full,difficulty:58,escape:48,cost:4,effects:{focus:14,evasion:8},blocksVerbal:true,description:'Layered armor with leather cheek trim, a hinged eye visor and a rune grille. The grille disrupts spoken incantations even with the visor raised.'},
    {id:'head-prism-helmet',name:'Prism isolation helmet',kind:'helmet',variant:2,slots:full,difficulty:66,escape:58,cost:4,effects:{focus:18,evasion:10},blocksVerbal:true,description:'A faceted protective shell with stitched leather edging, a hinged crystal visor and a voice-cancellation field.'},
    {id:'head-scout-mask',name:'Scout technical mask',kind:'fabric',variant:0,slots:full,difficulty:30,escape:22,cost:2,effects:{focus:4,communication:5},blocksVerbal:false,description:'A close-fitting charcoal technical-fabric mask with a single eye opening, contoured cheek seams and a vented lower panel. Spoken spells remain available.'},
    {id:'head-ranger-mask',name:'Ranger fabric mask',kind:'fabric',variant:1,slots:full,difficulty:36,escape:28,cost:2,effects:{focus:6,evasion:4},blocksVerbal:false,description:'A reinforced textile balaclava with separate eye openings and a stitched cheek panel. Spoken spells remain available.'},
    {id:'head-runewoven-mask',name:'Runewoven fabric mask',kind:'fabric',variant:2,slots:full,difficulty:44,escape:38,cost:3,effects:{focus:10,communication:10},blocksVerbal:true,description:'Woven indigo panels and embroidered ward lines surround an open eye window. The active rune interrupts spoken spells.'},
    {id:'head-resonance-plate',name:'Resonance faceplate',kind:'plate',variant:0,slots:['mouth'],difficulty:38,escape:30,cost:2,effects:{focus:6},blocksVerbal:true,description:'An external metal grille follows the lower face. Its resonator cancels the patterns used by spoken spells.'},
    {id:'head-hush-plate',name:'Ceramic hush faceplate',kind:'plate',variant:1,slots:['mouth'],difficulty:46,escape:40,cost:3,effects:{focus:9},blocksVerbal:true,description:'A curved ceramic lower-face shell with recessed rune channels and side-mounted field emitters.'},
    {id:'head-counterspell-plate',name:'Prism counterspell faceplate',kind:'plate',variant:2,slots:['mouth'],difficulty:54,escape:50,cost:3,effects:{focus:12},blocksVerbal:true,description:'A faceted lower-face module with a central crystal and twin acoustic field emitters.'}
  ].map(item=>({...item,slots:[...item.slots],slot:item.kind==='plate'?'mouth':'head',family:'headgear',material:item.kind==='fabric'?'Textile':['Composite','Alloy','Prism'][item.variant],hidesHair:item.kind!=='plate'}));
  const getItem=id=>catalog.find(item=>item.id===id);
  const eyeWindow='M445 137Q474 127 510 138Q547 127 577 137L574 168Q544 177 511 166Q478 177 448 168Z';
  const splitEyes='M445 139Q476 127 502 139L500 165Q474 177 448 166Z M520 139Q548 127 577 139L574 166Q548 177 522 165Z';
  const eyePath=item=>item.kind==='fabric'&&item.variant===1?splitEyes:eyeWindow;
  const shell='M412 108Q411 29 458 12Q510 -4 564 12Q613 29 612 108L608 181Q600 211 561 235L561 264Q511 282 461 264L461 235Q423 211 414 181Z';
  const fabricShell='M430 108Q426 45 463 22Q511 1 559 22Q596 45 592 108L588 169Q584 201 554 225L551 259Q511 271 471 259L468 225Q438 201 434 169Z';
  function visor(raised,key,colors){
    const lens=raised?'M440 100Q511 73 582 100L574 124Q511 106 448 124Z':eyeWindow;
    return `<g data-visor="${raised?'raised':'lowered'}"><path d="${raised?'M423 149L441 112M599 149L581 112':'M423 149H445M599 149H577'}" fill="none" stroke="${colors[1]}" stroke-width="6"/><path d="${lens}" fill="#7fbcd1" fill-opacity="${raised?'.4':'.18'}" stroke="${colors[2]}" stroke-width="5"/><path d="${lens}" fill="none" stroke="${colors[3]}" stroke-width="1.2"/><clipPath id="${key}-lens"><path d="${lens}"/></clipPath><g clip-path="url(#${key}-lens)" stroke="#ecf7ff" stroke-opacity=".28" stroke-width="8"><path d="M460 85L495 180M477 80L512 175"/></g><circle cx="423" cy="149" r="8" fill="${colors[1]}" stroke="${colors[2]}" stroke-width="2"/><circle cx="599" cy="149" r="8" fill="${colors[1]}" stroke="${colors[2]}" stroke-width="2"/><path d="M419 149H427M595 149H603" stroke="${colors[0]}" stroke-width="1.5"/></g>`;
  }
  function render(entry,c,depth='front',prefix='head'){
    const item=getItem(entry.itemId);if(!item)return '';
    if(depth!=='front')return '<g data-equipment-depth="rear" data-family="headgear"></g>';
    const key=`${prefix}-${item.id}-front`,v=item.variant;
    const colors=item.kind==='fabric'?[['#535e65','#252d34','#111920','#88989f'],['#746e60','#393b36','#1c2424','#a9a28a'],['#666987','#30394e','#171f32','#95cae3']][v]:[['#b4c7d1','#536572','#1b2c38','#9fdae7'],['#e2d7bd','#827a6a','#30383d','#f2ca81'],['#b3dcf4','#496a87','#142941','#9ae8ff']][v];
    let art='';
    if(item.kind==='helmet'){
      art=`<path d="M402 99L417 88V183L401 176Z M620 99L605 88V183L621 176Z"/><path d="${shell} ${eyeWindow}" fill-rule="evenodd"/>`;
      if(v===0)art+='<path d="M435 91Q511 30 589 91M437 102Q511 65 585 102M433 180L467 217L487 215M589 180L555 217L535 215" class="seam"/><path d="M473 191H549L543 218H479Z" fill="#172934"/><path d="M484 197V212M497 197V212M510 197V212M523 197V212M536 197V212" class="accent"/>';
      if(v===1)art+='<path d="M511 9L533 39L526 117H496L489 39Z M419 85L467 42L484 61L450 119L420 126Z M603 85L555 42L538 61L572 119L602 126Z"/><path d="M459 184L511 174L563 184L548 226L511 238L474 226Z"/><path d="M482 192V216M496 188V223M510 186V228M524 188V223M538 192V216" class="accent"/>';
      if(v===2)art+='<path d="M511 6L549 46L511 96L473 46Z M418 82L462 109L439 132L415 119Z M604 82L560 109L583 132L607 119Z"/><path d="M511 176L557 194L542 225L511 240L480 225L465 194Z"/><path d="M511 185L535 205L511 225L487 205Z" class="crystal"/><path d="M435 175L454 205M587 175L568 205M475 248L511 258L547 248" class="accent"/>';
      art+=`<g data-material="leather-trim" fill="url(#${key}-leather)"><path d="M431 119Q511 87 591 119L587 132Q511 108 435 132Z M421 169L436 179Q443 204 465 222L458 234Q425 209 421 169Z M601 169L586 179Q579 204 557 222L564 234Q597 209 601 169Z"/><path d="M439 122Q511 99 583 122M429 183Q438 210 458 223M593 183Q584 210 564 223" fill="none" stroke="#c3aa89" stroke-width="1.1" stroke-dasharray="2 2.5"/></g>${visor(c.visorRaised===true,key,colors)}`;
    }else if(item.kind==='fabric'){
      art=`<path d="${fabricShell} ${eyePath(item)}" fill="url(#${key}-fabric)" fill-rule="evenodd"/><path d="${eyePath(item)}" fill="none" class="stitch"/><path d="M490 16Q472 60 476 116M532 16Q550 60 546 116M438 96Q441 113 443 128M584 96Q581 113 579 128M450 180Q460 211 481 224M572 180Q562 211 541 224M479 249Q511 260 543 249" class="stitch"/><path d="M450 175Q468 187 489 180Q477 198 483 217Q458 208 450 175Z M572 175Q554 187 533 180Q545 198 539 217Q564 208 572 175Z" fill="#060e18" opacity=".2" stroke="none"/><path d="M504 168Q511 174 518 168L523 188Q511 197 499 188Z" fill="${colors[0]}" opacity=".22" stroke="none"/><path d="M481 232Q511 243 541 232M484 238Q511 249 538 238" class="seam" opacity=".3"/>`;
      if(v===0)art+='<path d="M470 192Q511 183 552 192L542 222Q511 233 480 222Z" fill="#1a252c"/><path d="M480 200H542M482 207H540M486 214H536" class="seam"/>';
      if(v===1)art+='<path d="M438 185L473 178L489 216L465 224Z M584 185L549 178L533 216L557 224Z" fill="#4a4c43"/><path d="M442 190L471 185L483 213M580 190L551 185L539 213M501 181L499 220M521 181L523 220" class="stitch"/>';
      if(v===2)art+='<path d="M511 181L527 200L511 222L495 200Z" class="crystal"/><path d="M454 190L478 203L487 200M568 190L544 203L535 200M469 232L511 247L553 232" class="accent"/>';
    }else{
      const plateShapes=[
        'M453 184Q511 167 569 184L560 216Q511 244 462 216Z',
        'M455 182Q480 169 511 180Q542 169 567 182L559 219Q511 244 463 219Z',
        'M511 173L569 190L558 220L511 239L464 220L453 190Z'
      ];
      art=`<path d="M441 184L457 178V211L443 216Z M581 184L565 178V211L579 216Z" fill="${colors[2]}"/><path d="${plateShapes[v]}"/>`;
      if(v===0)art+='<path d="M474 189V216M486 185V220M498 183V224M510 182V226M522 183V224M534 185V220M546 189V216" class="seam"/>';
      if(v===1)art+='<path d="M470 190Q511 177 552 190M475 211Q511 231 547 211" class="seam"/><path d="M490 193L499 207L490 216M532 193L523 207L532 216" class="accent"/>';
      if(v===2)art+='<path d="M511 184L534 205L511 228L488 205Z" class="crystal"/><path d="M460 195L480 205L466 215M562 195L542 205L556 215" class="accent"/>';
      art+='<circle cx="449" cy="194" r="3" class="crystal"/><circle cx="573" cy="194" r="3" class="crystal"/>';
    }
    return `<g data-item="${item.id}" data-equipment-depth="front" data-family="headgear" data-head-kind="${item.kind}"><defs>
      <linearGradient id="${key}-fill"><stop stop-color="${colors[2]}"/><stop offset=".3" stop-color="${colors[1]}"/><stop offset=".46" stop-color="${colors[0]}"/><stop offset=".66" stop-color="${colors[1]}"/><stop offset="1" stop-color="${colors[2]}"/></linearGradient>
      <radialGradient id="${key}-fabric" cx=".45" cy=".34" r=".7"><stop stop-color="${colors[0]}"/><stop offset=".58" stop-color="${colors[1]}"/><stop offset="1" stop-color="${colors[2]}"/></radialGradient>
      <linearGradient id="${key}-leather" x2=".5" y2="1"><stop stop-color="#80654d"/><stop offset=".45" stop-color="#4d392e"/><stop offset="1" stop-color="#281f1b"/></linearGradient>
      <pattern id="${key}-weave" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 0L4 4M-2 2L2 6M2 -2L6 2" stroke="#c2cfda" stroke-opacity=".07" stroke-width=".5"/></pattern>
      <clipPath id="${key}"><rect x="390" y="-5" width="240" height="290"/></clipPath></defs>
      <style>#${key}-art .seam{fill:none;stroke:${colors[0]};stroke-width:1.5;opacity:.75}#${key}-art .stitch{fill:none;stroke:${colors[3]};stroke-width:1.3;stroke-dasharray:2 3;opacity:.6}#${key}-art .accent{fill:none;stroke:${colors[3]};stroke-width:2.2}#${key}-art .crystal{fill:${colors[3]};stroke:${colors[2]};stroke-width:1.5}</style>
      <g id="${key}-art" clip-path="url(#${key})" fill="url(#${key}-fill)" stroke="${colors[2]}" stroke-width="2" stroke-linejoin="round">${art}${item.kind==='fabric'?`<path d="${fabricShell} ${eyePath(item)}" fill-rule="evenodd" fill="url(#${key}-weave)" stroke="none"/>`:''}</g></g>`;
  }
  function detail(item,prefix){
    return `<svg class="gear-detail" viewBox="${item.kind==='plate'?'430 160 162 88':'390 -5 240 290'}" role="img" aria-label="${item.name} detail">${render({itemId:item.id},{},'front',prefix)}</svg><p>${item.description}</p>`;
  }
  return {catalog,methods,getItem,eyePath,render,detail};
})();
if(typeof module!=='undefined')module.exports=HeadEquipment;
