import assert from "node:assert/strict";
import test from "node:test";

import {serializeMatrixPayload} from "../../serialization/serializeMatrixPayload";
import {matrixActions, matrixEditorReducer} from "../../state";
import {matrixPayloadToEditorState} from "../modules/payloadAdapter";
import {extractDynamicComboRefreshOverrides} from "./useDynamicComboResolver";

test("dynamic combo refresh only applies dynamic values and preserves linked cells", () => {
    const currentState = matrixPayloadToEditorState(serializeMatrixPayload({
        rows: ["R1"],
        columns: ["C1", "C2"],
        values: [[1200, null]],
        bodyCellTypes: [["reference", "dynamic_combo"]],
        bodyCellMetadata: [[{
            scenarioId: "scn_linked",
            scenarioLabel: "Linked scenario",
            cachedValue: 1800,
            referenceKind: "reference",
            preValue: {kind: "static", staticValue: 1200},
        }, undefined]],
        bodyCellDynamicCombos: [[undefined, {
            attackerCharacterId: "char_attacker",
            starterMoveIds: ["move_1"],
            starterContext: {isPunishCounter: false, isCounterHit: false},
        }]],
        metadata: {matrixId: "mx_current"},
    }));

    const refreshedState = matrixPayloadToEditorState(serializeMatrixPayload({
        rows: ["R1"],
        columns: ["C1", "C2"],
        values: [[1200, 340]],
        bodyCellTypes: [["value", "dynamic_combo"]],
        bodyCellDynamicCombos: [[undefined, {
            attackerCharacterId: "char_attacker",
            starterMoveIds: ["move_1"],
            starterContext: {isPunishCounter: false, isCounterHit: false},
        }]],
        metadata: {matrixId: "mx_refreshed"},
    }));

    const overrides = extractDynamicComboRefreshOverrides(currentState, refreshedState);
    const nextState = Object.entries(overrides).reduce(
        (state, [key, value]) => matrixEditorReducer(state, matrixActions.setDynamicComboResolvedValue(key, value)),
        currentState
    );

    assert.deepEqual(overrides, {"body::row_1::column_2": 340});
    assert.equal(nextState.grid.bodyCells["body::row_1::column_1"].kind, "reference");
    assert.equal(nextState.grid.bodyCells["body::row_1::column_1"].reference?.scenarioId, "scn_linked");
    assert.equal(nextState.grid.bodyCells["body::row_1::column_2"].value, 340);
});
