// ui_quests.js — Quest Log screen: lists quests by status with accept / turn-in buttons.
// Depends on: quests.js (status + progress + accept/turnIn), data_quests.js (questDefs),
//             data_enemies.js (enemyTypes), data_items.js (itemDefs).
// Panel HTML (#quest-log-screen) lives in index.html; styling in style.css.

function openQuestLog() {
  document.getElementById('quest-log-screen').style.display = 'flex';
  renderQuestLog();
}

function closeQuestLog() {
  document.getElementById('quest-log-screen').style.display = 'none';
}

function objectiveLabel(obj) {
  if (obj.type === 'collect') {
    let nm = itemDefs[obj.item] ? itemDefs[obj.item].name : obj.item;
    return `Collect ${nm}`;
  }
  if (obj.type === 'slay') {
    let nm = enemyTypes[obj.enemy] ? enemyTypes[obj.enemy].name : obj.enemy;
    return `Defeat ${nm}`;
  }
  if (obj.type === 'defeat_boss') {
    let nm = enemyTypes[obj.boss] ? enemyTypes[obj.boss].name : obj.boss;
    return `Slay ${nm}`;
  }
  if (obj.type === 'level') {
    return `Reach level ${obj.level || 1}`;
  }
  if (obj.type === 'talk') {
    return `Speak with ${obj.npc}`;
  }
  if (obj.type === 'reach') {
    return `Travel to ${obj.mapName || obj.map}`;
  }
  return '';
}

function questRewardLabel(def) {
  let r = def.rewards || {};
  let parts = [];
  if (r.gold) parts.push(`${r.gold}g`);
  if (r.xp) parts.push(`${r.xp} XP`);
  if (r.items) r.items.forEach(it => parts.push(itemDefs[it] ? itemDefs[it].name : it));
  return parts.length ? parts.join('  ') : '—';
}

function questEntryHtml(id) {
  let def = questDefs[id];
  let st = getQuestStatus(id);
  let state = game.flags.quests[id];

  let objHtml = def.objectives.map((obj, idx) => {
    let o = objectiveStatus(obj, idx, state);
    let mark = o.done ? '✔' : '○';
    return `<div class="quest-obj ${o.done ? 'quest-obj-done' : ''}">${mark} ${objectiveLabel(obj)} <span class="quest-obj-count">${o.have}/${o.need}</span></div>`;
  }).join('');

  let action = '';
  if (st === 'available') {
    action = `<button class="btn quest-btn" onclick="acceptQuest('${id}');renderQuestLog()">ACCEPT</button>`;
  } else if (st === 'active' && isQuestComplete(id)) {
    action = `<button class="btn quest-btn quest-btn-ready" onclick="turnInQuest('${id}');renderQuestLog()">TURN IN</button>`;
  } else if (st === 'active') {
    action = `<span class="quest-status-tag">IN PROGRESS</span>`;
  } else if (st === 'done') {
    action = `<span class="quest-status-tag quest-done-tag">COMPLETE</span>`;
  }

  let src = def.giverName ? `<span class="quest-source">${def.giverName}</span>` : '';
  let storyBadge = def.story ? `<span class="quest-story-badge">STORY</span> ` : '';
  return `<div class="quest-entry quest-${st}${def.story ? ' quest-story' : ''}">
    <div class="quest-entry-head"><span class="quest-name">${storyBadge}${def.name}</span>${action}</div>
    <div class="quest-desc">${def.desc} ${src}</div>
    ${objHtml}
    <div class="quest-reward">Reward: ${questRewardLabel(def)}</div>
  </div>`;
}

function renderQuestGroup(title, ids) {
  if (!ids.length) return '';
  return `<div class="quest-group-title">${title}</div>` + ids.map(questEntryHtml).join('');
}

function renderQuestLog() {
  let list = document.getElementById('quest-log-list');
  let active = [], available = [], done = [];
  for (let id in questDefs) {
    let st = getQuestStatus(id);
    if (st === 'active') active.push(id);
    else if (st === 'available') available.push(id);
    else if (st === 'done') done.push(id);
  }
  // Story quests sort to the top of each group.
  let storyFirst = (a, b) => (questDefs[a].story ? 0 : 1) - (questDefs[b].story ? 0 : 1);
  active.sort(storyFirst); available.sort(storyFirst); done.sort(storyFirst);
  let html = renderQuestGroup('IN PROGRESS', active)
           + renderQuestGroup('AVAILABLE', available)
           + renderQuestGroup('COMPLETED', done);
  if (!html) html = '<div class="quest-empty">No quests yet. Explore the realm and talk to the townsfolk — bounties await.</div>';
  list.innerHTML = html;
}

// ─── ENDING ─────────────────────────────────────────────────────────────────
// Triggered by the campaign finale's onTurnIn hook (see questDefs.msq_finale).
// Marks the run as won and shows the victory screen; the player keeps their save
// and can keep exploring afterward.
function showEnding() {
  game.flags.gameWon = true;
  closeQuestLog();
  document.getElementById('ending-screen').style.display = 'flex';
}

function closeEnding() {
  document.getElementById('ending-screen').style.display = 'none';
}
