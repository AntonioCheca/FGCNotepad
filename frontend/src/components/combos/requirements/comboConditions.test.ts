import assert from "node:assert/strict";
import test from "node:test";

import {buildComboConditions, buildObjectCondition, conditionsNotInTitle} from "./comboConditions";

test("only conditions the combo has are listed, starters first in a fixed order", () => {
    const conditions = buildComboConditions({corner_required: true, punish_counter_required: true, counter_hit_required: false, perfect_parry_required: false});

    assert.deepEqual(conditions.map((condition) => condition.text), ["PC", "Corner"]);
    assert.deepEqual(conditions.map((condition) => condition.starter), [true, false]);
    assert.deepEqual(buildComboConditions(null), []);
});

test("a Perfect Parry starter is not also listed as Punish Counter", () => {
    const conditions = buildComboConditions({punish_counter_required: true, perfect_parry_required: true});

    assert.deepEqual(conditions.map((condition) => condition.text), ["PP"]);
});

test("character resources read as plain text", () => {
    const [medals, flame] = buildComboConditions({
        combo_object_states: [
            {object_key: "manon_medals", object_name: "Medals", status_required: "4", kind: "scaler"},
            {object_key: "akuma_flame_stock", object_name: "Flame Stock", status_required: 1, consumed: true, kind: "stock"},
        ],
    });

    assert.equal(medals.text, "Medals: needs 4");
    assert.equal(flame.text, "Flame Stock: needs 1, consumed");
    assert.equal(buildObjectCondition({object_name: "Install", status_required: "true"}, 0)?.text, "Install: active");
    assert.equal(buildObjectCondition({object_name: "Drinks", added_relative: "2"}, 0)?.text, "Drinks: adds 2");
    assert.equal(buildObjectCondition({object_name: "  "}, 0), null);
});

test("the legacy single object field is still read", () => {
    const [bomb] = buildComboConditions({requirement_specific_character: {object_name: "Bomb", status_required: "true"}});

    assert.equal(bomb.text, "Bomb: active");
});

test("starter conditions a title already leads with are not repeated", () => {
    const conditions = buildComboConditions({punish_counter_required: true, corner_required: true});

    assert.deepEqual(conditionsNotInTitle(conditions, "PC: 5HP > HP > 2HP").map((condition) => condition.text), ["Corner"]);
    assert.deepEqual(conditionsNotInTitle(conditions, "5HP > PC > 2HP").map((condition) => condition.text), ["PC", "Corner"]);
});
