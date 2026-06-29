# Combat Audit — Findings & Status

Audit performed 2026-06-29 across the combat system (`combat*.js`, `data_skills.js`) and the
trainer (`ui_panels.js`). This tracks confirmed bugs that were fixed and items that are
**balance/intent decisions** left for the project owner — those were intentionally NOT changed,
per `CLAUDE.md` (no balance/rules changes unless the task clearly requires it).

## Fixed (clear logic / UX bugs)

- **Assassinate could be spammed for free.** On a failed cast (enemy HP ≥ threshold) the skill
  released the input lock without giving the enemy a turn, so the player could act again
  immediately at no cost. Now the failed attempt spends the turn (enemy acts), matching every
  other combat action. — `combat_skills.js` (assassinate case).
- **Out-of-combat skills wasted a turn in combat.** `pick_lock`, `peek`, `track`, `forage`, and
  `fly` were listed in the combat skill menu, did nothing when used, and consumed the player's
  turn. They are now flagged `noCombat:true` in `data_skills.js` and filtered out of the combat
  menu in `renderCombatSkills` (`combat_buffs.js`). They remain available on the out-of-combat
  skills screen. (`farsight`/`word_of_recall` were already handled correctly and are unchanged.)
- **`steal` / `forage` bypassed inventory management.** Both used `game.inventory.push(...)`
  directly, skipping `addInventoryItem()` (which assigns the parallel instance id in
  `inventoryIds`). Both now call `addInventoryItem()`. — `combat_skills.js`.
- **`learnSkill` ignored class restriction.** The trainer list filters by class, but the
  `learnSkill()` entry point itself did not, so a restricted skill could be learned via the
  console. Added a guard mirroring the trainer's filter. — `ui_panels.js`.

## Resolved by description correction (no gameplay/balance change)

These were description-vs-behavior mismatches, not logic bugs. The player-facing `desc` strings
in `data_skills.js` were corrected to match what the code actually does; no damage/mechanics
were changed. (The owner can still choose to rebalance later — see "If you'd rather rebalance".)

1. **Multi-hit skills said "ALL enemies" and wrong multipliers.** Combat is strictly 1v1, and
   the code hardcodes per-hit damage (it ignores `effect.mult` for these — note `mult` IS still
   read for `double_strike`, so the field was kept). Corrected:
   - Whirlwind → "A flurry of 4 melee strikes (~0.35× damage each)." (code: 4 × 0.35×)
   - Call Lightning → "Strike with 3 bolts of lightning, scaling with DEX." (code: 3 × ~1.3×DEX)
   - Meteor Swarm → "Rain 2 meteors for heavy INT-based magic damage." (code: 2 × 6×INT)
2. **Dispel Magic** → "Weaken the enemy's attacks by 10% for 4 turns." (code applies a −10% ATK
   debuff; enemies carry no removable positive buffs, so literal buff-removal would be a no-op.)
3. **Slow** → "Slow the enemy, reducing its attack by 20% for 2 turns." (matches the −10%/−20%
   ATK-debuff family, consistent with `ego_whip`.)

### If you'd rather rebalance (gameplay change — not done)
- Make the multi-hit code honor the data `mult` (would raise Whirlwind ~1.4×→2.0× total, etc.).
- Implement real buff-removal for Dispel Magic (needs enemies to actually gain buffs first).
- Give Slow a true action-skip instead of an ATK reduction.

**Decision (2026-06-29):** kept the code's existing (play-tested) damage values and only aligned
the descriptions. Honoring the stale `mult` data would, for example, silently cut Meteor Swarm
from ~12×INT to 3×INT — a large balance swing that shouldn't be made without playtesting. Revisit
deliberately if/when the combat is being rebalanced as a whole.

## Notes / good news from the audit

- Core damage pipeline ordering (bless → power strike → slow → resist → shield → divine shield)
  is correct; no double-apply or skipped modifiers found.
- Level-up XP overflow loop handles multiple level-ups per kill correctly.
- Multi-hit callback chains and `initCombatScreen()` state reset are sound.
- Buff/debuff turn counting and expiration are correct.
