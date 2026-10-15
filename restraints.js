/* Fictional simulator balance. Percentages are game attributes, not physical guidance. */
const RestraintSystem = (() => {
  const materials = ['Rope', 'Leather', 'Steel'];
  const slots = ['wrists', 'ankles', 'arms', 'legs'];
  const attributes = { movement: 'Movement', dexterity: 'Dexterity', evasion: 'Evasion', recovery: 'Energy recovery' };
  const methods = {
    knot: { name: 'Knot', materials: ['Rope'], difficulty: 0, escape: 0, cost: 0, effects: {}, description: 'Quick setup with the standard escape rating.' },
    cinch: { name: 'Tightening', materials: ['Rope', 'Leather'], difficulty: 10, escape: 12, cost: 1, effects: { movement: 5, dexterity: 5 }, description: 'Adds control at the cost of one extra action point.' },
    buckle: { name: 'Buckle', materials: ['Leather'], difficulty: 0, escape: 0, cost: 0, effects: {}, description: 'Fast fastening with the standard escape rating.' },
    padlock: { name: 'Padlock', materials: ['Leather', 'Steel'], difficulty: 8, escape: 20, cost: 1, effects: {}, description: 'Higher escape difficulty; adds one action point to application.' },
    latch: { name: 'Latch', materials: ['Steel'], difficulty: 0, escape: 0, cost: 0, effects: {}, description: 'Fast closure with the standard escape rating.' },
    double: { name: 'Double lock', materials: ['Steel'], difficulty: 15, escape: 28, cost: 2, effects: { evasion: 5 }, description: 'Strongest security, but slower and harder to apply.' }
  };
  const catalog = [
    { id: 'rope-wrists', name: 'Cord wrist bind', material: 'Rope', slot: 'wrists', difficulty: 24, escape: 22, cost: 2, effects: { dexterity: 25, evasion: 5 }, description: 'Light control that disrupts equipment handling.' },
    { id: 'rope-ankles', name: 'Trail snare', material: 'Rope', slot: 'ankles', difficulty: 32, escape: 28, cost: 2, effects: { movement: 30, evasion: 15 }, description: 'A mobility snare that limits quick repositioning.' },
    { id: 'rope-arms', name: 'Woven arm tether', material: 'Rope', slot: 'arms', difficulty: 42, escape: 36, cost: 3, effects: { dexterity: 30, recovery: 10 }, description: 'Slower to establish, with sustained handling pressure.' },
    { id: 'rope-legs', name: 'Ranger leg weave', material: 'Rope', slot: 'legs', difficulty: 46, escape: 40, cost: 3, effects: { movement: 25, evasion: 20, recovery: 5 }, description: 'Broad movement control with a small recovery penalty.' },
    { id: 'leather-wrists', name: 'Padded wrist cuffs', material: 'Leather', slot: 'wrists', difficulty: 30, escape: 34, cost: 2, effects: { dexterity: 30, recovery: 5 }, description: 'Reliable handling suppression with flexible security.' },
    { id: 'leather-ankles', name: 'Stride straps', material: 'Leather', slot: 'ankles', difficulty: 38, escape: 40, cost: 2, effects: { movement: 35, evasion: 10 }, description: 'A stronger movement penalty with moderate setup time.' },
    { id: 'leather-arms', name: 'Warden arm bands', material: 'Leather', slot: 'arms', difficulty: 48, escape: 46, cost: 3, effects: { dexterity: 35, evasion: 10, recovery: 10 }, description: 'Balanced control across three combat attributes.' },
    { id: 'leather-legs', name: 'Tracker leg straps', material: 'Leather', slot: 'legs', difficulty: 44, escape: 44, cost: 3, effects: { movement: 30, evasion: 25 }, description: 'Designed to counter evasive opponents.' },
    { id: 'steel-wrists', name: 'Linked steel cuffs', material: 'Steel', slot: 'wrists', difficulty: 40, escape: 48, cost: 3, effects: { dexterity: 40, evasion: 10 }, description: 'Heavy handling control with a demanding escape check.' },
    { id: 'steel-ankles', name: 'Chain ankle irons', material: 'Steel', slot: 'ankles', difficulty: 48, escape: 52, cost: 3, effects: { movement: 45, evasion: 15, recovery: 5 }, description: 'Heavy mobility control that also taxes recovery.' },
    { id: 'steel-arms', name: 'Sentinel arm clamps', material: 'Steel', slot: 'arms', difficulty: 58, escape: 58, cost: 4, effects: { dexterity: 40, evasion: 15, recovery: 15 }, description: 'High commitment control for a staggered target.' },
    { id: 'steel-legs', name: 'Bastion leg braces', material: 'Steel', slot: 'legs', difficulty: 62, escape: 62, cost: 4, effects: { movement: 40, evasion: 30, recovery: 10 }, description: 'The slowest setup, with powerful movement and dodge penalties.' }
  ];
  const conditions = { alert: { name: 'Alert', bonus: 0 }, distracted: { name: 'Distracted', bonus: 15 }, staggered: { name: 'Staggered', bonus: 30 } };
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const getItem = id => catalog.find(item => item.id === id);
  const methodsFor = item => ({ Rope: ['knot', 'cinch'], Leather: ['buckle', 'cinch', 'padlock'], Steel: ['latch', 'padlock', 'double'] }[item.material] || []).map(id => [id, methods[id]]);
  function sanitize(entries) {
    const result = [], occupied = new Set();
    for (const entry of Array.isArray(entries) ? entries : []) {
      const item = getItem(entry?.itemId), method = methods[entry?.methodId];
      if (!item || !method?.materials?.includes(item.material) || occupied.has(item.slot)) continue;
      occupied.add(item.slot);
      result.push({ itemId: item.id, methodId: entry.methodId });
    }
    return result;
  }
  function migrate(character) {
    if (Array.isArray(character?.restraints)) return sanitize(character.restraints);
    const old = character?.restraint;
    const ids = old === 'Stasis' ? ['steel-wrists', 'steel-ankles', 'steel-arms', 'steel-legs'] : old === 'Wrist lock' ? ['steel-wrists'] : old === 'Ankle lock' ? ['steel-ankles'] : [];
    return ids.map(itemId => ({ itemId, methodId: 'latch' }));
  }
  function profile(itemId, methodId) {
    const item = getItem(itemId), method = methods[methodId];
    if (!item || !method?.materials?.includes(item.material)) return null;
    const effects = {};
    for (const key of Object.keys(attributes)) effects[key] = (item.effects[key] || 0) + (method.effects[key] || 0);
    return { item, method, difficulty: item.difficulty + method.difficulty, escape: item.escape + method.escape, cost: item.cost + method.cost, effects };
  }
  function penalties(character) {
    const total = Object.fromEntries(Object.keys(attributes).map(key => [key, 0]));
    for (const entry of sanitize(character.restraints)) {
      const current = profile(entry.itemId, entry.methodId);
      for (const key of Object.keys(total)) total[key] += current.effects[key];
    }
    for (const key of Object.keys(total)) total[key] = Math.min(85, total[key]);
    return total;
  }
  function applyChance(actor, itemId, methodId, condition = 'alert') {
    const current = profile(itemId, methodId);
    if (!current || !conditions[condition]) return 0;
    return clamp(Math.round(100 - current.difficulty + conditions[condition].bonus - penalties(actor).dexterity * 0.4), 5, 95);
  }
  function escapeChance(target, entry) {
    const current = profile(entry.itemId, entry.methodId);
    if (!current) return 0;
    return clamp(Math.round(100 - current.escape - penalties(target).dexterity * 0.25), 5, 90);
  }
  function attemptApply({ target, actor, itemId, methodId, condition = 'alert', ap }, random = Math.random) {
    const current = profile(itemId, methodId);
    if (!current || !conditions[condition]) return { accepted: false, reason: 'Choose a valid restraint and securing method.' };
    const entries = sanitize(target.restraints);
    if (entries.some(entry => getItem(entry.itemId).slot === current.item.slot)) return { accepted: false, reason: `Release the existing ${current.item.slot} restraint first.` };
    if (!Number.isFinite(ap) || ap < current.cost) return { accepted: false, reason: 'Not enough action points. Refill the trial budget.' };
    const chance = applyChance(actor, itemId, methodId, condition), roll = Math.floor(random() * 100) + 1, success = roll <= chance;
    return { accepted: true, success, roll, chance, ap: ap - current.cost, restraints: success ? [...entries, { itemId, methodId }] : entries };
  }
  function attemptEscape({ target, itemId, ap }, random = Math.random) {
    const entries = sanitize(target.restraints), entry = entries.find(value => value.itemId === itemId);
    if (!entry) return { accepted: false, reason: 'That restraint is no longer equipped.' };
    if (!Number.isFinite(ap) || ap < 2) return { accepted: false, reason: 'Escape needs 2 action points. Refill the trial budget.' };
    const chance = escapeChance(target, entry), roll = Math.floor(random() * 100) + 1, success = roll <= chance;
    return { accepted: true, success, roll, chance, ap: ap - 2, restraints: success ? entries.filter(value => value.itemId !== itemId) : entries };
  }
  return { materials, slots, attributes, methods, catalog, conditions, getItem, methodsFor, sanitize, migrate, profile, penalties, applyChance, escapeChance, attemptApply, attemptEscape };
})();
if (typeof module !== 'undefined') module.exports = RestraintSystem;
