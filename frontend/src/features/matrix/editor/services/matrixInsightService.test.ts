import assert from "node:assert/strict";
import test from "node:test";

import {createInitialMatrixEditorState} from "@/src/features/matrix/state";
import {buildMatrixInsights} from "./matrixInsightService";

test("mixes order by Nash share, then seen share, and color options by that rank", () => {
    const state = createInitialMatrixEditorState({rowCount: 3, columnCount: 1});
    const [meaty, throwRow, shimmy] = state.grid.rows;
    meaty.seenStats = {frequency: 0.36, sampleCount: 407};
    throwRow.seenStats = {frequency: 0.5, sampleCount: 407};
    state.grid.rowSummaryCells[`row-summary::${meaty.id}`] = {key: `row-summary::${meaty.id}`, value: 0.4};
    state.grid.rowSummaryCells[`row-summary::${throwRow.id}`] = {key: `row-summary::${throwRow.id}`, value: 0.6};
    state.grid.rowSummaryCells[`row-summary::${shimmy.id}`] = {key: `row-summary::${shimmy.id}`, value: 0};

    const {attackerMix} = buildMatrixInsights(state, {}, null);

    assert.deepEqual(attackerMix.map((option) => [option.id, option.colorIndex, option.seen, option.seenSampleCount]), [
        [throwRow.id, 0, 0.5, 407],
        [meaty.id, 1, 0.36, 407],
        [shimmy.id, 2, null, null],
    ]);
});
