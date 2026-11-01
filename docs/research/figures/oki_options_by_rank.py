"""Draws the oki options chart for the Juri vs Ken article from the replay research tables.

Run with a Python that has matplotlib:
    python docs/research/figures/oki_options_by_rank.py ../Sf6ReplaysDb/research/output OUTPUT.png
"""

import csv
import re
import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

SCENARIO = "Juri 214MK oki vs Ken (midscreen)"
REPORT = "oki_rps/juri-vs-ken__214mk-oki__midscreen.report.md"
BANDS = ["Iron-Silver", "Gold-Diamond", "Master", "High/Grand Master", "Ultimate Master+"]
RANK_COLORS = ["#86b6ef", "#5598e7", "#2a78d6", "#1c5cab", "#0d366b"]
SURFACE = "#fcfcfb"
INK = "#0b0b0b"
MUTED = "#52514e"
GRID = "#e4e3df"


def defense_rows(root: Path) -> dict[str, list[tuple[int, float]]]:
    rows: dict[str, dict[str, tuple[int, float]]] = {}
    with (root / "oki_defender_band/tables/defense_shares_by_band.csv").open() as handle:
        for row in csv.DictReader(handle):
            if row["scenario"] == SCENARIO:
                rows.setdefault(row["option"], {})[row["band"]] = (int(row["cases"]), float(row["share"]) * 100)
    return {option: [by_band[band] for band in BANDS] for option, by_band in rows.items()}


def shimmy_shares(root: Path) -> list[float]:
    report = (root / REPORT).read_text()
    match = re.search(r"^\| Shimmy \(offense\) \| \d \| (.+?) \|$", report, re.M)
    if match is None:
        raise SystemExit("No shimmy row in the report")
    return [float(value.strip().rstrip("%")) for value in match.group(1).split("|")]


def main(root: Path, output: Path) -> None:
    defense = defense_rows(root)
    groups = {
        "Block": [share for _, share in defense["Block"]],
        "Wake-up throw": [share for _, share in defense["Wake-up throw"]],
        "Shimmy": shimmy_shares(root),
        "Delay tech": [share for _, share in defense["Delay tech"]],
    }
    cases = [count for count, _ in defense["Block"]]

    plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 15, "text.color": INK})
    figure, axes = plt.subplots(figsize=(11, 6.6), dpi=150, facecolor=SURFACE)
    axes.set_facecolor(SURFACE)

    bar_width = 0.165
    for group_index, shares in enumerate(groups.values()):
        for band_index, share in enumerate(shares):
            x = group_index + (band_index - 2) * bar_width
            axes.bar(x, share, width=bar_width - 0.012, color=RANK_COLORS[band_index], zorder=3)
            axes.text(x, share + 0.8, f"{share:.0f}", ha="center", va="bottom", fontsize=13, color=INK)

    axes.set_xticks(range(len(groups)), list(groups), fontsize=17, fontweight="bold")
    axes.set_ylim(0, 52)
    axes.set_yticks(range(0, 51, 10), [f"{tick}%" for tick in range(0, 51, 10)], color=MUTED)
    axes.grid(axis="y", color=GRID, linewidth=1, zorder=0)
    axes.tick_params(length=0)
    for side in ("top", "right", "left"):
        axes.spines[side].set_visible(False)
    axes.spines["bottom"].set_color(MUTED)

    handles = [plt.Rectangle((0, 0), 1, 1, color=color) for color in RANK_COLORS]
    labels = [f"{band.replace('High/Grand Master', 'High/Grand M.')} ({count})" for band, count in zip(BANDS, cases)]
    figure.legend(
        handles,
        labels,
        title="Rank (wake-ups)",
        loc="upper right",
        bbox_to_anchor=(0.985, 0.96),
        frameon=False,
        fontsize=13,
        title_fontsize=13,
    )
    figure.text(
        0.02,
        0.02,
        "Share of wake-ups after Juri's 214MK knockdown, midscreen. Block, wake-up throw and delay tech\n"
        "use the defender's rank. Shimmy uses the attacker's, with case counts within 3 of those shown.",
        fontsize=12,
        color=MUTED,
    )
    figure.subplots_adjust(left=0.07, right=0.985, top=0.96, bottom=0.2)
    output.parent.mkdir(parents=True, exist_ok=True)
    figure.savefig(output, facecolor=SURFACE)


if __name__ == "__main__":
    main(Path(sys.argv[1]), Path(sys.argv[2]))
