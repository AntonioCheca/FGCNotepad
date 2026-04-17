import assert from "node:assert/strict";
import test from "node:test";

import {deserializeMatrixPayload, toEditorState} from "./deserializeMatrixPayload";
import {serializeMatrixPayload} from "./serializeMatrixPayload";

test("serialize + deserialize preserves matrix data", () => {
    const payload = serializeMatrixPayload({
        rows: ["2MK", "Throw"],
        columns: ["Backdash", "Mash"],
        values: [
            [2, -1],
            [3, 0],
        ],
        rowFrequencies: [0.6, 0.4],
        columnFrequencies: [0.2, 0.8],
        expectedValue: 0.44,
        metadata: {
            matrixId: "mx_roundtrip",
        },
    });

    const deserialized = deserializeMatrixPayload(payload);
    const editorState = toEditorState(deserialized.payload);

    assert.equal(deserialized.isValid, true);
    assert.deepEqual(editorState.rows, ["2MK", "Throw"]);
    assert.deepEqual(editorState.columns, ["Backdash", "Mash"]);
    assert.deepEqual(editorState.values, [
        [2, -1],
        [3, 0],
    ]);
    assert.deepEqual(editorState.rowFrequencies, [0.6, 0.4]);
    assert.deepEqual(editorState.columnFrequencies, [0.2, 0.8]);
    assert.equal(editorState.expectedValue, 0.44);
});

test("deserializer repairs non-rectangular cell matrix", () => {
    const result = deserializeMatrixPayload({
        kind: "matrix-editor",
        schemaVersion: 1,
        axes: {
            rows: ["R1", "R2"],
            columns: ["C1", "C2", "C3"],
        },
        cells: [
            [{cellType: "value", dataType: "number", value: 10}],
        ],
        summary: {
            rowAxis: [{cellType: "summary", dataType: "number", value: 0.5}],
            columnAxis: [],
            expectedValue: {cellType: "summary", dataType: "number", value: 1},
        },
        metadata: {
            matrixId: "mx_repair",
        },
    });

    const editorState = toEditorState(result.payload);

    assert.deepEqual(editorState.values, [
        [10, 0, 0],
        [0, 0, 0],
    ]);
    assert.deepEqual(editorState.rowFrequencies, [0.5, ""]);
    assert.deepEqual(editorState.columnFrequencies, ["", "", ""]);
    assert.equal(result.issues.length > 0, true);
});

test("invalid payload fails gracefully with safe fallback", () => {
    const result = deserializeMatrixPayload({
        kind: "legacy-matrix",
        schemaVersion: 999,
    });

    const editorState = toEditorState(result.payload);

    assert.equal(result.isValid, false);
    assert.equal(result.issues.length > 0, true);
    assert.equal(editorState.rows.length > 0, true);
    assert.equal(editorState.columns.length > 0, true);
});

test("serialize + deserialize keeps explicit body cell types", () => {
    const payload = serializeMatrixPayload({
        rows: ["R1"],
        columns: ["C1", "C2"],
        values: [[1, 2]],
        bodyCellTypes: [["reference", "computed"]],
        metadata: {matrixId: "mx_cell_types"},
    });

    const deserialized = deserializeMatrixPayload(payload);

    assert.equal(deserialized.payload.cells[0][0].cellType, "reference");
    assert.equal(deserialized.payload.cells[0][1].cellType, "computed");
});

test("serialize + deserialize preserves dynamic combo payload", () => {
    const payload = serializeMatrixPayload({
        rows: ["R1"],
        columns: ["C1"],
        values: [[null]],
        bodyCellTypes: [["dynamic_combo"]],
        bodyCellDynamicCombos: [[{
            attackerCharacterId: "char_aki",
            starterMoveIds: ["move_st_lp", "move_cr_lp"],
            starterContext: {
                isPunishCounter: false,
                isCounterHit: true,
            },
        }]],
        metadata: {matrixId: "mx_dynamic_combo"},
    });

    const deserialized = deserializeMatrixPayload(payload);
    const cell = deserialized.payload.cells[0][0];

    assert.equal(cell.cellType, "dynamic_combo");
    assert.equal(cell.value, null);
    assert.deepEqual(cell.dynamicCombo, {
        attackerCharacterId: "char_aki",
        starterMoveIds: ["move_st_lp", "move_cr_lp"],
        starterContext: {
            isPunishCounter: false,
            isCounterHit: true,
        },
    });
});
