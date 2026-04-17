import assert from "node:assert/strict";
import test from "node:test";

import {serializeMatrixPayload} from "../../serialization/serializeMatrixPayload";
import {matrixEditorStateToPayload, matrixPayloadToEditorState} from "./payloadAdapter";

test("payload adapter keeps matrix dimensions and core values", () => {
    const payload = serializeMatrixPayload({
        rows: ["A", "B"],
        columns: ["X", "Y"],
        values: [
            [1, 2],
            [3, 4],
        ],
        rowFrequencies: [0.7, 0.3],
        columnFrequencies: [0.2, 0.8],
        expectedValue: 2.9,
        metadata: {matrixId: "mx_adapter"},
    });

    const state = matrixPayloadToEditorState(payload);
    const roundTrip = matrixEditorStateToPayload(state, payload);

    assert.deepEqual(roundTrip.axes.rows, ["A", "B"]);
    assert.deepEqual(roundTrip.axes.columns, ["X", "Y"]);
    assert.equal(roundTrip.cells[0][0].value, 1);
    assert.equal(roundTrip.cells[1][1].value, 4);
    assert.equal(roundTrip.summary.rowAxis[0].value, 0.7);
    assert.equal(roundTrip.summary.columnAxis[1].value, 0.8);
});

test("payload adapter preserves reference/computed cell types", () => {
    const payload = serializeMatrixPayload({
        rows: ["R1"],
        columns: ["C1", "C2"],
        values: [[5, 9]],
        bodyCellTypes: [["reference", "computed"]],
        metadata: {matrixId: "mx_types"},
    });

    const state = matrixPayloadToEditorState(payload);

    assert.equal(state.grid.bodyCells["body::row_1::column_1"].kind, "reference");
    assert.equal(state.grid.bodyCells["body::row_1::column_1"].reference?.kind, "reference");
    assert.equal(state.grid.bodyCells["body::row_1::column_2"].kind, "reference");
    assert.equal(state.grid.bodyCells["body::row_1::column_2"].reference?.kind, "computed");

    const roundTrip = matrixEditorStateToPayload(state, payload);
    assert.equal(roundTrip.cells[0][0].cellType, "reference");
    assert.equal(roundTrip.cells[0][1].cellType, "computed");
});

test("payload adapter preserves dynamic combo cells", () => {
    const payload = serializeMatrixPayload({
        rows: ["R1"],
        columns: ["C1"],
        values: [[null]],
        bodyCellTypes: [["dynamic_combo"]],
        bodyCellDynamicCombos: [[{
            attackerCharacterId: "char_juri",
            starterMoveIds: ["st_lp", "cr_lp"],
            starterContext: {
                isPunishCounter: true,
                isCounterHit: false,
            },
        }]],
        metadata: {matrixId: "mx_dynamic_adapter"},
    });

    const state = matrixPayloadToEditorState(payload);
    const cell = state.grid.bodyCells["body::row_1::column_1"];

    assert.equal(cell.kind, "dynamic_combo");
    assert.deepEqual(cell.dynamicCombo, {
        attackerCharacterId: "char_juri",
        starterMoveIds: ["st_lp", "cr_lp"],
        starterContext: {
            isPunishCounter: true,
            isCounterHit: false,
        },
    });

    const roundTrip = matrixEditorStateToPayload(state, payload);
    assert.equal(roundTrip.cells[0][0].cellType, "dynamic_combo");
    assert.deepEqual(roundTrip.cells[0][0].dynamicCombo, {
        attackerCharacterId: "char_juri",
        starterMoveIds: ["st_lp", "cr_lp"],
        starterContext: {
            isPunishCounter: true,
            isCounterHit: false,
        },
    });
});
