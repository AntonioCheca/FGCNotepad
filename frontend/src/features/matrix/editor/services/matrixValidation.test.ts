import assert from "node:assert/strict";
import test from "node:test";

import {isTemporarilyValidNumericDraft, validateCommittedNumericDraft} from "./matrixValidation";

test("supports approved numeric formats", () => {
    assert.equal(validateCommittedNumericDraft("12").issues.length, 0);
    assert.equal(validateCommittedNumericDraft("-3").issues.length, 0);
    assert.equal(validateCommittedNumericDraft("0.25").issues.length, 0);
    assert.equal(validateCommittedNumericDraft(".5").issues.length, 0);
});

test("temporary draft states are allowed while editing", () => {
    assert.equal(isTemporarilyValidNumericDraft("-"), true);
    assert.equal(isTemporarilyValidNumericDraft("."), true);
    assert.equal(isTemporarilyValidNumericDraft("-."), true);
    assert.equal(isTemporarilyValidNumericDraft("1."), true);
});

test("committing invalid values returns explicit issue", () => {
    const invalid = validateCommittedNumericDraft("1..2");
    assert.equal(invalid.issues.length > 0, true);
    assert.equal(invalid.issues[0].code, "invalid_number");

    const incomplete = validateCommittedNumericDraft("-");
    assert.equal(incomplete.issues.length > 0, true);
    assert.equal(incomplete.isTemporaryDraft, true);
});
