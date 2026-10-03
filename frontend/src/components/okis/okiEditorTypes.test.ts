import assert from "node:assert/strict";
import test from "node:test";

import {buildOkiPayload, mapDetailToDraft, OKI_ENDER_NODE_ID, okiSetupToGraph} from "./okiEditorTypes";
import type {OkiMoveRef, OkiProfileDetail, OkiSetup} from "@/src/types/oki";

const character = {id: "ryu", name: "Ryu"};
const move = (id: string, numpadNotation: string): OkiMoveRef => ({id, numpadNotation, name: numpadNotation, moveName: null, character});
const node = (id: number, notation: string, extra: Partial<OkiSetup["nodes"][number]> = {}) => ({
    id, move: move(`m${id}`, notation), sortOrder: id, isDefaultRoute: false, routeExplanation: null, optionType: null, properties: [], interactions: [], layer: 1, damageDealt: null, damageReceived: null, ...extra,
});

const setup: OkiSetup = {
    id: 3, moderationState: "approved", moderationReason: null, author: null, canEdit: true,
    usesDriveRush: false, autoTimed: true, cornerOnly: false, worksNoBackroll: true, worksBackroll: true, fakeNoBackroll: false, fakeBackroll: false,
    nodes: [node(1, "66"), node(2, "5LP", {damageDealt: 1800}), node(3, "Throw", {layer: 2})],
    links: [
        {id: 10, fromNodeId: 1, toNodeId: 2, stepType: "IMMEDIATE", minFrames: null, maxFrames: null, kind: "normal", readLabel: null, layer: 1},
        {id: 11, fromNodeId: 1, toNodeId: 3, stepType: "WAIT", minFrames: 2, maxFrames: 4, kind: "read", readLabel: "expects block", layer: 2},
    ],
};

test("viewer graph roots the setup on the ender", () => {
    const graph = okiSetupToGraph(setup, move("e", "2HK"));

    assert.equal(graph.nodes[0].id, OKI_ENDER_NODE_ID);
    assert.equal(graph.nodes[0].notation, "2HK");
    assert.equal(graph.nodes[0].anchor, true);
    assert.deepEqual(graph.edges.filter((edge) => edge.from === OKI_ENDER_NODE_ID).map((edge) => edge.to), ["1"]);
    assert.equal(graph.edges.find((edge) => edge.id === "11")?.readLabel, "expects block");
});

test("graph fields survive the editor round trip", () => {
    const detail: OkiProfileDetail = {id: 1, move: move("e", "2HK"), frameAdvantage: 30, setupCount: 1, summary: {meterless: true, driveRush: false, autoTimed: true, manual: false, cornerOnly: false, worksNoBackroll: true, worksBackroll: true, hasFakeSetups: false, optionTypes: [], properties: []}, setups: [setup]};

    const payload = buildOkiPayload(mapDetailToDraft(detail));
    const [built] = payload.setups;

    assert.equal(built.nodes[1].damageDealt, 1800);
    assert.equal(built.nodes[2].layer, 2);
    assert.deepEqual(built.links[1], {fromClientId: "n1", toClientId: "n3", stepType: "WAIT", minFrames: 2, maxFrames: 4, kind: "read", readLabel: "expects block", layer: 2});
});
