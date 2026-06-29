// ui_crafting.js — Forge screen: lists recipes with owned/needed materials and a Craft button.
// Depends on: crafting.js (canCraft, craftItem, inventoryCount, craftBlockReason),
//             data_recipes.js (recipeDefs), data_items.js (itemDefs), ui_panels.js (rarityInfo).
// Panel HTML (#forge-screen) is in index.html; styling reuses shop/quest classes + style.css.

function openForge() {
  document.getElementById('forge-screen').style.display = 'flex';
  renderForge();
}

function closeForge() {
  document.getElementById('forge-screen').style.display = 'none';
}

function renderForge() {
  let list = document.getElementById('forge-list');
  let goldEl = document.getElementById('forge-gold-val');
  if (goldEl) goldEl.textContent = game.player.gold;
  let html = '';
  for (let id in recipeDefs) {
    let r = recipeDefs[id];
    let res = itemDefs[r.result] || {};
    let info = (typeof rarityInfo === 'function') ? rarityInfo(r.result) : { color: res.color || '#ccc', label: res.rarity || '' };
    let craftable = canCraft(id);

    let mats = Object.keys(r.materials).map(mat => {
      let need = r.materials[mat];
      let have = inventoryCount(mat);
      let nm = itemDefs[mat] ? itemDefs[mat].name : mat;
      return `<span class="forge-mat ${have >= need ? 'forge-mat-ok' : 'forge-mat-missing'}">${itemDefs[mat] ? itemDefs[mat].icon : ''} ${nm} ${have}/${need}</span>`;
    });
    if (r.gold) mats.push(`<span class="forge-mat ${ (game.player.gold||0) >= r.gold ? 'forge-mat-ok' : 'forge-mat-missing'}">${r.gold}g</span>`);

    let reason = craftBlockReason(id);
    let btn = `<button class="btn forge-btn${craftable ? '' : ' trainer-btn-disabled'}"${craftable ? '' : ' disabled'}`
            + ` title="${reason || ''}" onclick="craftItem('${id}');renderForge()">FORGE</button>`;
    let statText = (typeof itemStatText === 'function') ? itemStatText(res) : '';

    html += `<div class="forge-recipe">
      <div class="forge-recipe-head">
        <span class="forge-recipe-name" style="color:${info.color}">${res.icon || ''} ${res.name || r.result}</span>
        ${btn}
      </div>
      <div class="forge-recipe-stat">${statText} <span style="color:${info.color}">[${info.label || res.rarity || ''}]</span></div>
      <div class="forge-recipe-mats">${mats.join(' ')}</div>
    </div>`;
  }
  list.innerHTML = html;
}
