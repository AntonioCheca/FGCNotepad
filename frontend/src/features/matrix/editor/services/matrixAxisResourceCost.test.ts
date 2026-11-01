import assert from "node:assert/strict";
import test from "node:test";

import {createBodyCellKey} from "@/src/features/matrix/model";
import {createInitialMatrixEditorState} from "@/src/features/matrix/state";
import {axisPayoffAdjustment, withAxisResourceCosts} from "./matrixAxisResourceCost";
import {buildPayoffMatrix} from "./matrixSolveService";

test("drive and super requirements are priced like combo resources, signed by owner", () => {
    assert.equal(axisPayoffAdjustment({requirements: [{owner: "attacker", resource: "drive", operator: ">=", threshold: 2}]}), -400);
    assert.equal(axisPayoffAdjustment({requirements: [{owner: "defender", resource: "super", operator: ">=", threshold: 1}]}), 500);
    assert.equal(axisPayoffAdjustment({requirements: [{owner: "attacker", resource: "health", operator: ">=", threshold: 3000}]}), 0);
    assert.equal(axisPayoffAdjustment({
        requirements: [
            {owner: "attacker", resource: "drive", operator: ">=", threshold: 1},
            {owner: "attacker", resource: "super", operator: ">=", threshold: 3},
        ],
    }), -1700);
});

test("payoff matrix and expected-value inputs include row and column resource costs", () => {
    const state = createInitialMatrixEditorState({rowCount: 2, columnCount: 1});
    const [plain, driveReversal] = state.grid.rows;
    const [column] = state.grid.columns;
    driveReversal.requirements = [{owner: "attacker", resource: "drive", operator: ">=", threshold: 2}];
    column.requirements = [{owner: "defender", resource: "super", operator: ">=", threshold: 1}];
    const plainKey = createBodyCellKey(plain.id, column.id);
    const reversalKey = createBodyCellKey(driveReversal.id, column.id);
    const displayed = {[plainKey]: 1000, [reversalKey]: 1500};

    const payoff = buildPayoffMatrix({state, rows: state.grid.rows, columns: state.grid.columns, displayedBodyValues: displayed, dynamicOverrides: {}});
    assert.equal(payoff[plain.label || plain.id][column.label || column.id], 1500);
    assert.equal(payoff[driveReversal.label || driveReversal.id][column.label || column.id], 1600);

    const adjusted = withAxisResourceCosts(state, displayed);
    assert.equal(adjusted[plainKey], 1500);
    assert.equal(adjusted[reversalKey], 1600);
    assert.equal(displayed[reversalKey], 1500);
});
