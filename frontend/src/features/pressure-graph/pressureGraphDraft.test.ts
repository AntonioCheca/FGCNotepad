import assert from "node:assert/strict";
import test from "node:test";

import {hasEdge, nextClientId, removeNodeAndEdges} from "./pressureGraphDraft";

const node = (clientId: string) => ({clientId});
const edge = (from: string, to: string) => ({clientId: `${from}${to}`, from, to});

test("client ids skip ids already in use", () => {
    assert.equal(nextClientId("n", ["n1", "n2", "n4"]), "n3");
    assert.equal(nextClientId("n", []), "n1");
});

test("removing a node drops every edge touching it", () => {
    const result = removeNodeAndEdges([node("a"), node("b"), node("c")], [edge("a", "b"), edge("b", "c"), edge("c", "a")], "b");

    assert.deepEqual(result.nodes.map((item) => item.clientId), ["a", "c"]);
    assert.deepEqual(result.edges.map((item) => item.clientId), ["ca"]);
});

test("edges are directed", () => {
    assert.ok(hasEdge([edge("a", "b")], "a", "b"));
    assert.ok(!hasEdge([edge("a", "b")], "b", "a"));
});
