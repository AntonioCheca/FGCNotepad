import assert from "node:assert/strict";
import test from "node:test";

import {pressureNodeSize} from "./pressureNodeSize";
import {layoutPressureGraph} from "./pressureGraphModel";
import type {PressureGraphData} from "./pressureGraphTypes";

const node = (id: string) => ({id, label: id});
const edge = (from: string, to: string) => ({id: `${from}-${to}`, from, to, kind: "normal" as const, readLabel: null});

const graph: PressureGraphData = {
    nodes: [node("a"), node("b"), node("c"), node("d")],
    edges: [edge("a", "b"), edge("b", "a"), edge("b", "c"), edge("c", "d")],
};

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

test("nodes grow to fit their label and make room for a subtitle", () => {
    const short = pressureNodeSize({id: "a", label: "5MP"});
    const long = pressureNodeSize({id: "b", label: "HP Hooligan (hold) > Divekick", subtitle: "236HP (hold) > K"});

    assert.equal(short.width, 136);
    assert.ok(long.width > 136);
    assert.ok(long.height > short.height);
});
