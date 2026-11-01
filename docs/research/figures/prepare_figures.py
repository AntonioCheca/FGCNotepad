"""Copies and crops the Juri vs Ken article figures from the replay research output.

Run with a Python that has Pillow:
    python docs/research/figures/prepare_figures.py ../Sf6ReplaysDb/research/output OUTPUT_DIR
"""

import shutil
import sys
from pathlib import Path

from PIL import Image, ImageDraw

COPIES = {
    "conversion/figures/combo_volume_by_result_juri.png": "combos-by-rank.png",
    "jump_ins/figures/jumps_per_player.png": "jumps-per-player.png",
    "forward_jumps/figures/anti_air_moves.png": "anti-air-moves.png",
    "neutral_choices/figures/neutral_moves_juri.png": "neutral-moves-juri.png",
    "move_outcomes/figures/outcome_mix.png": "outcome-mix.png",
    "punish_spacing/figures/punish_focus.png": "punish-focus.png",
}
SURFACE = (252, 252, 251)


def stack(source: Path, strips: list[tuple[int, int]], output: Path) -> None:
    """Keeps these horizontal strips of a figure, one under the other."""
    image = Image.open(source).convert("RGB")
    height = sum(bottom - top for top, bottom in strips)
    result = Image.new("RGB", (image.width, height), SURFACE)
    y = 0
    for top, bottom in strips:
        result.paste(image.crop((0, top, image.width, bottom)), (0, y))
        y += bottom - top
    result.save(output)


def main(root: Path, output: Path) -> None:
    output.mkdir(parents=True, exist_ok=True)
    for source, name in COPIES.items():
        shutil.copyfile(root / source, output / name)

    # Right panel only: the rank bars.
    damage_lost = Image.open(root / "punish_damage/figures/damage_lost.png").convert("RGB")
    damage_lost.crop((1580, 100, damage_lost.width, damage_lost.height)).save(output / "missed-punish-damage.png")

    # Top row, plus the rank labels and legend that only exist under the bottom row.
    stack(
        root / "damage_left/figures/damage_left.png",
        [(150, 668), (1205, 1262), (1295, 1342)],
        output / "damage-left.png",
    )
    # The strip of rank labels also caught the start of the bottom row's axis title.
    damage_left = Image.open(output / "damage-left.png")
    ImageDraw.Draw(damage_left).rectangle((0, 518, 100, 575), fill=damage_left.getpixel((5, 5)))
    damage_left.save(output / "damage-left.png")
    # Bottom row, plus the Juri and Ken headers that only exist over the top row.
    stack(
        root / "missed_kill_rates/figures/missed_kill_rounds.png",
        [(105, 135), (695, 1324)],
        output / "lost-rounds.png",
    )


if __name__ == "__main__":
    main(Path(sys.argv[1]), Path(sys.argv[2]))
