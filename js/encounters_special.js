// encounters_special.js — Makes wandering eventful: elite enemies and roadside events.
// Depends on: state.js (game, addInventoryItem), data_enemies.js (enemyTypes, enemies[]),
//             data_items.js (itemDefs), combat.js (startCombat), gameplay.js (msg/toast),
//             combat_mechanics.js (recalcMaxHp/recalcMaxMana), ui_hud.js (saveGame).

// ── Elites ──────────────────────────────────────────────────────────────────
// A small fraction of spawned (non-boss) enemies are promoted to "elite": tougher,
// renamed, golden-tinted, and carrying guaranteed loot + bonus XP. Mutates the
// spawned *instance* (already a {...type} copy), never the shared enemyTypes def.
const ELITE_CHANCE = 0.06;
const ELITE_TITLES = ['Dire', 'Ancient', 'Frenzied', 'Vicious', 'Bloodthirsty', 'Savage', 'Cursed'];
const ELITE_LOOT = ['big_hp_potion', 'mana_potion', 'herb_potion', 'silver_dagger', 'scroll_of_protection'];

function eliteUpgrade(enemy, force) {
  if (!enemy || enemy.isBoss || enemy.isElite) return enemy;
  if (!force && Math.random() >= ELITE_CHANCE) return enemy;
  let title = ELITE_TITLES[Math.floor(Math.random() * ELITE_TITLES.length)];
  enemy.name = `${title} ${enemy.name}`;
  enemy.hp = Math.round((enemy.hp || 1) * 2.2);
  enemy.maxHp = enemy.hp;
  enemy.atk = Math.round((enemy.atk || 1) * 1.6);
  enemy.def = Math.round((enemy.def || 0) * 1.3);
  enemy.xp = Math.round((enemy.xp || 1) * 3);
  if (Array.isArray(enemy.gold)) enemy.gold = [enemy.gold[0] * 3, enemy.gold[1] * 3];
  enemy.isElite = true;
  enemy.color = '#f1c40f'; // golden tint telegraphs an elite on the map
  enemy.drops = (Array.isArray(enemy.drops) ? enemy.drops.slice() : []).concat(ELITE_LOOT);
  enemy.dropChance = 1; // elites always drop
  return enemy;
}

// ── Roadside events ───────────────────────────────────────────────────────────
// Rolled while travelling the world map (mutually exclusive with a normal encounter).
// Returns true if an event fired (caller should then skip the encounter roll).
const ROADSIDE_CHANCE = 0.05;

function rollRoadsideEvent() {
  if (Math.random() >= ROADSIDE_CHANCE) return false;
  let lvl = game.player.lvl || 1;
  let r = Math.random();

  if (r < 0.45) {
    // Treasure cache
    let gold = 20 + Math.floor(Math.random() * 30 * lvl);
    game.player.gold += gold;
    let extra = '';
    if (Math.random() < 0.3) {
      let it = ELITE_LOOT[Math.floor(Math.random() * ELITE_LOOT.length)];
      addInventoryItem(it);
      extra = ` and ${itemDefs[it] ? itemDefs[it].name : it}`;
    }
    toast(`Found ${gold} gold!`, 'gold');
    msg(`You uncover an abandoned cache — ${gold} gold${extra}.`);
    saveGame();
    return true;
  }

  if (r < 0.8) {
    // Wayshrine: full restore, with a rare permanent blessing
    game.player.hp = game.player.maxHp;
    game.player.mana = game.player.maxMana || 0;
    let blessed = '';
    if (Math.random() < 0.25) {
      let stats = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
      let s = stats[Math.floor(Math.random() * stats.length)];
      game.player[s] = (game.player[s] || 10) + 1;
      if (s === 'CON' && typeof recalcMaxHp === 'function') recalcMaxHp();
      if (s === 'INT' && typeof recalcMaxMana === 'function') recalcMaxMana();
      blessed = ` The spirits bless you: +1 ${s}!`;
    }
    toast('A wayshrine restores you.', 'green');
    msg(`You rest at an ancient wayshrine and feel renewed.${blessed}`);
    saveGame();
    return true;
  }

  // Ambush: an elite springs from the roadside. Routed as a world-map encounter (like the
  // normal world-map spawn) so it is spliced from enemies[] on BOTH victory and flight.
  let pool = ['wolf', 'bandit', 'goblin'];
  let key = pool[Math.floor(Math.random() * pool.length)];
  let type = enemyTypes[key];
  if (!type) return false;
  let enemy = eliteUpgrade({ ...type, typeKey: key, worldMapKey: key, x: game.player.x, y: game.player.y, maxHp: type.hp, opacity: 1, isBoss: false }, true);
  enemies.push(enemy);
  toast('Ambush!', 'red');
  msg(`A ${enemy.name} ambushes you from the roadside!`);
  isWorldMapEncounter = true;
  startCombat(enemies.length - 1);
  return true;
}
