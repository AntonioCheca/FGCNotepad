import assert from "node:assert/strict";
import test from "node:test";

import {blockDraftToGraph, blockstringDetailToDraft, buildBlockstringPayload, createBlockstringDraft, parseFrames} from "./blockstringGraphDraft";
import type {BlockstringDetail} from "@/src/types/blockstring";

const move = (id: string, numpadNotation: string, commonName: string | null = null) => ({id, numpadNotation, commonName, moveName: null, character: {id: "akuma", name: "Akuma"}});

const detail: BlockstringDetail = {
    id: 7,
    title: "Burnout pressure",
    moderationState: "approved",
    attackerCharacter: {id: "akuma", name: "Akuma"},
    startingMove: move("m1", "5MP"),
    blocks: [
        {
            id: 1,
            description: "Do this by default.",
            nodes: [{id: "10", move: move("m1", "5MP"), frameAdvantage: 1}, {id: "11", move: move("m2", "214MK", "MK Tatsu"), frameAdvantage: -2}],
            edges: [{id: "20", from: "10", to: "11", kind: "fake", readLabel: null, trueBlockstring: false, gapFrames: 3}],
        },
        {
            id: 2,
            description: null,
            nodes: [{id: "12", move: move("m1", "5MP"), frameAdvantage: null}],
            edges: [{id: "21", from: "12", to: "12", kind: "normal", readLabel: null, trueBlockstring: true, gapFrames: null}],
        },
    ],
};

test("an existing blockstring survives a draft round trip", () => {
    const payload = buildBlockstringPayload(blockstringDetailToDraft(detail));

    assert.equal(payload.startingMoveId, "m1");
    assert.equal(payload.blocks.length, 2);
    assert.equal(payload.blocks[0].description, "Do this by default.");
    assert.equal(payload.blocks[1].description, null);
    assert.deepEqual(payload.blocks[0].nodes.map((node) => node.frameAdvantage), [1, -2]);
    assert.deepEqual(payload.blocks[0].edges[0], {from: "n10", to: "n11", kind: "fake", readLabel: null, trueBlockstring: false, gapFrames: 3});
    assert.deepEqual(payload.blocks[1].edges[0], {from: "n12", to: "n12", kind: "normal", readLabel: null, trueBlockstring: true, gapFrames: null});
});

test("a true blockstring never sends gap frames", () => {
    const draft = blockstringDetailToDraft(detail);
    const [first] = draft.blocks;
    const edited = {...draft, blocks: [{...first, edges: first.edges.map((edge) => ({...edge, trueBlockstring: true}))}]};

    assert.equal(buildBlockstringPayload(edited).blocks[0].edges[0].gapFrames, null);
    assert.equal(blockDraftToGraph(edited.blocks[0]).edges[0].gapFrames, null);
});

test("graph nodes use common names and carry signed frame advantage", () => {
    const graph = blockDraftToGraph(blockstringDetailToDraft(detail).blocks[0]);

    assert.deepEqual(graph.nodes.map((node) => [node.label, node.subtitle]), [["5MP", null], ["MK Tatsu", "214MK"]]);
    assert.deepEqual(graph.nodes.map((node) => node.frameAdvantage), [1, -2]);
});

test("frame inputs accept explicit signs only as whole numbers", () => {
    assert.equal(parseFrames("+4"), 4);
    assert.equal(parseFrames(" -2 "), -2);
    assert.equal(parseFrames("0"), 0);
    assert.equal(parseFrames("4.5"), null);
    assert.equal(parseFrames(""), null);
});

test("a new blockstring needs its title, character and starting move", () => {
    const draft = createBlockstringDraft("akuma");

    assert.throws(() => buildBlockstringPayload(draft), /Title/);
    assert.throws(() => buildBlockstringPayload({...draft, title: "Pressure"}), /starting move/);
});
