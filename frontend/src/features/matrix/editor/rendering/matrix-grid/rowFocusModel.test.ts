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

test("outcomes follow the grid's value precedence", () => {
    const rows = buildRowFocusRows({
        grid,
        displayedBodyValues: {[key("r1", "c1")]: 150},
        displayLabelsByKey: {[key("r2", "c1")]: "Combo: 2100"},
        unavailableRowIds: new Set(),
        unavailableColumnIds: new Set(["c2"]),
    });

    assert.equal(rows[0].outcomes[0].display, "150");
    assert.equal(rows[1].outcomes[0].display, "Combo: 2100");
    assert.equal(rows[0].outcomes[1].unavailable, true);
});

test("default focus is the most played available row", () => {
    const rows = buildRowFocusRows({grid, displayedBodyValues: {}, displayLabelsByKey: {}, unavailableRowIds: new Set(["r2"]), unavailableColumnIds: new Set()});

    assert.equal(pickDefaultRowId(rows, {r1: 0.3, r2: 0.7}), "r1");
    assert.equal(pickDefaultRowId(rows, {}), "r1");
});
