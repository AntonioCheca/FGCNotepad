import assert from "node:assert/strict";
import test from "node:test";

import {createBodyCellKey as key} from "../../../model/keys";
import {buildRowFocusRows, pickDefaultRowId} from "./rowFocusModel";

const grid = {
    rows: [{id: "r1", label: "Block"}, {id: "r2", label: "Jump"}],
    columns: [{id: "c1", label: "Meaty"}, {id: "c2", label: "Throw"}],
    bodyCells: {[key("r1", "c1")]: {value: 0}, [key("r1", "c2")]: {value: -1200}, [key("r2", "c1")]: {value: null}, [key("r2", "c2")]: {value: 300}},
    rowSummaryCells: {},
    columnSummaryCells: {},
} as never;

test("outcomes follow the grid's value precedence and break linked totals down", () => {
    const rows = buildRowFocusRows({
        grid,
        displayedBodyValues: {[key("r1", "c1")]: 150, [key("r2", "c1")]: 2100.25},
        linkedResolutionsByKey: {
            [key("r2", "c1")]: {basePreValue: 1500.4, linkedExpectedValue: 599.85, weight: 1, finalValue: 2100.25},
            [key("r2", "c2")]: {basePreValue: 2040, linkedExpectedValue: 433, weight: 0.62, finalValue: 2308.46},
        },
        unavailableRowIds: new Set(),
        unavailableColumnIds: new Set(["c2"]),
    });

    assert.equal(rows[0].outcomes[0].display, "150");
    assert.equal(rows[1].outcomes[0].display, "2100.25");
    assert.equal(rows[1].outcomes[0].breakdown, "1500 damage + 600 EV mix");
    assert.equal(rows[0].outcomes[0].breakdown, null);
    assert.equal(rows[1].outcomes[1].breakdown, "2040 damage + 62% × 433 EV mix");
    assert.equal(rows[0].outcomes[1].unavailable, true);
});

test("default focus is the most played available row", () => {
    const rows = buildRowFocusRows({grid, displayedBodyValues: {}, linkedResolutionsByKey: {}, unavailableRowIds: new Set(["r2"]), unavailableColumnIds: new Set()});

    assert.equal(pickDefaultRowId(rows, {r1: 0.3, r2: 0.7}), "r1");
    assert.equal(pickDefaultRowId(rows, {}), "r1");
});
