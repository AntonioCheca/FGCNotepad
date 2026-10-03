import assert from "node:assert/strict";
import test from "node:test";

import {buildObjectBadge, buildRequirementBadges, objectStatesFromDrafts, requirementBadgeKind} from "./comboRequirementBadges";

test("only requirements the combo has become badges, in a fixed order", () => {
    const badges = buildRequirementBadges({punish_counter_required: true, counter_hit_required: true, corner_required: true, perfect_parry_required: false});

    assert.deepEqual(badges.map((badge) => badge.kind), ["counterHit", "punishCounter", "corner"]);
    assert.deepEqual(badges.map((badge) => badge.tag), ["CH", "PC", null]);
    assert.deepEqual(buildRequirementBadges(null), []);
});

test("object states keep their catalog kind and a compact tag", () => {
    const [medals, flame] = buildRequirementBadges({
        combo_object_states: [
            {object_key: "manon_medals", object_name: "Medals", status_required: "4", kind: "scaler"},
            {object_key: "akuma_flame_stock", object_name: "Flame Stock", status_required: 1, consumed: true, kind: "stock"},
        ],
    });

    assert.equal(medals.objectKind, "scaler");
    assert.equal(medals.tag, "4");
    assert.equal(medals.label, "Medals: needs 4");
    assert.equal(flame.tag, "1 −");
    assert.equal(flame.label, "Flame Stock: needs 1, consumed");
});

test("boolean states and gains read naturally", () => {
    assert.deepEqual(
        buildObjectBadge({object_name: "Install", status_required: "true", kind: "state"}, 0),
        {id: "object-Install-0", kind: "object", label: "Install: active", tag: null, objectKind: "state"},
    );
    assert.equal(buildObjectBadge({object_name: "Drinks", added_relative: "2"}, 0)?.tag, "+2");
    assert.equal(buildObjectBadge({object_name: "  "}, 0), null);
});

test("the legacy single object field is still read", () => {
    const badges = buildRequirementBadges({requirement_specific_character: {object_name: "Bomb", status_required: "true"}});

    assert.equal(badges[0].label, "Bomb: active");
});

test("editor drafts resolve object names and kinds from the catalog", () => {
    const [state] = objectStatesFromDrafts(
        [{object_key: "manon_medals", status_required: "3", consumed: false, added_relative: "", added_absolute: ""}],
        [{object_key: "manon_medals", name: "Medals", character_name: "Manon", display_name: "Manon - Medals", kind: "scaler", status_type: "integer", max_status: 5, can_be_consumed: false, can_be_added_relative: true, can_be_added_absolute: false}],
    );

    assert.equal(buildObjectBadge(state, 0)?.label, "Medals: needs 3");
    assert.equal(state.kind, "scaler");
    assert.equal(requirementBadgeKind("perfect_parry_required"), "perfectParry");
});
