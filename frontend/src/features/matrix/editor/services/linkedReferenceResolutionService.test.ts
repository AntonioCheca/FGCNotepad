import assert from "node:assert/strict";
import test from "node:test";

import {createInitialMatrixEditorState, matrixEditorReducer} from "@/src/features/matrix/state";
import {matrixActions} from "@/src/features/matrix/state/actions";
import {resolveEditorLinkedReferences} from "./linkedReferenceResolutionService";

// A 1x1 game: the only cell is the EV.
async function solveOnlyCell(payoffMatrix: Record<string, Record<string, number>>) {
    const row = Object.keys(payoffMatrix)[0];
    const column = Object.keys(payoffMatrix[row])[0];
    return {equilibria: [{P1: {[row]: 1}, P2: {[column]: 1}}]};
}

test("a self-link runs a fixed number of passes instead of recursing", async () => {
    let state = createInitialMatrixEditorState({rowCount: 1, columnCount: 1});
    const key = Object.keys(state.grid.bodyCells)[0];
    state = matrixEditorReducer(state, matrixActions.linkReferenceCell(key, "self", "Ken corner throw oki"));
    state = matrixEditorReducer(state, matrixActions.setReferencePreValue(key, {kind: "static", staticValue: 1000}));
    state = matrixEditorReducer(state, matrixActions.setReferenceWeight(key, 0.5));

    // v = 1000 + 0.5v from 1000: 1500, 1750, then 1875 after the third pass.
    const resolutions = await resolveEditorLinkedReferences({
        state,
        currentScenarioId: "self",
        baseDisplayedBodyValues: {},
        existingResolutions: {},
        solveGame: solveOnlyCell,
    });

    assert.deepEqual(resolutions[key], {basePreValue: 1000, linkedExpectedValue: 1750, weight: 0.5, perspective: "same", finalValue: 1875});
});
