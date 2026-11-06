import assert from "node:assert/strict";
import test from "node:test";

import type {ScenarioResourceContextPayload, ScenarioResourceGrid} from "@/hooks/useScenarios";
import {findResourceGridSolution, resourceGridIndex} from "./resourceGridLookup";

function solution(expectedValue: number) {
    return {expectedValue, rowAxis: [1], columnAxis: [1]};
}

const grid: ScenarioResourceGrid = {
    scenarioId: "scenario",
    computedAt: "2026-11-02T00:00:00+00:00",
    axes: {driveStep: 0.5, driveMax: 6, superMax: 3, cornerToggle: false, attackerObject: {key: "juri_fuha", name: "Fuha", max: 3}, defenderObject: null},
    solutions: [solution(100), solution(200), solution(300)],
    // 13 × 4 × 4 × 4 × 13 = 10,816 combinations; one block of 832 per defender Drive step.
    runs: [[0, 0], [832, 1], [3328, 2]],
};

function resources(defenderDrive: number, attackerStocks = 0, attackerDrive = 0): ScenarioResourceContextPayload {
    return {
        attacker: {health: 10000, drive: attackerDrive, super: 0, objectStatuses: {juri_fuha: attackerStocks}},
        defender: {health: 10000, drive: defenderDrive, super: 0, objectStatuses: {}},
    };
}

test("resource grid index follows the backend axis order", () => {
    assert.equal(resourceGridIndex(grid, resources(0)), 0);
    assert.equal(resourceGridIndex(grid, resources(0, 0, 0.5)), 1);
    assert.equal(resourceGridIndex(grid, resources(0, 1)), 4 * 13);
    assert.equal(resourceGridIndex(grid, resources(0.5)), 832);
    assert.equal(resourceGridIndex(grid, resources(6, 3, 6)), 12 * 832 + 3 * 52 + 12);
});

test("resource grid lookup finds the run that holds the index", () => {
    assert.equal(findResourceGridSolution(grid, resources(0))?.expectedValue, 100);
    assert.equal(findResourceGridSolution(grid, resources(1.5, 3, 6))?.expectedValue, 200);
    assert.equal(findResourceGridSolution(grid, resources(2))?.expectedValue, 300);
});

test("the corner combos axis is outermost and ignored without cornerToggle", () => {
    const withCorner: ScenarioResourceGrid = {...grid, axes: {...grid.axes, cornerToggle: true}};
    assert.equal(resourceGridIndex(withCorner, resources(0), true), 10816);
    assert.equal(resourceGridIndex(withCorner, resources(0.5, 1), true), 10816 + 832 + 52);
    assert.equal(resourceGridIndex(grid, resources(0.5), true), 832);
});

test("resource grid lookup clamps values outside the axes", () => {
    assert.equal(resourceGridIndex(grid, resources(9, 7, -1)), resourceGridIndex(grid, resources(6, 3, 0)));
});
