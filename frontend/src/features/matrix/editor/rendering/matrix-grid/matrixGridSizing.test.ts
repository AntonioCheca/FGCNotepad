import assert from "node:assert/strict";
import test from "node:test";

import {createInitialMatrixEditorState} from "@/src/features/matrix/state";
import {resolveDensityProfile} from "../gridDensity";
import {buildMatrixGridSizing, estimateLabelLines} from "./matrixGridSizing";

const profile = resolveDensityProfile("standard", 2, 2);

test("short labels keep the density profile widths", () => {
    const state = createInitialMatrixEditorState({rowCount: 2, columnCount: 2});
    const sizing = buildMatrixGridSizing(state, profile, {});

    assert.equal(sizing.rowLabelWidth, profile.rowLabelWidth);
    assert.deepEqual(Object.values(sizing.columnWidthById), [profile.columnLabelWidth, profile.columnLabelWidth]);
    assert.equal(sizing.bodyCellMinHeight, profile.cellHeight);
});

test("the widest label or starter chip sets one width for every column, up to a cap", () => {
    const state = createInitialMatrixEditorState({rowCount: 1, columnCount: 2});
    const [row] = state.grid.rows;
    const [labelled, chipped] = state.grid.columns;
    row.label = "Delayed tech / shimmy back";
    labelled.label = "Drive Reversal on wakeup";
    state.grid.bodyCells[`body::${row.id}::${chipped.id}`] = {
        ...state.grid.bodyCells[`body::${row.id}::${chipped.id}`],
        kind: "dynamic_combo",
        dynamicCombo: {attackerCharacterId: "1", starterMoveIds: ["7"], starterContext: {isPunishCounter: false, isCounterHit: false}},
    };

    const sizing = buildMatrixGridSizing(state, profile, {"7": "Stand Heavy Kick (Target Combo)"});

    assert.ok(sizing.rowLabelWidth > profile.rowLabelWidth);
    assert.ok(sizing.columnWidthById[labelled.id] > profile.columnLabelWidth);
    assert.equal(sizing.columnWidthById[chipped.id], sizing.columnWidthById[labelled.id]);
    assert.ok(sizing.bodyCellMinHeight > profile.cellHeight, "a combo cell makes every body cell two lines tall");

    labelled.label = "A very long column label that will never fit on a single line of the grid";
    const capped = buildMatrixGridSizing(state, profile, {});
    assert.equal(capped.columnWidthById[labelled.id], 200);
    assert.ok(estimateLabelLines(labelled.label, profile.labelFontSize, 200) > 1);
});
