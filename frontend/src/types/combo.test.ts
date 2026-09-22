import assert from "node:assert/strict";
import test from "node:test";

import {deriveComboStarter, mapComboToRow} from "./combo";

test("normal starter is the first move", () => {
    assert.equal(deriveComboStarter(["5HK", "236P"]), "5HK");
});

test("raw Drive Rush starter becomes DR + next move", () => {
    assert.equal(deriveComboStarter(["DR", "5HK", "236P"]), "DR > 5HK");
    assert.equal(deriveComboStarter(["Drive Rush", "2MP"]), "DR > 2MP");
});

test("starter derivation handles '<Character> - <notation>' move names", () => {
    assert.equal(deriveComboStarter(["Ryu - DR", "Ryu - 5HK", "Ryu - 236P"]), "DR > 5HK");
    assert.equal(deriveComboStarter(["Ryu - 5HK", "Ryu - 236P"]), "5HK");
});

test("standalone Drive Rush stays a valid starter", () => {
    assert.equal(deriveComboStarter(["DR"]), "DR");
    assert.equal(deriveComboStarter([]), "-");
});

test("mapComboToRow keeps the underlying move sequence", () => {
    const row = mapComboToRow({id: 1, moves: [{name: "DR"}, {name: "5HK"}, {name: "236P"}]});
    assert.deepEqual(row.moves, ["DR", "5HK", "236P"]);
    assert.equal(row.starter, "DR > 5HK");
    assert.equal(mapComboToRow({id: 3, moves: [{name: "Ryu - 5HK"}, {name: "Ryu - 236P"}]}).ender, "236P");
    assert.equal(mapComboToRow({id: 2, moves: [{name: "5HK"}]}).starter, "5HK");
});
