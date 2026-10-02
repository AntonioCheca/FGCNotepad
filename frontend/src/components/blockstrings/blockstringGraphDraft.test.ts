import assert from "node:assert/strict";
import test from "node:test";

import {blockstringDetailToDraft, buildBlockstringPayload, createBlockstringEdge, createBlockstringDraft, withDefenseInstruction} from "./blockstringGraphDraft";
import type {BlockstringDetail} from "@/src/types/blockstring";

const move = (id: string, numpadNotation: string) => ({id, numpadNotation, moveName: null, character: {id: "akuma", name: "Akuma"}});

const detail: BlockstringDetail = {
    id: 7,
    title: "st.MP pressure",
    summary: null,
    classification: "frametrap",
    moderationState: "approved",
    attackerCharacter: {id: "akuma", name: "Akuma"},
    notation: "5MP -> 2MK",
    nodeCount: 2,
    defenseEntryCount: 1,
    gaps: [],
    nodes: [
        {id: "10", move: move("m1", "5MP"), layer: 1, damageDealt: null, damageReceived: null},
        {id: "11", move: move("m2", "2MK"), layer: 2, damageDealt: 1200, damageReceived: null},
    ],
    edges: [{id: "20", from: "10", to: "11", kind: "fake", readLabel: null, layer: 1, frameAdvantage: -2, gapFrames: 3}],
    conditions: [],
    defenseEntries: [{edgeId: "20", instruction: "Mash 4f", exceptionNotes: null, defenderCharacter: null, move: null, responseType: "button", outcome: "counter_hit", conversion: null}],
};

test("an existing blockstring survives a draft round trip", () => {
    const payload = buildBlockstringPayload(blockstringDetailToDraft(detail));

    assert.deepEqual(payload.nodes, [
        {clientId: "n10", moveId: "m1", layer: 1, damageDealt: null, damageReceived: null},
        {clientId: "n11", moveId: "m2", layer: 2, damageDealt: 1200, damageReceived: null},
    ]);
    assert.deepEqual(payload.edges, [{clientId: "e20", from: "n10", to: "n11", kind: "fake", readLabel: null, layer: 1, frameAdvantage: -2, gapFrames: 3}]);
    assert.equal(payload.defenseEntries?.[0].edgeClientId, "e20");
});

test("defense notes on removed or blank arrows are not sent", () => {
    const draft = {...blockstringDetailToDraft(detail), edges: []};
    assert.deepEqual(buildBlockstringPayload(draft).defenseEntries, []);

    const blank = blockstringDetailToDraft(detail);
    blank.defenseEntries = withDefenseInstruction(blank.defenseEntries, "e20", "  ");
    assert.deepEqual(buildBlockstringPayload(blank).defenseEntries, []);
});

test("a new defense note creates an entry with defaults", () => {
    const entries = withDefenseInstruction([], "e1", "Jab the gap");

    assert.deepEqual(entries, [{edgeClientId: "e1", instruction: "Jab the gap", responseType: "button", outcome: "counter_hit"}]);
});

test("payload requires title, attacker and a move on every node", () => {
    const draft = createBlockstringDraft();
    assert.throws(() => buildBlockstringPayload(draft), /Title/);
    assert.throws(() => buildBlockstringPayload({...draft, title: "x"}), /attacking character/);
    assert.throws(() => buildBlockstringPayload({...draft, title: "x", attackerCharacterId: "akuma"}), /move picked/);
});

test("read labels are only sent for read arrows", () => {
    const draft = blockstringDetailToDraft(detail);
    draft.edges = [{...createBlockstringEdge("e1", "n10", "n11"), readLabel: "expects mash"}, {...createBlockstringEdge("e2", "n11", "n10"), kind: "read", readLabel: " expects mash "}];

    const payload = buildBlockstringPayload(draft);

    assert.equal(payload.edges[0].readLabel, null);
    assert.equal(payload.edges[1].readLabel, "expects mash");
});
