import {COMBO_CONDITIONS, type ComboConditionKey} from "@/src/components/combos/requirements/comboConditions";
import type {ComboRequirementsPayload, ComboObjectStateDraft, RequirementObjectOption} from "@/src/types/combo";

export type RequirementToggleKey = ComboConditionKey;

export const requirementToggles: Array<{key: RequirementToggleKey; label: string; ariaLabel: string}> = COMBO_CONDITIONS.map(({key, text, label}) => ({key, label: text, ariaLabel: label}));

export const emptyRequirements: ComboRequirementsPayload = {
    counter_hit_required: false,
    punish_counter_required: false,
    perfect_parry_required: false,
    blocked_drive_impact_stun_required: false,
    corner_required: false,
    airborne_required: false,
    not_crouching_required: false,
    side_switches_required: false,
};

export function applyRequirementToggle(requirements: ComboRequirementsPayload, key: RequirementToggleKey, checked: boolean): ComboRequirementsPayload {
    const next = {...requirements, [key]: checked};

    if (checked && key === "counter_hit_required") {
        next.punish_counter_required = false;
        next.perfect_parry_required = false;
    }

    if (checked && (key === "punish_counter_required" || key === "perfect_parry_required")) {
        next.counter_hit_required = false;
    }

    if (checked && key === "perfect_parry_required") {
        next.punish_counter_required = true;
    }

    if (!checked && key === "punish_counter_required") {
        next.perfect_parry_required = false;
    }

    return next;
}

export function isRequirementToggleLocked(requirements: ComboRequirementsPayload, key: RequirementToggleKey): boolean {
    if (key === "counter_hit_required") {
        return Boolean(requirements.punish_counter_required);
    }

    if (key === "punish_counter_required") {
        return Boolean(requirements.counter_hit_required || requirements.perfect_parry_required);
    }

    return false;
}

function resolveSpecificStatusPayload(
    selectedRequirementObject: RequirementObjectOption | null,
    specificRequirementStatus: string,
): {value?: string | number | boolean; error?: string} {
    const statusRequiredRaw = specificRequirementStatus.trim();
    const selectedObjectIsBoolean = selectedRequirementObject?.status_type === "boolean";
    const selectedObjectIsInteger = selectedRequirementObject?.status_type === "integer";

    if (selectedObjectIsBoolean) {
        return {value: true};
    }

    if (selectedObjectIsInteger) {
        if (!/^[0-9]+$/.test(statusRequiredRaw)) {
            return {error: "This requirement needs a numeric status."};
        }

        const numericStatus = Number.parseInt(statusRequiredRaw, 10);
        const maxStatus = selectedRequirementObject?.max_status ?? null;

        if (numericStatus < 1 || (maxStatus !== null && numericStatus > maxStatus)) {
            return {error: `Status must be between 1 and ${maxStatus}.`};
        }

        return {value: numericStatus};
    }

    return {error: "Requirement status is invalid."};
}

function resolveObjectStateValue(option: RequirementObjectOption, value: string, fieldLabel: string): {value?: string | number | boolean; error?: string} {
    const rawValue = value.trim();
    if (option.status_type === "boolean") {
        return {value: true};
    }

    if (!/^[0-9]+$/.test(rawValue)) {
        return {error: `${option.name} ${fieldLabel} needs a numeric value.`};
    }

    const numericValue = Number.parseInt(rawValue, 10);
    if (numericValue < 1 || (option.max_status !== null && numericValue > option.max_status)) {
        return {error: `${option.name} ${fieldLabel} must be between 1 and ${option.max_status}.`};
    }

    return {value: numericValue};
}

