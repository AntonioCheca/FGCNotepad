import assert from "node:assert/strict";
import test from "node:test";

import {createInitialMatrixEditorState} from "../../state";
import {createBodyCellKey} from "../../model";
import {buildReferenceInspectorData} from "./referenceInspector";

test("inspector builds source info for selected reference cell", () => {
    const state = createInitialMatrixEditorState({rowCount: 1, columnCount: 1});
    const key = createBodyCellKey("row_1", "column_1");

    state.grid.bodyCells[key] = {
        ...state.grid.bodyCells[key],
        kind: "reference",
        value: 6,
        reference: {
            kind: "computed",
            scenarioId: "77",
            scenarioLabel: "Corner Trap",
            cachedValue: 5,
        },
        dynamicCombo: null,
    };

    const data = buildReferenceInspectorData(
        state,
        {zone: "body", key, rowId: "row_1", columnId: "column_1"},
        {[key]: 6},
        {"77": {updatedAt: "2026-04-12", confidence: 0.88}}
    );

    assert.ok(data);
    assert.equal(data.scenarioName, "Corner Trap");
    assert.equal(data.scenarioId, "77");
    assert.equal(data.resolvedValue, 6);
    assert.equal(data.cachedValue, 5);
    assert.equal(data.metadata.length, 2);
});

test("inspector returns null for non-reference selection", () => {
    const state = createInitialMatrixEditorState({rowCount: 1, columnCount: 1});
    const key = createBodyCellKey("row_1", "column_1");

    const data = buildReferenceInspectorData(
        state,
        {zone: "body", key, rowId: "row_1", columnId: "column_1"},
        {[key]: null},
        {}
    );

    assert.equal(data, null);
});
