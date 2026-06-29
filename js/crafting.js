// crafting.js — Forge engine: material drops, recipe checks, and crafting.
// Data in data_recipes.js (recipeDefs) and data_items.js (materials + results).
// UI in ui_crafting.js. Depends on: state.js (game, addInventoryItem, removeInventoryItem),
// data_items.js (itemDefs), gameplay.js (msg/toast), ui_hud.js (saveGame),
// combat.js (combatWin calls rollMaterialDrop).

// Themed material a kill can drop, keyed by the enemy's damage type.
const MATERIAL_BY_TYPE = { fire: 'ember_shard', ice: 'frost_shard', dark: 'void_essence' };
const MATERIAL_GENERIC = ['iron_ore', 'monster_hide', 'bone_fragment'];
const MATERIAL_DROP_CHANCE = 0.22;

// Called from combatWin (non-sparring). Small chance to drop a crafting material,
// themed to the enemy's element when it has one.
function rollMaterialDrop(enemy) {
  if (!enemy) return;
  if (Math.random() >= MATERIAL_DROP_CHANCE) return;
  let mat = MATERIAL_BY_TYPE[enemy.damageType] || MATERIAL_GENERIC[Math.floor(Math.random() * MATERIAL_GENERIC.length)];
  addInventoryItem(mat);
  let nm = itemDefs[mat] ? itemDefs[mat].name : mat;
  addCombatLog(`Gathered: <b class="clog-heal">${nm}</b>`, 'system');
  toast(`Gathered ${nm}`, 'green');
}

// How many of an item the player holds.
function inventoryCount(itemId) {
  return game.inventory.filter(id => id === itemId).length;
}

// Returns the first unmet requirement as a short reason string, or null if craftable.
function craftBlockReason(recipeId) {
  let r = recipeDefs[recipeId];
  if (!r) return 'Unknown recipe';
  if (r.reqLevel && (game.player.lvl || 1) < r.reqLevel) return `Requires level ${r.reqLevel}`;
  if (r.gold && (game.player.gold || 0) < r.gold) return `Needs ${r.gold} gold`;
  for (let mat in r.materials) {
    if (inventoryCount(mat) < r.materials[mat]) {
      let nm = itemDefs[mat] ? itemDefs[mat].name : mat;
      return `Needs ${r.materials[mat]}× ${nm}`;
    }
  }
  return null;
}

function canCraft(recipeId) {
  return craftBlockReason(recipeId) === null;
}

function craftItem(recipeId) {
  if (!canCraft(recipeId)) {
    let reason = craftBlockReason(recipeId);
    if (reason) toast(reason, 'red');
    return;
  }
  let r = recipeDefs[recipeId];
  // Consume materials.
  for (let mat in r.materials) {
    let need = r.materials[mat];
    for (let i = game.inventory.length - 1; i >= 0 && need > 0; i--) {
      if (game.inventory[i] === mat) { removeInventoryItem(i); need--; }
    }
  }
  if (r.gold) game.player.gold -= r.gold;
  addInventoryItem(r.result);
  let nm = itemDefs[r.result] ? itemDefs[r.result].name : r.result;
  toast(`Crafted ${nm}!`, 'gold');
  msg(`You forge a ${nm}!`);
  saveGame();
}
