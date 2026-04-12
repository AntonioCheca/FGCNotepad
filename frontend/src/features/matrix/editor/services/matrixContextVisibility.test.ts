import assert from "node:assert/strict";
import test from "node:test";

import {deriveActiveAxisContext} from "./matrixContextVisibility";

test("body target exposes both active row and column", () => {
    const context = deriveActiveAxisContext({
        zone: "body",
        key: "body::r1::c1",
        rowId: "r1",
        columnId: "c1",
    });

    assert.equal(context.activeRowId, "r1");
    assert.equal(context.activeColumnId, "c1");
});

test("row summary target exposes row only", () => {
    const context = deriveActiveAxisContext({
        zone: "rowSummary",
        key: "row-summary::r2",
        rowId: "r2",
    });

    assert.equal(context.activeRowId, "r2");
    assert.equal(context.activeColumnId, null);
});

test("column summary target exposes column only", () => {
    const context = deriveActiveAxisContext({
        zone: "columnSummary",
        key: "column-summary::c3",
        columnId: "c3",
    });

    assert.equal(context.activeRowId, null);
    assert.equal(context.activeColumnId, "c3");
});

test("expected value and null target clear axis context", () => {
    const expectedContext = deriveActiveAxisContext({
        zone: "expectedValue",
        key: "expected-value",
    });
    const emptyContext = deriveActiveAxisContext(null);

    assert.equal(expectedContext.activeRowId, null);
    assert.equal(expectedContext.activeColumnId, null);
    assert.equal(emptyContext.activeRowId, null);
    assert.equal(emptyContext.activeColumnId, null);
});
