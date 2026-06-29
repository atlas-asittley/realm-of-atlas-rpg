// factions.js — Faction reputation engine + the Reputation screen.
// Data in data_factions.js. Depends on: state.js (game), gameplay.js (msg/toast, addCombatLog),
// ui_hud.js (saveGame). Combat calls awardFactionRepForKill (combatWin); shops read
// activeShopFaction via getDiscountedPrice (ui_panels.js); interactNPC sets activeShopFaction
// and shows factionGreeting.

// Which faction's shop the player currently has open (null otherwise). Drives the rep discount.
let activeShopFaction = null;

function factionRep(id) {
  return (game.flags.reputation && game.flags.reputation[id]) || 0;
}

function factionRank(id) {
  let p = factionRep(id);
  for (let r of FACTION_RANKS) if (p >= r.min) return r;
  return FACTION_RANKS[FACTION_RANKS.length - 1];
}

function addFactionRep(id, amt) {
  if (!factionDefs[id]) return;
  if (!game.flags.reputation) game.flags.reputation = {};
  game.flags.reputation[id] = (game.flags.reputation[id] || 0) + amt;
}

// Called from combatWin (non-sparring): slaying a faction's foe grants reputation.
function awardFactionRepForKill(enemy) {
  if (!enemy) return;
  let key = enemy.typeKey || enemy.worldMapKey;
  if (!key) return;
  for (let id in factionDefs) {
    if (!factionDefs[id].foes.includes(key)) continue;
    let before = factionRank(id).name;
    addFactionRep(id, REP_PER_KILL);
    let after = factionRank(id).name;
    addCombatLog(`${factionDefs[id].icon} ${factionDefs[id].name} reputation +${REP_PER_KILL}`, 'system');
    if (after !== before) toast(`${factionDefs[id].name}: now ${after}!`, 'gold');
  }
}

// The faction a shop NPC belongs to, or null.
function factionOfNpc(npc) {
  for (let id in factionDefs) {
    if (factionDefs[id].shopFlags.some(f => npc[f])) return id;
  }
  return null;
}

// Extra shop discount (0–0.10) from standing with the active shop's faction.
function factionDiscount(id) {
  return id ? factionRank(id).discount : 0;
}

// A bracketed standing label to prepend to a faction NPC's dialogue, or null.
function factionGreeting(npc) {
  let id = factionOfNpc(npc);
  if (!id) return null;
  let r = factionRank(id);
  return `[${factionDefs[id].icon} ${factionDefs[id].name} — ${r.name}]`;
}

// ── Reputation screen ──
function openReputation() {
  document.getElementById('reputation-screen').style.display = 'flex';
  renderReputation();
}

function closeReputation() { document.getElementById('reputation-screen').style.display = 'none'; }

function renderReputation() {
  let list = document.getElementById('reputation-list');
  let html = '';
  for (let id in factionDefs) {
    let f = factionDefs[id];
    let pts = factionRep(id);
    let rank = factionRank(id);
    let disc = rank.discount > 0 ? `${Math.round(rank.discount * 100)}% shop discount` : 'No discount yet';
    html += `<div class="quest-entry">
      <div class="quest-entry-head"><span class="quest-name">${f.icon} ${f.name}</span><span class="quest-status-tag quest-done-tag">${rank.name}</span></div>
      <div class="quest-desc">${f.desc}</div>
      <div class="quest-obj quest-obj-done">${pts} rep &nbsp;·&nbsp; ${disc}</div>
    </div>`;
  }
  list.innerHTML = html;
}
