// Seeds one oki, blockstring and scenario so detail pages have content during the mobile audit.
// Local development only. Re-running is safe: existing "[mobile-audit]" content is reused.
import {createApiSession, requireEnv} from "./session.mjs";

const SEED_TAG = "[mobile-audit]";

const api = await createApiSession(requireEnv("AUDIT_API_URL"), requireEnv("AUDIT_LOGIN_URL"));

const characters = await api.get("/characters");
const ryu = characters.find((character) => character.name === "Ryu");
const ken = characters.find((character) => character.name === "Ken");
if (!ryu || !ken) {
    throw new Error("Ryu and Ken must exist in the local frame data before seeding.");
}

async function moveId(character, notation) {
    const moves = await api.get(`/moves/search?characterId=${encodeURIComponent(character.id)}&query=${encodeURIComponent(notation)}`);
    const move = moves.find((candidate) => candidate.summary === `${character.name} ${notation}`);
    if (!move) {
        throw new Error(`Move ${notation} not found for ${character.name}.`);
    }
    return move.id;
}

const seeded = {};

const blockstrings = await api.get("/blockstrings");
const existingBlockstring = blockstrings.find((item) => item.title?.startsWith(SEED_TAG));
// Covers every edge kind, a layer-2 read and risk/reward outcomes so the graph renders its full vocabulary.
seeded.blockstringId = existingBlockstring?.id ?? (await api.post("/blockstrings", {
    title: `${SEED_TAG} Ryu st.MP pressure`,
    summary: "Seeded for mobile layout audits.",
    attackerCharacterId: ryu.id,
    classification: "fake",
    nodes: [
        {clientId: "mp", moveId: await moveId(ryu, "5MP")},
        {clientId: "lp", moveId: await moveId(ryu, "5LP")},
        {clientId: "mk", moveId: await moveId(ryu, "2MK")},
        {clientId: "tatsu", moveId: await moveId(ryu, "236HK"), damageDealt: 2100},
        {clientId: "hp", moveId: await moveId(ryu, "5HP"), layer: 2, damageDealt: 2800, damageReceived: 3500},
    ],
    edges: [
        {clientId: "mp-lp", from: "mp", to: "lp", kind: "normal", frameAdvantage: 2},
        {clientId: "lp-mk", from: "lp", to: "mk", kind: "normal"},
        {clientId: "mk-mp", from: "mk", to: "mp", kind: "normal"},
        {clientId: "lp-tatsu", from: "lp", to: "tatsu", kind: "confirm"},
        {clientId: "lp-hp", from: "lp", to: "hp", kind: "read", readLabel: "expects mash", layer: 2},
        {clientId: "mk-tatsu", from: "mk", to: "tatsu", kind: "fake", gapFrames: 3, frameAdvantage: -1},
    ],
    defenseEntries: [
        {edgeClientId: "mk-tatsu", instruction: "Mash cr.LP before the tatsu.", responseType: "button", outcome: "trade"},
    ],
})).id;

const okis = await api.get("/okis");
const ryuTatsuId = await moveId(ryu, "236HK");
const existingOki = okis.find((item) => item.move?.id === ryuTatsuId);
const okiPayload = {
    moveId: ryuTatsuId,
    setups: [{
        usesDriveRush: false,
        autoTimed: true,
        cornerOnly: true,
        worksNoBackroll: true,
        worksBackroll: true,
        fakeNoBackroll: false,
        fakeBackroll: false,
        nodes: [
            {clientId: "dash", moveId: await moveId(ryu, "66"), isDefaultRoute: true},
            {clientId: "meaty", moveId: await moveId(ryu, "2MK"), isDefaultRoute: true, optionType: "MEATY_STRIKE", properties: [], damageDealt: 1600},
            {clientId: "throw", moveId: await moveId(ryu, "LPLK"), optionType: "MEATY_THROW", layer: 2, damageDealt: 1200, damageReceived: 2000},
        ],
        links: [
            {fromClientId: "dash", toClientId: "meaty", stepType: "IMMEDIATE"},
            {fromClientId: "dash", toClientId: "throw", stepType: "IMMEDIATE", kind: "read", readLabel: "expects block", layer: 2},
        ],
    }],
};
// The seeded oki is refreshed in place so older local seeds pick up new graph fields.
seeded.okiId = existingOki ? (await api.patch(`/okis/${existingOki.id}`, okiPayload)).id : (await api.post("/okis", okiPayload)).id;

// New scenarios stay pending review, so look in the moderation queue as well as the public list.
const approvedScenarios = await api.get(`/scenarios?q=${encodeURIComponent("mobile-audit")}`);
const queue = await api.get("/moderation/queue?contentType=scenario");
const queuedScenario = (queue.data ?? []).find((item) => item.contentType === "scenario" && item.title?.startsWith(SEED_TAG));
seeded.scenarioId = approvedScenarios[0]?.id ?? queuedScenario?.contentId ?? (await api.post("/scenarios", {
    name: `${SEED_TAG} Ryu corner oki`,
    scenarioType: "oki",
    defenderCharacterId: ken.id,
    attackerCharacterId: ryu.id,
    triggerMoveId: ryuTatsuId,
    matrix: {
        kind: "matrix-editor",
        schemaVersion: 1,
        axes: {rows: ["Block", "Backdash", "Reversal"], columns: ["Meaty", "Throw", "Shimmy"]},
        cells: [
            [{cellType: "value", dataType: "number", value: 0}, {cellType: "value", dataType: "number", value: -1200}, {cellType: "value", dataType: "number", value: 300}],
            [{cellType: "value", dataType: "number", value: 200}, {cellType: "value", dataType: "number", value: 200}, {cellType: "value", dataType: "number", value: -900}],
            [{cellType: "value", dataType: "number", value: -2500}, {cellType: "value", dataType: "number", value: 1000}, {cellType: "value", dataType: "number", value: 1000}],
        ],
        summary: {
            rowAxis: [{cellType: "summary", dataType: "number", value: 0.4}, {cellType: "summary", dataType: "number", value: 0.4}, {cellType: "summary", dataType: "number", value: 0.2}],
            columnAxis: [{cellType: "summary", dataType: "number", value: 0.5}, {cellType: "summary", dataType: "number", value: 0.3}, {cellType: "summary", dataType: "number", value: 0.2}],
            expectedValue: {cellType: "summary", dataType: "empty", value: null},
        },
        metadata: {matrixId: "mx_mobile_audit", title: "Ryu corner oki"},
    },
})).id;

const combos = await api.get("/combo-sequences?size=1");
seeded.comboId = combos[0]?.id ?? null;

console.log(JSON.stringify(seeded));
