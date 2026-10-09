import type {ComboRequirement, RequirementSpecificCharacterPayload} from "@/src/types/combo";

export type ComboConditionKey =
    | "counter_hit_required"
    | "punish_counter_required"
    | "perfect_parry_required"
    | "blocked_drive_impact_stun_required"
    | "corner_required"
    | "airborne_required"
    | "not_crouching_required"
    | "side_switches_required";

export interface ComboCondition {
    id: string;
    text: string;
    // Spelled-out wording for tooltips and screen readers.
    label: string;
    starter: boolean;
}

type ConditionFlags = Pick<ComboRequirement, ComboConditionKey>;
type ConditionSource = ConditionFlags & Pick<ComboRequirement, "combo_object_states" | "requirement_specific_character">;

export const COMBO_CONDITIONS: Array<{key: ComboConditionKey; text: string; label: string; starter: boolean}> = [
    {key: "counter_hit_required", text: "CH", label: "Counter Hit", starter: true},
    {key: "punish_counter_required", text: "PC", label: "Punish Counter", starter: true},
    {key: "perfect_parry_required", text: "PP", label: "Perfect Parry", starter: true},
    {key: "blocked_drive_impact_stun_required", text: "B. DI Stun", label: "Blocked Drive Impact stun", starter: true},
    {key: "corner_required", text: "Corner", label: "Corner", starter: false},
    {key: "airborne_required", text: "Airborne", label: "Opponent airborne", starter: false},
    {key: "not_crouching_required", text: "Opp. not crouching", label: "Opponent not crouching", starter: false},
    {key: "side_switches_required", text: "Side switch", label: "Side switch", starter: false},
];

export function buildComboConditions(requirements: ConditionSource | null): ComboCondition[] {
    if (!requirements) {
        return [];
    }

    const conditions: ComboCondition[] = [];
    for (const condition of COMBO_CONDITIONS) {
        // A Perfect Parry starter is always a Punish Counter, so PP alone says both.
        const impliedByPerfectParry = condition.key === "punish_counter_required" && requirements.perfect_parry_required;
        if (requirements[condition.key] && !impliedByPerfectParry) {
            conditions.push({id: condition.key, text: condition.text, label: condition.label, starter: condition.starter});
        }
    }

    const objectStates = requirements.combo_object_states ?? (requirements.requirement_specific_character ? [requirements.requirement_specific_character] : []);
    objectStates.forEach((state, index) => {
        const condition = buildObjectCondition(state, index);
        if (condition) {
            conditions.push(condition);
        }
    });

    return conditions;
}

// Imported titles often already lead with the starter ("PC: 5HP > ..."); those conditions need no repeat.
export function conditionsNotInTitle(conditions: ComboCondition[], title: string): ComboCondition[] {
    const leadingTokens = new Set<string>();
    for (const token of title.trim().split(/[\s:]+/)) {
        if (!COMBO_CONDITIONS.some((condition) => condition.starter && condition.text === token)) {
            break;
        }
        leadingTokens.add(token);
    }

    return conditions.filter((condition) => !(condition.starter && leadingTokens.has(condition.text)));
}

export function buildObjectCondition(state: RequirementSpecificCharacterPayload, index: number): ComboCondition | null {
    const name = state.object_name?.trim();
    if (!name) {
        return null;
    }

    const details: string[] = [];
    const required = numericValue(state.status_required);
    if (required !== null) {
        details.push(`needs ${required}`);
    } else if (isTruthy(state.status_required)) {
        details.push("active");
    }
    if (state.consumed) {
        details.push("consumed");
    }
    const relative = numericValue(state.added_relative);
    if (relative !== null) {
        details.push(`adds ${relative}`);
    }
    const absolute = numericValue(state.added_absolute);
    if (absolute !== null) {
        details.push(`ends at ${absolute}`);
    }

    const text = details.length > 0 ? `${name}: ${details.join(", ")}` : name;
    return {id: `object-${state.object_key ?? name}-${index}`, text, label: text, starter: false};
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
