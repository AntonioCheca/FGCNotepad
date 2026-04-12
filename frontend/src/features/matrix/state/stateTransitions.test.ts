import assert from "node:assert/strict";
import test from "node:test";

import {
    selectBodyCellByIndex,
    selectColumnCount,
    selectGridValues,
    selectHasValidationErrors,
    selectIsEditing,
    selectRowCount,
} from "../model/selectors";
import {createInitialMatrixEditorState} from "./initialState";
import {matrixActions} from "./actions";
import {matrixEditorReducer} from "./reducer";

test("initial state creates rectangular grid with all slices", () => {
    const state = createInitialMatrixEditorState({rowCount: 3, columnCount: 2});

    assert.equal(selectRowCount(state), 3);
    assert.equal(selectColumnCount(state), 2);
    assert.equal(Object.keys(state.grid.bodyCells).length, 6);
    assert.equal(Object.keys(state.grid.rowSummaryCells).length, 3);
    assert.equal(Object.keys(state.grid.columnSummaryCells).length, 2);
    assert.equal(state.selection.activeTarget, null);
    assert.equal(state.editing.mode, "view");
});

test("row and column actions resize grid without legacy coupling", () => {
    let state = createInitialMatrixEditorState({rowCount: 2, columnCount: 2});

    state = matrixEditorReducer(state, matrixActions.addRow());
    state = matrixEditorReducer(state, matrixActions.addColumn());

    assert.equal(selectRowCount(state), 3);
    assert.equal(selectColumnCount(state), 3);
    assert.equal(Object.keys(state.grid.bodyCells).length, 9);

    const rowIdToRemove = state.grid.rows[0].id;
    const columnIdToRemove = state.grid.columns[0].id;

    state = matrixEditorReducer(state, matrixActions.removeRow(rowIdToRemove));
    state = matrixEditorReducer(state, matrixActions.removeColumn(columnIdToRemove));

    assert.equal(selectRowCount(state), 2);
    assert.equal(selectColumnCount(state), 2);
    assert.equal(Object.keys(state.grid.bodyCells).length, 4);
});

test("editing flow commits numeric draft into cell and marks dirty", () => {
    let state = createInitialMatrixEditorState({rowCount: 2, columnCount: 2});
    const firstCell = selectBodyCellByIndex(state, 0, 0);
    assert.ok(firstCell);

    state = matrixEditorReducer(state, matrixActions.startEditing(firstCell.key, ""));
    assert.equal(selectIsEditing(state), true);

    state = matrixEditorReducer(state, matrixActions.updateDraft("12.5"));
    state = matrixEditorReducer(state, matrixActions.commitEditing());

    const updatedCell = state.grid.bodyCells[firstCell.key];
    assert.equal(selectIsEditing(state), false);
    assert.equal(updatedCell.value, 12.5);
    assert.equal(state.derived.isDirty, true);
    assert.deepEqual(state.validation.byKey[firstCell.key], []);
});

test("invalid draft does not crash and records validation issue", () => {
    let state = createInitialMatrixEditorState({rowCount: 1, columnCount: 1});
    const onlyCell = selectBodyCellByIndex(state, 0, 0);
    assert.ok(onlyCell);

    state = matrixEditorReducer(state, matrixActions.startEditing(onlyCell.key, "bad-number"));
    state = matrixEditorReducer(state, matrixActions.commitEditing());

    assert.equal(selectHasValidationErrors(state), true);
    assert.equal(state.grid.bodyCells[onlyCell.key].value, null);
});

test("selectors return stable simple reads for components", () => {
    let state = createInitialMatrixEditorState({rowCount: 2, columnCount: 2});
    const firstCell = selectBodyCellByIndex(state, 0, 0);
    assert.ok(firstCell);

    state = matrixEditorReducer(state, matrixActions.setCellValue(firstCell.key, 7));
    const values = selectGridValues(state);

    assert.deepEqual(values, [
        [7, null],
        [null, null],
    ]);
});
