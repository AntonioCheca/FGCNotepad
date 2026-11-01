# Deep dive at Juri vs Ken stats across ranks: outline

> 2026-11-01: the article moved from a skeleton to drafted paragraphs, from the author's refinement. Only three chapters stay as headings, `lost-rounds` is cut, and the delay tech, kill and neutral 5HP items are pending a recheck. Sentences and numbers now trace through `docs/research/juri-vs-ken-stats-across-ranks-sources.md`; section numbers below are internal only.

Status: skeleton written to `frontend/content/research/juri-vs-ken-stats-across-ranks.md`, for the author to fill in. Rechecked on 2026-10-31 against the rebuilt scenarios, M35 and M36; every number below was rechecked against the current files, and all rerun figures were looked at again.

**Approach:** an exploratory report, not a single thesis. A readable collection of carefully chosen findings, grouped into three chapters that each ask their own question. It ends on observations and open questions, not one conclusion. It makes no claim about what causes someone to be better. Surprises and answers that aren't neat stay in.

**Progression:** what players do, then what opportunities they take, then what they decide when both players have several real options. 3 chapters, 12 numbered sections plus the intro's setup, 10 figures.

In the article, chapters are `##` headings and sections are `###`.

## Decisions

All answered on 2026-10-30. Numbers kept so the references below stay valid.

1. **Oki scenarios: re-imported locally.** X12 and X13 are closed. Open: combo bundle (X14) and approving all 8 scenarios again. Recheck section 10 after the bundle.
2. **Delay tech by rank (X3): closed.** The rerun landed on 10-30.
3. **Oki chart: built as a grouped bar chart.** `oki-options-by-rank.png`, drawn by `docs/research/figures/oki_options_by_rank.py` from the report and defense tables. Observed shares only, so the rebuild does not change it, but rerun it after the rebuild and compare.
4. **RED items: done.** C09 is now M36 and feeds section 9. C08 stays chat-only and unused. The author wrote "C10 we can skip" in the same message that asked to rebuild the 4HK data, which is C10, so that was read as C08.
5. **4HK: done, now section 11.** C10 is now M35. The rebuild changed the story: see section 11.
6. **Title and metadata.** Title "Deep dive at Juri vs Ken stats across ranks", slug `juri-vs-ken-stats-across-ranks`. No `data` block: the byline's date is enough. The `juri-ken-combo-optimization` draft stays for a later piece.

Closed since the first version: Modern controls (rerun done) and M01 (no longer stale, now section 1).

## Sections

### 0. What are we looking at?
- Answer: sets the sample and the three chapter questions.
- Figure: none.
- IDs: Part 0, M34, M33 (one line only).
- Covers: 872 recorded matches, 798 on Classic controls on both sides, 1,953 rounds, 220 Juri and 257 Ken players. The five rank bands. MR in plain words. Why Modern is out, in one line: Iron-Silver 37 of 137 player-matches (27%), Gold-Diamond 12%, Master 3%, H/GM 1 of 212, UM+ 2 of 834. Juri won 337 of 663 at about equal MR (50.5%), so the matchup looks even.
- Caveats: X5 (only this matchup). X11: UM+ is about half the rounds, and Iron-Silver is 14 players per character, so it gets quoted with its sample every time.
- Author: **[AUTHOR: why Juri vs Ken? Who are you as a player here?]**

## Chapter 1: Do higher-ranked players really play differently? (sections 1-4)

