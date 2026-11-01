import assert from "node:assert/strict";
import test from "node:test";

import {serializeMatrixPayload} from "../../serialization/serializeMatrixPayload";
import {matrixActions, matrixEditorReducer} from "../../state";
import {matrixEditorStateToPayload, matrixPayloadToEditorState} from "./payloadAdapter";

test("payload adapter keeps matrix dimensions and core values", () => {
    const payload = serializeMatrixPayload({
        rows: ["A", "B"],
        columns: ["X", "Y"],
        rowLayers: [1, 4],
        columnLayers: [2, 5],
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
    assert.deepEqual(roundTrip.axes.rowLayers, [1, 4]);
    assert.deepEqual(roundTrip.axes.columnLayers, [2, 5]);
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

test("payload adapter preserves reference pre-value metadata", () => {
    const payload = serializeMatrixPayload({
        rows: ["R1"],
        columns: ["C1"],
        values: [[null]],
        bodyCellTypes: [["reference"]],
        bodyCellMetadata: [[{
            scenarioId: "scn_loop",
            scenarioLabel: "Throw Loop",
            cachedValue: null,
            referenceKind: "reference",
            preValue: {
                kind: "static",
                staticValue: 1200,
            },
        }]],
        metadata: {matrixId: "mx_reference_pre_value"},
    });

    const state = matrixPayloadToEditorState(payload);
    const cell = state.grid.bodyCells["body::row_1::column_1"];

    assert.equal(cell.kind, "reference");
    assert.deepEqual(cell.reference?.preValue, {kind: "static", staticValue: 1200});

    const roundTrip = matrixEditorStateToPayload(state, payload);
    assert.deepEqual(roundTrip.cells[0][0].metadata?.preValue, {kind: "static", staticValue: 1200});
});

test("payload adapter keeps linked scenario metadata after solve cache updates", () => {
    const payload = serializeMatrixPayload({
        rows: ["R1"],
        columns: ["C1"],
        values: [[1200]],
        bodyCellTypes: [["reference"]],
        bodyCellMetadata: [[{
            scenarioId: "scn_loop",
            scenarioLabel: "Throw Loop",
            cachedValue: 1200,
            referenceKind: "reference",
            preValue: {
                kind: "static",
                staticValue: 1200,
            },
        }]],
        metadata: {matrixId: "mx_reference_solved"},
    });

    const state = matrixEditorReducer(
        matrixPayloadToEditorState(payload),
        matrixActions.updateReferenceCache("body::row_1::column_1", 1800)
    );
    const roundTrip = matrixEditorStateToPayload(state, payload);

    assert.equal(roundTrip.cells[0][0].cellType, "reference");
    assert.equal(roundTrip.cells[0][0].value, 1800);
    assert.equal(roundTrip.cells[0][0].metadata?.scenarioId, "scn_loop");
    assert.equal(roundTrip.cells[0][0].metadata?.cachedValue, 1800);
    assert.deepEqual(roundTrip.cells[0][0].metadata?.preValue, {kind: "static", staticValue: 1200});
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

test("payload adapter keeps the perfect parry starter context through an editor round trip", () => {
    const starterContext = {isPunishCounter: true, isCounterHit: false, isPerfectParry: true};
    const payload = serializeMatrixPayload({
        rows: ["R1"],
        columns: ["C1"],
        values: [[null]],
        bodyCellTypes: [["dynamic_combo"]],
        bodyCellDynamicCombos: [[{attackerCharacterId: "char_juri", starterMoveIds: ["st_hp"], starterContext}]],
        metadata: {matrixId: "mx_perfect_parry_adapter"},
    });

    const roundTrip = matrixEditorStateToPayload(matrixPayloadToEditorState(payload), payload);

    assert.deepEqual(roundTrip.cells[0][0].dynamicCombo?.starterContext, starterContext);
});

test("payload adapter keeps imported seen stats and leaves them out for site-made matrices", () => {
    const base = {rows: ["Meaty", "Throw"], columns: ["Block"], values: [[0], [1200]], metadata: {matrixId: "mx_seen"}};
    const imported = serializeMatrixPayload({...base, rowSeenStats: [{frequency: 0.46, sampleCount: 57}, null], columnSeenStats: [{frequency: 0.52, sampleCount: null}]});

    const state = matrixPayloadToEditorState(imported);
    assert.deepEqual(state.grid.rows[0].seenStats, {frequency: 0.46, sampleCount: 57});
    assert.equal(state.grid.rows[1].seenStats, null);

    const roundTrip = matrixEditorStateToPayload(state, imported);
    assert.deepEqual(roundTrip.axes.rowSeenStats, [{frequency: 0.46, sampleCount: 57}, null]);
    assert.deepEqual(roundTrip.axes.columnSeenStats, [{frequency: 0.52, sampleCount: null}]);

    const siteMade = matrixEditorStateToPayload(matrixPayloadToEditorState(serializeMatrixPayload(base)));
    assert.equal(siteMade.axes.rowSeenStats, undefined);
});

test("payload adapter keeps a reference weight and defaults it to 1", () => {
    const reference = (weight?: number) => ({scenarioId: "linked", referenceKind: "reference", preValue: {kind: "static", staticValue: 2040}, ...(weight === undefined ? {} : {weight})});
    const payload = serializeMatrixPayload({
        rows: ["Throw"],
        columns: ["Parry", "Block"],
        values: [[2308.46, 2473]],
        bodyCellTypes: [["reference", "reference"]],
        bodyCellMetadata: [[reference(0.62), reference()]],
        metadata: {matrixId: "mx_weight"},
    });

    const state = matrixPayloadToEditorState(payload);
    assert.equal(state.grid.bodyCells["body::row_1::column_1"].reference?.weight, 0.62);
    assert.equal(state.grid.bodyCells["body::row_1::column_2"].reference?.weight, 1);

    const roundTrip = matrixEditorStateToPayload(state, payload);
    assert.equal(roundTrip.cells[0][0].metadata?.weight, 0.62);
    assert.equal(roundTrip.cells[0][1].metadata?.weight, 1);
});

test("payload adapter keeps an opponent-side reference and defaults to the same side", () => {
    const reference = (perspective?: string) => ({scenarioId: "linked", referenceKind: "reference", preValue: {kind: "static", staticValue: -1200}, ...(perspective === undefined ? {} : {perspective})});
    const payload = serializeMatrixPayload({
        rows: ["Meaty"],
        columns: ["Ken throws", "Block"],
        values: [[-1468, 0]],
        bodyCellTypes: [["reference", "reference"]],
        bodyCellMetadata: [[reference("opponent"), reference()]],
        metadata: {matrixId: "mx_perspective"},
    });

    const state = matrixPayloadToEditorState(payload);
    assert.equal(state.grid.bodyCells["body::row_1::column_1"].reference?.perspective, "opponent");
    assert.equal(state.grid.bodyCells["body::row_1::column_2"].reference?.perspective, "same");

    const roundTrip = matrixEditorStateToPayload(state, payload);
    assert.equal(roundTrip.cells[0][0].metadata?.perspective, "opponent");
    assert.equal(roundTrip.cells[0][1].metadata?.perspective, "same");
});
