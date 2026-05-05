import assert from "node:assert/strict";
import test from "node:test";

import {createInitialMatrixEditorState} from "@/src/features/matrix/state";
import {buildMatrixResourceGating, MatrixResourceContext} from "./matrixResourceGating";

const DEFAULT_RESOURCES: MatrixResourceContext = {
    attacker: {health: 10000, drive: 6, super: 3},
    defender: {health: 10000, drive: 6, super: 3},
};

test("resource gating leaves axes with no requirements available", () => {
    const state = createInitialMatrixEditorState({rowCount: 1, columnCount: 1});
    const gating = buildMatrixResourceGating(state, DEFAULT_RESOURCES);

    assert.equal(gating.unavailableRowIds.size, 0);
    assert.equal(gating.unavailableColumnIds.size, 0);
});

test("resource gating disables rows with unmet drive requirements", () => {
    const state = createInitialMatrixEditorState({rowCount: 1, columnCount: 1});
    state.grid.rows[0].requirements = [{owner: "defender", resource: "drive", operator: ">=", threshold: 2.5}];

    const gating = buildMatrixResourceGating(state, {
        ...DEFAULT_RESOURCES,
        defender: {...DEFAULT_RESOURCES.defender, drive: 2},
    });

    assert.equal(gating.unavailableRowIds.has("row_1"), true);
    assert.equal(gating.reasonByRowId.row_1, "Needs Defender Drive >= 2.5");
});

test("resource gating disables columns with unmet super requirements", () => {
    const state = createInitialMatrixEditorState({rowCount: 1, columnCount: 1});
    state.grid.columns[0].requirements = [{owner: "attacker", resource: "super", operator: ">=", threshold: 3}];

    const gating = buildMatrixResourceGating(state, {
        ...DEFAULT_RESOURCES,
        attacker: {...DEFAULT_RESOURCES.attacker, super: 2},
    });

    assert.equal(gating.unavailableColumnIds.has("column_1"), true);
    assert.equal(gating.reasonByColumnId.column_1, "Needs Attacker Super >= 3");
});

test("resource gating requires all requirements to pass", () => {
    const state = createInitialMatrixEditorState({rowCount: 1, columnCount: 1});
    state.grid.rows[0].requirements = [
        {owner: "attacker", resource: "drive", operator: ">=", threshold: 1},
        {owner: "attacker", resource: "super", operator: ">=", threshold: 2},
    ];

    const gating = buildMatrixResourceGating(state, {
        ...DEFAULT_RESOURCES,
        attacker: {...DEFAULT_RESOURCES.attacker, drive: 1, super: 1},
    });

    assert.equal(gating.unavailableRowIds.has("row_1"), true);
    assert.equal(gating.reasonByRowId.row_1, "Needs Attacker Super >= 2");
});
