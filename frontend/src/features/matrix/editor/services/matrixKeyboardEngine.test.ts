import assert from "node:assert/strict";
import test from "node:test";

import {createBodyCellKey, createColumnSummaryKey, createExpectedValueKey, createRowSummaryKey} from "../../model";
import {createInitialMatrixEditorState, matrixEditorReducer} from "../../state";
import {interpretMatrixKeyDown, toSelectionTarget} from "./matrixKeyboardEngine";

function applyKey(state: ReturnType<typeof createInitialMatrixEditorState>, key: string) {
    const outcome = interpretMatrixKeyDown(state, {key});
    const nextState = outcome.actions.reduce((acc, action) => matrixEditorReducer(acc, action), state);
    return {outcome, nextState};
}

test("enter on selected cell starts edit mode", () => {
    let state = createInitialMatrixEditorState({rowCount: 2, columnCount: 2});
    state = matrixEditorReducer(state, {
        type: "selection/setActive",
        payload: {target: toSelectionTarget("body", "row_1", "column_1")},
    });

    const {outcome, nextState} = applyKey(state, "Enter");

    assert.equal(outcome.handled, true);
    assert.equal(nextState.editing.mode, "edit");
    assert.equal(nextState.editing.activeKey, createBodyCellKey("row_1", "column_1"));
});

test("enter while editing commits and keeps selection", () => {
    let state = createInitialMatrixEditorState({rowCount: 1, columnCount: 1});
    const key = createBodyCellKey("row_1", "column_1");

    state = matrixEditorReducer(state, {
        type: "selection/setActive",
        payload: {target: toSelectionTarget("body", "row_1", "column_1")},
    });
    state = matrixEditorReducer(state, {type: "editing/start", payload: {key, draft: "5"}});

    const {nextState} = applyKey(state, "Enter");

    assert.equal(nextState.editing.mode, "view");
    assert.equal(nextState.grid.bodyCells[key].value, 5);
    assert.equal(nextState.selection.activeTarget?.key, key);
});

test("arrow keys move selection in view mode", () => {
    let state = createInitialMatrixEditorState({rowCount: 2, columnCount: 2});
    state = matrixEditorReducer(state, {
        type: "selection/setActive",
        payload: {target: toSelectionTarget("body", "row_1", "column_1")},
    });

    const right = applyKey(state, "ArrowRight").nextState;
    assert.equal(right.selection.activeTarget?.key, createBodyCellKey("row_1", "column_2"));

    const down = applyKey(right, "ArrowDown").nextState;
    assert.equal(down.selection.activeTarget?.key, createBodyCellKey("row_2", "column_2"));
});

test("typing in view mode starts overwrite edit mode", () => {
    let state = createInitialMatrixEditorState({rowCount: 1, columnCount: 1});
    state = matrixEditorReducer(state, {
        type: "selection/setActive",
        payload: {target: toSelectionTarget("body", "row_1", "column_1")},
    });

    const {nextState} = applyKey(state, "9");

    assert.equal(nextState.editing.mode, "edit");
    assert.equal(nextState.editing.draft, "9");
});

test("backspace clears selected editable cell", () => {
    let state = createInitialMatrixEditorState({rowCount: 1, columnCount: 1});
    const key = createBodyCellKey("row_1", "column_1");
    state = matrixEditorReducer(state, {type: "grid/setCellValue", payload: {key, value: 8}});
    state = matrixEditorReducer(state, {
        type: "selection/setActive",
        payload: {target: toSelectionTarget("body", "row_1", "column_1")},
    });

    const {nextState} = applyKey(state, "Backspace");

    assert.equal(nextState.grid.bodyCells[key].value, null);
});

test("escape cancels edit mode", () => {
    let state = createInitialMatrixEditorState({rowCount: 1, columnCount: 1});
    const key = createBodyCellKey("row_1", "column_1");
    state = matrixEditorReducer(state, {type: "editing/start", payload: {key, draft: "42"}});

    const {nextState} = applyKey(state, "Escape");

    assert.equal(nextState.editing.mode, "view");
    assert.equal(nextState.editing.activeKey, null);
});

test("arrow keys do not navigate while editing", () => {
    let state = createInitialMatrixEditorState({rowCount: 2, columnCount: 2});
    const key = createBodyCellKey("row_1", "column_1");
    state = matrixEditorReducer(state, {
        type: "selection/setActive",
        payload: {target: toSelectionTarget("body", "row_1", "column_1")},
    });
    state = matrixEditorReducer(state, {type: "editing/start", payload: {key, draft: "1"}});

    const {outcome, nextState} = applyKey(state, "ArrowRight");

    assert.equal(outcome.handled, false);
    assert.equal(nextState.selection.activeTarget?.key, key);
    assert.equal(nextState.editing.mode, "edit");
});

test("readonly expected value cannot be mutated", () => {
    let state = createInitialMatrixEditorState({rowCount: 1, columnCount: 1});
    state = matrixEditorReducer(state, {
        type: "selection/setActive",
        payload: {target: {zone: "expectedValue", key: createExpectedValueKey()}},
    });

    const keyPress = applyKey(state, "7");
    assert.equal(keyPress.nextState.editing.mode, "view");

    const del = applyKey(state, "Delete");
    assert.equal(del.nextState.grid.expectedValueCell.value, null);
    assert.equal((del.nextState.validation.byKey[createExpectedValueKey()] ?? [])[0]?.code, "readonly_cell");
});

test("summary cells can be edited via keyboard flows", () => {
    let state = createInitialMatrixEditorState({rowCount: 1, columnCount: 1});
    const rowSummaryKey = createRowSummaryKey("row_1");
    const columnSummaryKey = createColumnSummaryKey("column_1");

    state = matrixEditorReducer(state, {
        type: "selection/setActive",
        payload: {target: toSelectionTarget("rowSummary", "row_1")},
    });
    state = applyKey(state, "Enter").nextState;
    state = matrixEditorReducer(state, {type: "editing/updateDraft", payload: {draft: "0.4"}});
    state = applyKey(state, "Enter").nextState;

    assert.equal(state.grid.rowSummaryCells[rowSummaryKey].value, 0.4);

    state = matrixEditorReducer(state, {
        type: "selection/setActive",
        payload: {target: toSelectionTarget("columnSummary", "column_1")},
    });
    state = applyKey(state, "5").nextState;
    state = applyKey(state, "Enter").nextState;

    assert.equal(state.grid.columnSummaryCells[columnSummaryKey].value, 5);
});
