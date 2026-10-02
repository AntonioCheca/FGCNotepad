import assert from "node:assert/strict";
import test from "node:test";

import {damageSegments, filterGraphByLayer, highestLayer, layoutPressureGraph} from "./pressureGraphModel";
import type {PressureGraphData} from "./pressureGraphTypes";

const node = (id: string, layer: 1 | 2 | 3 = 1) => ({id, notation: id, name: null, layer, damageDealt: null, damageReceived: null});
const edge = (from: string, to: string, layer: 1 | 2 | 3 = 1) => ({id: `${from}-${to}`, from, to, kind: "normal" as const, readLabel: null, layer});

const graph: PressureGraphData = {
    nodes: [node("a"), node("b"), node("c", 2), node("d", 3)],
    edges: [edge("a", "b"), edge("b", "a", 2), edge("b", "c"), edge("c", "d", 3)],
};

test("layer filters are cumulative and drop edges to hidden nodes", () => {
    const layerOne = filterGraphByLayer(graph, 1);
    assert.deepEqual(layerOne.nodes.map((item) => item.id), ["a", "b"]);
    assert.deepEqual(layerOne.edges.map((item) => item.id), ["a-b"]);

    const layerTwo = filterGraphByLayer(graph, 2);
    assert.deepEqual(layerTwo.nodes.map((item) => item.id), ["a", "b", "c"]);
    assert.deepEqual(layerTwo.edges.map((item) => item.id), ["a-b", "b-a", "b-c"]);

    assert.equal(filterGraphByLayer(graph, "all"), graph);
});

test("highest layer considers nodes and edges", () => {
    assert.equal(highestLayer(graph), 3);
    assert.equal(highestLayer({nodes: [node("a")], edges: [edge("a", "a", 2)]}), 2);
    assert.equal(highestLayer({nodes: [], edges: []}), 1);
});

test("damage is split into 1000-point segments", () => {
    assert.deepEqual(damageSegments(2400).map((segment) => segment.fill), [1, 1, 0.4]);
    assert.deepEqual(damageSegments(3000).map((segment) => segment.start), [0, 1000, 2000]);
    assert.deepEqual(damageSegments(0), []);
});

test("layout places every node, survives loops and orders ranks left to right", () => {
    const looped: PressureGraphData = {nodes: graph.nodes, edges: [...graph.edges, edge("d", "d")]};
    const layout = layoutPressureGraph(looped, () => ({width: 100, height: 40}), "LR");

    assert.equal(layout.positions.size, 4);
    assert.equal(layout.routes.size, 4, "every edge except the self-loop is routed");
    assert.ok(layout.routes.get("b-a")!.points.length >= 2);
    assert.ok(layout.positions.get("a")!.x < layout.positions.get("c")!.x);
    assert.ok(layout.positions.get("c")!.x < layout.positions.get("d")!.x);
    assert.ok(layout.width >= 400 && layout.height >= 40);

    const vertical = layoutPressureGraph(looped, () => ({width: 100, height: 40}), "TB");
    assert.ok(vertical.positions.get("a")!.y < vertical.positions.get("d")!.y);
});
