import assert from "node:assert/strict";
import test from "node:test";

import {createBodyCellKey} from "../../model";
import {createInitialMatrixEditorState, matrixEditorReducer} from "../../state";
import {toSelectionTarget} from "./matrixKeyboardEngine";
import {applyMatrixPaste} from "./matrixPasteEngine";

function applyPaste(state: ReturnType<typeof createInitialMatrixEditorState>, text: string) {
    const result = applyMatrixPaste(state, text);
    const nextState = result.actions.reduce((acc, action) => matrixEditorReducer(acc, action), state);
    return {result, nextState};
}

test("pastes TSV block from selected origin", () => {
    let state = createInitialMatrixEditorState({rowCount: 3, columnCount: 3});
    state = matrixEditorReducer(state, {
        type: "selection/setActive",
        payload: {target: toSelectionTarget("body", "row_1", "column_1")},
    });

    const {result, nextState} = applyPaste(state, "1\t2\n3\t4");

    assert.equal(result.summary.parsedAs, "tsv");
    assert.equal(result.summary.applied, 4);
    assert.equal(nextState.grid.bodyCells[createBodyCellKey("row_1", "column_1")].value, 1);
    assert.equal(nextState.grid.bodyCells[createBodyCellKey("row_1", "column_2")].value, 2);
    assert.equal(nextState.grid.bodyCells[createBodyCellKey("row_2", "column_1")].value, 3);
    assert.equal(nextState.grid.bodyCells[createBodyCellKey("row_2", "column_2")].value, 4);
});

test("falls back to CSV and clips overflow safely", () => {
    let state = createInitialMatrixEditorState({rowCount: 2, columnCount: 2});
    state = matrixEditorReducer(state, {
        type: "selection/setActive",
        payload: {target: toSelectionTarget("body", "row_2", "column_2")},
    });

    const {result, nextState} = applyPaste(state, "10,20\n30,40");

    assert.equal(result.summary.parsedAs, "csv");
    assert.equal(result.summary.applied, 1);
    assert.equal(result.summary.clipped, 3);
    assert.equal(nextState.grid.bodyCells[createBodyCellKey("row_2", "column_2")].value, 10);
});

test("skips readonly/reference targets and invalid values with feedback", () => {
    let state = createInitialMatrixEditorState({rowCount: 2, columnCount: 2});
    const readonlyKey = createBodyCellKey("row_1", "column_2");
    state.grid.bodyCells[readonlyKey] = {
        ...state.grid.bodyCells[readonlyKey],
        kind: "reference",
    };

    state = matrixEditorReducer(state, {
        type: "selection/setActive",
        payload: {target: toSelectionTarget("body", "row_1", "column_1")},
    });

    const {result, nextState} = applyPaste(state, "7\t2\nbad\t3");

    assert.equal(result.summary.applied, 2);
    assert.equal(result.summary.skippedReadonly, 1);
    assert.equal(result.summary.skippedInvalidValue, 1);
    assert.equal(nextState.grid.bodyCells[createBodyCellKey("row_1", "column_1")].value, 7);
    assert.equal(nextState.grid.bodyCells[createBodyCellKey("row_2", "column_1")].value, null);
    assert.equal(nextState.grid.bodyCells[createBodyCellKey("row_2", "column_2")].value, 3);
    assert.equal((nextState.validation.globalIssues ?? []).length > 0, true);
});

test("paste without body selection is rejected with feedback", () => {
    const state = createInitialMatrixEditorState({rowCount: 2, columnCount: 2});
    const {result} = applyPaste(state, "1\t2");

    assert.equal(result.handled, false);
    assert.equal(result.summary.issues.length > 0, true);
});
