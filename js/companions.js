// companions.js — Companion hiring + the recruitment screen.
// Combat behaviour lives in combat_buffs.js (tickBuffs reads game.player.companion and acts
// each round, mirroring the summon/animal-companion pattern). Data in data_companions.js.
// Depends on: state.js (game), gameplay.js (msg/toast), ui_hud.js (saveGame),
//             data_companions.js (companionDefs, companionRoundAmount).
//
// State (persisted on game.player / game.flags):
//   game.flags.recruitedCompanions = [id, ...]   — companions you own
//   game.player.companion          = id | null   — the one currently fighting with you

function recruitedCompanions() {
  return game.flags.recruitedCompanions || (game.flags.recruitedCompanions = []);
}

function hireCompanion(id) {
  let c = companionDefs[id];
  if (!c) return;
  if (recruitedCompanions().includes(id)) { setActiveCompanion(id); return; }
  if (c.reqLevel && (game.player.lvl || 1) < c.reqLevel) { toast(`Requires level ${c.reqLevel}`, 'red'); return; }
  if ((game.player.gold || 0) < c.cost) { toast('Not enough gold!', 'red'); return; }
  game.player.gold -= c.cost;
  recruitedCompanions().push(id);
  game.player.companion = id;
  toast(`${c.name} joins you!`, 'gold');
  msg(`${c.name} has joined your party and will fight at your side.`);
  saveGame();
  renderCompanions();
}

function setActiveCompanion(id) {
  if (!recruitedCompanions().includes(id)) return;
  game.player.companion = id;
  toast(`${companionDefs[id].name} is now at your side.`, 'green');
  saveGame();
  renderCompanions();
}

function dismissCompanion() {
  game.player.companion = null;
  toast('You will fight alone.', '');
  saveGame();
  renderCompanions();
}

function openCompanions() {
  document.getElementById('companions-screen').style.display = 'flex';
  renderCompanions();
}

function closeCompanions() { document.getElementById('companions-screen').style.display = 'none'; }

function renderCompanions() {
  let list = document.getElementById('companions-list');
  let owned = recruitedCompanions();
  let active = game.player.companion;
  let html = '';
  for (let id in companionDefs) {
    let c = companionDefs[id];
    let isOwned = owned.includes(id);
    let isActive = active === id;
    let amount = companionRoundAmount(c);
    let effect = c.role === 'healer' ? `Heals you ${amount} HP/round` : `Deals ${amount} dmg/round`;

    let action;
    if (isActive) action = `<span class="quest-status-tag quest-done-tag">ACTIVE</span>`;
    else if (isOwned) action = `<button class="btn quest-btn" onclick="setActiveCompanion('${id}')">SET ACTIVE</button>`;
    else action = `<button class="btn quest-btn" onclick="hireCompanion('${id}')">HIRE ${c.cost}g</button>`;

    html += `<div class="quest-entry">
      <div class="quest-entry-head"><span class="quest-name">${c.icon} ${c.name}</span>${action}</div>
      <div class="quest-desc">${c.desc}</div>
      <div class="quest-obj quest-obj-done">${effect}${c.reqLevel > 1 ? ` &nbsp;·&nbsp; requires level ${c.reqLevel}` : ''}</div>
    </div>`;
  }
  if (active) html += `<button class="btn" style="margin-top:6px;width:100%" onclick="dismissCompanion()">Fight alone (dismiss companion)</button>`;
  list.innerHTML = html;
}
