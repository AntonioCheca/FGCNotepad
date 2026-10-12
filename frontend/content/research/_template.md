---
# Copy this file to <slug>.md (lowercase-kebab-case). Files starting with "_" are never published.
title: "Article title"
description: "One or two sentences. Used on the Research index and in Reddit/Discord/X previews."
date: 2026-01-31
# updated: 2026-02-15
author: Checa
# Preview image for the index and social cards. PNG/JPG/WebP only, ideally 1200x630.
# Relative paths resolve to public/research/<slug>/.
# image: figures/cover.png
# imageAlt: "Short description of the preview image"
# youtube: https://www.youtube.com/watch?v=VIDEO_ID
tags: [SF6]
data:
  source: SF6ReplaysDb
  sampleSize: 12500 replays
  period: "2026-01-01 to 2026-01-31"
  gameVersion: "Season 3"
# Drafts render with `make up` / `next dev` but are left out of production builds.
draft: true
---

Opening paragraph: the question and the short answer. Use `##` for sections (the title comes from the frontmatter).

## Findings

A paragraph that is only an image becomes a figure. The image title (the quoted text) is the caption:

![Damage per combo by rank for Juri and Ken](figures/damage-by-rank.svg "Figure 1. Median combo damage by rank. n = 12,500 combos; bars show the interquartile range.")

Inline math $\bar{x} = \frac{1}{n}\sum_i x_i$ and display math:

$$
\text{efficiency} = \frac{\text{damage dealt}}{\text{optimal damage for the same starter}}
$$

| Rank | Combos | Median damage | Efficiency |
| ---- | -----: | ------------: | ---------: |
| Gold | 3,210 | 2,410 | 0.71 |
| Master | 1,980 | 3,050 | 0.88 |

> **Methodology note.** Blockquotes render as notes; use them for caveats, filters and definitions.

Footnotes work too.[^sample]

```python
df.groupby("rank")["damage"].median()
```

## Methodology

Data source, filters, definitions and known limitations.

[^sample]: Only ranked matches with both players at the same rank.
