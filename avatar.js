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
    const shoulder=[[126,158+dy],[194,158+dy]],hip=[[143,280+dy],[177,280+dy]];
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
    const stroke='#202831',prefix=`avatar-${id}`;
    const colors=[...new Set([skin,hair,top,pants,shoe,...clothes.map(item=>item.color),'#b7c9d4','#aa7452','#7b929d','#8795a4'])];
    const tint=(hex,amount)=>'#'+hex.slice(1).match(/../g).map(value=>{const n=parseInt(value,16);return Math.round(amount>0?n+(255-n)*amount:n*(1+amount)).toString(16).padStart(2,'0');}).join('');
    const paint=color=>colors.includes(color)?`url(#${prefix}-material-${colors.indexOf(color)})`:color;
    const gradients=colors.map((color,i)=>`<linearGradient id="${prefix}-material-${i}" x1="0" y1="0" x2="1" y2=".25"><stop stop-color="${tint(color,-.42)}"/><stop offset=".25" stop-color="${tint(color,.13)}"/><stop offset=".46" stop-color="${tint(color,.22)}"/><stop offset=".73" stop-color="${color}"/><stop offset="1" stop-color="${tint(color,-.38)}"/></linearGradient>`).join('')+`<radialGradient id="${prefix}-face" cx=".38" cy=".35" r=".75"><stop stop-color="${tint(skin,.27)}"/><stop offset=".5" stop-color="${skin}"/><stop offset="1" stop-color="${tint(skin,-.3)}"/></radialGradient>`;
    const path=(d,fill,extra='')=>`<path d="${d}" fill="${paint(fill)}" ${extra}/>`;
    const limb=(a,b,start,end,color)=>{
      const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1,nx=-dy/length,ny=dx/length;
      const points=[[a[0]+nx*start,a[1]+ny*start],[b[0]+nx*end,b[1]+ny*end],[b[0]-nx*end,b[1]-ny*end],[a[0]-nx*start,a[1]-ny*start]];
      const mid=mix(a,b,.45),c1=[mid[0]+nx*start*.95,mid[1]+ny*start*.95],c2=[mid[0]-nx*start*.9,mid[1]-ny*start*.9];
      return `<path d="M${points[0]}Q${c1} ${points[1]}L${points[2]}Q${c2} ${points[3]}Z" fill="${paint(color)}" stroke="${stroke}" stroke-width=".85"/><path d="M${a[0]+nx*start*.55} ${a[1]+ny*start*.55}Q${mid[0]+nx*start*.6} ${mid[1]+ny*start*.6} ${b[0]+nx*end*.55} ${b[1]+ny*end*.55}" stroke="#e0edf0" stroke-opacity=".14" stroke-width="2"/>`;
    };
    function bands(points,color,width,height=9,rope=false){
      return points.map(([x,y])=>rope?path(`M${x-width/2} ${y-3}q${width/2} 5 ${width} 0m${-width} 4q${width/2} 5 ${width} 0m${-width} 4q${width/2} 5 ${width} 0`,'none',`stroke="${color}" stroke-width="2"`):`<rect x="${x-width/2}" y="${y-height/2}" width="${width}" height="${height}" rx="3" fill="${paint(color)}" stroke="${stroke}" stroke-width="1.2"/><path d="M${x-2} ${y-3}h5v6h-5Z" fill="none" stroke="#e6e8e3" opacity=".6"/>`).join('');
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
      return `<g>${limb(knee[i],ankle[i],12,8,pants)}${limb(p,knee[i],19,11,pants)}<path d="M${p[0]+(i?10:-10)} ${p[1]+10}Q${knee[i][0]+(i?8:-8)} ${knee[i][1]-12} ${ankle[i][0]+(i?5:-5)} ${ankle[i][1]-18}" fill="none" stroke="#b8c5c9" stroke-opacity=".22" stroke-width=".7"/><ellipse cx="${knee[i][0]}" cy="${knee[i][1]}" rx="10.5" ry="9" fill="${paint(pants)}"/><path d="M${knee[i][0]-8} ${knee[i][1]-4}q8 6 16 0" fill="none" stroke="#a1b3bc" opacity=".25"/>${path(`M${ankle[i][0]-8} ${ankle[i][1]-14}l16 0 3 16 ${direction*10} 5q3 9-9 10l-18 0q-6-4-3-12Z`,shoe,`stroke="${stroke}" stroke-width="1.5"`)}<path d="M${ankle[i][0]-4} ${ankle[i][1]-10}l8 3-8 3 8 3-8 3" fill="none" stroke="#bdc6bf" stroke-opacity=".45" stroke-width=".8"/><path d="M${foot[0]-7} ${foot[1]+5}h17" stroke="#85949c" stroke-width="2"/><path d="M${ankle[i][0]-5} ${ankle[i][1]-8}h10" stroke="${accent}" stroke-width="2"/></g>`;
    }).join('');
    const arms=shoulder.map((p,i)=>{
      const glove=garment('hands'),handColor=glove?glove.color:skin;
      return `<g>${path(`M${p[0]-12} ${p[1]+2}Q${p[0]-14} ${p[1]-14} ${p[0]} ${p[1]-13}Q${p[0]+14} ${p[1]-13} ${p[0]+12} ${p[1]+4}Q${elbow[i][0]+10} ${elbow[i][1]-9} ${elbow[i][0]+8} ${elbow[i][1]+3}Q${wrist[i][0]+8} ${wrist[i][1]-12} ${wrist[i][0]+5} ${wrist[i][1]+1}L${wrist[i][0]-5} ${wrist[i][1]+1}Q${wrist[i][0]-7} ${wrist[i][1]-16} ${elbow[i][0]-8} ${elbow[i][1]+2}Q${elbow[i][0]-11} ${elbow[i][1]-10} ${p[0]-12} ${p[1]+2}Z`,top,`stroke="${stroke}" stroke-width=".8"`)}<path d="M${p[0]-5} ${p[1]+2}Q${elbow[i][0]-4} ${elbow[i][1]-14} ${elbow[i][0]-4} ${elbow[i][1]-3}M${elbow[i][0]-4} ${elbow[i][1]+5}L${wrist[i][0]-2} ${wrist[i][1]-8}" fill="none" stroke="#dde9e1" stroke-opacity=".2" stroke-width=".7"/><path d="M${elbow[i][0]-6} ${elbow[i][1]-2}l9 4-7 3" fill="none" stroke="#172127" opacity=".3" stroke-width=".8"/>${path(`M${hand[i][0]-5} ${hand[i][1]-10}q-5 8-2 17l5 5q7 0 8-7l-2-13Z`,handColor,`stroke="${stroke}" stroke-width="1.2"`)}<path d="M${hand[i][0]+2} ${hand[i][1]+2}v8m-3-7v7" stroke="#4c3c3c" opacity=".35" stroke-width=".7"/></g>`;
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
    const torso=`<g data-layer="torso" transform="translate(0 ${dy})">
      ${path('M150 127l-1 19 11 12 11-12-1-19Z',skin)}
      <path d="M150 133q10 6 20 0l-1 8q-9 6-18-1Z" fill="#39292c" opacity=".2"/>
      ${path('M125 154q11-8 24-11l11 12 11-12q14 3 24 11l2 21q-2 15-9 27l-5 32 7 38q-30 13-60 0l7-38-5-32q-8-14-10-27Z',top,`stroke="${stroke}" stroke-width="1"`)}
      ${path('M124 164q8 3 13 13l5 34-4 31-5 26-5 4 8-39-5-33Z','#101820','opacity=".35"')}
      ${path('M189 162q-7 9-9 24l-3 29 5 22-1-29q9-21 10-46Z','#dbe3da','opacity=".12"')}
      ${back?`<path d="M132 163q28 12 56 0M160 168v66M135 216q25 12 50 0" fill="none" stroke="#dce7e4" stroke-opacity=".22"/><path d="M136 175l24 12 24-12" fill="none" stroke="#101820" opacity=".3" stroke-width="5"/><rect x="148" y="178" width="24" height="5" rx="1" fill="${accent}" opacity=".55"/>`:`
      ${path('M148 141l12 14-9 20-13-22Z',top,`stroke="${stroke}" stroke-width=".9"`)}
      ${path('M172 141l-12 14 9 20 13-22Z',top,`stroke="${stroke}" stroke-width=".9"`)}
      <path d="M160 159v90" stroke="#18262a" stroke-width="3"/><path d="M160 164v83" stroke="#b3b9b3" stroke-width=".8" stroke-dasharray="1.5 1.5"/>
      <rect x="159" y="173" width="3" height="7" rx="1" fill="#9faeac"/>
      <path d="M137 181l17 1-1 22-15-1ZM166 182l17-1-1 22-15 1Z" fill="#121d21" fill-opacity=".2" stroke="#abb9b4" stroke-opacity=".23" stroke-width=".6"/>
      <path d="M137 186l17 1m12 0 17-1" stroke="#141f26" stroke-width="2"/>
      <rect x="171" y="178" width="9" height="2" rx=".5" fill="${accent}"/>
      <path d="M147 147l9 9m17-9-9 9" stroke="#dbe5de" stroke-opacity=".28" stroke-width=".8"/>`}
      <path d="M139 214l10 5-8 2m40-7-9 6 8 1M137 236l12-4m31 7-12-4M137 245l13-3m20 0 12 3" fill="none" stroke="#101b20" stroke-opacity=".24" stroke-width=".8"/>
      <path d="M131 252q29 7 58 0l1 10q-30 8-60 0Z" fill="#202b2b" stroke="#10191b" stroke-width="1"/>
      <path d="M133 254q27 7 54 0m-54 6q27 7 54 0" fill="none" stroke="#92a29c" stroke-opacity=".3" stroke-width=".6"/>
      <rect x="153" y="254" width="14" height="9" rx="1.5" fill="#9faeaa"/><rect x="156" y="256" width="8" height="5" rx=".5" fill="#293631"/>
      ${path('M130 265q30 9 60 0l5 31-26 5-9-12-9 12-26-5Z',pants,`stroke="${stroke}" stroke-width=".9"`)}
      <path d="M138 271q0 14-9 17m53-17q0 14 9 17M160 272v16" fill="none" stroke="#b7c3c7" stroke-opacity=".27" stroke-width=".8"/>
      <path d="M143 269v7m34-7v7" stroke="#152229" stroke-width="4"/>
    </g>`;
    const hairShape=character.hair==='Bob'?'M137 93q-8-34 16-39 32-9 34 25l0 48-10 12 2-45-13-23q-9 20-25 22l-1 39-9-6Z':character.hair==='Crop'?'M136 98q-9-32 11-41l8-7 8 5 10-5 3 9q17 9 9 39l-7-14-5-12-18 15-1-9-13 18Z':'M136 97q-9-35 18-42 30-7 32 25l-4 21-7-24-9-10q-8 21-26 27Z';
    const head=`<g data-layer="head" transform="translate(0 ${dy})">
      ${path('M138 77q-5-27 22-27 28 0 24 32l-2 38-15 19-28-15Z',hair,`stroke="${stroke}" stroke-width=".9"`)}
      ${character.hair==='Ponytail'?`${path('M180 68q27-12 26 22l-5 51q-2 22-12 33l-5-16q12-47-8-76Z',hair,`stroke="${stroke}" stroke-width=".8"`)}<path d="M189 78q15 12 3 74m4-69q9 22-4 74" fill="none" stroke="${tint(hair,.4)}" stroke-opacity=".35" stroke-width=".8"/><path d="M181 72l9 5" stroke="${accent}" stroke-width="4"/>`:''}
      ${back?`${path('M138 70q22-23 44 0l3 46-9 24-17-7-17 5-7-23Z',hair)}<path d="M159 61q-18 24-17 62m20-60q-4 37 0 66m4-64q14 22 10 62m-23-58q-8 30-2 55" fill="none" stroke="${tint(hair,.38)}" stroke-opacity=".35" stroke-width=".8"/>`:`
      <ellipse cx="138" cy="105" rx="4" ry="8" fill="${paint(skin)}"/><ellipse cx="182" cy="105" rx="4" ry="8" fill="${paint(skin)}"/>
      ${path('M139 83q0-21 21-21t21 21l-1 27q-2 11-11 19-5 5-9 5t-9-5q-9-8-11-19Z',`url(#${prefix}-face)`,`stroke="${tint(skin,-.4)}" stroke-width=".7"`)}
      <path d="M140 92q2 21 7 27l11 13q-13-5-18-22Z" fill="${tint(skin,-.35)}" opacity=".25"/>
      <path d="M145 113q4-3 10 0m10 0q5-3 10 0" fill="none" stroke="#ca8880" opacity=".18" stroke-width="4"/>
      <path d="M144 99q5-3 11-1m10 0q6-2 11 1" fill="none" stroke="${tint(hair,-.2)}" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M143 105q6-5 13 0-6 5-12 1m20-1q6-5 13 0l-1 1q-6 4-12-1" fill="#dedfd5" stroke="#564b48" stroke-width=".75"/>
      <ellipse cx="150" cy="105" rx="2.6" ry="2.9" fill="${accent}"/><ellipse cx="170" cy="105" rx="2.6" ry="2.9" fill="${accent}"/>
      <ellipse cx="150" cy="105" rx="1.3" ry="2.3" fill="#273335"/><ellipse cx="170" cy="105" rx="1.3" ry="2.3" fill="#273335"/>
      <circle cx="149" cy="104" r=".8" fill="#fff"/><circle cx="169" cy="104" r=".8" fill="#fff"/>
      <path d="M143 104q6-4 13 1m8 0q6-5 13-1" fill="none" stroke="#383437" stroke-width="1.1"/>
      <path d="M159 106q0 7-2 11l3 2 3-2" fill="none" stroke="${tint(skin,-.3)}" stroke-width=".8"/>
      <path d="M161 108v7" stroke="${tint(skin,.45)}" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M154 124l4-1 2 1 2-1 4 1q-6 5-12 0" fill="${tint(skin,-.18)}"/><path d="M154 124q6 2 12 0" fill="none" stroke="#895b55" stroke-width=".65"/>
      <path d="M158 128h4" stroke="${tint(skin,.3)}" stroke-width=".8"/>
      ${path(hairShape,hair,`stroke="${stroke}" stroke-width=".9"`)}
      <path d="M141 80q7-18 22-20m-21 24q13-8 20-20m-23 26q14-5 24-24m6-7q12 8 13 26m-11-24q9 9 8 22" fill="none" stroke="${tint(hair,.55)}" stroke-opacity=".35" stroke-width=".7"/>
      <path d="M142 72q7-12 18-13m13 4q7 6 8 13" fill="none" stroke="${tint(hair,.65)}" stroke-opacity=".3" stroke-width="2" stroke-linecap="round"/>`}
    </g>`;
    const armorArt=character.gear==='Bracers'?bands(wrist.map((p,i)=>mix(elbow[i],p,.65)),'#7b929d',19,19):character.gear==='Pauldrons'?shoulder.map(([x,y])=>`<path d="M${x-14} ${y+3}q-1-16 14-16t14 16l-4 8h-20Z" fill="${paint('#8795a4')}" stroke="${stroke}" stroke-width="1.5"/><path d="M${x-9} ${y+2}h18" stroke="${accent}" stroke-width="2"/>`).join(''):'';
    const armLayer=`${arms}<g data-layer="armor">${armorArt}</g>${clothingAccessories(true)}${restraintLayers(true)}`;
    return `<svg viewBox="0 0 320 520" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${character.name}, adult avatar, ${pose.name}, ${back?'rear':'front'} view" data-pose="${pose.key}"><defs>${gradients}<radialGradient id="${prefix}-halo"><stop stop-color="${accent}" stop-opacity=".14"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient></defs><ellipse cx="160" cy="270" rx="120" ry="208" fill="url(#${prefix}-halo)"/><ellipse cx="160" cy="493" rx="95" ry="16" fill="#091216" opacity=".7"/><ellipse cx="160" cy="490" rx="88" ry="15" fill="none" stroke="${accent}" stroke-opacity=".3"/><path d="M35 115v-18h18M267 97h18v18M35 425v18h18M267 443h18v-18" fill="none" stroke="${accent}" opacity=".2"/><g data-layer="legs">${legArt}</g>${pose.behind&&!back?`<g data-layer="arms-behind">${armLayer}</g>`:''}${head}${torso}${!pose.behind||back?`<g data-layer="arms">${armLayer}</g>`:''}<g data-layer="clothing">${clothingAccessories(false)}</g><g data-layer="restraints">${restraintLayers(false)}</g></svg>`;
  }
  return {poses,resolvePose,rig,render};
})();
if(typeof module!=='undefined')module.exports=AvatarSystem;
