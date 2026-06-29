// trials.js — Elemental Trial gauntlet: controller + selection UI.
// A Trial is a scored sequence of escalating, single-element waves fought back-to-back.
// It reuses the combat engine via an `isTrial` mode (declared in combat.js, mirroring
// `isSparring`): combatWin awards the wave and advances; leaveCombatScreen chains to the
// next wave; playerDeath/combatRun end the run. Best wave reached is saved per trial.
//
// Transient run state lives on `game.trial` (NOT persisted — a reload abandons the run):
//   { id, name, element, wave, totalWaves, rewardXp, rewardGold, active, finished }
// Persistent best-wave records live in game.flags.trialBest = { trialId: bestWave }.
//
// Depends on: data_trials.js (trialDefs), data_enemies.js (enemyTypes), combat.js
//             (combatEnemy, combatEnemyIndex, isTrial, initCombatScreen), gameplay.js (msg/toast),
//             combat.js (applyLevelUp), ui_hud.js (saveGame).

function openTrials() {
  document.getElementById('trial-screen').style.display = 'flex';
  let container = document.getElementById('trial-list');
  container.innerHTML = '';
  let best = (game.flags && game.flags.trialBest) || {};
  for (let id in trialDefs) {
    let t = trialDefs[id];
    let info = DAMAGE_TYPE_INFO[t.element] || {};
    let bestWave = best[id] || 0;
    let bestLabel = bestWave >= t.waves ? 'CONQUERED' : bestWave > 0 ? `Best: wave ${bestWave}/${t.waves}` : 'Not attempted';
    let div = document.createElement('div');
    div.className = 'sparring-opp';
    div.innerHTML = `<div class="sparring-opp-header"><span class="sparring-opp-name">${t.name}</span><span class="sparring-badge" style="color:${info.color || '#ccc'}">${info.icon || ''} ${t.element.toUpperCase()}</span></div>`
      + `<div class="sparring-opp-stats">${t.waves} waves &nbsp;·&nbsp; all enemies deal ${t.element} damage</div>`
      + `<div class="sparring-opp-reward">${t.desc}</div>`
      + `<div class="sparring-opp-reward">${bestLabel}</div>`;
    div.onclick = () => { closeTrials(); startTrial(id); };
    container.appendChild(div);
  }
}

function closeTrials() { document.getElementById('trial-screen').style.display = 'none'; }

function startTrial(id) {
  let def = trialDefs[id];
  if (!def) return;
  game.trial = {
    id, name: def.name, element: def.element, wave: 1, totalWaves: def.waves,
    rewardXp: def.rewardXp, rewardGold: def.rewardGold, active: true, finished: false,
  };
  toast(`${def.name} begins!`, 'gold');
  startTrialWave();
}

// Builds the current wave's enemy from the trial definition and enters combat in trial mode.
function startTrialWave() {
  let t = game.trial;
  let def = trialDefs[t.id];
  let isLast = t.wave >= def.waves;
  let key = isLast ? def.boss : def.enemies[(t.wave - 1) % def.enemies.length];
  let base = enemyTypes[key] || enemyTypes.slime;
  let scale = 1 + 0.2 * (t.wave - 1);
  combatEnemy = {
    ...base,
    typeKey: key,
    name: `${base.name}${isLast ? ' (Champion)' : ''} — Wave ${t.wave}`,
    hp: Math.round(base.hp * scale), maxHp: Math.round(base.hp * scale),
    atk: Math.round(base.atk * scale), def: base.def,
    xp: 0, gold: [0, 0],                 // rewards come from the trial, not the enemy
    damageType: def.element,             // every wave deals the trial's element
    isBoss: false, isElite: false, drops: undefined, dropChance: 0,
  };
  combatEnemyIndex = -1;
  isTrial = true;
  initCombatScreen();
}

// Called from combatWin's trial branch is not used — combatWin handles the reward inline
// (so combat.js stays decoupled from trialDefs). finishTrial / playerDeath end the run.

function finishTrial() {
  isTrial = false;
  let t = game.trial;
  if (!t) return;
  let bonusXp = t.rewardXp * t.totalWaves * 2;
  let bonusGold = t.rewardGold * t.totalWaves * 2;
  game.player.xp += bonusXp;
  game.player.gold += bonusGold;
  while (game.player.xp >= game.player.xpNext) {
    game.player.xp -= game.player.xpNext;
    applyLevelUp();
    toast(`LEVEL UP! Now level ${game.player.lvl}!`, 'green');
  }
  toast(`${t.name} CONQUERED! +${bonusXp} XP +${bonusGold}g`, 'gold');
  msg(`You conquered the ${t.name}! Completion bonus: +${bonusXp} XP and ${bonusGold} gold.`);
  game.trial = null;
  saveGame();
}
