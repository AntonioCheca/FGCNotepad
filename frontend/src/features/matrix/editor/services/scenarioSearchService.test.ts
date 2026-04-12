import assert from "node:assert/strict";
import test from "node:test";

import {filterScenarioItems, normalizeScenarioItems} from "./scenarioSearchService";

test("normalizeScenarioItems keeps only valid scenarios", () => {
    const items = normalizeScenarioItems([
        {id: 12, name: "Shimmy Trap", type: {name: "Strike/Throw"}},
        {id: "uuid-1", label: "Corner Escape", typeLabel: "Defense"},
        {id: "abc", name: "  Whiff Punish  "},
        {id: null, name: "Invalid"},
        {id: 99, name: ""},
    ]);

    assert.equal(items.length, 3);
    assert.deepEqual(items[0], {id: "12", label: "Shimmy Trap", typeLabel: "Strike/Throw"});
    assert.deepEqual(items[1], {id: "uuid-1", label: "Corner Escape", typeLabel: "Defense"});
    assert.deepEqual(items[2], {id: "abc", label: "Whiff Punish", typeLabel: "Scenario"});
});

test("filterScenarioItems matches id, label and type", () => {
    const source = [
        {id: "1", label: "Shimmy Trap", typeLabel: "Strike/Throw"},
        {id: "2", label: "Meaty Setup", typeLabel: "Oki"},
    ];

    assert.equal(filterScenarioItems(source, "shim").length, 1);
    assert.equal(filterScenarioItems(source, "oki").length, 1);
    assert.equal(filterScenarioItems(source, "2").length, 1);
    assert.equal(filterScenarioItems(source, "").length, 2);
});