export function buildRequirementsPayload(params: {
    requirements: ComboRequirementsPayload;
    specificRequirementObject: string;
    specificRequirementStatus: string;
    selectedRequirementObject: RequirementObjectOption | null;
    objectStates?: ComboObjectStateDraft[];
    requirementObjects?: RequirementObjectOption[];
}): {payload?: ComboRequirementsPayload; error?: string} {
    const {requirements, specificRequirementObject, specificRequirementStatus, selectedRequirementObject, objectStates = [], requirementObjects = []} = params;
    const objectName = specificRequirementObject.trim();
    const statusRequiredRaw = specificRequirementStatus.trim();
    const hasBooleanRequirement = requirementToggles.some(({key}) => Boolean(requirements[key]));
    const hasAnyObjectStateInput = objectName.length > 0 || statusRequiredRaw.length > 0 || objectStates.length > 0;

    if (statusRequiredRaw.length > 0 && !objectName) {
        return {error: "Select a requirement object before entering a status."};
    }

    if (objectName.length > 0 && !selectedRequirementObject) {
        return {error: "Invalid requirement object selected."};
    }

    if (!hasBooleanRequirement && !hasAnyObjectStateInput) {
        return {payload: undefined};
    }

    const optionsByKey = new Map(requirementObjects.map((candidate) => [candidate.object_key, candidate]));
    const comboObjectStates = [];
    for (const objectState of objectStates) {
        const option = optionsByKey.get(objectState.object_key) ?? null;
        if (!option) {
            return {error: "Invalid combo object selected."};
        }

        const nextState: NonNullable<ComboRequirementsPayload["combo_object_states"]>[number] = {
            object_key: option.object_key,
            character_name: option.character_name,
            object_name: option.name,
        };

        if (objectState.status_required.trim().length > 0 || option.status_type === "boolean" && objectState.status_required === "true") {
            const result = resolveObjectStateValue(option, objectState.status_required, "required status");
            if (result.error) {
                return {error: result.error};
            }
            nextState.status_required = result.value;
        }

        if (objectState.consumed) {
            if (!option.can_be_consumed) {
                return {error: `${option.name} cannot be consumed.`};
            }
            nextState.consumed = true;
        }

        if (objectState.added_relative.trim().length > 0 || option.status_type === "boolean" && objectState.added_relative === "true") {
            if (!option.can_be_added_relative) {
                return {error: `${option.name} cannot be added relatively.`};
            }
            const result = resolveObjectStateValue(option, objectState.added_relative, "relative add");
            if (result.error) {
                return {error: result.error};
            }
            nextState.added_relative = result.value;
        }

        if (objectState.added_absolute.trim().length > 0 || option.status_type === "boolean" && objectState.added_absolute === "true") {
            if (!option.can_be_added_absolute) {
                return {error: `${option.name} cannot be added absolutely.`};
            }
            if (nextState.added_relative !== undefined) {
                return {error: `${option.name} cannot have both relative and absolute added values.`};
            }
            const result = resolveObjectStateValue(option, objectState.added_absolute, "absolute add");
            if (result.error) {
                return {error: result.error};
            }
            nextState.added_absolute = result.value;
        }

        if (nextState.status_required !== undefined || nextState.consumed || nextState.added_relative !== undefined || nextState.added_absolute !== undefined) {
            comboObjectStates.push(nextState);
        }
    }

    if (objectName.length === 0) {
        return {
            payload: {
                ...emptyRequirements,
                ...requirements,
                combo_object_states: comboObjectStates.length > 0 ? comboObjectStates : undefined,
            },
        };
    }

    const specificStatusResult = resolveSpecificStatusPayload(selectedRequirementObject, specificRequirementStatus);
    if (specificStatusResult.error) {
        return {error: specificStatusResult.error};
    }

    return {
        payload: {
            ...emptyRequirements,
            ...requirements,
            requirement_specific_character: {
                object_key: selectedRequirementObject?.object_key,
                character_name: selectedRequirementObject?.character_name,
                object_name: selectedRequirementObject?.name ?? objectName,
                status_required: specificStatusResult.value as string | number | boolean,
            },
            combo_object_states: comboObjectStates.length > 0 ? comboObjectStates : undefined,
        },
    };
}
