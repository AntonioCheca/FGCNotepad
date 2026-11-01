# Scenario import/export (`scenario_export_v1`)

Admin-only JSON import and export of RPS scenarios (rows, columns, cells, layers). Sf6ReplaysDb generates these files from extracted oki data. The same format moves edited scenarios from a local instance to production.

- Schema: [`scenario-export/scenario_export_v1.schema.json`](scenario-export/scenario_export_v1.schema.json) (JSON Schema 2020-12)
- Worked example: [`scenario-export/example.juri-vs-ken.json`](scenario-export/example.juri-vs-ken.json) (Juri vs Ken; the values are illustrative)
- Server-side validation: `backend/src/Service/ScenarioTransfer/ScenarioImportDocumentValidator.php`, which mirrors the schema and also reports cross-field errors with paths, such as `scenarios[0].cells[3].starter.moves[0]`.

## Workflow

1. Import the combos the scenarios need through `/api/admin/replay-combo-imports` first. Dynamic cells resolve against stored combos.
2. Dry-run the scenario file, then import it into a local instance.
3. Check and edit the scenarios in the normal scenario UI.
4. Export the edited state (per scenario, or every scenario from one source).
5. Dry-run, then import that file into production.

## Format rules

| Part | How it is stored |
| --- | --- |
| Identity | `key: {source, externalId}`. A re-import with the same key updates the scenario. Scenarios created on the site export as `{source: "fgcnotepad", externalId: <public id>}`, and importing one into another database keeps that public id. |
| Characters | By name (`"Juri"`), matched case- and punctuation-insensitively. |
| Moves | By numpad notation within the character (`"2MK"`, `"623PP"`). Exports emit the exact stored notation; imports also accept the aliases the replay importers accept. Database ids never appear in the file. |
| Situation | `triggerMove` (usually the knockdown), `position` (`midscreen`, `corner`, or `viewer_default_midscreen`), `knockdownAdvantage` (frames, informational), and `characterStatuses` (character resources fixed for the whole scenario, e.g. `{"object": "juri_fuha", "status": 1}`). |
| Rows / columns | `key` (referenced by cells), `label`, `description`, `layer`, `requirements` (`owner` attacker/defender, `resource` health/drive/super, `threshold`; meaning `>=`), `summaryValue`, and optional `stats` (`seenFrequency` 0–1, `sampleCount`): how often the option was observed, shown as "Seen 46% (n=57)" on the axis. Only imports set stats; scenarios made on the site have none, and editor saves keep them by label. |
| Layers | Each row and column carries the layer that introduces it. Layer N is solved with every row/column whose layer is ≤ N, and at least one row and one column must be on layer 1. |
| Cells | Exactly one per row × column. `static` has a `value` (number or null). `dynamic_combo` has a `starter` (`initiator` attacker/defender, `moves`, `hitCondition` normal/counter_hit/punish_counter/perfect_parry). `reference` points to a scenario by key (the same scenario, another one in the file, or one already stored), with an optional `preValue` (static or dynamic starter), `weight`, `perspective` and `cachedValue`. The cell is worth `preValue ± weight × linked EV`: `weight` (0 < weight ≤ 1, default 1, left out of exports when 1) is the share of outcomes that reach the linked scenario, so the pre-value stays the real damage. `perspective` is `same` (default, left out of exports; the linked scenario's attacker is this scenario's attacker, so its EV adds) or `opponent` (its attacker is this scenario's defender, so its EV is subtracted); any other pairing is rejected. `cachedValue` is that total; the site recomputes it (see [Linked scenarios](#linked-scenarios)), and layer solving and the saved solution use it as the cell's value. |
| Provenance | Optional per cell: `status` observed/inferred/disputed, `sampleCount`, `confidence` (0–1), `note` (≤ 500 chars). |

Dynamic cells are exported as starter references, never as resolved numbers. Their value is resolved on the site from stored combos and the viewer's resources (Drive, Super, health and character resources such as Fuha stocks).

An export imported into an empty database and exported again gives an identical file apart from `exportedAt`. Axis keys are derived from labels on export, so a hand-written file's keys can change on that first round trip.

## Linked scenarios

References may point at their own scenario and may form cycles (A → B → A). The site solves every scenario connected by references (the linked component, links followed in both directions) together by fixed-point iteration with a fixed number of passes, 3 by default and at most 5:

- Pass 0 solves each scenario with every reference cell at its stored `cachedValue`, or its pre-value when it has none.
- Pass n sets each reference cell to `preValue ± weight × (linked scenario's top-layer EV from pass n-1)` and solves every scenario again.
- After the last pass, each reference cell's `cachedValue` and every scenario's layer solution are stored.

It never follows links depth-first, so cycles always stop. This runs on import, on every editor save (for the whole component of the saved scenario), in `POST /api/scenarios/{id}/solve-layers` and `solve-linked-ev`, and in `app:scenario:save-solutions`.

The convergence diagnostic is `linkConvergence`: `passes`, one entry per linked scenario with `expectedValue`, `lastPassDelta` (its top-layer EV change on the last pass) and `settled`, and `warnings`. A scenario is not settled when its last-pass change is above 25 damage or 5% of its EV, ignoring changes up to 1. The import result has it for all imported components, and `solve-layers` for the scenario's component. `solve-linked-ev` returns `passes`, `lastPassDelta` and `settled` for the requested scenario. Imports take `?linkPasses=N` (admin endpoint) or `--link-passes=N` (console); both solve endpoints take `linkPasses` in the body.

The re-import content hash leaves out reference `cachedValue`s, so recomputing them is not a site edit. Scenarios imported before this change whose file has reference cells report a conflict once; re-import them with `overwriteSiteEdits`.

## Dry run

The dry run writes nothing. It reports:

- schema errors and unknown characters, moves, character resources or referenced scenarios, each with a path;
- every dynamic starter (including dynamic `preValue`s), with the combo it resolves to under unconstrained resources and its value at 0 Drive/0 Super, 3 Drive/1 Super, 6 Drive/3 Super and, for characters with resources, all resources full. When no combo matches, the starter is **unresolved** and a level's value is only the starter move's own damage (`starterMoveOnly: true`).
- the action per scenario: `create`, `update`, `unchanged` or `conflict`.

`status` is `ok`, `invalid`, `unresolved_starters` or `conflict`. The real import writes only when the status is `ok`.

## Re-import policy

Each import stores a hash of the scenario's exported content right after writing it.

- No stored scenario with that key: **create**.
- Stored scenario, unchanged since its last import: **update** with the file, or **unchanged** if the file holds the same content.
- Stored scenario edited on the site since its last import, or created on the site and never imported: **conflict**. The whole import is refused (HTTP 409) and nothing is written, unless the request sets `overwriteSiteEdits`, which replaces those site edits.

To keep site edits, export the edited scenario, merge on the generator side, and re-import with `overwriteSiteEdits`. Renaming a character, move notation or resource in the catalog also changes a scenario's exported content, so it shows up as a conflict on the next re-import too.

Imports run in one transaction. Created and updated scenarios go through the same path as an editor save: dynamic cells are resolved, the layers are solved and stored, and the scenario is submitted for moderation (`pending_review`). Unchanged scenarios are left alone.

Editor saves keep row/column descriptions, seen stats and cell provenance by label. A cell whose content is edited loses its provenance, because the provenance no longer describes it.

## Endpoints (admin only; other users get 401/403)

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/api/admin/scenario-imports/dry-run` | Body: the document. `?overwriteSiteEdits=1` previews an overwrite. Always 200 with the report. |
| POST | `/api/admin/scenario-imports` | Body: the document. 200 on success with `id`, `url` and `layerExpectedValues` per scenario, and `linkConvergence`; 400 invalid, 422 unresolved starters, 409 conflict, each with the report. `?linkPasses=1..5` sets the passes. |
| GET | `/api/admin/scenario-exports/{publicId}` | One scenario. |
| GET | `/api/admin/scenario-exports?source=sf6replaysdb` | Every scenario imported from that source. |

Example with a session cookie:

```bash
HOST=http://localhost:8000
CSRF=$(curl -s -c cookies.txt -H 'Content-Type: application/json' \
  -d '{"username":"<admin>","password":"<password>"}' "$HOST/api/login" | jq -r .csrfToken)

curl -s -b cookies.txt -H "X-CSRF-Token: $CSRF" -H 'Content-Type: application/json' \
  --data @scenarios.json "$HOST/api/admin/scenario-imports/dry-run" | jq .
curl -s -b cookies.txt -H "X-CSRF-Token: $CSRF" -H 'Content-Type: application/json' \
  --data @scenarios.json "$HOST/api/admin/scenario-imports" | jq .
curl -s -b cookies.txt "$HOST/api/admin/scenario-exports?source=sf6replaysdb" > edited.json
```

Admin UI: **Admin → Replay Import → Scenario Export** (choose a file, then Dry Run or Import Scenarios, with optional Overwrite site edits; export every scenario from one source). Each scenario page has an admin-only **Export JSON** button.

## Console commands

```bash
docker compose exec -T backend php bin/console app:scenario:import /path/scenarios.json --dry-run
docker compose exec -T backend php bin/console app:scenario:import /path/scenarios.json [--overwrite-site-edits] [--author=<username>] [--link-passes=3]
docker compose exec -T backend php bin/console app:scenario:export --source=sf6replaysdb -o /path/edited.json
docker compose exec -T backend php bin/console app:scenario:export --id=<publicId> --id=<publicId>
```

The file path is inside the container. The import command exits non-zero unless the status is `ok`.

## Release notes

- Migration `Version20261028120000` adds nullable columns only: `scenario.knockdown_advantage`, `import_source`, `import_external_id` (unique with source), `import_content_hash`; `scenario_row.description`; `scenario_column.description`; and `scenario_cell.provenance_*`. On the VM: `sudo docker compose -f docker-compose.prod.yml exec -T backend php bin/console doctrine:migrations:migrate --no-interaction`.
- Migration `Version20261029120000` adds nullable `seen_frequency` and `seen_sample_count` to `scenario_row` and `scenario_column`.
- Migration `Version20261030120000` adds nullable `scenario_cell.reference_weight` (null = 1).
- Migration `Version20261031120000` adds nullable `scenario_cell.reference_perspective` (null = same side). After migrating, run `app:scenario:save-solutions` once so stored reference values are recomputed with their components.
- No new environment variables.

## Not representable yet

- Character-resource requirements on rows/columns (e.g. "needs 1 Fuha stock"). Requirements cover health, Drive and Super only. Fuha can only be fixed for the whole scenario through `situation.characterStatuses`.
- Resource context: none is stored per scenario. The viewer chooses resources, and the stored layer solution uses unconstrained resources.
- `knockdownAdvantage` is stored and round-tripped, but no UI shows or edits it.
- Execution mode and difficulty: dynamic cells resolve in standard mode (difficulty ≤ 5, unrated included). Per-cell modes are not stored.
- Per-scenario author and moderation state are not part of the file. Imports become `pending_review`.
- The legacy `ScenarioLayer` / `ScenarioOption` / `ScenarioOptionPart` / `ScenarioType` tables, and OkiSetup/OkiNode links, are not referenced by scenarios in the current editor and are not exported.
