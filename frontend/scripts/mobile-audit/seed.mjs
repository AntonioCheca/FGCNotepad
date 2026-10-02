// Seeds one oki, blockstring and scenario so detail pages have content during the mobile audit.
// Local development only. Re-running is safe: existing "[mobile-audit]" content is reused.
import {createApiSession, requireEnv} from "./session.mjs";

const SEED_TAG = "[mobile-audit]";

const api = await createApiSession(requireEnv("AUDIT_API_URL"), requireEnv("AUDIT_USERNAME"), requireEnv("AUDIT_PASSWORD"));

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
seeded.blockstringId = existingBlockstring?.id ?? (await api.post("/blockstrings", {
    title: `${SEED_TAG} Ryu st.MP pressure`,
    summary: "Seeded for mobile layout audits.",
    attackerCharacterId: ryu.id,
    classification: "fake",
    steps: [
        {moveId: await moveId(ryu, "5MP"), ordinal: 1, canConfirmOnHit: true},
        {moveId: await moveId(ryu, "5LP"), ordinal: 2},
        {moveId: await moveId(ryu, "2MK"), ordinal: 3},
    ],
    gaps: [
        {clientId: "gap-a", stepOrdinal: 2, timing: "before_step", frames: 0, frameAdvantage: 2},
        {clientId: "gap-b", stepOrdinal: 3, timing: "before_step", frames: 3},
    ],
    defenseEntries: [
        {gapClientId: "gap-b", instruction: "Mash cr.LP before cr.MK.", responseType: "button", outcome: "trade"},
    ],
    adaptations: [],
})).id;

const okis = await api.get("/okis");
const ryuTatsuId = await moveId(ryu, "236HK");
const existingOki = okis.find((item) => item.move?.id === ryuTatsuId);
seeded.okiId = existingOki?.id ?? (await api.post("/okis", {
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
            {clientId: "meaty", moveId: await moveId(ryu, "2MK"), isDefaultRoute: true, optionType: "MEATY_STRIKE", properties: []},
        ],
        links: [{fromClientId: "dash", toClientId: "meaty", stepType: "IMMEDIATE"}],
    }],
})).id;

const scenarios = await api.get(`/scenarios?q=${encodeURIComponent("mobile-audit")}`);
seeded.scenarioId = scenarios[0]?.id ?? (await api.post("/scenarios", {
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
