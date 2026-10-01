# Modern controls

Modern is not a second copy of the game data. It is another way to view the same moves (action IDs) and the same combo database. What changes is which combos are legal, and the notation and damage shown for them.

## Data

| Where | What |
| --- | --- |
| `sf6.move.available_on_modern` | Game rule: the move can be selected directly on Modern. Starts `TRUE` for every move; moderators clear it for moves Modern loses. |
| `sf6.move.modern_max_notation` | Modern input that deals full damage (the traditional motion). Nullable. |
| `sf6.move.modern_simple_notation` | Modern simple input (e.g. SP + direction). Nullable. |
| `sf6.move.modern_simple_damage_percent` | Share of the move's damage dealt when it is done with the simple input (e.g. `80`); `NULL` means no penalty. |
| `sf6.character_modern_auto_combo` | character + `light`/`medium`/`heavy` → an ordinary combo that spells out that auto combo. |
| `sf6.combo_sequence.modern_legal` | Stored result of the legality validator. |
| `sf6.combo_metrics.damage` / `modern_max_damage` / `modern_simple_damage` | Classic, Modern max and Modern simple damage. Modern values are `NULL` when the combo is not Modern legal. |
| `forum.user_scenario_preference.combo_execution_mode` | Profile default: `classic`, `modern_max` or `modern_simple`. |

Notation fields are presentation only. Availability is never inferred from them.

## Rules

- **Legality** (`ModernComboLegalityValidator`): every move must be available on Modern, or be reachable through an auto combo. That means the move is at position *k* of one of the character's auto combos, and the *k* moves right before it in the combo are that auto combo's first *k* moves. No character-specific rules live in code.
- **Execution** (`ModernMoveExecutionResolver`): one choice per move and mode feeds both notation and damage, so the shown notation and the shown damage always match.
  - Classic uses the numpad notation.
  - Modern max prefers the motion notation, otherwise the simple notation, otherwise the Classic notation.
  - Modern simple prefers the simple notation, otherwise the motion notation, otherwise the Classic notation.
- **Damage** (`ComboExecutionProfileService`): the known damage (observed in a replay, or entered in some mode) is authoritative. The other modes follow from it by the damage estimator's difference between modes, where simple-input moves lose their `modern_simple_damage_percent`.
- **Parser**: combo input accepts Classic, Modern max and Modern simple notation mixed together. If a Modern input is spelled like another move's notation, it is rejected (`ambiguous_move`) rather than guessed.

## Keeping stored values current

Create/edit/import recomputes a combo's legality and damages. Editing Modern move data or auto combos in Frame Data Moderation revalidates that character's combos. After any other change (SQL, imports of move data), run:

```bash
php bin/console app:combo:revalidate-modern [--character-id=<uuid>]
```

## Replays

- Combos from Classic and Modern replays go into the same combo collection.
- Neutral stats are partitioned by the actor's `replay_player.control_scheme`; `NULL` counts as Classic.
- The replay exports do not carry `control_scheme` yet, and they do not flag simple-input execution. See `Sf6ReplaysDb/FGCNOTEPAD_MODERN_SUPPORT_PROMPT.md`. Until then, observed combo damage is treated as motion (full) damage.

## Out of scope for now

- **Oki**: stays manual. Create separate Classic and Modern setups if needed.
- **Nash / scenario / blockstring matrices**: unchanged. Proper support would need scheme-specific row/column availability, and possibly scheme-specific payoffs. For example, if Modern Ken lacks the 5-frame normal Classic Ken punishes with, the value of the opponent's option changes. This is a known future extension.
- **Replay Lab**: not affected.
