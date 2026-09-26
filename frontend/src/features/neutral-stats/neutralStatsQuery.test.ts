import assert from "node:assert/strict";
import test from "node:test";

import {buildNeutralQuery, buildNeutralUrlQuery, defaultFilterState, parseNeutralQuery} from "./neutralStatsQuery";

test("default filters only carry the character", () => {
    const filters = {...defaultFilterState(), characterId: "ryu"};

    assert.deepEqual(buildNeutralQuery(filters), {character: "ryu"});
});

test("filters survive a URL round trip", () => {
    const filters = {
        ...defaultFilterState(),
        characterId: "ryu",
        opponentId: "manon",
        regions: ["tokyo", "london"],
        rankMin: "any",
        rankMax: "mr:1699",
        relativeMr: ["higher"],
        actor: {drive: {min: 2, max: 6}, super: {min: 0, max: 1.5}, health: {min: 0, max: 5000}},
        opponent: {drive: {min: 0, max: 3}, super: {min: 0, max: 3}, health: null},
        actorResources: {ryu_denjin: [1]},
        opponentResources: {manon_medals: [5, 3]},
        bucketSize: "0.5",
        patch: "latest" as const,
    };

    const query = buildNeutralUrlQuery(filters, "distribution");

    assert.equal(query["oppRes[manon_medals]"], "3,5");
    const parsed = parseNeutralQuery(query);
    assert.equal(parsed.tab, "distribution");
    assert.deepEqual(parsed.filters, {...filters, opponentResources: {manon_medals: [3, 5]}});
});

test("opponent-only filters are dropped without a matchup", () => {
    const filters = {...defaultFilterState(), characterId: "ryu", opponentResources: {manon_medals: [3]}};

    assert.deepEqual(buildNeutralQuery(filters), {character: "ryu"});
});
