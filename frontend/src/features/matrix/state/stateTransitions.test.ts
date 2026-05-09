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

test("add actions move selection to newly created row/column headers", () => {
    let state = createInitialMatrixEditorState({rowCount: 2, columnCount: 2});

    state = matrixEditorReducer(state, matrixActions.addRow());
    const addedRow = state.grid.rows[state.grid.rows.length - 1];
    assert.equal(state.selection.activeTarget?.zone, "rowSummary");
    if (state.selection.activeTarget?.zone === "rowSummary") {
        assert.equal(state.selection.activeTarget.rowId, addedRow.id);
    }

    state = matrixEditorReducer(state, matrixActions.addColumn());
    const addedColumn = state.grid.columns[state.grid.columns.length - 1];
    assert.equal(state.selection.activeTarget?.zone, "columnSummary");
    if (state.selection.activeTarget?.zone === "columnSummary") {
        assert.equal(state.selection.activeTarget.columnId, addedColumn.id);
    }
});

test("remove actions keep structural selection at same index or fallback to last", () => {
    let state = createInitialMatrixEditorState({rowCount: 3, columnCount: 3});

    const middleRowId = state.grid.rows[1].id;
    state = matrixEditorReducer(state, matrixActions.removeRow(middleRowId));
    assert.equal(state.selection.activeTarget?.zone, "rowSummary");
    if (state.selection.activeTarget?.zone === "rowSummary") {
        assert.equal(state.selection.activeTarget.rowId, state.grid.rows[1].id);
    }

    const lastRowId = state.grid.rows[state.grid.rows.length - 1].id;
    state = matrixEditorReducer(state, matrixActions.removeRow(lastRowId));
    assert.equal(state.selection.activeTarget?.zone, "rowSummary");
    if (state.selection.activeTarget?.zone === "rowSummary") {
        assert.equal(state.selection.activeTarget.rowId, state.grid.rows[state.grid.rows.length - 1].id);
    }

    const middleColumnId = state.grid.columns[1].id;
    state = matrixEditorReducer(state, matrixActions.removeColumn(middleColumnId));
    assert.equal(state.selection.activeTarget?.zone, "columnSummary");
    if (state.selection.activeTarget?.zone === "columnSummary") {
        assert.equal(state.selection.activeTarget.columnId, state.grid.columns[1].id);
    }

    const lastColumnId = state.grid.columns[state.grid.columns.length - 1].id;
    state = matrixEditorReducer(state, matrixActions.removeColumn(lastColumnId));
    assert.equal(state.selection.activeTarget?.zone, "columnSummary");
    if (state.selection.activeTarget?.zone === "columnSummary") {
        assert.equal(state.selection.activeTarget.columnId, state.grid.columns[state.grid.columns.length - 1].id);
    }
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

test("temporary invalid draft is allowed while editing without immediate error", () => {
    let state = createInitialMatrixEditorState({rowCount: 1, columnCount: 1});
    const onlyCell = selectBodyCellByIndex(state, 0, 0);
    assert.ok(onlyCell);

    state = matrixEditorReducer(state, matrixActions.startEditing(onlyCell.key, ""));
    state = matrixEditorReducer(state, matrixActions.updateDraft("-"));

    assert.equal(state.editing.mode, "edit");
    assert.equal(state.editing.draft, "-");
    assert.deepEqual(state.validation.byKey[onlyCell.key], []);
});

test("invalid commit keeps previous value and marks issue", () => {
    let state = createInitialMatrixEditorState({rowCount: 1, columnCount: 1});
    const onlyCell = selectBodyCellByIndex(state, 0, 0);
    assert.ok(onlyCell);

    state = matrixEditorReducer(state, matrixActions.setCellValue(onlyCell.key, 9));
    state = matrixEditorReducer(state, matrixActions.startEditing(onlyCell.key, "bad"));
    state = matrixEditorReducer(state, matrixActions.commitEditing());

    assert.equal(state.grid.bodyCells[onlyCell.key].value, 9);
    assert.equal(selectHasValidationErrors(state), true);
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

test("reference/computed cells are guarded from direct mutation", () => {
    let state = createInitialMatrixEditorState({rowCount: 1, columnCount: 1});
    const firstCell = selectBodyCellByIndex(state, 0, 0);
    assert.ok(firstCell);

    state.grid.bodyCells[firstCell.key] = {
        ...state.grid.bodyCells[firstCell.key],
        kind: "reference",
        value: 11,
        reference: {
            kind: "computed",
            scenarioId: "calc_1",
            cachedValue: 11,
            preValue: {kind: "none"},
        },
        dynamicCombo: null,
    };

    state = matrixEditorReducer(state, matrixActions.setCellValue(firstCell.key, 99));

    assert.equal(state.grid.bodyCells[firstCell.key].value, 11);
});

test("linkReferenceCell converts static cell to reference metadata", () => {
    let state = createInitialMatrixEditorState({rowCount: 1, columnCount: 1});
    const firstCell = selectBodyCellByIndex(state, 0, 0);
    assert.ok(firstCell);

    state = matrixEditorReducer(state, matrixActions.setCellValue(firstCell.key, 4));
    state = matrixEditorReducer(state, matrixActions.linkReferenceCell(firstCell.key, "42", "Corner Escape"));

    assert.equal(state.grid.bodyCells[firstCell.key].kind, "reference");
    assert.equal(state.grid.bodyCells[firstCell.key].reference?.scenarioId, "42");
    assert.equal(state.grid.bodyCells[firstCell.key].reference?.scenarioLabel, "Corner Escape");
    assert.equal(state.grid.bodyCells[firstCell.key].reference?.cachedValue, 4);
});

test("unlinkReferenceCell restores linked cell to static metadata", () => {
    let state = createInitialMatrixEditorState({rowCount: 1, columnCount: 1});
    const firstCell = selectBodyCellByIndex(state, 0, 0);
    assert.ok(firstCell);

    state = matrixEditorReducer(state, matrixActions.setCellValue(firstCell.key, 9));
    state = matrixEditorReducer(state, matrixActions.linkReferenceCell(firstCell.key, "42", "Corner Escape"));
    state = matrixEditorReducer(state, matrixActions.unlinkReferenceCell(firstCell.key));

    assert.equal(state.grid.bodyCells[firstCell.key].kind, "static");
    assert.equal(state.grid.bodyCells[firstCell.key].value, 9);
    assert.equal(state.grid.bodyCells[firstCell.key].reference, null);
    assert.equal(state.grid.bodyCells[firstCell.key].dynamicCombo, null);
});

test("setDynamicComboCell converts body cell to dynamic combo metadata", () => {
    let state = createInitialMatrixEditorState({rowCount: 1, columnCount: 1});
    const firstCell = selectBodyCellByIndex(state, 0, 0);
    assert.ok(firstCell);

    state = matrixEditorReducer(state, matrixActions.setCellValue(firstCell.key, 6));
    state = matrixEditorReducer(
        state,
        matrixActions.setDynamicComboCell(firstCell.key, {
            attackerCharacterId: "char_aki",
            starterMoveIds: ["move_st_lp", "move_cr_lp"],
            starterContext: {
                isPunishCounter: false,
                isCounterHit: true,
            },
        })
    );

    assert.equal(state.grid.bodyCells[firstCell.key].kind, "dynamic_combo");
    assert.equal(state.grid.bodyCells[firstCell.key].value, null);
    assert.equal(state.grid.bodyCells[firstCell.key].reference, null);
    assert.deepEqual(state.grid.bodyCells[firstCell.key].dynamicCombo, {
        attackerCharacterId: "char_aki",
        starterMoveIds: ["move_st_lp", "move_cr_lp"],
        starterContext: {
            isPunishCounter: false,
            isCounterHit: true,
        },
    });
});
