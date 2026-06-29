// data_factions.js — Faction definitions (data only; logic in factions.js).
//
// Reputation rises when you slay a faction's foes (awardFactionRepForKill in combatWin) and
// can be granted by quests (rewards.rep). Standing affects that faction's shop prices and how
// its NPCs greet you. Reputation points live in game.flags.reputation = { factionId: points }.
//
// Faction shape:
//   id: { name, icon, desc, foes:[enemyTypeKey,...], shopFlags:[npcFlag,...] }
//   - foes:      slaying any of these grants REP_PER_KILL with this faction
//   - shopFlags: NPC flags whose shops belong to this faction (drives discount + greeting)
const factionDefs = {
  dwarves: {
    name: 'Ironhold Dwarves', icon: '⛏', desc: 'Master smiths of the deep mountain. They prize those who break the things that besiege them.',
    foes: ['cave_troll', 'titan_golem', 'rock_golem', 'forge_guardian'],
    shopFlags: ['dwarfShop'],
  },
  dawn: {
    name: 'Order of the Dawn', icon: '✝️', desc: 'Holy warriors sworn to cleanse the undead from the realm.',
    foes: ['skeleton', 'skeleton_king', 'undead_knight', 'skeleton_archer', 'corrupted_priest', 'ancient_guardian'],
    shopFlags: ['holyShop'],
  },
  sylvan: {
    name: 'Sylvan Court', icon: '🌿', desc: 'Keepers of the elven wood, ever at war with the forest\'s corruption.',
    foes: ['shadow_spider', 'venom_wolf', 'forest_wraith', 'ancient_treant'],
    shopFlags: ['elvenShop', 'silverforgeShop', 'bowyerShop', 'herbalistShop', 'lorekeeperShop'],
  },
};

// Ranks are checked high→low; the first whose `min` the player meets is their standing.
const FACTION_RANKS = [
  { min: 300,        name: 'Exalted',  discount: 0.10 },
  { min: 150,        name: 'Honored',  discount: 0.06 },
  { min: 50,         name: 'Friendly', discount: 0.03 },
  { min: 0,          name: 'Neutral',  discount: 0 },
  { min: -Infinity,  name: 'Disliked', discount: 0 },
];

const REP_PER_KILL = 5;
