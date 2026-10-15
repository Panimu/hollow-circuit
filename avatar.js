/* Articulated vector avatar. Every attachment uses the same posed joint anchors. */
const AvatarSystem = (() => {
  const poses={auto:'Automatic',standing:'Standing',together:'Legs together',behind:'Arms behind',kneeling:'Kneeling','kneeling-behind':'Kneeling · arms behind'};
  function resolvePose(character){
    const manual=Object.hasOwn(poses,character.posePreference)&&character.posePreference!=='auto'?character.posePreference:null;
    const ids=(character.restraints||[]).map(entry=>entry.itemId);
    const kneeling=ids.some(id=>id.endsWith('-leg-frame'));
    const behind=ids.some(id=>id.endsWith('-arm-sleeve'));
    const together=ids.some(id=>id.endsWith('-boot-wrap'));
    const key=manual||(kneeling?(behind?'kneeling-behind':'kneeling'):behind?'behind':together?'together':'standing');
    return {key,name:poses[key],kneeling:key.startsWith('kneeling'),behind:key.includes('behind'),together:key==='together'||(!manual&&together),manual:!!manual};
  }
  const mix=(a,b,t=.5)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
  function rig(character){
    const pose=resolvePose(character),dy=pose.kneeling?108:0;
    const shoulder=[[130,154+dy],[190,154+dy]],hip=[[143,280+dy],[177,280+dy]];
    const elbow=pose.behind?[[113,216+dy],[207,216+dy]]:[[111,222+dy],[209,222+dy]];
    const wrist=pose.behind?[[148,257+dy],[172,257+dy]]:[[97,282+dy],[223,282+dy]];
    const hand=wrist.map(([x,y],i)=>[x+(pose.behind?0:i===0?-2:2),y+12]);
    const knee=pose.kneeling?[[140,480],[180,480]]:pose.together?[[149,376],[171,376]]:[[133,376],[187,376]];
    const ankle=pose.kneeling?[[113,466],[207,466]]:pose.together?[[151,468],[169,468]]:[[125,468],[195,468]];
    const feet=ankle.map(([x,y],i)=>[x+(pose.kneeling?(i===0?-5:5):(i===0?-4:4)),y+9]);
    const anchors={
      toes:feet.map(([x,y],i)=>[x+(i===0?-3:3),y+5]),feet,ankles:ankle,
      'lower-leg':knee.map((p,i)=>mix(p,ankle[i],.58)),knees:knee,'upper-leg':hip.map((p,i)=>mix(p,knee[i],.4)),
      waist:[[160,246+dy]],chest:[[160,194+dy]],shoulders:shoulder,arms:shoulder.map((p,i)=>mix(p,elbow[i],.4)),elbows:elbow,wrists:wrist,hands:hand,fingers:hand.map(([x,y])=>[x,y+7]),
      neck:[[160,143+dy]],face:[[160,108+dy]],mouth:[[160,127+dy]],head:[[160,80+dy]],
      pelvis:[[160,281+dy]],'pelvis-front':[[160,291+dy]],'pelvis-rear':[[160,291+dy]]
    };
    return {pose,dy,shoulder,elbow,wrist,hand,hip,knee,ankle,feet,anchors};
  }
  function render(character,id,palettes,R,W){
    const g=rig(character),{pose,dy,shoulder,elbow,wrist,hand,hip,knee,ankle,feet,anchors}=g;
    const back=character.view==='rear',skin=palettes.skin[character.skin].value,hair=palettes.hairColor[character.hairColor].value,accent=palettes.accent[character.accent].value;
    const clothes=W.sanitize(character.clothing).map(W.getItem),garment=slot=>clothes.find(item=>item.slots.includes(slot));
    const base=character.outfit==='Sentinel'?'#556272':character.outfit==='Runner'?'#394657':'#4c5d54';
    const top=garment('chest')?.color||base,pants=garment('pelvis')?.color||'#28343e',shoe=garment('feet')?.color||'#26343d';
    const stroke='#17212b',prefix=`avatar-${id}`;
    const path=(d,fill,extra='')=>`<path d="${d}" fill="${fill}" ${extra}/>`;
    const limb=(a,b,start,end,color)=>{
      const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1,nx=-dy/length,ny=dx/length;
      const points=[[a[0]+nx*start,a[1]+ny*start],[b[0]+nx*end,b[1]+ny*end],[b[0]-nx*end,b[1]-ny*end],[a[0]-nx*start,a[1]-ny*start]];
      const mid=mix(a,b,.45),c1=[mid[0]+nx*start*.95,mid[1]+ny*start*.95],c2=[mid[0]-nx*start*.9,mid[1]-ny*start*.9];
      return `<path d="M${points[0]}Q${c1} ${points[1]}L${points[2]}Q${c2} ${points[3]}Z" fill="${color}" stroke="${stroke}" stroke-width="1.4"/><path d="M${a[0]+nx*start*.55} ${a[1]+ny*start*.55}Q${mid[0]+nx*start*.6} ${mid[1]+ny*start*.6} ${b[0]+nx*end*.55} ${b[1]+ny*end*.55}" stroke="#e0edf0" stroke-opacity=".14" stroke-width="2"/>`;
    };
    function bands(points,color,width,height=9,rope=false){
      return points.map(([x,y])=>rope?path(`M${x-width/2} ${y-3}q${width/2} 5 ${width} 0m${-width} 4q${width/2} 5 ${width} 0m${-width} 4q${width/2} 5 ${width} 0`,'none',`stroke="${color}" stroke-width="2"`):`<rect x="${x-width/2}" y="${y-height/2}" width="${width}" height="${height}" rx="3" fill="${color}" stroke="${stroke}" stroke-width="1.2"/><path d="M${x-2} ${y-3}h5v6h-5Z" fill="none" stroke="#e6e8e3" opacity=".6"/>`).join('');
    }
    const armSlots=['arms','elbows','wrists','hands','fingers'];
    function restraintLayers(armLayer){
      return R.sanitize(character.restraints).map(entry=>{
        const item=R.getItem(entry.itemId),color={Rope:'#d8bc88',Leather:'#aa7452',Steel:'#b7c9d4'}[item.material];
        const slots=item.slots.filter(slot=>armSlots.includes(slot)===armLayer);
        if(!slots.length)return '';
        return `<g data-restraint="${item.id}">${slots.map(slot=>{
          const points=anchors[slot],width=['head','face'].includes(slot)?43:['chest','waist'].includes(slot)?57:slot==='neck'?26:['toes','fingers'].includes(slot)?13:18;
          let art=bands(points,color,width,slot==='mouth'?7:10,item.material==='Rope');
          if(points.length===2)art+=path(`M${points[0][0]+width/2} ${points[0][1]+3}Q160 ${Math.max(points[0][1],points[1][1])+12} ${points[1][0]-width/2} ${points[1][1]+3}`,'none',`stroke="${color}" stroke-width="2" ${item.material==='Steel'?'stroke-dasharray="4 2"':''}`);
          if(['padlock','double'].includes(entry.methodId)){
            const [x,y]=points.length===1?[points[0][0]+width/2-4,points[0][1]]:mix(points[0],points[1]);
            art+=`<g transform="translate(${x} ${y+5})"><path d="M-3 0v-3a3 3 0 0 1 6 0v3" fill="none" stroke="#f0d78c" stroke-width="1.5"/><rect x="-5" y="-1" width="10" height="8" rx="2" fill="#d7b667"/></g>`;
          }
          return `<g data-slot="${slot}" ${back&&['face','mouth'].includes(slot)?'opacity="0"':''}><title>${R.getSlot(slot).label}: ${item.name}</title>${art}</g>`;
        }).join('')}</g>`;
      }).join('');
    }
    const legArt=hip.map((p,i)=>{
      const foot=feet[i],direction=i===0?-1:1;
      return `<g>${limb(knee[i],ankle[i],12,8,pants)}${limb(p,knee[i],18,12,pants)}<ellipse cx="${knee[i][0]}" cy="${knee[i][1]}" rx="12" ry="10" fill="${pants}"/><path d="M${knee[i][0]-8} ${knee[i][1]-4}q8 6 16 0" fill="none" stroke="#a1b3bc" opacity=".25"/>${path(`M${ankle[i][0]-8} ${ankle[i][1]-14}l16 0 3 16 ${direction*10} 5q3 9-9 10l-18 0q-6-4-3-12Z`,shoe,`stroke="${stroke}" stroke-width="1.5"`)}<path d="M${foot[0]-7} ${foot[1]+5}h17" stroke="#85949c" stroke-width="2"/><path d="M${ankle[i][0]-5} ${ankle[i][1]-8}h10" stroke="${accent}" stroke-width="2"/></g>`;
    }).join('');
    const arms=shoulder.map((p,i)=>{
      const glove=garment('hands'),handColor=glove?glove.color:skin;
      return `<g>${limb(p,elbow[i],12,8,top)}${limb(elbow[i],wrist[i],8,5,top)}<ellipse cx="${elbow[i][0]}" cy="${elbow[i][1]}" rx="8" ry="8" fill="${top}"/>${path(`M${hand[i][0]-5} ${hand[i][1]-10}q-5 8-2 17l5 5q7 0 8-7l-2-13Z`,handColor,`stroke="${stroke}" stroke-width="1.2"`)}<path d="M${hand[i][0]+2} ${hand[i][1]+2}v8m-3-7v7" stroke="#4c3c3c" opacity=".35" stroke-width=".7"/></g>`;
    }).join('');
    const clothingAccessories=(armsOnly)=>clothes.filter(item=>armSlots.includes(item.slot)===armsOnly).map(item=>{
      const slot=item.slot;if(['chest','pelvis','feet','hands'].includes(slot))return '';
      if(slot==='pelvis-front'||slot==='pelvis-rear'){
        if((slot==='pelvis-rear')!==back)return '';
        return `<g data-clothing="${item.id}">${path(`M135 ${268+dy}h50l9 52q-34 10-68 0Z`,item.color,`stroke="${stroke}" stroke-width="1.5"`)}<path d="M141 ${279+dy}h38m-35 8h32" stroke="#ffffff" opacity=".17"/></g>`;
      }
      if(slot==='head')return `<g data-clothing="${item.id}">${path(`M136 ${81+dy}q-3-29 24-29t24 29Z`,item.color,`stroke="${stroke}" stroke-width="1.3"`)}<path d="M134 ${81+dy}q27-6 52 0" stroke="${accent}" stroke-width="4"/></g>`;
      if(back&&['face','mouth'].includes(slot))return '';
      const width=['chest','waist'].includes(slot)?58:slot==='face'?42:slot==='neck'?27:slot==='mouth'?25:18;
      return `<g data-clothing="${item.id}">${bands(anchors[slot],item.color,width,slot==='face'?10:8)}</g>`;
    }).join('');
    const torso=`<g data-layer="torso" transform="translate(0 ${dy})">${path('M149 128v22l11 9 11-9v-22',skin,`stroke="${stroke}" stroke-width="1.2"`)}${path('M129 151l20-9 11 13 11-13 20 9q13 21 0 50l-7 35 8 40q-32 14-64 0l8-40-7-35q-13-29 0-50Z',top,`stroke="${stroke}" stroke-width="1.6"`)}${path('M132 159q-7 25 5 45l8 35-6 28h-9l6-31-7-37q-9-23 3-40Z','#16252b','opacity=".35"')}${path('M174 153l12 7q6 22-3 43l-4 32 7 33-12 2-5-33 5-35q6-21 0-49Z','#d6e4e9','opacity=".08"')}<path d="M160 156v104" stroke="#1d2b32" stroke-width="2"/><path d="M133 187h18m18 0h18M139 210h13m16 0h13" stroke="#b9c7c8" stroke-opacity=".25"/>${back?'<path d="M141 159l19 27 19-27M139 230h42" fill="none" stroke="#a2b5bd" opacity=".3"/>':`<path d="M141 158l19 18 19-18" fill="none" stroke="${accent}" stroke-width="3"/><rect x="173" y="178" width="10" height="4" rx="1" fill="${accent}"/>`}<path d="M131 251q29 8 58 0l2 10q-31 10-62 0Z" fill="#17262d"/><rect x="153" y="254" width="14" height="9" rx="2" fill="${accent}"/>${path('M129 267q31 9 62 0l4 28-27 3-8-9-8 9-27-3Z',pants,`stroke="${stroke}" stroke-width="1.5"`)}<path d="M138 274v14m44-14v14" stroke="#b0c2cd" opacity=".28"/></g>`;
    const head=`<g data-layer="head" transform="translate(0 ${dy})">${path('M137 76q-8-29 22-30 32-1 27 36l-2 44-18 15-29-16Z',hair,`stroke="${stroke}" stroke-width="1.4"`)}${character.hair==='Ponytail'?path('M181 65q29-12 28 26l-10 87-16-18q15-58-6-76Z',hair,`stroke="${stroke}" stroke-width="1.3"`):''}${back?path('M138 69q23-25 45 0l3 47-9 25-18-6-18 4-7-25Z',hair):`<ellipse cx="136" cy="105" rx="5" ry="9" fill="${skin}"/><ellipse cx="184" cy="105" rx="5" ry="9" fill="${skin}"/>${path('M137 82q1-22 23-22t23 22l-2 30q-5 17-21 25-16-8-21-25Z',skin,`stroke="${stroke}" stroke-width="1.2"`)}${path('M139 87q1 31 21 50-16-8-21-25Z','#6e4d50','opacity=".16"')}<path d="M143 99q7-4 13 0m8 0q7-4 13 0" fill="none" stroke="${hair}" stroke-width="1.8" stroke-linecap="round"/><path d="M142 106q7-7 14-1-6 8-13 3m21-3q7-6 14 1l-1 2q-7 5-13-3" fill="#eef0e9" stroke="#353440" stroke-width="1.2"/><ellipse cx="150" cy="106" rx="3" ry="4" fill="${accent}"/><ellipse cx="170" cy="106" rx="3" ry="4" fill="${accent}"/><ellipse cx="150" cy="106" rx="1.5" ry="3" fill="#1a2834"/><ellipse cx="170" cy="106" rx="1.5" ry="3" fill="#1a2834"/><circle cx="151" cy="104" r="1.2" fill="white"/><circle cx="171" cy="104" r="1.2" fill="white"/><path d="M141 105l-2-2m40 2 2-2M160 109l-2 10h3" fill="none" stroke="#614e53" stroke-width="1"/><path d="M155 126q5-2 10 0m-7 3h4" fill="none" stroke="#a57070" stroke-width="1"/>${path(character.hair==='Bob'?'M135 94q-6-38 22-40 32-5 30 31l-1 47-10 9 2-48-16-21q-6 24-22 25l-1 36-8-5Z':character.hair==='Crop'?'M135 99q-9-35 13-43l5-8 9 4 13-5 1 9q19 8 10 43l-8-14-5-13-17 15-2-9-14 18Z':'M135 97q-10-38 21-44 33-4 32 32l-6 18-5-25-11-12q-9 23-27 29Z',hair,`stroke="${stroke}" stroke-width="1.3"`)}<path d="M144 70q13-15 29-7M145 78q10-5 16-13" fill="none" stroke="#eef1ed" stroke-opacity=".17" stroke-width="2"/>`}</g>`;
    const armorArt=character.gear==='Bracers'?bands(wrist.map((p,i)=>mix(elbow[i],p,.65)),'#7b929d',19,19):character.gear==='Pauldrons'?shoulder.map(([x,y])=>`<path d="M${x-14} ${y+3}q-1-16 14-16t14 16l-4 8h-20Z" fill="#8795a4" stroke="${stroke}" stroke-width="1.5"/><path d="M${x-9} ${y+2}h18" stroke="${accent}" stroke-width="2"/>`).join(''):'';
    const armLayer=`${arms}<g data-layer="armor">${armorArt}</g>${clothingAccessories(true)}${restraintLayers(true)}`;
    return `<svg viewBox="0 0 320 520" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${character.name}, adult avatar, ${pose.name}, ${back?'rear':'front'} view" data-pose="${pose.key}"><defs><radialGradient id="${prefix}-halo"><stop stop-color="${accent}" stop-opacity=".14"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient></defs><ellipse cx="160" cy="270" rx="120" ry="208" fill="url(#${prefix}-halo)"/><ellipse cx="160" cy="493" rx="95" ry="16" fill="#091216" opacity=".7"/><ellipse cx="160" cy="490" rx="88" ry="15" fill="none" stroke="${accent}" stroke-opacity=".3"/><path d="M35 115v-18h18M267 97h18v18M35 425v18h18M267 443h18v-18" fill="none" stroke="${accent}" opacity=".2"/><g data-layer="legs">${legArt}</g>${pose.behind&&!back?`<g data-layer="arms-behind">${armLayer}</g>`:''}${head}${torso}${!pose.behind||back?`<g data-layer="arms">${armLayer}</g>`:''}<g data-layer="clothing">${clothingAccessories(false)}</g><g data-layer="restraints">${restraintLayers(false)}</g></svg>`;
  }
  return {poses,resolvePose,rig,render};
})();
if(typeof module!=='undefined')module.exports=AvatarSystem;
