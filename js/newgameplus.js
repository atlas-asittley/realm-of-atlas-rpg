// newgameplus.js — New Game+ cycles and NG+ enemy level-scaling.
// Depends on: state.js (game), data_enemies.js (chestsOpened), combat.js (startCombat scaling hook),
//             gameplay.js (enterLocation/msg/toast), ui_hud.js (saveGame/closeHudMenu),
//             ui_quests.js (closeEnding), constants.js (T), map.js (maps).
//
// After the player wins the main story (game.flags.gameWon), they can begin New Game+:
//   • The CHARACTER carries over — level, stats, skills, gold, inventory, equipped gear,
//     hired companions, faction reputation.
//   • The WORLD resets — quest progress, kill counts, boss-dead flags, opened chests — so the
//     campaign and bounties are replayable and bosses can be fought again.
//   • Every real combat enemy is scaled up by the NG+ tier so the game stays a challenge for a
//     high-level character.
//
// IMPORTANT (balance): NG+ tier 0 (a first playthrough) applies a 1× multiplier — applyNgPlusScaling
// is a no-op at tier 0, so the carefully play-tested base-game values are never touched. Scaling
// only ever makes enemies *tougher* on subsequent cycles.

// Per-tier multipliers (tier N: hp ×(1+0.6N), atk ×(1+0.35N), def ×(1+0.3N), rewards ×(1+0.5N)).
const NGP_HP_PER_TIER     = 0.6;
const NGP_ATK_PER_TIER    = 0.35;
const NGP_DEF_PER_TIER    = 0.30;
const NGP_REWARD_PER_TIER = 0.5;

function ngPlusTier() { return (game.flags && game.flags.ngPlus) || 0; }

// Scales a spawned enemy *instance*'s combat stats by the current NG+ tier. Called on the
// combatEnemy copy in startCombat (combat.js) — never on enemyTypes or the on-map instance — so
// scaling stays confined to the fight and never compounds. Skips trials/sparring, which build their
// own combatEnemy and never route through startCombat.
function applyNgPlusScaling(enemy) {
  let tier = ngPlusTier();
  if (!enemy || tier <= 0) return enemy;
  let hpM  = 1 + NGP_HP_PER_TIER * tier;
  let atkM = 1 + NGP_ATK_PER_TIER * tier;
  let defM = 1 + NGP_DEF_PER_TIER * tier;
  let rwM  = 1 + NGP_REWARD_PER_TIER * tier;
  enemy.hp    = Math.round((enemy.hp || 1) * hpM);
  enemy.maxHp = Math.round((enemy.maxHp || enemy.hp || 1) * hpM);
  enemy.atk   = Math.round((enemy.atk || 0) * atkM);
  enemy.def   = Math.round((enemy.def || 0) * defM);
  enemy.xp    = Math.round((enemy.xp || 0) * rwM);
  if (Array.isArray(enemy.gold)) enemy.gold = [Math.round(enemy.gold[0] * rwM), Math.round(enemy.gold[1] * rwM)];
  enemy.ngScaled = true;
  return enemy;
}

// World-boss marker tiles on maps.world. Mirrors the worldBossLabels list in render.js — combat.js
// blanks a marker to GRASS when its boss dies, so NG+ must paint the markers back for the session.
const NGP_WORLD_BOSS_MARKERS = [
  { x: 4,  y: 32, tile: 'WORLD_BOSS_DRAGON' },
  { x: 29, y: 4,  tile: 'WORLD_BOSS_GOLEM'  },
  { x: 5,  y: 26, tile: 'WORLD_BOSS_HYDRA'  },
];

function restoreWorldBossMarkers() {
  if (typeof maps === 'undefined' || !maps.world || typeof T === 'undefined') return;
  for (let m of NGP_WORLD_BOSS_MARKERS) {
    let tv = T[m.tile];
    if (tv !== undefined && maps.world[m.y]) maps.world[m.y][m.x] = tv;
  }
}

// ─── NG+ entry flow ───────────────────────────────────────────────────────────
// Opened from the victory screen and the HUD menu. Guards on gameWon so it can't fire early.
function requestNewGamePlus() {
  if (typeof closeHudMenu === 'function') closeHudMenu();
  if (!game.flags || !game.flags.gameWon) {
    toast('Finish the main story first.', '');
    msg('New Game+ unlocks after you defeat the Unnamed One and complete the main story.');
    return;
  }
  let overlay = document.getElementById('ngplus-confirm-overlay');
  if (overlay) overlay.style.display = 'flex';
}

function cancelNewGamePlus() {
  let overlay = document.getElementById('ngplus-confirm-overlay');
  if (overlay) overlay.style.display = 'none';
}

// Begins the next cycle: bump the tier, wipe world progress (keep the character), and drop the
// player back in town. Enemies are scaled lazily at combat time via applyNgPlusScaling.
function startNewGamePlus() {
  if (!game.flags || !game.flags.gameWon) return;
  cancelNewGamePlus();
  if (typeof closeEnding === 'function') closeEnding();

  let tier = ngPlusTier() + 1;
  game.flags.ngPlus = tier;

  // Reset replayable world state (the character — player/inventory/equipped — is untouched).
  game.flags.quests = {};
  game.flags.killCounts = {};
  game.flags.talkedTo = {};
  for (let k in game.flags) { if (/^boss_.+_dead$/.test(k)) delete game.flags[k]; }
  restoreWorldBossMarkers();
  if (typeof chestsOpened !== 'undefined') chestsOpened = {};
  game.flags.gameWon = false;

  // Restore the hero to full and return them to town to begin again.
  game.player.hp = game.player.maxHp;
  game.player.mana = game.player.maxMana || 0;
  enterLocation('town', 20, 2, `NEW GAME + ${tier}`,
    `New Game+ ${tier} begun!`, 'gold',
    `A new cycle dawns. The Heralds stir once more — and the realm's foes are far deadlier now (New Game+ ${tier}).`);
  saveGame();
}
