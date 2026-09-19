# Combo Export Format

`combo_export_v1.json` is a generic, replay-derived combo document intended as
an integration bridge. It is not tailored to a specific API, and it is not an
authoritative game record. The source analyzer emits only conservative observed
evidence and retains its source replay hash for traceability.

## Document

```json
{
  "format": "combo_export_v1",
  "source": {},
  "summary": {},
  "combos": []
}
```

- `format`: versioned document contract. Consumers should reject unsupported
  versions rather than infer field meanings.
- `source`: replay and analyzer provenance.
- `summary`: convenience counts for `combo_count`, `ready_to_export_count`, and
  `not_ready_to_export_count`.
- `combos`: ordered combo occurrences from the replay.

## Source

`source` includes:

- `replay_id`: extractor replay identifier.
- `source_sha256`: SHA-256 of the input replay JSON.
- `extractor_schema_version`: source extractor schema version.
- `analysis_format`, `analyzer_name`, and `analyzer_version`: provenance for the
  analysis which produced this export.

## Combo

Each item in `combos` has:

- `id`: stable only within this generated document, such as `r1-s1-c2`.
- `round_number`, `player_slot`, `character`, `opponent_player_slot`, and
  `opponent_character`: occurrence participants and location.
- `sequence`: ordered structured move and system-action steps.
- `sequence_notation`: human-readable rendering of `sequence`; consumers should
  use `sequence` as the data source.
- `damage`: observed total damage, not a guaranteed game-authoritative total.
- `reported_hit_count` and `observed_damaging_contacts`: raw-counter-informed and
  directly observed hit counts.
- `starter_hit_type`: `counter_hit`, `punish_counter`, `normal`, or `null` when
  not observed.
- `corner_candidate` and `juggle_starter`: observed/candidate context, not
  authoritative game classifications.
- `source_indexes`: input replay positions for review and debugging.

## Sequence Steps

Moves use canonical numpad notation:

```json
{
  "kind": "move",
  "notation": "236+HP",
  "name": "Daloy ng Tubig"
}
```

Supported step kinds:

- `move`: a mapped move. `notation` is the canonical numpad input, for example
  `2MP`, `j.HK`, `236+P`, or `236236P`.
- `drive_rush`: raw Drive Rush evidence. `notation` is `null`; it renders as
  `[DR]` in `sequence_notation`.
- `drive_rush_cancel`: Drive Rush Cancel evidence. `notation` is `null`; it
  renders as `[DRC]`.
- `unmapped`: an observed damaging action without a catalogue mapping. Both
  `notation` and `name` are `null`; it renders as `[unmapped]`.

## Export Readiness

Every combo has a boolean `ready_to_export` and a machine-readable
`export_blockers` list.

`ready_to_export` is `false` when any of the following applies:

- `unmapped_move`: the sequence contains an `unmapped` step.
- `missing_move_notation`: a mapped move has no canonical notation.
- `incomplete_damage_evidence`: the analyzer could not establish complete
  observed damage.
- `estimated_unobserved_hits`: the raw hit counter indicates hits that were not
  directly observed.

An empty `export_blockers` list means the combo is suitable for automatic
downstream export under these rules. It does not make the combo ground truth;
consumers that need stricter review may impose additional policy.

## Example

The root-level `combo_export_v1.json` is a complete generated example from an
SF6 replay. It includes export-ready combos, Drive Rush, and two blocked combos
with unmapped actions.

## FGCNotepad Admin Import

FGCNotepad accepts this document through the admin Replay Combo Import page.
The import creates normal combo submissions, which enter the moderation queue.

- Only `combo_export_v1` documents are accepted.
- Only `ready_to_export: true` occurrences are considered. Blocked occurrences
  are returned as skipped results without creating a combo.
- Every move must map unambiguously to an existing leaf sequence for the named
  character using its canonical numpad notation.
- `drive_rush` requires a character-specific `DR` leaf sequence.
- `drive_rush_cancel` is applied to the following move and requires the
  configured Drive Rush Cancel connection type. Other adjacent moves use the
  conservative Link connection type.
- Observed `counter_hit` and `punish_counter` starters become the matching
  FGCNotepad combo requirements. Corner and juggle observations are not mapped
  to requirements.
- Observed damage is imported. Resource metrics are recalculated from the move
  catalog as part of normal combo creation.
- Imports do not retain replay provenance or deduplicate documents. Re-uploading
  the same file can create duplicate pending submissions.
