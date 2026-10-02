import assert from "node:assert/strict";
import test from "node:test";

import {draftToGraphData, hasEdge, nextClientId, parseDamage, removeNodeAndEdges} from "./pressureGraphDraft";
import type {PressureEdgeDraft, PressureNodeDraft} from "./pressureGraphDraft";

const node = (clientId: string): PressureNodeDraft => ({clientId, move: null, layer: 1, damageDealt: "", damageReceived: ""});
const edge = (from: string, to: string, extra: Partial<PressureEdgeDraft> = {}): PressureEdgeDraft => ({clientId: `${from}${to}`, from, to, kind: "normal", readLabel: "", layer: 1, ...extra});

test("client ids skip ids already in use", () => {
    assert.equal(nextClientId("n", ["n1", "n2", "n4"]), "n3");
    assert.equal(nextClientId("n", []), "n1");
});

test("damage accepts whole numbers up to full health only", () => {
    assert.equal(parseDamage(" 2400 "), 2400);
    assert.equal(parseDamage("0"), null);
    assert.equal(parseDamage("10001"), null);
    assert.equal(parseDamage("12.5"), null);
});

test("removing a node drops every edge touching it", () => {
    const result = removeNodeAndEdges([node("a"), node("b"), node("c")], [edge("a", "b"), edge("b", "c"), edge("c", "a")], "b");

    assert.deepEqual(result.nodes.map((item) => item.clientId), ["a", "c"]);
    assert.deepEqual(result.edges.map((item) => item.clientId), ["ca"]);
});

test("graph data keeps read labels only on read edges", () => {
    const data = draftToGraphData(
        [{...node("a"), move: {id: "1", summary: "Ryu 5MP", numpadNotation: "5MP", moveName: "Standing MP"}, damageDealt: "1200"}, node("b")],
        [edge("a", "b", {kind: "read", readLabel: " expects mash "}), edge("b", "a", {readLabel: "ignored"})],
    );

    assert.equal(data.nodes[0].notation, "5MP");
    assert.equal(data.nodes[0].damageDealt, 1200);
    assert.equal(data.edges[0].readLabel, "expects mash");
    assert.equal(data.edges[1].readLabel, null);
    assert.ok(hasEdge([edge("a", "b")], "a", "b"));
    assert.ok(!hasEdge([edge("a", "b")], "b", "a"));
});
