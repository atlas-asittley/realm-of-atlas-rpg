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

  // ── Main Story: "The Sundering" ────────────────────────────────────────────
  // A linear campaign (chained via requires/next) that gives the existing world
  // bosses narrative weight and ends with a victory screen (msq_finale.onTurnIn).
  msq_call: {
    name: "The Seer's Vision", story: true, giverName: 'The Seer',
    desc: 'The Seer of Atlas has foreseen a rising darkness. Prove your strength — reach level 5 — and return to her.',
    next: 'msq_dragon',
    objectives: [ { type: 'level', level: 5 } ],
    rewards: { gold: 100, xp: 150 },
    completeText: 'The Seer: "You are ready. Three Heralds announce the Unnamed One\'s return. They must fall."',
  },
  msq_dragon: {
    name: 'Herald of Flame', story: true, giverName: 'The Seer',
    desc: 'The first Herald — the Elder Dragon — scorches the western wilds. Slay it to weaken the seal.',
    minLevel: 8, requires: 'msq_call', next: 'msq_golem',
    objectives: [ { type: 'defeat_boss', boss: 'elder_dragon' } ],
    rewards: { gold: 600, xp: 600 },
  },
  msq_golem: {
    name: 'Herald of Stone', story: true, giverName: 'The Seer',
    desc: 'The Titan Golem, second Herald, stands unmoving in the north. Bring it down.',
    minLevel: 10, requires: 'msq_dragon', next: 'msq_hydra',
    objectives: [ { type: 'defeat_boss', boss: 'titan_golem' } ],
    rewards: { gold: 800, xp: 800 },
  },
  msq_hydra: {
    name: 'Herald of the Void', story: true, giverName: 'The Seer',
    desc: 'The Void Hydra, last Herald, writhes at the edge of reality. End it, and the seal shatters.',
    minLevel: 12, requires: 'msq_golem', next: 'msq_finale',
    objectives: [ { type: 'defeat_boss', boss: 'void_hydra' } ],
    rewards: { gold: 1000, xp: 1000 },
  },
  msq_finale: {
    name: 'The Unnamed End', story: true, giverName: 'The Seer',
    desc: 'The seal is broken. Descend into the Abyss and face the Unnamed One itself. This is the end.',
    minLevel: 15, requires: 'msq_hydra',
    objectives: [ { type: 'defeat_boss', boss: 'the_unnamed_one' } ],
    rewards: { gold: 5000, xp: 5000 },
    onTurnIn: 'showEnding',
    completeText: 'The Unnamed One unmakes into silence. The realm is saved. You are the Hero of Atlas.',
  },
};
