import assert from "node:assert/strict";
import test from "node:test";

import {parseClipboardData} from "./matrixClipboardParser";

test("parser prefers TSV when tabs exist", () => {
    const parsed = parseClipboardData("1\t2\n3\t4");

    assert.equal(parsed.delimiter, "tsv");
    assert.deepEqual(parsed.rows, [
        ["1", "2"],
        ["3", "4"],
    ]);
});

test("parser falls back to CSV with quoted values", () => {
    const parsed = parseClipboardData('"1,200",2\n3,"4"');

    assert.equal(parsed.delimiter, "csv");
    assert.deepEqual(parsed.rows, [
        ["1,200", "2"],
        ["3", "4"],
    ]);
});

test("parser keeps single-cell plain text", () => {
    const parsed = parseClipboardData("42");

    assert.equal(parsed.delimiter, "single");
    assert.deepEqual(parsed.rows, [["42"]]);
});
