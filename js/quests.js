// quests.js — Quest engine: status resolution, progress tracking, accept/turn-in.
// Data lives in data_quests.js (questDefs); the log UI lives in ui_quests.js.
// Depends on: state.js (game, addInventoryItem, removeInventoryItem), data_quests.js,
//             data_enemies.js (enemyTypes), data_items.js (itemDefs),
//             combat.js (applyLevelUp), gameplay.js (msg/toast), ui_hud.js (saveGame).
//
// Persistent state (saved inside game.flags so existing save/load migration covers it):
//   game.flags.quests     = { questId: { status:'active'|'done', slayBase:{objIdx:N}, _notified:bool } }
//   game.flags.killCounts = { enemyTypeKey: totalKills }   — lifetime kills, used by 'slay' objectives
//
// A quest with no entry in game.flags.quests is 'available' (if its prereqs are met) or 'locked'.

function ensureQuestState() {
  if (!game.flags) game.flags = {};
  if (!game.flags.quests) game.flags.quests = {};
  if (!game.flags.killCounts) game.flags.killCounts = {};
}

// Called from combat.js on every real (non-sparring) enemy defeat.
function recordEnemyKill(enemy) {
  if (!enemy) return;
  ensureQuestState();
  let key = enemy.typeKey || enemy.worldMapKey;
  if (!key) return;
  game.flags.killCounts[key] = (game.flags.killCounts[key] || 0) + 1;
  checkQuestReadyToasts();
}

function questPrereqMet(id) {
  let def = questDefs[id];
  if (!def) return false;
  if (def.minLevel && (game.player.lvl || 1) < def.minLevel) return false;
  if (def.requires && getQuestStatus(def.requires) !== 'done') return false;
  return true;
}

// Returns 'locked' | 'available' | 'active' | 'done' | 'unknown'.
function getQuestStatus(id) {
  ensureQuestState();
  let s = game.flags.quests[id];
  if (s && s.status === 'done') return 'done';
  if (s && s.status === 'active') return 'active';
  if (!questDefs[id]) return 'unknown';
  return questPrereqMet(id) ? 'available' : 'locked';
}

// Progress for a single objective → { have, need, done }.
function objectiveStatus(obj, idx, state) {
  let need = obj.count || 1;
  let have = 0;
  if (obj.type === 'collect') {
    have = game.inventory.filter(id => id === obj.item).length;
  } else if (obj.type === 'slay') {
    let base = (state && state.slayBase && state.slayBase[idx]) || 0;
    have = Math.max(0, (game.flags.killCounts[obj.enemy] || 0) - base);
  } else if (obj.type === 'defeat_boss') {
    need = 1;
    have = game.flags['boss_' + obj.boss + '_dead'] ? 1 : 0;
  } else if (obj.type === 'level') {
    need = obj.level || 1;
    have = Math.min(game.player.lvl || 1, need);
  }
  have = Math.min(have, need);
  return { have, need, done: have >= need };
}

function isQuestComplete(id) {
  let def = questDefs[id];
  if (!def) return false;
  let state = game.flags.quests[id];
  return def.objectives.every((obj, idx) => objectiveStatus(obj, idx, state).done);
}

function acceptQuest(id) {
  if (getQuestStatus(id) !== 'available') return;
  let def = questDefs[id];
  // Capture the current kill tally so 'slay' objectives only count kills made AFTER accepting.
  let slayBase = {};
  def.objectives.forEach((obj, idx) => {
    if (obj.type === 'slay') slayBase[idx] = game.flags.killCounts[obj.enemy] || 0;
  });
  game.flags.quests[id] = { status: 'active', slayBase };
  toast('Quest accepted: ' + def.name, 'green');
  msg('Quest accepted: ' + def.name + ' — ' + def.desc);
  saveGame();
}

function turnInQuest(id) {
  if (getQuestStatus(id) !== 'active' || !isQuestComplete(id)) return;
  let def = questDefs[id];
  // Consume 'collect' items.
  def.objectives.forEach(obj => {
    if (obj.type === 'collect') {
      let removed = 0;
      for (let i = game.inventory.length - 1; i >= 0 && removed < (obj.count || 1); i--) {
        if (game.inventory[i] === obj.item) { removeInventoryItem(i); removed++; }
      }
    }
  });
  // Grant rewards.
  let r = def.rewards || {};
  if (r.gold) game.player.gold += r.gold;
  if (r.xp) {
    game.player.xp += r.xp;
    while (game.player.xp >= game.player.xpNext) {
      game.player.xp -= game.player.xpNext;
      applyLevelUp();
      toast(`LEVEL UP! Now level ${game.player.lvl}! +3 Skill Pts!`, 'green');
    }
  }
  if (r.items) r.items.forEach(it => addInventoryItem(it));

  game.flags.quests[id] = { status: 'done' };

  let parts = [];
  if (r.gold) parts.push(`+${r.gold}g`);
  if (r.xp) parts.push(`+${r.xp} XP`);
  if (r.items) r.items.forEach(it => parts.push(itemDefs[it] ? itemDefs[it].name : it));
  let rewardStr = parts.join('  ');
  toast('Quest complete: ' + def.name, 'green');
  msg((def.completeText ? def.completeText + ' ' : `Quest complete: ${def.name}! `) + `(${rewardStr})`);

  if (def.next && getQuestStatus(def.next) === 'available') {
    toast('New quest available: ' + (questDefs[def.next] ? questDefs[def.next].name : def.next), 'green');
  }
  // Optional turn-in hook (e.g. the campaign finale triggers the ending screen).
  if (def.onTurnIn && typeof globalThis[def.onTurnIn] === 'function') globalThis[def.onTurnIn]();
  saveGame();
}

// One-time "ready to turn in" toast per quest, fired as world state changes (e.g. on a kill).
function checkQuestReadyToasts() {
  ensureQuestState();
  for (let id in game.flags.quests) {
    let s = game.flags.quests[id];
    if (s && s.status === 'active' && !s._notified && isQuestComplete(id)) {
      s._notified = true;
      toast('Quest ready to turn in: ' + (questDefs[id] ? questDefs[id].name : id), 'green');
    }
  }
}

// NPC quest-giver interaction (called from interactNPC). npc.questGiver is a quest id.
function handleQuestGiver(npc) {
  let id = npc.questGiver;
  let def = questDefs[id];
  if (!def) { if (npc.dialog) msg(npc.dialog); return; }
  if (getQuestStatus(id) === 'done') {
    msg(def.doneText || `${npc.name}: "Thank you again, friend."`);
    return;
  }
  msg(npc.dialog || def.desc);
  openQuestLog();
}
