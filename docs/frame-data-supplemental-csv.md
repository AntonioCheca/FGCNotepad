# FGTheory Supplemental Frame Data CSV

Use this format when FAT / Full Meter JSON is temporarily missing a character, move, or patch value.

The populated CSV should not be committed. Keep real files under an external path, `backend/data/`, `frame-data-imports/`, or use the `.fgtheory-frame-data.csv` suffix.

## Commands

Download/import normal upstream data:

```powershell
cd backend
php bin/console frame-data:download:fat-json
php bin/console frame-data:import:fat-json --path="data/fat_data.json"
```

Test and import supplemental CSV:

```powershell
cd backend
php bin/console frame-data:import:fgtheory-csv --path="E:\\private-frame-data\\character-x.fgtheory-frame-data.csv" --label="character-x-august-patch" --dry-run
php bin/console frame-data:import:fgtheory-csv --path="E:\\private-frame-data\\character-x.fgtheory-frame-data.csv" --label="character-x-august-patch"
```

Compare and retire a supplemental batch after upstream catches up:

```powershell
cd backend
php bin/console frame-data:supplemental:compare --batch=1
php bin/console frame-data:supplemental:retire --batch=1
```

## Template

Copy this header row into Google Sheets. Export populated data as CSV.

```csv
character_name,character_life,move_name,numpad_notation,startup,active,recovery,total,on_hit,on_block,on_punish_counter,move_type,cancels_to,damage,full_damage,scaling,chip_damage,attack_level,on_hit_after_drive_rush,on_block_after_drive_rush,on_perfect_parry,drive_damage_on_hit,drive_damage_on_block,drive_gain,on_hit_self_super_meter_gain,on_block_self_super_meter_gain,on_hit_opponent_super_meter_gain,on_block_opponent_super_meter_gain,hit_confirm_specials_and_supers,hit_confirm_target_combos,juggle_limit,juggle_increase,juggle_start,hitstun,blockstun,hitstop,extra_information
```

## Notes

- `character_name` and `numpad_notation` identify the move.
- `character_life` defaults to `10000` when empty.
- Empty frame-data cells are ignored by the supplemental overlay.
- `cancels_to` accepts comma-separated FAT-style cancel codes, for example `sp,su`.
- `full_damage` can contain FAT-style composite text such as `1300 (600*700)` when `damage` is empty.
- Manual moderator overrides still win over supplemental values.