### 1. Do better players land more combos?
- Answer: no. The count stays flat across ranks and each combo gets bigger.
- Figure: `combo_volume_by_result_juri` (A). Look at the right panel: the blue and orange dots sit almost on top of each other, and both drift right as you go down the chart.
- IDs: M01.
- Text: combos per match stay about 4.4-5.6 for Juri and 4.3-5.0 for Ken. Mean combo damage climbs from 1,647 to 2,116 and from 1,719 to 2,139. Winners land about 6.3 combos a match against 3.9 and 3.6 for losers, but that is close to true by definition, so it gets one sentence. The real point is that winning combos are only about 80-90 damage bigger.
- Caveats: Iron-Silver's won/lost split is 15-19 matches per side and not meaningful. Damage excludes combos cut short by a KO.
- Author: **[AUTHOR: is "same number of combos, bigger combos" what you'd have guessed?]**

### 2. Do better players actually jump less?
- Answer: yes. In these replays the extreme jumpers are gone from H/GM up.
- Figure: `jumps_per_player` (A). Look at the top of each column: from H/GM up nobody passes 6.7 jumps per round, while Master still has players at 11 and 12.
- IDs: M19, M18 (text).
- Text: Ken players at 8+ jumps per round: 7 of 45 below Master, none from H/GM up. Dive kicks drop from 1.70 to 0.18 per round.
- Added after the outline: `dive-kicks` from `neutral_choices/tables/dive_kick.csv` (M18), at the author's request. Rates are of neutral kicks; the per-round line counts all kicks.
- Caveats: X11. Players need only 3+ rounds, so the highest dots may be short samples. Dive kick net per use is left out of the claim: Iron-Silver's interval runs from -230 to +221.
- Author: **[AUTHOR: you expected more than 5 jumps per round. Why?]**

### 3. When someone does jump, who stops them?
- Answer: anti-airs jump at the very top, and the tool changes.
- Figure: `anti_air_moves` (A-). Look at the blue 623LP bars for Ken: 36 / 43 / 52 / 67% from Gold-Diamond up. Juri's 623MP goes from 9-19% to 47% at UM+. Ignore Juri's Iron-Silver row: it is 5 anti-airs. Added after the outline: `juri-2mp-hitbox`, the author's own drawing, recoloured for the dark page, beside Juri's 2MP numbers from `anti_air_moves.csv` (1, 3, 11, 6, 18 anti-airs).
- IDs: M21, M22 (text), M34.
- Added after the outline: `jump-in-overview` from `jump_ins/tables/jump_in_summary.csv` (M20), at the author's request. Shares of all jump-ins by the jumper's rank, so its 23-24% anti-aired is a different measure from the answerable-jump rates below.
- Text: answerable jumps anti-aired: Juri 3 / 12 / 21 / 20 / 43% (118 jumps at Iron-Silver). Ken 22 / 12 / 16 / 25 / 34%, which is not a straight climb. Anti-air DPs hit 84-100% from Master up. Modern gets one sentence here: classic Iron-Silver Juri used 3 DPs in 81 rounds and none as anti-airs, so the "low ranks throw out H DP" habit was largely the one-button DP.
- Caveats: X11, directly.
- Author: **[AUTHOR: why light DP at the top? Is Juri's 623MP the same reason?]**

### 3b. Do better players use Drive Impact and Drive Rush differently?
- Added after the outline, at the author's request. Answer: Drive Impacts fall about 6 times for Juri and 15 for Ken; raw rushes from neutral stay rare, and the rank trend is in rushes outside neutral.
- Figure: `drive-impact-share` (A, M39, Neutral Drive Impact share), neutral Drive Impacts as a share of neutral choices. Look at Ken at H/GM, 0.54% against Juri's 1.6%. The per-round numbers stay in a table, because `drive_usage` is a working figure on a white background.
- IDs: M39. Replaces the raw Drive Rush share of neutral moves bullet in section 4, which only saw rushes ending in a button.
- Caveats: Iron-Silver is 14 players per character. The neutral rule is narrow on purpose.
- Author: **[AUTHOR: why do Drive Impacts fade so early? What do players learn that stops them?]**

### 4. What do lower ranks press more, or less, than top players?
- Answer: Juri's 214LK is the clearest case, and the drop-off comes late.
- Figure: `neutral_moves_juri` (A). Look at the 214LK panel: 19 / 17 / 16%, then 8% and 5%.
- IDs: M17.
- Text: state the baseline. In the 1.5 seconds after a neutral 214LK, Juri deals 120-190 less damage than she takes, on average, at every rank, UM+ included. That is measured against break-even, not against a better move. For comparison, her other neutral moves average +130 / +78 / +132 / +83 / +40. Most uses, 81-89%, lead to nothing either way. Top players don't get a better result from it, they use it less. Juri's 2MK rises from 5% (14 uses) to 20%. One sentence on Ken: 5LK steps from about 3% to 11-13% at H/GM. One sentence on raw Drive Rush, a real gap that survived removing Modern: Juri 4 of 264 neutral moves at Iron-Silver, then 12 / 12 / 10 / 8%. Ken 2 of 402, then 4 / 6 / 7 / 5%.
- Added after the outline: `neutral-moves-ken` from `neutral_choices/tables/neutral_moves.csv` (M17), at the author's request. Its numbers and the 2HK and 5HP lines for Juri come from the same table.
- Caveats: X11. Drive Rush into throw is not counted. The strict neutral filter (C12) gets one plain sentence. Ken's "over-used" moves (2HK, 236PP) zigzag by band, so the text says so and draws nothing from them. Top-player usage is a reference, not proof a move is good. X7: this counts damage only, so whatever the stock from 214LK is worth is not in the number.
- Author: **[AUTHOR: what is 214LK doing for low-rank players, and why does it survive until Master?]**

## Chapter 2: How much damage are players actually leaving on the table? (sections 5-8)

Repetition is the main risk here, since all four sections measure unrealized damage. No section is cut yet, but each must keep its own takeaway:
- Section 5, why: top players react in time and pick a button that doesn't reach.
- Section 6, how much: the upper bound on missed punish damage falls sharply between Gold-Diamond and Master, mostly because misses get rarer.
- Section 7, who: combos leave far less at the top, and Ken leaves more than Juri at every rank.
- Section 8, so what: little of it actually decides rounds.

Sections 5 and 6 are closest. If they read as one idea in the draft, fold section 6 into section 5 as a closing paragraph with its figure.

### 5. Better players block more. Do they punish more?
- Answer: yes at the ends, but the top still misses a lot, and not because of reactions.
- Figures: `outcome_mix` (A). Look at the orange Blocked segment, 26% to 46%. Then `punish-focus` (A), redrawn as spacing dots at -4 to -6, UM+ only. Now two panels, on a reach per button and blocked move (`punish_limits.csv`, 11-01): punish button (Punished 65, Whiffed 46; the split is by construction), in reach (one Not punished curve, 109: 42 didn't attempt, 34 late, 33 wrong button, in the text only). 12 of the 109 are on the edge (`punish_spacing.csv`), 55 on Juri 214MK, 39 within 0.04 of the line, where 11 of 50 are punished against 54 of 124 further in (M24). Past the reach is text only: 1,454 blocks, a button came out on 746, nothing in time on 708. The author cut the press-rate panel and `too-far-presses` on 11-01, as noise; their numbers stay in M24. The -7 to -19 numbers below no longer have a chart and stay as text.
- IDs: M23, M24.
- Text: of 54 UM+ blocks in reach (`miss_classes.csv`), 33 were punished, 14 wrong button, 3 late, 4 didn't attempt. At Iron-Silver, 21 of 66 in reach didn't attempt. Reaction is fine at the top; button choice isn't.
- Caveats: punish rate at -7 to -19 goes 37 / 46 / 30 / 36 / 55%, with only 27 and 22 cases at Master and H/GM, so this is not a smooth climb. Explain "-7" as frame disadvantage. The 0.1 edge margin is an estimate.
- Author: **[AUTHOR: is Ken's 2MK or 2HP after Juri's 2HK a habit you recognise?]**

### 6. What does a missed punish cost?
- Answer: at most 186-1,608 per round, depending on rank. The sharpest fall is between Gold-Diamond and Master, and it is not simply better punishing.
- Figure: `damage_lost`, **right panel only** (A, cropped). Look at the fall from 1,009 to 381 per round, labelled as an upper bound.
- IDs: M25.
- Text: from Gold-Diamond to Master, misses per round fall from 0.23 to 0.10 and each miss is worth a bit less (4,298 vs 3,817), so most of the drop is fewer misses. That can mean better punishing or fewer chances, and the data leans to fewer chances: at -7 to -19, Master's punish rate is no higher (46% of 101 at Gold-Diamond, 30% of 27 at Master, section 5). At UM+ edge spacing adds only 20 per round on top of the 186 from real misses.
- Caveats: say "upper bound" in the sentence with the number: it allows any Drive and Super, is not capped by remaining life, and uses the best route seen in these replays. Do not present the fall as an improvement in punish skill. The punish-rate comparison covers one block range and thin Master cases, so it is suggestive only. X6. "Per round" means per player. Compare bands, never the 1.45M total.
- Author: **[AUTHOR: does the Master cliff match how the rank feels?]**

### 7. How much damage do combos leave behind?
- Answer: two to three times less at the top, and Ken leaves more than Juri at every rank.
- Figure: `damage_left`, **top row with legend** (A-, cropped). Look at the shrinking bars: Juri 1,145 to 357, Ken 1,442 to 577, with a Ken peak of 1,552 at Gold-Diamond.
- IDs: M13, M14 (text).
- Text: "left" means compared with the best route seen in these replays for the same situation. Suspected drops per 100 rounds fall from 42 to 11 for Juri and 42 to 15 for Ken. These are suspected, not confirmed.
- Caveats: X6 (best seen, not theoretical; corner not modelled). X7 (damage is not value: less damage can be right for better oki). X11: Iron-Silver's interval for Juri runs from 593 to 1,843, and the chart shows it.
- Author: **[AUTHOR: why does Ken leave about 1.6x Juri at the top? Execution, or routes worth skipping?]**

### 8. Does any of that actually lose rounds?
- Answer: rarely, and less than you would expect.
- Figure: `missed_kill_rounds`, **lower row, redrawn with Juri/Ken labels** (B). Look at the blue and grey bars side by side: rounds with a flagged miss are lost about 1 time in 6 overall, other rounds about half the time.
- IDs: M12, M13 (derived).
- Added after the outline: `kills-taken` from `kill_reasons/tables/by_rank.csv` (M11), at the author's request, before the rounds figure. Scored chances only, a candidate rate, not a fault rate. 211 of 269 misses are unlabelled (`overall.csv`, which includes 8 Ken chances of unknown rank).
- Text: having a kill to miss means you were winning, which is probably why the first bar is so low. Rounds thrown: one in 12 at Iron-Silver (7 rounds), then 35 / 25 / 65, and one in 86 at UM+ (12 rounds). Rounds the left-over damage could have flipped: one in 6 (13 rounds) and one in 20 (51 rounds).
- Caveats: flagged, not confirmed: 211 cases are unlabelled. Juri at Iron-Silver is 4 lost of 10, so "1 in 6" is the overall rate only. One in 12 doubled from one in 23 with the same 7 rounds, so it gets no weight. Sample counts appear in the sentence, not a footnote.
- Author: **[AUTHOR: does one in 86 feel right for UM?]**

## Chapter 3: How does the wake-up guessing game evolve, and how close do top players get to the model? (sections 9-11)

Keep this order: observed behaviour, then the mathematical prediction, then the interesting disagreement between them. Explain "equilibrium" in plain words the first time it appears.

### 9. How do oki choices change across ranks?
- Answer: each step of the guessing game arrives at a different rank.
- Figure: `oki-options-by-rank.png`, new grouped bar chart (decision 3). Juri's 214MK midscreen. Defender's band, cases 39 / 118 / 148 / 111 / 579: block 23 / 34 / 40 / 41 / 46%, wake-up throw 18 / 4 / 0 / 1 / 3%, delay tech 5 / 2 / 4 / 14 / 17%. Attacker's band, cases 38 / 119 / 149 / 108 / 581: shimmy 3 / 7 / 21 / 26 / 19%. Checked after the rebuild: the report table gives the same values and the regenerated figure is identical.
- IDs: M28, M36, M27 and M30 (one sentence each).
- Text: plain definitions of oki, meaty, shimmy, delay tech and wake-up throw. Shimmy jumps at Master; delay tech jumps one band later. Payoff: shimmy met delay tech 50 times in two different places: 33 on the wake-up itself, out of 6,156 wake-ups (0.5%), and 17 in the next exchange after a blocked meaty, out of 1,637 such exchanges (1.0%). So the two rarely meet. Over those 50, the offense wins 38 (76%; 22 of 33 and 16 of 17) for a median of 2,440, and the defender wins only 2. Of the 12 the offense did not win, 10 were its own miss. Two minor findings close the section, in two or three sentences at most, with no attempt to explain them: at UM+ we detected no meaningful link between delay tech and the MR gap to the opponent (12-16% across gaps, same player +0.5 points, range -6 to +7, 49 players), and UM+ delay tech falls from 12-13% over a match's first five wake-ups to 2.8% from the 11th on.
- Caveats: this is not a clean ladder: meaty 5MP goes 18 / 8 / 12 / 11 / 25%, so it stays out of the chart and gets a sentence. Iron-Silver is 39 cases, so 18% means 7 cases. Each side is grouped by its own rank, so sample sizes differ slightly between the two sides, and the chart note says so. M36 is pooled across ranks: nothing below UM+ can carry a percentage, cases in one match are not independent, and it says nothing about how the win rate changes with rank. The MR result is "not detected": a real 3-4 point effect would not show up. The late-match figure is 213 wake-ups from 75 players, and it means late in the match, not late in a round.
- Author: **[AUTHOR: why would shimmy arrive before the delay tech it beats?]** and **[AUTHOR: you expected Master to be far higher than UM. What had you assumed?]**

### 10. What does the mathematical model predict?
- Answer: under its payoffs, shimmy about twice as often and no delay tech. Real UMs do neither.
- Figure: none. A small Markdown table for the six top-level okis: shimmy seen 17-32% vs solved 40-44%, delay tech seen 15-18% vs solved 0%.
- IDs: M29.
- Text: what the model is in plain words: the best mix under one specific set of payoffs, with named variables missing. Then the table. Use the raw damage solve throughout: it answers "what earns the most damage". The site's page also counts meter, so its shares differ (shimmy 34-47%).
- Caveats: seen shares here are out of the options in the model, so UM+ shimmy reads 24% here and 19% in section 9, and the table's note says so. Do not quote midscreen's Block 0% and Delayed button 64%: the two are almost equal against what Juri plays, so read it as "hold block". Ken midscreen throw is the outlier (17% vs 56%). Solved means the best mix under these assumptions, not what a perfect player would do, and not advice. Not modelled: move ranges, the value of a Fuha stock, button reach.
- Author: **[AUTHOR: your own view of the gap between solved and real play]**

### 11. Why do UMs favor a move the model rejects?
- Answer: meaty 4HK earns well against these Kens, while the model gives it 0%.
- Figure: none. A small Markdown table from `cells_vs_observed.csv`: for each of Ken's answers, what the model prices 4HK at and what it really earned, with n.
- IDs: M35.
- Text: at UM+, 4HK earns +594 per use (n=62) against +252 for 5MP (n=148), and the solver plays it 0%. It lands late: median frame 6 against 0. Against delay tech it hit 5 of 16 for about 3,050, and 5MP hit 1 of 30. Why the solver refuses: Ken blocks half the time, and a blocked 4HK is worth -376 against +635 for 5MP. It would need about +399 when blocked, and real play was -200. Why it still earns: Kens answer it badly, +2,304 per delayed button above its price and +720 per delay tech.
- Caveats: the 5MP and delay tech hit counts are small. The delayed button's 7 of 7 cannot be quoted as a win rate: a button that starts after contact reads as a block, so it cannot lose in the data. The -200 is 31 cases, with a range of -513 to +61, so -376 is inside it. 4HK hit rate is 34% vs 14% counting Juri's hits only, not the 42% vs 24% from chat. The Fuha stock is not priced, so the row may be a little underpriced. Below UM+ it is 21 uses in total, so no rank story.
- Change from Part 4: "the Discord beat the model" overclaims, and so did the earlier draft of this line. The model now prices the timing and Ken's delayed buttons, and still says 0%. Both can be true: the model answers what is best against an opponent who responds optimally under its payoffs, and the replays show what worked against these Kens. Neither is a verdict on the move.
- Author: **[AUTHOR: how the Juri community framed 4HK]** and **[AUTHOR: how much is the free stock from 4HK > 214LK worth to you?]** and **[AUTHOR: does the 4HK > 214LK cancel square with section 4's point that neutral 214LK runs negative?]**

## Closing

### 12. What we saw, and what we don't know
- Answer: several observations and open questions, not one conclusion.
- Figure: none.
- IDs: Part 2 gaps, X1-X14.
- Text: a short recap of what stood out in each chapter. Then unanswered questions (going into burnout on purpose, side-switches, sweeps, Drive economy) and limits in plain words.
- Author: **[AUTHOR: closing thought, and what you'd want a reader to practise]**

If this is too long, sections 3, 4 and 6 are the first to cut.

## Left out, and why

- **MR win-rate curve (M33):** five curves in one chart, it doesn't move the story, and it mixes in other characters (see below). One line in section 0 replaces it.
- **2MK conversion by rank (M03):** Ken's gap is still large (39% to 84%) but rests on 18 cases, and Juri's nearly closed once Modern left. Its figure needs a redraw and adds a second idea to section 1.
- **Rest of conversion (M02, M04-M07):** graded B or C, or methods material.
- **Burnout stuns (M16):** good story but only 1-8 cases per band.
- **Habits and reading opponents (M30, M31, M32):** cut by the author as too complex for a first report, including `learning_curves`. Only M30's late-match delay tech survives, as a sentence in section 9. They suit a follow-up.
- **Delay tech section (M26, M27 figures):** folded into section 9 by the author. `delay_tech_by_mr_gap`, `delay_tech_by_band` and `delay_tech_by_match_wakeup` are not used. Why behaviour changes late in a match could be a later investigation.
- **Drops chart, jump-in charts, enders:** each repeats a point already made or adds detail outside the spine.
- **M09 field notes:** the SVGs have never been looked at.
- **All other RED items:** no reproducible data.

## Where the inventory and its files disagree

The article will use the file value. You may want to correct these in the inventory.

| ID | Inventory says | Files say |
|---|---|---|
| M17 | 214LK 17.2% and 2MK 9.8% vs UM+; "loses 147 per use" | Those pool Iron through Diamond. Iron-Silver is 18.9% and 5.3% (14 uses). 214LK loses 120-190 per use at every band |
| M17 | Ken over-uses 2HK and 236PP | Ken 2HK goes 3.0 / 6.7 / 2.2 / 2.7 / 2.4% and 236PP 7.0 / 2.7 / 5.6 / 2.9 / 1.1%. Only the pooled low band shows this |
| M17 | 214LK "loses" 147 per use | The figure is damage dealt minus taken in the 90 frames after use, so its baseline is break-even, not another move |
| M23 | Punish rate of -7 to -19 blocks: 37% to 55% | True at the ends only: 37 / 46 / 30 / 36 / 55%, with 27 and 22 cases at Master and H/GM |
| M24 | 48 of 55 pressed in time | `miss_classes.csv` now gives 54 in reach at UM+: 33 punished, 14 wrong button, 3 late, 4 no attempt |
| M25 | UM+ Juri 214MK 133, Ken 5MK 50 per round | The rank panel divides by 2,054 player-rounds, the move panels by each side's rounds (about 1,027). So 133 and 50 cannot be read against UM+'s 186 |
| M25 | "Big drop between Gold-Diamond and Master" | True for the upper bound. Misses per round fall 0.23 to 0.10, damage per miss 4,298 to 3,817, and the punish rate does not rise |
| M28 | Ladder: meaty 5MP 18% to 25% | True at the ends only: 18 / 8 / 12 / 11 / 25%. Iron-Silver is 38 cases on offense |
| M29 | Shimmy 20-28% seen, 39-44% solved | Six top-level okis: shimmy 17-32% seen, 40-44% solved. "Throw agrees best" fails at Ken midscreen (17% vs 56%) |
| M29 vs M28 | UM+ shimmy 24%, Block 50%, delay tech 18% vs 19%, 46%, 17% | Both correct: M29 uses the options in the model as the base, M28 all cases |
| M33 | Fitted 78% at 200 MR, 87% at 300 | Those are the linear curve, which fits worse. Better fits give about 72% and 75%; the observed 200+ bin is 69% of 26 |
| M33 | Reads as Juri vs Ken | Figure uses 847 matches: 663 Juri vs Ken plus 184 mixed-character matches |
| M06 | Figures still marked STALE for Perfect Parry rows | X1 says this is fixed. Not used here |

Checked and correct on the current files: M01, M12 and M13 derived rates, M14, M19 (7 of 45), M21, M22, M23's outcome mix, M25's rank panel, M26, M27, M30's late-match rates, the M29 top-layer EVs, M35's and M36's headline counts.
