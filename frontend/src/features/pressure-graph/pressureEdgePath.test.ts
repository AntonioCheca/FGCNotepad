import assert from "node:assert/strict";
import test from "node:test";

import {routedEdgePath, selfLoopPath} from "./pressureEdgePath";

test("routed edges pass through every dagre point", () => {
    const edge = routedEdgePath([{x: 0, y: 0}, {x: 100, y: 50}, {x: 200, y: 0}], null);

    assert.match(edge.path, /^M 0,0 C .* 100,50 C .* 200,0$/);
    assert.deepEqual([edge.labelX, edge.labelY], [100, 50]);
});

test("routed edges use the label position dagre reserved", () => {
    const edge = routedEdgePath([{x: 0, y: 0}, {x: 200, y: 0}], {x: 90, y: 12});

    assert.deepEqual([edge.labelX, edge.labelY], [90, 12]);
});

test("self loops arc beside the node away from the flow", () => {
    const horizontal = selfLoopPath({x: 100, y: 30}, {x: 0, y: 30}, "LR");
    const vertical = selfLoopPath({x: 60, y: 100}, {x: 60, y: 40}, "TB");

    assert.ok(horizontal.labelY > 30 + 30);
    assert.ok(vertical.labelX > 60 + 30);
});
