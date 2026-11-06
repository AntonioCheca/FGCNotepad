# Publishing research articles

Research articles live at `/research` and `/research/<slug>`. Each article is one Markdown file plus its figures. Publishing one should not need any React changes.

## Where things go

| What | Path |
| --- | --- |
| Article | `frontend/content/research/<slug>.md` |
| Figures and preview image | `frontend/public/research/<slug>/figures/` |
| Starter template (never published) | `frontend/content/research/_template.md` |

- The slug is the file name. It must be lowercase kebab-case, for example `juri-ken-combo-optimization`.
- Files starting with `_` are never listed or built.
- Relative image paths in an article (`figures/x.svg`) resolve to `public/research/<slug>/`.

## Workflow

1. Analyze the replay data in SF6ReplaysDb.
2. Export the figures with `replay-analysis research article-figures` in SF6ReplaysDb. It uses the site's dark theme, and `notes.md` next to the figures holds the sample sizes and definitions for the captions.
3. Copy the selected figures into `frontend/public/research/<slug>/figures/`.
4. Copy `_template.md` to `<slug>.md`, fill in the frontmatter and write the article. Keep `draft: true` while writing.
5. Preview it with the dev server at `http://localhost:3000/research/<slug>`. Drafts show a Draft chip.
6. Set `draft: false`, commit, and deploy. Articles are rendered at build time, so they only go live after a production rebuild.

## Frontmatter

```yaml
title: "How Juri and Ken players optimize their combos across ranks"   # required
description: "One or two sentences for the index and link previews."  # required
date: 2026-10-12                                                       # required, YYYY-MM-DD
updated: 2026-10-20                                                    # optional
author: Checa                                                          # optional
image: figures/cover.png       # optional preview for the index and social cards; PNG/JPG/WebP, ideally 1200x630
imageAlt: "Damage by rank"     # optional
youtube: https://www.youtube.com/watch?v=...   # optional; shows a "Watch the video" link
tags: [SF6, Juri, Ken]
data:                          # optional; rendered as the data box under the title
  source: Own replay analysis  # or a list: [Own replay analysis, FAT frame data]
  sampleSize: 12500 replays
  period: "2026-09-01 to 2026-10-01"
  gameVersion: "Season 3"
draft: true
```

Invalid frontmatter fails the build with an error that names the article and the field.

Social sites (Reddit, Discord, X) do not render SVG previews, so `image` must be a raster file. Articles without an image fall back to the site logo card.

## Writing

- Do not use `#`, because the title comes from the frontmatter. `##` sections appear in the Contents list once there are three or more.
- **Figures.** A paragraph that holds only an image becomes a figure, and the quoted image title becomes its caption:

  ```markdown
  ![Alt text for screen readers](figures/damage-by-rank.svg "Figure 1. Median damage by rank. n = 12,500 combos.")
  ```

  A caption starting `Figure 1.` gets that label in bold.

  Add `#right-40` to the path to float a figure to the right at 40% of the column, with the text wrapping beside it. Any width from 25 to 60 works, and phones show it full width. Put the figure before the text it goes with, and use a figure exported for that size:

  ```markdown
  ![Alt text](figures/damage-side.png#right-40 "Figure 2. Median damage by rank.")
  ```

  Figures sit directly on the dark page, so export them with a transparent background and light text. A default white Matplotlib export will show as a white block.
- **Math.** KaTeX renders `$inline$` and `$$display$$` math.
- **Tables.** GFM tables scroll horizontally on phones. Right-align number columns with `---:`.
- **Notes.** Blockquotes render as notes. Use them for caveats, filters and definitions (`> **Methodology note.** ...`).
- **Footnotes.** Use `[^1]` for citations or sample details.
- **Links and code.** External links open in a new tab. Code blocks are supported, without syntax highlighting.
- **Raw HTML.** It is dropped, so stick to Markdown.

## Notes

- Share links use `https://fightinggametheory.com`. To build for another domain, set `NEXT_PUBLIC_SITE_URL` at build time.
- `/research` skips the auth proxy, so articles and figures are public.
- After layout changes, run `make mobile-audit ONLY='/research'`. It checks the index and the first article in `content/research/`.
