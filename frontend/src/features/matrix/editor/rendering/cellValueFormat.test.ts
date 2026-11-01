import assert from "node:assert/strict";
import test from "node:test";

import {formatLinkedBreakdown, formatLinkedFormula} from "./cellValueFormat";

test("linked cells show the share of the linked EV only when it is below 100%", () => {
    assert.equal(formatLinkedBreakdown({basePreValue: 2040, linkedExpectedValue: 433, weight: 0.62, finalValue: 2308.46}), "2040 damage + 62% × 433 EV mix");
    assert.equal(formatLinkedBreakdown({basePreValue: 1035.6, linkedExpectedValue: 432.7, weight: 1, finalValue: 1468.3}), "1036 damage + 433 EV mix");
    assert.equal(formatLinkedFormula(2040, 0.62, "Juri throw oki vs Ken (corner)"), "2040 + 62% × Juri throw oki vs Ken (corner)");
    assert.equal(formatLinkedFormula(null, undefined, "Juri throw oki vs Ken (corner)"), "Juri throw oki vs Ken (corner)");
});

test("an opponent-side link subtracts the opponent's EV", () => {
    assert.equal(
        formatLinkedBreakdown({basePreValue: -1200, linkedExpectedValue: 433, weight: 0.62, perspective: "opponent", finalValue: -1468.46}),
        "-1200 damage − 62% × 433 opponent EV mix"
    );
    assert.equal(formatLinkedFormula(-1200, 0.62, "Ken throw oki vs Juri", "opponent"), "-1200 − 62% × Ken throw oki vs Juri");
});
