// data_quests.js — Quest definitions (data only; no logic).
// Each quest is keyed by a stable id and consumed by quests.js (engine) and ui_quests.js (display).
//
// Shape:
//   id: {
//     name:        string  — display title
//     giverName:   string? — who offers it (flavor/source label in the log)
//     desc:        string  — one-line description shown in the quest log
//     minLevel:    number? — hidden until the player reaches this level
//     requires:    string? — quest id that must be 'done' before this unlocks
//     next:        string? — quest id surfaced when this one is turned in (chain hint)
//     objectives:  [ ... ] — ALL must be satisfied to turn in
//     rewards:     { gold?, xp?, items?:[itemId,...] }
//     completeText:string? — message shown on turn-in
//     doneText:    string? — what the giver says after completion
//   }
//
// Objective types (v1 — each maps to a hook the engine can already observe):
//   { type:'slay',        enemy:'<enemyTypeKey>', count:N }  — kills counted from acceptance onward
//   { type:'collect',     item:'<itemId>',        count:N }  — counted from current inventory; consumed on turn-in
//   { type:'defeat_boss', boss:'<enemyTypeKey>' }            — satisfied by the boss-dead flag
//
// Enemy type keys come from enemyTypes (data_enemies.js); item ids from itemDefs (data_items.js).

const questDefs = {
  // Folded-in legacy quest (was hardcoded in gameplay.js / combat.js).
  rat_tails: {
    name: 'A Plague of Mice',
    giverName: 'Old Farmer',
    desc: 'The Old Farmer wants the Training Grounds cleared of mice. Bring him 10 rat tails.',
    objectives: [ { type: 'collect', item: 'rat_tail', count: 10 } ],
    rewards: { gold: 60, xp: 80, items: ['ratcatchers_amulet'] },
    completeText: 'Old Farmer: "By the harvest gods, you actually did it! Take this amulet — you\'ve earned it."',
    doneText: 'Old Farmer: "You\'ve already rid these grounds of those blasted mice. Thank you, adventurer!"',
  },

  // ── Bounty Board (Atlas Town) ──────────────────────────────────────────────
  wolf_culling: {
    name: 'Wolves at the Gate',
    giverName: 'Bounty Board',
    desc: 'Wolf packs are harassing travelers on the roads. Thin their numbers.',
    objectives: [ { type: 'slay', enemy: 'wolf', count: 6 } ],
    rewards: { gold: 150, xp: 120 },
  },
  goblin_trouble: {
    name: 'Goblin Trouble',
    giverName: 'Bounty Board',
    desc: 'Goblins have been raiding the outskirts. Put a stop to it.',
    next: 'bandit_bounty',
    objectives: [ { type: 'slay', enemy: 'goblin', count: 5 } ],
    rewards: { gold: 120, xp: 100, items: ['big_hp_potion'] },
  },
  bandit_bounty: {
    name: "The Bandits' Reckoning",
    giverName: 'Bounty Board',
    desc: 'With the goblins scattered, the bandits grow bold. Hunt them down.',
    minLevel: 2,
    requires: 'goblin_trouble',
    objectives: [ { type: 'slay', enemy: 'bandit', count: 8 } ],
    rewards: { gold: 280, xp: 220 },
  },
  the_dragons_end: {
    name: "The Dragon's End",
    giverName: 'Bounty Board',
    desc: 'A dragon lairs on the third floor of the dungeon beneath Dragon\'s Gate. Slay it.',
    minLevel: 5,
    objectives: [ { type: 'defeat_boss', boss: 'dragon' } ],
    rewards: { gold: 1000, xp: 800 },
    completeText: 'The dragon is slain. The realm breathes easier — and the Bounty Board pays handsomely.',
  },
};
