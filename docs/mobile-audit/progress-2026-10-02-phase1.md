# Mobile audit — 2026-10-02, after Phase 1 + first page fixes

| Metric | Value |
| --- | --- |
| Average score @360px | 97 / 100 |
| Average score @390px | 97 / 100 |
| Strict-pass coverage (all phone widths) | 25 / 32 routes (78%) |
| Routes scrolling sideways | 0 |
| Undersized tap targets (sum @360px) | 0 |
| Inputs that trigger iOS zoom (sum @360px) | 0 |

| Area | Route | @360 | @390 | Screens | Main issues |
| --- | --- | --- | --- | --- | --- |
| Core | `/` | 100 ✓ | 100 ✓ | 1 | — |
| Combos | `/combos` | 100 ✓ | 100 ✓ | 1.2 | — |
| Combos | `/combos/new` | 100 ✓ | 100 ✓ | 1.4 | — |
| Combos | `/combos/3418` | 97 | 97 | 1.1 | axe serious/critical |
| Combos | `/profile/recommend-combo` | 100 ✓ | 100 ✓ | 1 | — |
| Okis | `/okis` | 95 ✓ | 95 ✓ | 1 | mostly text < 14px |
| Okis | `/okis/new` | 100 ✓ | 100 ✓ | 2.2 | — |
| Okis | `/okis/1` | 97 ✓ | 97 ✓ | 1.3 | cards nested 3+ deep |
| Okis | `/okis/1/edit` | 100 ✓ | 100 ✓ | 3.2 | — |
| Okis | `/okis/reversals` | 95 ✓ | 95 ✓ | 1 | mostly text < 14px |
| Blockstrings | `/blockstrings/offense` | 100 ✓ | 100 ✓ | 1 | — |
| Blockstrings | `/blockstrings/defense` | 100 ✓ | 100 ✓ | 1 | — |
| Blockstrings | `/blockstrings/new` | 100 ✓ | 100 ✓ | 1.2 | — |
| Blockstrings | `/blockstrings/1` | 100 ✓ | 100 ✓ | 1 | — |
| Scenarios | `/scenarios` | 100 ✓ | 100 ✓ | 1 | — |
| Scenarios | `/scenarios/new` | 82 | 82 | 2.9 | cards nested 3+ deep, card content < 60% of screen width, wide sideways scroller, axe serious/critical |
| Scenarios | `/scenarios/01a0fcbc-398b-7b66-9e6a-d1c1f647d144` | 77 | 77 | 2.2 | cards nested 3+ deep, mostly text < 14px, card content < 60% of screen width, wide sideways scroller, axe serious/critical |
| Scenarios | `/scenarios/01a0fcbc-398b-7b66-9e6a-d1c1f647d144/edit` | 77 | 77 | 3 | cards nested 3+ deep, mostly text < 14px, card content < 60% of screen width, wide sideways scroller, axe serious/critical |
| Stats | `/neutral-stats` | 100 ✓ | 100 ✓ | 1 | — |
| Stats | `/neutral-stats?character=1f1ae9e2-b645-6648-a11e-95e915436371` | 97 | 97 | 1.7 | axe serious/critical |
| Guides | `/guides/turns` | 92 ✓ | 92 ✓ | 9.7 | section > 3 screens |
| Replay Lab | `/replay-lab` | 100 ✓ | 100 ✓ | 1 | — |
| Replay Lab | `/replay-lab/upload` | 100 ✓ | 100 ✓ | 1 | — |
| Replay Lab | `/replay-lab/local` | 100 ✓ | 100 ✓ | 1 | — |
| Replay Lab | `/replay-lab/practice-tasks` | 100 ✓ | 100 ✓ | 1 | — |
| Replay Lab | `/replay-lab/study-deck` | 100 ✓ | 100 ✓ | 1 | — |
| Account | `/profile` | 100 ✓ | 100 ✓ | 1.2 | — |
| Account | `/about/aboutUs` | 93 | 97 | 3.4 | section > 3 screens, axe serious/critical |
| Moderation | `/moderation/queue` | 88 | 88 | 4.6 | mostly text < 14px, section > 3 screens, axe serious/critical |
| Moderation | `/moderation/frame-data` | 100 ✓ | 100 ✓ | 1 | — |
| Moderation | `/moderation/resources` | 100 ✓ | 100 ✓ | 1 | — |
| Moderation | `/admin/situations` | 100 ✓ | 100 ✓ | 1.7 | — |
| Admin | `/admin/users` (desktop-only) | 92 | 92 | 1.4 | mostly text < 14px, axe serious/critical |
| Admin | `/admin/replay-combo-imports` (desktop-only) | 100 ✓ | 100 ✓ | 1 | — |

✓ = strict pass: no sideways scroll, nothing past the screen edge or out of its card, no desktop table, no tap target under 24px, no input under 16px, no serious axe violation.

