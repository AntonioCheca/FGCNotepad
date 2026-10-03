import type {CharacterObjectKind, ComboObjectStateDraft, ComboRequirement, RequirementObjectOption, RequirementSpecificCharacterPayload} from "@/src/types/combo";

export type RequirementBadgeKind =
    | "counterHit"
    | "punishCounter"
    | "perfectParry"
    | "wallsplat"
    | "corner"
    | "airborne"
    | "notCrouching"
    | "sideSwitch"
    | "object";

export interface RequirementBadge {
    id: string;
    kind: RequirementBadgeKind;
    // Full wording for the tooltip and screen readers; the badge itself stays icon-first.
    label: string;
    // Short text drawn next to the icon, only where the icon alone would be ambiguous.
    tag: string | null;
    objectKind?: CharacterObjectKind | null;
}

type RequirementFlags = Pick<ComboRequirement, "counter_hit_required" | "punish_counter_required" | "perfect_parry_required" | "blocked_drive_impact_stun_required" | "corner_required" | "airborne_required" | "not_crouching_required" | "side_switches_required">;

const FLAG_BADGES: Array<{key: keyof RequirementFlags; kind: RequirementBadgeKind; label: string; tag: string | null}> = [
    {key: "counter_hit_required", kind: "counterHit", label: "Counter Hit required", tag: "CH"},
    {key: "punish_counter_required", kind: "punishCounter", label: "Punish Counter required", tag: "PC"},
    {key: "perfect_parry_required", kind: "perfectParry", label: "Perfect Parry starter", tag: null},
    {key: "blocked_drive_impact_stun_required", kind: "wallsplat", label: "Wallsplat from blocked Drive Impact", tag: null},
    {key: "corner_required", kind: "corner", label: "Corner required", tag: null},
    {key: "airborne_required", kind: "airborne", label: "Opponent airborne", tag: null},
    {key: "not_crouching_required", kind: "notCrouching", label: "Opponent not crouching", tag: null},
    {key: "side_switches_required", kind: "sideSwitch", label: "Side switch", tag: null},
];

export function requirementBadgeKind(key: keyof RequirementFlags): RequirementBadgeKind | null {
    return FLAG_BADGES.find((flag) => flag.key === key)?.kind ?? null;
}

// Editor drafts only carry the object key; name and kind come from the character's object catalog.
export function objectStatesFromDrafts(drafts: ComboObjectStateDraft[], catalog: RequirementObjectOption[]): RequirementSpecificCharacterPayload[] {
    const byKey = new Map(catalog.map((option) => [option.object_key, option]));

    return drafts.map((draft) => ({
        object_key: draft.object_key,
        object_name: byKey.get(draft.object_key)?.name ?? draft.object_key,
        status_required: draft.status_required,
        consumed: draft.consumed,
        added_relative: draft.added_relative,
        added_absolute: draft.added_absolute,
        kind: byKey.get(draft.object_key)?.kind ?? null,
    }));
}

export function buildRequirementBadges(requirements: (RequirementFlags & Pick<ComboRequirement, "combo_object_states" | "requirement_specific_character">) | null): RequirementBadge[] {
    if (!requirements) {
        return [];
    }

    const badges: RequirementBadge[] = [];
    for (const flag of FLAG_BADGES) {
        if (requirements[flag.key]) {
            badges.push({id: flag.key, kind: flag.kind, label: flag.label, tag: flag.tag});
        }
    }

    const objectStates = requirements.combo_object_states ?? (requirements.requirement_specific_character ? [requirements.requirement_specific_character] : []);
    objectStates.forEach((state, index) => {
        const badge = buildObjectBadge(state, index);
        if (badge) {
            badges.push(badge);
        }
    });

    return badges;
}

export function buildObjectBadge(state: RequirementSpecificCharacterPayload, index: number): RequirementBadge | null {
    const name = state.object_name?.trim();
    if (!name) {
        return null;
    }

    const details: string[] = [];
    const tags: string[] = [];
    const required = numericValue(state.status_required);
    if (required !== null) {
        details.push(`needs ${required}`);
        tags.push(String(required));
    } else if (isTruthy(state.status_required)) {
        details.push("active");
    }
    if (state.consumed) {
        details.push("consumed");
        tags.push("−");
    }
    const relative = numericValue(state.added_relative);
    if (relative !== null) {
        details.push(`adds ${relative}`);
        tags.push(`+${relative}`);
    }
    const absolute = numericValue(state.added_absolute);
    if (absolute !== null) {
        details.push(`ends at ${absolute}`);
        tags.push(`→${absolute}`);
    }

    return {
        id: `object-${state.object_key ?? name}-${index}`,
        kind: "object",
        label: details.length > 0 ? `${name}: ${details.join(", ")}` : name,
        tag: tags.length > 0 ? tags.join(" ") : null,
        objectKind: state.kind ?? null,
    };
}

function numericValue(value: string | number | boolean | null | undefined): number | null {
    if (typeof value === "number") {
        return value;
    }
    if (typeof value === "string" && /^-?\d+$/.test(value.trim())) {
        return Number.parseInt(value.trim(), 10);
    }

    return null;
}

function isTruthy(value: string | number | boolean | null | undefined): boolean {
    return value === true || value === "true" || value === "1";
}
