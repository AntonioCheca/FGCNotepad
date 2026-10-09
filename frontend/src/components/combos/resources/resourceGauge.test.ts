import assert from "node:assert/strict";
import test from "node:test";

import {driveGaugeSegments, parseGaugeValue, superGaugeParts} from "./resourceGauge";

test("drive gain splits into full bars and the real remainder", () => {
    const fills = (value: number) => driveGaugeSegments(value).map((segment) => segment.fill);

    assert.deepEqual(fills(2.5), [1, 1, 0.5]);
    assert.deepEqual(fills(3), [1, 1, 1]);
    assert.deepEqual(fills(0.3), [0.3]);
    assert.deepEqual(fills(0), []);
    assert.deepEqual(fills(1.1 + 1.2), [1, 1, 0.3]);
    assert.deepEqual(driveGaugeSegments(2.5).map((segment) => segment.bar), [1, 2, 3]);
});

test("super gain is completed bars plus the fraction of the next bar", () => {
    assert.deepEqual(superGaugeParts(1.5), {completedBars: 1, fraction: 0.5});
    assert.deepEqual(superGaugeParts(0.25), {completedBars: 0, fraction: 0.25});
    assert.deepEqual(superGaugeParts(2), {completedBars: 2, fraction: 0});
});

test("missing values are not gauges", () => {
    assert.equal(parseGaugeValue("-"), null);
    assert.equal(parseGaugeValue(""), null);
    assert.equal(parseGaugeValue("1.25"), 1.25);
    assert.equal(parseGaugeValue(0), 0);
});
