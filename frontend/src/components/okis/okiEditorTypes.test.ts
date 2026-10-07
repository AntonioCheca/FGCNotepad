import assert from "node:assert/strict";
import test from "node:test";

import {buildOkiPayload, enderText, mapDetailToDraft, OKI_ENDER_NODE_ID, okiDraftToGraph, okiSetupToGraph} from "./okiEditorTypes";
import {hitLevelFromAttackLevel, isJumpingAttack} from "./okiVocabulary";
import type {OkiMoveRef, OkiProfileDetail, OkiSetup} from "@/src/types/oki";

const character = {id: "akuma", name: "Akuma"};
const move = (id: string, numpadNotation: string, commonName: string | null = null, moveName: string | null = null): OkiMoveRef => ({id, numpadNotation, name: numpadNotation, commonName, moveName, moveType: "normal", character});

const setup: OkiSetup = {
    id: 3, moderationState: "approved", moderationReason: null, author: null, canEdit: true, name: "Corner safe jump", cornerOnly: true, backrollDependent: true,
    nodes: [
        {id: 1, move: null, action: "FORWARD_JUMP", sortOrder: 0, hitLevel: null, sideSwitch: false},
        {id: 2, move: move("m2", "8HK", "", "Jump HK"), action: null, sortOrder: 1, hitLevel: "OVERHEAD", sideSwitch: true},
        {id: 3, move: move("m3", "66", "Forward Dash"), action: null, sortOrder: 2, hitLevel: null, sideSwitch: false},
    ],
    links: [
        {id: 10, fromNodeId: null, toNodeId: 1, stepType: "IMMEDIATE", kind: "normal", readLabel: null, safeJump: false, recovery: "BACKROLL"},
        {id: 11, fromNodeId: 1, toNodeId: 2, stepType: "IMMEDIATE", kind: "normal", readLabel: null, safeJump: true, recovery: null},
        {id: 12, fromNodeId: null, toNodeId: 3, stepType: "DELAY", kind: "read", readLabel: "expects block", safeJump: false, recovery: null},
    ],
};

const ender = move("e", "214MK", "MK Tatsu", "MK Tatsumaki Zanku-kyaku");
const detail: OkiProfileDetail = {id: 1, move: ender, setupCount: 1, setups: [setup]};

test("viewer graph roots stored ender links on the ender, names moves with notation subtitles and draws medals", () => {
    const graph = okiSetupToGraph(setup, ender);

    assert.equal(graph.nodes[0].id, OKI_ENDER_NODE_ID);
    assert.equal(graph.nodes[0].label, "MK Tatsu");
    assert.equal(graph.nodes[0].subtitle, "214MK");
    assert.equal(graph.nodes[0].anchor, true);
    assert.deepEqual(graph.edges.filter((edge) => edge.from === OKI_ENDER_NODE_ID).map((edge) => edge.to), ["1", "3"]);
    assert.deepEqual(graph.nodes.slice(1).map((node) => [node.label, node.subtitle]), [["Forward Jump", null], ["Jump HK", "8HK"], ["Forward Dash", "66"]]);
    assert.deepEqual(graph.nodes[2].markers, ["overhead", "sideSwitch"]);
    assert.deepEqual(graph.nodes[3].markers, []);
    assert.deepEqual(graph.edges[0].markers, ["backroll"]);
    assert.deepEqual(graph.edges[1].markers, ["safeJump"]);
    assert.equal(graph.edges[2].caption, "Delay");
    assert.equal(graph.edges[0].caption, null);
});

test("graph fields survive the editor round trip", () => {
    const draft = mapDetailToDraft(detail);
    const [built] = buildOkiPayload(draft).setups;

    assert.equal(draft.characterId, "akuma");
    assert.equal(built.name, "Corner safe jump");
    assert.deepEqual(built.nodes[0], {clientId: "1", action: "FORWARD_JUMP", sortOrder: 0, hitLevel: null, sideSwitch: false});
    assert.equal(built.nodes[1].moveId, "m2");
    assert.deepEqual(built.links[0], {fromClientId: OKI_ENDER_NODE_ID, toClientId: "1", stepType: "IMMEDIATE", kind: "normal", readLabel: null, safeJump: false, recovery: "BACKROLL"});
    assert.equal(built.links[1].safeJump, true);
    assert.equal(built.links[2].readLabel, "expects block");
});

test("setups need a name", () => {
    const draft = mapDetailToDraft(detail);

    assert.throws(() => buildOkiPayload({...draft, setups: [{...draft.setups[0], name: "  "}]}), /name/);
});

test("recovery medals are dropped once a setup is no longer backroll dependent", () => {
    const draft = mapDetailToDraft(detail);
    const independent = {...draft.setups[0], backrollDependent: false};

    assert.deepEqual(okiDraftToGraph(independent, enderText(ender)).edges[0].markers, []);
    assert.equal(buildOkiPayload({...draft, setups: [independent]}).setups[0].links[0].recovery, null);
});

test("safe jump medals only survive on steps into a jumping attack", () => {
    const draft = mapDetailToDraft(detail);
    const [setupDraft] = draft.setups;
    const grounded = {...setupDraft, nodes: setupDraft.nodes.map((node) => node.clientId === "2" ? {...node, choice: {kind: "move" as const, move: {id: "m9", summary: "5LP", numpadNotation: "5LP"}}} : node)};

    assert.deepEqual(okiDraftToGraph(grounded, enderText(ender)).edges[1].markers, []);
    assert.equal(buildOkiPayload({...draft, setups: [grounded]}).setups[0].links[1].safeJump, false);
    assert.equal(isJumpingAttack("9HK"), true);
    assert.equal(isJumpingAttack("j.HK"), false);
    assert.equal(isJumpingAttack("2MK"), false);
});

test("hit level comes from frame data", () => {
    assert.equal(hitLevelFromAttackLevel("L*H"), "LOW");
    assert.equal(hitLevelFromAttackLevel("M"), "OVERHEAD");
    assert.equal(hitLevelFromAttackLevel("H"), null);
});
