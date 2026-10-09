# Mobile audit — 2026-10-09

| Metric | Value |
| --- | --- |
| Average score @360px | 98 / 100 |
| Average score @390px | 98 / 100 |
| Strict-pass coverage (all phone widths) | 29 / 30 routes (97%) |
| Routes scrolling sideways | 0 |
| Undersized tap targets (sum @360px) | 1 |
| Inputs that trigger iOS zoom (sum @360px) | 0 |

| Area | Route | @360 | @390 | Screens | Main issues |
| --- | --- | --- | --- | --- | --- |
| Core | `/` | 100 ✓ | 100 ✓ | 1 | — |
| Combos | `/combos` | 100 ✓ | 100 ✓ | 1.4 | — |
| Combos | `/combos/new` | 100 ✓ | 100 ✓ | 1.1 | — |
| Combos | `/combos/3606` | 100 ✓ | 100 ✓ | 1.1 | — |
| Okis | `/okis` | 100 ✓ | 100 ✓ | 1 | — |
| Okis | `/okis/new` | 100 ✓ | 100 ✓ | 1 | — |
| Okis | `/okis/2` | 100 ✓ | 100 ✓ | 1.3 | — |
| Okis | `/okis/2/edit` | 99 | 100 ✓ | 1.9 | tap targets < 24px |
| Blockstrings | `/blockstrings` | 100 ✓ | 100 ✓ | 1 | — |
| Blockstrings | `/blockstrings/new` | 100 ✓ | 100 ✓ | 1 | — |
| Blockstrings | `/blockstrings/2` | 100 ✓ | 100 ✓ | 1 | — |
| Scenarios | `/scenarios` | 100 ✓ | 100 ✓ | 1 | — |
| Scenarios | `/scenarios/new` | 97 ✓ | 97 ✓ | 2.6 | cards nested 3+ deep |
| Scenarios | `/scenarios/01a0fcbc-398b-7b66-9e6a-d1c1f647d144` | 95 ✓ | 95 ✓ | 2.3 | mostly text < 14px |
| Scenarios | `/scenarios/01a0fcbc-398b-7b66-9e6a-d1c1f647d144/edit` | 92 ✓ | 92 ✓ | 2.7 | mostly text < 14px, cards nested 3+ deep |
| Stats | `/neutral-stats` | 100 ✓ | 100 ✓ | 1 | — |
| Stats | `/neutral-stats?character=1f1ae9e2-b645-6648-a11e-95e915436371` | 79 ✓ | 79 ✓ | 6.3 | text < 12px, section > 3 screens, mostly text < 14px |
| Guides | `/guides` | 100 ✓ | 100 ✓ | 1 | — |
| Guides | `/guides/turns` | 92 ✓ | 92 ✓ | 9.7 | section > 3 screens |
| Replay Lab | `/replay-lab` | 100 ✓ | 100 ✓ | 1 | — |
| Replay Lab | `/replay-lab/upload` | 100 ✓ | 100 ✓ | 1 | — |
| Replay Lab | `/replay-lab/local` | 100 ✓ | 100 ✓ | 1 | — |
| Replay Lab | `/replay-lab/practice-tasks` | 100 ✓ | 100 ✓ | 1 | — |
| Replay Lab | `/replay-lab/study-deck` | 100 ✓ | 100 ✓ | 1 | — |
| Account | `/profile` | 100 ✓ | 100 ✓ | 1.2 | — |
| Account | `/about/aboutUs` | 96 ✓ | 100 ✓ | 3.4 | section > 3 screens |
| Moderation | `/moderation/queue` | 91 ✓ | 91 ✓ | 4.7 | mostly text < 14px, section > 3 screens |
| Moderation | `/moderation/frame-data` | 100 ✓ | 100 ✓ | 1 | — |
| Moderation | `/moderation/resources` | 100 ✓ | 100 ✓ | 1 | — |
| Moderation | `/admin/situations` | 100 ✓ | 100 ✓ | 1.7 | — |
| Admin | `/admin/users` (desktop-only) | 95 ✓ | 95 ✓ | 1.7 | mostly text < 14px |
| Admin | `/admin/replay-combo-imports` (desktop-only) | 100 ✓ | 100 ✓ | 1 | — |

✓ = strict pass: no sideways scroll, nothing past the screen edge or out of its card, no desktop table, no tap target under 24px, no input under 16px, no serious axe violation.

