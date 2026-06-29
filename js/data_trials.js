// data_trials.js — Elemental Trial definitions (data only).
// A Trial is a scored wave-gauntlet (see trials.js) whose enemies all share one
// damage type, so the player's resistance/weakness gear choices actually matter.
//
// Shape:
//   id: {
//     name, desc,
//     element:  'fire' | 'ice' | 'dark'   — forced damage type for every wave
//     waves:    number                     — total waves; the last is a "Champion"
//     enemies:  [enemyTypeKey, ...]         — cycled across the non-final waves
//     boss:     enemyTypeKey                — the final-wave Champion
//     rewardXp, rewardGold: number          — per-wave base (scaled by wave number)
//   }
const trialDefs = {
  embers: {
    name: 'Trial of Embers', element: 'fire',
    desc: 'Five waves of living flame. Ice resistance is your friend; fire weapons are not.',
    waves: 5, enemies: ['ember_sprite', 'lava_crab', 'fire_elemental'], boss: 'molten_golem',
    rewardXp: 80, rewardGold: 60,
  },
  frost: {
    name: 'Trial of Frost', element: 'ice',
    desc: 'Five waves born of the deep cold. Bring fire, and warm clothing.',
    waves: 5, enemies: ['frost_sprite', 'snow_wolf', 'ice_revenant'], boss: 'ancient_frost_giant',
    rewardXp: 90, rewardGold: 70,
  },
  void: {
    name: 'Trial of the Void', element: 'dark',
    desc: 'Five waves drawn from the Abyss itself. Holy power cuts deepest here.',
    waves: 5, enemies: ['abyssal_crawler', 'void_wraith', 'reality_ripper'], boss: 'elder_thing',
    rewardXp: 110, rewardGold: 85,
  },
};
