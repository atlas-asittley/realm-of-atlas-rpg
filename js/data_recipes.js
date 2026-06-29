// data_recipes.js — Forge recipe definitions (data only; logic in crafting.js).
//
// Shape:
//   id: {
//     result:    itemId            — the item produced (itemDefs key)
//     materials: { itemId: count } — consumed from inventory on craft
//     gold:      number?            — gold also consumed (default 0)
//     reqLevel:  number?            — minimum player level to craft (default 1)
//   }
// The result's display name/icon/rarity all come from itemDefs[result].
const recipeDefs = {
  hide_armor:       { result: 'hide_armor',       materials: { monster_hide: 3 }, gold: 20 },
  traveler_boots:   { result: 'traveler_boots',   materials: { monster_hide: 2, feather: 3 }, gold: 30 },
  bone_charm:       { result: 'bone_charm',        materials: { bone_fragment: 4 }, gold: 40 },
  reinforced_blade: { result: 'reinforced_blade',  materials: { iron_ore: 3, monster_hide: 1 }, gold: 60 },
  ember_brand:      { result: 'ember_brand',       materials: { ember_shard: 2, iron_ore: 2 }, gold: 120, reqLevel: 5 },
  frost_edge:       { result: 'frost_edge',        materials: { frost_shard: 2, iron_ore: 2 }, gold: 120, reqLevel: 5 },
  void_cleaver:     { result: 'void_cleaver',      materials: { void_essence: 2, iron_ore: 3 }, gold: 350, reqLevel: 12 },
};
