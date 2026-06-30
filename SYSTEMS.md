# Gameplay Systems

Reference for the data-driven gameplay systems and how to extend them. Each system follows the
same shape: a `data_*.js` definitions file (content), a logic module, and (where it has a screen)
a UI module + an overlay in `index.html` + an entry in `initClickOutsideHandlers` (ui_hud.js).

All persistent state lives under `game.flags` or `game.player`, both of which `buildSaveState`
already serializes — so new fields are save-safe automatically. Guard reads against `undefined`
(`game.flags.X || {}`) so old saves don't break; no migration is usually needed.

---

## Quests — `data_quests.js`, `quests.js`, `ui_quests.js`
Objective types: `slay` (enemy typeKey), `collect` (item id), `defeat_boss` (enemy typeKey →
`boss_<key>_dead` flag), `level` (player level), `talk` (`npc` = NPC name), `reach` (`map` = map id,
optional `mapName` label). State: `game.flags.quests[id]` =
`{status:'active'|'done', slayBase, satisfied, _notified}`; lifetime kills in `game.flags.killCounts`.
`talk`/`reach` are binary objectives recorded into `state.satisfied[objIdx]` by `recordNpcTalk`
(called from `interactNPC`) and `recordReach` (called from the map-transition helpers in gameplay.js:
`enterLocation`/`enterWorldMapAt`/`enterNewArea`/`enterDungeon`/`enterTrainingGrounds`); only events
*after* the quest is accepted count.
Story quests set `story:true` (sort to top, STORY badge) and can chain via `requires`/`next`;
the finale uses `onTurnIn:'showEnding'`. Rewards: `{gold, xp, items:[], rep:{factionId:n}}`.

**Add a quest:** one entry in `questDefs`. Attach to an NPC with `questGiver:'<id>'` (or it shows
on the Bounty Board automatically once prereqs are met).

## Main story — `data_quests.js` (`msq_*`)
A linear chain (`msq_call` → heralds → `msq_finale`) given by **The Seer** in town. Finale's
`onTurnIn` calls `showEnding()` (the victory screen). Reuses existing world bosses via
`defeat_boss`. Sets `game.flags.gameWon`.

## Elemental Trials — `data_trials.js`, `trials.js`
Scored wave-gauntlets from **Trialmaster Vorn**. Every wave deals the trial's `element`, so
resistance gear matters. Reuses combat via the `isTrial` mode flag (mirrors `isSparring`):
- `startTrial` → `startTrialWave` builds the wave enemy (index -1, sets `isTrial`).
- `combatWin`'s trial branch awards the wave and advances `game.trial.wave` (or sets `finished`).
- `leaveCombatScreen` chains the next wave or calls `finishTrial`.
- `playerDeath`/`combatRun` end the run gracefully (no corpse).
Best wave per trial: `game.flags.trialBest`. `game.trial` is transient (a reload abandons a run).

**Add a trial:** one entry in `trialDefs` (`element`, `enemies[]`, `boss`, `waves`, rewards).

## Crafting — `data_recipes.js`, `crafting.js`, `ui_crafting.js`
Enemies drop materials via `rollMaterialDrop` (in `onEnemyDefeated`), themed by the enemy's
`damageType` (ember/frost/void) else generic (iron/hide/bone). **Blacksmith Borin** opens the
Forge. `craftItem` consumes `materials` + `gold` and grants `result`. `reqLevel` gates recipes.

**Add a recipe:** add the result item to `itemDefs` (no `classRestriction` = any class), then a
`recipeDefs` entry `{result, materials:{id:n}, gold, reqLevel}`.

## Companions — `data_companions.js`, `companions.js`
**Guildmaster Dunn** hires one active ally (`game.player.companion`; owned set in
`game.flags.recruitedCompanions`). The active companion acts every round in `tickBuffs`
(combat_buffs.js), modelled on the summon/animal-companion pattern — deals `companionRoundAmount`
damage or heals, and can land the kill (`combatWin(); return true`).

**Add a companion:** one entry in `companionDefs` (`role:'damage'|'healer'`, `base`, `scale`,
`cost`, `reqLevel`).

## Faction reputation — `data_factions.js`, `factions.js`
Slaying a faction's `foes` grants `REP_PER_KILL` (`awardFactionRepForKill` in `onEnemyDefeated`);
quests grant via `rewards.rep`. Ranks (`FACTION_RANKS`) give up to a 10% shop discount
(`getDiscountedPrice` reads `activeShopFaction`, set in `interactNPC`) and a standing-aware
greeting. State: `game.flags.reputation`. FACTIONS HUD button → Reputation screen.

**Add a faction:** one entry in `factionDefs` (`foes[]`, `shopFlags[]`).

## Special encounters — `encounters_special.js`
`eliteUpgrade(enemy)` promotes ~6% of spawned non-boss enemies to golden elites (tougher, bonus
XP, guaranteed loot) — applied at the area/dungeon/training spawn sites. `rollRoadsideEvent`
(world-map movement) fires a treasure cache, a restorative wayshrine (rare +1 stat), or an elite
ambush.

## New Game+ — `newgameplus.js`
Unlocked once `game.flags.gameWon` is set (campaign finale). `startNewGamePlus()` (offered on the
victory screen and the HUD menu, gated by `requestNewGamePlus`) bumps `game.flags.ngPlus`, resets the
replayable world (`quests`, `killCounts`, `talkedTo`, all `boss_*_dead` flags, opened chests) and
repaints the world-boss marker tiles (`restoreWorldBossMarkers`), then drops the (fully intact)
character back in town. **Character carries over** — level, stats, skills, gear, gold, companions,
reputation; only world progress resets.

`applyNgPlusScaling(enemy)` multiplies a fight's stats by the NG+ tier (hp ×(1+0.6·t), atk ×(1+0.35·t),
def ×(1+0.3·t), xp/gold ×(1+0.5·t)). It is called on the **`combatEnemy` copy in `startCombat`** only,
so map instances/`enemyTypes` stay pristine and trials/sparring (which never call `startCombat`) are
unscaled. **Tier 0 is a no-op** — a first playthrough is exactly the tuned base game.

---

## Combat integration notes
- **Mode flags** `isSparring` / `isWorldMapEncounter` / `isTrial` (combat.js) branch in
  `combatWin` / `playerDeath` / `combatRun`. Every combat-entry point (`startCombat`,
  `startSparring`, `startTrialWave`) resets the others — keep that symmetric or state leaks.
- **`onEnemyDefeated(enemy)`** (combat.js) is the single home for post-kill hooks (quests,
  materials, faction rep). Add new "on kill" effects there, not inline in `combatWin`.
- See `COMBAT_ARCHITECTURE.md` for the full combat design and known pain points, and
  `COMBAT_BUGS.md` for the audit + decisions.
