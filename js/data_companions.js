// data_companions.js — Hireable companion definitions (data only; logic in companions.js).
// One companion may be active at a time; the active one acts every round of combat
// (see the companion block in combat_buffs.js tickBuffs).
//
// Shape:
//   id: {
//     name, icon, desc,
//     role:    'damage' | 'healer'
//     base:    number    — flat per-round amount (damage dealt or HP healed)
//     scale:   number    — added per player level (amount = base + floor(lvl * scale))
//     cost:    number    — gold to hire (one-time)
//     reqLevel:number?    — minimum player level to hire (default 1)
//   }
const companionDefs = {
  kael: { name: 'Kael the Sellsword', icon: '🗡️', role: 'damage', base: 8,  scale: 1.5, cost: 300, reqLevel: 1,
    desc: 'A reliable blade who strikes the enemy every round.' },
  mira: { name: 'Mira the Acolyte',   icon: '✨', role: 'healer', base: 6,  scale: 1.2, cost: 400, reqLevel: 1,
    desc: 'A gentle healer who mends your wounds every round.' },
  grok: { name: 'Grok the Berserker', icon: '🪓', role: 'damage', base: 15, scale: 2.0, cost: 800, reqLevel: 8,
    desc: 'A savage axe that hits far harder — for a price.' },
};

// Per-round amount the companion contributes, scaled by the player's level.
function companionRoundAmount(comp) {
  return comp.base + Math.floor((game.player.lvl || 1) * comp.scale);
}
