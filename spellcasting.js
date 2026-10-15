/* Studio spell rules: a speech requirement is a hard gate, not a stat penalty. */
const Spellcasting = (() => {
  const methods = {
    attune: {name:'Attune rune',difficulty:0,escape:0,cost:0,effects:{}},
    reinforce: {name:'Reinforce rune',difficulty:12,escape:18,cost:1,effects:{focus:5}}
  };
  const catalog = [
    {id:'arcane-whisper-seal',name:'Whisper seal',slots:['mouth'],difficulty:36,escape:28,cost:2,effects:{focus:5},description:'A floating rune interrupts spoken spell patterns. Quick to apply, but easiest to dispel.'},
    {id:'arcane-echo-filter',name:'Echo filter',slots:['mouth'],difficulty:48,escape:42,cost:3,effects:{focus:10},description:'A holographic acoustic field cancels incantations. Balanced application and dispel difficulty.'},
    {id:'arcane-null-visor',name:'Null voice visor',slots:['mouth','face'],difficulty:62,escape:58,cost:4,effects:{focus:15,evasion:5},description:'A translucent lower-face projection blocks incantations and adds visual interference. Hardest to apply and dispel.'}
  ].map(item=>({...item,material:'Arcane',slot:'mouth',family:'silence',blocksVerbal:true}));
  const spells = [
    {id:'ember-word',name:'Ember word',verbal:true},
    {id:'ward-chant',name:'Ward chant',verbal:true},
    {id:'focus-pulse',name:'Focus pulse',verbal:false}
  ];
  const getItem = id => catalog.find(item=>item.id===id);
  function validSources(character) {
    return (Array.isArray(character?.restraints)?character.restraints:[])
      .filter(entry=>getItem(entry?.itemId)&&Object.hasOwn(methods,entry?.methodId))
      .map(entry=>getItem(entry.itemId));
  }
  function check(character,spellId) {
    const spell=spells.find(item=>item.id===spellId);
    if(!spell)return {allowed:false,reason:'Unknown spell.'};
    const source=validSources(character)[0];
    if(spell.verbal&&source)return {allowed:false,reason:`${spell.name} blocked by ${source.name}: spoken incantation required.`};
    return {allowed:true,reason:`${spell.name} passes the casting check. ${spell.verbal?'Spoken incantation available.':'No spoken incantation required.'}`};
  }
  function render(item,depth,prefix) {
    if(depth!=='front')return '<g data-equipment-depth="rear" data-family="silence"></g>';
    const key=`${prefix}-${item.id}-front`,color={'arcane-whisper-seal':'#77e5ec','arcane-echo-filter':'#c9a7ff','arcane-null-visor':'#8dbef9'}[item.id];
    const art=item.id==='arcane-whisper-seal'
      ? '<path d="M0 -15L14 -7V7L0 15L-14 7V-7Z"/><path d="M-5 -7L5 7M5 -7L-5 7M-23 -5V5M23 -5V5" fill="none"/>'
      : item.id==='arcane-echo-filter'
      ? '<ellipse rx="39" ry="18"/><path d="M-28 -5V5M-20 -10V10M-11 -6V6M0 -12V12M11 -6V6M20 -10V10M28 -5V5M-33 0H33" fill="none"/>'
      : '<path d="M-54 -13Q0 -27 54 -13L45 17Q0 35 -45 17Z"/><path d="M-42 -7Q0 -17 42 -7M-35 8Q0 21 35 8M-19 -13L-16 18M0 -15V21M19 -13L16 18" fill="none"/>';
    return `<g data-item="${item.id}" data-family="silence" data-equipment-depth="front"><defs><clipPath id="${key}"><rect x="450" y="166" width="125" height="70" rx="20"/></clipPath></defs><g clip-path="url(#${key})"><g transform="translate(511 199)" stroke="${color}" stroke-width="1.8" fill="#1d335a" fill-opacity=".46" stroke-linecap="round" stroke-linejoin="round">${art}<circle cx="-57" r="2" fill="${color}"/><circle cx="57" r="2" fill="${color}"/></g></g></g>`;
  }
  return {catalog,methods,spells,getItem,validSources,check,render};
})();
if(typeof module!=='undefined')module.exports=Spellcasting;
