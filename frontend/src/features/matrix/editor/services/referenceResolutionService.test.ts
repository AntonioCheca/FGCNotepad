import assert from "node:assert/strict";
import test from "node:test";

import {createInitialMatrixEditorState} from "../../state";
import {createBodyCellKey} from "../../model";
import {createMapReferenceResolver, resolveReferenceDisplayValues} from "./referenceResolutionService";

test("reference resolver returns resolved display values and cache updates", () => {
    const state = createInitialMatrixEditorState({rowCount: 1, columnCount: 2});
    const refKey = createBodyCellKey("row_1", "column_2");

    state.grid.bodyCells[refKey] = {
        ...state.grid.bodyCells[refKey],
        kind: "reference",
        value: null,
        reference: {
            kind: "reference",
            scenarioId: "scn_1",
            cachedValue: null,
        },
    };

    const result = resolveReferenceDisplayValues(state, createMapReferenceResolver({scn_1: 8}));

    assert.equal(result.displayedBodyValues[createBodyCellKey("row_1", "column_1")], null);
    assert.equal(result.displayedBodyValues[refKey], 8);
    assert.equal(result.cacheUpdates.length, 1);
    assert.equal(result.cacheUpdates[0].key, refKey);
    assert.equal(result.cacheUpdates[0].cachedValue, 8);
    assert.equal(result.issues.length, 0);
});

test("reference resolver gracefully falls back to cached value when missing", () => {
    const state = createInitialMatrixEditorState({rowCount: 1, columnCount: 1});
    const refKey = createBodyCellKey("row_1", "column_1");

    state.grid.bodyCells[refKey] = {
        ...state.grid.bodyCells[refKey],
        kind: "reference",
        value: 3,
        reference: {
            kind: "computed",
            scenarioId: "scn_missing",
            cachedValue: 3,
        },
    };

    const result = resolveReferenceDisplayValues(state, createMapReferenceResolver({}));

    assert.equal(result.displayedBodyValues[refKey], 3);
    assert.equal(result.cacheUpdates.length, 0);
    assert.equal(result.issues.length, 1);
});
